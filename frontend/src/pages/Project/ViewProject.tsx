import Page from "../../components/Layout-Nav/Page";
import InfoBox from "../../components/Project/InfoBox";
import { ClientInfo, ProjectInfo } from "../constants";
import Unliked from "../../assets/heart.svg";
import Liked from "../../assets/filledHeart.svg";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  addToWishlist,
  getProjectData,
  getUserData,
  removeFromWishlist,
  getLike,
  adminApproveProject,
  adminUnapproveProject,
  adminRejectProject,
} from "../../apiUtil";
import ContactBox from "../../components/Project/ContactBox";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";

/**
 * This page allows the user to view a project. Loads all details of a project
 */
export default function ViewProject() {
  const params = useParams();
  const projectId = params.projId ?? "";
  const [project, setProject] = useState<ProjectInfo>({} as ProjectInfo);
  const [user, setUser] = useState("client");
  const [isLiked, setisLiked] = useState(false);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const foundUser = localStorage.getItem("user") ?? "";
        setUser(foundUser);
        const token = localStorage.getItem("token") ?? "";

        if (foundUser === "student") {
          const course = localStorage.getItem("subcourse") ?? "";
          const res = await getLike(token, course, projectId);
          setisLiked(res.data.liked);
        }

        const res = await getProjectData(token, projectId);
        const fetchedProject: ProjectInfo = res.data;
        setProject(fetchedProject);

        const clientDataList = await Promise.all(
          fetchedProject.clients.map(async (clientId: string) => {
            const response = await getUserData(token, "client", clientId);
            return response.data;
          }),
        );
        setClients(clientDataList);
      } catch (err) {
        toast.error("Error while loading the project information");
        console.error("Error fetching project data: ", err);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleToggleLike = async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const course = localStorage.getItem("subcourse") ?? "";
      if (isLiked) {
        await removeFromWishlist(token, projectId, course);
      } else {
        await addToWishlist(token, projectId, course);
      }
      setisLiked((prevState) => !prevState);
    } catch (err) {
      toast.error("Error occur while adding project to your wishlist");
      console.error("Error adding project to wishlist: ", err);
    }
  };
  const view = () => {
    return (
      <div className="flex flex-row justify-between pt-10 pb-16">
        <div className="flex flex-col space-y-8 w-8/13">
          <InfoBox
            title="Background"
            content={project?.background || "Unavailable"}
          />
          <InfoBox title="Scope" content={project?.scope || "Unavailable"} />
          <InfoBox
            title="Required Knowledge and Skill"
            content={project?.req_skills || "Unavailable"}
          />
          <InfoBox
            title="Outcomes"
            content={project?.outcomes || "Unavailable"}
          />
        </div>
        <div className="flex flex-col space-y-2 w-4/13 px-8 pt-7 h-auto text-left inset-shadow-sm shadow-lg">
          <h2 className="text-2xl text-left mb-4">Number of Groups</h2>
          <div className="text-left">
            <h2 className="text-2xl">{project?.capacity?.toString() || "0"}</h2>
            <p className="text-sm">Groups</p>
          </div>
          <div className="divider"></div>
          {user !== "student" && (
            <>
              <h2 className="text-2xl text-left mb-4">Offering Terms</h2>
              <div className="flex flex-row flex-wrap lg:flex-nowrap justify-between gap-3">
                <div
                  className={`p-3 text-sm font-bold 
              ${
                project?.terms?.includes(1)
                  ? "bg-[#1794FA] text-white"
                  : "bg-[#D9D9D9] text-black"
              }`}
                >
                  FEB-APR
                </div>
                <div
                  className={`p-3 text-sm font-bold 
              ${
                project?.terms?.includes(2)
                  ? "bg-[#1794FA] text-white"
                  : "bg-[#D9D9D9] text-black"
              }`}
                >
                  JUN-AUG
                </div>
                <div
                  className={`p-3 text-sm font-bold 
              ${
                project?.terms?.includes(3)
                  ? "bg-[#1794FA] text-white"
                  : "bg-[#D9D9D9] text-black"
              }`}
                >
                  SEP-DEC
                </div>
              </div>
              <div className="divider"></div>
            </>
          )}

          <h2 className="text-2xl text-left mb-4">Product Areas</h2>
          <div className="flex flex-row flex-wrap justify-start gap-3">
            {project?.areas?.map((area) => {
              return (
                <div
                  key={area}
                  className=" w-fit bg-[#D9D9D9] rounded-2xl px-4 py-0.5 text-sm"
                >
                  {area}
                </div>
              );
            })}
          </div>

          <div className="divider"></div>
          <h2 className="text-2xl text-left mb-4">Contacts</h2>
          <div className="flex flex-col">
            {clients.map((c: ClientInfo) => {
              return <ContactBox key={c.id} id={c.id} name={c.name} />;
            })}
          </div>
          <div className="divider"></div>
        </div>
      </div>
    );
  };

  const modified = () => {
    return (
      <div className="ml-auto gap-1">
        <div className="flex flex-row gap-4">
          {user === "student" && (
            <div
              className="btn btn-circle btn-ghost border-0 hover:bg-secondary p-1.5"
              onClick={() => handleToggleLike()}
            >
              <img src={isLiked ? Liked : Unliked} />
            </div>
          )}
          <div>
            <p className="text-right text-sm">
              Published: {project?.date_created}
            </p>
            <p className="text-right text-sm">
              Last Modified: {project?.date_modified}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleIsApproved = async (isVerified: boolean) => {
    const token = localStorage.getItem("token") || "";
    const subcourse = localStorage.getItem("subcourse") || "";
    if (isVerified) {
      try {
        await adminApproveProject(token, projectId, subcourse);
      } catch (err) {
        toast.error("Error occur while approving project");
        console.error("Error approving project: ", err);
      }
    } else {
      try {
        await adminRejectProject(token, projectId);
      } catch (err) {
        toast.error("Error occur while rejecting project");
        console.error("Error rejecting project: ", err);
      }
    }
  };

  const approveProject = () => {
    return (
      <div className="ml-auto gap-5">
        <div className="flex flex-row gap-8">
          <button
            className="btn btn-lg bg-success text-white border-0 h-12 !w-40 !font-bold"
            onClick={() => {
              const modal = document.getElementById(
                "true_modal",
              ) as HTMLDialogElement | null;
              modal?.showModal();
            }}
          >
            APPROVE
          </button>
          <ConfirmModal
            title="Approve Project"
            message="Would you like to approve this project?"
            confirm={true}
            confirmText="Approve"
            successMessage="Project approved successfully. The client will be notified of this change."
            onConfirm={handleIsApproved}
            onDone={() => navigate("/admin/project/approve")}
          />
          <button
            className="btn btn-lg bg-base-200 text-primary border-0 h-12 !w-40 !font-bold"
            onClick={() => {
              const modal = document.getElementById(
                "false_modal",
              ) as HTMLDialogElement | null;
              modal?.showModal();
            }}
          >
            REJECT
          </button>
          <ConfirmModal
            title="Reject Project"
            message="Would you like to reject this project? This will remove the project from your course."
            confirm={false}
            confirmText="Reject"
            successMessage="Project removed successfully. The client will be notified of this change."
            onConfirm={handleIsApproved}
            onDone={() => navigate("/admin/project/approve")}
          />
        </div>
      </div>
    );
  };

  const handleRemoveProject = async (remove: boolean) => {
    if (remove) {
      try {
        const token = localStorage.getItem("token") || "";
        const subcourse = localStorage.getItem("subcourse") || "";
        await adminUnapproveProject(token, projectId, subcourse);
      } catch (err) {
        toast.error("Error occurs while removing this project");
        console.error("Error removing project: ", err);
      }
    }
  };

  const removeProject = () => {
    return (
      <>
        <button
          className="lt-btn lt-btn-hover !text-sm !font-bold"
          onClick={() => {
            const modal = document.getElementById(
              "true_modal",
            ) as HTMLDialogElement | null;
            modal?.showModal();
          }}
        >
          REMOVE FROM THIS TERM
        </button>
        <ConfirmModal
          title="Remove Project"
          message="Would you like to remove this project from this term?"
          confirm={true}
          confirmText="Remove"
          successMessage="Project removed successfully. The client will be notified of this change."
          onConfirm={handleRemoveProject}
          onDone={() => navigate("/admin/allprojects")}
        />
      </>
    );
  };

  return (
    <Page
      title={project?.name || "Unavailable"}
      back={true}
      extraContent={
        user === "staff"
          ? project.status === "submitted"
            ? approveProject()
            : project.status === "available"
              ? removeProject()
              : modified()
          : modified()
      }
    >
      {view()}
    </Page>
  );
}
