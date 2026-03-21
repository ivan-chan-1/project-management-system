import axios from "axios";

import { BACKEND_PORT } from "../backend.config.json";
import { FormData } from "./pages/LoginRegister/Register";
import {
  AllocationData,
  UpdateClientFields,
  joinGroupData,
  LoginData,
  ProjectInfo,
  Subcourse,
  updateStudentDetailsData,
  TermDatesData,
} from "./pages/constants";
import { termDates } from "./pages/constants";

export const API_URL = `http://127.0.0.1:${BACKEND_PORT}`;
// Comment out above and use this line for the deployed backend
// export const API_URL = `https://backend-707537604981.australia-southeast1.run.app`;

export const registerUser = (formData: FormData, user: string) => {
  return axios.post(`${API_URL}/api/${user}/register`, formData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const loginUser = (data: LoginData, user: string) => {
  return axios.post(`${API_URL}/api/${user}/login`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getUserData = (token: string, user: string, id: string) => {
  return axios.get(`${API_URL}/api/${user}/details/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getSubcourses = (token: string, user: string) => {
  return axios.get(`${API_URL}/api/${user}/subcourse/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getProjectsFromIds = (data: { projects: string[] }) => {
  return axios.post(`${API_URL}/api/projects/list`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getSubcourseDetails = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/subcourse/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateSubcourseDetails = async (
  token: string,
  subcourseId: string,
  subcourseData: Subcourse,
) => {
  return await axios.put(
    `${API_URL}/api/subcourse/update/${subcourseId}`,
    subcourseData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getAllSubcourseProjects = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/projects/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateStudentDetails = (
  token: string,
  data: updateStudentDetailsData,
) => {
  return axios.post(`${API_URL}/api/student/details`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const getSubcourse = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/subcourse/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getGroupData = (token: string, groupId: string) => {
  return axios.get(`${API_URL}/api/group/details/${groupId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getProjectData = (token: string, projId: string) => {
  return axios.get(`${API_URL}/api/project/profile/${projId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const updateClientData = (
  token: string,
  clientData: UpdateClientFields,
  clientId: string,
) => {
  return axios.put(`${API_URL}/api/client/update/${clientId}`, clientData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const getClientProjects = (
  token: string,
  clientId: string,
  courseId: string,
) => {
  return axios.get(`${API_URL}/api/client/projects`, {
    params: { clientId, courseId },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const removeMember = (
  token: string,
  groupId: string,
  subcourseId: string,
) => {
  return axios.put(
    `${API_URL}/api/group/leave`,
    {
      group_id: groupId,
      subcourse_id: subcourseId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const getAllGroups = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/subcourse/groups/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const joinMember = (token: string, groupData: joinGroupData) => {
  return axios.put(`${API_URL}/api/group/join`, groupData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const addToWishlist = (
  token: string,
  projectId: string,
  subcourseId: string,
) => {
  return axios.put(
    `${API_URL}/api/student/update/wishlist`,
    { project_id: projectId, subcourse_id: subcourseId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const getLike = (
  token: string,
  subcourseId: string,
  projectId: string,
) => {
  return axios.get(`${API_URL}/api/student/liked/${subcourseId}/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeFromWishlist = (
  token: string,
  projectId: string,
  subcourseId: string,
) => {
  return axios.put(
    `${API_URL}/api/student/remove/wishlist`,
    { project_id: projectId, subcourse_id: subcourseId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const getGroupPreferences = (token: string, group_id: string) => {
  return axios.get(`${API_URL}/api/group/preference/${group_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getGroupTopicPreference = (token: string, groupId: string) => {
  return axios.get(`${API_URL}/api/group/preference/topic/${groupId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const getStudentPreferences = (
  token: string,
  subcourseId: string,
  studentId: string,
) => {
  return axios.get(
    `${API_URL}/api/student/preference/${subcourseId}/${studentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getGroupMemberWishlists = (
  token: string,
  group_id: string,
  subcourse_id: string,
) => {
  return axios.get(
    `${API_URL}/api/group/wishlist/${group_id}/${subcourse_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getStudentWishlist = (
  token: string,
  subcourse_id: string,
  student_id: string,
) => {
  return axios.get(
    `${API_URL}/api/student/wishlist/${subcourse_id}/${student_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const submitPreference = (
  token: string,
  type: string,
  id: string,
  data: string,
) => {
  return axios.post(`${API_URL}/api/${type}/preference/submit/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const submitGroupTopicPreference = (
  token: string,
  group_id: string,
  data: string,
) => {
  return axios.post(
    `${API_URL}/api/group/preference/topic/submit/${group_id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const searchProject = (
  token: string,
  subcourseId: string,
  query: string,
) => {
  return axios.get(
    `${API_URL}/api/project/search?query=${query}&subcourse_id=${subcourseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const getStudentTutorial = (
  token: string,
  studentId: string,
  subcourseId: string,
) => {
  return axios.get(
    `${API_URL}/api/student/tutorial/${studentId}/${subcourseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getAllStudents = (token: string, subcourse_id: string) => {
  return axios.get(`${API_URL}/api/subcourse/students/${subcourse_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const allocateProjects = (
  token: string,
  subcourse: string,
  data: AllocationData,
) => {
  return axios.post(
    `${API_URL}/api/admin/allocate/${subcourse}/project`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const getAutoGroupPreference = (
  token: string,
  subcourse_id: string,
  group_id: string,
) => {
  return axios.get(
    `${API_URL}/api/group/preference/auto/${subcourse_id}/${group_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const allocateStudents = (
  token: string,
  subcourse_id: string,
  data: AllocationData,
) => {
  return axios.post(
    `${API_URL}/api/admin/allocate/${subcourse_id}/student`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const createSubcourse = (
  token: string,
  data: {
    name: string;
    term: number;
    year: number;
    code: string;
  },
) => {
  return axios.post(`${API_URL}/api/staff/subcourse/create`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const addStudentsToSubcourse = (
  token: string,
  data: {
    students: {
      firstName: string;
      lastName: string;
      tutorial: string;
      zid: string;
      email: string;
    }[];
    subcourse_id: string;
  },
) => {
  return axios.post(`${API_URL}/api/staff/subcourse/add-students`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const addTutorsToSubcourse = (
  token: string,
  data: {
    tutors: {
      firstName: string;
      lastName: string;
      tutorial: string;
      zid: string;
      email: string;
    }[];
    subcourse_id: string;
  },
) => {
  return axios.post(`${API_URL}/api/staff/subcourse/add-tutors`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const createCourse = (
  token: string,
  data: {
    name: string;
    termDates: termDates;
    description: string;
    code: string;
  },
) => {
  return axios.post(`${API_URL}/api/staff/course/create`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const getCodes = (token: string) => {
  return axios.get(`${API_URL}/api/staff/all-course-codes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getTerms = (token: string, courseId: string) => {
  return axios.get(`${API_URL}/api/course/term-dates/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getGroupMembers = (token: string, group_id: string) => {
  return axios.get(`${API_URL}/api/group/members/${group_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ----------------------- Client Projects ---------------------------

// project preference form
export const getProjectQuestionaire = (token: string, courseId: string) => {
  return axios.get(`${API_URL}/api/course/project/questionnaire/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// client questionnaire
export const getClientQuestionaire = (token: string, courseId: string) => {
  return axios.get(`${API_URL}/api/course/client/questionnaire/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const postProject = (token: string, data: ProjectInfo) => {
  return axios.post(`${API_URL}/api/project/create`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const getProject = (token: string, projectId: string) => {
  return axios.get(`${API_URL}/api/project/profile/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateProject = (
  token: string,
  projectId: string,
  data: ProjectInfo,
) => {
  return axios.put(`${API_URL}/api/project/update/${projectId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// search course for clients to join
export const searchCourse = (token: string, query: string) => {
  return axios.get(`${API_URL}/api/course/search?query=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ------------------------ Course Admin Dashboard ------------------------

export const getNumStudents = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/admin/students/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getNumStaff = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/admin/staff/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAllClients = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/admin/allclients/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStaffDashboardStats = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/admin/dashboard/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getNumStudentsUnallocated = (
  token: string,
  subcourseId: string,
) => {
  return axios.get(`${API_URL}/api/admin/students/unallocated/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAllSubcourseMembers = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/admin/subcourse/members/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Route to check whether the preference form is set to be released
export const getIsPreferenceFormReleased = (
  token: string,
  subcourseId: string,
) => {
  return axios.get(
    `${API_URL}/api/subcourse/preference/release/${subcourseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// ------------------------ Course Functions ------------------------
export const getAllCourses = (token: string) => {
  return axios.get(`${API_URL}/api/course/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getCourseDetails = (token: string, courseId: string) => {
  return axios.get(`${API_URL}/api/course/details/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAllUnapprovedProjects = (
  token: string,
  subcourseId: string,
) => {
  return axios.get(`${API_URL}/api/unapproved/projects/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const clientApply = (token: string, courseId: string) => {
  return axios.put(
    `${API_URL}/api/course/addclient`,
    {
      course_id: courseId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const verifyClient = (token: string, clientId: string) => {
  return axios.put(
    `${API_URL}/api/admin/client/verify`,
    {
      client_id: clientId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const rejectClient = (token: string, clientId: string) => {
  return axios.put(
    `${API_URL}/api/admin/client/reject`,
    {
      client_id: clientId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const resetPassword = (email: string, role: string) => {
  return axios.post(
    `${API_URL}/api/${role}/forgot-password`,
    { email },
    {
      headers: {},
    },
  );
};

export const verifyPin = (pin: string, email: string, user: string) => {
  return axios.post(
    `${API_URL}/api/${user}/verify-pin`,
    { email, pin },
    {
      headers: {},
    },
  );
};

export const verifiedResetPassword = (
  password: string,
  email: string,
  user: string,
) => {
  return axios.post(
    `${API_URL}/api/${user}/reset-password`,
    { password, email },
    {
      headers: {},
    },
  );
};

export const adminApproveProject = (
  token: string,
  projectId: string,
  subcourseId: string,
) => {
  return axios.put(
    `${API_URL}/api/project/approve/${projectId}/${subcourseId}`,
    {
      project_id: projectId,
      subcourse_id: subcourseId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const adminUnapproveProject = (
  token: string,
  projectId: string,
  subcourseId: string,
) => {
  return axios.delete(
    `${API_URL}/api/project/unapprove/${projectId}/${subcourseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        project_id: projectId,
        subcourse_id: subcourseId,
      },
    },
  );
};

export const adminRejectProject = (token: string, projectId: string) => {
  return axios.put(`${API_URL}/api/project/reject/${projectId}`, "", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const autoAllocateProjects = (token: string, subcourseId: string) => {
  return axios.get(
    `${API_URL}/api/admin/${subcourseId}/allocate/project/auto`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// ------------------------ Communication -----------------------
export const getChannelLists = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/channels/list/${subcourseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAllChannelList = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/channels/list/${subcourseId}/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getConversations = (token: string, channelId: string) => {
  return axios.get(`${API_URL}/api/channels/${channelId}/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const pinPost = (
  token: string,
  type: string,
  channelId: string,
  postId: string,
) => {
  return axios.put(`${API_URL}/api/channels/${type}/${channelId}/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const isPinned = (token: string, channelId: string, postId: string) => {
  return axios.get(`${API_URL}/api/channels/pinned/${channelId}/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAllPinned = (token: string, channelId: string) => {
  return axios.get(`${API_URL}/api/channels/pinned/${channelId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAllChannelMembers = (token: string, channelId: string) => {
  return axios.get(`${API_URL}/api/channels/${channelId}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getCreators = (token: string, channelId: string) => {
  return axios.get(`${API_URL}/api/channels/${channelId}/creators`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateLead = (
  token: string,
  groupdId: string,
  data: Record<string, string>,
) => {
  return axios.post(`${API_URL}/api/group/${groupdId}/lead`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const updateBio = (
  token: string,
  groupdId: string,
  data: Record<string, string>,
) => {
  return axios.post(`${API_URL}/api/group/${groupdId}/bio`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const getIsLead = (token: string, groupdId: string) => {
  return axios.get(`${API_URL}/api/group/${groupdId}/lead`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getWhoLead = (token: string, groupdId: string) => {
  return axios.get(`${API_URL}/api/group/${groupdId}/lead/who`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getCourseLinks = (token: string, courseId: string) => {
  return axios.get(`${API_URL}/api/staff/links/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const addCourseLinks = (
  token: string,
  data: {
    name: string;
    url: string;
    subcourse: string;
  },
) => {
  return axios.post(`${API_URL}/api/staff/links/${data.subcourse}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// Add links for groups
export const addGroupLinks = (
  token: string,
  groupId: string,
  data: {
    name: string;
    url: string;
  },
) => {
  return axios.post(`${API_URL}/api/group/links/${groupId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const getTutorialGroups = (token: string, subcourseId: string) => {
  return axios.get(`${API_URL}/api/staff/${subcourseId}/tutorial/groups`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createChannel = (
  token: string,
  subcourseId: string,
  data: Record<string, string | null>,
) => {
  return axios.post(`${API_URL}/api/channels/${subcourseId}/create`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const deleteMember = (
  token: string,
  subcourseId: string,
  memberId: string,
) => {
  return axios.delete(`${API_URL}/api/student/remove`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    params: {
      subcourse_id: subcourseId,
      student_id: memberId,
    },
  });
};

export const deleteProject = (token: string, projectId: string) => {
  return axios.delete(`${API_URL}/api/client/delete/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateParentDates = (token: string, data: TermDatesData) => {
  return axios.put(`${API_URL}/api/course/update/date`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const archiveSubcourse = (token: string, subcourse: string) => {
  return axios.put(`${API_URL}/api/subcourse/${subcourse}/archive`, "", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const isArchived = (token: string, subcourse: string) => {
  return axios.get(`${API_URL}/api/subcourse/${subcourse}/archive`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const activateSubcourse = (token: string, subcourse: string) => {
  return axios.put(`${API_URL}/api/subcourse/${subcourse}/activate`, "", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const isSubcourseActive = (token: string, subcourse: string) => {
  return axios.get(`${API_URL}/api/subcourse/${subcourse}/active`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const canActivateSubcourse = (token: string, subcourse: string) => {
  return axios.get(`${API_URL}/api/subcourse/${subcourse}/activatable`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const existingSubcourse = (
  token: string,
  data: { term: number; year: number; code: string },
) => {
  return axios.get(`${API_URL}/api/subcourse/existing`, {
    params: data,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
