import { useEffect, useState } from "react";
import {
  Classes,
  FilterType,
  GroupStudentInfo,
  Heading,
  Statistic,
} from "../constants";
import StatisticsPage from "./StatisticsPage";
import {
  getAllGroups,
  getNumStudentsUnallocated,
  getUserData,
  isSubcourseActive,
} from "../../apiUtil";
import toast from "react-hot-toast";

/**
 * This page displays an overview about all groups in subcourse,
 * its members and the number of members, as well as its tutorial.
 */
const AllGroups = () => {
  const cols: Heading[] = [
    {
      title: "Group Name",
      data: "name",
    },
    {
      title: "Tutorial",
      data: "tutorial",
    },
    {
      title: "Count",
      data: "count",
    },
    {
      title: "Members",
      data: "members",
    },
    {
      title: "id",
      data: "groupId",
    },
  ];

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<Statistic[]>([]);
  const [myFilters, setMyFilters] = useState<FilterType[]>([]);
  const [active, setActive] = useState(false);

  // TODO: Chnage to fetch group size
  const filterNotFullGroup = (data: GroupStudentInfo[]) => {
    return data.filter((g) => g.members.length !== 6);
  };

  const filterFullGroup = (data: GroupStudentInfo[]) => {
    return data.filter((g) => g.members.length === 6);
  };

  const filterTutorial = (data: GroupStudentInfo[], tutorial: string) => {
    return data.filter((g) => g.tutorial === tutorial);
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const subcourse = localStorage.getItem("subcourse") || "";
    const fetchGroups = async () => {
      const id = localStorage.getItem("id") || "";

      try {
        const userData = await getUserData(token, "staff", id);
        const user = userData.data;
        const myTutorials =
          user.classes.find((item: Classes) => item.subcourse === subcourse)
            ?.tutorials || [];
        const newFilters = myTutorials.map((t: string) => ({
          title: t,
          type: t,
          filterFn: filterTutorial,
        }));
        newFilters.push(
          {
            title: "Available groups",
            type: "notfullgroup",
            filterFn: filterNotFullGroup,
          },
          {
            title: "Full groups",
            type: "fullgroup",
            filterFn: filterFullGroup,
          },
        );
        setMyFilters(newFilters);

        const res = await getAllGroups(token, subcourse);
        let fullGroups = 0;
        let notFullGroups = 0;

        const formattedData = res.data.map((g: GroupStudentInfo) => {
          const memberCount = g.members.length;
          if (memberCount === 6) {
            fullGroups += 1;
          } else {
            notFullGroups += 1;
          }

          return {
            groupId: g.id,
            name: g.name,
            tutorial: g.tutorial,
            count: `${memberCount}/6`,
            bio: g.bio,
            members: g.members.map((m) => ({
              id: m.id,
              name: m.name,
            })),
          };
        });
        setData(formattedData);

        const numUnallocated = await getNumStudentsUnallocated(
          token,
          subcourse,
        );

        setStats([
          {
            title: "Unallocated Students",
            value: numUnallocated.data,
          },
          {
            title: "Available Groups",
            value: notFullGroups,
          },
          {
            title: "Full Groups",
            value: fullGroups,
          },
        ]);
      } catch (err) {
        toast.error("Error fetching all groups of course");
        console.error("Error fetching all groups of course: ", err);
      }
    };

    const fetchActive = async () => {
      const res = await isSubcourseActive(token, subcourse);
      setActive(res.data.active);
    };

    fetchGroups();
    fetchActive();
  }, []);

  const manage = [
    {
      title: "Edit Student-Group Allocation",
      route: "/student/allocation",
    },
  ];

  return (
    <StatisticsPage
      title="Groups"
      stats={stats}
      columns={cols}
      manage={active ? manage : []}
      data={data}
      filterInfo={myFilters}
    ></StatisticsPage>
  );
};

export default AllGroups;
