"""
Model to represent a staff
"""

from typing import List, Literal
from bunnet import Document, PydanticObjectId
from pydantic import BaseModel


class Class(BaseModel):
    """
    Stores all the classes the staff member teaches
    - subcourse: the id of the subcourse (course iteration)
    - tutorials: a list of tutorials the staff member teaches
    """

    subcourse: PydanticObjectId
    tutorials: List[str]


class WebLink(BaseModel):
    """
    Represents a link
    - name: name of the website or route
    - url: the link of the website or route
    - subcourse: the subcourse to which links belong to
    """

    name: str
    url: str
    subcourse: PydanticObjectId


class Staff(Document):
    """
    Stores all staff details
    - name
    - zID
    - email: a zID email
    - password: a hashed string of password credential
    - role: "course admin" or "tutor"
    - classes: a list of all the classes the staff member teaches
    """

    name: str
    zid: str
    email: str
    password: str
    role: Literal["course admin", "tutor"]
    classes: List[Class]
    reset_pin: str | None
    links: List[WebLink]

    class Settings:
        """
        Configurations
        """

        name = "staff"
