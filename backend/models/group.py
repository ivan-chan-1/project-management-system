"""
Model to represent a group
"""

from typing import List
from bunnet import Document, PydanticObjectId
from pydantic import BaseModel
from .preference import Preference
from .response import Response


class WebLink(BaseModel):
    name: str
    url: str


class Group(Document):
    """
    Stores all group details
    - name
    - members
    - tutorial
    - bio
    - goal
    - project: the group's published project allocation. If not allocated, is None
    - draft_alloc: the group's unpublished project allocation
    - proj_preferences: a list of the group's project preferences
    - topic_preferences: a list of the group's topic preferences
    - is_draft: indicates if the above preferences have been submitted or not
    - links: a list of customised website shortcuts on project page
    - responses: a list of responses to project preference form
    """

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
    lead: PydanticObjectId | None

    class Settings:
        """
        Configurations
        """

        name = "groups"
