import { useEffect, useState } from "react";
import {
  FilterType,
  Heading,
  ProjectWithAllInfo,
  Statistic,
} from "../constants";
import StatisticsPage from "./StatisticsPage";
import { getAllSubcourseProjects, isSubcourseActive } from "../../apiUtil";
import toast from "react-hot-toast";

/**
 * This page displays all projects in a subcourse.
 */
const AllProjects = () => {
  const cols: Heading[] = [
    {
      title: "Project Name",
      data: "name",
    },
    {
      title: "Clients",
      data: "clients",
    },
    {
      title: "Type",
      data: "category",
    },
    {
      title: "Groups",
      data: "groups",
    },
    {
      title: "id",
      data: "id",
    },
  ];

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<Statistic[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const subcourse = localStorage.getItem("subcourse") || "";

    const fetchProjects = async () => {
      try {
        const res = await getAllSubcourseProjects(token, subcourse);
        let unallocated = 0;
        const formattedData = res.data.map((g: ProjectWithAllInfo) => {
          if (!g.is_allocated) {
            unallocated += 1;
          }

          return {
            id: g.id,
            name: g.name,
            clients: g.clients.map((c) => ({
              id: c.id,
              name: c.name,
            })),
            groups: g.groups?.map((g) => ({
              id: g.id,
              name: g.name,
            })),
            category: g.category,
          };
        });
        setData(formattedData);

        setStats([
          {
            title: "Unallocated Projects",
            value: unallocated,
          },
          {
            title: "Problems Flagged",
            value: 0,
          },
        ]);
      } catch (err) {
        toast.error("Error while fetching all members of course");
        console.log("Error fetching all members of course: ", err);
      }
    };

    const fetchArchive = async () => {
      const res = await isSubcourseActive(token, subcourse);
      setActive(res.data.active);
    };

    fetchProjects();
    fetchArchive();
  }, []);

  let manage: { title: string; route: string }[] = [];

  if (
    !localStorage.getItem("tutor") &&
    localStorage.getItem("user") === "staff"
  ) {
    manage = [
      {
        title: "Approve Projects",
        route: "/admin/project/approve",
      },
      {
        title: "Edit Group-Project Allocation",
        route: "/project/allocation",
      },
    ];
  } else if (
    localStorage.getItem("tutor") &&
    localStorage.getItem("user") === "staff"
  ) {
    manage = [
      {
        title: "Edit Group-Project Allocation",
        route: "/project/allocation",
      },
    ];
  }

  const filterNoGroup = (data: ProjectWithAllInfo[]) => {
    return data.filter((m) => m.groups.length === 0);
  };

  const adminFilters: FilterType[] = [
    {
      title: "Not allocated to group(s)",
      type: "allocated",
      filterFn: filterNoGroup,
    },
  ];

  return (
    <StatisticsPage
      title="Projects in Subcourse"
      stats={stats}
      columns={cols}
      manage={active ? manage : []}
      data={data}
      filterInfo={adminFilters}
    ></StatisticsPage>
  );
};

export default AllProjects;
