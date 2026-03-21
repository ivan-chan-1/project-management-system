"""
Tests for project-related functionality
"""
from bson import ObjectId
from ..models.project import Project
from ..models.response import Response
from ..models.subcourse import Subcourse
from .helper import (
    create_client,
    generate_token,
    create_subcourse,
    create_staff,
)


def create_project():
    """
    Instantiate a project
    """
    return Project(
        name="X",
        clients=[],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=None,
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=ObjectId(),
        color="#229f00",
    )

def create_project_2():
    """
    Instantiate a second project
    """
    return Project(
        name="Second Project",
        clients=[],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=None,
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=ObjectId(),
        color="#229f00",
    )

def test_project_profile_invalid(client):
    """
    Test getting the profile of an invalid project
    """
    res = client.get(f"/api/project/profile/{ObjectId()}")
    assert res.status_code == 400

def test_project_profile(client):
    """
    Test getting the profile of a valid project
    """
    project = create_project()
    project.insert()

    res = client.get(f"/api/project/profile/{project.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data["name"] == "X"
    assert data["color"] == "#229f00"


def test_get_project_summary(client):
    """
    Get project summary
    """
    project = create_project()
    project.insert()

    res = client.get(f"/api/project/summary/{project.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data == "A NICE SUMMARY"

def test_get_invalid_project_summary(client):
    """
    Get invalid project summary
    """
    res = client.get(f"/api/project/summary/{ObjectId()}")
    assert res.status_code == 400


def test_project_list(client):
    """
    Get a list of projects given their ids
    """
    project_1 = create_project()
    project_1.insert()

    project_2 = create_project_2()
    project_2.insert()

    data = {
        "projects": [str(project_1.id), str(project_2.id)]
    }

    res = client.post("/api/projects/list", json=data)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 2

def test_search_project(client):
    """
    Test project search
    """
    subcourse = create_subcourse()
    subcourse.insert()

    project = create_project()
    project.insert()

    project_1 = Project(
        name="Second Project",
        clients=[],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=None,
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.1] * 768,
        subcourse=subcourse.id,
        color="#229f00",
    )
    project_1.insert()

    project_2 = Project(
        name="Second Project",
        clients=[],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=None,
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=subcourse.id,
        color="#229f00",
    )
    project_2.insert()

    res = client.get(f"/api/project/search?subcourse_id={subcourse.id}&query=hi")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 2

def test_invalid_search_project(client):
    """
    Test invalid project search
    """
    res = client.get(f"/api/project/search?subcourse_id={ObjectId()}&query=hi")
    assert res.status_code == 400

def test_approved_projects(client, app):
    """
    Test approving a project
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)


    _client = create_client()
    _client.insert()

    project_1 = Project(
        name="Second Project",
        clients=[_client.id],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=ObjectId(),
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=None,
        color="#229f00",
    )
    project_1.insert()

    res = client.put(f"/api/project/approve/{project_1.id}/{subcourse.id}",
                    headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    get_project = Project.get(project_1.id).run()
    assert get_project.subcourse == subcourse.id

def test_approved_projects_invalid_project(client, app):
    """Test approving an invalid project
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)


    _client = create_client()
    _client.insert()

    res = client.put(f"/api/project/approve/{ObjectId()}/{subcourse.id}",
                    headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400

def test_approved_projects_invalid_subcourse(client, app):
    """
    Test approvig provings in an invalid subcourse
    """
    project = create_project()
    project.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.put(f"/api/project/approve/{project.id}/{ObjectId()}",
                    headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400

def test_unapprove_project(client, app):
    """
    Test to unapprove projects
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)


    _client = create_client()
    _client.insert()

    project_1 = Project(
        name="Second Project",
        clients=[_client.id],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=ObjectId(),
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=subcourse.id,
        color="#229f00",
    )
    project_1.insert()

    subcourse.update({"$set": {
        "projects": [project_1.id],
        "clients": [_client.id]
    }})


    res = client.delete(f"/api/project/unapprove/{project_1.id}/{subcourse.id}",
                    headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200


# Clients have 2 projects in a subcourse
def test_unapprove_project_client_has_two_projects(client, app):
    """
    Test to unapprove a project where the client has another project 
    in the subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)


    _client = create_client()
    _client.insert()

    project_1 = Project(
        name="First Project",
        clients=[_client.id],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=ObjectId(),
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=subcourse.id,
        color="#229f00",
    )
    project_1.insert()

    project_2 = Project(
        name="Second Project",
        clients=[_client.id],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=ObjectId(),
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=subcourse.id,
        color="#229f00",
    )
    project_2.insert()

    subcourse.update({"$set": {
        "projects": [project_1.id, project_2.id],
        "clients": [_client.id]
    }})

    _client.update({"$set": {
        "projects": [project_1.id, project_2.id]
    }})


    res = client.delete(f"/api/project/unapprove/{project_1.id}/{subcourse.id}",
                    headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    get_subcourse = Subcourse.get(subcourse.id).run()
    assert get_subcourse.clients == [_client.id]


def test_unapprove_project_not_in_subcourse(client, app):
    """
    Test unapprove project that does not exist in subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)


    _client = create_client()
    _client.insert()

    project_1 = Project(
        name="Second Project",
        clients=[_client.id],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=ObjectId(),
        terms=[1, 2, 3],
        areas=["AI"],
        background="A NICE SUMMARY",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=34,
        embedded_background=[0.2] * 768,
        subcourse=None,
        color="#229f00",
    )
    project_1.insert()


    res = client.delete(f"/api/project/unapprove/{project_1.id}/{subcourse.id}",
                    headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400

def test_unapprove_project_invalid_project(client, app):
    """
    Test unapproving invalid project
    """
    subcourse = create_subcourse()
    subcourse.insert()
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(f"/api/project/unapprove/{ObjectId()}/{subcourse.id}",
                        headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400

def test_unapprove_project_invalid_subcourse(client, app):
    """
    Test unapproving project in invalid subcourse
    """
    project = create_project()
    project.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(f"/api/project/unapprove/{project.id}/{ObjectId()}",
                        headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400

def test_reject_project_success(client, app):
    """
    Test rejecting project
    """
    project = create_project()
    project.insert()

    project.update({
        "$set": {
            "statis": "submitted"
        }
    })

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.put(f"/api/project/reject/{project.id}",
                     headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200

    updated_project = Project.get(project.id).run()
    assert updated_project.status == "draft"

def test_reject_project_invalid(client, app):
    """
    Test rejecting invalid project
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.put(f"/api/project/reject/{ObjectId()}",
                     headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 400

def test_delete_submitted_project(client, app):
    """
    Test deleting a submitted project
    """
    _client = create_client()
    _client.insert()

    project = Project(
        name="Some Project",
        clients=[_client.id],
        groups=[],
        is_allocated=False,
        status="submitted",
        capacity=3,
        category="AI",
        course=ObjectId(),
        terms=[1, 2, 3],
        areas=["AI"],
        background="Summary",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=1,
        embedded_background=[0.1] * 768,
        subcourse=None,
        color="#123456"
    )
    project.insert()

    _client.update({"$set": {"projects": [project.id]}})

    with app.app_context():
        token = generate_token(_client)

    res = client.delete(f"/api/client/delete/project/{project.id}",
                        headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert Project.find_one({"_id": project.id}).run() is None

def test_delete_draft_project(client, app):
    """
    Test deleting a draft project
    """
    _client = create_client()
    _client.insert()

    project = Project(
        name="Some Project",
        clients=[_client.id],
        groups=[],
        is_allocated=False,
        status="draft",
        capacity=3,
        category="AI",
        course=ObjectId(),
        terms=[1, 2, 3],
        areas=["AI"],
        background="Summary",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[Response(question=ObjectId(), answer="hi")],
        proj_no=1,
        embedded_background=[0.1] * 768,
        subcourse=None,
        color="#123456"
    )
    project.insert()

    _client.update({"$set": {"projects": [project.id]}})

    with app.app_context():
        token = generate_token(_client)

    res = client.delete(f"/api/client/delete/project/{project.id}",
                        headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert Project.find_one({"_id": project.id}).run() is None

def test_delete_invalid_project(client, app):
    """
    Test deleting invalid project
    """
    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(_client)

    res = client.delete(f"/api/client/delete/project/{ObjectId()}",
                        headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
