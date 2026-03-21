import StudentInfoCard from "../../components/Student/StudentInfoCard";
import SearchBar from "../../components/SearchBar";
import { useEffect, useState } from "react";
import Heart from "../../assets/heart.svg";
import {
  DefaultGroupInfo,
  StudentSubcourse,
  ProjectGroupInfo,
} from "../constants";
import SingleProjectCard from "../../components/Student/SingleProjectCard";
import { useNavigate } from "react-router-dom";
import {
  getAllSubcourseProjects,
  getGroupData,
  getUserData,
  searchProject,
} from "../../apiUtil";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

/**
 * This page displays the dashboard for students.
 */
export default function StudentDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ProjectGroupInfo[]>();
  const [allProjects, setAllProjects] = useState<ProjectGroupInfo[]>();
  const [groupData, setGroupData] = useState(DefaultGroupInfo);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  useEffect(() => {
    // Fetches all projects that are available in this subcourse
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") ?? "";
      const subcourseId = localStorage.getItem("subcourse") ?? "";
      const user = localStorage.getItem("user") ?? "";
      const userId = localStorage.getItem("id") ?? "";
      try {
        const res = await getAllSubcourseProjects(token, subcourseId);
        setAllProjects(res.data);

        const userData = await getUserData(token, user, userId);

        const groupId = userData.data.subcourses?.find(
          (subcourse: StudentSubcourse) => subcourse.subcourse === subcourseId,
        )?.group;

        if (groupId) {
          const groupData = await getGroupData(token, groupId);
          setGroupData(groupData.data);
        }
      } catch (error) {
        toast.error("Cannot find group");
        console.error("Error fetching data: ", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const search = async () => {
    const token = localStorage.getItem("token") ?? "";
    const subcourseId = localStorage.getItem("subcourse") ?? "";
    setSearchLoading(true);
    if (searchQuery === "") {
      setProjects(allProjects);
    } else {
      try {
        const { data } = await searchProject(token, subcourseId, searchQuery);
        setProjects(data);
      } catch (err) {
        if (isAxiosError(err)) {
          toast.error(err.response?.data["Error"]);
        }
      }
    }
    setSearchLoading(false);
  };

  const handleWishList = () => {
    navigate("/student/preference");
  };

  return (
    <div
      data-theme="mytheme"
      className="w-screen h-auto m-0 p-0 bg-white text-left"
    >
      {loading ? (
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="w-screen h-auto px-25 mb-25">
          <div className="w-full flex flex-row justify-between gap-25 text-left h-14 my-8">
            <StudentInfoCard groupData={groupData} />
          </div>
          <div className="flex w-full flex-col justify-center text-center mt-25 gap-15">
            <h2 className="text-4xl text-center">Find a project</h2>
            <div className="w-full flex justify-center">
              <div className="flex flex-row gap-6 w-6/9 justify-center">
                <SearchBar
                  handleSearch={search}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                <div
                  id="wish-list"
                  className="btn btn-circle bg-white shadow-md border-secondary p-3 h-auto w-13"
                  onClick={handleWishList}
                >
                  <img src={Heart} className="w-full" />
                </div>
              </div>
            </div>
            {searchLoading ? (
              <div className="text-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <>
                <div className="grid w-full gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {projects
                    ? projects.map((p) => {
                        return (
                          <SingleProjectCard
                            key={p.id}
                            id={p.id || ""}
                            name={p.name}
                            desc={p.background}
                            color={p.color}
                          />
                        );
                      })
                    : allProjects?.map((p) => {
                        return (
                          <SingleProjectCard
                            key={p.id}
                            id={p.id}
                            name={p.name}
                            desc={p.background}
                            color={p.color}
                          />
                        );
                      })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
