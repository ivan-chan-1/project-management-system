"""
API routes and helper functions related to subcourses
"""

from itertools import chain

from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, jsonify, request
from ..models.student import Student
from ..models.course import Course
from ..models.subcourse import Subcourse
from ..models.client import Client
from ..models.staff import Staff, Class
from ..models.project import Project
from ..models.request_data import (
    SubcourseDescriptionView,
    SubcourseList,
    CourseView,
    CourseViewList,
    StudentList,
    StudentView,
    CreateSubcourse,
    SubcourseFullView,
    UpdateCourse,
)

from .helper import role_required, generate_random_color, id_validation
from .channels import create_default_channels

subcourses_bp = Blueprint("subcourses", __name__)


def get_all_subcourses(user_id, user_type):
    """Function to get all subcourses

    Args:
        id (str)
        user_type (str)

    Returns:
        List: Subcourse
    """
    student_query = [
        {"$match": {"_id": ObjectId(user_id)}},
        {"$unwind": "$subcourses"},
        {"$replaceRoot": {"newRoot": "$subcourses"}},
        {
            "$lookup": {
                "from": "subcourses",
                "localField": "subcourse",
                "foreignField": "_id",
                "as": "col",
            }
        },
        {"$unwind": "$col"},
        {"$replaceRoot": {"newRoot": "$col"}},
        {"$match": {"is_published": True}},
        {
            "$lookup": {
                "from": "courses",
                "localField": "parent_course",
                "foreignField": "_id",
                "as": "col",
            }
        },
        {"$addFields": {"description": {"$arrayElemAt": ["$col.description", 0]}}},
        {"$project": {"col": 0}},
    ]

    client_query = [
        {"$match": {"_id": ObjectId(user_id)}},
        {"$unwind": "$courses"},
        {"$project": {"courses": 1, "_id": 0}},
        {
            "$lookup": {
                "from": "courses",
                "localField": "courses",
                "foreignField": "_id",
                "as": "col",
            }
        },
        {"$unwind": "$col"},
        {"$replaceRoot": {"newRoot": "$col"}},
    ]

    staff_query = [
        {"$match": {"_id": ObjectId(user_id)}},
        {"$unwind": "$classes"},
        {"$replaceRoot": {"newRoot": "$classes"}},
        {
            "$lookup": {
                "from": "subcourses",
                "localField": "subcourse",
                "foreignField": "_id",
                "as": "subcourse",
            }
        },
        {"$unwind": "$subcourse"},
        {"$replaceRoot": {"newRoot": "$subcourse"}},
        {
            "$lookup": {
                "from": "courses",
                "localField": "parent_course",
                "foreignField": "_id",
                "as": "col",
            }
        },
        {"$addFields": {"description": {"$arrayElemAt": ["$col.description", 0]}}},
        {"$project": {"col": 0}},
    ]

    try:
        if user_type == "student":
            student = Student.aggregate(
                student_query, projection_model=SubcourseDescriptionView
            ).run()
            return SubcourseList.dump_json(student)
        if user_type == "client":
            client = Client.aggregate(client_query, projection_model=CourseView).run()
            return CourseViewList.dump_json(client)
        if user_type == "staff":
            admin = Staff.aggregate(
                staff_query, projection_model=SubcourseDescriptionView
            ).run()
            return SubcourseList.dump_json(admin)

        raise ValueError("User type does not exist within this application")
    except RuntimeError as e:
        raise e


def update_subcourse(subcourse_id, updated_data):
    """Function to update subcourse

    Args:
        subcourseId (str)
        updatedData (obj): JSON object containing updated information

    Returns:
        Object: Specific project info
    """
    try:
        old_sub = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if old_sub is None:
            raise ValueError("Subcourse does not exist within the database")

        # Update fields
        old_sub.name = updated_data.get("name")
        old_sub.code = updated_data.get("code")
        old_sub.term = updated_data.get("term")
        old_sub.max_group_size = updated_data.get("max_group_size")
        old_sub.client_questionnaire = updated_data.get("client_questionnaire")
        old_sub.project_preference_form = updated_data.get("project_preference_form")
        old_sub.preference_release = updated_data.get("preference_release")

        old_sub.save()
        if updated_data.get("is_default", False):  # Default to False if not provided
            if "parent_course" not in updated_data:
                raise ValueError("parent_course is required when is_default is True")
            parent_course = Course.find_one(
                {"_id": ObjectId(updated_data["parent_course"])}
            ).run()
            if parent_course is None:
                raise ValueError("Course does not exist within the database")

            parent_course.def_client_questionnaire = updated_data.get(
                "client_questionnaire"
            )
            parent_course.def_project_preference_form = updated_data.get(
                "project_preference_form"
            )
            parent_course.save()

        # Return a plain dict, not a Response
        return {
            "name": old_sub.name,
            "code": old_sub.code,
            "term": old_sub.term,
            "max_group_size": old_sub.max_group_size,
            "client_questionnaire": old_sub.client_questionnaire,
            "project_preference_form": old_sub.project_preference_form,
        }
    except RuntimeError as e:
        return {
            "error": f"Error trying to update the subcourse and/or course: {str(e)}"
        }


