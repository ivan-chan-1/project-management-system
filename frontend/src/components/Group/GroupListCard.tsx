import { useEffect, useState } from "react";
import { GroupInfo, GroupMember } from "../../pages/constants";
import MemberBox from "./MemberBox";
import { getUserData, joinMember, removeMember } from "../../apiUtil";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

interface GroupListProps {
  group: GroupInfo;
  isMine: boolean;
  setIsMine: (isMine: boolean) => void;
  prefReleased: boolean;
}
export default function GroupListCard({
  group,
  isMine,
  setIsMine,
  prefReleased,
}: GroupListProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [project, setProject] = useState(false);
  const [tutorial, setTutorial] = useState("");
  const [user, setUser] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const members = group?.members ?? [];
    const thisUser = localStorage.getItem("user") || "";
    setUser(thisUser);

    const fetchMembers = async () => {
      try {
        const groupMembers = await Promise.all(
          members.map(async (m) => {
            return getUserData(token, "student", m).then((res) => res.data);
          }),
        );
        setMembers(groupMembers);
        setProject(group.project !== null);
        setTutorial(group.tutorial);
      } catch (err) {
        toast.error("Cannot load the information of members");
        console.log("Error while fetching member information: ", err);
      }
    };

    fetchMembers();
  }, [group.members, isMine, group.project, group.tutorial]);

  const handleLeaveGroup = async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const course = localStorage.getItem("subcourse") ?? "";
      await removeMember(token, group.id, course);
      setIsMine(false);
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      }
    }
  };

  const handleJoinGroup = async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const course = localStorage.getItem("subcourse") ?? "";
      await joinMember(token, { group_id: group.id, subcourse_id: course });
      setIsMine(true);
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      }
    }
  };

  return (
    <div className="relative w-1/3 flex flex-col text-left h-auto bg-white py-8 px-10 rounded-lg shadow-lg inset-shadow-2xs">
      <h2 className="text-xl font-bold mb-4">Members</h2>
      <div className="flex flex-col gap-4">
        {members
          ? members.map((m) => {
              return (
                <MemberBox
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  lead={group.lead}
                />
              );
            })
          : "No members yet"}
      </div>
      <div className="divider"></div>
      <h2 className="text-xl font-bold mb-4">Tutorial</h2>
      <p className="">{tutorial}</p>
      <div className="divider"></div>
      <h2 className="text-xl font-bold mb-4">Status</h2>
      <div className="flex flex-row flex-wrap gap-3">
        <div
          className={`w-fit bg-secondary rounded-2xl px-4 py-0.5 text-sm text-white font-bold
          ${members?.length === 6 ? "bg-success" : "bg-warning"}`}
        >
          {members?.length === 6 ? "FULL" : `${members?.length}/6`}
        </div>
        <div
          className={`w-fit bg-secondary rounded-2xl px-4 py-0.5 text-center text-sm text-white font-bold
          ${project === true ? "bg-success" : "bg-warning"}`}
        >
          {project === true ? "PROJECT ALLOCATED" : "PROJECT UNALLOCATED"}
        </div>
      </div>
      <div className="divider"></div>
      <div className="flex justify-center">
        {isMine && !prefReleased && (
          <button
            className="drk-btn drk-btn-hover border-0 !text-md !font-bold px-4 py-2 w-3/4"
            onClick={handleLeaveGroup}
          >
            LEAVE GROUP
          </button>
        )}

        {!isMine && members?.length !== 6 && user === "student" && (
          <button
            className="btn bg-success border-0 !text-white !text-md !font-bold px-4 py-2 w-3/4"
            onClick={handleJoinGroup}
          >
            JOIN GROUP
          </button>
        )}
      </div>
    </div>
  );
}
