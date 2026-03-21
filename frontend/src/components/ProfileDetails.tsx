interface DetailsProp {
  editMode: boolean;
  name: string;
  value: string;
  updateValue: (value: string) => void;
}
export default function ProfileDetails({
  editMode,
  name,
  value,
  updateValue,
}: DetailsProp) {
  return (
    <>
      {editMode === true ? (
        <>
          <span className="text-gray-600 font-semibold ">{name}</span>
          <input
            id={`${name.toLowerCase()}-input`}
            type="text"
            placeholder={name}
            className="input focus:border-transparent input-md"
            value={value}
            onChange={(e) => {
              if (e.target.value === "") {
                updateValue(value);
              }
              updateValue(e.target.value);
            }}
          />
        </>
      ) : (
        <>
          <h2 className="text-md font-semibold ">{name}</h2>
          <p className="text-left">{value}</p>
        </>
      )}
    </>
  );
}
