"""
Tests for student-related functionality.
"""

from bson import ObjectId
import pytest
from ..models.student import Student, Details
from ..models.subcourse import Subcourse

from ..models.group import Group
from .helper import (
    generate_token,
    create_student,
    create_staff,
    create_project,
    create_group,
    create_subcourse,
)
from ..src.students import student_course


def test_student_details(client):
    """
    Tests retrieval of student details

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    student = create_student()
    student.insert()

    res = client.get(f"/api/student/details/{student.id}")
    data = res.get_json()
    assert res.status_code == 200
    assert data["name"] == student.name


def test_non_existing_student_details(client):
    """
    Tests retrieval of non-existing student details

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """

    res = client.get(f"/api/student/details/{ObjectId()}")
    assert res.status_code == 400


def test_update_student_details(client, app):
    """
    Tests update of a student's details
    """
    subcourse = ObjectId()
    student = create_student(subcourse=subcourse)
    student.insert()

    with app.app_context():
        token = generate_token(student)
    data = {
        "subcourse": str(subcourse),
        "tutorial": "F12A",
        "year": 2,
        "experiences": [{"title": "Job 1", "description": "Hello"}],
    }

    res = client.post(
        "/api/student/details", headers={"Authorization": f"Bearer {token}"}, json=data
    )
    assert res.status_code == 200
    new_student = Student.get(student.id).run()
    assert new_student.year == 2


def test_update_wishlist(client, app):
    """
    Tests update of a student's wishlist
    """
    subcourse = ObjectId()
    student = create_student(subcourse=subcourse)
    student.insert()

    with app.app_context():
        token = generate_token(student)

    data = {"subcourse_id": str(subcourse), "project_id": str(ObjectId())}

    res = client.put(
        "/api/student/update/wishlist",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    new_student = Student.get(student.id).run()
    assert len(new_student.subcourses[0].wishlist) == 1


def test_non_existing_fields_student_wishlist(client, app):
    """
    Tests update of student wishlist but with no data
    """
    subcourse = ObjectId()
    student = create_student(subcourse=subcourse)
    student.insert()

    with app.app_context():
        token = generate_token(student)

    data = {}

    res = client.put(
        "/api/student/update/wishlist",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


def test_student_liked(client, app):
    """
    Tests if project is in student's wishlist
    """
    subcourse = ObjectId()
    project = ObjectId()
    student = create_student(subcourse=subcourse, project=project)

    student.insert()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/liked/{subcourse}/{project}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["liked"] is True


def test_student_not_liked(client, app):
    """
    Tests if project is not in student's wishlist
    """
    subcourse = ObjectId()
    project = ObjectId()
    student = create_student(subcourse=subcourse, project=project)

    student.insert()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/liked/{subcourse}/{ObjectId()}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["liked"] is False


def test_remove_wishlist(client, app):
    """
    Tests removing project from wishlist
    """
    subcourse = ObjectId()
    project = ObjectId()
    student = create_student(subcourse=subcourse, project=project)
    student.insert()

    with app.app_context():
        token = generate_token(student)

    data = {
        "project_id": project,
        "subcourse_id": subcourse,
    }

    res = client.put(
        "/api/student/remove/wishlist",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    new_student = Student.get(student.id).run()
    assert len(new_student.subcourses[0].wishlist) == 0


def test_remove_wishlist_missing_fields(client, app):
    """
    Tests removing project from wishlist with missing fields
    """
    subcourse = ObjectId()
    project = ObjectId()
    student = create_student(subcourse=subcourse, project=project)
    student.insert()

    with app.app_context():
        token = generate_token(student)

    res = client.put(
        "/api/student/remove/wishlist",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )

    assert res.status_code == 400


def test_get_wishlist(client, app):
    """
    Tests retrieving a student's wishlist
    """
    subcourse = ObjectId()
    project = create_project(subcourse)
    project.insert()

    student = create_student(subcourse=subcourse, project=project.id)
    student.insert()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/wishlist/{str(subcourse)}/{str(student.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 1
    assert ObjectId(data[0]["wishlist"][0]["id"]) == project.id


def test_submit_preference(client, app):
    """
    Tests student submitting preferences
    """
    subcourse = ObjectId()
    project = ObjectId()
    student = create_student(subcourse=subcourse)
    student.insert()

    with app.app_context():
        token = generate_token(student)

    data = {"proj_preferences": [{"project": project, "notes": "Lorem", "rank": 1}]}

    res = client.post(
        f"/api/student/preference/submit/{str(subcourse)}",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 201
    new_student = Student.get(student.id).run()
    assert new_student.subcourses[0].preferences[0].project == project


def test_submit_preference_no_field(client, app):
    """
    Tests student submitting preferences, but without data
    """
    subcourse = ObjectId()
    student = create_student(subcourse=subcourse)
    student.insert()

    with app.app_context():
        token = generate_token(student)

    res = client.post(
        f"/api/student/preference/submit/{str(subcourse)}",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )

    assert res.status_code == 400


def test_get_preference(client, app):
    """
    Tests users retrieving a preferences
    """
    subcourse = ObjectId()
    project1 = create_project(subcourse).insert()
    project2 = create_project(subcourse).insert()
    student = create_student(
        subcourse=subcourse,
        preferences=[
            {"project": project1.id, "notes": "Lorem", "rank": 1},
            {"project": project2.id, "notes": "Lorem", "rank": 2},
        ],
    )
    student.insert()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/preference/{str(subcourse)}/{str(student.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 2
    assert ObjectId(data[0]["project"]["id"]) == project1.id
    assert ObjectId(data[1]["project"]["id"]) == project2.id


def test_student_tutorial(client, app):
    """
    Tests retrieving student tutorial
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/tutorial/{str(student.id)}/{str(subcourse.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data == "H12A"


def test_student_tutorial_no_student(client, app):
    """
    Tests retrieving student tutorial, with a non-existing student
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/tutorial/{str(ObjectId())}/{str(subcourse.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 400


def test_student_tutorial_no_subcourse(client, app):
    """
    Tests retrieving student tutorial, with a non-existing subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/tutorial/{str(student.id)}/{ObjectId()}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 400


def test_student_tutorial_no_tutorial(client, app):
    """
    Tests retrieving student tutorial, with a non-existing subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    student.subcourses[0].tutorial = None
    student.save()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(student)

    res = client.get(
        f"/api/student/tutorial/{str(student.id)}/{str(subcourse.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data is None


def test_student_remove(client, app):
    """
    Tests removing a student (who is not in a group) from a course
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    staff = create_staff(subcourse=subcourse.id)
    staff.insert()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(
        "/api/student/remove",
        headers={"Authorization": f"Bearer {token}"},
        query_string={"subcourse_id": str(subcourse.id), "student_id": str(student.id)},
    )

    assert res.status_code == 200

    data = res.get_json()
    assert len(data["subcourses"]) == 0

    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.students) == 0


def test_student_remove_with_group(client, app):
    """
    Tests removing a student (who is in a group) from a course
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    group = create_group(student.id)
    group.insert()
    staff = create_staff(subcourse=subcourse.id)
    staff.insert()

    student.subcourses[0].group = group.id
    student.save()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(
        "/api/student/remove",
        headers={"Authorization": f"Bearer {token}"},
        query_string={"subcourse_id": str(subcourse.id), "student_id": str(student.id)},
    )

    assert res.status_code == 200

    data = res.get_json()
    assert len(data["subcourses"]) == 0

    new_group = Group.get(group.id).run()
    assert len(new_group.members) == 0

    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.students) == 0


def test_student_remove_multi_enrol(client, app):
    """
    Tests removing a student (who is enrolled in multiple courses) from a course
    """
    subcourse1 = create_subcourse()
    subcourse1.insert()

    subcourse2 = create_subcourse()
    subcourse2.insert()

    student = create_student(subcourse=subcourse1.id)
    student.insert()
    staff = create_staff(subcourse=subcourse1.id)
    staff.insert()

    student.subcourses.append(
        Details(
            subcourse=subcourse2.id,
            tutorial="F12A",
            group=None,
            draft_alloc=None,
            wishlist=[],
            preferences=[],
        )
    )
    student.save()
    subcourse1.students.append(student.id)
    subcourse1.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(
        "/api/student/remove",
        headers={"Authorization": f"Bearer {token}"},
        query_string={
            "subcourse_id": str(subcourse1.id),
            "student_id": str(student.id),
        },
    )

    assert res.status_code == 200

    data = res.get_json()
    assert len(data["subcourses"]) == 1


def test_student_remove_missing_subcourse(client, app):
    """
    Tests removing a student with a non-existing subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    staff = create_staff(subcourse=subcourse.id)
    staff.insert()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(
        "/api/student/remove",
        headers={"Authorization": f"Bearer {token}"},
        query_string={"subcourse_id": str(ObjectId()), "student_id": str(student.id)},
    )

    assert res.status_code == 400


def test_student_remove_missing_student(client, app):
    """
    Tests removing a student from a course with a non-existing student
    """
    subcourse = create_subcourse()
    subcourse.insert()
    student = create_student(subcourse=subcourse.id)
    student.insert()
    staff = create_staff(subcourse=subcourse.id)
    staff.insert()
    subcourse.students.append(student.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(
        "/api/student/remove",
        headers={"Authorization": f"Bearer {token}"},
        query_string={"subcourse_id": str(subcourse.id), "student_id": str(ObjectId())},
    )

    assert res.status_code == 400


def test_student_remove_student_not_in_course(client, app):
    """
    Tests removing a student who isn't within the subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()

    student1 = create_student(subcourse=subcourse.id)
    student1.insert()
    student2 = create_student(subcourse=subcourse.id)
    student2.insert()

    staff = create_staff(subcourse=subcourse.id)
    staff.insert()
    subcourse.students.append(student1.id)
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.delete(
        "/api/student/remove",
        headers={"Authorization": f"Bearer {token}"},
        query_string={
            "subcourse_id": str(subcourse.id),
            "student_id": str(student2.id),
        },
    )

    assert res.status_code == 400


def test_num_students_unallocated(client, app):
    """
    Tests calculating the number of students unallocated to a group
    """
    subcourse = create_subcourse()
    subcourse.insert()

    student1 = create_student(subcourse.id)
    student1.insert()
    student2 = create_student(subcourse.id)
    student2.insert()

    subcourse.students.append(student1.id)
    subcourse.students.append(student2.id)
    subcourse.save()

    staff = create_staff(subcourse=subcourse.id)
    staff.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/admin/students/unallocated/{str(subcourse.id)}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data == 2


def test_student_course():
    """
    Tests the number of students in a subcourse
    """
    subcourse = create_subcourse()
    subcourse.insert()

    student1 = create_student(subcourse.id)
    student1.insert()
    student2 = create_student(subcourse.id)
    student2.insert()

    subcourse.students.append(student1.id)
    subcourse.students.append(student2.id)
    subcourse.save()

    res = student_course(str(subcourse.id))

    assert res["number_students"] == 2


def test_student_course_non_existant():
    """
    Tests the number of students in a non-existant subcourse
    """

    with pytest.raises(ValueError, match="Subcourse does not exist in the database"):
        student_course(str(ObjectId()))


def test_student_course_no_students():
    """
    Tests the number of students in a subcourse with no students
    """
    subcourse = create_subcourse()
    subcourse.insert()

    res = student_course(str(subcourse.id))

    assert res["number_students"] == 0
