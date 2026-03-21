"""
API routes and helper functions for admin and staff related functionality
"""

import math
import uuid
from collections import defaultdict
from flask import jsonify, Blueprint, request
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError

from ..models.subcourse import Subcourse
from ..models.staff import Staff, Class
from ..models.student import Student
from ..models.project import Project
from ..models.group import Group
from ..models.student import Details
from ..models.request_data import (
    AddTutor,
    AllocationData,
    AddStudent,
    StudentRegister,
    StaffLinksList,
    StaffLinks,
)

from .auth import register_staff, register_student, hash_str, generate_password
from .helper import (
    get_subcourse_index,
    unique_link,
    role_required,
    id_validation,
    get_subcourse_by_id,
)
from .constants import GROUP_NAMES
from .students import student_course
from .groups import groups_course, groups_allocated, groups_unallocated
from .clients import client_verified, client_unverified
from .projects import available_projects, unavailable_projects, submitted_projects
from .semantic_allocator import SemanticILPAllocator
from .channels import (
    add_members_course_channels,
    project_channels,
)
from .notifications import (
    user_registration_notification,
    course_invite_notification,
)

admin_bp = Blueprint("admin", __name__)


def get_staff_details(staff_id):
    """
    Retrieves the details of a staff from the database

    Args:
        staff_id (str): the identifer of the staff

    Returns:
        dict[str, Any]: the details of the staff
    """
    try:
        staff = Staff.find_one({"_id": ObjectId(staff_id)}).run()
        if staff is None:
            raise ValueError("Staff cannot be found in database")

        return staff.model_dump()
    except RuntimeError as e:
        raise e


def staff_course(subcourse_id):
    """
    Gets the number of tutors/staff

    Args:
        subcourse_id (str): identifer of a subcourse

    Returns:
        Response
    """

    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        staff_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$staff"},
            {"$count": "number_staff"},
        ]

        number_staff = Subcourse.aggregate(staff_query).run()

        if not number_staff:
            return {"number_staff": 0}
        return number_staff[0]

    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of staff - {str(e)}") from e


def staff_links(staff_id, subcourse_id):
    """
    Gets a staff's list of shortcuts for a particular subcourse

    Args:
        staff_id (str): identifer of a staff
        subcourse_id (str): identifer of a subcourse

    Returns:
        jsonified list of WebLinks
    """

    try:
        staff = Staff.find_one({"_id": ObjectId(staff_id)}).run()

        return_list = []

        for link in staff.links:
            if link.subcourse == ObjectId(subcourse_id):
                return_list.append(link)

        return jsonify(StaffLinksList.dump_python(return_list)), 200
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving staff links - {str(e)}") from e


def add_link(staff_id, data, subcourse_id):
    """
    Add customisable shortcut links for a staff

    Args:
        staff_id (str): identifer of a staff
        data (dict): mappings of link names and url
        subcourse_id (str): identifer of a subcourse

    Returns:
        jsonified list of WebLinks
    """
    try:
        staff = Staff.find_one({"_id": ObjectId(staff_id)}).run()

        if staff is None:
            raise ValueError("Staff does not exist in the database")

        if not unique_link(data, staff.links, subcourse_id):
            raise ValueError("Link name and/or url is not unique")

        staff.links.append(data)
        staff.save()
        return jsonify(StaffLinksList.dump_python(staff.links)), 200
    except RuntimeError as e:
        raise e


def all_stats(subcourse_id, course_id):
    """
    Gets all the statistics related to the subcourse

    Args:
        subcourse_id (str): the identifier of the subcourse
        course_id (str): the identifer of the parent course

    Returns:
        dict: mappings of statistic to data
    """
    try:
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")
        if course_id != subcourse.parent_course:
            raise ValueError("Subcourse does not belong to this course")
        res = {}
        res.update(student_course(subcourse_id))
        res.update(staff_course(subcourse_id))
        res.update(groups_course(subcourse_id))
        res.update(groups_allocated(subcourse_id))
        res.update(groups_unallocated(subcourse_id))
        res.update(client_verified(course_id))
        res.update(client_unverified(course_id))
        res.update(available_projects(subcourse_id))
        res.update(unavailable_projects(subcourse_id))
        res.update(submitted_projects(course_id))
        return res
    except RuntimeError as e:
        raise RuntimeError(
            f"Error retrieving statistics for course admin dashboard - {str(e)}"
        ) from e
    except ValueError as e:
        raise ValueError(
            f"Error retrieving statistics for course admin dashboard - {str(e)}"
        ) from e


