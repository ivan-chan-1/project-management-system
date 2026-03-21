import { useState } from "react";
import PlaneIcon from "../../assets/plane.svg?react";
import PlaneSolidIcon from "../../assets/planeSolid.svg?react";
// import PlusIcon from "../../assets/plus.svg?react";
import { Socket } from "socket.io-client";

/***
 * A compact component used to create a reply with a message body
 */
const CompactMessageComposer = ({
  post,
  socket,
  channel,
}: {
  post: string;
  socket: Socket | undefined;
  channel: string;
}) => {
  const [body, setBody] = useState<string>("");
  const [solid, setSolid] = useState<boolean>(false);

  const handleBody = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBody(e.target.value);
    setSolid(e.target.value !== "");
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
      setSolid(false);
    }
  };

  const handleSubmit = () => {
    if (!body) {
      return;
    }

    const payload = {
      title: null,
      creator: localStorage.getItem("id") ?? "",
      content: body,
      date_created: new Date().toISOString(),
      category: null,
    };

    socket?.emit("reply", channel, post, payload);
    setBody("");
  };

  return (
    <div className="px-3 py-2 text-sm border-1 rounded-sm w-full border-gray-200 flex flex-row justify-between gap-3">
      {/* <PlusIcon className="w-5 icon-hover" /> */}
      <input
        type="text"
        placeholder="Reply"
        className="focus:outline-none grow"
        onChange={handleBody}
        value={body}
        onKeyDown={handleKeyUp}
      />
      <div
        onClick={handleSubmit}
        onMouseEnter={() => setSolid(true)}
        onMouseLeave={() => setSolid(body !== "")}
      >
        {!solid && <PlaneIcon className="w-5 stroke-[#1794FA]" />}
        {solid && <PlaneSolidIcon className="w-5 fill-[#1794FA]" />}
      </div>
    </div>
  );
};

export default CompactMessageComposer;
