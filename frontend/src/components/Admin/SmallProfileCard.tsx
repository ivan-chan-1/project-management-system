import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import InfoIconButton from "../Misc/InfoIconButton";

/**
 * A component that represents the student or group being allocated
 *
 * @param props - component props
 * @param props.id - the identifer of the item (used by track dragging and dropping)
 * @param props.name - the name of allocated item
 * @param props.isStudent - renders avatar if true
 * @param props.isActive - renders preview if true
 */
export const SmallProfileCard = (props: {
  id: UniqueIdentifier;
  name: string;
  isStudent: boolean;
  isActive: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.id,
      data: {
        itemName: props.name,
        isContainer: false,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStyle = () => {
    return props.isActive
      ? "card flex flex-row bg-base-100 rounded-sm content-center opacity-50"
      : "card flex flex-row bg-base-100 rounded-sm content-center";
  };

  return (
    <div
      className={getStyle()}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div className="card-body p-3 text-left flex flex-row items-center gap-3 z-3">
        {/* Item information */}
        {props.isStudent && (
          <div className="avatar avatar-placeholder">
            <div className="bg-black text-white w-8 rounded-full">
              <span className="text-lg">{props.name.split(" ")[0][0]}</span>
            </div>
          </div>
        )}
        <p className="text-black text-md">{props.name}</p>

        {/* Directs to more information about the item being dragged */}
        <InfoIconButton
          route={`/${props.isStudent ? "student" : "group"}/profile/${props.id}`}
        />
      </div>
    </div>
  );
};
