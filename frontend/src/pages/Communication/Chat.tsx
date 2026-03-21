import { useEffect, useState } from "react";
import Channel from "../../components/Communication/Channel";
import ChannelSideBar from "../../components/Communication/ChannelSideBar";
import { ChannelIdentifer, ChannelListType } from "../constants";
import { API_URL, getAllChannelList, getChannelLists } from "../../apiUtil";
import { io, Socket } from "socket.io-client";
import Pinned from "../../components/Communication/Pinned";
import MemberList from "../../components/Communication/MemberList";
import FilterPosts from "../../components/Communication/FilterPosts";

/**
 * This page displays the chat interface for communication.
 */
const Chat = () => {
  const [view, setView] = useState("");
  const [channelLists, setChannelLists] = useState<ChannelListType[]>([]);
  const [action, setAction] = useState("");
  const [filter, setFilter] = useState("");
  const [socket, setSocket] = useState<Socket>();
  const [add, setAdd] = useState(false);
  const user = localStorage.getItem("user") ?? "";

  // Fetches all the channel lists and sets up the socket connection
  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const user = localStorage.getItem("user") ?? "";
    const subcourseId = localStorage.getItem("subcourse") ?? "";

    const sortChannels = (a: ChannelIdentifer, b: ChannelIdentifer) => {
      return a.name.localeCompare(b.name);
    };

    const sortChannelLists = (channels: ChannelListType[]) => {
      return channels
        .sort((a, b) => {
          const aIsString = typeof a.category === "string";
          const bIsString = typeof b.category === "string";

          if (aIsString && !bIsString) return -1;
          if (!aIsString && bIsString) return 1;

          if (aIsString && bIsString) {
            return (b.category as string).localeCompare(a.category as string);
          }

          return (a.category as number) - (b.category as number);
        })
        .map((group) => ({
          ...group,
          channels: [...group.channels].sort(sortChannels),
        }));
    };

    const fetchChannelLists = async () => {
      if (user === "staff") {
        const res = await getAllChannelList(token, subcourseId);
        setChannelLists(sortChannelLists(res.data));
      } else {
        const res = await getChannelLists(token, subcourseId);
        setChannelLists(sortChannelLists(res.data));
      }
    };

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
    });
    setSocket(socket);

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
    });

    fetchChannelLists();
  }, [add]);

  useEffect(() => {
    setAction("");
    setFilter("");
  }, [view]);

  return (
    <div data-theme="mytheme" className="w-screen h-auto m-0 p-0">
      <div className="w-screen h-auto px-5">
        <div className="flex flex-row mt-15 gap-4">
          <ChannelSideBar
            admin={user === "staff"}
            viewHandler={setView}
            channels={channelLists}
            socket={socket}
            addHandler={setAdd}
          />
          <Channel
            channelId={view}
            socket={socket}
            actionHandler={setAction}
            action={action}
            filter={filter}
            staff={user === "staff"}
          />
          {action === "pinned" && <Pinned channelId={view} />}
          {action === "members" && <MemberList channelId={view} />}
          {action === "filter" && (
            <FilterPosts handler={setFilter} active={filter} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
