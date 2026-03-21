import React from "react";
import MultiSelectDropdown from "../../components/MultiselectDropdown";
import { FormInputs, TermDatesInfo } from "../constants";

interface ProjectFormProps {
  mode: "create" | "edit";
  status: string;
  handleNext: () => void;
  formInputs: FormInputs[];
  setFormInputs: React.Dispatch<React.SetStateAction<FormInputs[]>>;
  handleDraft: () => void;
  termDates: TermDatesInfo;
}

/**
 * Project overview form for the project creation/editing process.
 */
function ProjectOverviewForm({
  mode,
  status,
  handleNext,
  formInputs,
  setFormInputs,
  handleDraft,
  termDates,
}: ProjectFormProps) {
  const handleCheckboxChange = (label: string, option: string) => {
    setFormInputs((prev: FormInputs[]) =>
      prev.map((input: FormInputs) =>
        input.label === label
          ? {
              ...input,
              value:
                Array.isArray(input.value) && input.value.includes(option)
                  ? input.value.filter((t: string) => t !== option)
                  : [...(input.value || []), option],
            }
          : input,
      ),
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormInputs((prev: FormInputs[]) =>
      prev.map((input: FormInputs) =>
        input.label === name ? { ...input, value } : input,
      ),
    );
  };

  return (
    <form
      className="px-10 py-10"
      onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }}
    >
      {formInputs.map((input: FormInputs) => (
        <div key={input.id} className="my-5">
          <label
            htmlFor={input.label}
            className="mb-1 text-left text-[14px] block"
          >
            {input.label}
          </label>

          {input.input_type === "text" && (
            <input
              type="text"
              id={input.label}
              name={input.label}
              value={input.value || ""}
              placeholder={input.label}
              className="input p-3 flex justify-start w-full md:w-1/3"
              onChange={handleInputChange}
              required
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            />
          )}

          {input.input_type === "checkbox" && input.options && (
            <div className="flex flex-wrap gap-x-40 gap-y-5">
              {input.options.map((option: string) => (
                <div key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name={input.label}
                    checked={input.value?.includes(option)}
                    onChange={() => handleCheckboxChange(input.label, option)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                  />
                  <label className="text-[14px]">
                    {input.label === "Offering Terms"
                      ? `Term ${option} (${termDates[option.toString()]})`
                      : option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {input.input_type === "textarea" && (
            <textarea
              id={input.label}
              name={input.label}
              value={input.value || ""}
              placeholder={input.label}
              className="input p-3 h-50 w-full text-wrap"
              onChange={handleInputChange}
              required
            />
          )}

          {input.input_type === "number" && (
            <div className="flex flex-col">
              <input
                type="number"
                id={input.label}
                name={input.label}
                value={input.value || ""}
                placeholder={input.label}
                className="input p-3 validator"
                onChange={handleInputChange}
                min={1}
                required
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
              <p className="validator-hint text-left hidden">
                Cannot have less than 1 group
              </p>
            </div>
          )}

          {input.input_type === "dropdown" && input.options && (
            <MultiSelectDropdown
              id={input.label}
              name={input.label}
              selectedOptions={Array.isArray(input.value) ? input.value : []}
              options={input.options}
              onChange={(selected) => {
                setFormInputs((prev: FormInputs[]) =>
                  prev.map((i: FormInputs) =>
                    i.id === input.id ? { ...i, value: selected } : i,
                  ),
                );
              }}
            />
          )}

          {input.input_type === "select" && input.options && (
            <select
              className="select flex justify-start"
              id={input.label}
              name={input.label}
              value={input.value || ""}
              onChange={handleInputChange}
              required
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            >
              <option value="" disabled>
                Pick your category
              </option>
              {input.options.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      {/* Buttons */}
      <div className="flex justify-end mt-6 w-full gap-5">
        {(mode === "create" || status === "draft") && (
          <button className="lt-btn" type="button" onClick={handleDraft}>
            SAVE DRAFT
          </button>
        )}
        <button className="drk-btn" type="submit">
          SUBMIT PROJECT
        </button>
      </div>
    </form>
  );
}

export default ProjectOverviewForm;
