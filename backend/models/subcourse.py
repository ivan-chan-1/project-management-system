"""
Model to represent a subcourse
"""

from typing import List
from bunnet import Document, PydanticObjectId
from .course import FormInputs


class Subcourse(Document):
    """
    Stores all details of a course iteration (aka subcourse)
    - name
    - owner: the id of the course admin/coordinator
    - year: the year which the subcourse is/was offered
    - term: the term which the subcourse is/was offered
    - is_archived
    - students: a list of student ObjectIds enrolled in this subcourse
    - staff: a list of staff ObjectIds teaching in this subcourse
    - groups: a list of groups in this subcourse
    - projects: a list of projects selected and published for this subcourse
    - clients: a list of the clients participating in this iteration
    - channels: a list of channels for this subcourse
    - client_questionaire: the client questionnaire for this specifc term
    - project_preference_form: the project questionnaire for this specifc term
    - is_published: indicates if the subcourse is active and viewable by students
    - max_group_size: Maximum size of capstone project groups
    - is_default: Whether the form inputs are default for the entire course
    - preference_release: Whether the project preference form is released to students
    """

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
    max_group_size: int
    preference_release: bool
    color: str

    class Settings:
        """
        Configurations
        """

        name = "subcourses"
