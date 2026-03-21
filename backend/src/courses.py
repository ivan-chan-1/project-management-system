"""
File containing functions and routes related to courses
"""

from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError
from ..models.request_data import (
    ClientQuestionnaireView,
    ClientQuestionnaireViewList,
    ProjectQuestionnaireView,
    ProjectQuestionnaireViewList,
    RequestTermDates,
    CourseView,
    CourseViewList,
)
from ..models.course import Course
from ..models.client import Client
from .embedding import get_embedding
from .helper import role_required, id_validation, generate_random_color
from .constants import DEFAULT_CLIENT_FORM, DEFAULT_PROJECT_PREFERENCE_FORM

courses_bp = Blueprint("courses", __name__)


def get_course_profile(course_id):
    """Returns the given course

    Args:
        course_id (str): Course id

    Raises:
        ValueError: If the course does not exist
        Exception: Error retrieving the course

    Returns:
        Course: Course object
    """
    try:
        course = Course.find_one({"_id": ObjectId(course_id)}).run()

        # Course does not exist in database
        if course is None:
            raise ValueError("Course cannot be found in database")

        return course.model_dump()
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving course - {str(e)}") from e


def get_all_courses():
    """Get all courses

    Raises:
        ValueError: Error fetching the courses
        Exception: Error retrieving courses

    Returns:
        List: List of courses
    """
    try:
        courses = Course.find_all()

        # Check if the list is empty
        if courses is None:
            raise ValueError("Error when fetching courses")

        return_list = []
        for course in courses:
            return_list.append(course.model_dump())

        return return_list
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving courses - {str(e)}") from e


# Getting the client questionnaire
@courses_bp.route("/api/course/client/questionnaire/<course_id>", methods=["GET"])
def get_client_questionaire(course_id):
    """Get client questionnaire

    Args:
        course_id (str): course id

    Raises:
        ValueError: Course does not exist
        ValueError: Course does not have a client form

    Returns:
        List: Form inputs
    """

    try:
        id_validation(course_id)
        course = Course.find_one({"_id": ObjectId(course_id)}).run()

        if course is None:
            raise ValueError("Course does not exist in the database")

        query = [
            {"$match": {"_id": ObjectId(course_id)}},
            {"$project": {"def_client_questionnaire": 1, "_id": 0}},
            {"$unwind": "$def_client_questionnaire"},
        ]

        return_obj = Course.aggregate(
            query, projection_model=ClientQuestionnaireView
        ).run()

        # If return_obj = []
        if not return_obj:
            return jsonify([]), 200

        # Return the subcourse data as JSON
        return jsonify(ClientQuestionnaireViewList.dump_python(return_obj)), 200

    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


