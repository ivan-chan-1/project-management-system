import { useEffect, useState } from "react";
import { getSubcourseDetails, submitGroupTopicPreference } from "../../apiUtil";
import { FormField } from "../../pages/constants";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface SteppperProps {
  preferences: string[];
  handleNext: () => void;
  handleBack: () => void;
  groupId: string;
}

interface OptionProp {
  index: number;
  value: string;
}
export default function TopicPreference({
  preferences,
  handleNext,
  handleBack,
  groupId,
}: SteppperProps) {
  const [form, setForm] = useState<FormField[]>([]);
  const [options, setOptions] = useState<OptionProp[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const subcourse_id = localStorage.getItem("subcourse") ?? "";

    const getAllDetails = async () => {
      try {
        const res = await getSubcourseDetails(token, subcourse_id);
        const current = res.data;
        // Set the entire topic_preference_form array
        // filter the ones with options to set the index and value of those options fields
        // if the form has been already filled, set the previous values to the form
        const formValue = current.project_preference_form;
        const allOptions = formValue
          .filter((value: FormField) => value.options.length > 1)
          .map((value: FormField) => {
            return {
              index: current.project_preference_form.indexOf(value),
              value: "",
            };
          });
        if (preferences.length === formValue.length) {
          formValue.forEach(
            (field: FormField, index: number) =>
              (field.value = preferences[index]),
          );
          allOptions.forEach(
            (option: OptionProp) =>
              (option.value = formValue[option.index].value),
          );
        }
        setForm(formValue || []);
        setOptions(allOptions);
      } catch (error) {
        toast.error("Cannot load the previous answer");
        console.error("Error fetching data: ", error);
      }
    };
    getAllDetails();
  }, [preferences]);

  // for users to choose non-duplicate answers if there are identical options for questions.
  const handleChange = (index: number, value: string) => {
    const allOptions: OptionProp[] = options;
    allOptions.forEach((option) => {
      if (option.index === index) {
        option.value = value;
      }
    });
    setOptions(allOptions);

    setForm((prevForm) =>
      prevForm.map((field, i) => (i === index ? { ...field, value } : field)),
    );
  };

  // Submit Form button
  const submitButton = () => {
    return (
      <button
        className="drk-btn drk-btn-hover"
        onClick={(e) => {
          e.preventDefault();
          handleUpdate(false);
          handleNext();
        }}
      >
        SUBMIT
      </button>
    );
  };

  // Save and Exit button
  const saveButton = () => {
    return (
      <button
        className="lt-btn lt-btn-hover"
        onClick={(e) => {
          e.preventDefault();
          handleUpdate(true);
          navigate(`/group/profile/${groupId}`);
        }}
      >
        SAVE AND EXIT
      </button>
    );
  };

  const handleUpdate = async (isDraft: boolean) => {
    const token = localStorage.getItem("token") ?? "";
    await submitGroupTopicPreference(
      token,
      groupId,
      JSON.stringify({
        topic_preferences: form.map((field) => field.value),
        is_draft: isDraft,
      }),
    );
  };

  return (
    <div className="flex justify-center">
      <div className="card w-[65%] rounded-lg shadow-sm text-left p-8">
        {/* Section Header */}
        <h2 className="card-title font-medium mb-10">Topic Preferences</h2>

        {form.length === 0 ? (
          <p>No form data available</p>
        ) : (
          form.map((field, index) => {
            let allOpt = field.options;
            if (
              field.input_type === "select" ||
              field.input_type === "dropdown"
            ) {
              // filter all the option has chosen for the other questions which has the same value
              const allOptions = options
                .filter((option) => option.index !== index)
                .map((option) => option.value);
              allOpt = allOpt.filter((opt) => !allOptions.includes(opt));
            }
            return (
              <form
                key={field.id}
                className="rounded-lg mb-8 p-4 border-1 border-gray-200"
              >
                <div className="mb-2">
                  <label>{field.label}</label>
                </div>
                {field.input_type === "text" && (
                  <input
                    type="text"
                    className="input input-bordered w-[70%] rounded-lg mt-2"
                    placeholder="Your answer"
                    required
                    onChange={(e) => handleChange(index, e.target.value)}
                    value={field.value ?? ""}
                  />
                )}
                {field.input_type === "textarea" && (
                  <div>
                    <textarea
                      className="textarea textarea-bordered w-full rounded-lg mt-2"
                      placeholder="Your answer"
                      required
                      onChange={(e) => handleChange(index, e.target.value)}
                      value={field.value ?? ""}
                    />
                  </div>
                )}
                {field.input_type === "number" && (
                  <input
                    type="number"
                    className="input input-bordered w-[30%] rounded-lg"
                    placeholder="Number Input"
                    required
                    onChange={(e) => handleChange(index, e.target.value)}
                    value={field.value}
                  />
                )}
                {(field.input_type === "select" ||
                  field.input_type === "dropdown") && (
                  // already filter value when identical answer is chosen in one of the select options
                  <select
                    className="select select-bordered rounded-lg mt-2"
                    required
                    value={field.value ?? ""}
                    onChange={(e) => handleChange(index, e.target.value)}
                  >
                    <option disabled value="">
                      Choose an option
                    </option>
                    {allOpt.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </form>
            );
          })
        )}

        <div className="flex justify-between">
          <button className="lt-btn lt-btn-hover" onClick={handleBack}>
            BACK
          </button>
          <div className="flex flex-row gap-4">
            {saveButton()}
            {submitButton()}
          </div>
        </div>
      </div>
    </div>
  );
}
