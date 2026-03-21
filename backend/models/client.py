"""
Model to represent a client
"""

from typing import List, Literal
from bunnet import Document, PydanticObjectId
from .preference import ClientPreference


class Client(Document):
    """
    Stores all client details
    - name
    - email: the client's company email
    - password: a hashed string of password credential
    - role: client
    - phone
    - is_verified: indicates if client has been verified (verified if any course admin has once approved client)
    - company_name
    - company_brief: a description of the company, and why it is suitable for the course
    - company_address: the company's location address
    - company_industry
    - company_abn
    - contact_hours
    - projects
    - courses: a list of courses the client is involved in
    - wishlist: a list containing lists of groups potentially suitable for a project
    - preferences: a list containing lists of groups preferenced to be suitable for a project
    """

    name: str
    email: str
    password: str
    role: Literal["client"]
    phone: str
    is_verified: bool
    company_name: str
    company_brief: str
    company_address: str
    company_industry: str
    company_abn: str
    contact_hours: str
    projects: List[PydanticObjectId]
    courses: List[PydanticObjectId]
    wishlist: List[ClientPreference]
    preferences: List[ClientPreference]
    reset_pin: str | None

    class Settings:
        """
        Configurations
        """

        name = "clients"