# Getting the project preference form
# Will return [] is there is not form input
@courses_bp.route("/api/course/project/questionnaire/<course_id>", methods=["GET"])
def get_project_questionaire(course_id):
    """Get the project questinnaire

    Args:
        course_id (str): Course id

    Raises:
        ValueError: course does not exist
        ValueError: Project preference form does not exist for subcourse

    Returns:
        List: Form inputs
    """
    try:
        id_validation(course_id)
        course = Course.find_one({"_id": ObjectId(course_id)}).run()

        if course is None:
            raise ValueError("Subcourse does not exist in the database")

        query = [
            {"$match": {"_id": ObjectId(course_id)}},
            {"$project": {"def_project_preference_form": 1, "_id": 0}},
            {"$unwind": "$def_project_preference_form"},
        ]

        return_obj = Course.aggregate(
            query, projection_model=ProjectQuestionnaireView
        ).run()

        # If return_obj = []
        if not return_obj:
            return jsonify([]), 200

        # Return the subcourse data as JSON
        return jsonify(ProjectQuestionnaireViewList.dump_python(return_obj)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@courses_bp.route("/api/course/details/<course_id>", methods=["GET"])
def get_course_details(course_id):
    """Gets the detail for a particular couse

    Args:
        course_id (str): Course id

    Returns:
        _type_: _description_
    """
    if course_id is None:
        return jsonify({"Error: Missing parameter"}), 400

    try:
        id_validation(course_id)
        group = get_course_profile(course_id)
        return jsonify(group)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": "Invalid client ID format" + str(e)}), 500


@courses_bp.route("/api/course/all", methods=["GET"])
def get_course_all():
    """Gets all courses

    Returns:
        List: List of courses
    """
    try:
        group = get_all_courses()
        return jsonify(group)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@courses_bp.route("/api/course/addclient", methods=["PUT"])
@jwt_required()
def client_apply():
    """Allow clients to apply for a course

    Returns:
        Success message
    """
    data = request.json
    course_id = data.get("course_id")
    client_id = get_jwt_identity()

    try:
        id_validation(course_id)
        id_validation(client_id)
        course = Course.find_one({"_id": ObjectId(course_id)}).run()
        if not course:
            return jsonify({"Error": "Course does not exist"}), 400
        if ObjectId(client_id) in course.clients:
            return jsonify({"Error": "Client already applied"}), 400
        course.clients.append(ObjectId(client_id))
        course.save()

        # Now adding course to client
        client = Client.find_one({"_id": ObjectId(client_id)}).run()
        client.courses.append(ObjectId(course_id))
        client.save()

        return jsonify({"message": "Client added successfully!"}), 200
    except ValidationError as e:
        return jsonify({"Error": str(e)}), 404
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@courses_bp.route("/api/course/term-dates/<course_id>", methods=["GET"])
def get_course_terms(course_id):
    """
    Gets the term dates that the course is offered

    Args:
        course_id (str): course id

    Returns:
        List: List of strings (dates)
    """
    try:
        course = Course.find_one({"_id": ObjectId(course_id)}).run()
        if not course:
            return jsonify({"Error": "Course does not exist"}), 400
        return course.term_dates, 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


def course_search(query):
    """
    Provides back most related courses to query

    Args:
        query (string): Search query

    Returns:
        List: List of courses
    """
    try:
        embedded_query = get_embedding(query)

        pipeline = [
            {
                "$vectorSearch": {
                    "index": "course_vector_search",
                    "path": "embedded_description",
                    "queryVector": embedded_query,
                    "numCandidates": 200,
                    "limit": 30,
                }
            }
        ]

        result = Course.aggregate(pipeline, projection_model=CourseView).run()
        return CourseViewList.dump_python(result)

    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 400


@courses_bp.route("/api/course/search", methods=["GET"])
def search_courses():
    """
    Given a query (string), returns related courses based
    off course description

    Raises:
        ValueError: If query provided is not a string

    Returns:
        List: List of courses
    """
    try:
        query = request.args.get("query", type=str)

        if not isinstance(query, str):
            raise ValueError("Query must be of type string")

        return jsonify(course_search(query)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@courses_bp.route("/api/course/update/date", methods=["PUT"])
@jwt_required()
@role_required("course admin")
def update_parent_dates():
    """
    Updates the dates for the course (parent)

    Returns:
        Success message
    """
    RequestTermDates.model_validate_json(request.data)
    data = request.get_json()
    new_term_dates = data.get("term_dates")
    course_id = data.get("course_id")

    admin_id = get_jwt_identity()

    try:
        id_validation(course_id)
        id_validation(admin_id)

        course = Course.find_one({"_id": ObjectId(course_id)}).run()
        if not course:
            return jsonify({"Error": "Course does not exist"}), 400
        course.term_dates = new_term_dates
        course.save()
        return jsonify({"message": "Dates added successfully!"}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@courses_bp.route("/api/staff/course/create", methods=["POST"])
@jwt_required()
@role_required("course admin")
def create_course():
    """
    Create a new course

    Steps:
    - Validate required fields ('name' and 'code') are present
    - Check that no existing course shares the same code
    - Set up the default client questionnaire options based on term dates
    - Create and insert a new course document into the database

    Returns:
        Response
    """
    staff_id = get_jwt_identity()

    data = request.json
    course_name = data.get("name")
    course_code = data.get("code")
    course_description = data.get("description")
    term_dates = data.get("termDates")
    embedded_description = get_embedding(course_description)

    if not course_name or not course_code:
        return jsonify({"message": "Missing required fields"}), 400

    # check course doesn't already exist in db
    if Course.find_one({"code": course_code}).run():
        return jsonify({"message": "Course already exists"}), 400

    term_ints = [int(k) for k in term_dates.keys()]

    client_questionnaire = DEFAULT_CLIENT_FORM
    for item in client_questionnaire:
        if item["label"] == "Offering Terms":
            item["options"] = term_dates.keys()
            break
    try:
        new_course = Course(
            name=course_name,
            code=course_code,
            description=course_description,
            owner=staff_id,
            terms=term_ints,
            term_dates=term_dates,
            def_client_questionnaire=client_questionnaire,
            def_project_preference_form=DEFAULT_PROJECT_PREFERENCE_FORM,
            projects=[],
            clients=[],
            embedded_description=embedded_description,
            color=generate_random_color(),
        )

        new_course.insert()
        return jsonify(
            {
                "message": "Course created successfully!",
                "course_id": str(new_course.id),  # Convert ObjectId to string
            }
        ), 201
    except ValueError as e:
        return jsonify({"Error": str(e)}), 404
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


# returns all course codes that exist in the db
@courses_bp.route("/api/staff/all-course-codes", methods=["GET"])
@jwt_required()
def get_all_course_codes():
    """
    Retrieve all course codes and their corresponding ids.

    Returns:
        Response
    """

    try:
        courses = Course.find({}).run()
        course_codes = {course.code: str(course.id) for course in courses}
        return jsonify(course_codes), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
