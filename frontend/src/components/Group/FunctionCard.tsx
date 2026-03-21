import { useNavigate } from "react-router-dom";
interface functionProps {
  icon: string;
  name: string;
  navi?: string;
  modal?: string;
  is_published?: boolean;
}
export default function FunctionCard({
  icon,
  name,
  navi,
  modal,
  is_published,
}: functionProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (navi !== undefined) {
      navigate(navi, { replace: true });
    } else if (modal !== undefined && document !== null) {
      const dialog = document.getElementById(modal) as HTMLDialogElement | null;
      dialog?.showModal();
    }
  };

  return (
    <div
      className={`btn flex flex-col border-0 justify-center items-center bg-white w-40 h-40 rounded-lg inset-shadow-2xs shadow-md mb-6 text-sm ${
        is_published ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={is_published ? undefined : handleClick}
      tabIndex={is_published ? -1 : 0}
      onKeyDown={(e) => {
        if (!is_published && (e.key === "Enter" || e.key === " ")) {
          handleClick();
        }
      }}
      aria-disabled={is_published}
    >
      <img src={icon} className="w-10" />
      {name}
    </div>
  );
}
