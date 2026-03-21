import React from "react";
import Page from "../../components/Layout-Nav/Page";
import PageCard from "../../components/Layout-Nav/PageCard";
import { useNavigate } from "react-router-dom";
import ProjectBox from "./ProjectBox";
import { ProjectInfo } from "../constants";
import { getClientProjects, getUserData } from "../../apiUtil";
import toast from "react-hot-toast";
import { useSubcourse } from "../../hooks/SubcourseContext";

// Fetches the list of projects for a client
export default function ClientProjectList() {
  const [selectedTab, setSelectedTab] = React.useState("available");
  const [allProjects, setAllProjects] = React.useState<ProjectInfo[]>();
  const [projects, setProjects] = React.useState<ProjectInfo[]>();
  const buttons = ["AVAILABLE", "UNAVAILABLE", "SUBMITTED", "DRAFT", "ALL"];
  const [isVerified, setIsVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { setSubcourseValue } = useSubcourse();

  // Set the subcourse value when the component mounts
  React.useEffect(() => {
    setLoading(true);
    const fetchProjects = async () => {
      try {
        const clientId = localStorage.getItem("id") ?? "";
        const course = localStorage.getItem("subcourse") ?? "";
        const token = localStorage.getItem("token") || "";
        const clientData = await getUserData(token, "client", clientId);
        setIsVerified(clientData.data.is_verified);

        const { data: clientProjects } = await getClientProjects(
          token,
          clientId,
          course,
        );
        setAllProjects(clientProjects);
      } catch (err) {
        toast.error("Cannot load the client's projects");
        console.log("Error fetching client projects: ", err);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  React.useEffect(() => {
    if (selectedTab === "all") {
      setProjects(allProjects);
    } else {
      const selectedProjects = allProjects?.filter(
        (project) => project.status === selectedTab,
      );
      setProjects(selectedProjects);
    }
  }, [allProjects, selectedTab]);

  const navigate = useNavigate();
  const handleTabChange = (btn: string) => {
    setSelectedTab(btn.toLowerCase());
  };

  const handleBack = () => {
    localStorage.removeItem("subcourse");
    setSubcourseValue(null);
  };

  // Render the dashboard with project boxes
  const dashboard = () => {
    return (
      <div className="pt-10">
        {loading ? (
          <span className="loading loading-spinner loading-lg"></span>
        ) : (
          <>
            {isVerified ? (
              <>
                <div className="flex flex-wrap space-x-4 mb-6 space-y-4">
                  {buttons.map((btn) => {
                    return (
                      <button
                        key={btn}
                        className={`btn btn-md rounded-xl !font-bold border-0 w-33 h-11
                  ${selectedTab === btn.toLowerCase() ? "drk-btn" : "lt-btn"}
                `}
                        onClick={() => handleTabChange(btn)}
                      >
                        {btn}
                      </button>
                    );
                  })}
                  <button
                    id="createProject"
                    className="btn drk-btn rounded-xl lg:ml-auto bg-primary border-0 text-white h-11"
                    onClick={() => navigate("/client/project/create")}
                  >
                    CREATE PROJECT
                  </button>
                </div>
                <PageCard>
                  {projects && projects.length > 0 ? (
                    projects.map((p) => (
                      <ProjectBox
                        key={p.id}
                        projId={p.id!}
                        projNum={p.proj_no!}
                        projName={p.name}
                        projStatus={p.status}
                        lastModified={p.date_modified}
                      />
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No projects to show at this stage.
                    </div>
                  )}
                </PageCard>
              </>
            ) : (
              <div className="px-16 py-5 shadow-md inset-shadow-sm bg-white">
                <div className="flex flex-col items-center justify-center gap-2 h-full">
                  <h2 className="text-xl font-semibold text-center">
                    You are not verified yet.
                  </h2>
                  <p className="text-md text-center">
                    Please contact the course administration for more
                    information.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  return (
    <Page
      title={"My Projects"}
      back={true}
      backRoute="/dash"
      beforeBack={handleBack}
    >
      {dashboard()}
    </Page>
  );
}
