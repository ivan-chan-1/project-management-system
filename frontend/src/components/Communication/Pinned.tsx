import { useEffect, useState } from "react";
import { getAllPinned, getCreators } from "../../apiUtil";
import { Creators, PostType } from "../../pages/constants";
import ChannelInfoCard from "./ChannelInfoCard";
import { formatDate } from "../../helper";

const Pinned = ({ channelId }: { channelId: string }) => {
  const [pinned, setPinned] = useState<PostType[]>([]);
  const [creators, setCreators] = useState<Creators>();

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const fetchPinned = async () => {
      const res = await getAllPinned(token, channelId);
      setPinned(res.data);
    };

    const fetchCreators = async () => {
      const res = await getCreators(token, channelId);
      setCreators(res.data);
    };

    fetchPinned();
    fetchCreators();
  }, [channelId]);

  return (
    <ChannelInfoCard title="Pinned Posts">
      <div className="flex flex-col gap-3 overflow-auto">
        {pinned.map((p) => {
          return (
            <div
              className="border-1 border-gray-200 rounded-sm text-left flex flex-col gap-2 p-3"
              key={p.id}
            >
              <div className="flex flex-row items-center gap-3">
                {/* Profile Picture */}
                <div className="avatar avatar-placeholder self-start">
                  <div className="bg-black text-white w-6 rounded-full">
                    <span className="text-md">
                      {creators && creators[p.creator].name[0]}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="text-[11px]">
                  {creators && creators[p.creator].name}
                </div>

                {/* Time Posted */}
                <div className="text-[11px] text-gray-500">
                  {formatDate(p.date_created)}
                </div>
              </div>
              <div className="flex flex-row gap-3">
                <div className="w-6 px-3"></div>
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-sm">{p.content}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChannelInfoCard>
  );
};

export default Pinned;
