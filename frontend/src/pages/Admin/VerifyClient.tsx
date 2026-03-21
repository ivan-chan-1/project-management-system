import { useEffect, useState } from "react";
import Page from "../../components/Layout-Nav/Page";
import Table from "../../components/Table";
import { ClientInfo, Heading } from "../constants";
import { getAllClients } from "../../apiUtil";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

/**
 * This page allows admins to verify clients
 */
export default function VerifyClient() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const headings: Heading[] = [
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
      title: "id",
      data: "id",
    },
  ];
  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem("token") || "";
      const subcourse = localStorage.getItem("subcourse") || "";
      try {
        const res = await getAllClients(token, subcourse);
        const unverifiedClients = res.data.filter(
          (client: ClientInfo) => client.is_verified === false,
        );
        setData(unverifiedClients);
      } catch (err) {
        if (isAxiosError(err)) {
          toast.error(err.response?.data["Error"]);
        }
      }
    };

    fetchClients();
  }, []);
  return (
    <Page title="Verify Clients" back={true} backRoute="/admin/allclients">
      <div className="flex flex-col gap-15 pt-10">
        <Table headings={headings} data={data} title="Unverified Clients" />
      </div>
    </Page>
  );
}
