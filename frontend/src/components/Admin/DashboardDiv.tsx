import { PropsWithChildren } from "react";

interface DashboardDivDetails {
  title?: string;
}

const DashboardDiv = (props: PropsWithChildren<DashboardDivDetails>) => {
  return (
    <div className="flex flex-col h-auto w-130">
      {props.title && (
        <div className="text-2xl text-left mb-5">{props.title}</div>
      )}
      {props.children}
    </div>
  );
};

export default DashboardDiv;
