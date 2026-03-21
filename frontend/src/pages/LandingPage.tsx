import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * This component displays the landing page of the application.
 * It checks if a user is already logged in and redirects them to the dashboard if they are.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dash");
    }
  }, [navigate]);

  return (
    <div
      data-theme="mytheme"
      className="flex flex-col w-screen h-screen bg-base-200 p-30"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-4xl text-primary font-extrabold">Dragonfruit</h2>
        <button
          className="drk-btn font-bold"
          onClick={() => navigate("/login")}
        >
          SIGNUP / LOGIN
        </button>
      </div>
      <div className="w-full h-full flex justify-center flex-col items-start">
        <p className="text-2xl mb-20">
          A tool to maximise the entire workflow of capstone projects
        </p>

        <h2 className="text-5xl mb-8">Find your project 👋</h2>
        <button className="drk-btn w-35" onClick={() => navigate("/login")}>
          FIND
        </button>
      </div>
    </div>
  );
}
