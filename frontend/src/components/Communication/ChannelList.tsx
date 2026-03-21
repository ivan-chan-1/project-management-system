const ChannelList = ({
  category,
  channels,
  active,
  handler,
}: {
  category: string | number;
  channels: { id: string; name: string }[];
  active: string;
  handler: (id: string) => void;
}) => {
  const getStyle = (id: string) => {
    return id === active
      ? "bg-gray-100 px-2 py-1 rounded-sm"
      : "hover:bg-gray-100 px-2 py-1 rounded-sm";
  };

  const getTitle = () => {
    if (category === "course") {
      return "Course Channels";
    } else if (category === "client") {
      return "Client Channels";
    } else {
      return `Project ${category} Channels`;
    }
  };

  return (
    <div className="flex flex-col gap-1 text-left">
      <div className="text-[12px] text-gray-700">{getTitle()}</div>
      {channels.map((c) => (
        <div
          key={c.id}
          className={getStyle(c.id)}
          onClick={() => handler(c.id)}
        >
          {c.name}
        </div>
      ))}
    </div>
  );
};

export default ChannelList;
