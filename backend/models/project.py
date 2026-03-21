"""
Model to represent a project
"""

from typing import List, Literal, Optional
from .response import Response
from bunnet import Document, PydanticObjectId


class Project(Document):
    """
    Stores all project details
    - name
    - clients
    - groups: a list of current groups allocated/interested to project
    - is_allocated: indicates if list of groups above is interested or allocated
    - status
        - available: approved and visible in current course iteration
        - unavailable: approved and but not visible in current course iteration
        - submitted: awaiting approval from admin
        - draft: yet to submit
    - capacity: the maximum amount groups that can be allocated to the project
    - terms: a list of terms where project can be available
    - areas: a list of related topic areas
    - background
    - scope
    - req_skills
    - outcomes
    - date_created
    - date_modified
    - attachments
    """

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
    embedded_background: List[float]
    subcourse: PydanticObjectId | None
    color: str

    class Settings:
        """
        Configurations
        """

        name = "projects"
