import { useEffect, useState } from "react";
import Page from "../../components/Layout-Nav/Page";
import Table from "../../components/Table";
import { useNavigate } from "react-router-dom";
import { getAllGroups, getStudentTutorial } from "../../apiUtil";
import { FilterType, GroupStudentInfo } from "../constants";
import toast from "react-hot-toast";

export interface Group {
  groupId: string;
  groupName: string;
  tutorial: string;
  count: string;
  bio: string;
  members: string[];
  isMine: boolean;
}

/**
 * This page displays all the groups a student can join.
 */
function GroupsPage() {
  const headings = [
    { title: "Group Name", data: "groupName" },
    { title: "Tutorial", data: "tutorial" },
    { title: "Count", data: "count" },
    { title: "Bio", data: "bio" },
    { title: "Members", data: "members" },
  ];

  const [groupData, setGroupData] = useState<Group[]>([]);
  const [studentTutorial, setStudentTutorial] = useState<string>("");
  const navigate = useNavigate();

  // const selectedCourseId = useAppSelector((state) => state.course.selectedCourseId);
  const selectedCourseId = localStorage.getItem("subcourse") || "";

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("token") || "";
      const userId = localStorage.getItem("id") || "";
      const subcourse = localStorage.getItem("subcourse") || "";
      if (!selectedCourseId) {
        console.warn("No course selected, skipping API call");
        return;
      }

      try {
        const res = await getAllGroups(token, selectedCourseId);
        const formattedData = res.data.map((g: GroupStudentInfo) => ({
          groupId: g.id,
          groupName: g.name,
          tutorial: g.tutorial,
          count: `${g.members.length}/6`, // TODO: change to fetch group size
          bio: g.bio,
          members: g.members.map((m) => {
            return {
              id: m.id,
              name: m.name,
            };
          }),
          isMine: g.members.find((m) => m.id === userId) !== undefined,
        }));
        setGroupData(formattedData);

        const userTutorial = await getStudentTutorial(token, userId, subcourse);
        setStudentTutorial(userTutorial.data);
      } catch (error) {
        console.error("Error fetching data: ", error);
        toast.error("Error fetching group data");
      }
    };

    if (selectedCourseId) {
      (async () => {
        await getData();
      })();
    }
  }, [selectedCourseId]);

  const handleJoinGroup = (group: Group) => {
    navigate(`/group/profile/${group.groupId}`);
  };

  const filterMyTutorial = (data: Group[]) => {
    return data.filter((g) => g.tutorial === studentTutorial);
  };

  // TODO: Change to fetch group size
  const filterGroupAvailable = (data: Group[]) => {
    return data.filter((g: Group) => g.members.length !== 6);
  };

  const studentGroupFilters: FilterType[] = [
    {
      title: "My Tutorial",
      type: "tutorial",
      filterFn: filterMyTutorial,
    },
    {
      title: "Available groups",
      type: "capacity",
      filterFn: filterGroupAvailable,
    },
  ];

  return (
    <div>
      <Page
        title="Groups"
        back={true}
        backRoute={`/student/dashboard/${localStorage.getItem("subcourse")}`}
      >
        <div className="mt-10">
          <Table
            headings={headings}
            data={groupData}
            title="All Groups"
            onJoinClick={handleJoinGroup}
            filterInfo={studentGroupFilters}
          ></Table>
        </div>
      </Page>
    </div>
  );
}

export default GroupsPage;
