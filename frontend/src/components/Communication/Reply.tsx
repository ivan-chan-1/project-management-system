import { useEffect, useState } from "react";
import { formatDateTime } from "../../helper";
import { Creators, PostType } from "../../pages/constants";

const Reply = ({
  reply,
  creators,
}: {
  reply: PostType;
  creators: Creators | undefined;
}) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (creators === undefined) {
      return;
    }

    try {
      setName(creators[reply.creator].name);
    } catch {
      setName("");
    }
  }, [reply, creators]);

  return (
    <div className="border-x-1 border-b-1 border-gray-200 px-4 py-3 text-left flex flex-col gap-3">
      <div className="flex flex-row items-center gap-3">
        {/* Profile Picture */}
        <div className="avatar avatar-placeholder self-start">
          <div className="bg-black text-white w-6 rounded-full">
            <span className="text-md">{name[0]}</span>
          </div>
        </div>

        {/* Name */}
        <div className="text-[11px]">{name}</div>

        {/* Time Posted */}
        <div className="text-[11px] text-gray-500">
          {formatDateTime(reply.date_created)}
        </div>
      </div>
      <div className="flex flex-row gap-3">
        <div className="w-6 px-3"></div>
        <div className="text-sm">{reply.content}</div>
      </div>
    </div>
  );
};

export default Reply;
