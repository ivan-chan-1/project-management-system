import { PropsWithChildren } from "react";

const ChannelInfoCard = (props: PropsWithChildren<{ title: string }>) => {
  return (
    <div className="h-screen flex flex-col justify-center">
      <div className="card bg-base-100 shadow-sm my-4 h-full">
        <div className="card-body px-5 pt-5 pb-0 w-90 h-full">
          <div className="flex flex-row justify-between mb-8 items-center">
            <div className="text-xl">{props.title}</div>
          </div>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default ChannelInfoCard;
