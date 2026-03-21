import ChannelInfoCard from "./ChannelInfoCard";
import XIcon from "../../assets/xmark.svg?react";

const categories = ["General", "Lectures", "Workshops", "Labs", "Assessments"];

const FilterPosts = ({
  active,
  handler,
}: {
  active: string;
  handler: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const getStyle = (id: string) => {
    return id === active
      ? "bg-gray-100 px-3 py-2 rounded-sm flex flex-row justify-between"
      : "hover:bg-gray-100/50 px-3 py-2 rounded-sm flex flex-row justify-between";
  };

  const getStatusStyle = (category: string) => {
    switch (category) {
      case "General": {
        return "status status-primary";
      }
      case "Lectures": {
        return "status status-success";
      }
      case "Workshops": {
        return "status status-error";
      }
      case "Labs": {
        return "status status-warning";
      }
      case "Assessments": {
        return "status status-accent";
      }

      default: {
        return "status status-neutral";
      }
    }
  };

  const handleClick = (category: string) => {
    if (category === active) {
      handler("");
    } else {
      handler(category);
    }
  };

  return (
    <ChannelInfoCard title="Filter Posts">
      <div className="flex flex-col gap-1 text-left">
        {categories.map((c) => {
          return (
            <div className={getStyle(c)} onClick={() => handleClick(c)}>
              <div className="flex flex-row items-center gap-3">
                <div aria-label="status" className={getStatusStyle(c)}></div>
                {c}
              </div>
              {active === c && <XIcon className="w-5 text-gray-400" />}
            </div>
          );
        })}
      </div>
    </ChannelInfoCard>
  );
};

export default FilterPosts;
