"""
API routes and helper functions for student related functionality
"""

from pydantic import ValidationError
from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.group import Group
from ..models.student import Student
from ..models.subcourse import Subcourse
from ..models.request_data import (
    UpdateStudentDetails,
    WishlistProjects,
    PreferenceData,
    PreferenceView,
    PreferenceViewList,
    WishlistProjectsList,
)

from .helper import get_subcourse_index, role_required, id_validation

students_bp = Blueprint("students", __name__)


def get_student_details(student_id):
    """
    Retrieves the details of a student

    Args:
        student_id (str): the identifer of the student

    Returns:
        dict: a mapping of student details
    """
    try:
        student = Student.find_one({"_id": ObjectId(student_id)}).run()

        # Student Id does not exist in database
        if student is None:
            raise ValueError("Student cannot be found in database")

        return student.model_dump()
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving student - {str(e)}") from e


def get_student_preferences(subcourse_id, student_id):
    """
    Retrieves the student's individual preferences

    Args:
        subcourse_id (str): the identifer of the subcourse
        student_id (str): the identifer of the student

    Returns:
        List[Preference]: the list of preferences
    """

    try:
        query = [
            {"$match": {"_id": ObjectId(student_id)}},
            {"$unwind": "$subcourses"},
            {"$replaceRoot": {"newRoot": "$subcourses"}},
            {"$match": {"subcourse": ObjectId(subcourse_id)}},
            {"$unwind": "$preferences"},
            {"$replaceRoot": {"newRoot": "$preferences"}},
            {
                "$lookup": {
                    "from": "projects",
                    "localField": "project",
                    "foreignField": "_id",
                    "as": "project",
                }
            },
            {"$unwind": "$project"},
        ]

        return Student.aggregate(query, projection_model=PreferenceView).run()
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving student preferences - {str(e)}") from e


