import { useEffect, useState } from "react";
import Page from "../../components/Layout-Nav/Page";
import Stepper from "../../components/Stepper";
import SuccessForm from "../LoginRegister/SuccessForm";
import CourseDetailsForm from "./CourseDetailsForm";
import { createCourse } from "../../apiUtil";
import toast from "react-hot-toast";
import { termDates } from "../constants";
import { isAxiosError } from "axios";

export interface termStructure {
  [key: string]: number;
}

interface FormData {
  name: string;
  termDates: termDates;
  description: string;
  code: string;
}

/**
 * This page allows administrators to create a course.
 */
function CreateCourse() {
  const [current, setCurrent] = useState(1);
  const steps = ["Course Details", "Submit"];
  const [formData, setFormData] = useState<FormData>({
    name: "",
    termDates: {},
    description: "",
    code: "",
  });

  const handleNext = () => {
    setCurrent((prevCurrent: number) => prevCurrent + 1);
  };

  const putCourse = async (token: string) => {
    try {
      await createCourse(token, formData);
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data["Error"]);
      }
    }
  };

  useEffect(() => {
    if (current === steps.length) {
      const token = localStorage.getItem("token") ?? "";
      putCourse(token);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, steps.length]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (e.target.name === "structure") {
      setFormData({
        ...formData,
        termDates: {}, // wipe termDates on structure change
      });
    } else if (e.target.name === "termDates") {
      const dataTag = e.target.getAttribute("data-tag");
      if (dataTag !== null) {
        const term = parseInt(dataTag);
        const updatedTermDates = {
          ...formData.termDates,
          [term]: e.target.value,
        };
        setFormData({
          ...formData,
          termDates: updatedTermDates,
        });
      }
    } else if (e.target.name === "termCheckbox") {
      const dataTag = e.target.getAttribute("data-tag");
      const term = parseInt(dataTag || "0");

      const updatedTermDates = { ...formData.termDates };

      if ((e.target as HTMLInputElement).checked) {
        updatedTermDates[term] = updatedTermDates[term] || "";
      } else {
        delete updatedTermDates[term];
      }

      setFormData({
        ...formData,
        termDates: updatedTermDates,
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  return (
    <div>
      <Page title="Create New Course" back={true} backRoute="/dash">
        <div className="flex justify-center mt-15">
          <div className="bg-white py-8 px-20 rounded-sm inset-shadow-xs shadow-lg w-full">
            <Stepper current={current} steps={steps} />
            {current === 1 ? (
              <CourseDetailsForm
                handleChange={handleChange}
                handleNext={handleNext}
                formInputs={formData}
              />
            ) : (
              <SuccessForm
                text="GO TO DASHBOARD"
                message={"Your course has been successfully created"}
                location={`/dash`}
              />
            )}
          </div>
        </div>
      </Page>
    </div>
  );
}

export default CreateCourse;
