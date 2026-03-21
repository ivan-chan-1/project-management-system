import Papa from "papaparse";
import { getUserData } from "./apiUtil";
import {
  FullSubcourseData,
  StudentInfoSubcourse,
  StudentSubcourse,
  SubcourseReportData,
} from "./pages/constants";

export const generateReportCSV = async (
  token: string,
  data: FullSubcourseData,
) => {
  // generic course info
  const courseInfo = {
    name: data.name,
    code: data.code,
    year: data.year ?? "",
    term: data.term ?? "",
  };

  // student, group, project, client

  // Build an array of objects:
  // { student: "John Doe", group: "Group 1", project: "Project A", client: "Client X" }

  const reportData: SubcourseReportData[] = [];

  const students = new Set();

  // going through the students in groups first
  for (const group of data.groups) {
    const studentObj = {
      "Student Name": "",
      "Student ZID": "",
      Tutorial: group.tutorial,
      Group: group.name,
      Project: group.project?.name ?? "unallocated",
      "Client Name": "N/A",
      "Client Company": "N/A",
      "Client Email": "N/A",
    };

    // get client and project data
    if (group.project?.name) {
      const clientData = await getUserData(
        token,
        "client",
        group.project.clients[0],
      );
      studentObj["Client Name"] = clientData.data.name;
      studentObj["Client Company"] = clientData.data.company_name;
      studentObj["Client Email"] = clientData.data.email;
    }

    group.members.forEach((student: StudentInfoSubcourse) => {
      students.add(student.id);
      studentObj["Student Name"] = student.name;
      studentObj["Student ZID"] = student.zid;

      reportData.push({ ...studentObj });
    });
  }

  // going through students who are not in groups next
  data.students.forEach((student: StudentInfoSubcourse) => {
    if (!students.has(student.id)) {
      // find the tutorial that the student is in
      const student_subcourse = student.subcourses.find(
        (t: StudentSubcourse) => t.subcourse === data.id,
      );

      const studentObj = {
        "Student Name": student.name,
        "Student ZID": student.zid,
        Tutorial: student_subcourse ? student_subcourse.tutorial : "N/A",
        Group: "N/A",
        Project: "N/A",
        "Client Name": "N/A",
        "Client Company": "N/A",
        "Client Email": "N/A",
      };

      reportData.push({ ...studentObj });
    }
  });

  // creating the csv
  const studentCSV = Papa.unparse(reportData);

  const metadata = [
    [`Course Name:`, courseInfo.name],
    [`Course Code:`, courseInfo.code],
    [`Year:`, courseInfo.year],
    [`Term:`, courseInfo.term],
    [], // blank line before headers
  ]
    .map((row) => row.join(","))
    .join("\n");

  // adding the headers
  const fullCSV = `${metadata}\n${studentCSV}`;

  const blob = new Blob([fullCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${courseInfo.year}_${courseInfo.code}_report.csv`,
  );

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
