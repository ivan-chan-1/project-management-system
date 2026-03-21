import { useState } from "react";
import BackArrow from "../../assets/back.svg";
import { useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../../apiUtil";
import toast from "react-hot-toast";
import axios from "axios";

/**
 * This page allows the user to reset their password.
 */
function ForgotPassword() {
  const [email, setEmail] = useState("");
  const params = useParams();
  const user = params.user ?? "";
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Function to handle the reset password action - where you receive a code through email
  const handleReset = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      await resetPassword(email, user);
      const encodedEmail = encodeURIComponent(email);
      navigate(`/reset-password/verify/${user}/${encodedEmail}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        if (status === 404) {
          toast.error("Email not found. Please try again.");
        } else if (status === 400) {
          toast.error("Email could not send. Please try again.");
        } else {
          toast.error("An unknown error occurred. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div
      data-theme="mytheme"
      className="flex flex-col justify-center items-center min-h-screen w-screen bg-[#D5EEFF]"
    >
      <div className="bg-white p-8 rounded-sm shadow-md w-[80%] h-[80%] flex flex-col">
        <div
          className="float-left p-2 w-10 h-auto btn btn-ghost btn-circle"
          onClick={() => navigate("/login")}
        >
          <img src={BackArrow} alt="back" className="w-full" />
        </div>
        <div className="flex justify-center">
          <div className="w-[50%] py-30">
            <h1 className="text-left mb-8">Forgot Password?</h1>
            <div className="flex flex-col">
              <label htmlFor="email" className="mb-1 text-left text-[14px]">
                Please enter your email below:
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={email}
                placeholder="Email"
                className="border p-3 rounded mb-10 border-secondary"
                onChange={handleEmailChange}
                required
              />
            </div>
            <button
              className="drk-btn drk-btn-hover float-end"
              onClick={handleReset}
            >
              RESET PASSWORD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
