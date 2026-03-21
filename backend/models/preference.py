"""
Model to represent preferences
"""

from typing import List
from bunnet import PydanticObjectId
from pydantic import BaseModel


# Add more fields based off questionaire
class Preference(BaseModel):
    """
    Stores a student/group's project preference
    - project: the id of desired project
    - notes: optional reasoning of preference
    """

    project: PydanticObjectId
    notes: str
    rank: int


class ClientPreference(BaseModel):
    """
    Stores a client's preference of suitable groups
    - project: the id of project
    - groups: a list of suitable groups
    """

    project: PydanticObjectId
    groups: List[PydanticObjectId]
