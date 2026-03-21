"""
Model to represent a API request and response data
"""

from typing import Dict, List, Literal, Optional
from bunnet import PydanticObjectId
from pydantic import BaseModel, Field, TypeAdapter
from .student import Experience, Student
from .course import FormInputs
from .preference import Preference
from .group import WebLink, Group
from .response import Response
from .project import Project
from .student import Details
from .channel import Conversation
from .client import Client

"""
Input Validation
"""


class UpdateStudentDetails(BaseModel):
    subcourse: PydanticObjectId
    year: int | None
    experiences: List[Experience]
    tutorial: str


class StudentRegister(BaseModel):
    firstName: str
    lastName: str
    zid: str
    email: str
    password: str


class Login(BaseModel):
    email: str
    password: str


class StaffRegister(BaseModel):
    firstName: str
    lastName: str
    zid: str
    email: str
    password: str


class ClientRegister(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    password: str
    companyName: str
    industry: str
    companyABN: str
    contactHours: str


class PreferenceData(BaseModel):
    project: PydanticObjectId
    notes: str
    rank: int


class OneToOneAllocation(BaseModel):
    left: PydanticObjectId
    right: PydanticObjectId


class OneToManyAllocation(BaseModel):
    left: PydanticObjectId
    right: List[PydanticObjectId]


class AllocationData(BaseModel):
    is_draft: bool
    l_allocations: List[OneToOneAllocation]
    r_allocations: List[OneToManyAllocation]


class GroupAutoAllocation(BaseModel):
    group_id: PydanticObjectId
    proj_preferences: List[Preference]


GroupAutoAllocationList = TypeAdapter(list[GroupAutoAllocation])


class ProjectAutoAllocation(BaseModel):
    proj_id: PydanticObjectId
    capacity: int
    req_skills: str


ProjectAutoAllocationList = TypeAdapter(list[ProjectAutoAllocation])


class UpdateCourse(BaseModel):
    name: str
    code: str
    term: int
    max_group_size: int
    client_questionnaire: List[FormInputs]
    project_preference_form: List[FormInputs]
    is_default: bool
    preference_release: bool


class StudentCSV(BaseModel):
    firstName: str
    lastName: str
    tutorial: str
    zid: str
    email: str


class AddStudent(BaseModel):
    subcourse_id: str
    students: List[StudentCSV]


class AddTutor(BaseModel):
    subcourse_id: str
    tutors: List[StudentCSV]


class CreateSubcourse(BaseModel):
    name: str  # TODO: remove
    term: int
    year: int
    code: str


class ProjectData(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    clients: List[PydanticObjectId]
    groups: List[PydanticObjectId]
    is_allocated: bool
    status: Literal["available", "unavailable", "submitted", "draft"]
    capacity: int
    category: str
    course: Optional[PydanticObjectId]
    terms: List[int]
    areas: List[str]
    background: str
    scope: str
    req_skills: str
    outcomes: str
    date_created: str
    date_modified: str
    attachments: List[str]
    responses: List[Response]
    proj_no: int | None


class StudentData(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    zid: str
    email: str
    password: str
    year: int | None
    role: Literal["student"]
    subcourses: List[Details]
    experiences: List[Experience]


class GroupData(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    tutorial: str
    members: List[StudentData]
    project: ProjectData | None


"""
Projections and Views
"""


class SubcourseDescriptionView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    code: str
    owner: PydanticObjectId
    year: int
    term: int
    is_archived: bool
    parent_course: PydanticObjectId
    students: List[PydanticObjectId]
    staff: List[PydanticObjectId]
    groups: List[PydanticObjectId]
    projects: List[PydanticObjectId]
    clients: List[PydanticObjectId]
    channels: List[PydanticObjectId]
    client_questionnaire: List[FormInputs]
    project_preference_form: List[FormInputs]
    is_published: bool
    description: str
    color: str


SubcourseList = TypeAdapter(list[SubcourseDescriptionView])


class WebLinks(BaseModel):
    name: str
    url: str


webLinksList = TypeAdapter(list[WebLinks])


class StaffLinks(BaseModel):
    name: str
    url: str
    subcourse: PydanticObjectId


StaffLinksList = TypeAdapter(list[StaffLinks])


class UpdateProjct(BaseModel):
    name: str
    clients: List[PydanticObjectId]
    groups: List[PydanticObjectId]
    is_allocated: bool
    status: Literal["available", "unavailable", "submitted", "draft"]
    capacity: int
    course: Optional[PydanticObjectId]
    terms: List[int]
    areas: List[str]
    category: str
    background: str
    scope: str
    responses: List[Response]
    req_skills: str
    outcomes: str
    date_created: str
    date_modified: str
    attachments: List[str]


class RequestProject(BaseModel):
    name: str
    clients: List[PydanticObjectId]
    groups: List[PydanticObjectId]
    is_allocated: bool
    status: Literal["available", "unavailable", "submitted", "draft"]
    capacity: int
    course: Optional[PydanticObjectId]
    terms: List[int]
    category: str
    areas: List[str]
    background: str
    scope: str
    req_skills: str
    outcomes: str
    date_created: str
    date_modified: str
    attachments: List[str]
    proj_no: int | None
    responses: List[Response]


class ProjectView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    clients: List[PydanticObjectId]
    groups: List[PydanticObjectId]
    is_allocated: bool
    status: Literal["available", "unavailable", "submitted", "draft"]
    capacity: int
    course: Optional[PydanticObjectId]
    terms: List[int]
    category: str
    areas: List[str]
    background: str
    scope: str
    req_skills: str
    outcomes: str
    date_created: str
    date_modified: str
    attachments: List[str]
    proj_no: int | None
    responses: List[Response]
    subcourse: PydanticObjectId | None
    color: str


ProjectViewList = TypeAdapter(list[ProjectView])


class CourseView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    code: str
    description: str
    owner: PydanticObjectId
    terms: List[int]
    term_dates: Dict[int, str]
    clients: List[PydanticObjectId]
    projects: List[PydanticObjectId]
    def_client_questionnaire: List[FormInputs]
    def_project_preference_form: List[FormInputs]
    color: str


CourseViewList = TypeAdapter(list[CourseView])


class GroupView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    members: List[PydanticObjectId]
    tutorial: str
    bio: str | None
    goal: str | None
    project: PydanticObjectId | None
    draft_alloc: PydanticObjectId | None
    proj_preferences: List[Preference]
    topic_preferences: List[str]
    is_draft: bool
    links: List[WebLink]
    responses: List[Response]


GroupsViewList = TypeAdapter(list[GroupView])


class WishlistView(BaseModel):
    wishlist: List[PydanticObjectId]


class PreferenceView(BaseModel):
    project: Project
    notes: str
    rank: int


PreferenceViewList = TypeAdapter(list[PreferenceView])


class IndividualPreferenceView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    preferences: List[PreferenceView]


class WishlistProjects(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    wishlist: List[Project]


WishlistProjectsList = TypeAdapter(list[WishlistProjects])


class StudentView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    zid: str
    email: str
    password: str
    year: int | None
    role: Literal["student"]
    subcourses: Details
    experiences: List[Experience]


StudentList = TypeAdapter(list[StudentView])


class StudentDetailsView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    zid: str
    email: str
    password: str
    year: int | None
    role: Literal["student"]
    subcourses: List[Details]
    experiences: List[Experience]


StudentDetailsList = TypeAdapter(list[StudentDetailsView])


class ProjectGroupView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    clients: List[Client]
    groups: List[Group]  # Has groups embedded
    is_allocated: bool
    status: Literal["available", "unavailable", "submitted", "draft"]
    capacity: int
    course: Optional[PydanticObjectId]
    terms: List[int]
    category: str
    areas: List[str]
    background: str
    scope: str
    req_skills: str
    outcomes: str
    date_created: str
    date_modified: str
    attachments: List[str]
    proj_no: int | None
    color: str


ProjectGroupViewList = TypeAdapter(list[ProjectGroupView])


class ProjectAdminView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    clients: List[Client]
    groups: List[PydanticObjectId]
    is_allocated: bool
    status: Literal["available", "unavailable", "submitted", "draft"]
    capacity: int
    course: Optional[PydanticObjectId]
    terms: List[int]
    category: str
    areas: List[str]
    background: str
    scope: str
    req_skills: str
    outcomes: str
    date_created: str
    date_modified: str
    attachments: List[str]
    proj_no: int | None


ProjectAdminViewList = TypeAdapter(list[ProjectAdminView])


class GroupStudentView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    members: List[Student]
    tutorial: str
    bio: str | None
    goal: str | None
    project: PydanticObjectId | None
    draft_alloc: PydanticObjectId | None
    proj_preferences: List[Preference]
    topic_preferences: List[str]
    is_draft: bool
    links: List[WebLink]
    responses: List[Response]


GroupStudentViewList = TypeAdapter(list[GroupStudentView])


class GroupMemberView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    members: List[PydanticObjectId]


class ClientProjectView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str


class SubcourseClientView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    company_name: str
    is_verified: bool
    email: str
    role: str
    projects: List[ClientProjectView]


SubcourseClientViewList = TypeAdapter(list[SubcourseClientView])


class ProjectQuestionnaireView(BaseModel):
    def_project_preference_form: FormInputs


ProjectQuestionnaireViewList = TypeAdapter(list[ProjectQuestionnaireView])


class ClientQuestionnaireView(BaseModel):
    def_client_questionnaire: FormInputs


ClientQuestionnaireViewList = TypeAdapter(list[ClientQuestionnaireView])


class SubcourseFullView(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    code: str
    year: int
    term: int
    is_archived: bool
    students: List[StudentData]
    groups: List[GroupData]
    preference_release: bool
    max_group_size: int
    client_questionnaire: List[FormInputs]
    project_preference_form: List[FormInputs]
    parent_course: PydanticObjectId


SubcourseFullViewList = TypeAdapter(list[SubcourseFullView])


class ChannelIdentiferView(BaseModel):
    id: PydanticObjectId
    name: str


class ChannelsByCategory(BaseModel):
    category: str | int = Field(alias="_id")
    channels: List[ChannelIdentiferView]


ChannelsByCategoryList = TypeAdapter(list[ChannelsByCategory])


class ChannelConversationView(BaseModel):
    name: str
    conversations: List[Conversation]
    channel_type: Literal["announcement", "forum", "text"]


class PinnedPost(BaseModel):
    id: PydanticObjectId
    title: str | None
    creator: PydanticObjectId
    content: str
    date_created: str
    category: str | None


PinnedPostList = TypeAdapter(list[PinnedPost])


class Member(BaseModel):
    id: PydanticObjectId
    name: str


class ChannelMembers(BaseModel):
    id: str = Field(alias="_id")
    members: List[Member]


ChannelMembersList = TypeAdapter(list[ChannelMembers])


class RequestTermDates(BaseModel):
    course_id: str
    term_dates: Dict[str, str]


class CreateChannel(BaseModel):
    channel_type: str | None
    name: str | None
    category: str | None
    project: str | None
    client: str | None
    group: str | None


class ClientAllocationObject(BaseModel):
    project: PydanticObjectId
    groups: List[PydanticObjectId]


class UpdateClient(BaseModel):
    name: str
    email: str
    phone: str
    company_name: str
    industry: str
    company_abn: str
    hours: str
    is_verified: bool
    projects: List[PydanticObjectId]
    courses: List[PydanticObjectId]
    wishlist: List[ClientAllocationObject]
    preferences: List[ClientAllocationObject]
    company_brief: str
    company_address: str
