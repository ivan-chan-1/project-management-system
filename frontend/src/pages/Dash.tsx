import { useNavigate } from "react-router-dom";
import Page from "../components/Layout-Nav/Page";
import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard";
import { CourseType } from "./constants";
import { getSubcourses } from "../apiUtil";
import { SubcourseInfo } from "./constants";
import { useSubcourse } from "../hooks/SubcourseContext";
import toast from "react-hot-toast";

/**
 * This page displays the dashboard view of all courses the user is enrolled in.
 */
export default function Dash({ user }: { user: string }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseType[]>([]);
  const { setSubcourseValue } = useSubcourse();
  const [loading, setLoading] = useState(false);
  // call api to get all subcourses
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token") ?? "";
      const user = localStorage.getItem("user") ?? "";
      setLoading(true);
      try {
        const res = await getSubcourses(token, user);
        if (res.data == undefined) {
          throw new Error("Data is undefined");
        }
        const subcourses: CourseType[] = res.data.map((s: SubcourseInfo) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          desc: s.description,
          is_archived: s.is_archived || null,
          color: s.color,
        }));
        setCourses(subcourses);
      } catch (error) {
        toast.error("Error fetching data:" + error);
        // console.error(error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const joinCourse = () => {
    return (
      <button
        className="drk-btn drk-btn-hover"
        onClick={() => navigate("/client/allCourses")}
      >
        JOIN COURSE
      </button>
    );
  };

  const createCourse = () => {
    return (
      <>
        <button
          className="drk-btn drk-btn-hover"
          onClick={() => {
            const modal = document.getElementById(
              "my_modal_2",
            ) as HTMLDialogElement | null;
            if (modal) {
              modal.showModal();
            }
          }}
        >
          CREATE COURSE
        </button>
        <dialog id="my_modal_2" className="modal">
          <div className="modal-box flex flex-col gap-8">
            <h3 className="font-bold text-lg">Create a course</h3>
            <button
              onClick={() => navigate("/admin/course/create")}
              className="drk-btn drk-btn-hover"
            >
              CREATE NEW COURSE
            </button>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/admin/subcourse/create")}
                className="drk-btn drk-btn-hover"
              >
                CREATE SUBCOURSE
              </button>
              <p className="text-[12px]">(from an existing course)</p>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </>
    );
  };

  const extraButton =
    user === "client" ? (
      joinCourse()
    ) : user === "staff" && !localStorage.getItem("tutor") ? (
      createCourse()
    ) : (
      <></>
    );

  const handleClick = (c: CourseType) => {
    localStorage.setItem("subcourse", c.id);
    setSubcourseValue({ id: c.id, name: c.code });

    if (user === "client") {
      navigate(`/client/projects/${c.id}`);
    } else if (user === "student") {
      navigate(`/student/dashboard/${c.id}`);
    } else if (user === "staff" || user === "tutor") {
      navigate(`/admin/dashboard/${c.id}`);
    }
  };

  return (
    <>
      <Page title={"My Courses"} back={false} extraContent={extraButton}>
        {loading ? (
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            <div className="pt-10 grid w-full gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.length === 0 ? (
                <div className="w-full flex justify-center">
                  <p className="text-gray-400">You currently have no courses</p>
                </div>
              ) : courses ? (
                courses.map((c) => {
                  if (c.is_archived == null || !c.is_archived) {
                    return (
                      <CourseCard
                        key={c.id}
                        props={{
                          name: c.name,
                          code: c.code,
                          desc: c.desc,
                          color: c.color,
                        }}
                        handleClick={() => handleClick(c)}
                      />
                    );
                  } else return;
                })
              ) : (
                "Loading courses..."
              )}
            </div>
          </>
        )}
      </Page>
      <div data-theme="mytheme" className="w-screen h-auto m-0 px-25 mb-25">
        <p className="mt-15 text-4xl text-left mb-10">Archived</p>
        <div className="grid w-full gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => {
            if (c.is_archived) {
              return (
                <CourseCard
                  key={c.id}
                  props={{
                    name: c.name,
                    code: c.code,
                    desc: c.desc,
                    color: c.color,
                  }}
                  handleClick={() => handleClick(c)}
                />
              );
            } else return;
          })}
        </div>
      </div>
    </>
  );
}