def remove_student(subcourse_id, student_id):
    """
    Unenrols a student from a subcourse

    Args:
        subcourse_id (str): the identifer of a subcourse
        student_id (str): the identifier of a student
    """
    try:
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        student = Student.find_one({"_id": ObjectId(student_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")
        if student is None:
            raise ValueError("Student does not exist in the database")

        if student.id not in subcourse.students:
            raise ValueError("Student does not exist within subcourse")

        # Will create a new array that excludes the object which matches to subcourse_id
        new_student_subcourse = []
        for course in student.subcourses:
            if course.subcourse == ObjectId(subcourse_id):
                group = Group.find_one({"_id": course.group}).run()

                if group is None:
                    continue

                group.members.remove(ObjectId(student_id))
                if group.lead == ObjectId(student_id):
                    group.lead = None
                group.save()
            else:
                new_student_subcourse.append(course)

        student.subcourses = new_student_subcourse
        student.save()

        subcourse.students.remove(ObjectId(student_id))
        subcourse.save()

        return student
    except RuntimeError as e:
        raise RuntimeError(f"Error removing student - {str(e)}") from e


def student_course(subcourse_id):
    """
    Retrieves the number of students in a subcourse

    Args:
        subcourse_id (str): str

    Returns:
        list(dict(str, int)): for example [{"number_students": 3}]
    """
    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        student_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$students"},
            {"$count": "number_students"},
        ]

        number_students = Subcourse.aggregate(student_query).run()

        if not number_students:
            return {"number_students": 0}
        return number_students[0]

    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of students - {str(e)}") from e


@students_bp.route("/api/student/details/<student_id>", methods=["GET"])
def student_details(student_id):
    """
    Retrieves the details of a student

    Args:
        student_id (str): the identifier of the student
    """

    try:
        id_validation(student_id)
        details = get_student_details(student_id)
        return jsonify(details)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/student/details", methods=["POST"])
@jwt_required()
@role_required("student")
def update_student_details():
    """
    Updates a student details
    """
    student_id = get_jwt_identity()

    try:
        id_validation(student_id)
        new_stu = UpdateStudentDetails.model_validate_json(request.data)
        old_stu = Student.find_one({"_id": ObjectId(student_id)}).run()
        old_stu.year = new_stu.year
        old_stu.experiences = new_stu.experiences
        index = next(
            (
                i
                for i, s in enumerate(old_stu.subcourses)
                if s.subcourse == ObjectId(new_stu.subcourse)
            ),
            -1,
        )
        old_stu.subcourses[index].tutorial = new_stu.tutorial
        old_stu.save()
        return jsonify({"message": "Updated successfully!"}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": repr(e)}), 500


@students_bp.route("/api/student/update/wishlist", methods=["PUT"])
@jwt_required()
@role_required("student")
def update_wishlist():
    """
    Adds a project to a student's wishlist
    """
    student_id = get_jwt_identity()

    data = request.json
    project = data.get("project_id")
    subcourse = data.get("subcourse_id")

    if not project or not subcourse:
        return jsonify({"message": "Missing required fields"}), 400

    try:
        id_validation(project)
        id_validation(subcourse)
        id_validation(student_id)
        student = Student.find_one({"_id": ObjectId(student_id)}).run()
        if not student:
            return jsonify({"Error": "Student not found"}), 404
        for sub in student.subcourses:
            if sub.subcourse == ObjectId(subcourse):
                if ObjectId(project) not in sub.wishlist:
                    sub.wishlist.append(ObjectId(project))
        student.save()
        return jsonify({"message": "Wishlist updated successfully!"}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/student/liked/<subcourse_id>/<project_id>", methods=["GET"])
@jwt_required()
def student_liked(subcourse_id, project_id):
    """
    Checks if the a project is in a student's wishlist

    Args:
        subcourse_id (str): identifier of a subcourse
        project_id (str): identifer of a project

    Returns:
        dict[str, bool]: jsonified dict that indicates if project has been liked
    """
    student_id = get_jwt_identity()

    try:
        id_validation(student_id)
        student = Student.get(student_id).run()
        index = get_subcourse_index(student.subcourses, ObjectId(subcourse_id))
        if ObjectId(project_id) in student.subcourses[index].wishlist:
            return jsonify({"liked": True}), 200

        return jsonify({"liked": False}), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/student/remove/wishlist", methods=["PUT"])
@jwt_required()
@role_required("student")
def remove_wishlist():
    """
    Removes a project from a wishlist
    """
    student_id = get_jwt_identity()
    data = request.json
    project = data.get("project_id")
    subcourse = data.get("subcourse_id")

    if not project or not subcourse:
        return jsonify({"message": "Missing required fields"}), 400

    try:
        # Validate ids
        id_validation(project)
        id_validation(subcourse)
        id_validation(student_id)

        # Retrieve student
        student = Student.find_one({"_id": ObjectId(student_id)}).run()

        # Find subcourse and remove from project wishlist
        for sub in student.subcourses:
            if sub.subcourse == ObjectId(subcourse):
                if ObjectId(project) in sub.wishlist:
                    sub.wishlist.remove(ObjectId(project))
        student.save()

        return jsonify({"message": "Wishlist updated successfully!"}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/student/wishlist/<subcourse_id>/<student_id>", methods=["GET"])
@jwt_required()
@role_required("student")
def get_wishlist(subcourse_id, student_id):
    """
    Retrieves a student's wishlist

    Args:
        subcourse_id (str): an identifier of the subcourse
        student_id (str): and identifier of the student
    """
    try:
        id_validation(subcourse_id)
        id_validation(student_id)
        wishlist = Student.aggregate(
            [
                {"$match": {"_id": ObjectId(student_id)}},
                {"$unwind": "$subcourses"},
                {"$match": {"subcourses.subcourse": ObjectId(subcourse_id)}},
                {"$addFields": {"wishlist": "$subcourses.wishlist"}},
                {"$project": {"name": 1, "wishlist": 1}},
                {
                    "$lookup": {
                        "from": "projects",
                        "localField": "wishlist",
                        "foreignField": "_id",
                        "as": "wishlist",
                    }
                },
            ],
            projection_model=WishlistProjects,
        ).run()

        if not wishlist:
            return jsonify({"Error": "Group not found"}), 400

        return jsonify(WishlistProjectsList.dump_python(wishlist)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/student/preference/submit/<subcourse_id>", methods=["POST"])
@jwt_required()
@role_required("student")
def student_preference_submit(subcourse_id):
    """
    Store the student's individual list of preference

    Args:
        subcourse_id (str): the identifier of the subcourse
    """
    student_id = get_jwt_identity()

    try:
        id_validation(subcourse_id)
        id_validation(student_id)
        if request.json.get("proj_preferences") is None:
            return jsonify({"Error": "No field proj_preferences"}), 400

        preferences = [
            PreferenceData.model_validate(x)
            for x in request.json.get("proj_preferences")
        ]

        student = Student.get(student_id).run()

        index = get_subcourse_index(student.subcourses, ObjectId(subcourse_id))
        student.subcourses[index].preferences = preferences
        student.save()
        return jsonify({"message": "Preferences saved successfully!"}), 201

    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route(
    "/api/student/preference/<subcourse_id>/<student_id>", methods=["GET"]
)
@jwt_required()
@role_required("student", "tutor", "course admin")
def student_preferences_get(subcourse_id, student_id):
    """
    Retrieves the student's individual list of preference

    Args:
        subcourse_id (str): the identifier of the subcourse
        student_id (str): the identifier of the student
    """
    try:
        id_validation(subcourse_id)
        preferences = get_student_preferences(subcourse_id, student_id)

        return jsonify(PreferenceViewList.dump_python(preferences)), 200

    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/student/tutorial/<student_id>/<subcourse_id>", methods=["GET"])
def student_tutorial(student_id, subcourse_id):
    """
    Retrives the tutorial the student is enrolled in

    Args:
        student_id (str): the identifier of the student
        subcourse_id (str): the identifier of the subcourse
    """

    try:
        id_validation(subcourse_id)
        id_validation(student_id)
        if not Student.find_one({"_id": ObjectId(student_id)}).run():
            return jsonify({"Error": "Student not found"}), 400
        if not Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run():
            return jsonify({"Error": "Subcourse not found"}), 400

        query = [
            {"$match": {"_id": ObjectId(student_id)}},
            {"$unwind": "$subcourses"},
            {"$match": {"subcourses.subcourse": ObjectId(subcourse_id)}},
            {"$project": {"_id": 0, "tutorial": "$subcourses.tutorial"}},
        ]
        tutorial = Student.aggregate(query).run()

        return jsonify(tutorial[0]["tutorial"]), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/student/remove", methods=["DELETE"])
@jwt_required()
@role_required("course admin")
def student_remove():
    """
    Unenrols a student from a subcourse
    """
    subcourse_id = request.args.get("subcourse_id", type=str)
    student_id = request.args.get("student_id", type=str)

    try:
        id_validation(subcourse_id)
        id_validation(student_id)
        response = remove_student(subcourse_id, student_id)
        return jsonify(response.model_dump()), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@students_bp.route("/api/admin/students/unallocated/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("tutor", "course admin")
def get_num_students_unallocated(subcourse_id):
    """
    Retrives the number of students who have not yet been allocated a group
    Args:
        subcourse_id (str): the identifier of a subcourse
    """
    try:
        id_validation(subcourse_id)
        num_students = Subcourse.aggregate(
            [
                {"$match": {"_id": ObjectId(subcourse_id)}},
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
                {
                    "$match": {
                        "subcourses.subcourse": ObjectId(subcourse_id),
                        "subcourses.group": None,
                    }
                },
            ]
        ).run()
        return jsonify(len(num_students)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
