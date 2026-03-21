interface DetailsProp {
  editMode: boolean;
  value: string;
  updateValue: (value: string) => void;
}
export default function CompanyInfoCard({
  editMode,
  value,
  updateValue,
}: DetailsProp) {
  return (
    <div className="bg-white px-10 py-8 inset-shadow-2xs min-h-3/5 rounded-lg shadow-md h-auto">
      <h2 className="text-2xl text-left mb-4">Company Details</h2>
      {editMode === false ? (
        <p className="whitespace-pre-line overflow-y-auto max-h-[21rem]">
          {value}
        </p>
      ) : (
        <textarea
          className="textarea w-full h-50 pb-2 resize-none overflow-y-auto text-wrap"
          placeholder="Company Details"
          value={value}
          onChange={(e) => updateValue(e.target.value)}
        ></textarea>
      )}
    </div>
  );
}
