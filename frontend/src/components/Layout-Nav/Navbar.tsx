import { useNavigate } from "react-router-dom";
import Profile from "../../assets/profile.svg";
import Home from "../../assets/home.svg";
import Chat from "../../assets/chat.svg";
import { useSubcourse } from "../../hooks/SubcourseContext";

const Navbar = ({ handleLogout }: { handleLogout: () => void }) => {
  const navigate = useNavigate();
  const { subcourse, setSubcourseValue } = useSubcourse();
  const user = localStorage.getItem("user");

  const handleViewProfile = () => {
    if (user === "student") {
      navigate("/student/profile");
    } else if (user === "client") {
      navigate("/client/profile");
    }
  };

  const handleHomeClick = () => {
    localStorage.removeItem("subcourse");
    setSubcourseValue(null);
    navigate("/dash");
  };

  const handleChatClick = () => {
    navigate("/chat");
  };

  return (
    <div data-theme="mytheme">
      <div className="w-full h-[177px]"></div>
      <nav className="w-full absolute top-0 right-0 left-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="177"
          viewBox="0 0 1512 177"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M-184.306 -280L1573.37 -203.94L1556.9 176.613C661.597 34.8315 161.951 272.721 -200.773 100.553L-184.306 -280Z"
            fill="#D5EEFF"
          />
        </svg>

        <div className="absolute top-10 w-full flex justify-between items-center px-20">
          <div className="flex items-center">
            <h1 className="px-5 font-bold">DRAGONFRUIT</h1>
            <div className="border-1 border-gray-400 h-10"></div>
            <h1 className="px-5 font-bold">
              {subcourse ? subcourse.name : "DASHBOARD"}
            </h1>
          </div>
          <div className="flex items-center gap-10">
            {subcourse && (
              <button
                className="border-none bg-transparent m-1"
                onClick={handleChatClick}
              >
                <img src={Chat} alt="chat" />
              </button>
            )}
            <button
              className="border-none bg-transparent m-1"
              onClick={handleHomeClick}
            >
              <img src={Home} alt="home" />
            </button>
            <div className="dropdown dropdown-hover dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="m-1 border-none btn bg-transparent hover:shadow-none px-0"
              >
                <img src={Profile} alt="profile"></img>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content bg-base-100 rounded-box z-1 w-40 p-2 shadow-sm"
              >
                {user !== "staff" && (
                  <li>
                    <button
                      className="!text-[14px]"
                      onClick={handleViewProfile}
                    >
                      View Profile
                    </button>
                  </li>
                )}
                <li>
                  <button className="!text-[14px]" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
