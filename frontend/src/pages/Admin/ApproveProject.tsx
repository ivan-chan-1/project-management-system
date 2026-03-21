import { useEffect, useState } from "react";
import Page from "../../components/Layout-Nav/Page";
import Table from "../../components/Table";
import { Heading } from "../constants";
import { getAllUnapprovedProjects } from "../../apiUtil";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

/**
 * This page allows course administrators to approve projects/
 */
export default function ApproveProject() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const headings: Heading[] = [
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
      title: "id",
      data: "id",
    },
  ];
  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem("token") || "";
      const subcourse = localStorage.getItem("subcourse") || "";
      try {
        const res = await getAllUnapprovedProjects(token, subcourse);
        setData(res.data);
      } catch (err) {
        if (isAxiosError(err)) {
          toast.error(err.response?.data["Error"]);
        }
      }
    };

    fetchProjects();
  }, []);
  return (
    <Page title="Approve Projects" back={true} backRoute="/admin/allprojects">
      <div className="flex flex-col gap-15 pt-10">
        <Table headings={headings} data={data} title="Unapproved Projects" />
      </div>
    </Page>
  );
}
