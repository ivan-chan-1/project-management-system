import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";

/**
 * A component that represents the student or group that hasn't been allocated
 *
 * @param props - component props
 * @param props.children - the list of students or groups that are unallocated
 */
const UnAllocatedCard = (props: { children?: ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: "droppable-origin",
  });

  return (
    <div className="card bg-gray-100/60 rounded-sm" ref={setNodeRef}>
      <div className="card-body p-6">
        <div className="flex flex-col space-y-4 rounded-sm overflow-y-auto h-100">
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default UnAllocatedCard;
