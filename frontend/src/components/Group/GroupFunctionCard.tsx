import FunctionCard from "./FunctionCard";
import groupIcon from "../../assets/groups.svg";
import heartIcon from "../../assets/heart.svg";
import chatIcon from "../../assets/clientChat.svg";
import editIcon from "../../assets/edit.svg";
import { useEffect, useState } from "react";
import {
  getGroupMembers,
  getWhoLead,
  updateBio,
  updateLead,
} from "../../apiUtil";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { GroupInfo, SubcourseInfo } from "../../pages/constants";

export default function GroupFunctionCard({
  curr,
  handler,
  groupId,
  course,
}: {
  handler: React.Dispatch<React.SetStateAction<GroupInfo>>;
  curr: { bio: string | null; goal: string | null; lead?: string | null };
  groupId: string;
  course: SubcourseInfo;
}) {
  const token = localStorage.getItem("token") ?? "";
  const user = localStorage.getItem("user") ?? "";
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [lead, setLead] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [assignRole, setAssignrole] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const fetchMembers = async () => {
      const res = await getGroupMembers(token, groupId);
      setMembers(res.data);
    };
    const fetchLead = async () => {
      if (course == undefined) {
        throw new Error("Data is undefined");
      }

      setAssignrole(course.preference_release || false);
      const res = await getWhoLead(token, groupId);
      setLead(res.data.lead);
    };
    fetchMembers();
    if (token && user) {
      fetchLead();
    }
  }, [groupId, user]);

  const handleSaveLead = async () => {
    try {
      await updateLead(token, groupId, { lead: lead });
      handler((prev) => {
        return { ...prev, lead };
      });
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      }
    }
  };

  const handleSaveBio = async () => {
    try {
      await updateBio(token, groupId, { bio, goal });
      handler((prev) => {
        return { ...prev, bio, goal };
      });
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      }
    }
  };

  const handleClick = async (type: string) => {
    if (type === "role") {
      handleSaveLead();
    } else {
      handleSaveBio();
    }
  };

  const closeDialog = (type: string) => {
    return (
      <div className="flex flex-row justify-between">
        <form method="dialog">
          <button className="lt-btn lt-btn-hover">CLOSE</button>
        </form>

        <form method="dialog">
          <button
            className="drk-btn drk-btn-hover"
            onClick={() => handleClick(type)}
          >
            SAVE
          </button>
        </form>
      </div>
    );
  };

  return (
    <>
      {/* Actions */}
      <div className="flex flex-row gap-5 h-auto">
        <FunctionCard
          name={"Assign Roles"}
          icon={groupIcon}
          modal={"assign-role-modal"}
          is_published={assignRole}
        />
        <FunctionCard
          name="Edit Bio & Goal"
          icon={editIcon}
          modal={"edit-bio-modal"}
        />
        <FunctionCard
          icon={heartIcon}
          name={"View Member Wishlists"}
          navi={`/group/wishlists/${groupId}`}
        />
        <FunctionCard
          icon={chatIcon}
          name={"Client Communication"}
          navi={"/chat"}
        />
      </div>
      {/* Assign Role Modal */}
      <dialog id="assign-role-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-medium text-lg">Select a group lead</h3>
          <p className="pt-4 text-sm">
            The group leader is the group's key point of contact and responsible
            for submitting the project preference form.
          </p>
          <select
            value={lead ?? "Select a group lead"}
            className="select my-8"
            onChange={(e) => setLead(e.target.value)}
          >
            <option disabled={true}>Select a group lead</option>
            {members.map((m) => {
              return (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              );
            })}
          </select>
          {closeDialog("role")}
        </div>
      </dialog>

      {/* Edit Bio and Goal Modal */}
      <dialog id="edit-bio-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-medium text-lg">Edit Bio and Goal</h3>

          <fieldset className="fieldset mt-8 mb-4">
            <legend className="fieldset-legend font-medium">Edit Bio</legend>
            <input
              type="text"
              className="input"
              placeholder="Type here"
              onChange={(e) => setBio(e.target.value)}
              defaultValue={curr.bio === null ? undefined : curr.bio}
            />
          </fieldset>
          <fieldset className="fieldset mb-10">
            <legend className="fieldset-legend font-medium">Edit Goal</legend>
            <input
              type="text"
              className="input"
              placeholder="Type here"
              onChange={(e) => setGoal(e.target.value)}
              defaultValue={curr.goal === null ? undefined : curr.goal}
            />
          </fieldset>
          {closeDialog("bio")}
        </div>
      </dialog>
    </>
  );
}
