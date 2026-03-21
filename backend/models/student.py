"""
Model to represent a student
"""

from typing import List, Literal
from bunnet import Document, PydanticObjectId
from pydantic import BaseModel
from .preference import Preference


class Experience(BaseModel):
    """
    Stores all student experiences
    - title
    - description
    """

    title: str
    description: str


class Details(BaseModel):
    """
    Stores all student detail within a subcourse
    - subcourse: the id of the subcourse
    - tutorial
    - group: the student's published group allocation. If not allocated, None.
    - draft_alloc: the student's unpublished group allocation
    - wishlist: a list containing of liked projects
    - preferences: a list containing of ranked projects
    """

    subcourse: PydanticObjectId | None
    tutorial: str | None
    group: PydanticObjectId | None
    draft_alloc: PydanticObjectId | None
    wishlist: List[PydanticObjectId]
    preferences: List[Preference]


class Student(Document):
    """
    Stores all student details
    - name
    - zID
    - email: a zID email
    - password: a hashed string
    - year: the current stage of degree (user inputted)
    - role: student
    - subcourses: a list of the student details in a subcourse
    - experiences: a list of the student's experiences
    """

    name: str
    zid: str
    email: str
    password: str
    year: int | None
    role: Literal["student"]
    subcourses: List[Details]
    experiences: List[Experience]
    reset_pin: str | None

    class Settings:
        """
        Configurations
        """

        name = "students"
