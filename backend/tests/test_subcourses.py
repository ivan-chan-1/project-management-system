"""
Tests for course-related functionality
"""

from bson import ObjectId
from ..models.student import Student
from ..models.subcourse import Subcourse
from .helper import create_course, create_staff, generate_token, create_subcourse
from ..src.helper import generate_random_color

def test_course_creation(client, app):
    """
    Test successful course creation
    """
    staff = create_staff()
    staff.insert()

    course = create_course()
    course.insert()

    data = {"name": "COMP3900", "term": 1, "year": 2025, "code": "COMP3900"}

    with app.app_context():
        token = generate_token(staff)

    res = client.post(
        "/api/staff/subcourse/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 201


def test_course_creation_invalid_parent_course(client, app):
    """
    Test check parent course exists before creating subcourse
    """
    staff = create_staff()
    staff.insert()

    data = {"name": "COMP3900", "term": 2, "year": 2025, "code": "COMP3900"}

    with app.app_context():
        token = generate_token(staff)

    res = client.post(
        "/api/staff/subcourse/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 404


def test_course_creation_invalid_term(client, app):
    """
    Subcourse being created in an invalid term (Not that parent course offers)
    """
    staff = create_staff()
    staff.insert()

    course = create_course()
    course.insert()

    data = {"name": "COMP3900", "term": 2, "year": 2025, "code": "COMP3900"}

    with app.app_context():
        token = generate_token(staff)

    res = client.post(
        "/api/staff/subcourse/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


# Duplicate subcourse
def test_duplicate_subcourse(client, app):
    """
    Test check if there is the same subcourse being created twice
    """
    staff = create_staff()
    staff.insert()

    course = create_course()
    course.insert()

    data = {"name": "COMP3900", "term": 1, "year": 2025, "code": "COMP3900"}

    with app.app_context():
        token = generate_token(staff)

    # First creation
    res = client.post(
        "/api/staff/subcourse/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 201

    # Second creation (Invalid)
    res = client.post(
        "/api/staff/subcourse/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


def test_existing_subcourse(client, app):
    """
    Test check that there are existing subcourses for that term and year
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        "/api/subcourse/existing?term=1&code=COMP3900&year=2025",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 400


def test_no_existing_subcourse(client, app):
    """
    Test check that there are no existing subcourses for that term and year
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        "/api/subcourse/existing?term=1&code=COMP3900&year=2024",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data == {}


def test_can_activate_false(client, app):
    """
    Checks whether there is another active subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    subcourse = Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=1,
        is_archived=False,
        parent_course=ObjectId(),
        students=[],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=True,
        max_group_size=6,
        preference_release=False,
        color=generate_random_color(),
    )
    subcourse.insert()
    res = client.get(
        f"/api/subcourse/{subcourse.id}/activatable",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["active"] is False


def test_can_activate(client, app):
    """
    Test check to see if a subcourse can be activated
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/subcourse/{subcourse.id}/activatable",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["active"] is True


def test_can_activate_subcourse_invalid(client, app):
    """
    Test check to see if an invalid subcourse is able to be activated
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/subcourse/{ObjectId()}/activatable",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_is_active(client, app):
    """
    Test check an active subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    subcourse = Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=1,
        is_archived=False,
        parent_course=ObjectId(),
        students=[],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=True,
        max_group_size=6,
        preference_release=False,
        color=generate_random_color(),
    )
    subcourse.insert()

    res = client.get(
        f"/api/subcourse/{subcourse.id}/active",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["active"] is True


def test_is_active_false(client, app):
    """
    Test check an inactive subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    subcourse = create_subcourse()
    subcourse.insert()

    res = client.get(
        f"/api/subcourse/{subcourse.id}/active",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["active"] is False


def test_is_active_subcourse_invalid(client, app):
    """
    Test whether an invalid subcourse is active
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)
    res = client.get(
        f"/api/subcourse/{ObjectId()}/active",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404


def test_activate_subcourse_invalid(client, app):
    """
    Attempting to activate an invlaid subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.put(
        f"/api/subcourse/{ObjectId()}/activate",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_activate_subcourse(client, app):
    """
    Test activating a subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.put(
        f"/api/subcourse/{subcourse.id}/activate",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data == {}


def test_activate_subcourse_exists(client, app):
    """
    Test activing a subcourse when another subcourse is already active
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    parent_course = create_course()
    parent_course.insert()

    existing_subcourse = Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=1,
        is_archived=False,
        parent_course=parent_course.id,
        students=[],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=True,
        max_group_size=6,
        preference_release=False,
        color=generate_random_color(),
    )
    existing_subcourse.insert()

    subcourse = Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=2,
        is_archived=False,
        parent_course=parent_course.id,
        students=[],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=False,
        max_group_size=6,
        preference_release=False,
        color=generate_random_color(),
    )
    subcourse.insert()

    res = client.put(
        f"/api/subcourse/{subcourse.id}/activate",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400
    data = res.get_json()
    assert (
        data["Error"]
        == "Could not activate. There can only be one active subcourse per course"
    )


def test_is_archived_false(client, app):
    """
    Test whether an subcourse has not been archived
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    subcourse = create_subcourse()
    subcourse.insert()

    res = client.get(
        f"/api/subcourse/{subcourse.id}/archive",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["archived"] is False


def test_is_archived_true(client, app):
    """
    Test whether an subcourse has been archived
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    subcourse = Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=2,
        is_archived=True,
        parent_course=ObjectId(),
        students=[],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=False,
        max_group_size=6,
        preference_release=False,
        color=generate_random_color(),
    )
    subcourse.insert()

    res = client.get(
        f"/api/subcourse/{subcourse.id}/archive",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["archived"] is True


def test_is_archived_invalid(client, app):
    """
    Test whether an invalid subcourse has been archived
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)
    res = client.get(
        f"/api/subcourse/{ObjectId()}/archive",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_archive_subcourse_invalid(client, app):
    """
    Test archiving an invalid subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)
    res = client.put(
        f"/api/subcourse/{ObjectId()}/archive",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_archive_subcourse(client, app):
    """
    Test archiving a subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.put(
        f"/api/subcourse/{subcourse.id}/archive",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    subcourse = Subcourse.get(subcourse.id).run()
    assert subcourse.is_published is False
    assert subcourse.is_archived is True


def test_is_preference_released_invalid(client):
    """
    Test check for whether preference is_released when subcourse is invalid
    """
    res = client.get(f"/api/subcourse/preference/release/{ObjectId()}")
    assert res.status_code == 400


def test_is_preference_released_false(client):
    """
    Test check for whether preference is_released when true
    """
    subcourse = create_subcourse()
    subcourse.insert()

    res = client.get(f"/api/subcourse/preference/release/{subcourse.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data is False


def test_is_preference_released_true(client):
    """
    Test check for whether preference is_released when true
    """
    subcourse = Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=2,
        is_archived=True,
        parent_course=ObjectId(),
        students=[],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=False,
        max_group_size=6,
        preference_release=True,
        color=generate_random_color(),
    )
    subcourse.insert()

    res = client.get(f"/api/subcourse/preference/release/{subcourse.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data is True


def test_subcourse_update_invalid(client, app):
    """
    Test updating invalid subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "name": "COMP3900 - Updated",
        "code": "COMP3900",
        "term": 1,
        "max_group_size": 6,
        "client_questionnaire": [],
        "project_preference_form": [],
        "is_default": False,
        "preference_release": False,
    }
    res = client.put(
        f"/api/subcourse/update/{ObjectId()}",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


def test_subcourse_updaate(client, app):
    """
    Test updating subcourse details
    """
    subcourse = create_subcourse()
    subcourse.insert()

    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "name": "COMP3900 - Updated",
        "code": "COMP3900",
        "term": 1,
        "max_group_size": 6,
        "client_questionnaire": [],
        "project_preference_form": [],
        "is_default": False,
        "preference_release": False,
    }
    res = client.put(
        f"/api/subcourse/update/{subcourse.id}",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    subcourse = Subcourse.get(subcourse.id).run()
    assert subcourse.name == "COMP3900 - Updated"


def test_get_subcourse_students_invalid(client, app):
    """
    Test getting students within an invalid subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/subcourse/students/{ObjectId()}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_get_subcourse_students(client, app):
    """
    Test getting students within a subcourse
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    student = Student(
        name="John Smith",
        zid="z1234567",
        email="z1234567@ad.unsw.edu.au",
        password="TempPW",
        year=1,
        role="student",
        subcourses=[],
        experiences=[],
        reset_pin=None,
    )
    student.insert()

    subcourse = Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=2,
        is_archived=True,
        parent_course=ObjectId(),
        students=[student.id],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=False,
        max_group_size=6,
        preference_release=True,
        color=generate_random_color(),
    )
    subcourse.insert()

    student.update(
        {
            "$set": {
                "subcourses": [
                    {
                        "subcourse": subcourse.id,
                        "tutorial": "",
                        "group": None,
                        "draft_alloc": None,
                        "wishlist": [],
                        "preferences": [],
                    }
                ]
            }
        }
    )

    res = client.get(
        f"/api/subcourse/students/{subcourse.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 1
