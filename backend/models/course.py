"""
Model to represent a course
"""

from typing import List, Literal, Dict
from bunnet import Document, PydanticObjectId
from pydantic import BaseModel


class FormInputs(BaseModel):
    """
    Stores form inputs of customised forms
    - input_type: the html form input type
    - label: the input's label
    - value: the default value/prompt
    - options: a list of other necessary html attributes
    """

    id: PydanticObjectId
    input_type: Literal[
        "text", "radio", "checkbox", "textarea", "number", "dropdown", "select"
    ]
    label: str
    value: str | List[str] | None
    options: List[str]


class Course(Document):
    """
    Stores all course details
    - name
    - description
    - terms: a list of terms when the course is available
    - clients: a list of all clients who have applied to/joined the course
    - projects: a list of projects that have been submitted/approved to the course
    - def_client_questionnaire: the default client questionnaire form
    - def_project_preference_form: the default project questionnaire form
    - embedded_description: Vector of the description
    """

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
    embedded_description: List[float]

    class Settings:
        """
        Configurations
        """

        name = "courses"
