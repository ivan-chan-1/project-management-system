import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import InfoIconButton from "../Misc/InfoIconButton";

export const SmallProjectCard = (props: {
  id: UniqueIdentifier;
  name: string;
  isActive?: boolean;
  isDragging?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.id,
      data: {
        itemName: props.name,
        type: "item",
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStyle = () => {
    if (props.isDragging) {
      return "card-body p-2 text-lg text-left flex flex-row items-center w-full border-1 border-gray-200 rounded-sm";
    } else if (props.isActive) {
      return "card-body p-2 text-lg text-left flex flex-row items-center w-full opacity-50 border-1 border-gray-200 rounded-sm";
    } else if (!props.isActive) {
      return "card-body p-2 text-lg text-left flex flex-row items-center w-full hover:border-gray-200 hover:border-1 hover:rounded-sm";
    }
  };

  return (
    <div
      className="card flex flex-row bg-base-100 rounded-sm content-center z-3"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div className={getStyle()}>
        <div className="truncate">{props.name}</div>
        <div className="w-[20px] flex-shrink-0">
          <InfoIconButton route={`/project/${props.id}/view`} />
        </div>
      </div>
    </div>
  );
};
