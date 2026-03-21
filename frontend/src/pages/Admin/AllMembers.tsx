import { useEffect, useState } from "react";
import { Classes, FilterType, Heading, Member, Statistic } from "../constants";
import StatisticsPage from "./StatisticsPage";
import {
  deleteMember,
  getAllSubcourseMembers,
  getUserData,
  isSubcourseActive,
} from "../../apiUtil";
import toast from "react-hot-toast";

/**
 * This page displays an overview of all members (students and staff)
 * in a subcourse.
 */
const AllMembers = () => {
  const cols: Heading[] = [
    {
      title: "Member Name",
      data: "name",
    },
    {
      title: "Role",
      data: "role",
    },
    {
      title: "Tutorial",
      data: "tutorials",
    },
    {
      title: "Email",
      data: "email",
    },
    {
      title: "id",
      data: "id",
    },
  ];

  const [data, setData] = useState<Member[]>([]);
  const [stats, setStats] = useState<Statistic[]>([]);
  const [myFilters, setMyFilters] = useState<FilterType[]>([]);
  const [active, setActive] = useState(false);

  const filterTutorial = (data: Member[], tutorial: string) => {
    return data.filter((m) => m.role === "student" && m.tutorials === tutorial);
  };
  const filterNoGroup = (data: Member[]) => {
    return data.filter((m) => m.role === "student" && m.group === null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const subcourse = localStorage.getItem("subcourse") || "";
    const fetchMembers = async () => {
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
        if (user.role === "course admin") {
          newFilters.push({
            title: "Not in a group",
            type: "group",
            filterFn: filterNoGroup,
          });
        }
        setMyFilters(newFilters);

        const res = await getAllSubcourseMembers(token, subcourse);
        const members = res.data;
        setData(members);
        let numStudents: number = 0;
        let numStaff: number = 0;
        for (const c of members) {
          if (c.role === "student") {
            numStudents += 1;
          } else {
            numStaff += 1;
          }
        }
        setStats([
          {
            title: "Students",
            value: numStudents,
          },
          {
            title: "Staff",
            value: numStaff,
          },
        ]);
      } catch (err) {
        console.error("Error fetching all members of course: ", err);
      }
    };

    const fetchActive = async () => {
      const res = await isSubcourseActive(token, subcourse);
      setActive(res.data.active);
    };

    fetchMembers();
    fetchActive();
  }, []);

  const manage = [
    {
      title: "Invite/Update Students",
      route: "/course/invite/student",
    },
    {
      title: "Invite/Update Tutors",
      route: "/course/invite/tutors",
    },
  ];

  const handleDelete = async (personData: Member) => {
    // backend call to api for deleting a member
    const subcourse = localStorage.getItem("subcourse") || "";
    const token = localStorage.getItem("token") || "";

    try {
      await deleteMember(token, subcourse, personData.id);
      // remove the member from the data
      const updatedData = data.filter((m) => m.id !== personData.id);
      setData(updatedData);

      toast.success("Member deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting member");
    }
  };

  return (
    <>
      <StatisticsPage
        title="Members"
        stats={stats}
        columns={cols}
        manage={!localStorage.getItem("tutor") && active ? manage : []}
        data={data}
        filterInfo={myFilters}
        onDelete={!localStorage.getItem("tutor") ? handleDelete : undefined}
      ></StatisticsPage>
    </>
  );
};

export default AllMembers;
