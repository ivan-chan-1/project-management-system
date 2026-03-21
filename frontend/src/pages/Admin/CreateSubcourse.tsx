import { useEffect, useState } from "react";
import Page from "../../components/Layout-Nav/Page";
import Stepper from "../../components/Stepper";
import SuccessForm from "../LoginRegister/SuccessForm";
import AddMembersForm from "./AddMembersForm";
import SubcourseDetailsForm from "./SubcourseDetailsForm";
import {
  addStudentsToSubcourse,
  addTutorsToSubcourse,
  createSubcourse,
} from "../../apiUtil";
import { FormattedStudent, RawCSVStudent } from "../constants";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

interface FormData {
  name: string;
  term: string;
  year: string;
  code: string;
}

function parseUserCSV(
  file: File,
  callback: (users: FormattedStudent[]) => void,
) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results: Papa.ParseResult<RawCSVStudent>) => {
      const users = results.data.map((row) => ({
        firstName: row.name.split(" ")[0],
        lastName: row.name.split(" ").slice(1).join(" "),
        email: row.email,
        zid: row.zid,
        tutorial: row.tutorial,
      }));
      callback(users);
    },
    error: function (err) {
      console.error("CSV parsing error:", err);
    },
  });
}

function parseUserText(text: string) {
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const [name, email, zid, tutorial] = line.split(",").map((x) => x.trim());
      return {
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" "),
        email,
        zid,
        tutorial,
      };
    });
}

/**
 * This allows administrators to create subcourse
 */
function CreateSubcourse() {
  const [current, setCurrent] = useState(1);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [tutorFile, setTutorFile] = useState<File | null>(null);
  const [students, setStudents] = useState<string>("");
  const [tutors, setTutors] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const steps = ["Course Details", "Add Students", "Add Tutors", "Submit"];
  const [formData, setFormData] = useState<FormData>({
    name: "",
    term: "",
    year: "",
    code: "",
  });

  const [success, setSuccess] = useState(true);
  const [message, setMessage] = useState("");

  const handleNext = () => {
    setCurrent((prevCurrent: number) => prevCurrent + 1);
  };
  const handleBack = () => {
    setCurrent((prevCurrent: number) => prevCurrent - 1);
  };

  const putSubcourse = async (token: string): Promise<string | undefined> => {
    try {
      const input = {
        name: formData.name,
        term: parseInt(formData.term),
        year: parseInt(formData.year),
        code: formData.code,
      };

      const res = await createSubcourse(token, input);
      return res.data.subcourse_id;
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        if (err.response.status == 500) {
          setMessage("Something went wrong when creating course");
        } else {
          setMessage(err.response.data["message"]);
        }
      }
      console.error("Error creating course: ", err);
      return undefined;
    }
  };

  useEffect(() => {
    const createSubcourseAndAddMembers = async () => {
      if (current === steps.length) {
        setLoading(true);
        const token = localStorage.getItem("token") ?? "";
        const subcourseId = await putSubcourse(token);

        if (!subcourseId) {
          setSuccess(false);
          setLoading(false);
          return;
        }
        // Add all the students from the file if provided
        if (studentFile) {
          try {
            const students: FormattedStudent[] = await new Promise(
              (resolve) => {
                parseUserCSV(studentFile, (students) => {
                  resolve(students);
                });
              },
            );

            await addStudentsToSubcourse(token, {
              students,
              subcourse_id: subcourseId,
            });
          } catch (err) {
            console.error("Failed to add students:", err);
            toast.error("Something went wrong while adding students.");
          }
        } else if (students !== "") {
          // if no file, parse the students from the manually entered list
          const studentsArray = parseUserText(students);

          try {
            await addStudentsToSubcourse(token, {
              students: studentsArray,
              subcourse_id: subcourseId,
            });
          } catch (err) {
            console.error("Failed to add students:", err);
            toast.error("Something went wrong while adding students.");
          }
        }

        // Add all the tutors from the file if provided
        if (tutorFile) {
          try {
            const tutors: FormattedStudent[] = await new Promise((resolve) => {
              parseUserCSV(tutorFile, (tutors) => {
                resolve(tutors);
              });
            });

            await addTutorsToSubcourse(token, {
              tutors: tutors,
              subcourse_id: subcourseId,
            });
          } catch (err) {
            console.error("Failed to add tutors:", err);
            toast.error("Something went wrong while adding tutors.");
          }
        } else if (tutors !== "") {
          // if no file, parse the tutors from the manually entered list
          const tutorsArray = parseUserText(tutors);

          try {
            await addTutorsToSubcourse(token, {
              tutors: tutorsArray,
              subcourse_id: subcourseId,
            });
          } catch (err) {
            console.error("Failed to add tutors:", err);
            toast.error("Something went wrong while adding tutors.");
          }
        }
        setLoading(false);
      }
    };

    createSubcourseAndAddMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (e.target.name === "code") {
      setFormData({ ...formData, term: "", [e.target.name]: e.target.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  return (
    <div>
      <Page title="Create New Subcourse" back={true} backRoute="/dash">
        <div className="flex justify-center mt-15">
          <div className="bg-white py-20 px-20 rounded-sm inset-shadow-xs shadow-lg w-full">
            <Stepper current={current} steps={steps} />
            {current === 1 ? (
              <SubcourseDetailsForm
                handleChange={handleChange}
                handleNext={handleNext}
                formInputs={formData}
              />
            ) : current === 2 ? (
              <AddMembersForm
                handleNext={handleNext}
                handleBack={handleBack}
                file={studentFile}
                setFile={setStudentFile}
                members={students}
                setMembers={setStudents}
                mode="student"
              />
            ) : current === 3 ? (
              <AddMembersForm
                handleNext={handleNext}
                handleBack={handleBack}
                file={tutorFile}
                setFile={setTutorFile}
                members={tutors}
                setMembers={setTutors}
                mode="tutor"
              />
            ) : loading ? (
              <span className="loading loading-spinner loading-lg"></span>
            ) : success ? (
              <SuccessForm
                text="GO TO DASHBOARD"
                message={"Your course has been successfully created"}
                location={`/dash`}
              />
            ) : (
              <SuccessForm
                error
                text="GO TO DASHBOARD"
                message={message}
                location={`/dash`}
              />
            )}
          </div>
        </div>
      </Page>
    </div>
  );
}

export default CreateSubcourse;
