import { useNavigate } from "react-router-dom";
import { ProjectPreferenceInfo } from "../../pages/constants";
import { useEffect, useState } from "react";
import { getIsLead, getIsPreferenceFormReleased } from "../../apiUtil";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

export default function GrpPreferenceCard({
  isDraft, // to toggle the update button
  preferences,
  isMine,
  groupId,
  lead,
}: {
  isDraft: boolean;
  preferences: ProjectPreferenceInfo[];
  isMine: boolean;
  groupId: string;
  lead?: string | null;
}) {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [isReleased, setIsReleased] = useState(false);
  const [isLead, setIsLead] = useState(false);

  useEffect(() => {
    const thisUser = localStorage.getItem("user") || "";
    const token = localStorage.getItem("token") || "";
    setUser(thisUser);
    const fetchIsReleased = async () => {
      try {
        const subcourse = localStorage.getItem("subcourse") || "";
        const released = await getIsPreferenceFormReleased(token, subcourse);
        setIsReleased(released.data);
      } catch (err) {
        console.log(
          "Error fetching whether preference form is released: ",
          err,
        );
      }
    };

    const fetchLead = async () => {
      try {
        const res = await getIsLead(token, groupId);
        setIsLead(res.data.lead);
      } catch (err) {
        if (isAxiosError(err)) {
          toast.error(err.response?.data["Error"]);
        }
      }
    };

    if (isMine && user === "student") {
      fetchIsReleased();
      fetchLead();
    }
  }, [isMine, user, groupId, lead]);

  return (
    <div className="flex flex-col gap-6 mt-5">
      <div className="flex flex-row justify-between">
        <h2 className="text-2xl">Project Preferences</h2>
        {/* make update button disable after submitting the form */}
        {isMine && user === "student" && isLead && isReleased && isDraft && (
          <button
            className="btn drk-btn text-white !text-md px-4 py-2 !font-bold"
            onClick={() => navigate(`/group/preference/${groupId}`)}
          >
            UPDATE
          </button>
        )}
      </div>
      <div className="w-full flex justify-center">
        {!isReleased && isMine && user === "student" ? (
          <div className="text-sm text-gray-500">
            Preferences are not released yet.
          </div>
        ) : preferences.length !== 0 ? (
          <div
            data-theme="mytheme"
            className="join join-vertical shadow-md w-full"
          >
            {preferences.map((p, index) => {
              return (
                <div
                  key={index}
                  className="collapse collapse-arrow join-item border-gray-200 border"
                >
                  <input type="radio" name="preference-accordion" />
                  <div className="collapse-title font-semibold">
                    Project {p.project.proj_no}: {p.project.name}
                  </div>
                  <div className="collapse-content text-sm">
                    <p className="line-clamp-3">{p.notes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            This group has not set preferences yet.
          </div>
        )}
      </div>
    </div>
  );
}
