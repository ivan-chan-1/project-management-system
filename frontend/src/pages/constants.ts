import { UniqueIdentifier } from "@dnd-kit/core";

//////////////////////// AUTH TYPES ////////////////////////
export interface LoginData {
  email: string;
  password: string;
}

//////////////////////// COURSE TYPES ////////////////////////
export type CourseType = {
  id: string;
  name: string;
  code: string;
  desc: string;
  is_archived: boolean;
  color: string;
};

export type clientQuestionnaire = {
  id: string;
  type:
    | "text"
    | "radio"
    | "checkbox"
    | "email"
    | "url"
    | "file"
    | "date"
    | "textarea";
  label: string;
  value: string | null;
  options: string[] | null;
};

export type projectPreferenceForm = {
  id: string;
  type:
    | "text"
    | "radio"
    | "checkbox"
    | "email"
    | "url"
    | "file"
    | "date"
    | "textarea";
  label: string;
  value: string | null;
  options: string[] | null;
};

export interface termDates {
  [key: number]: string;
}

export type CourseInfo = {
  id: string;
  name: string;
  code: string;
  description: string;
  owner: string;
  terms: number[];
  termDates: termDates;
  clients: string[];
  projects: string[];
  def_client_questionaire: clientQuestionnaire[];
  def_project_preference_form: projectPreferenceForm[];
  embedded_background?: number[];
  color: string;
};

//////////////////////// STUDENT TYPES ////////////////////////
export type StudentPreference = {
  project: string;
  notes: string;
  rank: number;
};

export type StudentSubcourse = {
  subcourse: string;
  tutorial: string;
  group: string | null;
  draft_alloc: string | null;
  wishlist: string[];
  preferences: StudentPreference[];
};

export type StudentInfo = {
  id: string;
  name: string;
  zid: string;
  email: string;
  password: string;
  year: number | null;
  role: "student";
  subcourses: StudentSubcourse;
  experiences: expDetails[];
};

export type StudentInfoSubcourse = {
  id: string;
  name: string;
  zid: string;
  email: string;
  password: string;
  year: number | null;
  role: "student";
  subcourses: StudentSubcourse[];
  experiences: expDetails[];
};

export type expDetails = {
  title: string;
  description: string;
};

export type Member = {
  email: string;
  id: string;
  name: string;
  role: string;
  tutorials: string | string[];
  group?: string | null;
};

export type RawCSVStudent = {
  name: string;
  email: string;
  zid: string;
  tutorial: string;
};

export type FormattedStudent = {
  firstName: string;
  lastName: string;
  email: string;
  zid: string;
  tutorial: string;
};

//////////////////////// PROJECT TYPES ////////////////////////
export type ProjectInfo = {
  id?: string;
  name: string;
  proj_no: number | null;
  clients: string[];
  groups: string[];
  status: "available" | "unavailable" | "submitted" | "draft";
  capacity: number;
  terms: number[];
  category: string;
  areas: string[];
  background: string;
  scope: string;
  req_skills: string;
  outcomes: string;
  date_created: string;
  date_modified: string;
  attachments: string[];
  is_allocated: boolean;
  responses: {
    question: string;
    answer: string;
  }[];
  course: string;
  subcourse?: string | null;
  embedded_background?: number[] | null;
  color: string;
};

export type ProjectInfoId = {
  id: string;
  name: string;
  proj_no: number | null;
  clients: string[];
  groups: string[];
  status: "available" | "unavailable" | "submitted" | "draft";
  capacity: number;
  terms: number[];
  category: string;
  areas: string[];
  background: string;
  scope: string;
  req_skills: string;
  outcomes: string;
  date_created: string;
  date_modified: string;
  attachments: string[];
  is_allocated: boolean;
  responses: {
    question: string;
    answer: string;
  }[];
  course: string;
  subcourse?: string | null;
  embedded_background?: number[] | null;
};

export type ProjectWithAllInfo = {
  id: string;
  name: string;
  proj_no: number | null;
  clients: ClientInfo[];
  groups: GroupInfo[];
  status: "available" | "unavailable" | "submitted" | "draft";
  capacity: number;
  terms: number[];
  category: string;
  areas: string[];
  background: string;
  scope: string;
  req_skills: string;
  outcomes: string;
  date_created: string;
  date_modified: string;
  attachments: string[];
  is_allocated: boolean;
  responses: {
    question: string;
    answer: string;
  }[];
  course: string;
};

export type ProjectGroupInfo = {
  id: string;
  name: string;
  proj_no: number | null;
  clients: string[];
  groups: GroupInfo[];
  status: "available" | "unavailable" | "submitted" | "draft";
  capacity: number;
  terms: number[];
  category: string;
  areas: string[];
  background: string;
  scope: string;
  req_skills: string;
  outcomes: string;
  date_created: string;
  date_modified: string;
  attachments: string[];
  color: string;
};

