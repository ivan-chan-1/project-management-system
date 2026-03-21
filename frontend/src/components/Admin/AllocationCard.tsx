import { useDroppable } from "@dnd-kit/core";
import { PropsWithChildren, useEffect, useState } from "react";
import { ContainerDetails } from "../../pages/constants";

/**
 * A component that holds possible allocations
 *
 * @component
 * @param {PropsWithChildren<ContainerDetails>} props - component props and wrapped children
 */
export const AllocationCard = (props: PropsWithChildren<ContainerDetails>) => {
  const { setNodeRef } = useDroppable({
    id: props.id,
    data: {
      isContainer: true,
    },
  });
  const [style, setStyle] = useState("card p-8 bg-gray-100 rounded-sm");

  // Renders error feedback when user allocates greater than capacity
  useEffect(() => {
    if (props.current > props.capacity) {
      setStyle("card p-8 bg-red-100/60 rounded-sm text-red-600");
    } else {
      setStyle("card p-8 bg-gray-100/60 rounded-sm");
    }
  }, [props]);

  return (
    <div className={style} ref={setNodeRef}>
      <div className="card-body p-0">
        {/* Information of receiver of allocation  */}
        <div className="flex flex-row justify-between content-center">
          <div className="text-lg">{props.name}</div>
          <div className="text-lg">
            {props.current}/{props.capacity}
          </div>
        </div>

        {/* Renders allocated students/groups */}
        <div className="grid grid-cols-3 gap-4 mt-2 justify-center">
          {props.children}
        </div>
      </div>
    </div>
  );
};
