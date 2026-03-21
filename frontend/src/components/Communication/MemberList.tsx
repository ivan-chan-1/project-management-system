import { useEffect, useState } from "react";
import { getAllChannelMembers } from "../../apiUtil";
import ChannelInfoCard from "./ChannelInfoCard";
import { ChannelMembers } from "../../pages/constants";
import { useNavigate } from "react-router-dom";

const MemberList = ({ channelId }: { channelId: string }) => {
  const [members, setMembers] = useState<ChannelMembers[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const priority: Record<string, number> = {
      "course admin": 0,
      tutor: 1,
      client: 2,
      student: 3,
    };

    const fetchMembers = async () => {
      const res = await getAllChannelMembers(token, channelId);
      const data: ChannelMembers[] = res.data;
      data.sort((a, b) => priority[a.id] - priority[b.id]);
      setMembers(data);
    };

    fetchMembers();
  }, [channelId]);

  const handleClick = (role: string, id: string) => {
    if (role === "course admin" || role === "tutor") {
      return;
    }

    navigate(`/${role}/profile/${id}`);
  };

  return (
    <ChannelInfoCard title="Channel Members">
      <div className="flex flex-col gap-3 text-left overflow-auto">
        {members.map((r) => {
          return (
            <div key={r.id}>
              {/* Role */}
              <div className="capitalize text-gray-700 mb-2">
                {r.id} - {r.members.length}
              </div>

              {/* List of members */}
              {r.members.map((m) => {
                return (
                  <div
                    className="flex flex-row items-center gap-3 p-2 hover:bg-gray-100 rounded-sm"
                    onClick={() => handleClick(r.id, m.id)}
                  >
                    {/* Profile Picture */}
                    <div className="avatar avatar-placeholder self-start">
                      <div className="bg-black text-white w-6 rounded-full">
                        <span className="text-md">{m.name[0]}</span>
                      </div>
                    </div>

                    {m.name}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </ChannelInfoCard>
  );
};

export default MemberList;
