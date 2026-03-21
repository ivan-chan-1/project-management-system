import { useParams } from "react-router-dom";

import ProjectsCard from "../../components/Client/ProjectsCard";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import CompanyInfoCard from "../../components/Client/CompanyInfoCard";
import ProfileCard from "../../components/Client/ProfileCard";
import Page from "../../components/Layout-Nav/Page";
import {
  getProjectData,
  getUserData,
  rejectClient,
  updateClientData,
  verifyClient,
} from "../../apiUtil";
import { ClientInfo, ProjectInfo } from "../constants";
import toast from "react-hot-toast";

/**
 * This page displays the profile of a client.
 */
export default function ClientProfilePage() {
  const [companyName, setCompanyName] = useState("Undefined");
  const [name, setName] = useState("");
  const [abn, setAbn] = useState("XXX XXX");
  const [email, setEmail] = useState("xxxxxx@gmail.com");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("Undefined");
  const [hours, setHours] = useState("");
  const [details, setDetails] = useState("");
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [image, setImage] = useState<string | null>(null); // State to store the image URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const params = useParams();
  const token = localStorage.getItem("token") ?? "";
  const [loading, setLoading] = useState(false);

  // Fetches the client profile page loads all the data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") ?? "";
        const id = localStorage.getItem("id") ?? "";
        const clientId = params.clientId || id;
        const user = localStorage.getItem("user") ?? "";
        const res = await getUserData(token, "client", clientId);
        const client: ClientInfo = res.data;
        setSelectedClient(client);

        if (user === "client" && id === clientId) setIsMyProfile(true);
        setName(client.name);
        setCompanyName(client.company_name);
        setAbn(client.company_abn);
        setEmail(client.email);
        setPhone(client.phone);
        setHours(client.contact_hours);
        // TODO: setImage
        setAddress(client.company_address);
        setDetails(client.company_brief);
        setIsVerified(client.is_verified);
        // Fetch all projects in parallel
        const projectData = await Promise.all(
          client.projects.map(async (p: string) =>
            getProjectData(token, p).then((res) => res.data),
          ),
        );
        setProjects(projectData);
      } catch (error) {
        toast.error("Cannot find the projects of the client");
        console.error("Error fetching data: ", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [params.clientId]);

  // Update client profile when the edit button is clicked
  const updateClient = async () => {
    const id = localStorage.getItem("id") ?? "";
    const clientId = params.clientId || id;
    try {
      await updateClientData(
        token,
        {
          name: name,
          email: email,
          phone: phone,
          company_name: companyName,
          industry: selectedClient?.company_industry,
          company_abn: abn,
          hours: hours,
          is_verified: selectedClient?.is_verified,
          projects: selectedClient?.projects,
          courses: selectedClient?.courses,
          wishlist: selectedClient?.wishlist,
          preferences: selectedClient?.preferences,
          company_brief: details,
          company_address: address,
        },
        clientId,
      );
    } catch (err) {
      toast.error("Error updating your profile");
      console.log("Error updating client profile: ", err);
    }
  };

  // Handle the edit button click
  const handleToggleEdit = () => {
    if (editMode === true) {
      updateClient();
    }
    setEditMode((prev) => !prev);
  };

  // Show edit mode depending on if the user is currently editing or not
  const editButton = () => {
    return (
      <div className="btn drk-btn drk-btn-hover" onClick={handleToggleEdit}>
        {editMode === true ? "Save" : "Edit"}
      </div>
    );
  };

  // Handle profile photo and set for one load
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };

  // Handle the verification of the client
  const handleVerifyClient = async (status: boolean) => {
    const token = localStorage.getItem("token") || "";
    if (!selectedClient) return;
    if (status) {
      try {
        await verifyClient(token, selectedClient.id);
      } catch (err) {
        toast.error("Error while verifying client");
        console.log("Error verifying client: ", err);
      }
    } else {
      try {
        await rejectClient(token, selectedClient.id);
      } catch (err) {
        toast.error("Error while verifying client");
        console.log("Error verifying client: ", err);
      }
    }
  };

  return (
    <div
      data-theme="mytheme"
      className="min-w-screen min-h-screen bg-white text-left"
    >
      <Page
        title={"Profile"}
        back={true}
        extraContent={isMyProfile ? editButton() : null}
      >
        {loading ? (
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="flex flex-row gap-6 justify-center mt-5 min-h-150">
            <ProfileCard
              editMode={editMode}
              name={name}
              setName={setName}
              companyName={companyName}
              setCompanyName={setCompanyName}
              abn={abn}
              setAbn={setAbn}
              email={email}
              setEmail={setEmail}
              address={address}
              setAddress={setAddress}
              image={image}
              file={fileInputRef}
              handleFile={handleFileChange}
              phone={phone}
              setPhone={setPhone}
              isVerified={isVerified}
              changeIsVerified={handleVerifyClient}
            />
            <div className="w-2/3 gap-6 min-h-full flex flex-col">
              <CompanyInfoCard
                value={details}
                updateValue={setDetails}
                editMode={editMode}
              />
              <ProjectsCard projects={projects} />
            </div>
          </div>
        )}
      </Page>
    </div>
  );
}
