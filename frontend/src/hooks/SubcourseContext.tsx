import React, { createContext, useState, ReactNode, useContext } from "react";

interface Subcourse {
  id: string;
  name: string;
}

interface SubcourseContextType {
  subcourse: Subcourse | null;
  setSubcourseValue: (subcourse: Subcourse | null) => void;
}

export const SubcourseContext = createContext<SubcourseContextType | undefined>(
  undefined,
);

interface SubcourseProviderProps {
  children: ReactNode;
}

// create a provider component
export const SubcourseProvider: React.FC<SubcourseProviderProps> = ({
  children,
}) => {
  const [subcourse, setSubcourse] = useState<Subcourse | null>(null);

  const setSubcourseValue = (newSubcourse: Subcourse | null) => {
    setSubcourse(newSubcourse);
  };

  return (
    <SubcourseContext.Provider value={{ subcourse, setSubcourseValue }}>
      {children}
    </SubcourseContext.Provider>
  );
};

export const useSubcourse = () => {
  const context = useContext(SubcourseContext);
  if (!context) {
    throw new Error("useSubcourse must be used within a SubcourseProvider");
  }
  return context;
};
