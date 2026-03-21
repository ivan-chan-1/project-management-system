import { expDetails } from "../../pages/constants"; // Adjust path as needed

interface DetailsProp {
  editMode: boolean;
  value: expDetails[]; // Array of experiences
  updateValue: (updatedDetails: expDetails[]) => void;
}

export default function ExperienceCard({
  editMode,
  value,
  updateValue,
}: DetailsProp) {
  // Update handler for a specific experience (for edit mode)
  const handleUpdate = (
    index: number,
    field: keyof expDetails,
    newValue: string,
  ) => {
    const updatedExperiences = value.map((exp, i) =>
      i === index ? { ...exp, [field]: newValue } : exp,
    );
    updateValue(updatedExperiences);
  };

  const handleAddExperience = () => {
    updateValue([...value, { title: "", description: "" }]);
  };

  const handleDelete = (index: number) => {
    const allExperience = [...value];
    updateValue(allExperience.filter((e) => value.indexOf(e) !== index));
  };

  return (
    <div className="bg-white px-10 py-8 inset-shadow-2xs flex-3 rounded-lg shadow-md h-auto text-left overflow-y-auto">
      <h2 className="text-2xl text-left">My Experiences</h2>
      {editMode === false ? (
        <div className=" mb-2">
          {value.map((experience, index) => (
            <div key={index} className="collapse collapse-arrow join-item ">
              <input type="checkbox" name="exp" />
              <div className="collapse-title font-semibold">
                {index + 1} . {experience.title}
              </div>
              <div className="collapse-content text-sm">
                <p className="line-clamp-3">{experience.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 ">
          {value.map((experience, index) => (
            <div key={index} className="flex flex-col justify-right">
              <div
                className="btn btn-circle btn-ghost hover:bg-secondary border-0 mb-1 ml-auto"
                onClick={() => handleDelete(index)}
              >
                &#10005;
              </div>
              <input
                className="w-full mb-2 p-2 border rounded"
                placeholder="Enter title here"
                value={experience.title}
                onChange={(e) => handleUpdate(index, "title", e.target.value)}
              />
              <textarea
                className="textarea w-full h-auto pb-2 resize-none overflow-y-auto text-wrap"
                placeholder="Enter your experiences here"
                value={experience.description}
                onChange={(e) =>
                  handleUpdate(index, "description", e.target.value)
                }
              />
            </div>
          ))}
          <button
            className="drk drk-btn drk-btn-hover mt-3 mb-2"
            onClick={handleAddExperience}
          >
            Add More Experiences
          </button>
        </div>
      )}
    </div>
  );
}
