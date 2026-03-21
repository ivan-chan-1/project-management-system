"""
Tests for channel-related functionality
"""

from bson import ObjectId
from ..src.channels import (
    save_post,
    save_reply,
    create_default_channels,
    add_members_course_channels,
    project_channels,
)
from ..models.channel import Channel, Post, Conversation
from ..models.subcourse import Subcourse
from .helper import (
    create_student,
    create_staff,
    create_project,
    generate_token,
    create_subcourse,
    create_group,
    create_course,
    create_client,
)


def create_channel(channel_type, category, members=None, posts=None):
    """
    Instantiates a test Channel
    """
    if members is None:
        members = []

    conversations = []
    if posts is not None:
        conversations = [
            Conversation(
                post=Post(
                    id=p["id"],
                    title=p["title"],
                    creator=p["creator"],
                    content=p["content"],
                    date_created=p["date_created"],
                    category=p["category"],
                ),
                replies=[],
            )
            for p in posts
        ]

    return Channel(
        name="General",
        members=members,
        project=None,
        channel_type=channel_type,
        conversations=conversations,
        pinned=[],
        category=category,
    )


def create_payload(creator=None):
    """
    Instantiating a post payload
    """
    if creator is None:
        creator = ObjectId()
    return {
        "id": ObjectId(),
        "title": "Post Title",
        "creator": creator,
        "content": "Post content",
        "date_created": "2025-01-20",
        "category": None,
    }


# pylint: disable=unused-argument
def test_save_post(client):
    """
    Tests saving a post in a course channel to the database
    """
    channel = create_channel("text", "course")
    channel.insert()

    payload = create_payload()

    save_post(str(channel.id), payload)
    new_channel = Channel.get(channel.id).run()
    assert len(new_channel.conversations) == 1


# pylint: disable=unused-argument
def test_save_post_project_announcement(client, app):
    """
    Tests saving a project announcement post in a course channel to the database
    """
    student = create_student()
    student.insert()
    _client = create_client()
    _client.insert()
    channel = create_channel(
        "announcement", "project", members=[student.id, _client.id]
    )
    channel.insert()

    payload = create_payload(_client.id)

    with app.app_context():
        save_post(str(channel.id), payload)
    new_channel = Channel.get(channel.id).run()
    assert len(new_channel.conversations) == 1


# pylint: disable=unused-argument
def test_save_post_course_announcement(client, app):
    """
    Tests saving a project announcement post in a course channel to the database
    """
    student = create_student()
    student.insert()
    staff = create_staff()
    staff.insert()
    channel = create_channel("announcement", "course", members=[student.id, staff.id])
    channel.insert()

    payload = create_payload(staff.id)

    with app.app_context():
        save_post(str(channel.id), payload)
    new_channel = Channel.get(channel.id).run()
    assert len(new_channel.conversations) == 1


# pylint: disable=unused-argument
def test_save_post_invalid_id(client):
    """
    Test saving a post with an invalid channel id
    """
    assert save_post(None, create_payload()) is None


# pylint: disable=unused-argument
def test_save_reply_invalid_id(client):
    """
    Test saving a reply with an invalid channel id
    """
    assert save_reply(None, str(ObjectId()), create_payload()) is None


# pylint: disable=unused-argument
def test_save_reply(client, app):
    """
    Test saving a reply
    """
    student1 = create_student()
    student1.insert()
    student2 = create_student()
    student2.insert()
    post = create_payload(creator=student1.id)
    channel = create_channel(
        "text", "project", members=[student1.id, student2.id], posts=[post]
    )

    channel.insert()

    with app.app_context():
        save_reply(channel.id, post["id"], create_payload(creator=student2.id))

    new_channel = Channel.get(channel.id).run()
    assert len(new_channel.conversations) == 1
    assert len(new_channel.conversations[0].replies) == 1


