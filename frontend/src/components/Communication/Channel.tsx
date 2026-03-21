import MessageComposer from "./MessageComposer";
import Post from "./Post";
import PostIcon from "../../assets/post.svg?react";
import { useEffect, useRef, useState } from "react";
import { Conversation, Creators, PostType } from "../../pages/constants";
import { Socket } from "socket.io-client";
import { getConversations, getCreators } from "../../apiUtil";
import Reply from "./Reply";
import CompactMessageComposer from "./CompactMessageComposer";
import ChannelActionMenu from "./ChannelActionMenu";
import toast from "react-hot-toast";

/***
 * A component that displays the selected channel header and message history
 */
const Channel = ({
  channelId,
  socket,
  action,
  actionHandler,
  filter,
  staff,
}: {
  channelId: string;
  socket: Socket | undefined;
  action: string;
  actionHandler: React.Dispatch<React.SetStateAction<string>>;
  filter: string;
  staff: boolean;
}) => {
  // Channel information
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [creators, setCreators] = useState<Creators>();

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [view, setView] = useState<Conversation[]>([]);
  const [expand, setExpand] = useState("");
  const end = useRef<HTMLDivElement>(null);

  // Message composer toggler
  const [hide, setHide] = useState(false);

  // Fetch all of the channel's conversations
  useEffect(() => {
    if (channelId === "") return;

    const token = localStorage.getItem("token") ?? "";
    const fetchConversations = async () => {
      const res = await getConversations(token, channelId);
      setName(res.data.name);
      setConversations(res.data.conversations);
      setType(res.data.channel_type);
    };

    const fetchCreators = async () => {
      const res = await getCreators(token, channelId);
      setCreators(res.data);
    };

    fetchConversations();
    fetchCreators();
  }, [channelId]);

  // Listen to events from socket
  useEffect(() => {
    if (socket === undefined) return;

    // Add post to conversations
    socket.on("post", (post: PostType) => {
      const conversation: Conversation = {
        post,
        replies: [],
      };

      setConversations((prev) => [...prev, conversation]);
    });

    // Add reply to a post
    socket.on("reply", (op: string, reply: PostType) => {
      setConversations((prev) => {
        const convo = prev.map((p) => {
          if (p.post.id === op) {
            return { ...p, replies: [...p.replies, reply] };
          }

          return p;
        });

        return convo;
      });
    });

    // Log error
    socket.on("exception", (data: { Error: string }) => {
      toast.error(data.Error);
    });
  }, [socket]);

  // Log error
  useEffect(() => {
    if (end.current) {
      end.current.scrollIntoView();
    }
  }, [conversations, hide]);

  // Toggle message composer
  const handleClick = () => {
    setHide(true);
  };

  // Expand replies of a post
  function handleReplyExpand(id: string) {
    if (id === expand) {
      setExpand("");
    } else {
      setExpand(id);
    }
  }

  // Filter conversations
  useEffect(() => {
    if (filter === "") {
      setView(conversations);
    } else {
      setView(conversations.filter((p) => p.post.category === filter));
    }
  }, [filter, conversations]);

  return (
    <div className="h-screen flex flex-col justify-center grow">
      <div className="card bg-base-100 shadow-sm my-4 h-full w-full">
        <div className="flex flex-col justify-between text-left p-2 h-full">
          <div className="flex flex-row items-center justify-between text-xl border-b-1 py-2 px-3 border-gray-200">
            <div>{name}</div>
            <ChannelActionMenu
              currAction={action}
              actionHandler={actionHandler}
              filter={type === "forum"}
            />
          </div>
          <div className="grow px-[8%] py-2 overflow-auto flex flex-col gap-5">
            {view.map((c) => (
              <div key={c.post.id}>
                {/* Display original post */}
                <Post post={c.post} channel={channelId} creators={creators} />

                {/* Toggle viewing full expanded post */}
                {c.replies.length > 2 && (
                  <div
                    className="border-x-1 border-b-1 border-gray-200 px-4 py-1 text-[12px] text-primary hover:font-medium"
                    onClick={() => handleReplyExpand(c.post.id)}
                  >
                    {expand !== c.post.id && (
                      <>
                        View {c.replies.length - 2} older{" "}
                        {c.replies.length - 2 === 1 ? "reply" : "replies"}
                      </>
                    )}
                    {expand === c.post.id && <>Show less</>}
                  </div>
                )}

                {/* Display the two most recent replies */}
                {expand !== c.post.id &&
                  c.replies.length <= 2 &&
                  c.replies.map((r) => (
                    <Reply key={r.id} reply={r} creators={creators} />
                  ))}
                {expand !== c.post.id &&
                  c.replies.length > 2 &&
                  c.replies
                    .slice(-2)
                    .map((r) => (
                      <Reply key={r.id} reply={r} creators={creators} />
                    ))}
                {expand === c.post.id &&
                  c.replies.map((r) => (
                    <Reply key={r.id} reply={r} creators={creators} />
                  ))}

                {/* Display compact composer to reply to a post (but not announcement posts) */}
                {type !== "announcement" && (
                  <div className="border-x-1 border-b-1 border-gray-200 rounded-b-sm px-4 py-3 text-left flex flex-col gap-3">
                    <CompactMessageComposer
                      post={c.post.id}
                      socket={socket}
                      channel={channelId}
                    />
                  </div>
                )}
              </div>
            ))}
            <div ref={end} />
          </div>

          {/* Creating a post */}
          <div className="flex flex-row p-3 items-center gap-3">
            {channelId !== "" &&
              (staff || type !== "announcement") &&
              !hide && (
                <button
                  className="drk-btn drk-btn-hover drk-btn-disabled flex flex-row gap-1 items-center"
                  onClick={handleClick}
                >
                  <PostIcon className="w-5 h-5 stroke-current" />
                  NEW POST
                </button>
              )}
            {type === "announcement" && !staff && (
              <div className="text-sm text-left text-gray-400">
                Only channel moderators can post in this channel
              </div>
            )}
          </div>
          {hide && (
            <MessageComposer
              channel={channelId}
              hasCategory={type === "forum"}
              handler={setHide}
              socket={socket}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Channel;