export type ProjectProps = {
  projId: string;
  projNum: number | null;
  projName: string;
  projStatus: string;
  lastModified: string;
  numInterested?: number;
};

export type InfoBoxProps = {
  title: string;
  content: string;
  initialHeight?: string;
};

export type ProjectTags = {
  name: string;
  tags: string[];
};

export type ProjectPreferenceInfo = {
  notes: string;
  project: ProjectInfoId;
  rank: number;
};

export type AutoPreference = {
  project: ProjectInfoId;
  rank: number;
};

export type MemberWishlistInfo = {
  id: string;
  name: string;
  wishlist: ProjectInfoId[];
};

//////////////////////// GROUP TYPES ////////////////////////
export type GroupInfo = {
  id: string;
  name: string;
  members: string[];
  tutorial: string;
  bio: string | null;
  goal: string | null;
  project: string | null;
  draft_alloc: string | null;
  proj_preferences: string[];
  topic_preferences: string[];
  is_draft: boolean;
  links: {
    name: string;
    url: string;
  }[];
  responses: {
    question: string;
    answer: string;
  }[];
  lead?: string | null;
};

export type GroupStudentInfo = {
  id: string;
  name: string;
  members: StudentInfo[];
  tutorial: string;
  bio: string | null;
  goal: string | null;
  project: string | null;
  draft_alloc: string | null;
  proj_preferences: string[];
  topic_preferences: string[];
  is_draft: boolean;
  links: [
    {
      name: string;
      url: string;
    },
  ];
  responses: [
    {
      question: string;
      answer: string;
    },
  ];
};

export const DefaultGroupInfo = {
  id: "",
  name: "",
  members: [],
  tutorial: "",
  bio: null,
  goal: null,
  project: null,
  draft_alloc: null,
  proj_preferences: [],
  topic_preferences: [],
  is_draft: true,
  links: [],
  responses: [],
};

export type GroupMember = {
  id: string;
  name: string;
};

export type joinGroupData = {
  group_id: string;
  subcourse_id: string;
};

export type SubcourseGroupInfo = {
  id: string;
  name: string;
  members: StudentInfoSubcourse[];
  tutorial: string;
  project: ProjectInfo;
};

//////////////////////// SUBCOURSE TYPES ////////////////////////
export type SubcourseReportData = {
  "Student Name": string;
  "Student ZID": string;
  Tutorial: string;
  Group: string;
  Project: string;
  "Client Name": string;
  "Client Company": string;
  "Client Email": string;
};

export type FullSubcourseData = {
  id: string;
  name: string;
  code: string;
  year: number;
  term: number;
  is_archived: boolean;
  groups: SubcourseGroupInfo[];
  students: StudentInfoSubcourse[];
};

export type FormInputs = {
  id: string;
  input_type:
    | "text"
    | "radio"
    | "checkbox"
    | "email"
    | "url"
    | "file"
    | "date"
    | "textarea"
    | "number"
    | "dropdown"
    | "select";
  label: string;
  value: string | string[] | null;
  options: string[];
};

export type SubcourseInfo = {
  id: string;
  name: string;
  code: string;
  owner: string;
  year: number;
  term: number;
  is_archived: boolean;
  parent_course: string;
  students: string[];
  staff: string[];
  groups: string[];
  projects: string[];
  clients: string[];
  channels: string[];
  client_questionnaire: FormInputs[];
  project_preference_form: FormInputs[];
  is_published: boolean;
  description?: string;
  max_group_size?: number;
  preference_release?: boolean;
  color: string;
};

//////////////////////// CLIENT TYPES ////////////////////////
export type ClientInfo = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "client";
  phone: string;
  is_verified: boolean;
  company_name: string;
  company_brief: string;
  company_address: string;
  company_industry: string;
  company_abn: string;
  contact_hours: string;
  projects: string[];
  courses: string[];
  wishlist: [
    {
      project: string;
      groups: string[];
    },
  ];
  preferences: [
    {
      project: string;
      groups: string[];
    },
  ];
  responses: [
    {
      question: string;
      answer: string;
    },
  ];
};

export type AllClients = {
  id: string;
  name: string;
  company_name: string;
  is_verified: boolean;
  email: string;
  role: string;
  projects: { id: string; project: string }[];
};

//////////////////////// ADMIN TYPES ////////////////////////
export type LData = {
  left: UniqueIdentifier;
  right: UniqueIdentifier;
};

export type RData = {
  left: UniqueIdentifier;
  right: UniqueIdentifier[];
};

export type AllocationData = {
  is_draft: boolean;
  l_allocations: LData[];
  r_allocations: RData[];
};

