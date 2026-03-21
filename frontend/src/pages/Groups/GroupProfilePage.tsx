import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import GroupListCard from "../../components/Group/GroupListCard";
import GrpPreferenceCard from "../../components/Group/GrpPreferenceCard";
import GroupFunctionCard from "../../components/Group/GroupFunctionCard";
import Page from "../../components/Layout-Nav/Page";
import { useEffect } from "react";
import { ProjectPreferenceInfo, SubcourseInfo } from "../constants";
import GroupBioCard from "../../components/Group/GroupBioCard";
import { GroupInfo } from "../constants";
import {
  getGroupData,
  getGroupPreferences,
  getSubcourseDetails,
} from "../../apiUtil";

/**
 * This page displays the group profile and preferences.
 */
export default function GroupProfilePage() {
  const navigate = useNavigate();
  const params = useParams();
  const groupId = params.groupId ?? "";
  const [currSubcourse, setCurrSubcourse] = useState<SubcourseInfo>({
    id: "",
    name: "",
    code: "",
    owner: "",
    year: 2025,
    term: 1,
    is_archived: false,
    parent_course: "",
    students: [],
    staff: [],
    groups: [],
    projects: [],
    clients: [],
    channels: [],
    client_questionnaire: [],
    project_preference_form: [],
    is_published: false,
    description: "",
    max_group_size: 6,
    preference_release: false,
    color: "",
  });
  const [group, setGroup] = useState<GroupInfo>({
    id: "",
    name: "",
    members: [],
    tutorial: "",
    bio: "",
    goal: "",
    project: null,
    draft_alloc: null,
    proj_preferences: [],
    topic_preferences: [],
    is_draft: false,
    links: [],
    responses: [],
    lead: null,
  });
  const [isMyGroup, setIsMyGroup] = useState(false);
  const [preferences, setPreferences] = useState<ProjectPreferenceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const userId = localStorage.getItem("id") ?? "";
    let isMounted = true;
    setLoading(true);
    const fetchData = async () => {
      const token = localStorage.getItem("token") ?? "";
      if (!token || !groupId) {
        navigate("/");
        return;
      }

      try {
        const subcourseId = localStorage.getItem("subcourse") ?? "";
        const course = await getSubcourseDetails(token, subcourseId);
        if (course.data) {
          setCurrSubcourse(course.data);
        }
        const groupData = await getGroupData(token, groupId);
        if (!isMounted) return;

        setGroup(groupData.data);

        const allPreferences = await getGroupPreferences(token, groupId);
        if (!isMounted) return;
        setPreferences(allPreferences.data);
        setIsMyGroup(groupData.data.members.includes(userId));
      } catch (err) {
        console.log("Error fetching group information: ", err);
      }
      setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [groupId, isMyGroup, navigate]);

  return (
    <Page
      title={group?.name || "Unknown"}
      back={true}
      backRoute={
        localStorage.getItem("user") === "student"
          ? `/student/dashboard/${localStorage.getItem("subcourse")}`
          : localStorage.getItem("user") === "staff"
            ? `/admin/allgroups`
            : "-1"
      }
    >
      {loading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : (
        <div className="w-full flex flex-row space-x-8 text-left pt-10 mb-20">
          <GroupListCard
            group={group}
            isMine={isMyGroup}
            setIsMine={setIsMyGroup}
            prefReleased={currSubcourse.preference_release ?? false}
          />
          <div className="w-5/7 gap-8 h-auto flex flex-col">
            {isMyGroup && (
              <GroupFunctionCard
                handler={setGroup}
                curr={{ bio: group?.bio, goal: group?.goal, lead: group?.lead }}
                groupId={groupId}
                course={currSubcourse}
              />
            )}
            <GroupBioCard
              comments={{
                bio: group?.bio ?? "None",
                goals: group?.goal ?? "None",
              }}
            />
            <GrpPreferenceCard
              isDraft={group.is_draft}
              preferences={preferences}
              isMine={isMyGroup}
              groupId={groupId}
              lead={group.lead}
            />
          </div>
        </div>
      )}
    </Page>
  );
}
