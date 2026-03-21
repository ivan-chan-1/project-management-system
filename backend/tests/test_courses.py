"""
Tests for course-related functionality
"""

from bson import ObjectId
from ..models.course import Course, FormInputs
from .helper import generate_token, create_staff, create_course, create_client


def test_course_details(client):
    """
    Tests retrieval of course details

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    course = create_course()
    course.insert()

    res = client.get(f"/api/course/details/{course.id}")
    data = res.get_json()
    assert res.status_code == 200
    assert data["name"] == course.name
    assert data["code"] == course.code


def test_non_existing_course_details(client):
    """
    Tests retrieval of non-existing student details

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """

    res = client.get(f"/api/course/details/{ObjectId()}")
    assert res.status_code == 400


def test_empty_client_questionnaire(client):
    """Tests getting empty client questionnaire

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    course = create_course()
    course.insert()

    res = client.get(f"/api/course/client/questionnaire/{course.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data == []


# Get Client questionnaire
def test_get_client_questionnaire(client):
    """Tests getting client questionnaire

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    client_questionnaire = [
        FormInputs(
            id=ObjectId(), input_type="text", label="Client Name", value=[], options=[]
        )
    ]

    course = Course(
        name="COMP3900",
        code="COMP3900",
        description="",
        owner=ObjectId(),
        terms=[],
        term_dates={},
        clients=[],
        projects=[],
        def_client_questionnaire=client_questionnaire,
        def_project_preference_form=[],
        color="",
        embedded_description=[],
    )
    course.insert()

    res = client.get(f"/api/course/client/questionnaire/{course.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 1
    assert data[0]["def_client_questionnaire"]["input_type"] == "text"
    assert data[0]["def_client_questionnaire"]["label"] == "Client Name"
    new_course = Course.get(course.id).run()
    assert len(new_course.def_client_questionnaire) == 1


def test_non_existing_client_questionnaire(client):
    """Tests empty client questionnaire from invalid course

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    res = client.get(f"/api/course/client/questionnaire/{ObjectId()}")
    assert res.status_code == 400


def test_empty_project_questionnaire(client):
    """
    Test getting empty project questionnaire
    """
    course = create_course()
    course.insert()

    res = client.get(f"/api/course/project/questionnaire/{course.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data == []


# Get Client questionnaire
def test_get_project_questionnaire(client):
    """Tests getting project questionnaire

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    project_questionnaire = [
        FormInputs(
            id=ObjectId(), input_type="text", label="Project Name", value=[], options=[]
        )
    ]

    course = Course(
        name="COMP3900",
        code="COMP3900",
        description="",
        owner=ObjectId(),
        terms=[],
        term_dates={},
        clients=[],
        projects=[],
        def_client_questionnaire=[],
        def_project_preference_form=project_questionnaire,
        color="",
        embedded_description=[],
    )
    course.insert()

    res = client.get(f"/api/course/project/questionnaire/{course.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data[0]["def_project_preference_form"]["input_type"] == "text"
    assert data[0]["def_project_preference_form"]["label"] == "Project Name"
    new_course = Course.get(course.id).run()
    assert len(new_course.def_project_preference_form) == 1


def test_non_existing_project_questionnaire(client):
    """Tests getting project questionnaire from invalid course

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    res = client.get(f"/api/course/project/questionnaire/{ObjectId()}")
    assert res.status_code == 400


def test_get_all_courses(client):
    """Test getting all courses

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    course_1 = create_course()
    course_1.insert()

    course_2 = Course(
        name="COMP4920",
        code="COMP4920",
        description="",
        owner=ObjectId(),
        terms=[],
        term_dates={},
        clients=[],
        projects=[],
        def_client_questionnaire=[],
        def_project_preference_form=[],
        color="",
        embedded_description=[],
    )
    course_2.insert()
    res = client.get("/api/course/all")
    assert res.status_code == 200
    data = res.get_json()
    assert data[0]["name"] == "COMP3900"
    assert data[0]["code"] == "COMP3900"
    assert data[1]["name"] == "COMP4920"
    assert data[1]["code"] == "COMP4920"
    courses = Course.find_all().run()
    assert len(courses) == 2


def test_client_apply(client, app):
    """Tests client applying for a course"""
    course = create_course()
    course.insert()

    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(_client)
    data = {"course_id": str(course.id)}

    res = client.put(
        "/api/course/addclient", headers={"Authorization": f"Bearer {token}"}, json=data
    )
    assert res.status_code == 200


def test_invalid_client_apply(client, app):
    """
    Test client applying for an invalid course
    """
    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(_client)

    # Course does not exist
    data = {"course_id": str(ObjectId())}
    res = client.put(
        "/api/course/addclient", headers={"Authorization": f"Bearer {token}"}, json=data
    )
    assert res.status_code == 400


def test_duplicate_client_apply(client, app):
    """
    Test client applying for the same course
    """
    course = create_course()
    course.insert()
    _client = create_client()
    _client.insert()

    with app.app_context():
        token = generate_token(_client)

    data = {"course_id": str(course.id)}

    # First time applying
    res = client.put(
        "/api/course/addclient", headers={"Authorization": f"Bearer {token}"}, json=data
    )
    assert res.status_code == 200

    # Second time applying
    res_2 = client.put(
        "/api/course/addclient", headers={"Authorization": f"Bearer {token}"}, json=data
    )
    assert res_2.status_code == 400


def test_get_course_terms(client):
    """
    Test getting course terms
    """
    course = Course(
        name="COMP3900",
        code="COMP3900",
        description="",
        owner=ObjectId(),
        terms=[],
        term_dates={
            "1": "01-02-2025 to 01-05-2025",
            "2": "01-06-2025 to 01-08-2025",
            "3": "01-09-2025 to 01-12-2026",
        },
        clients=[],
        projects=[],
        def_client_questionnaire=[],
        def_project_preference_form=[],
        color="",
        embedded_description=[],
    )
    course.insert()
    res = client.get(f"/api/course/term-dates/{course.id}")
    assert res.status_code == 200

    data = res.get_json()
    assert data["1"] == "01-02-2025 to 01-05-2025"
    assert data["2"] == "01-06-2025 to 01-08-2025"
    assert data["3"] == "01-09-2025 to 01-12-2026"


def test_invalid_get_course_terms(client):
    """
    Test getting course terms from an invalid term
    """
    res = client.get(f"/api/course/term-dates/{ObjectId()}")
    assert res.status_code == 400


def test_course_search(client):
    """
    Test course search
    """
    course_1 = Course(
        name="COMP3900",
        code="COMP3900",
        description="",
        owner=ObjectId(),
        terms=[],
        term_dates={},
        clients=[],
        projects=[],
        def_client_questionnaire=[],
        def_project_preference_form=[],
        color="",
        embedded_description=[0.2] * 768,
    )
    course_1.insert()

    course_2 = course_2 = Course(
        name="COMP4920",
        code="COMP4920",
        description="",
        owner=ObjectId(),
        terms=[],
        term_dates={},
        clients=[],
        projects=[],
        def_client_questionnaire=[],
        def_project_preference_form=[],
        color="",
        embedded_description=[0.1] * 768,
    )
    course_2.insert()

    data = {"query": "hi"}

    res = client.get("/api/course/search", query_string=data)
    assert res.status_code == 200


def test_get_all_course_code(client, app):
    """
    Test getting course code
    """
    _client = create_client()
    _client.insert()

    course = create_course()
    course.insert()

    with app.app_context():
        token = generate_token(_client)

    res = client.get(
        "/api/staff/all-course-codes", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["COMP3900"] == str(course.id)


def test_create_course(client, app):
    """
    Test creating course
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "name": "COMP3900",
        "code": "COMP3900",
        "description": "Good Term",
        "termDates": {
            "1": "01-01-2025 to 12-04-2025",
            "2": "01-05-2025 to 12-08-2025",
            "3": "01-09-2025 to 12-12-2025",
        },
    }

    res = client.post(
        "/api/staff/course/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 201
    data = res.get_json()


def test_create_duplicate_course(client, app):
    """
    Test creating a course with the sample course code and course name
    """
    staff = create_staff()
    staff.insert()

    course = create_course()
    course.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "name": "COMP3900",
        "code": "COMP3900",
        "description": "Good Term",
        "termDates": {
            "1": "01-01-2025 to 12-04-2025",
            "2": "01-05-2025 to 12-08-2025",
            "3": "01-09-2025 to 12-12-2025",
        },
    }

    res = client.post(
        "/api/staff/course/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


def test_invalid_create_course(client, app):
    """
    Test creating course with invalid details
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "name": "COMP3900",
        "description": "Good Term",
        "termDates": {
            "1": "01-01-2025 to 12-04-2025",
            "2": "01-05-2025 to 12-08-2025",
            "3": "01-09-2025 to 12-12-2025",
        },
    }

    res = client.post(
        "/api/staff/course/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


def test_update_dates(client, app):
    """
    Test updating term dates within a course
    """
    staff = create_staff()
    staff.insert()

    course = create_course()
    course.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "course_id": str(course.id),
        "term_dates": {
            "1": "01-01-2025 to 12-04-2025",
            "2": "01-05-2025 to 12-08-2025",
            "3": "01-09-2025 to 12-12-2025",
        },
    }

    res = client.put(
        "/api/course/update/date",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    data = res.get_json()


def test_invalid_course_update_date(client, app):
    """
    Test update dates for invalid course
    """
    staff = create_staff()
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "course_id": str(ObjectId()),
        "term_dates": {
            "1": "01-01-2025 to 12-04-2025",
            "2": "01-05-2025 to 12-08-2025",
            "3": "01-09-2025 to 12-12-2025",
        },
    }

    res = client.put(
        "/api/course/update/date",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400
