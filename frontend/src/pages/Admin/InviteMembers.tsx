import { useState } from "react";
import AddMembersForm from "./AddMembersForm";
import { addStudentsToSubcourse, addTutorsToSubcourse } from "../../apiUtil";
import Papa from "papaparse";
import { RawCSVStudent } from "../constants";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

/**
 * This page allows admins to invite members (tutors and students)
 */
function InviteMembers() {
  const [file, setFile] = useState<File | null>(null);
  const [members, setMembers] = useState<string>("");
  const navigate = useNavigate();
  const params = useParams();
  const userType = params.user ?? "student";

  const submitMembers = async () => {
    const token = localStorage.getItem("token") ?? "";
    const subcourseId = localStorage.getItem("subcourse") ?? "";

    if (!subcourseId) {
      console.error("Subcourse ID not returned.");
      return;
    }

    // Add all the members from the file if provided
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<RawCSVStudent>) => {
          const parsedMembers = results.data.map((row) => ({
            firstName: row.name.split(" ")[0],
            lastName: row.name.split(" ").slice(1).join(" "),
            email: row.email,
            zid: row.zid,
            tutorial: row.tutorial,
          }));

          try {
            if (userType === "student") {
              await addStudentsToSubcourse(token, {
                students: parsedMembers,
                subcourse_id: subcourseId,
              });
            } else if (userType === "tutor") {
              await addTutorsToSubcourse(token, {
                tutors: parsedMembers,
                subcourse_id: subcourseId,
              });
            }

            navigate("/admin/allstudents");
          } catch (err) {
            console.error("CSV parsing error:", err);
          }
        },
      });
    } else {
      // if no file, parse the students from the manually entered list
      const membersArray = members
        .trim()
        .split("\n")
        .map((line) => {
          const [name, email, zid, tutorial] = line
            .split(",")
            .map((item) => item.trim());
          return {
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" "),
            email,
            zid,
            tutorial,
          };
        });
      try {
        if (userType === "student") {
          await addStudentsToSubcourse(token, {
            students: membersArray,
            subcourse_id: subcourseId,
          });
        } else if (userType === "tutors") {
          await addTutorsToSubcourse(token, {
            tutors: membersArray,
            subcourse_id: subcourseId,
          });
        }
        toast.success("Added successfully");
        navigate("/admin/allstudents");
      } catch (err) {
        console.error("Error adding students to subcourse: ", err);
      }
    }
  };

  return (
    <div className="min-w-screen flex justify-center h-auto">
      <div className="w-[70%]">
        <AddMembersForm
          handleNext={submitMembers}
          handleBack={() => navigate("/admin/allstudents")}
          file={file}
          setFile={setFile}
          members={members}
          setMembers={setMembers}
          mode={userType}
        />
      </div>
    </div>
  );
}

export default InviteMembers;
