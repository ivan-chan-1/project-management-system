import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProject } from "../../apiUtil";
import ProjectFormContainer from "./ProjectFormContainer";
import { ProjectInfo } from "../constants";
import toast from "react-hot-toast";

/**
 * This page allows the client to edit a project.
 */
export default function EditProject() {
  const { projId } = useParams();
  const token = localStorage.getItem("token") ?? "";
  const courseId = localStorage.getItem("subcourse") ?? "";
  const [project, setProject] = useState<ProjectInfo | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await getProject(token, projId ?? "");
        setProject(res.data);
      } catch (err) {
        toast.error("Error while loading project information");
        console.error("Error fetching project: ", err);
      }
    };

    loadProject();
  }, [projId]);

  if (!project) return <div>Loading...</div>;

  return (
    <ProjectFormContainer
      mode="edit"
      courseId={courseId}
      token={token}
      projectId={projId ?? ""}
      initialProjectData={project}
    />
  );
}
