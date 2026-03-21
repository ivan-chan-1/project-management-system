import { useState } from "react";
import { FieldType, FormField } from "../../pages/constants";

interface FormCardProp {
  fields: FormField[];
  setSelectedFieldIndex: (i: number) => void;
  removeField: (i: number) => void;
  updateFieldLabel: (i: number, value: string) => void;
  updateFieldType: (i: number, type: FieldType) => void;
  addField: () => void;
  duplicateField: (index: number) => void;
  setFields: (fields: FormField[]) => void;
  handleUpdate: (value: FormField[]) => void;
}

const FormCard = ({
  handleUpdate,
  fields,
  setSelectedFieldIndex,
  removeField,
  updateFieldLabel,
  updateFieldType,
  addField,
  setFields,
  duplicateField,
}: FormCardProp) => {
  const menuLists = [
    { type: "text" as FieldType, name: "Text" },
    { type: "textarea" as FieldType, name: "Textarea" },
    { type: "radio" as FieldType, name: "Radio" },
    { type: "checkbox" as FieldType, name: "Checkbox" },
    { type: "number" as FieldType, name: "Number" },
    { type: "dropdown" as FieldType, name: "Dropdown" },
    { type: "select" as FieldType, name: "Select" },
  ];

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleFieldTypeChange = (index: number, type: FieldType) => {
    if (
      type === "radio" ||
      type === "checkbox" ||
      type === "select" ||
      type === "dropdown"
    ) {
      const allFields = fields.map((field, i) =>
        i === index
          ? {
              ...field,
              input_type: type,
              options: field.options || ["Option 1"],
            }
          : field,
      );
      setFields(allFields);
      handleUpdate(allFields);
    } else {
      updateFieldType(index, type);
    }
  };

  const updateFieldOption = (
    index: number,
    optionIndex: number,
    value: string,
  ) => {
    const allFields = fields.map((field, i) =>
      i === index
        ? {
            ...field,
            options: field.options?.map((opt, j) =>
              j === optionIndex ? value : opt,
            ),
          }
        : field,
    );
    setFields(allFields);
    handleUpdate(allFields);
  };

  const addFieldOption = (index: number) => {
    const allFields = fields.map((field, i) =>
      i === index
        ? {
            ...field,
            options: [
              ...(field.options || []),
              `Option ${(field.options?.length || 0) + 1}`,
            ],
          }
        : field,
    );
    setFields(allFields);
    handleUpdate(allFields);
  };

  const removeFieldOption = (index: number, optionIndex: number) => {
    const allFields = fields.map((field, i) =>
      i === index
        ? {
            ...field,
            options: field.options?.filter((_, j) => j !== optionIndex),
          }
        : field,
    );
    setFields(allFields);
    handleUpdate(allFields);
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (
      fields[index].default === true ||
      draggingIndex === null ||
      draggingIndex === index
    ) {
      return;
    }
    if (draggingIndex !== null && draggingIndex !== index) {
      const newFields = [...fields];
      const [draggedItem] = newFields.splice(draggingIndex, 1);
      newFields.splice(index, 0, draggedItem);
      setFields(newFields);
      handleUpdate(newFields);
      setDraggingIndex(index);
    }
  };

  const onDragEnd = () => {
    setDraggingIndex(null);
  };

  return (
    <div className=" p-4">
      <div className="space-y-4">
        {fields.map((field, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg transition-all ${
              draggingIndex === i && field.default === false
                ? "border-2 border-dashed border-blue-500 bg-blue-50"
                : "border border-gray-200"
            }`}
            onClick={() => setSelectedFieldIndex(i)}
            onDragOver={(e) => onDragOver(e, i)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  draggable={field.default !== true}
                  onDragStart={(e) => onDragStart(e, i)}
                  onDragEnd={onDragEnd}
                  className={`flex flex-row text-gray-500 hover:text-gray-700 ${
                    field.default !== true
                      ? "cursor-move"
                      : "cursor-not-allowed"
                  }`}
                  title={
                    field.default !== true
                      ? "Drag to reorder"
                      : "Cannot reorder"
                  }
                  key={field.id}
                  onDragOver={(e) => onDragOver(e, i)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="5" cy="6" r="1" />
                    <circle cx="5" cy="12" r="1" />
                    <circle cx="5" cy="18" r="1" />
                    <circle cx="11" cy="6" r="1" />
                    <circle cx="11" cy="12" r="1" />
                    <circle cx="11" cy="18" r="1" />
                  </svg>
                </div>
                <div className="flex-text-lg">
                  {i + 1} {field.label || ""}
                </div>
              </div>
              <div>
                <div className="tooltip tooltip-info" data-tip="duplicate">
                  {!field.default && (
                    <button
                      className="drk-btn drk-btn-hover btn-primary m-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateField(i);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="tooltip tooltip-error" data-tip="delete">
                  {!field.default && (
                    <button
                      className="red-btn drk-btn-hover btn-error m-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(i);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <input
                type="text"
                className="input input-bordered w-full mb-2"
                value={field.label || ""}
                placeholder="Enter your question here"
                onChange={(e) => updateFieldLabel(i, e.target.value)}
                disabled={field.default || false}
              />
              <select
                className="select mt-3 mb-2"
                value={field.input_type || ""}
                onChange={(e) =>
                  handleFieldTypeChange(i, e.target.value as FieldType)
                }
                disabled={field.default || false}
              >
                <option disabled value="">
                  Select Field
                </option>
                {menuLists.map((item, idx) => (
                  <option
                    key={idx}
                    value={item.type}
                    disabled={field.default || false}
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              <>
                {field.input_type === "text" && (
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Text Input"
                    disabled
                  />
                )}
                {field.input_type === "textarea" && (
                  <textarea
                    className="textarea textarea-bordered w-full text-wrap"
                    placeholder="Textarea"
                    disabled
                  />
                )}
                {field.input_type === "number" && (
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    placeholder="Number Input"
                    disabled
                  />
                )}
                {(field.input_type === "radio" ||
                  field.input_type === "checkbox" ||
                  field.input_type === "select" ||
                  field.input_type === "dropdown") && (
                  <div className="space-y-2 mt-4">
                    <label className="label">
                      <span className="label-text mr-4">Options</span>
                    </label>
                    {field.options?.map((option, index) => (
                      <div key={index} className="space-x-4 items-center gap-2">
                        {field.input_type === "radio" ? (
                          <input
                            type="radio"
                            className="radio radio-primary"
                            name={`radio-${i}`}
                            disabled
                          />
                        ) : field.input_type === "checkbox" ? (
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            disabled
                          />
                        ) : (
                          <span className="ml-2" />
                        )}
                        <input
                          type="text"
                          className="input input-bordered w-[50%]"
                          value={option}
                          onChange={(e) =>
                            updateFieldOption(i, index, e.target.value)
                          }
                          disabled={field.default || false}
                        />
                        <button
                          className="btn btn-circle btn-ghost hover:bg-secondary border-0 mb-1 ml-auto"
                          onClick={() => removeFieldOption(i, index)}
                          disabled={field.default || false}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {!field.default && (
                      <button
                        className="drk-btn drk-btn-hover mt-2"
                        onClick={() => addFieldOption(i)}
                      >
                        Add Option
                      </button>
                    )}
                  </div>
                )}
                {(field.input_type === "select" ||
                  field.input_type === "dropdown") && (
                  <select
                    className="select select-bordered w-full mt-2"
                    disabled
                    value={
                      typeof field.default === "string" ? field.default : ""
                    }
                  >
                    <option disabled value="">
                      Choose an option
                    </option>
                    {field.options?.map((option, idx) => (
                      <option
                        key={idx}
                        value={option}
                        disabled={field.default || false}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </>
            </div>
          </div>
        ))}
      </div>
      <button className="drk-btn drk-btn-hover mt-4" onClick={addField}>
        Add New Field
      </button>
    </div>
  );
};

export default FormCard;
