"""
Model to represent a response
"""

from bunnet import PydanticObjectId
from pydantic import BaseModel


class Response(BaseModel):
    """
    Stores a group/client's responses to form
    - question: the id of the question
    - answer: response, as a string
    """

    question: PydanticObjectId
    answer: str
