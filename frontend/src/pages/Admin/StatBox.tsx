import { Statistic } from "../constants";

export default function StatBox({ title, value }: Statistic) {
  return (
    <div className="w-50 h-40 inset-shadow-2xs shadow-md flex flex-col justify-center gap-4">
      <h2 className="text-4xl">{value}</h2>
      <p>{title}</p>
    </div>
  );
}
