"""
API routes and helper functions for client related functionality
"""

from bson import ObjectId
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask import Blueprint, jsonify, request

from ..models.client import Client
from ..models.course import Course
from ..models.subcourse import Subcourse
from ..models.staff import Staff
from ..models.request_data import (
    ProjectView,
    ProjectViewList,
    CourseView,
    CourseViewList,
    UpdateClient,
    SubcourseClientView,
    SubcourseClientViewList,
)

from .helper import role_required, id_validation
from .notifications import client_outcome_notification

clients_bp = Blueprint("clients", __name__)


# Helper Functions
def get_client_project(client_id, course_id):
    """
    Gets all projects created by a client

    Args:
        client_id (str): the identifier of a client
        course_id (str): the identifier of a course
    """

    try:
        project_query = [
            {"$match": {"_id": ObjectId(client_id)}},
            {"$unwind": "$projects"},
            {"$project": {"projects": 1, "_id": 0}},
            {
                "$lookup": {
                    "from": "projects",
                    "localField": "projects",
                    "foreignField": "_id",
                    "as": "col",
                }
            },
            {"$unwind": "$col"},
            {"$replaceRoot": {"newRoot": "$col"}},
            {"$match": {"course": ObjectId(course_id)}},
        ]

        res = Client.aggregate(project_query, projection_model=ProjectView).run()
        return ProjectViewList.dump_python(res)
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving project - {str(e)}") from e


def get_client_courses(client_id):
    """
    Retrieves all courses client has joined

    Args:
        client_id (str): the identifier of a client
    """
    try:
        course_query = [
            {"$match": {"_id": ObjectId(client_id)}},
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

        res = Client.aggregate(course_query, projection_model=CourseView).run()
        return CourseViewList.dump_python(res)
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving courses - {str(e)}") from e


def get_client_profile(client_id):
    """
    Retrieves all client details

    Args:
        client_id (str): the identifier of a client
    """

    try:
        client = Client.find_one({"_id": ObjectId(client_id)}).run()

        # Student Id does not exist in database
        if client is None:
            raise ValueError("Client cannot be found in database")

        return client.model_dump()
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving client - {str(e)}") from e


def update_client_profile(client_id, data):
    """
    Updates client details

    Args:
        client_id (str): _description_
        data (bytes): mappings of new details as bytes
    """
    try:
        new_client = UpdateClient.model_validate_json(data)
        old_client = Client.find_one({"_id": ObjectId(client_id)}).run()

        old_client.name = new_client.name
        old_client.email = new_client.email
        old_client.phone = new_client.phone
        old_client.company_name = new_client.company_name
        old_client.company_industry = new_client.industry
        old_client.company_abn = new_client.company_abn
        old_client.contact_hours = new_client.hours
        old_client.wishlist = new_client.wishlist
        old_client.preferences = new_client.preferences
        old_client.company_brief = new_client.company_brief
        old_client.company_address = new_client.company_address

        old_client.save()
        return old_client.model_dump()
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving client - {str(e)}") from e


def client_verified(course_id):
    """
    Calculates the number of verified clients in a course

    Args:
        course_id (str): the identifier of a course

    Returns:
        dict: mapping of statistic to calculated count
    """
    try:
        course = Course.find_one({"_id": ObjectId(course_id)}).run()

        if course is None:
            raise ValueError("Subcourse does not exist in the database")

        client_query = [
            {"$match": {"_id": ObjectId(course_id)}},
            {"$unwind": "$clients"},
            {"$project": {"clients": 1, "_id": 0}},
            {
                "$lookup": {
                    "from": "clients",
                    "localField": "clients",
                    "foreignField": "_id",
                    "as": "col",
                }
            },
            {"$unwind": "$col"},
            {"$replaceRoot": {"newRoot": "$col"}},
            {"$match": {"is_verified": True}},
            {"$count": "verified_clients"},
        ]

        verified_clients = Course.aggregate(client_query).run()
        # Empty array
        if not verified_clients:
            return {"verified_clients": 0}
        return verified_clients[0]
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of clients - {str(e)}") from e


# Unverified clients
def client_unverified(course_id):
    """
    Calculates the number of unverified clients in a course

    Args:
        course_id (str): the identifier of a course

    Returns:
        dict: mapping of statistic to calculated count
    """
    try:
        course = Course.find_one({"_id": ObjectId(course_id)}).run()

        if course is None:
            raise ValueError("Subcourse does not exist in the database")

        client_query = [
            {"$match": {"_id": ObjectId(course_id)}},
            {"$unwind": "$clients"},
            {"$project": {"clients": 1, "_id": 0}},
            {
                "$lookup": {
                    "from": "clients",
                    "localField": "clients",
                    "foreignField": "_id",
                    "as": "col",
                }
            },
            {"$unwind": "$col"},
            {"$replaceRoot": {"newRoot": "$col"}},
            {"$match": {"is_verified": False}},
            {"$count": "unverified_clients"},
        ]

        unverified_clients = Course.aggregate(client_query).run()
        # Empty array
        if not unverified_clients:
            return {"unverified_clients": 0}
        return unverified_clients[0]
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of clients - {str(e)}") from e


def client_course(subcourse_id):
    """
    Computes the number of clients in a subcourse

    Args:
        subcourse_id (str): the identifier of a subcourse

    Returns:
        dict: mapping of statistic to calculated count
    """
    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        client_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$clients"},
            {"$count": "number_clients"},
        ]

        number_clients = Subcourse.aggregate(client_query).run()
        if not number_clients:
            return {"number_clients": 0}
        return number_clients[0]
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of clients - {str(e)}") from e


