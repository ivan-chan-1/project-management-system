import ProjectPreferencer from "../../components/Preferencing/ProjectPreferencer";
import Page from "../../components/Layout-Nav/Page";
import { useEffect, useState } from "react";
import {
  getGroupData,
  getGroupMemberWishlists,
  getGroupPreferences,
  getGroupTopicPreference,
} from "../../apiUtil";
import { MemberWishlistInfo, ProjectPreferenceInfo } from "../constants";
import { useParams } from "react-router-dom";
import TopicPreference from "../../components/Preferencing/TopicPreference";
import Stepper from "../../components/Stepper";
import SuccessForm from "../LoginRegister/SuccessForm";

/**
 * This page allows the group to submit their project preferences.
 */
const GroupPreference = () => {
  // Group Info
  const token = localStorage.getItem("token") ?? "";
  const params = useParams();
  const groupId = params.groupId ?? "";
  const [group, setGroup] = useState("");

  // Stepper
  const [current, setCurrent] = useState(1);
  const steps = ["Project Preference", "Topic Preference", "Submit"];

  // Project Preferences
  const [preferences, setPreferences] = useState<ProjectPreferenceInfo[]>([]);
  const [wishlists, setWishlists] = useState<MemberWishlistInfo[]>([]);

  // Topic Preferences
  const [topics, setTopics] = useState<string[]>([]);

  // Get project/topic preferences and wishlists from database
  useEffect(() => {
    const subcourse = localStorage.getItem("subcourse") ?? "";

    const fetchPreferenceData = async () => {
      const res = await getGroupPreferences(token, groupId);
      const grp = await getGroupData(token, groupId);
      setGroup(grp.data.name);
      setPreferences(res.data);
    };

    const fetchTopicData = async () => {
      const res = await getGroupTopicPreference(token, groupId);
      setTopics(res.data);
    };

    const fetchWishlistData = async () => {
      const res = await getGroupMemberWishlists(token, groupId, subcourse);
      setWishlists(res.data);
    };

    fetchTopicData();
    fetchPreferenceData();
    fetchWishlistData();
  }, [groupId, token]);

  // Move form forward
  const handleNext = () => {
    setCurrent((prev) => (prev < steps.length ? prev + 1 : prev));
  };

  // Move form backward
  const handleBack = () => {
    setCurrent((prev) => (prev > 1 ? prev - 1 : prev));
  };

  return (
    <Page
      title={group + " Project Preference Form"}
      back={true}
      backRoute={`/group/profile/${groupId}`}
    >
      <div className="mt-12">
        <Stepper current={current} steps={steps} />
      </div>
      {current === 1 && (
        <ProjectPreferencer
          type="group"
          preferences={preferences}
          wishlists={wishlists}
          id={groupId}
          handleNext={handleNext}
        />
      )}
      {current === 2 && (
        <TopicPreference
          groupId={groupId}
          preferences={topics}
          handleNext={handleNext}
          handleBack={handleBack}
        />
      )}
      {current === 3 && (
        <SuccessForm
          text="Go To Group Profile"
          message="Your Group preference has been successfully submitted"
          location={`/group/profile/${groupId}`}
        />
      )}
    </Page>
  );
};

export default GroupPreference;
