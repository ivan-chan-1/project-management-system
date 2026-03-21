import { PropsWithChildren, useEffect, useState } from "react";
import FormCard from "../../components/Admin/FormCard";
import { FieldType, FormField } from "../constants";
import { createObjId } from "../../components/Admin/createObjId";
import toast from "react-hot-toast";

type TypeFields = {
  fields: FormField[];
};

type FormProps = {
  client: FormField[];
  project: FormField[];
  handleUpdate: (type: string, value: FormField[] | boolean) => void;
  defaultForms: {
    client: FormField[];
    project: FormField[];
  };
};

/**
 * This page allows admins to edit the forms
 */
const FormBuilderPage = (props: PropsWithChildren<FormProps>) => {
  const [type, setType] = useState("");
  const [form, setForm] = useState<{ [key: string]: TypeFields }>({
    "Client Questionnaire": {
      fields: [],
    },
    "Project Preference": {
      fields: [],
    },
  });

  const handleUpdate = (fields: FormField[]) => {
    const name =
      type === "Project Preference"
        ? "project_preference_form"
        : "client_questionnaire";
    props.handleUpdate(name, fields);
  };

  useEffect(() => {
    setForm((prev) => ({
      "Client Questionnaire": {
        ...prev["Client Questionnaire"],
        fields: props.client.map((form) => {
          const isDefault = props.defaultForms.client.find(
            (f) => f.id === form.id,
          );
          if (isDefault) {
            return {
              ...form,
              default: true,
            };
          }
          return {
            ...form,
          };
        }),
      },
      "Project Preference": {
        ...prev["Project Preference"],
        fields: props.project.map((form) => {
          const isDefault = props.defaultForms.project.find(
            (f) => f.id === form.id,
          );
          if (isDefault) {
            return {
              ...form,
              default: true,
            };
          }
          return {
            ...form,
          };
        }),
      },
    }));
  }, [props]);

  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(
    null,
  );

  const addField = () => {
    const newField = {
      id: createObjId(),
      label: "",
      input_type: "text" as FieldType,
      value: "",
      options: [""], // change to empty array for adding new field
    };
    const allFields = fields;
    allFields.push(newField);
    setFields(allFields);
    handleUpdate(allFields);
  };

  // Dulpicate the identical question so that no need to write it again
  const duplicateField = (index: number) => {
    const fieldToDuplicate = fields[index];
    const duplicatedField = {
      id: createObjId(), // new objId different from original question
      label: fieldToDuplicate.label,
      input_type: fieldToDuplicate.input_type,
      value: fieldToDuplicate.value,
      options: [...fieldToDuplicate.options],
    };
    setFields((prev) => [
      ...prev.slice(0, index + 1),
      duplicatedField,
      ...prev.slice(index + 1),
    ]);
    const allFields = [...fields.slice(0, index + 1)];
    allFields.push(duplicatedField);
    allFields.push(...fields.slice(index + 1));
    handleUpdate(allFields);
  };

  const removeField = (index: number) => {
    const allFields = fields.filter((_, i) => i !== index);
    handleUpdate(allFields);
    setFields(allFields);
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  };

  const updateFieldLabel = (index: number, value: string) => {
    const allFields = fields.map((field, i) =>
      i === index ? { ...field, label: value } : field,
    );
    setFields(allFields);
    handleUpdate(allFields);
  };

  const handleDefault = () => {
    props.handleUpdate("is_default", true);
    toast.success("Form saved. Make sure to save the entire course settings.");
    localStorage.setItem("form", JSON.stringify({ name: form, fields }));
  };

  const defaultButton = () => {
    return (
      <button className="drk-btn drk-btn-hover" onClick={handleDefault}>
        Save this form
      </button>
    );
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value);
    setFields(form[e.target.value].fields);
  };

  const updateFieldType = (index: number, newType: FieldType) => {
    const allFields = fields.map((field, i) =>
      i === index ? { ...field, input_type: newType } : field,
    );
    setFields(allFields);
    handleUpdate(allFields);
  };

  return (
    <div className="flex flex-col justify-start min-h-screen bg-white w-full p-0">
      <select className="select" value={type} onChange={handleSelect}>
        <option value="" disabled>
          Select Form
        </option>
        {Object.keys(form).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      {type !== "" && (
        <div>
          <div className="w-full text-left mt-6 mb-4">
            <div className="flex flex-row justify-between">
              <div className="flex flex-row space-x-4">
                <div>
                  <label className="label w-50 text-black">
                    <span className="label-text">Form Name</span>
                  </label>
                </div>
                <div>
                  <span>{type}</span>
                </div>
              </div>
              <div className=" gap-7">{defaultButton()}</div>
            </div>
          </div>
          <div className="border-1 border-gray-200 w-full text-left p-2">
            <FormCard
              handleUpdate={handleUpdate}
              fields={fields}
              setSelectedFieldIndex={setSelectedFieldIndex}
              removeField={removeField}
              updateFieldLabel={updateFieldLabel}
              updateFieldType={updateFieldType}
              addField={addField}
              duplicateField={duplicateField}
              setFields={setFields}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderPage;
