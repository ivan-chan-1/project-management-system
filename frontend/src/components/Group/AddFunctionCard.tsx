import PlusIcon from "../../assets/plus.svg?react";

interface functionProps {
  name: string;
  onClick?: () => void;
}
export default function AddFunctionCard({ name, onClick }: functionProps) {
  return (
    <div
      className="flex flex-col border-2 border-dashed text-gray-400 border-gray-300 hover:text-black hover:border-black text-xs justify-center items-center p-6 w-40 h-40 rounded-lg shadow-sm mb-6"
      onClick={onClick}
    >
      <PlusIcon className="w-8" />
      <div className="mt-4">{name}</div>
    </div>
  );
}
