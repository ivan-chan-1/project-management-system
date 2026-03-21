"""
API routes and helper functions for channel related functionality
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from bson import ObjectId
from pydantic import ValidationError

from ..models.subcourse import Subcourse
from ..models.client import Client
from ..models.student import Student
from ..models.staff import Staff
from ..models.project import Project
from ..models.group import Group
from ..models.channel import Channel, Conversation, Post
from ..models.request_data import (
    ChannelsByCategory,
    ChannelsByCategoryList,
    ChannelConversationView,
    PinnedPost,
    PinnedPostList,
    ChannelMembers,
    ChannelMembersList,
    GroupMemberView,
    CreateChannel,
)

from .helper import role_required, id_validation
from .notifications import thread_reply_notification, announcement_notification
from .constants import DEFAULT_COURSE_CHANNELS, DEFAULT_PROJECT_CHANNELS

channels_bp = Blueprint("channels", __name__)


def active_subcourse(subcourse_id):
    """
    Checks if the given subcourse is an active subcourse

    Args:
        subcourse_id (str): the identifier of the subcourse

    Returns:
        str: the identifier of the subcourse
    """
    active = Subcourse.find_one(
        {"parent_course": ObjectId(subcourse_id), "is_published": True}
    ).run()

    if not active:
        raise ValueError("The course is not active yet. Please try again later")

    return str(active.id)


def create_default_channels(admin, clients):
    """
    Creates the default channels: including course channels and client channels

    Args:
        admin (str): the identifer of the admin
        clients (list(str)): a list of identifers of clients
    """
    try:
        channel_list = []

        for d in DEFAULT_COURSE_CHANNELS:
            channel = Channel(
                name=d["name"],
                members=[admin],
                project=None,
                channel_type=d["channel_type"],
                conversations=[],
                pinned=[],
                category="course",
            )

            channel.insert()
            channel_list.append(channel.id)

        for c in clients:
            client = Client.get(c).run()
            channel = Channel(
                name=client.name,
                members=[c, admin],
                project=None,
                channel_type="text",
                conversations=[],
                pinned=[],
                category="client",
            )

            channel.insert()
            channel_list.append(channel.id)

        return channel_list
    except RuntimeError as e:
        raise e


def add_members_course_channels(subcourse_id, member):
    """
    Adds a member to course channels

    Args:
        subcourse_id (str): the identifer of the subcourse
    """

    try:
        subcourse = Subcourse.get(subcourse_id).run()

        Channel.find_many(
            {"_id": {"$in": subcourse.channels}, "category": "course"}
        ).update_many(
            {
                "$addToSet": {
                    "members": {
                        "$each": subcourse.students
                        if member == "student"
                        else subcourse.staff
                    }
                }
            }
        ).run()
    except RuntimeError as e:
        raise e


def project_channels(subcourse_id):
    """
    Creates channels associated to a project including default project channels
    and channels for each group

    Args:
        subcourse_id (str): the identifer of the subcourse
    """
    subcourse = Subcourse.get(subcourse_id).run()
    if subcourse is None:
        raise ValueError("Subcourse not found")
    if (
        len(
            Channel.find_many(
                {"_id": {"$in": subcourse.channels}, "category": "project"}
            ).run()
        )
        != 0
    ):
        return

    query = [
        {"$match": {"_id": ObjectId(subcourse_id)}},
        {"$unwind": "$groups"},
        {
            "$lookup": {
                "from": "groups",
                "localField": "groups",
                "foreignField": "_id",
                "as": "groups",
            }
        },
        {"$unwind": "$groups"},
        {"$replaceRoot": {"newRoot": "$groups"}},
        {"$project": {"_id": 1, "name": 1, "members": 1}},
    ]

    res = Subcourse.aggregate(query, projection_model=GroupMemberView).run()
    groups = {str(g.id): {"name": g.name, "members": g.members} for g in res}

    try:
        channel_list = []
        for p in Project.find_many({"subcourse": ObjectId(subcourse_id)}).run():
            def_channels = []
            group_channels = []
            all_members = []

            # Create project channel for each group
            for g in p.groups:
                gid = str(g)
                if gid not in groups:
                    continue
                channel = Channel(
                    name=groups[gid]["name"],
                    members=groups[gid]["members"] + p.clients,
                    project=p.id,
                    channel_type="text",
                    conversations=[],
                    pinned=[],
                    category="project",
                )

                channel.insert()
                group_channels.append(channel.id)
                all_members += groups[gid]["members"]

            # Create default channels for project
            for d in DEFAULT_PROJECT_CHANNELS:
                channel = Channel(
                    name=d["name"],
                    members=p.clients + all_members,
                    project=p.id,
                    channel_type=d["channel_type"],
                    conversations=[],
                    pinned=[],
                    category="project",
                )

                channel.insert()
                def_channels.append(channel.id)

            channel_list += def_channels + group_channels

        subcourse.channels += channel_list
        subcourse.save()
    except RuntimeError as e:
        raise e


def save_post(channel_id, payload):
    """
    Add a post to the channel's list of conversations

    Args:
        channel_id (str): the identifier of a channel
        payload (dict[str, str]): the post's information: creator, content, date modified
    """
    try:
        if not channel_id:
            return

        # Add to conversation
        channel = Channel.get(channel_id).run()
        post = Post.model_validate(payload)
        channel.conversations.append(Conversation(post=post, replies=[]))
        channel.save()

        if channel.channel_type != "announcement":
            return

        # Notify of channel members if an announcement channel
        creator_id = post.creator
        client = Client.get(creator_id).run()
        if client:
            for recipient_id in channel.members:
                student = Student.get(recipient_id).run()
                if student:
                    announcement_notification(client.name, student.id, post.content)
        else:
            staff = Staff.get(creator_id).run()
            if staff and staff.role == "course admin":
                for recipient_id in channel.members:
                    if recipient_id != creator_id:
                        announcement_notification(
                            staff.name, recipient_id, post.content
                        )

        return
    except ValidationError as e:
        raise e
    except RuntimeError as e:
        raise e


def save_reply(channel_id, op_id, payload):
    """
    Add a reply to the conversation's list of replies

    Args:
        channel_id (str): the identifier of a channel
        payload (dict[str, str]): the post's information: creator, content, date modified
    """
    try:
        if not channel_id:
            return

        channel = Channel.get(channel_id).run()
        reply = Post.model_validate(payload)

        for c in channel.conversations:
            if c.post.id == ObjectId(op_id):
                c.replies.append(reply)
                creator_id = c.post.creator
                replier_id = reply.creator
                if creator_id != replier_id and channel.channel_type != "announcement":
                    thread_reply_notification(creator_id, replier_id, reply.content)
                break

        channel.save()
        return
    except RuntimeError as e:
        raise e


@channels_bp.route("/api/channels/list/<subcourse_id>", methods=["GET"])
@jwt_required()
def get_channels(subcourse_id):
    """
    Gets a list of channels where the user is a member

    Args:
        subcourse_id (string): the id of the subcourse
    """
    user_id = get_jwt_identity()

    claims = get_jwt()
    role = claims.get("role")

    try:
        id_validation(subcourse_id)

        if role == "client":
            subcourse_id = active_subcourse(subcourse_id)

        project_channel_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {
                "$lookup": {
                    "from": "channels",
                    "localField": "channels",
                    "foreignField": "_id",
                    "as": "channels",
                }
            },
            {"$unwind": "$channels"},
            {"$replaceRoot": {"newRoot": "$channels"}},
            {"$match": {"members": ObjectId(user_id)}},
            {"$match": {"category": {"$eq": "project"}}},
            {
                "$lookup": {
                    "from": "projects",
                    "localField": "project",
                    "foreignField": "_id",
                    "as": "project",
                }
            },
            {"$addFields": {"proj_no": {"$arrayElemAt": ["$project.proj_no", 0]}}},
            {"$project": {"name": 1, "proj_no": 1}},
            {
                "$group": {
                    "_id": "$proj_no",
                    "channels": {"$push": {"id": "$_id", "name": "$name"}},
                }
            },
        ]

        other_channel_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {
                "$lookup": {
                    "from": "channels",
                    "localField": "channels",
                    "foreignField": "_id",
                    "as": "channels",
                }
            },
            {"$unwind": "$channels"},
            {"$replaceRoot": {"newRoot": "$channels"}},
            {"$match": {"members": ObjectId(user_id)}},
            {"$match": {"category": {"$ne": "project"}}},
            {"$project": {"category": 1, "name": 1}},
            {
                "$group": {
                    "_id": "$category",
                    "channels": {"$push": {"id": "$_id", "name": "$name"}},
                }
            },
        ]

        proj_channels = Subcourse.aggregate(
            project_channel_query, projection_model=ChannelsByCategory
        ).run()
        other_channels = Subcourse.aggregate(
            other_channel_query, projection_model=ChannelsByCategory
        ).run()
        channels = other_channels + proj_channels
        return jsonify(ChannelsByCategoryList.dump_python(channels)), 200
    except ValueError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 400
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/list/<subcourse_id>/all", methods=["GET"])
@jwt_required()
@role_required("course admin")
def get_channels_all(subcourse_id):
    """
    Gets a list of all the channels in the subcourse

    Args:
        subcourse_id (string): the id of the subcourse
    """

    try:
        project_channel_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {
                "$lookup": {
                    "from": "channels",
                    "localField": "channels",
                    "foreignField": "_id",
                    "as": "channels",
                }
            },
            {"$unwind": "$channels"},
            {"$replaceRoot": {"newRoot": "$channels"}},
            {"$match": {"category": {"$eq": "project"}}},
            {
                "$lookup": {
                    "from": "projects",
                    "localField": "project",
                    "foreignField": "_id",
                    "as": "project",
                }
            },
            {"$addFields": {"proj_no": {"$arrayElemAt": ["$project.proj_no", 0]}}},
            {"$project": {"name": 1, "proj_no": 1}},
            {
                "$group": {
                    "_id": "$proj_no",
                    "channels": {"$push": {"id": "$_id", "name": "$name"}},
                }
            },
        ]

        other_channel_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {
                "$lookup": {
                    "from": "channels",
                    "localField": "channels",
                    "foreignField": "_id",
                    "as": "channels",
                }
            },
            {"$unwind": "$channels"},
            {"$replaceRoot": {"newRoot": "$channels"}},
            {"$match": {"category": {"$ne": "project"}}},
            {"$project": {"category": 1, "name": 1}},
            {
                "$group": {
                    "_id": "$category",
                    "channels": {"$push": {"id": "$_id", "name": "$name"}},
                }
            },
        ]

        proj_channels = Subcourse.aggregate(
            project_channel_query, projection_model=ChannelsByCategory
        ).run()
        other_channels = Subcourse.aggregate(
            other_channel_query, projection_model=ChannelsByCategory
        ).run()
        channels = other_channels + proj_channels
        return jsonify(ChannelsByCategoryList.dump_python(channels)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/<channel_id>/conversations", methods=["GET"])
def get_conversations(channel_id):
    """
    Gets a channel's list of conversations

    Args:
        channel_id (str): the identifier of the channel
    """
    try:
        channel = Channel.get(channel_id).project(ChannelConversationView).run()
        return channel.model_dump(), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/pin/<channel_id>/<post_id>", methods=["PUT"])
def pin_post(channel_id, post_id):
    """
    Given a post, pin the post in the channel

    Args:
        channel_id (str): identifer of the channel
        post_id (str): identifer of the post
    """
    try:
        channel = Channel.get(channel_id).run()
        channel.pinned.append(ObjectId(post_id))
        channel.save()
        return jsonify({"message": f"{post_id} pinned successfully"}), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/unpin/<channel_id>/<post_id>", methods=["PUT"])
def unpin_post(channel_id, post_id):
    """
    Given a post, unpin the post from a channel

    Args:
        channel_id (str): identifer of the channel
        post_id (str): identifer of the post
    """
    try:
        channel = Channel.get(channel_id).run()
        channel.pinned = list(
            filter(lambda p: (p != ObjectId(post_id)), channel.pinned)
        )
        channel.save()
        return jsonify({"message": f"{post_id} unpinned successfully"}), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/pinned/<channel_id>/<post_id>", methods=["GET"])
def is_pinned(channel_id, post_id):
    """
    Given a post, unpin the post from a channel

    Args:
        channel_id (str): identifer of the channel
        post_id (str): identifer of the post
    """
    try:
        channel = Channel.get(channel_id).run()
        if ObjectId(post_id) in channel.pinned:
            return jsonify({"pinned": True}), 200

        return jsonify({"pinned": False}), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/pinned/<channel_id>", methods=["GET"])
def get_all_pinned_posts(channel_id):
    """
    Get all the pinned messages in a channel

    Args:
        channel_id (str): identifer of the channel
    """
    try:
        query = [
            {"$match": {"_id": ObjectId(channel_id)}},
            {
                "$project": {
                    "posts": {
                        "$filter": {
                            "input": "$conversations.post",
                            "as": "post",
                            "cond": {"$in": ["$$post.id", "$pinned"]},
                        }
                    }
                }
            },
            {"$unwind": "$posts"},
            {"$replaceRoot": {"newRoot": "$posts"}},
        ]

        posts = Channel.aggregate(query, projection_model=PinnedPost).run()
        return jsonify(PinnedPostList.dump_python(posts)), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/<channel_id>/members", methods=["GET"])
def get_all_members(channel_id):
    """
    Gets a list of members in a channel

    Args:
        channel_id (str): the identifier of a channel

    Returns:
        Response: a jsonified dict that groups members by role
    """
    try:
        query = [
            {"$match": {"_id": ObjectId(channel_id)}},
            {
                "$lookup": {
                    "from": "students",
                    "let": {"channel_members": "$members"},
                    "pipeline": [
                        {"$unionWith": "staff"},
                        {"$unionWith": "clients"},
                        {"$match": {"$expr": {"$in": ["$_id", "$$channel_members"]}}},
                        {"$project": {"_id": 1, "name": 1, "role": 1}},
                    ],
                    "as": "members",
                }
            },
            {"$unwind": "$members"},
            {"$replaceRoot": {"newRoot": "$members"}},
            {
                "$group": {
                    "_id": "$role",
                    "members": {"$push": {"id": "$_id", "name": "$name"}},
                }
            },
        ]

        members = Channel.aggregate(query, projection_model=ChannelMembers).run()
        return jsonify(ChannelMembersList.dump_python(members)), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/<channel_id>/creators", methods=["GET"])
def get_all_creators(channel_id):
    """
    Gets a list of creators in a channel

    Args:
        channel_id (str): the identifier of a channel

    Returns:
        Response: a jsonified dict that maps a channel member's id to details
    """
    try:
        query = [
            {"$match": {"_id": ObjectId(channel_id)}},
            {
                "$lookup": {
                    "from": "students",
                    "let": {"channel_members": "$members"},
                    "pipeline": [
                        {"$unionWith": "staff"},
                        {"$unionWith": "clients"},
                        {"$match": {"$expr": {"$in": ["$_id", "$$channel_members"]}}},
                        {"$project": {"_id": 1, "name": 1, "role": 1}},
                    ],
                    "as": "members",
                }
            },
            {"$unwind": "$members"},
            {"$replaceRoot": {"newRoot": "$members"}},
        ]

        creators = Channel.aggregate(query).run()
        creators_dict = {
            str(c["_id"]): {k: v for k, v in c.items() if k != "_id"} for c in creators
        }
        return jsonify(creators_dict), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@channels_bp.route("/api/channels/<subcourse_id>/create", methods=["POST"])
@jwt_required()
@role_required("course admin")
def create_channel(subcourse_id):
    """
    Creates a channel of a specific type for a specific subcourse

    Args:
        subcourse_id (str): identifier of a subcourse

    Returns:
        Response
    """
    try:
        staff_id = get_jwt_identity()
        subcourse = Subcourse.get(subcourse_id).run()
        data = CreateChannel.model_validate_json(request.data)

        if data.category is None:
            return jsonify({"message": "Missing Field"}), 400

        channel = None

        if data.category == "course":
            channel = Channel(
                name=data.name,
                members=subcourse.students + [ObjectId(staff_id)],
                project=None,
                channel_type=data.channel_type,
                conversations=[],
                pinned=[],
                category="course",
            )
        elif data.category == "project" and data.group is not None:
            project = Project.get(data.project).run()
            group = Group.get(data.group).run()

            channel = Channel(
                name=data.name,
                members=group.members + project.clients,
                project=project.id,
                channel_type=data.channel_type,
                conversations=[],
                pinned=[],
                category="project",
            )
        elif data.category == "project" and data.group is None:
            project = Project.get(data.project).run()
            groups = Group.find_many({"_id": {"$in": project.groups}}).run()
            members = []
            for g in groups:
                members += g.members

            channel = Channel(
                name=data.name,
                members=members + project.clients,
                project=project.id,
                channel_type=data.channel_type,
                conversations=[],
                pinned=[],
                category="project",
            )
        elif data.category == "client" and data.group is None:
            client = Client.get(data.client).run()

            channel = Channel(
                name=client.name,
                members=[client.id, ObjectId(staff_id)],
                project=None,
                channel_type="text",
                conversations=[],
                pinned=[],
                category="client",
            )

        if channel is None:
            return jsonify({"Error": "Invalid category"}), 400

        channel.insert()
        subcourse.channels.append(channel.id)
        subcourse.save()
        return jsonify({"message": "Created channel successfully"}), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
