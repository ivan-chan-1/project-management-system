import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AllocationCard } from "./AllocationCard";
import { SmallProfileCard } from "./SmallProfileCard";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import AutoAllocator from "./AutoAllocator";
import UnAllocatedCard from "./UnAllocatedCard";
import {
  Container,
  GroupStudentInfo,
  Items,
  LData,
  ProjectGroupInfo,
  RData,
  StudentInfo,
} from "../../pages/constants";
import { allocateProjects, allocateStudents } from "../../apiUtil";
import toast from "react-hot-toast";
import FilterAllocation from "./FilterAllocation";

/**
 * A component that allocates students to groups or groups to projects
 *
 * @component
 *
 * @param props - component props
 * @param {string} props.type - the type of the allocation
 * @param {GroupStudentInfo[]} props.groups - information of all subcourse's groups
 * @param {GroupStudentInfo[]} props.projects - information of all subcourse's projects
 * @param {StudentInfo[]} props.students - information of all subcourse's students
 */
const Allocator = ({
  type,
  groups,
  projects,
  students,
  tutorials,
}: {
  type: string;
  groups: GroupStudentInfo[];
  projects?: ProjectGroupInfo[];
  students?: StudentInfo[];
  tutorials?: Record<string, string[]>;
}) => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [viewable, setViewable] = useState<UniqueIdentifier[]>([]);
  const [currItem, setCurrItem] = useState<{
    id: UniqueIdentifier;
    name: string;
  } | null>(null);
  const [auto, setAuto] = useState<
    Record<string, { id: string; name: string }[]>
  >({});

  const [overCapacity, setOverCapacity] = useState(false);
  const [filter, setFilter] = useState<Record<string, boolean | string>>({
    full: false,
    partial: false,
    empty: false,
    tutorial: "",
  });

  // Initialise the containers and load in existing allocations if it exists
  useEffect(() => {
    const c: Container[] = [];
    let autoAllocGroups: string[] = [];

    if (projects !== undefined && Object.keys(auto).length === 0) {
      // Initialise the project containers with existing allocated groups
      projects.forEach((p: ProjectGroupInfo) => {
        // Groups from the project itself
        const projectGroups = p.groups.map((g) => ({ id: g.id, name: g.name }));

        // Groups from the global list that drafted this project
        const draftedGroups = groups
          .filter((g) => g.draft_alloc?.includes(p.id))
          .map((g) => ({ id: g.id, name: g.name }));

        const combinedGroups = [...projectGroups, ...draftedGroups];

        c.push({
          id: p.id,
          name: p.name,
          capacity: p.capacity,
          items: combinedGroups,
        });
      });
    } else if (projects !== undefined && Object.keys(auto).length !== 0) {
      // Initialise the project containers with existing allocated groups from
      // allocation algorithm
      projects.forEach((p: ProjectGroupInfo) => {
        // Tracks groups that have been allocated
        if (auto[p.id] !== undefined) {
          autoAllocGroups = [
            ...autoAllocGroups,
            ...auto[p.id].map((g) => g.id),
          ];
        }

        c.push({
          id: p.id,
          name: p.name,
          capacity: p.capacity,
          items: auto[p.id] === undefined ? [] : auto[p.id],
        });
      });
    } else if (students !== undefined) {
      // Initialise the group containers with existing allocated students
      groups.forEach((g: GroupStudentInfo) => {
        c.push({
          id: g.id,
          name: g.name,
          capacity: 6, // TODO: CHANGE TO MAX PPL IN GROUP RULE
          items: g.members.map((m) => ({ id: m.id, name: m.name })),
        });
      });
    }

    let unallocated: Items[] = [];
    if (type === "group" && Object.keys(auto).length === 0) {
      // Load all unallocated groups into unallocated container

      unallocated = groups
        .filter(
          (g: GroupStudentInfo) => g.project === null && g.draft_alloc === null,
        )
        .map((g: GroupStudentInfo) => ({ id: g.id, name: g.name }));
    } else if (type === "group" && Object.keys(auto).length !== 0) {
      // Load all unallocated groups into unallocated container from
      // auto-allocation algorithm

      unallocated = groups
        .filter((g: GroupStudentInfo) => !autoAllocGroups.includes(g.id))
        .map((g: GroupStudentInfo) => ({ id: g.id, name: g.name }));
    } else if (type === "student" && students !== undefined) {
      // Load all unallocated students into unallocated container
      unallocated = students
        .filter((s: StudentInfo) => s.subcourses.group === null)
        .map((s: StudentInfo) => ({ id: s.id, name: s.name }));
    }

    // Add unallocated container to list of containers
    c.push({
      id: "droppable-origin",
      name: "droppable-origin",
      capacity: 0,
      items: unallocated,
    });

    setTimeout(() => {
      setContainers(c);
      setViewable(c.slice(0, -1).map((c) => c.id));
    }, 0);
  }, [projects, groups, type, students, auto]);

  // Display warnings if a container is over capacity
  useEffect(() => {
    const over = containers.some(
      (c) => c.id !== "droppable-origin" && c.items.length > c.capacity,
    );

    setOverCapacity(over);
  }, [containers]);

  useEffect(() => {
    let refined = containers.slice(0, -1).filter((c) => {
      const isFull = c.capacity === c.items.length;
      const isPartial = c.items.length > 0 && c.items.length < c.capacity;
      const isEmpty = c.items.length === 0;

      return (
        (!filter.partial && !filter.full && !filter.empty) ||
        (filter.partial && isPartial) ||
        (filter.full && isFull) ||
        (filter.empty && isEmpty)
      );
    });

    if (filter.tutorial && tutorials) {
      refined = refined.filter((c) => {
        return tutorials[filter.tutorial.toString()].includes(c.id.toString());
      });
    }

    setViewable(refined.map((r) => r.id));
  }, [filter, containers, tutorials]);

  // Initialise sensors. Activates drag operations when moved by 5 pixels
  // Used to differentiate between clicking and dragging draggable cards
  const sensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(sensor);

  // Tracks what item is being dragged
  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current === undefined) {
      setCurrItem({ id: e.active.id, name: "" });
      return;
    }

    setCurrItem({ id: e.active.id, name: e.active.data.current.itemName });
  };

  // Moves items between items within containers, and items between containers
  const handleDragMove = (e: DragMoveEvent) => {
    sortItem(e);
    moveItem(e);
  };

  // Moves items between items within containers, and items between containers
  const handleDragEnd = (e: DragEndEvent) => {
    sortItem(e);
    moveItem(e);
    setCurrItem(null);
  };

  // Moves items between containers
  const moveItem = (e: DragMoveEvent | DragEndEvent) => {
    const { active, over } = e;

    // Cancels operation if dragging over itself
    if (!active || !over || active.id === over.id) {
      return;
    }

    // Finds the container which item is being dragged from and container it is over/in
    const activeContainerIndex = containers.findIndex((c) =>
      c.items.some((i) => i.id === active.id),
    );
    const overContainerIndex = containers.findIndex((c) => c.id === over.id);

    if (activeContainerIndex === -1 || overContainerIndex === -1) {
      return;
    }

    // Finds the item in the container's list of items
    const activeItemIndex = containers[activeContainerIndex].items.findIndex(
      (i) => i.id === active.id,
    );

    // Removes the active item from the container it is being dragged from and
    // adds it to the new container it is being dragged to
    const newContainers = [...containers];
    const [removedItem] = newContainers[activeContainerIndex].items.splice(
      activeItemIndex,
      1,
    );
    newContainers[overContainerIndex].items.push(removedItem);
    setContainers(newContainers);
  };

  // Sorts items between items
  const sortItem = (e: DragMoveEvent | DragEndEvent) => {
    const { active, over } = e;

    // Cancels operation if dragging over itself or if not dragging an item
    // or if not dragging over an item
    if (
      !active ||
      !over ||
      active.id === over.id ||
      (active.data.current?.isContainer && over.data.current?.isContainer)
    ) {
      return;
    }

    // Finds the container which item is being dragged from
    // and the container of the item its is over
    const activeContainerIndex = containers.findIndex((c) =>
      c.items.some((i) => i.id === active.id),
    );

    const overContainerIndex = containers.findIndex((c) =>
      c.items.some((i) => i.id === over.id),
    );

    if (activeContainerIndex === -1 || overContainerIndex === -1) {
      return;
    }

    // Finds the item in each container
    const activeItemIndex = containers[activeContainerIndex].items.findIndex(
      (i) => i.id === active.id,
    );

    const overItemIndex = containers[activeContainerIndex].items.findIndex(
      (i) => i.id === over.id,
    );

    // If sorting items in the same container, then shift items array to new order
    // If sorting items in a different container, then add item and shift order
    if (activeContainerIndex === overContainerIndex) {
      const newContainers = [...containers];
      newContainers[activeContainerIndex].items = arrayMove(
        newContainers[activeContainerIndex].items,
        activeItemIndex,
        overItemIndex,
      );

      setContainers(newContainers);
    } else {
      const newContainers = [...containers];
      const [removedItem] = newContainers[activeContainerIndex].items.splice(
        activeItemIndex,
        1,
      );

      newContainers[overContainerIndex].items.splice(
        overItemIndex,
        0,
        removedItem,
      );

      setContainers(newContainers);
    }
  };

  // Saves allocations to database
  const handleUpdate = async (isDraft: boolean) => {
    // Holds the allocations which have one-to-one relationship (eg. student to group)
    const l_allocations: LData[] = [];

    // Holds the allocations which have one-to-many relationship (eg. group to students)
    const r_allocations: RData[] = [];

    // Checks if students have been allocated (if not a draft)
    if (!isDraft && containers[containers.length - 1].items.length !== 0) {
      toast.error(`All ${type}s must be allocated`);
      return;
    }

    // Groups allocations by one-to-one and one-to-many relationships
    for (const c of containers.slice(0, -1)) {
      const d = c.items.map((i) => ({
        left: i.id,
        right: c.id,
      }));

      l_allocations.push(...d);
      r_allocations.push({ left: c.id, right: c.items.map((i) => i.id) });
    }

    const req_data = {
      is_draft: isDraft,
      l_allocations: l_allocations,
      r_allocations: r_allocations,
    };

    // Update database with allocations
    try {
      const token = localStorage.getItem("token") ?? "";
      const subcourse = localStorage.getItem("subcourse") ?? "";
      let res;
      if (type === "group") {
        res = await allocateProjects(token, subcourse, req_data);
      } else if (type === "student") {
        res = await allocateStudents(token, subcourse, req_data);
      }

      toast.success(res?.data.message);
    } catch (err) {
      toast.error("Error while saving allocations" + err);
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="flex flex-row flex-wrap space-x-12 space-y-12 mt-12">
        {/* Allocation algorithm selector and unallocated droppable */}
        <div className="w-80 flex-none">
          <div className="card p-8 shadow-sm bg-base-100">
            <div className="card-body p-0">
              <h2 className="card-title mb-4 font-medium">
                Unallocated {type}s
              </h2>
              {type === "group" ? <AutoAllocator handler={setAuto} /> : null}

              <p className="text-left mb-4">Drag and drop a {type}</p>
              <p className="text-left">
                {containers.length !== 0 &&
                  containers[containers.length - 1].items.length}{" "}
                unallocated
              </p>

              {/* Droppable container which renders unallocated students/groups */}
              <SortableContext items={["droppable-origin"]}>
                <UnAllocatedCard>
                  {containers.length !== 0 &&
                    containers[containers.length - 1].items.map((i) => (
                      <SmallProfileCard
                        key={i.id}
                        id={i.id}
                        name={i.name}
                        isStudent={type === "student"}
                        isActive={currItem?.id === i.id}
                      />
                    ))}
                </UnAllocatedCard>
              </SortableContext>
            </div>
          </div>
        </div>

        {/* Allocation Mappers */}
        <div className="grow-8">
          <div className="card p-8 shadow-sm bg-base-100">
            <div className="card-body p-0">
              {/* Allocation Updaters and Confirmation */}
              <div className="flex flex-row justify-between mb-4">
                <h2 className="card-title font-medium">Allocations</h2>
                <FilterAllocation
                  tutorials={Object.keys(tutorials ?? {})}
                  filterHandler={setFilter}
                />
              </div>

              {/* Containers containing allocations */}
              {containers.map((container) => {
                if (!viewable.includes(container.id)) {
                  return;
                }

                return (
                  <AllocationCard
                    key={container.id}
                    id={container.id}
                    name={container.name}
                    capacity={container.capacity}
                    current={container.items.length}
                  >
                    <SortableContext items={container.items.map((i) => i.id)}>
                      {container.items.map((i) => (
                        <SmallProfileCard
                          key={i.id}
                          id={i.id}
                          name={i.name}
                          isStudent={type === "student"}
                          isActive={currItem?.id === i.id}
                        />
                      ))}
                    </SortableContext>
                  </AllocationCard>
                );
              })}

              <div className="space-x-4 flex flex-row justify-end mt-4 items-center">
                {overCapacity && (
                  <div className="text-red-600">
                    An allocation violates capacity rules. Change or override.
                  </div>
                )}
                <button
                  className="lt-btn lt-btn-hover"
                  onClick={() => handleUpdate(true)}
                >
                  SAVE AND EXIT
                </button>
                {overCapacity ? (
                  <button
                    className="red-btn red-btn-hover"
                    onClick={() =>
                      document &&
                      (
                        document.getElementById(
                          "allocate-modal",
                        ) as HTMLFormElement
                      ).showModal()
                    }
                  >
                    OVERRIDE AND PUBLISH
                  </button>
                ) : (
                  <button
                    className="drk-btn drk-btn-hover"
                    onClick={() =>
                      document &&
                      (
                        document.getElementById(
                          "allocate-modal",
                        ) as HTMLFormElement
                      ).showModal()
                    }
                  >
                    PUBLISH
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renders preview of item being dragged */}
      <DragOverlay>
        {currItem && (
          <SmallProfileCard
            id={currItem.id}
            name={currItem.name}
            isStudent={type === "student"}
            isActive={false}
          />
        )}
      </DragOverlay>

      {/* Confirmation dialog on publishing */}
      <dialog id="allocate-modal" className="modal">
        <div className="modal-box">
          <h3 className="text-lg text-left">Publish allocations</h3>
          <p className="py-4 text-left text-sm">
            By publishing, allocations will be visible to all users. Are you
            sure?
          </p>
          <form method="dialog" className="flex flex-row justify-between mt-4">
            <button className="lt-btn lt-btn-hover">CANCEL</button>

            <button
              className="drk-btn drk-btn-hover"
              onClick={() => handleUpdate(false)}
            >
              PUBLISH
            </button>
          </form>
        </div>
      </dialog>
    </DndContext>
  );
};

export default Allocator;
