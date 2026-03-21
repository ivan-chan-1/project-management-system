import React from "react";

interface PageCardProps {
  children: React.ReactNode; // Allows any valid React elements inside
}

const PageCard: React.FC<PageCardProps> = ({ children }) => {
  return (
    <div className="px-16 pt-[1rem] pb-10 shadow-md inset-shadow-sm bg-white overflow-scroll">
      {children}
    </div>
  );
};

export default PageCard;
