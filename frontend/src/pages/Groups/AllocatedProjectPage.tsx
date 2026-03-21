import Page from "../../components/Layout-Nav/Page";
import { ClientInfo, GroupInfo, ProjectInfo } from "../constants";
import {
  addGroupLinks,
  getGroupData,
  getProjectData,
  getUserData,
} from "../../apiUtil";
import { ChangeEvent, useEffect, useState } from "react";
import ContactBox from "../../components/Project/ContactBox";
import { useNavigate, useParams } from "react-router-dom";
import AddFunctionCard from "../../components/Group/AddFunctionCard";
import toast from "react-hot-toast";
import Shortcut from "../../components/Admin/Shortcut";

interface linkProps {
  name: string;
  url: string;
}

/**
 * This page displays the allocated project for a group.
 */
export default function AllocatedProjectPage() {
  const subcourseId = localStorage.getItem("subcourse") ?? "";
  const params = useParams();
  const groupId = params.groupId ?? "";

  const [groupData, setGroupData] = useState<GroupInfo>();
  const [project, setProject] = useState<ProjectInfo>();
  const [client, setClient] = useState<ClientInfo>();
  const [links, setLinks] = useState<linkProps[]>([]);
  const [link, setLink] = useState<linkProps>({ name: "", url: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";

    // Fetches all projects that are available in this subcourse
    setLoading(true);
    const fetchData = async () => {
      const groupInfo = await getGroupData(token, groupId);
      setGroupData(groupInfo.data);
      setLinks(groupInfo.data.links);

      const projectId = groupInfo.data.project ?? "";
      const res = await getProjectData(token, projectId);
      setProject(res.data);

      const clientId = res.data.clients[0] ?? "";
      const response = await getUserData(token, "client", clientId);
      setClient(response.data);
      setLoading(false);
    };

    try {
      fetchData();
    } catch {
      toast.error("Something went wrong fetching group information");
    }
  }, [groupId]);

  const handleModal = () => {
    const modal = document.getElementById(
      "my_modal_3",
    ) as HTMLDialogElement | null;
    if (modal) {
      modal.showModal();
    }
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLink((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to handle the addition of a new shortcut for group links
  const addingShortcut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const token = localStorage.getItem("token") ?? "";
    e.preventDefault();
    try {
      await addGroupLinks(token, groupId, {
        name: link.name,
        url: link.url,
      });
      setLinks((prev) => [...prev, { name: link.name, url: link.url }]);
    } catch (err) {
      console.log(err);
      toast.error("Link or name is not unique");
    }
    const modal = document.getElementById(
      "my_modal_3",
    ) as HTMLDialogElement | null;
    if (modal) {
      modal.close();
    }
  };

  return (
    <Page
      title={(project && project.name) || ""}
      back={true}
      backRoute={`/student/dashboard/${subcourseId}`}
    >
      {loading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-7 mt-10">
            <div className="card shadow-md w-90 h-max text-left gap-8 p-8">
              <div className="flex flex-col gap-4">
                <div className="text-lg">Main Client Contact</div>
                <ContactBox
                  name={(client && client.name) || ""}
                  id={(client && client.id) || ""}
                />
              </div>
              <div>
                <div className="text-lg">Best Method of Contact</div>
                <span>
                  <span
                    className=" p-0 btn btn-link text-black no-underline font-normal text-base text-md"
                    onClick={() => {
                      if (client?.email) {
                        window.location.href = `mailto:${client.email}`;
                      }
                    }}
                  >
                    Email
                  </span>
                  ,{" "}
                  <span
                    className="p-0 btn btn-link text-black no-underline font-normal text-base text-md"
                    onClick={() => navigate("/chat")}
                  >
                    Chat
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Shortcut
                title={"View Project Details"}
                icon="project"
                route={`/project/${groupData?.project}/view`}
              />
              <Shortcut title={"Chat"} icon="chat" route={"/chat"} />
              {links.map((link, index) => {
                return (
                  <Shortcut
                    key={index}
                    title={link.name}
                    icon={link.name}
                    link={link.url}
                  />
                );
              })}
              <AddFunctionCard name="Add Link" onClick={handleModal} />

              {/* Modal should be OUTSIDE of the clickable div */}
              <dialog id="my_modal_3" className="modal">
                <div className="modal-box w-100 p-8">
                  <div className="text-left text-lg mb-6">Add Links</div>
                  <fieldset className="text-left fieldset">
                    <legend className="block mt-6 text-[12px]">Name</legend>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Enter the link's name"
                      name="name"
                      value={link.name}
                      required
                      onChange={handleChange}
                    />
                  </fieldset>
                  <fieldset className="text-left fieldset mt-3">
                    <legend className="block mt-6 text-[12px]">Link</legend>
                    <input
                      type="text"
                      className="input w-full"
                      name="url"
                      placeholder="Enter the link"
                      value={link.url}
                      onChange={handleChange}
                      required
                    />
                  </fieldset>
                  <div className="flex flex-row justify-between mt-6">
                    <form method="dialog">
                      <button className="drk-btn drk-btn-hover">CANCEL</button>
                    </form>
                    <button
                      className="drk-btn drk-btn-hover"
                      onClick={addingShortcut}
                    >
                      ADD LINK
                    </button>
                  </div>
                </div>
              </dialog>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
