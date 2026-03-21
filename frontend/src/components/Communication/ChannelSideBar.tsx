import { useEffect, useState } from "react";
import PlusIcon from "../../assets/plus.svg?react";
import ChannelList from "./ChannelList";
import {
  AllClients,
  ChannelListType,
  ProjectGroupInfo,
} from "../../pages/constants";
import { Socket } from "socket.io-client";
import {
  createChannel,
  getAllClients,
  getAllSubcourseProjects,
} from "../../apiUtil";
import toast from "react-hot-toast";

/***
 * A component that displays all channels related to the user
 */
const ChannelSideBar = ({
  admin,
  channels,
  socket,
  viewHandler,
  addHandler,
}: {
  admin: boolean;
  channels: ChannelListType[];
  socket: Socket | undefined;
  viewHandler: React.Dispatch<React.SetStateAction<string>>;
  addHandler: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [active, setActive] = useState("");

  // Data
  const [allProjects, setAllProjects] = useState<ProjectGroupInfo[]>([]);
  const [allClients, setAllClients] = useState<AllClients[]>([]);

  // Responses
  const [category, setCategory] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectGroupInfo>();
  const [client, setClient] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);

  const handleClick = (id: string) => {
    if (active !== "") {
      socket?.emit("leave", active);
    }

    socket?.emit("join", id);
    setActive(id);
    viewHandler(id);
  };

  const handleProject = (id: string) => {
    setProject(allProjects.find((p) => p.id === id));
  };

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const subcourse = localStorage.getItem("subcourse") ?? "";
    const user = localStorage.getItem("user") ?? "";
    if (user !== "staff") {
      return;
    }

    const fetchProjects = async () => {
      const res = await getAllSubcourseProjects(token, subcourse);
      setAllProjects(res.data);
    };

    const fetchClients = async () => {
      const res = await getAllClients(token, subcourse);
      setAllClients(res.data);
    };

    fetchProjects();
    fetchClients();
  }, []);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token") ?? "";
    const subcourse = localStorage.getItem("subcourse") ?? "";

    const data = {
      channel_type: type,
      name,
      category,
      project: project === undefined ? null : project.id,
      client,
      group,
    };

    await toast.promise(createChannel(token, subcourse, data), {
      loading: "Creating channel",
      error: "Error creating channels",
      success: "Created channel successfully",
    });

    handleReset();
    addHandler((prev) => !prev);
  };

  const handleReset = () => {
    setCategory(null);
    setType(null);
    setName(null);
    setProject(undefined);
    setClient(null);
    setGroup(null);
  };

  return (
    <div className="h-screen flex flex-col justify-center">
      <div className="card bg-base-100 shadow-sm my-4 h-full">
        <div className="card-body p-5 w-90 h-full flex flex-col">
          {/* Header */}
          <div className="flex flex-row justify-between mb-8 items-center">
            <div className="text-xl">Channels</div>
            {admin && (
              <button
                className="btn circle btn-circle btn-ghost icon-hover w-8 h-8"
                onClick={() =>
                  document &&
                  (
                    document.getElementById(
                      "channel-create-modal",
                    ) as HTMLFormElement
                  ).showModal()
                }
              >
                <PlusIcon className="w-5" />
              </button>
            )}
          </div>

          {/* Channel Lists */}
          <div className="flex flex-col gap-8 overflow-auto grow">
            {channels.map((c, i) => {
              return (
                <ChannelList
                  category={c.category}
                  channels={c.channels}
                  active={active}
                  handler={handleClick}
                  key={i}
                />
              );
            })}
          </div>

          {/* Channel Create Modal */}
          <dialog id="channel-create-modal" className="modal">
            <div className="modal-box text-left flex flex-col gap-8 px-8">
              <h3 className="text-lg">Create Channel</h3>

              <div className="flex flex-col gap-3 w-full">
                <fieldset className="fieldset w-full">
                  <legend className="fieldset-legend font-normal pt-0">
                    Category
                  </legend>
                  <select
                    value={category || "Pick a category"}
                    className="select w-full"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option disabled={true}>Pick a category</option>
                    <option value="course">Course</option>
                    <option value="project">Project</option>
                    <option value="client">Client</option>
                  </select>
                </fieldset>

                {category !== null && category !== "client" && (
                  <fieldset className="fieldset w-full">
                    <legend className="fieldset-legend font-normal pt-0">
                      Type
                    </legend>
                    <select
                      defaultValue="Pick a channel type"
                      className="select w-full"
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option disabled={true}>Pick a channel type</option>
                      <option value="announcement">Announcement</option>
                      <option value="forum">Forum</option>
                      <option value="text">Text</option>
                    </select>
                  </fieldset>
                )}

                {category === "project" && (
                  <div className="flex flex-col gap-2">
                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend font-normal pt-0">
                        Project
                      </legend>
                      <select
                        defaultValue="Pick a project"
                        className="select w-full"
                        onChange={(e) => handleProject(e.target.value)}
                      >
                        <option disabled={true}>Pick a project</option>
                        {allProjects.map((p) => {
                          return <option value={p.id}>{p.name}</option>;
                        })}
                      </select>
                    </fieldset>

                    {type === "text" && (
                      <fieldset className="fieldset w-full">
                        <legend className="fieldset-legend font-normal pt-0">
                          Members
                        </legend>
                        <select
                          defaultValue="Pick a group"
                          className="select w-full"
                          onChange={(e) => setGroup(e.target.value)}
                          disabled={project === undefined}
                        >
                          <option disabled={true}>Pick a group</option>
                          {project &&
                            project.groups.map((g) => {
                              return (
                                <option value={g.id}>
                                  Members of {g.name}
                                </option>
                              );
                            })}
                        </select>
                      </fieldset>
                    )}
                  </div>
                )}

                {category !== null && category !== "client" && (
                  <fieldset className="fieldset w-full">
                    <legend className="fieldset-legend font-normal pt-0">
                      Channel Name
                    </legend>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Channel name"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </fieldset>
                )}

                {category === "client" && (
                  <fieldset className="fieldset w-full">
                    <legend className="fieldset-legend font-normal pt-0">
                      Client
                    </legend>
                    <select
                      defaultValue="Pick a client"
                      className="select w-full"
                      onChange={(e) => setClient(e.target.value)}
                    >
                      <option disabled={true}>Pick a client</option>
                      {allClients.map((c) => {
                        return <option value={c.id}>{c.name}</option>;
                      })}
                    </select>
                  </fieldset>
                )}
              </div>

              <div className="flex flex-row justify-between">
                <form method="dialog">
                  <button className="lt-btn lt-btn-hover" onClick={handleReset}>
                    CLOSE
                  </button>
                </form>
                <form method="dialog">
                  <button
                    className="drk-btn drk-btn-hover"
                    onClick={handleSubmit}
                  >
                    CREATE
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        </div>
      </div>
    </div>
  );
};

export default ChannelSideBar;