def remove_from_group(sub_detail, student):
    """
    Removes student from an old group

    Args:
        sub_detail (Detail): student details enrolled in a subcourse
        student (Student): student details
    """
    old_group = Group.get(sub_detail.group).run()
    if old_group and student.id in old_group.members:
        old_group.members.remove(student.id)
        old_group.save()


@admin_bp.route("/api/staff/details/<staff_id>", methods=["GET"])
def staff_details(staff_id):
    """
    Retrieves the details of a staff from the database

    Args:
        staff_id (str): the identifier of the staff

    Returns:
        Response
    """

    try:
        id_validation(staff_id)
        detail = get_staff_details(staff_id)
        return jsonify(detail)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@admin_bp.route("/api/staff/subcourse/add-students", methods=["POST"])
@jwt_required()
def add_students_to_subcourse():
    """
    Adds a number of students to a subcourse, notifies them,
    creates groups, creates course channels and adds them as members

    Returns:
        Response
    """
    try:
        data = AddStudent.model_validate_json(request.data)
        subcourse = get_subcourse_by_id(data.subcourse_id)

        tutorials = {}  # keep track of how many students we've added for each tutorial
        groupnames = GROUP_NAMES

        # Update the students' subcourses field
        for s in data.students:
            student = Student.find_one({"zid": s.zid}).run()

            if not student:
                student = register_student(
                    StudentRegister(
                        firstName=s.firstName,
                        lastName=s.lastName,
                        zid=s.zid,
                        email=s.email,
                        password=generate_password(),
                    )
                )
                # Send student a link to set their password and access code
                access_code = str(uuid.uuid4())[:13]
                student.reset_pin = hash_str(access_code)
                student_name = s.firstName + " " + s.lastName
                user_registration_notification(
                    student_name, s.email, "student", access_code
                )

            subcourse_id = ObjectId(data.subcourse_id)
            sub_detail = next(
                (
                    detail
                    for detail in student.subcourses # pylint: disable=no-member
                    if detail.subcourse == subcourse_id # pylint: disable=no-member
                ),
                None,
            )

            if not sub_detail:
                student.subcourses.append(
                    Details(
                        subcourse=subcourse_id,
                        draft_alloc=None,
                        group=None,
                        tutorial=s.tutorial,
                        wishlist=[],
                        preferences=[],
                    )
                )
            else:
                # Already enrolled in subcourse
                if sub_detail.tutorial != s.tutorial:
                    # Student changed tutorial — remove from old group if they had one
                    if sub_detail.group:
                        remove_from_group(sub_detail, student)

                    sub_detail.group = None
                    sub_detail.tutorial = s.tutorial

            student.save()

            # create groups within tutorials based on tutorial sizes
            if s.tutorial not in tutorials:
                tutorials[s.tutorial] = 1
            else:
                tutorials[s.tutorial] += 1
            tutorial_size = tutorials[s.tutorial]

            if tutorial_size % subcourse.max_group_size == 1:
                group_num = math.floor(tutorial_size / subcourse.max_group_size)
                group = Group(
                    name=s.tutorial + "-" + groupnames[group_num],
                    members=[],
                    tutorial=s.tutorial,
                    bio=None,
                    goal=None,
                    project=None,
                    draft_alloc=None,
                    proj_preferences=[],
                    topic_preferences=[],
                    is_draft=True,
                    links=[],
                    responses=[],
                    lead=None,
                )
                group.insert()
                subcourse.groups.append(group.id)
                subcourse.save()

            # Notify student of subcourse allocation
            course_invite_notification(
                s.firstName, s.email, subcourse.name, subcourse.code
            )

            if student.id not in subcourse.students:
                subcourse.students.append(student.id)
                subcourse.save()

        add_members_course_channels(data.subcourse_id, "student")
        return jsonify({"message": "Students added to subcourse successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
    except ValidationError as e:
        print(e)
        return jsonify({"Error": str(e)}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404


@admin_bp.route("/api/staff/subcourse/add-tutors", methods=["POST"])
@jwt_required()
def add_tutors_to_subcourse():
    """
    Adds a number of tutors to a subcourse, notifies them,
    adds tutors to course channels

    Returns:
        Response
    """

    try:
        data = AddTutor.model_validate_json(request.data)

        subcourse_id = data.subcourse_id
        subcourse = Subcourse.get(subcourse_id).run()
        if not subcourse:
            return jsonify({"message": "Subcourse not found"}), 404

        new_staff_ids = set(subcourse.staff)

        # Update the tutors' subcourses field
        for t in data.tutors:
            tutor = Staff.find_one({"zid": t.zid}).run()

            if not tutor:
                tutor = register_staff(
                    StudentRegister(
                        firstName=t.firstName,
                        lastName=t.lastName,
                        zid=t.zid,
                        email=t.email,
                        password=generate_password(),
                    ),
                    "tutor",
                )
                # Send staff a link to set their password and access code
                access_code = str(uuid.uuid4())[:13]
                tutor.reset_pin = hash_str(access_code)
                tutor_name = t.firstName + " " + t.lastName
                user_registration_notification(
                    tutor_name, t.email, "staff", access_code
                )

            tutorials = list(map(str.strip, t.tutorial.split(",")))

            existing_class = next(
                (
                    cls
                    for cls in tutor.classes
                    if cls.subcourse == ObjectId(subcourse_id)
                ),
                None,
            )

            if existing_class:
                for tutorial in tutorials:
                    if tutorial not in existing_class.tutorials:
                        existing_class.tutorials.append(tutorial)
            else:
                tutor.classes.append(
                    Class(subcourse=ObjectId(subcourse_id), tutorials=tutorials)
                )

            tutor.save()

            if tutor.id not in subcourse.staff:
                new_staff_ids.add(tutor.id)

            # Notify staff of subcourse allocation
            course_invite_notification(
                t.firstName, t.email, subcourse.name, subcourse.code
            )

        # Update the subcourse with the new staff IDs
        subcourse.staff = list(new_staff_ids)
        subcourse.save()

        add_members_course_channels(subcourse_id, "staff")
        return jsonify({"message": "Students added to subcourse successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
    except ValidationError as e:
        return jsonify({"Error": str(e)}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404


@admin_bp.route("/api/admin/allocate/<subcourse_id>/student", methods=["POST"])
@jwt_required()
@role_required("course admin")
def allocate_students(subcourse_id):
    """
    Allocates students to groups. If it is a draft allocation,
    it does not add students to groups's list of members

    Args:
        subcourse_id (str): identifer of a subcourse which students and groups are a part of

    Returns:
        Response: a jsonified success message
    """
    if subcourse_id is None:
        return jsonify({"Error: Missing parameter/s"}), 400

    try:
        id_validation(subcourse_id)
        allocations = AllocationData.model_validate_json(request.data)

        # Allocates one student to a group
        for a in allocations.l_allocations:
            student = Student.get(a.left).run()
            if student is None:
                raise ValueError("Student does not exist in the database")
            group = Group.get(a.right).run()
            if group is None:
                raise ValueError("Group does not exist in the database")
            index = get_subcourse_index(student.subcourses, ObjectId(subcourse_id))

            if allocations.is_draft:
                student.subcourses[index].draft_alloc = ObjectId(a.right)
            else:
                student.subcourses[index].group = ObjectId(a.right)
                student.subcourses[index].draft_alloc = None

            student.save()

        # Saves all allocated students to group's list of students
        if not allocations.is_draft:
            for a in allocations.r_allocations:
                group = Group.get(a.left).run()
                if group is None:
                    raise ValueError("Group does not exist in the database")
                group.members = [ObjectId(x) for x in a.right]
                group.save()

        return jsonify({"message": "Allocated successfully"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
    except ValidationError as e:
        return jsonify({"Error": str(e)}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404


@admin_bp.route("/api/admin/allocate/<subcourse_id>/project", methods=["POST"])
@jwt_required()
@role_required("course admin")
def allocate_projects(subcourse_id):
    """
    Allocates groups to projects. If it is a draft allocation,
    it does not add groups to project's list of groups

    Returns:
        Response: On successful allocation, a success message
    """
    try:
        allocations = AllocationData.model_validate_json(request.data)

        # Assigns a group to one project
        for a in allocations.l_allocations:
            group = Group.get(a.left).run()
            if allocations.is_draft:
                group.draft_alloc = ObjectId(a.right)
            else:
                group.project = ObjectId(a.right)
                group.draft_alloc = None

            group.save()

        # Saves all allocated groups to project's list of groups
        # if it isn't a draft allocation
        if not allocations.is_draft:
            for a in allocations.r_allocations:
                project = Project.get(a.left).run()
                if len(a.right) != 0:
                    project.is_allocated = True
                project.groups = [ObjectId(x) for x in a.right]
                project.save()

            project_channels(subcourse_id)

        return jsonify(
            {
                "message": "Draft saved successfully"
                if allocations.is_draft
                else "Allocated successfully"
            }
        ), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
    except ValidationError as e:
        return jsonify({"Error": str(e)}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404


@admin_bp.route("/api/admin/<subcourse_id>/allocate/project/auto", methods=["GET"])
def auto_allocate_projects(subcourse_id):
    """
    Runs a selected allocation algorithm on all subcourse groups and projects
    and returns possible allocations

    Args:
        subcourse_id (str): identifer of a subcourse

    Returns:
        Response: a jsonified dictionary that maps project to groups
        allocated to the project
    """
    try:
        # Finds all groups in the subcourse
        group_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
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
            {"$addFields": {"group_id": {"$toString": "$_id"}, "group_name": "$name"}},
            {
                "$project": {
                    "group_id": 1,
                    "group_name": 1,
                    "proj_preferences": 1,
                    "_id": 0,
                }
            },
        ]

        groups = Subcourse.aggregate(group_query).run()

        # Finds all projects in the subcourse
        project_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {
                "$lookup": {
                    "from": "projects",
                    "localField": "projects",
                    "foreignField": "_id",
                    "as": "projects",
                }
            },
            {"$unwind": "$projects"},
            {"$replaceRoot": {"newRoot": "$projects"}},
            {"$addFields": {"proj_id": {"$toString": "$_id"}}},
            {"$project": {"proj_id": 1, "req_skills": 1, "capacity": 1, "_id": 0}},
        ]

        projects = Subcourse.aggregate(project_query).run()

        # Run allocation algorithm
        allocator = SemanticILPAllocator(projects, groups, alpha=0.5)
        allocs = allocator.allocate()

        # Group allocation results by project
        alloc_by_projects = defaultdict(list)
        for a in allocs:
            alloc_by_projects[a["proj_id"]].append(
                {"id": a["group_id"], "name": a["group_name"]}
            )

        return jsonify(dict(alloc_by_projects)), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
    except ValidationError as e:
        return jsonify({"Error": str(e)}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404


@admin_bp.route("/api/admin/subcourse/members/<subcourse_id>", methods=["GET"])
def subcourse_members(subcourse_id):
    """
    Gets a list of members of the subcourse, including students and staff

    Args:
        subcourse_id (str): identifer of the subcourse

    Returns:
        Response
    """
    if subcourse_id is None:
        return jsonify({"Error: Missing parameter/s"}), 400

    try:
        id_validation(subcourse_id)
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        members = []
        for student_id in subcourse.students:
            found_student = Student.get(student_id).run()
            if found_student is None:
                raise ValueError("Student does not exist in the database")
            # Find curr subcourse in student's list of subcourses
            index = get_subcourse_index(
                found_student.subcourses, ObjectId(subcourse_id)
            )
            student_tutorial = found_student.subcourses[index].tutorial
            student_group = found_student.subcourses[index].group
            members.append(
                {
                    "id": str(found_student.id),
                    "name": found_student.name,
                    "email": found_student.email,
                    "role": found_student.role,
                    "group": str(student_group) if student_group is not None else None,
                    "tutorials": student_tutorial,
                }
            )

        for staff in subcourse.staff:
            found_staff = Staff.find_one({"_id": ObjectId(staff)}).run()
            staff_tutorials = []
            for c in found_staff.classes:
                if c.subcourse == ObjectId(subcourse_id):
                    staff_tutorials = c.tutorials

            members.append(
                {
                    "id": str(found_staff.id),
                    "name": found_staff.name,
                    "email": found_staff.email,
                    "group": None,
                    "role": found_staff.role,
                    "tutorials": staff_tutorials,
                }
            )

        sorted_members = sorted(members, key=lambda x: x["name"])
        return jsonify(sorted_members)
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
    except ValidationError as e:
        return jsonify({"Error": str(e)}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404


@admin_bp.route("/api/admin/dashboard/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("tutor", "course admin")
def subcourse_stats(subcourse_id):
    """
    Gets all statistics related to a specific subcourse

    Args:
        subcourse_id (str): the identifer of subcourse

    Returns:
        Response
    """
    try:
        if subcourse_id is None:
            return jsonify({"Error: Missing parameter/s"}), 400

        # Not a BSON id type
        id_validation(subcourse_id)

        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        course_id = subcourse.parent_course
        if course_id is None:
            return jsonify({"Error: Missing parameter/s"}), 400

        return all_stats(subcourse_id, course_id)
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
    except ValidationError as e:
        return jsonify({"Error": str(e)}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404


@admin_bp.route("/api/staff/links/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("tutor", "course admin")
def get_links(subcourse_id):
    """
    Gets a staff's list of shortcuts for a particular subcourse

    Returns:
        Response: A jsonified list of WebLinks
    """
    staff_id = get_jwt_identity()

    if subcourse_id is None:
        return jsonify({"Error: Missing parameter/s"}), 400

    try:
        id_validation(subcourse_id)
        return staff_links(staff_id, subcourse_id)
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@admin_bp.route("/api/staff/links/<subcourse_id>", methods=["POST"])
@jwt_required()
@role_required("tutor", "course admin")
def post_link(subcourse_id):
    """
    Add customisable shortcut links for a staff

    Args:
        subcourse_id (str): identifer of the subcourse

    Returns:
        Response
    """
    staff_id = get_jwt_identity()
    if subcourse_id is None:
        return jsonify({"Error: Missing parameter/s"}), 400

    try:
        id_validation(subcourse_id)
        data = StaffLinks.model_validate_json(request.data)
        return add_link(staff_id, data, subcourse_id)
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@admin_bp.route("/api/staff/<subcourse_id>/tutorial/groups", methods=["GET"])
@jwt_required()
@role_required("tutor", "course admin")
def get_tutorial_groups(subcourse_id):
    """
    Given a subcourse, maps staff's tutorials with corresponding groups

    Args:
        subcourse_id (str): identifier of subcourse
    """

    try:
        staff_id = get_jwt_identity()

        # Get staff's list of tutorials for a specific subcourse
        staff = Staff.get(staff_id).run()
        subcourse_index = get_subcourse_index(staff.classes, ObjectId(subcourse_id))
        tutorials = staff.classes[subcourse_index].tutorials

        # Get group ids as strings that are in above tutorials
        query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
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
            {
                "$group": {
                    "_id": "$tutorial",
                    "groups": {"$push": {"$toString": "$_id"}},
                }
            },
            {"$match": {"_id": {"$in": tutorials}}},
        ]

        res = Subcourse.aggregate(query).run()

        # Transform into dictionary
        tutorial_groups = {i["_id"]: i["groups"] for i in res}
        return jsonify(tutorial_groups), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
