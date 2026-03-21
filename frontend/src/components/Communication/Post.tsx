import { Creators, PostType } from "../../pages/constants";
import { useEffect, useState } from "react";
import { isPinned, pinPost } from "../../apiUtil";
import { formatDateTime } from "../../helper";
import Pin from "../../assets/pin.svg?react";
import PinSolid from "../../assets/pinSolid.svg?react";

/***
 * A component that displays a conversation, including its original post and replies
 */
const Post = ({
  post,
  channel,
  creators,
}: {
  post: PostType;
  channel: string;
  creators: Creators | undefined;
}) => {
  const [name, setName] = useState("");
  const [more, setMore] = useState(false);
  const [pin, setPin] = useState(false);

  useEffect(() => {
    if (creators === undefined) {
      return;
    }

    try {
      setName(creators[post.creator].name);
    } catch {
      setName("");
    }
  }, [post, creators]);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const fetchPin = async () => {
      const res = await isPinned(token, channel, post.id);
      setPin(res.data.pinned);
    };

    fetchPin();
  }, [post, channel, creators]);

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "General": {
        return "badge badge-soft badge-sm badge-primary";
      }
      case "Lectures": {
        return "badge badge-soft badge-sm badge-success";
      }
      case "Workshops": {
        return "badge badge-soft badge-sm badge-error";
      }
      case "Labs": {
        return "badge badge-soft badge-sm badge-warning";
      }
      case "Assessments": {
        return "badge badge-soft badge-sm badge-accent";
      }

      default: {
        return "badge badge-soft badge-sm badge-primary";
      }
    }
  };

  const handlePin = () => {
    const token = localStorage.getItem("token") ?? "";
    if (pin) {
      pinPost(token, "unpin", channel, post.id);
    } else {
      pinPost(token, "pin", channel, post.id);
    }

    setPin(!pin);
  };

  return (
    <div
      className="border-1 border-gray-200 rounded-t-sm p-4 text-left flex flex-col gap-3"
      onMouseEnter={() => setMore(true)}
      onMouseLeave={() => setMore(false)}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-3">
          {/* Profile Picture */}
          <div className="avatar avatar-placeholder">
            <div className="bg-black text-white w-8 rounded-full">
              <span className="text-lg">{name[0]}</span>
            </div>
          </div>

          {/* Name */}
          <div className="text-sm">{name}</div>

          {/* Time Posted */}
          <div className="text-[11px] text-gray-500">
            {formatDateTime(post.date_created)}
          </div>
        </div>
        <div className="flex flex-row items-center gap-3">
          {post.category && (
            <div className={getBadgeStyle(post.category)}>{post.category}</div>
          )}
          {more && !pin && (
            <Pin className="w-6 text-primary" onClick={handlePin} />
          )}
          {pin && <PinSolid className="w-6 text-primary" onClick={handlePin} />}
        </div>
      </div>
      <div className="text-lg font-medium">{post.title}</div>
      <div className="text-sm">{post.content}</div>
    </div>
  );
};

export default Post;
