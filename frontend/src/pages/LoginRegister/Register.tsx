import React, { useState } from "react";
import BackArrow from "../../assets/back.svg";
import Stepper from "../../components/Stepper";
import { useLocation, useNavigate } from "react-router-dom";
import StandardForm from "./StandardForm";
import ClientForm from "./ClientForm";
import SuccessForm from "./SuccessForm";
import { registerUser } from "../../apiUtil";
import toast from "react-hot-toast";

export interface FormData {
  user: string;
  firstName: string;
  lastName: string;
  email: string;
  [type: string]: string;
  zid: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companyABN: string;
  industry: string;
  location: string;
  contactHours: string;
}

/**
 * Register page for the application.
 */
function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const user = queryParams.get("user");
  const [current, setCurrent] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    user: user ? user : "",
    firstName: "",
    lastName: "",
    email: "",
    zid: "",
    phone: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyABN: "",
    industry: "",
    location: "",
    contactHours: "",
  });
  const steps =
    user === "client"
      ? ["Your details", "Company Details", "Submit"]
      : ["Your details", "Submit"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    let step = current;
    if (
      (step === 1 && user !== "client") ||
      (step === 2 && user === "client")
    ) {
      handleRegister();
    } else {
      step += 1;
    }
    setCurrent(step);
  };

  const handleBack = () => {
    setCurrent((prevCurrent: number) => prevCurrent - 1);
  };

  const handleRegister = async () => {
    try {
      await registerUser(formData, user ? user : "");
      toast.success("Registration successful.");
      setCurrent(current + 1);
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error(`Registration failed. Try again. Invalid email or inputs`);
      if (user === "client") {
        setCurrent(current - 1);
      }
    }
  };
  return (
    <div
      data-theme="mytheme"
      className="min-h-screen w-screen bg-[#D5EEFF] flex flex-col items-center justify-center"
    >
      <header className="w-[80%] flex flex-col mb-6 text-left">
        <h2 className="my-12 font-bold text-4xl text-primary">Dragonfruit</h2>
        <div className="flex items-center gap-2 text-left">
          <div
            className=" p-2 w-10 h-auto btn btn-ghost btn-circle"
            onClick={() => navigate("/login")}
          >
            <img src={BackArrow} alt="back" className="w-full" />
          </div>
          <h2 className="text-xl">Create an Account</h2>
        </div>
      </header>
      <div className="bg-white p-8 rounded-sm shadow-md w-[80%]">
        <Stepper current={current} steps={steps}></Stepper>
        <div className="h-[600px]">
          {current === 1 ? (
            <StandardForm
              handleChange={handleChange}
              handleNext={handleNext}
              formInputs={formData}
              user={user ? user : ""}
            />
          ) : current === 2 && user === "client" ? (
            <ClientForm
              handleChange={handleChange}
              handleNext={handleNext}
              handleBack={handleBack}
              formInputs={formData}
            />
          ) : (
            <SuccessForm
              text="LOGIN"
              message="Your account has been created!"
              location="/login"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
