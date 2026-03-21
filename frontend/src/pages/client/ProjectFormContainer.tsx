// ProjectFormContainer.tsx
import { useEffect, useState } from "react";
import Stepper from "../../components/Stepper";
import SuccessForm from "../LoginRegister/SuccessForm";
import ProjectOverviewForm from "../Project/ProjectOverviewForm";
import Page from "../../components/Layout-Nav/Page";
import { FormInputs, ProjectInfo, TermDatesInfo } from "../constants";
import {
  getClientQuestionaire,
  getTerms,
  postProject,
  updateProject,
} from "../../apiUtil";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface ProjectFormContainerProps {
  mode: "create" | "edit";
  courseId: string;
  token: string;
  projectId?: string;
  initialProjectData?: ProjectInfo;
}

/**
 * This component is used to create or edit a project.
 */
export default function ProjectFormContainer({
  mode,
  courseId,
  token,
  projectId,
  initialProjectData,
}: ProjectFormContainerProps) {
  const [current, setCurrent] = useState(1);
  const [termDates, setTermDates] = useState<TermDatesInfo>({});
  const [formData, setFormData] = useState<FormInputs[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = ["Project Overview", "Submit"];

  const loadCourseTerms = async () => {
    try {
      const { data } = await getTerms(token, courseId);
      setTermDates(data);
    } catch (err) {
      console.log("Error fetching available terms: ", err);
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await getClientQuestionaire(token, courseId);
      const formatted = response.data.map(
        (item: { def_client_questionnaire: FormInputs }) => {
          const form = item.def_client_questionnaire;

          let value = null;
          // Prefill from project data if available
          if (initialProjectData) {
            value = mapProjectToFieldValue(
              initialProjectData,
              form.label,
              form.id,
            );
          }

          return {
            id: form.id,
            input_type: form.input_type,
            label: form.label,
            value:
              form.input_type === "checkbox" || form.input_type === "radio"
                ? Array.isArray(value)
                  ? value
                  : []
                : (value ?? null),
            options: form.options?.length ? form.options : [],
          };
        },
      );

      setFormData(formatted);
    } catch (err) {
      toast.error("Cannot load the project creation form");
      console.error("Error loading questions", err);
    }
  };

  const mapProjectToFieldValue = (
    project: ProjectInfo,
    label: string,
    id: string,
  ) => {
    switch (label) {
      case "Project Name":
        return project.name;
      case "Offering Terms":
        return project.terms.map((t) => t.toString());
      case "Background":
        return project.background;
      case "Outcome":
        return project.outcomes;
      case "Project Description":
        return project.scope;
      case "Required Skills":
        return project.req_skills;
      case "Number of Groups":
        return project.capacity.toString();
      case "Category":
        return project.category;
      case "Product Areas":
        return project.areas;
      default:
        return project.responses.find((r) => r.question === id)?.answer ?? null;
    }
  };

  useEffect(() => {
    loadCourseTerms();
    loadQuestions();
  }, []);

  useEffect(() => {
    const awaitHandler = async () => {
      await handleSubmit("submitted");
    };

    if (current === 2) {
      awaitHandler();
    }
  }, [current]);

  const transformFormFields = (
    formFields: FormInputs[],
    status: "available" | "unavailable" | "submitted" | "draft",
  ) => {
    const payload: ProjectInfo = {
      name: initialProjectData?.name ?? "",
      clients: initialProjectData?.clients ?? [],
      groups: initialProjectData?.groups ?? [],
      is_allocated: initialProjectData?.is_allocated ?? false,
      status:
        initialProjectData?.status === "available" ||
        initialProjectData?.status === "unavailable"
          ? initialProjectData?.status
          : status,
      capacity: initialProjectData?.capacity ?? 0,
      category: initialProjectData?.category ?? "",
      course: courseId,
      terms: initialProjectData?.terms ?? [],
      areas: initialProjectData?.areas ?? [],
      background: initialProjectData?.background ?? "",
      scope: initialProjectData?.scope ?? "",
      req_skills: initialProjectData?.req_skills ?? "",
      outcomes: initialProjectData?.outcomes ?? "",
      date_created:
        initialProjectData?.date_created ??
        new Date().toISOString().slice(0, 10),
      date_modified: new Date().toISOString().slice(0, 10),
      attachments: initialProjectData?.attachments ?? [],
      responses: initialProjectData?.responses ?? [],
      proj_no: initialProjectData?.proj_no ?? null,
      subcourse: null,
      color: "",
    };

    formFields.forEach(({ id, label, value }) => {
      switch (label) {
        case "Project Name":
          payload.name = value?.toString() ?? "";
          break;
        case "Offering Terms":
          payload.terms = Array.isArray(value)
            ? value.map((term: string) => {
                return parseInt(term);
              })
            : [];
          break;
        case "Background":
          payload.background = value?.toString() ?? "";
          break;
        case "Outcome":
          payload.outcomes = value?.toString() ?? "";
          break;
        case "Project Description":
          payload.scope = value?.toString() ?? "";
          break;
        case "Required Skills":
          payload.req_skills = value?.toString() ?? "";
          break;
        case "Number of Groups":
          payload.capacity = Array.isArray(value)
            ? parseInt(value.join(""))
            : value
              ? parseInt(value)
              : 0;
          break;
        case "Category":
          payload.category = value?.toString() ?? "";
          break;
        case "Product Areas":
          payload.areas = Array.isArray(value) ? value : value ? [value] : [];
          break;
        default: {
          const newAnswer = value?.toString() ?? "";
          const existingResponse = payload.responses.find(
            (r) => r.question === id,
          );
          if (existingResponse) {
            existingResponse.answer = newAnswer;
          } else {
            payload.responses.push({
              question: id,
              answer: newAnswer,
            });
          }
          break;
        }
      }
    });
    return payload;
  };

  const handleSubmit = async (
    status: "available" | "unavailable" | "submitted" | "draft",
  ) => {
    const data = transformFormFields(formData, status);

    try {
      if (mode === "edit" && projectId) {
        await updateProject(token, projectId, data);
      } else {
        await postProject(token, data);
      }
    } catch (err) {
      console.error("Error submitting project", err);
      toast.error("Error occurs while submitting the project");
    }
  };

  const handleDraft = async () => {
    setLoading(true);
    await handleSubmit("draft");
    navigate(`/client/projects/${courseId}`);
    setLoading(false);
  };

  const handleNext = () => {
    setCurrent((prev) => prev + 1);
  };

  return (
    <Page
      title={mode === "edit" ? "Edit Project" : "Create New Project"}
      back={true}
      backRoute={`/client/projects/${courseId}`}
    >
      <div className="flex justify-center mt-15">
        <div className="bg-white py-8 px-20 rounded-sm inset-shadow-xs shadow-lg w-full">
          <Stepper current={current} steps={steps} />
          {loading ? (
            <div className="text-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : current === 1 ? (
            <ProjectOverviewForm
              handleNext={handleNext}
              formInputs={formData}
              setFormInputs={setFormData}
              handleDraft={handleDraft}
              mode={mode}
              status={initialProjectData?.status ?? "draft"}
              termDates={termDates}
            />
          ) : (
            <SuccessForm
              text="GO TO DASHBOARD"
              message="Project successfully created!"
              location={`/client/projects/${courseId}`}
            />
          )}
        </div>
      </div>
    </Page>
  );
}
