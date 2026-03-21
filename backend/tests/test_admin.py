"""
Tests for administrator functionality
"""

from bson import ObjectId
import nltk
from ..models.subcourse import Subcourse
from ..models.group import Group
from ..models.project import Project
from .helper import (
    generate_token,
    init_course_admin,
    init_student,
    init_student1,
    init_student2,
    init_student3,
    init_student4,
    init_course,
    init_subcourse,
    init_group,
    init_project,
    append_subcourses,
)


def setup_module():
    """
    Setup function to ensure NLTK resources are downloaded before tests run.
    """
    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        nltk.download("stopwords")


def test_staff_details(client):
    """
    Tests retrieval of staff details

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    staff = init_course_admin()
    res = client.get(f"/api/staff/details/{staff.id}")
    data = res.get_json()
    assert res.status_code == 200
    assert data["name"] == staff.name
    assert data["zid"] == staff.zid
    assert data["email"] == staff.email
    assert data["role"] == staff.role
    assert data["classes"] == []
    assert data["links"] == []


def test_non_existing_staff_details(client):
    """
    Tests retrieval of non-existing staff details

    Args:
        client (FlaskClient): A Flask test client used to send HTTP requests to the app.
    """
    res = client.get(f"/api/admin/details/{ObjectId()}")
    assert res.status_code == 404


def test_add_students(client, app):
    """
    Tests adding students to a subcourse
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()

    students = [
        {
            "firstName": "Alice",
            "lastName": "Smith",
            "zid": "z2345678",
            "email": "z2345678@ad.unsw.edu.au",
            "tutorial": "H12A",
        },
        {
            "firstName": "Bob",
            "lastName": "Zig",
            "zid": "z3456789",
            "email": "z3456789@ad.unsw.edu.au",
            "tutorial": "H12A",
        },
        {
            "firstName": "Charlie",
            "lastName": "Square",
            "zid": "z4567890",
            "email": "z4567890@ad.unsw.edu.au",
            "tutorial": "H12A",
        },
    ]

    with app.app_context():
        token = generate_token(staff)

    data = {
        "students": students,
        "subcourse_id": str(subcourse.id),
    }
    res = client.post(
        "api/staff/subcourse/add-students",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.students) == 3
    assert len(new_subcourse.groups) == 1


def test_empty_students_field_add_students(client, app):
    """
    Tests adding students to a subcourse but with an empty students field
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "students": [],
        "subcourse_id": str(subcourse.id),
    }
    res = client.post(
        "api/staff/subcourse/add-students",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.students) == 0


def test_non_existing_fields_add_students(client, app):
    """
    Tests adding students to a subcourse but with no data
    """
    staff = init_course_admin()

    with app.app_context():
        token = generate_token(staff)

    data = {}
    res = client.post(
        "api/staff/subcourse/add-students",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


def test_add_tutors(client, app):
    """
    Tests adding tutors to a subcourse
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    tutors = [
        {
            "firstName": "Alice",
            "lastName": "Smith",
            "zid": "z2345678",
            "email": "z2345678@ad.unsw.edu.au",
            "tutorial": "H12A",
        },
        {
            "firstName": "Bob",
            "lastName": "Zig",
            "zid": "z3456789",
            "email": "z3456789@ad.unsw.edu.au",
            "tutorial": "M12A",
        },
        {
            "firstName": "Charlie",
            "lastName": "Square",
            "zid": "z4567890",
            "email": "z4567890@ad.unsw.edu.au",
            "tutorial": "T11A",
        },
    ]
    with app.app_context():
        token = generate_token(staff)
    data = {
        "tutors": tutors,
        "subcourse_id": str(subcourse.id),
    }
    res = client.post(
        "api/staff/subcourse/add-tutors",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.staff) == 4