// TODO: CHANGE THIS
export type UpdateClientFields = {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  industry?: string;
  company_abn?: string;
  hours?: string;
  is_verified?: boolean;
  projects?: string[];
  courses?: string[];
  wishlist?: [
    {
      project: string;
      groups: string[];
    },
  ];
  preferences?: [
    {
      project: string;
      groups: string[];
    },
  ];

  company_brief?: string;
  company_address?: string;
};

//////////////////////// SUBCOURSE TYPES ////////////////////////
export type ContainerDetails = {
  id: UniqueIdentifier;
  name: string;
  capacity: number;
  current: number;
};

export type Items = {
  id: UniqueIdentifier;
  name: string;
};

export type Container = {
  id: UniqueIdentifier;
  name: string;
  capacity: number;
  items: Items[];
};

//////////////////////// CHAT TYPES ////////////////////////

export type PostType = {
  id: string;
  title: string;
  creator: string;
  content: string;
  date_created: string;
  category: string | null;
};

export type Conversation = {
  post: PostType;
  replies: PostType[];
};

export type ChannelType = {
  id: string;
  name: string;
  conversations: Conversation[];
};

export type ChannelIdentifer = {
  id: string;
  name: string;
};

export type ChannelListType = {
  category: string | number;
  channels: ChannelIdentifer[];
};

export type ChannelMembers = {
  id: string;
  members: { id: string; name: string }[];
};

export type Creators = Record<string, { name: string; role: string }>;

//////////////////////// OTHER TYPES ////////////////////////

export type Classes = {
  subcourse: string;
  tutorials: string[];
};
export interface Heading {
  title: string;
  data: string;
}

export interface Manage {
  title: string;
  route: string;
}

export type FilterType = {
  title: string;
  type: string;
  // Required to allow functions to be passed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterFn: (data: any, tutorial?: string) => void;
};

export type CourseCodeInfo = {
  [key: string]: string;
};

export type TermDatesInfo = {
  [key: string]: string;
};

export type TermDatesData = {
  course_id: string;
  term_dates: TermDatesInfo;
};

export const stubCourseInfo: CourseInfo = {
  id: "",
  name: "",
  code: "",
  description: "",
  owner: "",
  terms: [],
  termDates: {},
  clients: [],
  projects: [],
  def_client_questionaire: [],
  def_project_preference_form: [],
  color: "",
};

export interface Statistic {
  title: string;
  value: number;
}

export const stubProjectList: ProjectProps[] = [
  {
    projId: "testid",
    projNum: 49,
    projName: "Capstone Project Management System",
    projStatus: "available",
    lastModified: "15-03-2025",
    numInterested: 10,
  },
  {
    projId: "testid2",
    projNum: 22,
    projName: "Vehicle Parts Recommender",
    projStatus: "unavailable",
    lastModified: "15-03-2025",
    numInterested: 10,
  },
  {
    projId: "testid3",
    projNum: 8,
    projName: "Lovely Project for a Great Group",
    projStatus: "available",
    lastModified: "15-03-2025",
    numInterested: 10,
  },
  {
    projId: "testid4",
    projNum: 8,
    projName: "Lovely Project for a Great Group",
    projStatus: "submitted",
    lastModified: "15-03-2025",
    numInterested: 10,
  },
  {
    projId: "testid5",
    projNum: 8,
    projName: "Draft Lovely Project for a Great Group",
    projStatus: "draft",
    lastModified: "15-03-2025",
    numInterested: 10,
  },
];

export const stubGroupMembers: GroupMember[] = [
  {
    id: "123",
    name: "Nikki Qin",
  },
  {
    id: "1234",
    name: "Hellen Wang",
  },
  {
    id: "12345",
    name: "Ivan Chan",
  },
  {
    id: "123456",
    name: "Sophie Khov",
  },
  {
    id: "1234567",
    name: "Olivia Wu",
  },
  {
    id: "12345677",
    name: "Ashley Ei",
  },
];

export const stubExpList: expDetails[] = [
  {
    title: "Internship",
    description: "Hello, I have done internship at Amazon............",
  },
  {
    title: "Hackathon",
    description:
      "Hello, I have done hackathon at UNSW sponsored by Atlassian............",
  },
  {
    title: "Own Project",
    description: "Hello, I have done shopping website............",
  },
];

export type updateStudentDetailsData = {
  subcourse: string;
  year: string | null;
  tutorial: string;
  experiences: { title: string; description: string }[];
};

export type FieldType =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "number"
  | "dropdown"
  | "select";

export interface FormField {
  id: string;
  input_type: FieldType;
  label: string;
  value: string;
  options: string[]; // For Radio and Checkbox fields
  default?: boolean;
}

export interface Subcourse {
  name: string;
  code: string;
  term: number;
  max_group_size: number;
  client_questionnaire: FormField[];
  project_preference_form: FormField[];
  is_default: boolean;
  parent_course: string;
  preference_release: boolean;
}

export interface Link {
  name: string;
  url: string;
  subcourse: string;
}
