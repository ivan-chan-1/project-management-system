import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PropsWithChildren } from "react";

type PreferencedCardProps = {
  id: UniqueIdentifier;
  name?: string;
  rank: number;
  notes?: string;
  handleChange: (id: string, value: string) => void;
  isActive?: boolean;
  isDrag?: boolean;
};

const PreferencedCard = (props: PropsWithChildren<PreferencedCardProps>) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.id,
    data: {
      type: "container",
      itemName: props.name,
      rank: props.rank,
      notes: props.notes,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFilledStyle = () => {
    return props.isActive
      ? "flex flex-row gap-10 items-center text-lg"
      : "flex flex-row gap-10 items-center text-lg opacity-50";
  };

  return (
    <div
      className={getFilledStyle()}
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      {/* Drag Button */}
      <button
        className="btn btn-square btn-ghost border-0 hover:bg-secondary shadow-none focus:bg-transparent"
        {...listeners}
      >
        {!isDragging && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      {!isDragging && <div className="w-8">{props.rank}</div>}
      {isDragging && <div className="w-8 opacity-0">{props.rank}</div>}

      {/* Collapsable - if preference empty */}
      {props.name === undefined && (
        <div className="collapse collapse-close bg-base-100 border-base-300 border border-dashed">
          <input type="checkbox" />
          <div className="collapse-title flex items-center col text-neutral-400">
            Drag and drop a project
          </div>
        </div>
      )}

      {/* Collapsable - if preference filled */}
      {props.name && (
        <div className="collapse collapse-arrow bg-base-100 border-base-300 border">
          <input type="checkbox" />
          <div className="collapse-title flex items-center">
            {!isDragging && props.children}
            {(isDragging || props.isDrag) && (
              <div className="p-2">{props.name}</div>
            )}
          </div>
          <div className="collapse-content text-sm">
            <div className=""></div>
            <textarea
              className="textarea w-full text-wrap"
              placeholder="Notes (at least 100 words)"
              defaultValue={props.notes}
              onChange={(e) =>
                props.handleChange(props.id.toString(), e.target.value)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencedCard;