def test_empty_tutors_field_add_tutors(client, app):
    """
    Tests adding tutors to a subcourse but with an empty tutors field
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    with app.app_context():
        token = generate_token(staff)
    data = {
        "tutors": [],
        "subcourse_id": str(subcourse.id),
    }
    res = client.post(
        "api/staff/subcourse/add-tutors",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.staff) == 1


def test_non_existing_fields_add_tutors(client, app):
    """
    Tests adding tutors to a subcourse but with no data
    """
    staff = init_course_admin()
    with app.app_context():
        token = generate_token(staff)
    data = {}
    res = client.post(
        "api/staff/subcourse/add-tutors",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 400


def test_allocate_draft(client, app):
    """
    Tests allocation of students to groups - draft allocation
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    project = init_project(subcourse.id)
    group = init_group(project.id)
    group.members = [student3.id, student4.id]
    group.insert()
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.save()
    append_subcourses([student0, student1, student2, student3, student4])

    with app.app_context():
        token = generate_token(staff)
    data = {
        "is_draft": True,
        "l_allocations": [{"left": str(student0.id), "right": str(group.id)}],
        "r_allocations": [
            {"left": str(group.id), "right": [str(student3.id), str(student4.id)]}
        ],
    }
    res = client.post(
        f"/api/admin/allocate/{subcourse.id}/student",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert len(new_subcourse.groups) == 0


def test_allocate_draft_not_group(client, app):
    """
    Tests allocation of students to groups - draft allocation
    The group id provided is not a group id
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    project = init_project(subcourse.id)
    group = init_group(project.id)
    group.members = [student3.id, student4.id]
    group.insert()
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.save()
    students = [student0, student1, student2, student3, student4]
    append_subcourses(students)

    with app.app_context():
        token = generate_token(staff)
    data = {
        "is_draft": True,
        "l_allocations": [{"left": str(student0.id), "right": str(student1.id)}],
        "r_allocations": [
            {"left": str(group.id), "right": [str(student3.id), str(student4.id)]}
        ],
    }
    res = client.post(
        f"/api/admin/allocate/{subcourse.id}/student",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 404


def test_allocate_group(client, app):
    """
    Tests allocation of students to groups - final allocation
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    project = init_project(subcourse.id)
    group = init_group(project.id)
    group.members = [student3.id, student4.id]
    group.insert()
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.groups = [group.id]
    subcourse.save()
    append_subcourses([student0, student1, student2, student3, student4])

    with app.app_context():
        token = generate_token(staff)
    data = {
        "is_draft": False,
        "l_allocations": [{"left": str(student0.id), "right": str(group.id)}],
        "r_allocations": [
            {
                "left": str(group.id),
                "right": [str(student0.id), str(student3.id), str(student4.id)],
            }
        ],
    }
    res = client.post(
        f"/api/admin/allocate/{subcourse.id}/student",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 200
    new_subcourse = Subcourse.get(subcourse.id).run()
    assert new_subcourse.groups[0] == group.id


def test_allocate_group_not_group(client, app):
    """
    Tests allocation of students to groups - final allocation
    The group id provided is not a group id
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    project = init_project(subcourse.id)
    group = init_group(project.id)
    group.members = [student3.id, student4.id]
    group.insert()
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.groups = [group.id]
    subcourse.save()
    students = [student0, student1, student2, student3, student4]
    append_subcourses(students)

    with app.app_context():
        token = generate_token(staff)
    data = {
        "is_draft": False,
        "l_allocations": [{"left": str(student0.id), "right": str(group.id)}],
        "r_allocations": [
            {
                "left": str(student2.id),
                "right": [str(student0.id), str(student3.id), str(student4.id)],
            }
        ],
    }
    res = client.post(
        f"/api/admin/allocate/{subcourse.id}/student",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )
    assert res.status_code == 404


def test_allocate_projects(client, app):
    """
    Tests the allocation of groups to projects for a subcourse
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    project = init_project(subcourse.id)
    group = init_group(project.id)
    group.insert()
    project = init_project(subcourse.id)
    project.insert()

    allocation_data = {
        "is_draft": False,
        "l_allocations": [{"left": str(group.id), "right": str(project.id)}],
        "r_allocations": [{"left": str(project.id), "right": [str(group.id)]}],
    }

    with app.app_context():
        token = generate_token(staff)

    res = client.post(
        f"/api/admin/allocate/{subcourse.id}/project",
        headers={"Authorization": f"Bearer {token}"},
        json=allocation_data,
    )

    # Assertions
    assert res.status_code == 200
    response_data = res.get_json()
    assert response_data["message"] == "Allocated successfully"

    # Verify group allocation
    updated_group = Group.get(group.id).run()
    assert updated_group.project == ObjectId(project.id)
    assert updated_group.draft_alloc is None

    # Verify project allocation
    updated_project = Project.get(project.id).run()
    assert updated_project.is_allocated is True
    assert ObjectId(group.id) in updated_project.groups


def test_auto_allocate_projects(client, app):
    """
    Tests the auto allocation of groups to projects for a subcourse
    """
    setup_module()
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    project = init_project(subcourse.id)
    project.insert()
    group = init_group(project.id)
    group.insert()
    subcourse.groups = [group.id]
    subcourse.projects = [project.id]
    subcourse.insert()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/admin/{subcourse.id}/allocate/project/auto",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Assertions
    assert res.status_code == 200

    # Verify group allocation
    # updated_group = Group.get(group.id).run()
    # assert updated_group.project == ObjectId(project.id)


def test_get_subcourse_members(client, app):
    """
    Tests retrieval of subcourse members
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    project = init_project(subcourse.id)
    project.insert()
    group = init_group(project.id)
    group.members = [student3.id, student4.id]
    group.insert()
    students = [student0, student1, student2, student3, student4]
    append_subcourses(students)
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.groups = [group.id]
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)
    res = client.get(
        f"/api/admin/subcourse/members/{subcourse.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    data = res.get_json()
    assert res.status_code == 200
    students = [m for m in data if m["role"] == "student"]
    assert len(students) == 5


def test_get_subcourse_stats(client, app):
    """
    Tests retrieval of subcourse statistics
    """
    staff = init_course_admin()
    course = init_course(staff)
    course.insert()
    subcourse = init_subcourse(staff)
    subcourse.parent_course = course.id
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    project = init_project(subcourse.id)
    project.insert()
    subcourse.projects = [project.id]
    group = init_group(project.id)
    group.members = [student3.id, student4.id]
    group.insert()
    append_subcourses([student0, student1, student2, student3, student4])
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.groups = [group.id]
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)
    res = client.get(
        f"/api/admin/dashboard/{subcourse.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["number_students"] == 5
    assert data["number_groups"] == 1
    assert data["number_staff"] == 1
    assert data["unverified_clients"] == 0
    assert data["verified_clients"] == 0
    assert data["allocated_groups"] == 0
    assert data["unallocated_groups"] == 1
    assert data["available_projects"] == 1


def test_get_links(client, app):
    """
    Tests retrieval of links for a subcourse
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    subcourse.save()
    weblink = {
        "name": "Google",
        "url": "https://www.google.com",
        "subcourse": subcourse.id,
    }
    weblink1 = {
        "name": "Wikipedia",
        "url": "https://www.wikipedia.com",
        "subcourse": subcourse.id,
    }
    weblink2 = {
        "name": "Moodle",
        "url": "https://moodle.telt.unsw.edu.au/",
        "subcourse": subcourse.id,
    }
    staff.links.append(weblink)
    staff.links.append(weblink1)
    staff.links.append(weblink2)
    staff.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/staff/links/{subcourse.id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    data = res.get_json()
    assert res.status_code == 200
    assert len(data) == 3


def test_post_link(client, app):
    """
    Tests posting a link for a subcourse
    """
    staff = init_course_admin()
    course = init_course(staff)
    course.insert()
    subcourse = init_subcourse(staff)
    subcourse.parent_course = course.id
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    project = init_project(subcourse.id)
    project.insert()
    group = init_group(project.id)
    group.members = [student3.id, student4.id]
    group.insert()
    append_subcourses([student0, student1, student2, student3, student4])
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.groups = [group.id]
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    data = {
        "name": "Google",
        "url": "https://www.google.com",
        "subcourse": str(subcourse.id),
    }

    res = client.post(
        f"/api/staff/links/{subcourse.id}",
        headers={"Authorization": f"Bearer {token}"},
        json=data,
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data[0]["name"] == "Google"
    assert data[0]["url"] == "https://www.google.com"
    assert data[0]["subcourse"] == str(subcourse.id)


def test_get_tute_groups(client, app):
    """
    Tests retrieval of tutorial groups for a subcourse
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()

    # Assign tutorials to the staff
    staff.classes.append(
        {
            "subcourse": subcourse.id,
            "tutorials": ["H12A", "M12A", "T11A"],
        }
    )
    staff.save()

    # Create students and groups
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    student3 = init_student3()
    student4 = init_student4()
    group1 = init_group(None)
    group1.tutorial = "H12A"
    group1.insert()
    group2 = init_group(None)
    group2.tutorial = "M12A"
    group2.insert()
    group3 = init_group(None)
    group3.tutorial = "T11A"
    group3.insert()

    # Add students to subcourse and groups
    append_subcourses([student0, student1, student2, student3, student4])
    subcourse.students = [
        student0.id,
        student1.id,
        student2.id,
        student3.id,
        student4.id,
    ]
    subcourse.groups = [group1.id, group2.id, group3.id]
    subcourse.save()

    with app.app_context():
        token = generate_token(staff)

    res = client.get(
        f"/api/staff/{subcourse.id}/tutorial/groups",
        headers={"Authorization": f"Bearer {token}"},
    )

    data = res.get_json()
    # Assertions
    assert res.status_code == 200
    assert "H12A" in data
    assert "M12A" in data
    assert "T11A" in data
    assert len(data["H12A"]) == 1
    assert len(data["M12A"]) == 1
    assert len(data["T11A"]) == 1
    assert data["H12A"] == [str(group1.id)]
    assert data["M12A"] == [str(group2.id)]
    assert data["T11A"] == [str(group3.id)]