def test_get_channels_student(client, app):
    """
    Test getting all channels a student is a member of
    """
    subcourse = create_subcourse()
    student = create_student()
    student.insert()

    course_channel = create_channel("text", "course", members=[student.id])
    course_channel.insert()

    project = create_project(ObjectId())
    project.insert()

    project_channel = create_channel("text", "project", members=[student.id])
    project_channel.project = project.id
    project_channel.insert()

    subcourse.channels = [course_channel.id, project_channel.id]
    subcourse.save()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/channels/list/{str(subcourse.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 2


def test_get_channels_client(client, app):
    """
    Test getting all channels a client is a member of
    """
    course = create_course()
    course.insert()
    subcourse = create_subcourse()
    _client = create_client()
    _client.insert()

    client_channel = create_channel("text", "client", members=[_client.id])
    client_channel.insert()

    project = create_project(ObjectId())
    project.insert()

    project_channel = create_channel("text", "project", members=[_client.id])
    project_channel.project = project.id
    project_channel.insert()

    subcourse.is_published = True
    subcourse.parent_course = course.id
    subcourse.channels = [client_channel.id, project_channel.id]
    subcourse.save()

    with app.app_context():
        token = generate_token(_client)

    res = client.get(
        f"/api/channels/list/{str(course.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 2


def test_get_channels_staff(client, app):
    """
    Test getting all channels a student is a member of
    """
    subcourse = create_subcourse()
    staff = create_staff(subcourse=subcourse.id)
    staff.insert()

    course_channel = create_channel("text", "course", members=[staff.id])
    course_channel.insert()

    project = create_project(ObjectId())
    project.insert()

    project_channel = create_channel("text", "project", members=[staff.id])
    project_channel.project = project.id
    project_channel.insert()

    subcourse.channels = [course_channel.id, project_channel.id]
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/channels/list/{str(subcourse.id)}/all",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 2


def test_get_conversations(client):
    """
    Tests getting conversations in a channel
    """
    post1 = create_payload()
    post2 = create_payload()

    channel = create_channel("text", "course", posts=[post1, post2])
    channel.insert()

    res = client.get(f"/api/channels/{str(channel.id)}/conversations")

    assert res.status_code == 200
    data = res.get_json()
    assert len(data["conversations"]) == 2


def test_pin_post(client):
    """
    Tests pinning a post
    """
    post1 = create_payload()
    post2 = create_payload()

    channel = create_channel("text", "course", posts=[post1, post2])
    channel.insert()

    res = client.put(f"/api/channels/pin/{str(channel.id)}/{post1['id']}")
    assert res.status_code == 200


def test_unpin_post(client):
    """
    Tests unpinning a post
    """
    post1 = create_payload()
    post2 = create_payload()

    channel = create_channel("text", "course", posts=[post1, post2])
    channel.insert()

    res = client.put(f"/api/channels/unpin/{str(channel.id)}/{post1['id']}")
    assert res.status_code == 200


def test_is_pin_post(client):
    """
    Tests checking if a post is pinned or not
    """
    post1 = create_payload()
    post2 = create_payload()

    channel = create_channel("text", "course", posts=[post1, post2])

    channel.pinned.append(ObjectId(post1["id"]))
    channel.insert()

    res = client.get(f"/api/channels/pinned/{str(channel.id)}/{post1['id']}")
    assert res.status_code == 200
    data = res.get_json()
    assert data["pinned"] is True

    res = client.get(f"/api/channels/pinned/{str(channel.id)}/{post2['id']}")
    assert res.status_code == 200
    data = res.get_json()
    assert data["pinned"] is False


def test_get_all_pinned_posts(client):
    """
    Tests retrieving all pinned posts
    """
    post1 = create_payload()
    post2 = create_payload()

    channel = create_channel("text", "course", posts=[post1, post2])

    channel.pinned.append(ObjectId(post1["id"]))
    channel.pinned.append(ObjectId(post2["id"]))
    channel.insert()

    res = client.get(f"/api/channels/pinned/{str(channel.id)}")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 2


def test_get_all_channel_members(client):
    """
    Tests retrieving all channel members
    """
    student = create_student()
    student.insert()
    staff = create_staff()
    staff.insert()
    _client = create_client()
    _client.insert()

    channel = create_channel(
        "text", "course", members=[student.id, staff.id, _client.id]
    )
    channel.insert()

    res = client.get(f"/api/channels/{str(channel.id)}/members")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 3


def test_get_all_channel_creators(client):
    """
    Tests retrieving all channel members
    """
    student = create_student()
    student.insert()
    staff = create_staff()
    staff.insert()
    _client = create_client()
    _client.insert()

    channel = create_channel(
        "text", "course", members=[student.id, staff.id, _client.id]
    )
    channel.insert()

    res = client.get(f"/api/channels/{str(channel.id)}/creators")
    assert res.status_code == 200
    data = res.get_json()
    assert data[str(student.id)]["name"] == student.name
    assert data[str(staff.id)]["name"] == staff.name
    assert data[str(_client.id)]["name"] == _client.name


def test_create_channel_course(client, app):
    """
    Tests creating a course channel
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "channel_type": "text",
        "name": "General",
        "category": "course",
        "project": None,
        "client": None,
        "group": None,
    }

    res = client.post(
        f"/api/channels/{str(subcourse.id)}/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.channels) == 1


def test_create_channel_project_broadcast(client, app):
    """
    Tests creating a project broadcast channel
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    group = create_group(ObjectId())
    group.insert()

    project = create_project(subcourse.id)
    project.clients = [ObjectId()]
    project.groups = [group.id]
    project.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "channel_type": "text",
        "name": "General",
        "category": "project",
        "project": str(project.id),
        "client": None,
        "group": None,
    }

    res = client.post(
        f"/api/channels/{str(subcourse.id)}/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.channels) == 1


def test_create_channel_project_private(client, app):
    """
    Tests creating a project private channel
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    group = create_group(ObjectId())
    group.insert()

    project = create_project(subcourse.id)
    project.clients = [ObjectId()]
    project.groups = [group.id]
    project.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "channel_type": "text",
        "name": "General",
        "category": "project",
        "project": str(project.id),
        "client": None,
        "group": str(group.id),
    }

    res = client.post(
        f"/api/channels/{str(subcourse.id)}/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.channels) == 1


def test_create_channel_client(client, app):
    """
    Tests creating a client channel
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "channel_type": "text",
        "name": "General",
        "category": "client",
        "project": None,
        "client": str(_client.id),
        "group": None,
    }

    res = client.post(
        f"/api/channels/{str(subcourse.id)}/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.channels) == 1


def test_create_channel_invalid_category(client, app):
    """
    Tests creating a channel with invalid category
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "channel_type": "text",
        "name": "General",
        "category": "A bad category",
        "project": None,
        "client": None,
        "group": None,
    }

    res = client.post(
        f"/api/channels/{str(subcourse.id)}/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 400


def test_create_channel_no_category(client, app):
    """
    Tests creating a channel with invalid category
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "channel_type": "text",
        "name": "General",
        "category": None,
        "project": None,
        "client": None,
        "group": None,
    }

    res = client.post(
        f"/api/channels/{str(subcourse.id)}/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 400


def test_create_default_channels():
    """
    Tests creating the default channels
    """
    staff = create_staff()
    staff.insert()

    _client = create_client()
    _client.insert()

    res = create_default_channels(staff.id, [_client.id])
    assert len(res) == 4


def test_add_members_course_channels():
    """
    Tests adding members to course channels
    """
    subcourse = create_subcourse()
    subcourse.insert()

    channel = create_channel(channel_type="announcement", category="course")
    channel.insert()

    subcourse.students = [ObjectId(), ObjectId()]
    subcourse.channels.append(channel.id)
    subcourse.save()

    assert add_members_course_channels(str(subcourse.id), "student") is None
    new_channel = Channel.get(channel.id).run()
    assert len(new_channel.members) == 2


def test_project_channels():
    """
    Tests generating project channels on allocation
    """
    subcourse = create_subcourse()
    subcourse.insert()

    group1 = create_group(ObjectId())
    group1.insert()

    group2 = create_group(ObjectId())
    group2.insert()

    project = create_project(subcourse.id)
    project.clients = [ObjectId()]
    project.groups = [group1.id, group2.id]
    project.insert()

    subcourse.groups = [group1.id, group2.id]
    subcourse.save()

    assert project_channels(str(subcourse.id)) is None
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.channels) == 4
