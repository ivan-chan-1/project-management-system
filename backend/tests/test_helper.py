"""
Unit tests for helper functions in the backend/src/helper.py module.
"""

import pytest
from bson import ObjectId
from ..src.helper import (
    get_subcourse_index,
    unique_link,
    unique_group_link,
    generate_random_color,
    id_validation,
    get_user_by_id,
    get_subcourse_by_id,
)
from ..models.staff import WebLink
from ..models.group import WebLink as GroupWebLink
from .helper import (
    init_course_admin,
    init_subcourse,
    init_subcourse1,
    init_subcourse2,
    init_student,
    init_student1,
    init_student2,
    init_project,
    init_group,
    append_subcourses,
)

# pylint: disable=unused-argument
def test_get_subcourse_index(client):
    """
    Test the get_subcourse_index function to ensure it returns the correct index or -1.
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse1 = init_subcourse1(staff)
    subcourse2 = init_subcourse2(staff)
    subcourse.save()
    subcourse1.save()
    subcourse2.save()
    student = init_student()
    details = {
        "subcourse": subcourse.id,
        "tutorial": None,
        "group": None,
        "draft_alloc": None,
        "wishlist": [],
        "preferences": [],
    }
    details1 = {
        "subcourse": subcourse1.id,
        "tutorial": None,
        "group": None,
        "draft_alloc": None,
        "wishlist": [],
        "preferences": [],
    }
    details2 = {
        "subcourse": subcourse2.id,
        "tutorial": None,
        "group": None,
        "draft_alloc": None,
        "wishlist": [],
        "preferences": [],
    }
    student.subcourses = [
        details,
        details1,
        details2,
    ]
    student.save()

    # Test case 1: Subcourse exists in the list
    index = get_subcourse_index(student.subcourses, subcourse2.id)
    assert index == 2, f"Expected index 2, got {index}"

    # Test case 2: Subcourse does not exist in the list
    index = get_subcourse_index(student.subcourses, "644f1c2e5f1b2c3d4e5f6a7e")
    assert index == -1, f"Expected index -1, got {index}"

    # Test case 3: Subcourse is the first in the list
    index = get_subcourse_index(student.subcourses, subcourse.id)
    assert index == 0, f"Expected index 0, got {index}"

    # Test case 4: Empty subcourses list
    index = get_subcourse_index([], subcourse.id)
    assert index == -1, f"Expected index -1, got {index}"

# pylint: disable=unused-argument
def test_unique_link(client):
    """
    Test the unique_link function to ensure it correctly identifies unique links.
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    new_link = WebLink(
        name= "Google",
        url= "https://www.google.com",
        subcourse= subcourse.id,
    )
    link = WebLink(
        name="Google",
        url="https://www.google.com",
        subcourse=subcourse.id,
    )
    link1 = WebLink(
        name="Bing",
        url="https://www.bing.com",
        subcourse=subcourse.id,
    )
    staff.links = [link, link1]
    staff.save()
    assert not unique_link(new_link, staff.links, str(subcourse.id)), "Expected False, got True"

# pylint: disable=unused-argument
def test_unique_group_link(client):
    """
    Test the unique_group_link function to ensure it correctly identifies unique links.
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    student0 = init_student()
    student1 = init_student1()
    student2 = init_student2()
    project = init_project(subcourse.id)
    group = init_group(project.id)
    group.members = [student1.id, student2.id]
    group.insert()
    subcourse.students = [student0.id, student1.id, student2.id]
    subcourse.groups = [group.id]
    subcourse.save()
    append_subcourses([student0, student1, student2])

    new_link = GroupWebLink(
        name= "Google",
        url= "https://www.google.com",
    )
    link = GroupWebLink(
        name="Google",
        url="https://www.google.com",
    )
    link1 = GroupWebLink(
        name="Bing",
        url="https://www.bing.com",
    )
    group.links = [link, link1]
    group.save()
    assert not unique_group_link(new_link, group.links), "Expected False, got True"

# pylint: disable=unused-argument
def test_generate_random_color(client):
    """
    Test the generate_random_color function to ensure it generates a valid hex color code.
    """
    color = generate_random_color()
    assert isinstance(color, str), f"Expected str, got {type(color)}"
    assert len(color) == 7, f"Expected length 7, got {len(color)}"
    assert color.startswith("#"), f"Expected color to start with '#', got {color[0]}"
    assert all(c in "0123456789abcdefABCDEF" for c in color[1:]), f"Invalid hex color code: {color}"

# pylint: disable=unused-argument
def test_id_validation(client):
    """
    Test the id_validation function to ensure it validates ObjectIds correctly.
    """
    # Test case 1: Valid ObjectId
    valid_id = str(ObjectId())
    try:
        id_validation(valid_id)  # Should not raise an exception
    except ValueError:
        pytest.fail("id_validation raised ValueError for a valid ObjectId")

    # Test case 2: Invalid ObjectId
    invalid_id = "invalid_object_id"
    with pytest.raises(ValueError, match="Invalid ID format"):
        id_validation(invalid_id)

    # Test case 3: Missing ObjectId (None)
    with pytest.raises(ValueError, match="Missing parameter/s"):
        id_validation(None)

    # Test case 4: Empty string
    with pytest.raises(ValueError, match="Invalid ID format"):
        id_validation("")

# pylint: disable=unused-argument
def test_get_user_by_id(client):
    """
    Test the get_user_by_id function to ensure it correctly retrieves a user by ID.
    """
    student = init_student()
    student.insert()
    user = get_user_by_id(student.id)
    assert user is not None, "User should not be None"
    assert user.id == student.id, f"Expected {student.id}, got {user.id}"

# pylint: disable=unused-argument
def test_subcourse_by_id(client):
    """
    Test the get_user_by_id function to ensure it correctly retrieves a user by ID.
    """
    staff = init_course_admin()
    subcourse = init_subcourse(staff)
    subcourse.insert()
    new_subcourse = get_subcourse_by_id(subcourse.id)
    assert new_subcourse is not None, "Subcourse should not be None"
    assert new_subcourse.id == subcourse.id, f"Expected {subcourse.id}, got {new_subcourse.id}"
    assert new_subcourse.name == subcourse.name, f"Expected {subcourse.name}, got {new_subcourse.name}"
