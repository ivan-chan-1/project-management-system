interface StatusProp {
  value: string;
}
export default function StudentProfileStatus({ value }: StatusProp) {
  if (value === "N/A") {
    return <></>;
  }
  let style =
    "text-white py-1 px-4 w-fit text-center text-sm text-white font-bold rounded-full ";
  style += value === "Not in a group" ? "bg-red-500" : "bg-green-500";
  return (
    <>
      <span className="text-gray-800 font-semibold ">Status</span>
      <span className={style}>{value.toUpperCase()}</span>
    </>
  );
}