@subcourses_bp.route("/api/<user_type>/subcourse/all", methods=["GET"])
@jwt_required()
def subcourse_all(user_type):
    """API route to get all subcourses

    Args:
        user_type (str)

    Returns:
        List: Subcourse
    """
    user_id = get_jwt_identity()

    try:
        id_validation(user_id)
        subcourses = get_all_subcourses(user_id, user_type)
        return subcourses
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/<subcourse_id>", methods=["GET"])
@jwt_required()
def get_subcourse(subcourse_id):
    """API route to get subcourse and respective information

    Args:
        subcourse_id (str)

    Returns:
        Object: Subcourse
    """
    try:
        id_validation(subcourse_id)

        query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$addFields": {"original_id": "$_id"}},
            {
                "$lookup": {
                    "from": "groups",
                    "localField": "groups",
                    "foreignField": "_id",
                    "as": "groups_docs",
                }
            },
            {"$unwind": {"path": "$groups_docs", "preserveNullAndEmptyArrays": True}},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "groups_docs.members",
                    "foreignField": "_id",
                    "as": "member_objs",
                }
            },
            {
                "$group": {
                    "_id": "$groups_docs._id",
                    "name": {"$first": "$groups_docs.name"},
                    "tutorial": {"$first": "$groups_docs.tutorial"},
                    "project": {"$first": "$groups_docs.project"},
                    "client_ids": {"$first": "$groups_docs.clients"},
                    "members": {"$first": "$member_objs"},
                    "original_id": {"$first": "$original_id"},
                }
            },
            {
                "$lookup": {
                    "from": "projects",
                    "localField": "project",
                    "foreignField": "_id",
                    "as": "project_data",
                }
            },
            {"$unwind": {"path": "$project_data", "preserveNullAndEmptyArrays": True}},
            {
                "$group": {
                    "_id": "$original_id",
                    "groups": {
                        "$push": {
                            "_id": "$_id",
                            "name": "$name",
                            "tutorial": "$tutorial",
                            "members": "$members",
                            "project": {"$ifNull": ["$project_data", None]},
                        }
                    },
                }
            },
            {
                "$addFields": {
                    "groups": {
                        "$filter": {
                            "input": "$groups",
                            "as": "grp",
                            "cond": {"$gt": [{"$size": "$$grp.members"}, 0]},
                        }
                    }
                }
            },
            {
                "$lookup": {
                    "from": "subcourses",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "course",
                }
            },
            {"$unwind": {"path": "$course", "preserveNullAndEmptyArrays": True}},
            {
                "$addFields": {
                    "name": "$course.name",
                    "code": "$course.code",
                    "year": "$course.year",
                    "term": "$course.term",
                    "students": "$course.students",
                    "max_group_size": "$course.max_group_size",
                    "client_questionnaire": "$course.client_questionnaire",
                    "project_preference_form": "$course.project_preference_form",
                    "is_archived": "$course.is_archived",
                    "preference_release": "$course.preference_release",
                    "parent_course": "$course.parent_course",
                }
            },
            {"$unwind": {"path": "$students", "preserveNullAndEmptyArrays": True}},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "students",
                    "foreignField": "_id",
                    "as": "student_obj",
                }
            },
            {"$unwind": {"path": "$student_obj", "preserveNullAndEmptyArrays": True}},
            {
                "$group": {
                    "_id": "$_id",
                    "groups": {"$first": "$groups"},
                    "name": {"$first": "$name"},
                    "code": {"$first": "$code"},
                    "year": {"$first": "$year"},
                    "term": {"$first": "$term"},
                    "is_archived": {"$first": "$is_archived"},
                    "students": {"$push": "$student_obj"},
                    "max_group_size": {"$first": "$max_group_size"},
                    "client_questionnaire": {"$first": "$client_questionnaire"},
                    "project_preference_form": {"$first": "$project_preference_form"},
                    "preference_release": {"$first": "$preference_release"},
                    "parent_course": {"$first": "$parent_course"},
                }
            },
        ]

        subcourse = Subcourse.aggregate(query, projection_model=SubcourseFullView).run()

        if len(subcourse) == 0:
            raise ValueError("Subcourse cannot be found in database")
        # Return the subcourse data as JSON
        return subcourse[0].model_dump(), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/students/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("course admin", "tutor")
