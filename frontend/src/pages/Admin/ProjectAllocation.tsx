import { useEffect, useState } from "react";
import Allocator from "../../components/Admin/Allocator";
import Page from "../../components/Layout-Nav/Page";
import { GroupStudentInfo, ProjectGroupInfo } from "../constants";
import { getAllGroups, getAllSubcourseProjects } from "../../apiUtil";

/**
 * The interface for project allocation
 *
 * Accessible by course admins only
 */
const ProjectAllocation = () => {
  const [projects, setProjects] = useState<ProjectGroupInfo[]>([]);
  const [groups, setGroups] = useState<GroupStudentInfo[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const subcourseId = localStorage.getItem("subcourse") ?? "";

    const fetchProjectData = async () => {
      const res = await getAllSubcourseProjects(token, subcourseId);
      setProjects(res.data);
    };

    const fetchGroups = async () => {
      const res = await getAllGroups(token, subcourseId);
      setGroups(res.data);
    };

    fetchProjectData();
    fetchGroups();
  }, []);

  return (
    <Page
      title="Allocate Groups to Projects"
      back={true}
      backRoute="/admin/allprojects"
    >
      <Allocator type="group" projects={projects} groups={groups} />
    </Page>
  );
};

export default ProjectAllocation;
