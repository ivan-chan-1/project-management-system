import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginRegister/LoginPage";
import { useEffect, useState } from "react";
import Register from "./pages/LoginRegister/Register";
import ForgotPassword from "./pages/LoginRegister/ForgotPassword";
import VerifyPin from "./pages/LoginRegister/VerifyPin";
import StudentAllocation from "./pages/Admin/StudentAllocation";
import ProjectAllocation from "./pages/Admin/ProjectAllocation";
import StudentPreference from "./pages/Student/StudentPreference";
import GroupPreference from "./pages/Groups/GroupPreference";
import GroupsPage from "./pages/Groups/GroupsPage";
import FindCourse from "./pages/client/FindCourse";
import Dash from "./pages/Dash";
import ClientProfilePage from "./pages/client/ClientProfilePage";
import StudentProfilePage from "./pages/Student/StudentProfilePage";
import StudentDashboardPage from "./pages/Student/StudentDashboardPage";
import GroupProfilePage from "./pages/Groups/GroupProfilePage";
import ClientDashboard from "./pages/client/ClientProjectList";
import NewProject from "./pages/client/NewProject";
import ViewProject from "./pages/Project/ViewProject";
import EditProject from "./pages/client/EditProject";
import Navbar from "./components/Layout-Nav/Navbar";
import CourseAdminDashboard from "./pages/Admin/CourseAdminDashboard";
import { getUserData } from "./apiUtil";
import CreateCourse from "./pages/Admin/CreateCourse";
import CreateSubcourse from "./pages/Admin/CreateSubcourse";
import EditCourseDetails from "./pages/Admin/EditCourseDetails";
import GroupWishlistPage from "./pages/Groups/GroupWishlistPage";
import Chat from "./pages/Communication/Chat";
import AllMembers from "./pages/Admin/AllMembers";
import AllClients from "./pages/Admin/AllClients";
import AllGroups from "./pages/Admin/AllGroups";
import AllProjects from "./pages/Admin/AllProjects";
import CourseProfile from "./pages/Course/CourseProfile";
import VerifyClient from "./pages/Admin/VerifyClient";
import ApproveProject from "./pages/Admin/ApproveProject";
import InviteMembers from "./pages/Admin/InviteMembers";
import AllocatedProjectPage from "./pages/Groups/AllocatedProjectPage";
import { Toaster } from "react-hot-toast";
import { useSubcourse } from "./hooks/SubcourseContext";

function App() {
  const navigate = useNavigate();
  const { setSubcourseValue } = useSubcourse();

  // handle token stuff here, i.e. useEffect if user is already logged in
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? storedUser : "student";
  });

  // handle a token and whether they are student, client or staff
  const handleNewToken = async (newToken: string, user: string, id: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", user);
    localStorage.setItem("id", id);
    const res = await getUserData(newToken, user, id);
    setToken(newToken);

    if (user === "staff" && res.data.role === "tutor") {
      localStorage.setItem("tutor", "true");
    }
    setUser(user);
    navigate("/dash");
  };

  const handleLogout = () => {
    localStorage.clear();
    setSubcourseValue(null);
    setToken("");
    setUser("student");
    navigate("/");
  };

  useEffect(() => {
    if (token && ["/login", "/register"].includes(location.pathname)) {
      navigate("/dash");
    }
    if (
      !token &&
      !(
        ["/login", "/register", `/forgot-password/${user}`].includes(
          location.pathname,
        ) || location.pathname.startsWith("/reset-password")
      )
    ) {
      navigate("/");
    }
  }, [token, navigate, user]);

  return (
    <>
      {token && <Navbar handleLogout={handleLogout} />}
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/dash" /> : <LandingPage />}
        />
        <Route path="/project/allocation" element={<ProjectAllocation />} />
        <Route path="/student/allocation" element={<StudentAllocation />} />
        <Route path="/student/preference" element={<StudentPreference />} />
        <Route
          path="/group/preference/:groupId"
          element={<GroupPreference />}
        />

        <Route path="/editCourse" element={<EditCourseDetails />} />

        <Route
          path="/login"
          element={
            <LoginPage
              handleSuccess={handleNewToken}
              user={user}
              setUser={setUser}
            />
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password/:user" element={<ForgotPassword />} />
        <Route
          path="/reset-password/verify/:user/:encodedEmail"
          element={<VerifyPin />}
        />
        <Route path="/allgroups" element={<GroupsPage />} />
        <Route
          path="/admin/dashboard/:courseId"
          element={<CourseAdminDashboard />}
        />

        <Route path="/dash" element={<Dash user={user} />} />
        <Route path="/client/allCourses" element={<FindCourse />} />
        <Route
          path="/client/profile/:clientId?"
          element={<ClientProfilePage />}
        />
        <Route
          path="/student/profile/:studentId?"
          element={<StudentProfilePage mode={false} />}
        />
        <Route
          path="/student/dashboard/:courseId"
          element={<StudentDashboardPage />}
        />
        <Route
          path="/group/:groupId/:projectId"
          element={<AllocatedProjectPage />}
        />
        <Route path="/group/profile/:groupId" element={<GroupProfilePage />} />
        <Route
          path="/client/projects/:courseId"
          element={<ClientDashboard />}
        />
        <Route path="/client/project/create" element={<NewProject />} />
        <Route path="/project/:projId/view" element={<ViewProject />} />
        <Route path="/course/:courseId/view" element={<CourseProfile />} />
        <Route path="/client/:projId/edit" element={<EditProject />} />

        <Route path="/admin/course/create" element={<CreateCourse />} />
        <Route
          path="/admin/subcourse/create"
          element={<CreateSubcourse />}
        ></Route>
        <Route path="/admin/client/verify" element={<VerifyClient />} />
        <Route path="/admin/project/approve" element={<ApproveProject />} />
        <Route
          path="/group/wishlists/:groupId"
          element={<GroupWishlistPage />}
        />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin/allstudents" element={<AllMembers />} />
        <Route path="/admin/allclients" element={<AllClients />} />
        <Route path="/admin/allgroups" element={<AllGroups />} />
        <Route path="/admin/allprojects" element={<AllProjects />} />
        <Route path="/course/invite/:user" element={<InviteMembers />} />
      </Routes>
    </>
  );
}

export default App;
