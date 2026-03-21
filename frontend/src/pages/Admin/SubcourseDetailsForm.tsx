import { FormEvent, useEffect, useState } from "react";
import { existingSubcourse, getCodes, getTerms } from "../../apiUtil";
import toast from "react-hot-toast";
import { CourseCodeInfo, TermDatesInfo } from "../constants";
import { isAxiosError } from "axios";

export interface CourseDetailsFormProps {
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleNext: () => void;
  formInputs: {
    name: string;
    term: string;
    year: string;
    code: string;
  };
}

/**
 *This page allows admins to edit subcourse details
 *
 */
function SubcourseDetailsForm({
  handleChange,
  handleNext,
  formInputs,
}: CourseDetailsFormProps) {
  const [termOptions, setTermOptions] = useState<TermDatesInfo>({});
  const [codeOptions, setCodeOptions] = useState<CourseCodeInfo>({});
  const [selectedCourse, setSelectedCourse] = useState("");
  useEffect(() => {
    const fetchCourseCodes = async () => {
      try {
        const token = localStorage.getItem("token") ?? "";
        const codes = await getCodes(token);
        setCodeOptions(codes.data);
      } catch (error) {
        toast.error("Cannot load the course codes");
        console.error("Error fetching course codes: ", error);
      }
    };
    fetchCourseCodes();
  }, []);

  useEffect(() => {
    const fetchCourseTerms = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const courseCode = codeOptions[selectedCourse];
        if (!courseCode) return;
        const { data } = await getTerms(token, courseCode);
        setTermOptions(data);
      } catch (error) {
        console.error("Error fetching course terms:", error);
      }
    };
    if (selectedCourse !== "") {
      fetchCourseTerms();
    }
  }, [codeOptions, selectedCourse]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // check if year satisfies 4 digit number
    const yearReg = /^[0-9]{4}$/;
    if (!formInputs.year.match(yearReg)) {
      toast.error("Please enter a valid year");
      return;
    }

    const token = localStorage.getItem("token") || "";

    try {
      await existingSubcourse(token, {
        term: parseInt(formInputs.term),
        code: formInputs.code,
        year: parseInt(formInputs.year),
      });
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        if (err.response.status == 400) {
          toast.error(err.response.data["Error"]);
        } else {
          toast.error("Something went wrong");
        }
      }

      return;
    }

    handleNext();
  };

  return (
    <>
      <form
        className="w-full flex flex-col items-center"
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl mb-14 text-left">Course Details</h3>
        <div className="flex flex-col gap-14 w-[70%] mb-12">
          <div className="flex flex-col">
            <label htmlFor="name" className="mb-1 text-left text-[14px]">
              Course Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formInputs.name ? formInputs.name : ""}
              placeholder="i.e. COMP3900T2"
              className="border p-3 rounded border-secondary"
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col items-start">
            <label htmlFor="code" className="mb-1 text-left text-[14px]">
              Course Code
            </label>
            <div id="code" className="w-[50%]">
              <select
                name="code"
                defaultValue=""
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  handleChange(e);
                }}
                className="select w-full"
                required
              >
                <option value="" disabled>
                  Pick a code
                </option>
                {Object.keys(codeOptions).map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="year" className="mb-1 text-left text-[14px]">
              Year
            </label>
            <input
              id="year"
              type="text"
              name="year"
              value={formInputs.year || ""}
              placeholder="2025"
              className="border p-3 rounded border-secondary"
              onChange={handleChange}
              required
            />
          </div>
          {selectedCourse !== "" && (
            <div className="flex flex-col gap-4">
              <label htmlFor="term" className="mb-1 text-left text-[14px]">
                Offering Term/(s)
              </label>
              <div className="flex flex-wrap gap-x-40 gap-y-5">
                {Object.keys(termOptions).map((option: string) => (
                  <div key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      name="term"
                      value={option}
                      checked={formInputs.term === option}
                      onChange={handleChange}
                    />
                    <label className="text-[14px]">{`Term ${option} (${termOptions[option]})`}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 w-[70%]">
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg"
            type="submit"
          >
            NEXT
          </button>
        </div>
      </form>
    </>
  );
}

export default SubcourseDetailsForm;
