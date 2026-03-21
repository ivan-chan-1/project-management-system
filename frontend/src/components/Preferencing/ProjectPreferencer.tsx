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
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import UnAllocatedCard from "../Admin/UnAllocatedCard";
import PreferencedCard from "./PreferencedCard";
import AutoProjectPreferencer from "./AutoProjectPreferencer";
import { SmallProjectCard } from "./SmallProjectCard";
import {
  AutoPreference,
  MemberWishlistInfo,
  ProjectPreferenceInfo,
} from "../../pages/constants";
import { getAutoGroupPreference, submitPreference } from "../../apiUtil";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import React from "react";

type Items = {
  id: UniqueIdentifier;
  name: string;
  notes?: string;
};

type Container = {
  id: UniqueIdentifier;
  items: Items[];
};

const MAX_PREFERENCES = 7; // TODO: change

const ProjectPreferencer = ({
  type,
  preferences,
  wishlists,
  id,
  handleNext,
}: {
  type: string;
  preferences: ProjectPreferenceInfo[];
  wishlists: MemberWishlistInfo[];
  id: string;
  handleNext: () => void;
}) => {
  const navigate = useNavigate();
  const [containers, setContainers] = useState<Container[]>([]);

  // Used to display selected student wishlist
  // If type is student, by default displays the individual's student wishlist
  const [student, setStudent] = useState<string>(
    type === "student" ? (localStorage.getItem("id") ?? "") : "",
  );

  const [auto, setAuto] = useState<AutoPreference[]>([]);

  const [currItem, setCurrItem] = useState<{
    id: UniqueIdentifier;
    name: string;
    type: string;
  } | null>(null);

  /**
   * Rendering Preferences
   */
  // Initialise the containers
  useEffect(() => {
    // Initialise preference card containers to store draggable items
    const c: Container[] = [];
    for (let i = 0; i < MAX_PREFERENCES; i++) {
      c.push({
        id: `container-${i}`,
        items: [],
      });
    }

    // Initialise the wishlist container
    c.push({
      id: "droppable-origin",
      items: [],
    });

    // Add preference to each preference-holder if it exists
    // Or load preferences from auto-ranking results
    if (auto.length !== 0) {
      auto.forEach((p) => {
        c[p.rank - 1].items.push({
          id: p.project.id,
          name: p.project.name,
        });
      });
    } else {
      preferences.forEach((p) => {
        c[p.rank - 1].items.push({
          id: p.project.id,
          name: p.project.name,
          notes: p.notes,
        });
      });
    }

    setTimeout(() => setContainers(c), 0);
  }, [preferences, auto]);

  // Load the selected wishlist
  useEffect(() => {
    const wishlist = wishlists.find((w) => w.id === student);

    if (wishlist === undefined) {
      return;
    }

    setTimeout(
      () =>
        setContainers((prev) => {
          if (prev.length === 0) return prev;
          let pref: UniqueIdentifier[] = [];
          let curr: Container[] = [];

          // Mapping wishlist projects into items, and push into droppable container
          for (const c of prev) {
            if (c.id === "droppable-origin") {
              const items: Items[] = [];

              // Check if wishlist project is in preferences, if not map to item
              wishlist.wishlist
                .filter((p) => !pref.includes(p.id))
                .forEach((p) => {
                  items.push({
                    id: p.id,
                    name: p.name,
                  });
                });

              curr = [...curr, { ...c, items }];
              continue;
            } else if (c.items.length !== 0) {
              // If a project is currently in the preferences, add id to pref
              pref = [...pref, c.items[0].id];
            }

            curr = [...curr, c];
          }

          return curr;
        }),
      0,
    );
  }, [student, wishlists]);

  // Get the auto-rank preferencing results
  const autoPreference = async () => {
    const res = await getAutoGroupPreference(
      localStorage.getItem("token") ?? "",
      localStorage.getItem("subcourse") ?? "",
      id,
    );

    setAuto(res.data);
  };

  /**
   * Dragging and Dropping Operations
   */

  // Initialise sensors. Activates drag operations when moved by 5 pixels
  // Used to differentiate between clicking and dragging draggable cards
  const sensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(sensor);

  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current === undefined) {
      return;
    }

    setCurrItem({
      id: e.active.id,
      name: e.active.data.current.itemName,
      type: e.active.data.current.type,
    });
  };

  // Moves containers, and items into/between containers
  const handleDragMove = (e: DragMoveEvent) => {
    moveContainer(e);
    moveItem(e);
  };

  // Moves containers, and items into/between containers
  const handleDragEnd = (e: DragEndEvent) => {
    moveContainer(e);
    moveItem(e);
    setCurrItem(null);
  };

  // Moves items into/between containers
  const moveItem = (e: DragMoveEvent | DragEndEvent) => {
    const { active, over } = e;

    if (!active || !over || active.id === over.id) {
      return;
    }

    const activeContainerIndex = containers.findIndex((c) =>
      c.items.some((i) => i.id === active.id),
    );
    const overContainerIndex = containers.findIndex((c) => c.id === over.id);

    if (activeContainerIndex === -1 || overContainerIndex === -1) {
      return;
    }

    if (
      containers[overContainerIndex].id !== "droppable-origin" &&
      containers[overContainerIndex].items.length !== 0
    ) {
      return;
    }

    const activeItemIndex = containers[activeContainerIndex].items.findIndex(
      (i) => i.id === active.id,
    );

    const newContainers = [...containers];
    const [removedItem] = newContainers[activeContainerIndex].items.splice(
      activeItemIndex,
      1,
    );
    newContainers[overContainerIndex].items.push(removedItem);
    setContainers(newContainers);
  };

  // Moves containers
  const moveContainer = (e: DragEndEvent) => {
    const { active, over } = e;
    if (
      !active ||
      !over ||
      active.id === over.id ||
      !active.id.toString().includes("container") ||
      !over.id.toString().includes("container")
    ) {
      return;
    }

    const activeContainerIndex = containers.findIndex(
      (c) => c.id === active.id,
    );
    const overContainerIndex = containers.findIndex((c) => c.id === over.id);

    let newContainers = [...containers];
    newContainers = arrayMove(
      newContainers,
      activeContainerIndex,
      overContainerIndex,
    );
    setContainers(newContainers);
  };

  /**
   * User Input and Submitting
   */

  // Add notes to item
  const handleChange = (id: string, value: string) => {
    setContainers((prev) => {
      let curr: Container[] = [];

      for (const p of prev) {
        if (p.id === id) {
          curr = [
            ...curr,
            { id: id, items: [{ ...p.items[0], notes: value }] },
          ];
          continue;
        }
        curr = [...curr, p];
      }

      return curr;
    });
  };

  /**
   * Update database with project preferences
   *
   * For group project preference form,
   *  - peforms validation
   *  - if isNext is false, saves and exits form
   *
   * For individual project preferences,
   *  - no validation
   *  - no save and exit, only publish option
   * @param isNext - indicates if moving to next part of the form
   */
  const handleUpdate = async (isNext: boolean) => {
    const pref: Array<{ project: string; notes: string; rank: number }> = [];
    let rank = 1;

    // Validates each preference
    for (const c of containers.slice(0, -1)) {
      if (isNext && type === "group") {
        if (c.items.length === 0) {
          toast.error(`You must preference ${MAX_PREFERENCES} projects`);
          return;
        } else if (c.items[0].notes === "" || c.items[0].notes === undefined) {
          toast.error(`You must write a pitch for ${c.items[0].name} projects`);
          return;
        } else if (c.items[0].notes.length < 100) {
          toast.error(
            `You pitch for ${c.items[0].name} must be at least 100 words.`,
          );
          return;
        }
      }

      if (c.items.length !== 0) {
        pref.push({
          project: c.items[0].id.toString(),
          notes: c.items[0].notes ?? "",
          rank,
        });
      }

      rank++;
    }

    // Updates the database
    await submitPreference(
      localStorage.getItem("token") ?? "",
      type,
      id,
      JSON.stringify({ proj_preferences: pref, is_draft: type === "group" }),
    );

    // Move to next part of form or exit from form
    if (isNext) {
      handleNext();
    } else if (type === "group") {
      navigate(`/group/profile/${id}`);
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
        {/* Auto Preferencer and Droppable of unassigned projects */}
        <div className="w-80 flex-none">
          <div className="card p-8 shadow-sm bg-base-100">
            <div className="card-body p-0">
              <h2 className="card-title font-medium mb-4">
                Wishlist{type === "group" ? "s" : ""}
              </h2>

              {/* Auto Preferencer */}
              {type === "group" && (
                <AutoProjectPreferencer
                  wishlists={wishlists}
                  wishlistHandler={setStudent}
                  autoHandler={autoPreference}
                />
              )}
              <p className="text-left my-3">
                {type === "group" ? "The" : "Your"} wishlist has{" "}
                {containers.length !== 0 &&
                  containers[containers.length - 1].items.length}{" "}
                projects
              </p>

              {/* Droppable of unassigned projects */}
              <SortableContext items={["droppable-origin"]}>
                <UnAllocatedCard>
                  {containers.length !== 0 &&
                    containers[containers.length - 1].items.map((i) => (
                      <SmallProjectCard
                        key={i.id}
                        id={i.id}
                        name={i.name}
                        isActive={currItem?.id === i.id}
                      />
                    ))}
                </UnAllocatedCard>
              </SortableContext>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="grow-8">
          <div className="card p-8 shadow-sm bg-base-100">
            <div className="card-body p-0">
              {/* Section Header */}
              <h2 className="card-title font-medium mb-4">Preferences</h2>

              {/* Preferences and Notes */}
              <SortableContext items={containers.map((i) => i.id)}>
                {containers.length !== 0 &&
                  containers.map((c, i) => {
                    if (c.id === "droppable-origin") {
                      return;
                    }
                    let name = undefined;
                    let notes = undefined;
                    const item = c.items[0];
                    if (item !== undefined) {
                      name = item.name;
                      notes = item.notes;
                    }

                    return (
                      <React.Fragment key={c.id}>
                        <PreferencedCard
                          id={c.id}
                          name={name}
                          rank={i + 1}
                          notes={notes}
                          handleChange={handleChange}
                          isActive={currItem?.id !== c.id}
                        >
                          {c.items.map((a) => (
                            <SmallProjectCard
                              key={a.id}
                              id={a.id}
                              name={a.name}
                              isActive={currItem?.id === a.id}
                            />
                          ))}
                        </PreferencedCard>
                      </React.Fragment>
                    );
                  })}
              </SortableContext>

              {/* Section Footer */}
              <div className="flex flex-row justify-end mt-4 gap-4">
                {type === "group" && (
                  <button
                    className="lt-btn lt-btn-hover"
                    onClick={() => handleUpdate(false)}
                  >
                    SAVE AND EXIT
                  </button>
                )}
                <button
                  className="lt-btn lt-btn-hover"
                  onClick={() => handleUpdate(true)}
                >
                  {type === "group" ? "NEXT" : "PUBLISH"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>
        {currItem && currItem.type === "item" && (
          <SmallProjectCard
            id={currItem.id}
            name={currItem.name}
            isDragging={true}
          />
        )}

        {currItem && currItem.type === "container" && (
          <PreferencedCard
            id={currItem.id}
            name={currItem.name}
            rank={containers.findIndex((c) => c.id === currItem.id) + 1}
            handleChange={() => {}}
            isActive={true}
            isDrag={true}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default ProjectPreferencer;
