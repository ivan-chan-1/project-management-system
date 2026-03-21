import GroupIcon from "../../assets/groups.svg?react";
import PinIcon from "../../assets/pin.svg?react";
import TagIcon from "../../assets/tag.svg?react";

const ChannelActionMenu = ({
  currAction,
  actionHandler,
  filter,
}: {
  currAction: string;
  actionHandler: React.Dispatch<React.SetStateAction<string>>;
  filter: boolean;
}) => {
  const handleClick = (action: string) => {
    if (currAction === action) {
      actionHandler("");
      return;
    }

    actionHandler(action);
  };

  return (
    <ul className="menu menu-horizontal bg-none rounded-box p-0">
      {filter && (
        <li>
          <div
            className="tooltip tooltip-bottom"
            data-tip="Filter Posts"
            onClick={() => handleClick("filter")}
          >
            <TagIcon className="w-5 stroke-[1.5]" />
          </div>
        </li>
      )}
      <li>
        <div
          className="tooltip tooltip-bottom"
          data-tip="Pinned Posts"
          onClick={() => handleClick("pinned")}
        >
          <PinIcon className="w-5 stroke-[1.5]" />
        </div>
      </li>
      <li>
        <div
          className="tooltip tooltip-bottom"
          data-tip="Member List"
          onClick={() => handleClick("members")}
        >
          <GroupIcon className="w-5 stroke-[1.5]" />
        </div>
      </li>
    </ul>
  );
};

export default ChannelActionMenu;
