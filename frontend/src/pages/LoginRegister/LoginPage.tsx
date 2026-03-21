import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../apiUtil";
import toast from "react-hot-toast";

interface LoginPageProps {
  handleSuccess: (token: string, user: string, id: string) => void;
  user: string;
  setUser: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * This page is used for logging in.
 */
export default function LoginPage({
  handleSuccess,
  user,
  setUser,
}: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value.trim(),
    }));
  };

  // NOTE: FOR TESTING PURPOSES commented out code is to make sure that
  // we are able to test the mailersend as UNSW has a blocker that prevents
  // emails to be sent to the domain
  // const emailReg = /^z[0-9]{7}@ad.unsw.edu.au$/;
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // if (user !== "client" && !formData.email.match(emailReg)) {
    //   toast.error("Email must be a UNSW email");
    //   return;
    // }
    try {
      const response = await loginUser(formData, user);

      handleSuccess(
        response.data.access_token,
        response.data.user,
        response.data.id,
      );
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Email or password is incorrect");
      setFormData((prev) => ({ ...prev, password: "" }));
    }
  };

  return (
    <div
      data-theme="mytheme"
      className="flex flex-col items-center min-h-screen w-screen bg-[#D5EEFF]"
    >
      {/* Container to control overlapping */}
      <div className="w-full pt-[10%] flex justify-center">
        <div className="relative flex flex-col items-center w-[80%]">
          {/* Tabs */}
          <div className="flex justify-center gap-4">
            <button
              className={`sm:w-38 w-20 ${user === "client" ? "bg-white color-[#1794FA]" : "drk-btn"}`}
              onClick={() => setUser("client")}
            >
              Client
            </button>
            <button
              className={`sm:w-38 w-25 ${user === "student" ? "bg-white color-[#1794FA]" : "drk-btn"}`}
              onClick={() => setUser("student")}
            >
              Student
            </button>
            <button
              className={`sm:w-38 w-25 ${user === "staff" ? "bg-white color-[#1794FA] " : "drk-btn"}`}
              onClick={() => setUser("staff")}
            >
              Staff
            </button>
          </div>

          {/* Login Form (Overlapping the buttons) */}
          <div className="absolute top-15 w-full px-6 py-20 bg-white shadow-lg sm:-translate-y-6 -translate-y-3 z-10 flex justify-center items-center">
            <div className="flex flex-col w-[70%] md:w-[30%] sm:w-[50%] text-center">
              <h1 className="mb-4 text-lg text-left capitalize">Login</h1>
              <form className="text-left " onSubmit={handleSubmit}>
                <label className="block text-[12px]">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder={
                    user === "client"
                      ? "john@gmail.com"
                      : "z1234567@ad.unsw.edu.au"
                  }
                  className="input w-full"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <label className="block mt-6 text-[12px]">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Please enter password"
                  className="input w-full"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <div
                  className="mt-2 text-[12px] text-primary cursor-pointer"
                  onClick={() => {
                    navigate(`/forgot-password/${user}`);
                  }}
                >
                  Forgot Password?
                </div>
                <div className="flex justify-start mt-6 mb-10">
                  <button type="submit" className="drk-btn drk-btn-hover">
                    LOGIN
                  </button>
                </div>
                <div className="text-left mt-4">
                  <p className="text-[12px]">
                    Don't have an account?{" "}
                    <span
                      onClick={() => navigate(`/register?user=${user}`)}
                      className="text-primary cursor-pointer"
                    >
                      Register here
                    </span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
