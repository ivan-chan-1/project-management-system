import { useState } from "react";
import { termStructure } from "./CreateCourse";
import { termDates } from "../constants";
import toast from "react-hot-toast";

export interface CourseDetailsFormProps {
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleNext: () => void;
  formInputs: {
    name: string;
    termDates: termDates;
    description: string;
    code: string;
  };
}

/**
 * This page allows course administrators to edit
 * course details.
 */
function CourseDetailsForm({
  handleChange,
  handleNext,
  formInputs,
}: CourseDetailsFormProps) {
  const [structure, setStructure] = useState<string>("Pick a term structure");
  const codeReg = /^[A-Z]{4}[0-9]{4}$/;
  const dateRangeRegex = /^\d{2}-\d{2}-\d{4} to \d{2}-\d{2}-\d{4}$/;

  // Add more term variations here
  const termOptions: termStructure = { Semester: 2, Trimester: 3 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInputs.code.match(codeReg)) {
      toast.error("Your course code must be valid");
      return;
    }
    if (Object.keys(formInputs.termDates).length === 0) {
      toast.error("You must select at least one term");
      return;
    }
    const allDatesValid = Object.values(formInputs.termDates).every((val) =>
      dateRangeRegex.test(val),
    );
    if (!allDatesValid) {
      toast.error(
        `Your start and end dates must match "DD-MM-YYYY to DD-MM-YYYY" exactly`,
      );
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
            <label htmlFor="name" className="mb-2 text-left text-[14px]">
              Course Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formInputs.name ? formInputs.name : ""}
              placeholder="Course Name"
              className="input p-3"
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex text-left flex-col">
            <label htmlFor="name" className="mb-2 text-[14px]">
              Course Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formInputs.code ? formInputs.code : ""}
              placeholder="Course Code (e.g. COMP1234)"
              className="input p-3"
              onChange={handleChange}
              required
            />
            {formInputs.code.length > 0 && !formInputs.code.match(codeReg) && (
              <p className="text-red-500 text-sm">
                Course Code must be in valid format. E.g. COMP1234
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="termStructure"
              className="mb-2 text-left text-[14px]"
            >
              Term Structure
            </label>
            <select
              defaultValue="Pick a term structure"
              className="select"
              onChange={(e) => {
                setStructure(e.target.value);
                handleChange(e);
              }}
              name="structure"
            >
              <option disabled={true}>Pick a term structure</option>
              {Object.keys(termOptions).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {structure !== "Pick a term structure" && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="termStructure"
                className="mb-2 text-left text-[14px]"
              >
                Term Dates
              </label>
              {Array.from({ length: termOptions[structure] }).map((_, i) => {
                const termNum = i + 1;
                const isChecked = termNum in formInputs.termDates;

                return (
                  <div
                    key={termNum}
                    className="grid grid-cols-5 items-center gap-x-4 gap-y-1"
                  >
                    <input
                      type="checkbox"
                      name="termCheckbox"
                      data-tag={termNum}
                      className="checkbox col-span-1 justify-self-end"
                      checked={isChecked}
                      onChange={handleChange}
                    />
                    <label className="text-[14px] col-span-1">
                      {structure} {termNum} dates:
                    </label>
                    <input
                      type="text"
                      name="termDates"
                      data-tag={termNum}
                      className="input col-span-3"
                      placeholder="01-01-2025 to 31-12-2025"
                      value={formInputs.termDates[termNum] || ""}
                      onChange={handleChange}
                      disabled={!isChecked}
                    />
                    {formInputs.termDates[termNum] &&
                      !formInputs.termDates[termNum]?.match(dateRangeRegex) && (
                        <p className="text-red-500 text-sm col-start-3 col-span-2 text-left">
                          Must match "DD-MM-YYYY to DD-MM-YYYY" exactly
                        </p>
                      )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col">
            <label htmlFor="description" className="mb-2 text-left text-[14px]">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formInputs.description || ""}
              placeholder="Course description..."
              className="input p-3 h-50 w-full text-wrap"
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex justify-end mb-8 w-[70%]">
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg"
            type="submit"
          >
            SUBMIT
          </button>
        </div>
      </form>
    </>
  );
}

export default CourseDetailsForm;
