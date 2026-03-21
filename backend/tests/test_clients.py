"""
Tests for client-related functionality
"""

from bson import ObjectId
import pytest
from ..models.client import Client
from .helper import (
    create_client,
    create_course,
    create_project,
    generate_token,
    create_staff,
    create_subcourse,
)
from ..src.clients import client_verified, client_unverified, client_course


def test_client_projects(client, app):
    """
    Tests retrieving a client's projects
    """
    _client = create_client()
    _client.insert()

    course = create_course()
    course.insert()

    project = create_project(ObjectId())
    project.course = course.id
    project.insert()
    _client.projects.append(project.id)
    _client.save()

    with app.app_context():
        token = generate_token(_client)

    res = client.get(
        "/api/client/projects",
        headers={"Authorization": f"Bearer {token}"},
        query_string={"clientId": str(_client.id), "courseId": str(course.id)},
    )

    assert res.status_code == 200

    data = res.get_json()
    assert len(data) == 1
    assert data[0]["id"] == str(project.id)


def test_client_courses(client, app):
    """
    Tests retrieving a client's courses
    """
    _client = create_client()
    _client.insert()

    course = create_course()
    course.insert()

    _client.courses.append(course.id)
    _client.save()

    with app.app_context():
        token = generate_token(_client)

    res = client.get(
        "/api/client/courses",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200

    data = res.get_json()
    assert len(data) == 1
    assert data[0]["id"] == str(course.id)


def test_client_profile(client, app):
    """
    Tests retrieving a client's details
    """
    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(_client)

    res = client.get(
        f"/api/client/details/{str(_client.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data["name"] == _client.name


def test_client_update(client, app):
    """
    Tests updating a client's details
    """
    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(_client)

    data = {
        "name": "New Client Name",
        "email": "new@gmail.com",
        "phone": "04000000000",
        "company_name": "New Company",
        "industry": "Education",
        "company_abn": "1000000000",
        "hours": "900-900",
        "is_verified": False,
        "projects": [],
        "courses": [],
        "wishlist": [],
        "preferences": [],
        "company_brief": "Lorem",
        "company_address": "Lorem",
    }

    res = client.put(
        f"/api/client/update/{str(_client.id)}",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data["name"] == "New Client Name"


def test_client_update_no_details(client, app):
    """
    Tests updating a client's details with no data
    """
    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(_client)

    res = client.put(
        f"/api/client/update/{str(_client.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 400


def test_verify_client(client, app):
    """
    Tests verifying a client
    """
    admin = create_staff()
    admin.insert()

    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(admin)

    data = {"client_id": str(_client.id)}

    with app.app_context():
        res = client.put(
            "/api/admin/client/verify",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

    assert res.status_code == 200
    new_client = Client.get(_client.id).run()
    assert new_client.is_verified is True


def test_verify_client_no_client(client, app):
    """
    Tests verifying a client with no client
    """
    admin = create_staff()
    admin.insert()

    with app.app_context():
        token = generate_token(admin)

    with app.app_context():
        res = client.put(
            "/api/admin/client/verify",
            headers={"Authorization": f"Bearer {token}"},
            json={},
        )

    assert res.status_code == 400


def test_reject_client(client, app):
    """
    Tests rejecting a client
    """
    admin = create_staff()
    admin.insert()

    _client = create_client()
    _client.is_verified = True
    _client.insert()

    with app.app_context():
        token = generate_token(admin)

    data = {"client_id": str(_client.id)}

    with app.app_context():
        res = client.put(
            "/api/admin/client/reject",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

    assert res.status_code == 200
    new_client = Client.get(_client.id).run()
    assert new_client.is_verified is False


def test_reject_client_no_client(client, app):
    """
    Tests verifying a client with no client
    """
    admin = create_staff()
    admin.insert()

    with app.app_context():
        token = generate_token(admin)

    with app.app_context():
        res = client.put(
            "/api/admin/client/reject",
            headers={"Authorization": f"Bearer {token}"},
            json={},
        )

    assert res.status_code == 400


def test_get_clients(client, app):
    """
    Tests retrieving all clients of a subcourse and their projects
    """
    _client = create_client()
    _client.insert()

    course = create_course()
    course.clients.append(_client.id)
    course.insert()
    subcourse = create_subcourse()
    subcourse.parent_course = course.id
    subcourse.insert()

    project1 = create_project(subcourse.id)
    project1.clients.append(_client.id)
    project1.insert()

    project2 = create_project(ObjectId())
    project2.clients.append(_client.id)
    project2.insert()

    _client.projects.append(project1.id)
    _client.projects.append(project2.id)
    _client.save()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/admin/allclients/{str(subcourse.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data[0]["id"] == str(_client.id)
    assert data[0]["projects"][0]["id"] == str(project1.id)

# pylint: disable=unused-argument
def test_client_verified(client):
    """
    Tests retrieving all verified clients
    """
    course = create_course()
    _client = create_client()
    _client.is_verified = True
    _client.insert()

    course.clients.append(_client.id)
    course.insert()

    res = client_verified(str(course.id))
    assert res["verified_clients"] == 1

# pylint: disable=unused-argument
def test_client_verified_no_course(client):
    """
    Tests retrieving all verified clients, with no course
    """
    with pytest.raises(ValueError, match="Subcourse does not exist in the database"):
        client_verified(ObjectId())

# pylint: disable=unused-argument
def test_client_verified_no_clients(client):
    """
    Tests retrieving all verified clients, with no clients
    """
    course = create_course()
    course.insert()

    res = client_verified(str(course.id))
    assert res["verified_clients"] == 0

# pylint: disable=unused-argument
def test_client_unverified(client):
    """
    Tests retrieving all unverified clients
    """
    course = create_course()
    _client = create_client()
    _client.insert()

    course.clients.append(_client.id)
    course.insert()

    res = client_unverified(str(course.id))
    assert res["unverified_clients"] == 1

# pylint: disable=unused-argument
def test_client_unverified_no_course(client):
    """
    Tests retrieving all unverified clients, with no course
    """
    with pytest.raises(ValueError, match="Subcourse does not exist in the database"):
        client_unverified(ObjectId())

# pylint: disable=unused-argument
def test_client_unverified_no_clients(client):
    """
    Tests retrieving all unverified clients, with no clients
    """
    course = create_course()
    course.insert()

    res = client_unverified(str(course.id))
    assert res["unverified_clients"] == 0

# pylint: disable=unused-argument
def test_client_course(client):
    """
    Tests retrieving the number of clients in a subcourse
    """
    subcourse = create_subcourse()
    subcourse.clients.append(ObjectId())
    subcourse.insert()

    res = client_course(str(subcourse.id))
    assert res["number_clients"] == 2

# pylint: disable=unused-argument
def test_client_course_no_clients(client):
    """
    Tests retrieving the number of clients in a subcourse, with no clients
    """
    subcourse = create_subcourse()
    subcourse.clients = []
    subcourse.insert()

    res = client_course(str(subcourse.id))
    assert res["number_clients"] == 0

# pylint: disable=unused-argument
def test_client_course_no_subcourse(client):
    """
    Tests retrieving the number of clients in a subcourse, with no subcourse
    """

    with pytest.raises(ValueError, match="Subcourse does not exist in the database"):
        client_course(ObjectId())
