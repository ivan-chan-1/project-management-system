import settings from "../../assets/settings.svg";
import groups from "../../assets/groups.svg";
import invite from "../../assets/user_join.svg";
import attach from "../../assets/attachment.svg";
import { useNavigate } from "react-router-dom";
import confluence from "../../assets/confluence.svg";
import jira from "../../assets/jira.svg";
import github from "../../assets/github.svg";
import info from "../../assets/info.svg";
import chat from "../../assets/clientChat.svg";
export interface ShortcutProps {
  title: string;
  link?: string;
  route?: string;
  icon: string;
}

const Shortcut = ({ title, link, route, icon }: ShortcutProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (route !== undefined) {
      navigate(route);
    } else if (link !== undefined) {
      const safeLink = link.startsWith("http") ? link : `https://${link}`;
      window.open(safeLink, "_blank");
    }
  };
  const items = [
    "settings",
    "groups",
    "invite",
    "attach",
    "confluence",
    "jira",
    "chat",
    "project",
  ];
  let isInclude = false;
  if (
    items.includes(icon.toLowerCase()) ||
    icon.toLowerCase().includes("github")
  ) {
    isInclude = true;
  }
  return (
    <div
      className="btn flex flex-col border-0 justify-center items-center bg-white p-6 w-40 h-40 rounded-lg inset-shadow-2xs shadow-md mb-6 text-xs"
      onClick={handleClick}
    >
      <div className="card-body p-0">
        <div className="flex flex-col h-full justify-between items-center">
          {icon === "settings" && (
            <img src={settings} alt="Settings Icon" width={50} />
          )}
          {icon === "groups" && (
            <img src={groups} alt="Groups Icon" width={50} />
          )}
          {icon === "chat" && <img src={chat} alt="Groups Icon" width={50} />}
          {icon === "project" && (
            <img src={info} alt="Groups Icon" width={50} />
          )}
          {icon === "invite" && (
            <img src={invite} alt="User Join Icon" width={50} />
          )}
          {icon === "attach" && (
            <img src={attach} alt="Attachment" width={50} />
          )}
          {icon.toLowerCase().includes("confluence") && (
            <img src={confluence} alt="User Added Links" width={50} />
          )}
          {icon.toLowerCase().includes("jira") && (
            <img src={jira} alt="User Added Links" width={50} />
          )}
          {icon.toLowerCase().includes("github") && (
            <img src={github} alt="User Added Links" width={50} />
          )}
          {!isInclude && <img src={attach} alt="Attachment" width={50} />}
          {title}
        </div>
      </div>
    </div>
  );
};

export default Shortcut;
