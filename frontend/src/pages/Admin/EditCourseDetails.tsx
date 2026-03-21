import { useEffect, useState } from "react";
import Page from "../../components/Layout-Nav/Page";
import { CourseDetailsCard } from "../../components/Admin/CourseDetailsCard";
import { GroupRulesCard } from "../../components/Admin/GroupRulesCard";
import FormBuilderPage from "./FormBuilderPage";
import {
  activateSubcourse,
  archiveSubcourse,
  canActivateSubcourse,
  getCourseDetails,
  getSubcourseDetails,
  isArchived,
  isSubcourseActive,
  updateParentDates,
  updateSubcourseDetails,
} from "../../apiUtil";
import {
  FormField,
  Subcourse,
  TermDatesData,
  TermDatesInfo,
} from "../constants";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

/**
 * This page allows admins to edit all course settings.
 */
const EditCourseDetails = () => {
  const dateRangeRegex = /^\d{2}-\d{2}-\d{4} to \d{2}-\d{2}-\d{4}$/;
  const [dateError, setDateError] = useState(false);
  const [course, setCourse] = useState<Subcourse>({
    name: "",
    code: "",
    term: 0,
    max_group_size: 0,
    client_questionnaire: [],
    project_preference_form: [],
    is_default: false,
    parent_course: "",
    preference_release: false,
  });
  const [parentTermDates, setParentTermDates] = useState<TermDatesInfo>({});
  const [loading, setLoading] = useState(false);
  const [archive, setArchive] = useState(false);
  const [active, setActive] = useState(false);
  const [activatable, setActivatable] = useState(true);
  const [defaultForms, setDefaultForms] = useState<{
    client: FormField[];
    project: FormField[];
  }>({
    client: [],
    project: [],
  });

  const token = localStorage.getItem("token") ?? "";
  const subcourse_id = localStorage.getItem("subcourse") ?? "";

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const subcourse_id = localStorage.getItem("subcourse") ?? "";
    const getAllDetails = async () => {
      try {
        const res = await getSubcourseDetails(token, subcourse_id);
        const current = res.data;
        setCourse({
          name: current.name,
          code: current.code,
          term: current.term,
          max_group_size: current.max_group_size,
          client_questionnaire: current.client_questionnaire,
          project_preference_form: current.project_preference_form,
          is_default: false,
          parent_course: current.parent_course,
          preference_release: current.preference_release,
        });
        const { data } = await getCourseDetails(token, current.parent_course);
        setDefaultForms({
          client: data.def_client_questionnaire,
          project: data.def_project_preference_form,
        });
        setParentTermDates(data.term_dates);
      } catch (error) {
        if (isAxiosError(error)) {
          toast.error(error.response?.data["Error"]);
        } else {
          toast.error("Error: " + error);
        }
      }
    };

    const fetchSubcourseState = async () => {
      const archiveRes = await isArchived(token, subcourse_id);
      const activeRes = await isSubcourseActive(token, subcourse_id);
      const activatableRes = await canActivateSubcourse(token, subcourse_id);
      setArchive(archiveRes.data.archived);
      setActive(activeRes.data.active);
      setActivatable(activatableRes.data.active);
    };

    getAllDetails();
    fetchSubcourseState();
  }, []);

  const [selected, setOpenSelection] = useState("");
  const toggleSection = (title: string) => {
    setOpenSelection(title); // Collapse if same section clicked
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateSubcourseDetails(
        token,
        subcourse_id, // Keep this separate for URL
        course,
      );

      const dateData: TermDatesData = {
        course_id: course.parent_course,
        term_dates: parentTermDates,
      };
      await updateParentDates(token, dateData);
      toast.success("Updated successfully.");
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      } else {
        toast.error("Error updating details. Try Again.");
      }
    }
    setLoading(false);

    setCourse((prev) => ({
      ...prev,
      is_default: false,
    }));
  };

  const handleParentTermChange = (term: string, newDate: string) => {
    setParentTermDates({ ...parentTermDates, [term]: newDate });
    if (!newDate.match(dateRangeRegex)) {
      setDateError(true);
    } else {
      setDateError(false);
    }
  };

  const menuLists = [
    {
      title: "Course Details",
      content: course ? (
        <CourseDetailsCard
          name={course.name}
          courseCode={course.code}
          term={course.term}
          isReleased={course.preference_release}
          handleUpdate={(type, value) => {
            setCourse((prev) => ({
              ...prev,
              [type]: value,
            }));
          }}
        />
      ) : (
        <></>
      ),
    },
    {
      title: "Parent Course Term Dates",
      content: (
        <div className="card bg-transparent rounded-sm">
          <div className="card-body p-0">
            <div className="text-left">
              <div className="form-control mb-2 space-y-4">
                {Object.keys(parentTermDates).map((k: string) => {
                  return (
                    <div key={k} className="grid grid-cols-4">
                      <label className="label text-black col-span-1 justify-center">
                        <span className="label-text text-right">Term {k}:</span>
                      </label>
                      <input
                        type="text"
                        name={`term-${k}`}
                        value={parentTermDates[k] || ""}
                        placeholder="Type here"
                        onChange={(e) =>
                          handleParentTermChange(k, e.target.value)
                        }
                        className="input col-start-2 col-span-2"
                      />
                    </div>
                  );
                })}
                {dateError && (
                  <div className="grid text-red-500 text-[13px] grid-cols-4">
                    <p className="col-start-2 col-span-2">
                      All dates must match "DD-MM-YYYY to DD-MM-YYYY" exactly
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Group Rules",
      content: course ? (
        <GroupRulesCard
          groupSize={course.max_group_size}
          handleUpdate={(value) => {
            setCourse({
              ...course,
              max_group_size: value,
            });
          }}
        />
      ) : (
        <></>
      ),
    },
    {
      title: "Form Builder",
      content: (
        <FormBuilderPage
          client={course.client_questionnaire}
          project={course.project_preference_form}
          handleUpdate={(type, value) => {
            setCourse((prev) => ({
              ...prev,
              [type]: value,
            }));
          }}
          defaultForms={defaultForms}
        />
      ),
    },
  ];

  const handleArchive = async () => {
    try {
      await archiveSubcourse(token, subcourse_id);
      toast.success("Subcourse archived");
      setArchive(true);
    } catch {
      toast.error("Error archiving course");
    }
  };

  const handleActivate = async () => {
    try {
      await activateSubcourse(token, subcourse_id);
      toast.success("Subcourse activated");
      setActive(true);
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      } else {
        toast.error("Error updating activating.");
      }
    }
  };

  const getToolTip = () => {
    if (active) {
      return "You have activated the course";
    } else if (archive) {
      return "This is an archived course. It cannot be activated";
    } else if (!activatable) {
      return "There can only be one active subcourse per course";
    } else {
      return "Activate to start course";
    }
  };
  return (
    <Page
      title="Course Settings"
      back={true}
      backRoute={`/admin/dashboard/${subcourse_id}`}
    >
      {loading ? (
        <span className="loading loading-spinner center loading-lg"></span>
      ) : (
        <>
          <div className="flex flex-row justify-between mt-8">
            <div className="flex flex-row justify-between w-56">
              <button
                className="red-btn red-btn-hover drk-btn-disabled"
                onClick={() => {
                  const dialog = document.getElementById(
                    "archive_modal",
                  ) as HTMLDialogElement | null;
                  dialog?.showModal();
                }}
                disabled={archive}
              >
                ARCHIVE
              </button>
              <div className="tooltip" data-tip={getToolTip()}>
                <button
                  className="green-btn green-btn-hover drk-btn-disabled"
                  onClick={() => {
                    const dialog = document.getElementById(
                      "activate_modal",
                    ) as HTMLDialogElement | null;
                    dialog?.showModal();
                  }}
                  disabled={archive || active || !activatable}
                >
                  ACTIVATE
                </button>
              </div>
            </div>
            <button
              className="drk-btn drk-btn-hover drk-btn-disabled"
              onClick={() => {
                handleUpdate();
              }}
              disabled={archive}
            >
              SAVE
            </button>

            {/* Activate Modal */}
            <dialog id="activate_modal" className="modal">
              <div className="modal-box text-left">
                <h3 className="text-lg">Activate Subcourse</h3>
                <p className="py-8 text-sm">
                  Once activated, the subcourse will be visible to students and
                  projects made available. This action cannot be changed.
                </p>
                <div className="flex flex-row justify-between">
                  <form method="dialog">
                    <button className="lt-btn lt-btn-hover">CANCEL</button>
                  </form>
                  <form method="dialog">
                    <button
                      className="green-btn green-btn-hover"
                      onClick={handleActivate}
                    >
                      ACTIVATE
                    </button>
                  </form>
                </div>
              </div>
            </dialog>

            {/* Archive Modal */}
            <dialog id="archive_modal" className="modal">
              <div className="modal-box text-left">
                <h3 className="text-lg text-red-600">Archive Subcourse</h3>
                <p className="py-8 text-sm">This action cannot be changed.</p>
                <div className="flex flex-row justify-between">
                  <form method="dialog">
                    <button className="lt-btn lt-btn-hover">CANCEL</button>
                  </form>
                  <form method="dialog">
                    <button
                      className="red-btn red-btn-hover"
                      onClick={handleArchive}
                    >
                      ARCHIVE
                    </button>
                  </form>
                </div>
              </div>
            </dialog>
          </div>
          <div className="flex flex-row mt-5 gap-7">
            <div className="rounded-lg shadow-lg self-start inset-shadow-2xs ">
              <ul className="menu bg-transparent rounded-box w-56 ">
                {menuLists.map((item, i) => (
                  <li key={i}>
                    <span
                      className={`p-2 block text-black ${
                        selected === item.title
                          ? "bg-gray-200"
                          : "hover:bg-gray-200"
                      }`}
                      onClick={() => toggleSection(item.title)}
                    >
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 justify-start">
              {selected !== null ? (
                <div className="space-y-2 ">
                  {menuLists.map((item, i) => (
                    <div
                      key={i}
                      className=" collapse collapse-arrow join-item bg-transparent"
                    >
                      <input
                        type="checkbox"
                        name="course-settings"
                        checked={selected === item.title}
                        onChange={() => toggleSection(item.title)}
                      />
                      <div className="collapse-title ">
                        <div className="text-left text-xl text-black">
                          {item.title}
                        </div>
                      </div>
                      <div className="collapse-content">{item.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="collapse collapse-arrow join-item bg-transparent">
                  <input
                    type="checkbox"
                    name="course-settings"
                    checked={true}
                    onChange={() => toggleSection(selected)}
                  />
                  <div className="collapse-title text-black">{selected}</div>
                  <div className="collapse-content">
                    {menuLists.find((item) => item.title === selected)?.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Page>
  );
};

export default EditCourseDetails;
