"""
Model to represent a channel
"""

from typing import List, Literal
from bunnet import Document, PydanticObjectId
from pydantic import BaseModel


class Post(BaseModel):
    id: PydanticObjectId
    title: str | None
    creator: PydanticObjectId
    content: str
    date_created: str
    category: str | None


class Conversation(BaseModel):
    post: Post
    replies: List[Post]


class Channel(Document):
    """
    Stores all channel details:

    - name: name of the channel
    - members: members of the channel. Empty if is_broadcast is true
        - A tutor is by default a member of their tutorial's group's private channels with client
    - project: the project related to a channel. If no related project, None.
    - channel_type: a channel can be:
        - announcements:
            - if project is None, then posts/notifcations broadcasted course-wide,
              i.e. to all members
            - if project is not None, then it is a project-wide broadcast intended for client
              to contact all groups at once
        - forum:
            - intended for posts with categories
        - text: for normal posts
    - conversations: list of conversations
    - pinned: the pinned conversations in a channel
    - category: string
    """

    name: str
    members: List[PydanticObjectId]
    project: PydanticObjectId | None
    channel_type: Literal["announcement", "forum", "text"]
    conversations: List[Conversation]
    pinned: List[PydanticObjectId]
    category: Literal["course", "project", "client", "tutorial"]

    class Settings:
        """
        Configurations
        """

        name = "channels"
