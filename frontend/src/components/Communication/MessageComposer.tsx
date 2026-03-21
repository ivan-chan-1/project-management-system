import CrossIcon from "../../assets/xmark.svg?react";
// import PhotoIcon from "../../assets/photo.svg?react";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getUserData } from "../../apiUtil";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

/***
 * A component used to create a post, with a title, message body and category
 *
 * @param {boolean} category Indicates if to include categories selector
 */
const MessageComposer = ({
  channel,
  hasCategory,
  handler,
  socket,
}: {
  channel: string;
  hasCategory: boolean;
  handler: React.Dispatch<React.SetStateAction<boolean>>;
  socket: Socket | undefined;
}) => {
  const [body, setBody] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string | null>(null);
  const [user, setUser] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token") ?? "";
      const user = localStorage.getItem("user") ?? "";
      const id = localStorage.getItem("id") ?? "";
      const res = await getUserData(token, user, id);
      setUser(res.data.name);
    };

    try {
      fetchUser();
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        toast.error("Something went wrong getting user details");
      }
    }
  }, []);

  const handleBody = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
  };

  const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  const handleSubmit = () => {
    if (!body) {
      return;
    }

    if (hasCategory && category === null) {
      return;
    }

    if (socket === undefined) return;

    const payload = {
      title,
      creator: localStorage.getItem("id") ?? "",
      content: body,
      date_created: new Date().toISOString(),
      category,
    };

    socket.emit("post", channel, payload);
    setBody("");
    handler(false);
  };

  return (
    <div className="border-1 border-gray-200 rounded-sm p-4 text-left flex flex-col gap-3">
      {/* User Information */}
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-3 items-center">
          <div className="avatar avatar-placeholder">
            <div className="bg-black text-white w-8 rounded-full">
              <span className="text-lg">{user[0] ?? ""}</span>
            </div>
          </div>

          <div className="text-sm">{user}</div>
        </div>
        <CrossIcon
          className="w-6 icon-hover content-end"
          onClick={() => handler(false)}
        />
      </div>

      {/* Input Fields */}
      <input
        type="text"
        placeholder="Add a subject"
        className="border-b-1 border-gray-200 pb-3 px-2 focus:outline-none focus:border-black w-full"
        onChange={handleTitle}
      />
      {hasCategory && (
        <div className="flex flex-row gap-3 items-center">
          <select
            defaultValue="Pick a category"
            className="select"
            onChange={handleCategory}
          >
            <option disabled={true}>Pick a category</option>
            <option>General</option>
            <option>Lectures</option>
            <option>Workshops</option>
            <option>Labs</option>
            <option>Assessments</option>
          </select>
        </div>
      )}
      <textarea
        className="textarea focus:outline-none w-full text-wrap"
        placeholder="Type a message"
        onChange={handleBody}
      />

      {/* Actions */}
      <div className="flex flex-row justify-end items-center">
        {/* <PhotoIcon className="w-6 h-6 icon-hover" /> */}
        <button
          className="drk-btn thin drk-btn-hover w-fit"
          onClick={handleSubmit}
        >
          POST
        </button>
      </div>
    </div>
  );
};

export default MessageComposer;