@clients_bp.route("/api/client/projects", methods=["GET"])
@jwt_required()
@role_required("client", "course admin", "staff")
def client_projects():
    """
    Gets all projects created by a client
    """
    client_id = request.args.get("clientId", type=str)
    course_id = request.args.get("courseId", type=str)

    try:
        id_validation(client_id)
        id_validation(course_id)
        projects = get_client_project(client_id, course_id)
        return jsonify(projects), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@clients_bp.route("/api/client/courses", methods=["GET"])
@jwt_required()
@role_required("client")
def client_courses():
    """
    Gets all course a client has joined
    """
    client_id = get_jwt_identity()

    try:
        courses = get_client_courses(client_id)
        return jsonify(courses), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@clients_bp.route("/api/client/details/<client_id>", methods=["GET"])
def client_profile(client_id):
    """
    Gets all details of the client
    """
    try:
        id_validation(client_id)
        courses = get_client_profile(client_id)
        return jsonify(courses)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@clients_bp.route("/api/client/update/<client_id>", methods=["PUT"])
@jwt_required()
@role_required("client", "course admin")
def client_update(client_id):
    """
    Updates client details

    Args:
        client_id (str): _description_

    Returns:
        Response
    """

    try:
        id_validation(client_id)
        data = request.data
        if data is None:
            raise ValueError("Json request object not found")

        res = update_client_profile(client_id, data)
        return jsonify(res)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@clients_bp.route("/api/admin/client/verify", methods=["PUT"])
@jwt_required()
@role_required("course admin")
def verify_client():
    """
    Verifies a client and notifies the client of outcome

    Returns:
        Response
    """
    staff_id = get_jwt_identity()

    staff = Staff.get(staff_id).run()
    if staff is None:
        return jsonify({"Error": "Staff does not exist in the database"}), 404

    data = request.json
    client_id = data.get("client_id")

    if client_id is None:
        return jsonify({"Error: Missing parameter/s"}), 400

    try:
        id_validation(client_id)
        client = Client.get(client_id).run()
        if client is None:
            raise ValueError("Client does not exist in the database")

        # Verify the client
        client.is_verified = True
        client.save()

        client_outcome_notification(client_id)

        return jsonify({"message": "Client verified successfully!"}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@clients_bp.route("/api/admin/client/reject", methods=["PUT"])
@jwt_required()
@role_required("course admin")
def reject_client():
    """
    Rejects a client and notifies the client of outcome. Removes
    from the client from the course

    Returns:
        Response
    """

    data = request.json
    client_id = data.get("client_id")

    if client_id is None:
        return jsonify({"Error: Missing parameter/s"}), 400

    try:
        id_validation(client_id)
        client = Client.find_one({"_id": ObjectId(client_id)}).run()
        if client is None:
            raise ValueError("Client does not exist in the database")

        client.is_verified = False
        client.courses = []
        client.save()

        client_outcome_notification(client_id)

        # Remove the client from all courses
        collection = Course.get_motor_collection()
        collection.update_many({}, {"$pull": {"clients": ObjectId(client_id)}})

        return jsonify({"message": "Client rejected successfully!"}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@clients_bp.route("/api/admin/allclients/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("tutor", "course admin")
def get_clients(subcourse_id):
    """
    Gets all clients in the subcourse and their projects in the subcourse

    Args:
        subcourse_id (str): the identifer of the subcourse

    Returns:
        Response
    """
    try:
        id_validation(subcourse_id)
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")
        parent_course = subcourse.parent_course
        clients = Course.aggregate(
            [
                {"$match": {"_id": ObjectId(parent_course)}},
                {
                    "$lookup": {
                        "from": "clients",
                        "localField": "clients",
                        "foreignField": "_id",
                        "pipeline": [
                            {
                                "$project": {
                                    "_id": 1,
                                    "role": 1,
                                    "name": 1,
                                    "company_name": 1,
                                    "is_verified": 1,
                                    "email": 1,
                                    "projects": 1,
                                }
                            }
                        ],
                        "as": "clients",
                    }
                },
                {"$unwind": "$clients"},
                {
                    "$lookup": {
                        "from": "projects",
                        "localField": "clients.projects",
                        "foreignField": "_id",
                        "pipeline": [
                            {"$match": {"subcourse": ObjectId(subcourse_id)}},
                            {"$project": {"_id": 1, "name": 1}},
                        ],
                        "as": "clients.projects",
                    }
                },
                {"$replaceRoot": {"newRoot": "$clients"}},
            ],
            projection_model=SubcourseClientView,
        ).run()

        return jsonify(SubcourseClientViewList.dump_python(clients)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
