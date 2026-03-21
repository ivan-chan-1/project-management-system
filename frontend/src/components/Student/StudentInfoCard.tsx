import { useNavigate } from "react-router-dom";
import RightArrow from "../../assets/right.svg";
import { useEffect, useState } from "react";
import { GroupInfo } from "../../pages/constants";

export default function StudentInfoCard({
  groupData,
}: {
  groupData: GroupInfo;
}) {
  const navigate = useNavigate();
  const [groupStatus, setGroupStatus] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [projectStatus, setProjectStatus] = useState(true);
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    //TODO: change to be redux
    localStorage.setItem("groupData", JSON.stringify(groupData));

    setGroupStatus(groupData.id ? true : false);
    setGroupName(groupData.name ? groupData.name : "");
    setProjectStatus(groupData.project ? true : false);
    setGroupId(groupData.id ? groupData.id : "");
  }, [groupData]);

  const handleGroup = () => {
    if (groupStatus) {
      navigate(`/group/profile/${groupId}`);
    } else {
      navigate("/allGroups");
    }
  };

  const handleProject = () => {
    if (projectStatus) {
      navigate(`/group/${groupData.id}/${groupData.project}`);
    }
  };

  return (
    <>
      <div className="flex flex-row items-center rounded-md shadow-sm shadow-secondary w-1/2 h-full py-2 px-4">
        <p className="align-middle">
          {groupStatus ? `${groupName}` : "Find a group"}
        </p>
        <div
          className={`ml-auto mr-3 rounded-4xl w-fit pl-3 pr-3 text-align-center py-1 
          ${groupStatus === true ? "bg-success" : "bg-error"}`}
        >
          <p className="text-xs text-white font-bold">
            {groupStatus === true ? "IN A GROUP" : "NOT IN A GROUP"}
          </p>
        </div>
        <div
          id="group-button"
          className="w-10 btn btn-ghost btn-circle hover:bg-secondary border-0 p-2"
          onClick={handleGroup}
        >
          <img src={RightArrow} alt="back" className="w-full" />
        </div>
      </div>
      <div className="flex flex-row items-center rounded-md shadow-sm shadow-secondary w-1/2 h-full py-2 px-4">
        <p className="align-middle">My Project</p>
        <div
          className={`ml-auto mr-3 rounded-4xl w-fit pl-3 pr-3 text-align-center py-1 
          ${projectStatus === true ? "bg-success" : "bg-warning"}`}
        >
          <p className="text-xs text-white font-bold">
            {projectStatus === true ? "ALLOCATED" : "UNALLOCATED"}
          </p>
        </div>
        <div
          className="w-10 btn btn-ghost btn-circle hover:bg-secondary border-0 p-2"
          onClick={handleProject}
        >
          <img src={RightArrow} alt="back" className="w-full" />
        </div>
      </div>
    </>
  );
}
