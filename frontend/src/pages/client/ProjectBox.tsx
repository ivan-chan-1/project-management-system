import ViewIcon from "../../assets/view.svg";
import EditIcon from "../../assets/edit.svg";
import GroupIcon from "../../assets/groups.svg";
import DeleteIcon from "../../assets/delete.svg";
import { useNavigate } from "react-router-dom";
import { ProjectProps } from "../constants";
import { deleteProject } from "../../apiUtil";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

type projBtn = {
  name: string;
  icon: string;
  fn: (...args: unknown[]) => unknown;
};

/**
 * Shows the projects for a client on the Project List page.
 */
export default function ProjectBox({
  projId,
  projNum,
  projName,
  projStatus,
  lastModified,
  numInterested,
}: ProjectProps) {
  const navigate = useNavigate();
  const handleView = () => {
    navigate(`/project/${projId}/view`);
  };

  const handleEdit = () => {
    navigate(`/client/${projId}/edit`);
  };

  const handleGroups = () => {
    navigate(`/chat`);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      await deleteProject(token, projId);
      toast.success("Project deleted successfully.");
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      }
    }
  };

  const buttons: projBtn[] = [
    {
      name: "View",
      icon: ViewIcon,
      fn: () => handleView(),
    },
    {
      name: "Edit",
      icon: EditIcon,
      fn: () => handleEdit(),
    },
    {
      name: "Groups",
      icon: GroupIcon,
      fn: () => handleGroups(),
    },
    {
      name: "Delete",
      icon: DeleteIcon,
      fn: () =>
        (
          document.getElementById(`true_${projId}_modal`) as HTMLDialogElement
        )?.showModal(),
    },
  ];

  const statusColors: Record<string, string> = {
    available: "bg-[#69D965]",
    unavailable: "bg-[#F6C343]",
    submitted: "bg-[#17A1FA]",
    draft: "bg-[#D9D9D9]",
  };

  return (
    <>
      <dialog id={`true_${projId}_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-left">Delete this project</h3>
          <p className="py-4 text-left">
            Are you sure you want to delete P{projNum}: {projName}?
          </p>
          <div className="modal-action !mt-0">
            <form method="dialog">
              <button
                className="btn bg-primary border-0 outline-0 text-white mr-2"
                onClick={() => handleDelete()}
              >
                Delete
              </button>
              <button className="btn bg-secondary border-0 outline-0">
                Cancel
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <div className="flex pt-15">
        <div className="flex flex-col space-y-5 mr-4">
          <h2 className="text-2xl text-wrap text-left">
            Project {projNum}: {projName}
          </h2>
          <div
            className={`rounded-4xl w-fit pl-3 pr-3 text-align-center py-1
              ${statusColors[projStatus] || "bg-pink-400"}
              `}
          >
            <p className="text-xs text-white font-bold">
              {projStatus === "submitted"
                ? "AWAITING APPROVAL"
                : projStatus.toUpperCase()}
            </p>
          </div>
          <div className="flex space-x-16 text-md">
            <p className="text-left">Last Modified: {lastModified}</p>
            {numInterested && (
              <p className="text-left">Interested Groups: {numInterested}</p>
            )}
          </div>
        </div>
        <div className="ml-auto flex flex-col space-y-2 justify-evenly">
          {buttons.map((btn) =>
            btn.name === "Groups" && projStatus === "available" ? (
              <button
                key={btn.name}
                className="btn btn-outline btn-xs hover:!bg-secondary flex justify-evenly space-x-2 "
                onClick={btn.fn}
              >
                <img src={btn.icon} className="w-5" />
                {btn.name}
              </button>
            ) : btn.name === "Delete" &&
              (projStatus === "draft" || projStatus === "submitted") ? (
              <button
                key={btn.name}
                className="btn btn-outline btn-xs flex justify-evenly space-x-2 hover:!bg-secondary hover:border-black"
                onClick={btn.fn}
              >
                <img src={btn.icon} className="w-5" />
                {btn.name}
              </button>
            ) : btn.name !== "Groups" && btn.name !== "Delete" ? (
              <button
                key={btn.name}
                className="btn btn-outline btn-xs flex justify-evenly space-x-2 hover:!bg-secondary hover:border-black"
                onClick={btn.fn}
              >
                <img src={btn.icon} className="w-5" />
                {btn.name}
              </button>
            ) : null,
          )}
        </div>
      </div>
      <div className="divider mb-0"></div>
    </>
  );
}