def get_subcourse_students(subcourse_id):
    """API route to get students from a subcourse

    Args:
        subcourse_id (str)

    Returns:
        List: Students
    """
    try:
        id_validation(subcourse_id)

        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$students"},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "students",
                    "foreignField": "_id",
                    "as": "students",
                }
            },
            {"$unwind": "$students"},
            {"$replaceRoot": {"newRoot": "$students"}},
            {"$unwind": "$subcourses"},
            {"$match": {"subcourses.subcourse": ObjectId(subcourse_id)}},
        ]
        students = Subcourse.aggregate(query, projection_model=StudentView).run()
        return jsonify(StudentList.dump_python(students)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/update/<subcourse_id>", methods=["PUT"])
@jwt_required()
@role_required("course admin")
def subcourse_update(subcourse_id):
    """API route to update a subcourse

    Args:
        subcourse_id (str)

    Returns:
        Object: Subcourse
    """
    try:
        id_validation(subcourse_id)
        UpdateCourse.model_validate_json(request.data)
        updated_subcourse = update_subcourse(subcourse_id, request.json)
        return jsonify(updated_subcourse), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


# Route that checks whether a subcourse's preference form is set to be released yet
@subcourses_bp.route(
    "/api/subcourse/preference/release/<subcourse_id>", methods=["GET"]
)
def is_preference_released(subcourse_id):
    """API route to check whether preference form has been released

    Args:
        subcourse_id (str)

    Returns:
        Bool
    """

    try:
        id_validation(subcourse_id)
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse does not exist within the database")

        is_released = subcourse.preference_release
        return jsonify(is_released), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@subcourses_bp.route("/api/subcourse/<subcourse_id>/archive", methods=["PUT"])
@jwt_required()
@role_required("course admin")
def archive_subcourse(subcourse_id):
    """API route to archive a subcourse

    Args:
        subcourse_id (str)

    Returns:
        Object: Empty
    """

    try:
        id_validation(subcourse_id)
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse does not exist within the database")

        Project.find_many({"_id": {"$in": subcourse.projects}}).update_many(
            {"$set": {"status": "unavailable", "subcourse": None}}
        ).run()

        subcourse.is_archived = True
        subcourse.is_published = False
        subcourse.save()
        return jsonify({}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/<subcourse_id>/archive", methods=["GET"])
@jwt_required()
@role_required("course admin")
def is_archived(subcourse_id):
    """Checks whether a subcourse is archived

    Args:
        subcourse_id (str)

    Returns:
        Bool
    """
    try:
        id_validation(subcourse_id)
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse does not exist within the database")

        return jsonify({"archived": subcourse.is_archived}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/<subcourse_id>/activate", methods=["PUT"])
@jwt_required()
@role_required("course admin")
def activate_subcourse(subcourse_id):
    """API route to activate a subcourse

    Args:
        subcourse_id (str)

    Returns:
        Object: Empty
    """

    try:
        id_validation(subcourse_id)
        curr_subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if curr_subcourse is None:
            raise ValueError("Subcourse does not exist within the database")

        other_subcourses = Subcourse.find_many(
            {"parent_course": curr_subcourse.parent_course, "is_published": True}
        ).run()

        if len(other_subcourses) != 0:
            return jsonify(
                {
                    "Error": "Could not activate. There can only be one active subcourse per course"
                }
            ), 400

        Project.find_many({"_id": {"$in": curr_subcourse.projects}}).update_many(
            {"$set": {"status": "available", "subcourse": curr_subcourse.id}}
        ).run()

        curr_subcourse.is_published = True
        curr_subcourse.save()
        return jsonify({}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/<subcourse_id>/active", methods=["GET"])
@jwt_required()
@role_required("course admin", "tutor")
def is_active(subcourse_id):
    """API route that checks whether a subcourse is active

    Args:
        subcourse_id (str)

    Returns:
        Bool
    """

    try:
        id_validation(subcourse_id)
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse does not exist within the database")

        return jsonify({"active": subcourse.is_published}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/<subcourse_id>/activatable", methods=["GET"])
@jwt_required()
@role_required("course admin")
def can_activate(subcourse_id):
    """API route that checks whether a subcourse can be activated

    Args:
        subcourse_id (str)

    Returns:
        Bool
    """

    try:
        id_validation(subcourse_id)
        curr_subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if curr_subcourse is None:
            return jsonify(
                {"Error": "Subcourse does not exist within the database"}
            ), 400

        subcourses = Subcourse.find_many(
            {"parent_course": curr_subcourse.parent_course, "is_published": True}
        ).run()

        if len(subcourses) == 0:
            return jsonify({"active": True}), 200

        return jsonify({"active": False}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@subcourses_bp.route("/api/subcourse/existing", methods=["GET"])
@jwt_required()
@role_required("course admin")
def existing_subcourse():
    """API route to return all existing subcourses

    Returns:
        List: Subcourses
    """
    term = request.args.get("term", type=int)
    code = request.args.get("code", type=str)
    year = request.args.get("year", type=int)

    if not term or not code or not year:
        return jsonify({"Error": "Invalid ID format"}), 400

    try:
        existing = Subcourse.find({"term": term, "code": code, "year": year}).run()

        if len(existing) != 0:
            return jsonify(
                {"Error": "Subcourse exists. Select the correct offering term."}
            ), 400

        return jsonify({}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@subcourses_bp.route("/api/staff/subcourse/create", methods=["POST"])
@jwt_required()
def create_subcourse():
    """
    Create a new subcourse for a parent course.

    Steps:
    - Validate the provided subcourse data.
    - Check if the parent course with the given code exists.
    - Ensure the term is available for the parent course.
    - Ensure a subcourse for the given year, term, and code does not already exist.
    - Fetch all available/unavailable projects linked to the parent course for the term.
    - Create communication channels for subcourse clients.
    - Create and insert the new subcourse into the database.
    - Update the staff member's list of classes with the new subcourse.

    Returns:
        Response:
        - 201: Success message and newly created subcourse ID.
        - 400: If the parent course or term is invalid, or subcourse already exists.
        - 404: If the parent course is not found.
        - 500: If an internal server error occurs.
    """
    staff_id = get_jwt_identity()

    try:
        id_validation(staff_id)

        subcourse = CreateSubcourse.model_validate_json(request.data)
        # Find the parent course with the same code
        parent_course = Course.find_one({"code": subcourse.code}).run()
        if not parent_course:
            return jsonify({"message": "Parent course not found"}), 404

        if subcourse.term not in parent_course.terms:
            return jsonify({"message": "Term not available for this course"}), 400

        existing = Subcourse.find(
            {"term": subcourse.term, "code": subcourse.code, "year": subcourse.year}
        ).run()
        if len(existing) != 0:
            return jsonify({"message": "This subcourse already exists"}), 400

        # Find all available projects for the current term
        projects = Project.find(
            {
                "terms": subcourse.term,
                "course": parent_course.id,
                "status": {"$in": ["available", "unavailable"]},
            }
        ).run()
        clients = [p.clients for p in projects]
        subcourse_clients = list(chain.from_iterable(clients))
        channels = create_default_channels(ObjectId(staff_id), subcourse_clients)

        new_subcourse = Subcourse(
            name=f"{subcourse.year}T{subcourse.term}",
            code=subcourse.code,
            owner=staff_id,
            year=subcourse.year,
            term=subcourse.term,
            is_archived=False,
            parent_course=parent_course.id,
            students=[],
            staff=[staff_id],
            groups=[],
            projects=[p.id for p in projects],
            clients=subcourse_clients,
            channels=channels,
            client_questionnaire=parent_course.def_client_questionnaire,
            project_preference_form=parent_course.def_project_preference_form,
            is_published=False,
            max_group_size=6,
            preference_release=False,
            color=generate_random_color(),
        )

        new_subcourse.insert()

        # Add to subcourse to owner's list of subcourses
        staff = Staff.get(staff_id).run()
        staff.classes.append(Class(subcourse=new_subcourse.id, tutorials=[]))
        staff.save()

        return jsonify(
            {
                "message": "Subcourse created successfully!",
                "subcourse_id": str(new_subcourse.id),
            }
        ), 201
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
