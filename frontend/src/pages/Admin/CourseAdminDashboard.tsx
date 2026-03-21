import DashboardDiv from "../../components/Admin/DashboardDiv";
import InsightsCard from "../../components/Admin/InsightsCard";
import Page from "../../components/Layout-Nav/Page";
import Shortcut, { ShortcutProps } from "../../components/Admin/Shortcut";
import { ChangeEvent, useEffect, useState } from "react";
import {
  addCourseLinks,
  getCourseLinks,
  getStaffDashboardStats,
  getSubcourseDetails,
} from "../../apiUtil";
import { Link, Statistic } from "../constants";
import Download from "../../assets/download.svg";
import Loading from "../../assets/loading.svg";
import { generateReportCSV } from "../../helpers";
import toast from "react-hot-toast";
import AddFunctionCard from "../../components/Group/AddFunctionCard";
import { isAxiosError } from "axios";
import { useSubcourse } from "../../hooks/SubcourseContext";

/**
 * This is the dashboard for a course staff (administrator or tutor)
 * and displays all summary information.
 */
const CourseAdminDashboard = () => {
  const [memberStats, setMemberStats] = useState<Statistic[]>([]);
  const [clientStats, setClientStats] = useState<Statistic[]>([]);
  const [projectStats, setProjectStats] = useState<Statistic[]>([]);
  const [groupStats, setGroupStats] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [link, setLink] = useState<Link>({ name: "", url: "", subcourse: "" });
  const { setSubcourseValue } = useSubcourse();
  let shortcuts: ShortcutProps[] = [];

  if (
    !localStorage.getItem("tutor") &&
    localStorage.getItem("user") === "staff"
  ) {
    shortcuts = [
      {
        title: "Course Settings",
        icon: "settings",
        route: "/editCourse",
      },
      {
        title: "Edit Allocations",
        icon: "groups",
        route: "/project/allocation",
      },
      {
        title: "Invite Students",
        icon: "invite",
        route: "/course/invite/student",
      },
    ];
  }

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const subcourse = localStorage.getItem("subcourse") || "";
    const fetchData = async () => {
      setLoading(true);
      try {
        const allStats = await getStaffDashboardStats(token, subcourse);
        setMemberStats([
          {
            title: "Students",
            value: allStats.data.number_students,
          },
          {
            title: "Staff",
            value: allStats.data.number_staff,
          },
        ]);
        setClientStats([
          {
            title: "Verified",
            value: allStats.data.verified_clients,
          },
        ]);
        setProjectStats([
          {
            title: "Available",
            value: allStats.data.available_projects,
          },
          {
            title: "Pending Approval",
            value: allStats.data.submitted_projects,
          },
        ]);
        setGroupStats([
          {
            title: "Project Allocated",
            value: allStats.data.allocated_groups,
          },
          {
            title: "Project Unallocated",
            value: allStats.data.unallocated_groups,
          },
        ]);
      } catch (err) {
        if (isAxiosError(err)) {
          toast.error(err.response?.data["Error"]);
        }
        return;
      }
    };
    fetchData();
    const fetchLinks = async () => {
      try {
        const res = await getCourseLinks(token, subcourse);
        setLinks(res.data);
      } catch (err) {
        toast.error("Failed to fetch course links");
        console.error("Failed to fetch course links:", err);
        return;
      }
    };
    fetchLinks();
    setLoading(false);
  }, []);

  const generateReport = async () => {
    setLoading(true);
    const token = localStorage.getItem("token") || "";
    const subcourse = localStorage.getItem("subcourse") || "";

    const res = await getSubcourseDetails(token, subcourse);

    generateReportCSV(token, res.data);
    setLoading(false);
  };

  const handleModal = () => {
    const modal = document.getElementById(
      "my_modal_3",
    ) as HTMLDialogElement | null;
    if (modal) {
      modal.showModal();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLink((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const addingShortcut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";
    const subcourse = localStorage.getItem("subcourse") || "";
    try {
      await addCourseLinks(token, {
        name: link.name,
        url: link.url,
        subcourse: subcourse,
      });
      setLinks((prevLinks) => [
        ...prevLinks,
        { name: link.name, url: link.url, subcourse: subcourse },
      ]);
      setLink({ name: "", url: "", subcourse: "" });
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      }
    }
    const modal = document.getElementById(
      "my_modal_3",
    ) as HTMLDialogElement | null;
    if (modal) {
      modal.close();
      document.getElementById("link_form") as HTMLFormElement | null;
    }
  };

  const handleBack = () => {
    localStorage.removeItem("subcourse");
    setSubcourseValue(null);
  };

  return (
    <Page
      title="Course Dashboard"
      back={true}
      backRoute="/dash"
      beforeBack={handleBack}
    >
      {loading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : (
        <>
          <div className="flex flex-col h-auto w-full">
            <div className="w-full my-15 lg:px-15 justify-between">
              <div className="text-2xl text-left mb-5">Manage</div>
              <div className="flex flex-row flex-wrap gap-4">
                {shortcuts.map((s, i) => {
                  return (
                    <Shortcut
                      key={i}
                      title={s.title}
                      icon={s.icon}
                      route={s.route}
                    />
                  );
                })}
                {links.map((link, index) => {
                  return (
                    <Shortcut
                      key={index}
                      title={link.name}
                      icon={link.name}
                      link={link.url}
                    />
                  );
                })}
                <AddFunctionCard name="Add Shortcut" onClick={handleModal} />
                {/* Modal should be OUTSIDE of the clickable div */}
                <dialog id="my_modal_3" className="modal">
                  <div className="modal-box w-100 p-8">
                    <div className="text-left text-lg mb-6">Add Links</div>
                    <fieldset className="text-left fieldset">
                      <legend className="block mt-6 text-[12px]">Name</legend>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Enter the link's name"
                        name="name"
                        value={link.name}
                        required
                        onChange={handleChange}
                      />
                    </fieldset>
                    <fieldset className="text-left fieldset mt-3">
                      <legend className="block mt-6 text-[12px]">Link</legend>
                      <input
                        type="text"
                        className="input w-full"
                        name="url"
                        value={link.url}
                        placeholder="Enter the link"
                        onChange={handleChange}
                        required
                      />
                    </fieldset>
                    <div className="flex flex-row justify-between mt-6">
                      <form method="dialog">
                        <button className="drk-btn drk-btn-hover">
                          CANCEL
                        </button>
                      </form>
                      <button
                        className="drk-btn drk-btn-hover"
                        onClick={addingShortcut}
                      >
                        ADD LINK
                      </button>
                    </div>
                  </div>
                </dialog>
              </div>
            </div>
          </div>

          <div className="flex flex-row flex-wrap gap-5 items-center mt-20 mb-5">
            <div className="text-2xl text-left lg:px-15">Insights</div>

            {!localStorage.getItem("tutor") &&
              (loading ? (
                <div className="btn btn-disabled border-0 hover:bg-secondary shadow-none text-[#676767] text-base font-normal px-5">
                  <img src={Loading} className="w-5 mr-2" />
                  Generating...
                </div>
              ) : (
                <div
                  className="btn btn-ghost border-0 hover:bg-secondary shadow-none text-[#676767] text-base font-normal px-5"
                  onClick={generateReport}
                >
                  <img src={Download} className="w-5 mr-2" />
                  Generate report
                </div>
              ))}
          </div>
          <div className="flex flex-row flex-wrap my-15 lg:px-15 justify-between gap-10">
            <DashboardDiv>
              <InsightsCard
                title="Members"
                route="/admin/allstudents"
                stats={memberStats}
              />
            </DashboardDiv>
            <DashboardDiv>
              <InsightsCard
                title="Groups"
                route="/admin/allgroups"
                stats={groupStats}
              />
            </DashboardDiv>
          </div>
          <div className="flex flex-row flex-wrap my-15 lg:px-15 justify-between gap-10">
            <DashboardDiv>
              <InsightsCard
                title="Projects"
                route="/admin/allprojects"
                stats={projectStats}
              />
            </DashboardDiv>
            <DashboardDiv>
              <InsightsCard
                title="Clients"
                route="/admin/allclients"
                stats={clientStats}
              />
            </DashboardDiv>
          </div>
        </>
      )}
    </Page>
  );
};

export default CourseAdminDashboard;
