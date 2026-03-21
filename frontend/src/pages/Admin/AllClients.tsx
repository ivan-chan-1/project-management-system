import { useEffect, useState } from "react";
import { Heading, Statistic } from "../constants";
import StatisticsPage from "./StatisticsPage";
import { getAllClients, isSubcourseActive } from "../../apiUtil";
import toast from "react-hot-toast";

/**
 * This page displays an overview about all clients in the parent course
 * both verified and unverified, as well as their projects.
 */
const AllClients = () => {
  const cols: Heading[] = [
    {
      title: "Client Name",
      data: "name",
    },
    {
      title: "Role",
      data: "role",
    },
    {
      title: "Company",
      data: "company_name",
    },
    {
      title: "Status",
      data: "is_verified",
    },
    {
      title: "Email",
      data: "email",
    },
    {
      title: "Projects",
      data: "projects",
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

    const fetchClients = async () => {
      try {
        const res = await getAllClients(token, subcourse);
        setData(res.data);
        let approved: number = 0;
        let unapproved: number = 0;
        for (const c of res.data) {
          if (c.is_verified === true) {
            approved += 1;
          } else {
            unapproved += 1;
          }
        }
        setStats([
          {
            title: "Approved",
            value: approved,
          },
          {
            title: "Unapproved",
            value: unapproved,
          },
        ]);
      } catch (err) {
        toast.error("Error while loading client information");
        console.log("Error fetching all clients: ", err);
      }
    };

    const fetchActive = async () => {
      const res = await isSubcourseActive(token, subcourse);
      setActive(res.data.active);
    };

    fetchClients();
    fetchActive();
  }, []);

  const manage = [
    {
      title: "Verify Clients",
      route: "/admin/client/verify",
    },
    {
      title: "Approve Projects",
      route: "/",
    },
  ];

  return (
    <StatisticsPage
      title="Clients"
      stats={stats}
      columns={cols}
      manage={!localStorage.getItem("tutor") && active ? manage : []}
      data={data}
    ></StatisticsPage>
  );
};

export default AllClients;
