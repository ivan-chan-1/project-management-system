import ProjectPreferencer from "../../components/Preferencing/ProjectPreferencer";
import Page from "../../components/Layout-Nav/Page";
import { useEffect, useState } from "react";
import { getStudentPreferences, getStudentWishlist } from "../../apiUtil";
import { MemberWishlistInfo, ProjectPreferenceInfo } from "../constants";
import { useNavigate } from "react-router-dom";

/**
 * This page displays the project preferences of a student.
 */
const StudentPreference = () => {
  const [preferences, setPreferences] = useState<ProjectPreferenceInfo[]>([]);
  const [wishlists, setWishlists] = useState<MemberWishlistInfo[]>([]);
  const subcourse = localStorage.getItem("subcourse") ?? "";
  const navigate = useNavigate();

  // Get student's wishlists and preferences
  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const userId = localStorage.getItem("id") ?? "";

    const fetchPreferenceData = async () => {
      const res = await getStudentPreferences(token, subcourse, userId);
      setPreferences(res.data);
    };

    const fetchWishlistData = async () => {
      const res = await getStudentWishlist(token, subcourse, userId);
      setWishlists(res.data);
    };

    fetchPreferenceData();
    fetchWishlistData();
  }, [subcourse]);

  // Handles moving to next part of form (i.e. none, returns back to dashboard)
  const handleNext = () => {
    navigate(`/student/dashboard/${subcourse}`);
  };

  return (
    <Page title="My Project Preferences" back={true}>
      <ProjectPreferencer
        type="student"
        preferences={preferences}
        wishlists={wishlists}
        id={subcourse}
        handleNext={handleNext}
      />
    </Page>
  );
};

export default StudentPreference;
