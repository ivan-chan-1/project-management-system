import Page from "../../components/Layout-Nav/Page";
import InfoBox from "../../components/Project/InfoBox";
import { CourseInfo, stubCourseInfo } from "../constants";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { clientApply, getCourseDetails } from "../../apiUtil";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ConfirmModal";

// This page allows the client to view a course and apply to be a client
export default function CourseProfile() {
  const params = useParams();
  const courseId = params.courseId ?? "";
  const [course, setCourse] = useState<CourseInfo>(stubCourseInfo);
  const [user, setUser] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const foundUser = localStorage.getItem("user") ?? "";
        setUser(foundUser);
        const id = localStorage.getItem("id") || "";
        const token = localStorage.getItem("token") ?? "";

        const res = await getCourseDetails(token, courseId);
        const fetchedCourse: CourseInfo = res.data;
        setCourse(fetchedCourse);
        setIsEnrolled(fetchedCourse.clients.some((c) => c === id));
      } catch (err) {
        toast.error("Course cannot be found in database");
        console.log("Error fetching project data: ", err);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleApply = async (apply: boolean) => {
    const token = localStorage.getItem("token") || "";
    if (apply) {
      try {
        await clientApply(token, courseId);
        setIsEnrolled(true);
      } catch (err) {
        toast.error("Error applying for course");
        console.log("Error applying for course: ", err);
      }
    }
  };

  const view = () => {
    return (
      <div className="flex flex-row justify-between pt-10 pb-16">
        <div className="flex flex-col space-y-8 w-8/13">
          <InfoBox
            title="Overview"
            content={course?.description || "Unavailable"}
            initialHeight="25rem"
          />
        </div>
        <div className="flex flex-col space-y-2 w-4/13 px-8 py-7 h-auto text-left inset-shadow-sm shadow-lg">
          <h2 className="text-2xl text-left mb-4">Offering Terms</h2>
          <div className="flex flex-row flex-wrap lg:flex-nowrap justify-between gap-3">
            <div
              className={`p-3 text-sm font-bold 
              ${
                course?.terms.includes(1)
                  ? "bg-[#1794FA] text-white"
                  : "bg-[#D9D9D9] text-black"
              }`}
            >
              FEB-APR
            </div>
            <div
              className={`p-3 text-sm font-bold 
              ${
                course?.terms.includes(2)
                  ? "bg-[#1794FA] text-white"
                  : "bg-[#D9D9D9] text-black"
              }`}
            >
              JUN-AUG
            </div>
            <div
              className={`p-3 text-sm font-bold 
              ${
                course?.terms.includes(3)
                  ? "bg-[#1794FA] text-white"
                  : "bg-[#D9D9D9] text-black"
              }`}
            >
              SEP-DEC
            </div>
          </div>
          <div className="divider"></div>
          {user === "client" && !isEnrolled && (
            <>
              <button
                className="drk-btn drk-btn-hover"
                onClick={() => {
                  const modal = document.getElementById(
                    "true_modal",
                  ) as HTMLDialogElement | null;
                  modal?.showModal();
                }}
              >
                Apply to be a Client
              </button>
              <ConfirmModal
                title="Register to be a client"
                message={`Would you like to apply for ${course.code}: ${course.name}? This will notify the relevant course administration.`}
                confirm={true}
                confirmText="Apply"
                successMessage={`Application sent. The course administration for ${course.code}: ${course.name} will be in touch shortly.`}
                onConfirm={handleApply}
                onDone={() => {
                  setIsEnrolled(true);
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Page
      title={`${course?.code}: ${course?.name}`}
      back={true}
      backRoute="/dash"
    >
      {view()}
    </Page>
  );
}
