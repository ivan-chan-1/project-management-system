import { useEffect, useState } from "react";
import Allocator from "../../components/Admin/Allocator";
import Page from "../../components/Layout-Nav/Page";
import { GroupStudentInfo, StudentInfo } from "../constants";
import { getAllGroups, getAllStudents, getTutorialGroups } from "../../apiUtil";

/**
 * The interface for student allocation
 *
 * Accessible by staff only
 */
const StudentAllocation = () => {
  const [groups, setGroups] = useState<GroupStudentInfo[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [tutorial, setTutorial] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const subcourseId = localStorage.getItem("subcourse") ?? "";

    const fetchGroups = async () => {
      const res = await getAllGroups(token, subcourseId);
      setGroups(res.data);
    };

    const fetchStudents = async () => {
      const res = await getAllStudents(token, subcourseId);
      setStudents(res.data);
    };

    const fetchTutorialGroups = async () => {
      const res = await getTutorialGroups(token, subcourseId);
      setTutorial(res.data);
    };

    fetchGroups();
    fetchStudents();
    fetchTutorialGroups();
  }, []);

  return (
    <Page
      title="Allocate Students to Groups"
      back={true}
      backRoute="/admin/allgroups"
    >
      <Allocator
        type="student"
        groups={groups}
        students={students}
        tutorials={tutorial}
      />
    </Page>
  );
};

export default StudentAllocation;
