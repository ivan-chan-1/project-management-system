import { ChangeEvent, useEffect, useRef } from "react";
import ExperienceCard from "../../components/Student/ExperienceCard";
import StudentDetailsCard from "../../components/Student/StudentDetailsCard";
import StudentProjectsCard from "../../components/Student/StudentProjectsCard";
import { useState } from "react";

import {
  ProjectInfo,
  stubExpList,
  StudentPreference,
  StudentSubcourse,
} from "../constants";
import {
  getProjectsFromIds,
  getUserData,
  updateStudentDetails,
} from "../../apiUtil";
import Page from "../../components/Layout-Nav/Page";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

interface ProfileProp {
  mode: boolean;
}

interface Project {
  name: string;
  tags: string[];
}

/**
 * This page displays the profile of a student.
 * It allows the user to edit the profile if they are the owner of the profile.
 */
export default function StudentProfilePage({ mode }: ProfileProp) {
  const [editMode, setEditMode] = useState(mode);
  const [profileName, setProfileName] = useState("");
  const [zid, setZid] = useState("");
  const [year, setYear] = useState("");
  const [tutorial, setTutorial] = useState("");
  const [status, setStatus] = useState("In a group");
  const [details, setDetails] = useState(stubExpList);
  const [projects, setProjects] = useState<Project[]>([]);
  const [image, setImage] = useState<string | null>(null); // State to store the image URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [currSubcourse, setCurrSubcourse] = useState("");
  const id = localStorage.getItem("id") ?? "";
  const params = useParams();
  const studentId = params?.studentId ?? id;
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token") ?? "";
      // REDUX?
      setLoading(true);
      const subcourseId = localStorage.getItem("subcourse") ?? "";
      setCurrSubcourse(subcourseId);

      try {
        if (id === studentId) setIsMyProfile(true);

        const res = await getUserData(token, "student", studentId);
        let subcourse = null;
        let projects = null;
        if (subcourseId.length !== 0) {
          subcourse = res.data.subcourses.find(
            (s: StudentSubcourse) => s.subcourse === subcourseId,
          );

          const preferences = subcourse.preferences.map(
            (p: StudentPreference) => p.project,
          );
          const response = await getProjectsFromIds({ projects: preferences });
          projects = response.data.map((p: ProjectInfo) => ({
            name: p.name,
            tags: p.areas,
          }));
        }

        const data = {
          name: res.data.name,
          year: res.data.year ? res.data.year : "-",
          zid: res.data.zid,
          details: res.data.experiences,
          image: res.data.image ? res.data.image : null,
          status: !subcourse
            ? "N/A"
            : subcourse?.group
              ? "In a group"
              : "Not in a group",
          tutorial: subcourse?.tutorial ? subcourse.tutorial : "-",
          preferences: projects,
        };
        setProfileName(data.name);
        setYear(data.year);
        setZid(data.zid);
        setTutorial(data.tutorial);
        setStatus(data.status);
        setDetails(data.details);
        setImage(data.image);
        setProjects(data.preferences);
        localStorage.setItem("profile", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching data: ", error);
        toast.error("Cannot find the student in the database");
      }
      setLoading(false);
    };

    if (id) {
      fetchData();
    }
  }, [id, studentId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };

  const handleUpdate = async () => {
    const data = {
      subcourse: localStorage.getItem("subcourse") ?? "",
      year: year === "-" ? null : year,
      tutorial: tutorial,
      experiences: details,
    };

    try {
      await updateStudentDetails(localStorage.getItem("token") ?? "", data);
      toast.success("Update successful");
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Cannot update the profile");
    }
    setEditMode(false);
  };

  const handleMode = () => {
    setEditMode(true);
  };

  const editButton = () => {
    return (
      <button
        className="drk-btn drk-btn-hover"
        onClick={editMode === false ? handleMode : handleUpdate}
      >
        {editMode === false ? "EDIT" : "SAVE"}
      </button>
    );
  };

  return (
    <div
      data-theme="mytheme"
      className="min-w-screen min-h-screen bg-white text-center"
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
            <StudentDetailsCard
              editMode={editMode}
              profileName={profileName}
              year={year}
              zid={zid}
              setYear={setYear}
              tutorial={tutorial}
              setTutorial={setTutorial}
              status={status}
              image={image}
              file={fileInputRef}
              handleFile={handleFileChange}
            />
            <div className="w-2/3 gap-6 min-h-full flex flex-col">
              <ExperienceCard
                value={details}
                updateValue={setDetails}
                editMode={editMode}
              />
              {currSubcourse && <StudentProjectsCard projPrefs={projects} />}
            </div>
          </div>
        )}
      </Page>
    </div>
  );
}
