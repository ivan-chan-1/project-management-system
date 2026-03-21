"""
API routes and helper functions for project related functionality.
"""

from pydantic import ValidationError
from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.response import Response
from ..models.project import Project
from ..models.subcourse import Subcourse
from ..models.client import Client
from ..models.course import Course
from ..models.request_data import (
    ProjectAdminView,
    ProjectAdminViewList,
    ProjectGroupView,
    ProjectGroupViewList,
    UpdateProjct,
    RequestProject,
    ProjectView,
    ProjectViewList,
)

from .helper import (
    generate_random_color,
    alt_projects_exist,
    role_required,
    id_validation,
)
from .embedding import get_embedding
from .notifications import client_project_outcome_notification

projects_bp = Blueprint("projects", __name__)


def get_project_summary(project_id):
    """Project summary for a given project

    Args:
        project_id (str)

    Returns:
        Str: Project summary
    """
    try:
        project = Project.find_one({"_id": ObjectId(project_id)}).run()

        # If project is null
        if project is None:
            raise ValueError("Project cannot be found in database")

        return project.background

    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving project - {str(e)}") from e


def get_project_profile(project_id):
    """Get project profile

    Args:
        project_id (str)

    Returns:
        Object: Project
    """
    try:
        project = Project.find_one({"_id": ObjectId(project_id)}).run()

        if project is None:
            raise ValueError("Project cannot be found in the database")
        return project.model_dump()
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving project - {str(e)}") from e


def add_project(client_id, data):
    """Add project

    Args:
        client_id (str)
        data (JSON): Fields to create a project

    Raises:
        ValueError: Invalid client ID
        RuntimeError: Error adding project
    """

    try:
        # Validate JSON data, if valid creates project and inserts
        data = RequestProject.model_validate_json(data)
        embedded_background = get_embedding(data.background)
        project = Project(
            name=data.name,
            clients=[ObjectId(client_id)],
            groups=[ObjectId(x) for x in data.groups],
            is_allocated=data.is_allocated,
            status=data.status,
            capacity=data.capacity,
            category=data.category,
            course=ObjectId(data.course),
            terms=data.terms,
            areas=data.areas,
            background=data.background,
            scope=data.scope,
            req_skills=data.req_skills,
            outcomes=data.outcomes,
            date_created=data.date_created,
            date_modified=data.date_modified,
            attachments=data.attachments,
            responses=data.responses,
            proj_no=data.proj_no,
            embedded_background=embedded_background,
            subcourse=None,
            color=generate_random_color(),
        )

        project.insert()

        # Find client to add to their list of projects
        client = Client.find_one({"_id": ObjectId(client_id)}).run()

        client.update({"$push": {"projects": ObjectId(project.id)}})

        course = Course.get(project.course).run()
        curr_len = len(course.projects)
        course.projects.append(project.id)
        course.save()

        project.proj_no = curr_len + 1
        project.save()
    except RuntimeError as e:
        raise RuntimeError(f"Error adding project - {str(e)}") from e


# Update project
def update_project(project_id, data):
    """Update a project

    Args:
        project_id (str)
        data (json): JSON object of details to update

    Raises:
        ValueError: Project does not exist in the database
        RuntimeError: Error updating project

    Returns:
        Object: Project
    """
    try:
        # Validate JSON data, if valid creates project and inserts
        new_proj = UpdateProjct.model_validate_json(data)

        # Find project in DB
        old_proj = Project.find_one({"_id": ObjectId(project_id)}).run()

        if old_proj is None:
            raise ValueError("Project does not exist within the database")

        if old_proj.background != new_proj.background:
            new_embedded_vector = get_embedding(new_proj.background)
            old_proj.embedded_background = new_embedded_vector

        old_proj.name = new_proj.name
        old_proj.clients = [ObjectId(x) for x in new_proj.clients]
        old_proj.groups = [ObjectId(x) for x in new_proj.groups]
        old_proj.clients = [ObjectId(x) for x in new_proj.clients]
        old_proj.groups = [ObjectId(x) for x in new_proj.groups]
        old_proj.is_allocated = new_proj.is_allocated
        old_proj.status = new_proj.status
        old_proj.capacity = new_proj.capacity
        old_proj.course = ObjectId(new_proj.course)
        old_proj.terms = new_proj.terms
        old_proj.areas = new_proj.areas
        old_proj.category = new_proj.category
        old_proj.background = new_proj.background
        old_proj.scope = new_proj.scope
        old_proj.req_skills = new_proj.req_skills
        old_proj.outcomes = new_proj.outcomes
        old_proj.date_created = new_proj.date_created
        old_proj.date_modified = new_proj.date_modified
        old_proj.attachments = new_proj.attachments
        old_proj.responses = [
            Response(question=ObjectId(r.question), answer=r.answer)
            for r in new_proj.responses
        ]

        old_proj.save()
        return old_proj.model_dump()
    except RuntimeError as e:
        raise RuntimeError(f"Error updating the project - {str(e)}") from e


# Route to filter those that are submitted (unapproved)
# Will return empty array is there are no unapproved projects
def unapproved_projects(course_id):
    """Get list of unapproved projects

    Args:
        course_id (str)

    Returns:
        List: Projects
    """
    try:
        query = [
            {"$match": {"_id": ObjectId(course_id)}},
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
            {"$match": {"status": "submitted"}},
            {
                "$lookup": {
                    "from": "clients",
                    "localField": "clients",
                    "foreignField": "_id",
                    "as": "clients",
                }
            },
        ]
        results = Course.aggregate(query, projection_model=ProjectAdminView).run()
        return ProjectAdminViewList.dump_json(results)
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving unapproved projects - {str(e)}") from e


def project_approve(project_id, subcourse_id):
    """Approve a project.

    Args:
        project_id (str): The ID of the project.
        subcourse_id (str): The ID of the subcourse.

    Returns:
        dict: The approved Project object as a dictionary.
    """
    try:
        project = Project.find_one({"_id": ObjectId(project_id)}).run()
        if project is None:
            raise ValueError("Project not found")

        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
        if subcourse is None:
            raise ValueError("Subcourse not found")

        if project.status != "submitted":
            project.save()
            return project.model_dump()

        if subcourse.term not in project.terms:
            project.status = "unavailable"
            project.save()
            return project.model_dump()

        # Project is submitted and subcourse term is valid
        project.status = "available"
        if ObjectId(project_id) not in subcourse.projects:
            subcourse.projects.append(ObjectId(project_id))

        for person in project.clients:
            client = Client.find_one({"_id": person}).run()
            if not alt_projects_exist(client.projects, subcourse.projects, project_id):
                if person not in subcourse.clients:
                    subcourse.clients.append(person)

        project.subcourse = ObjectId(subcourse_id)

        project.save()
        subcourse.save()

        client_project_outcome_notification(project.clients, project.id)
        return project.model_dump()

    except RuntimeError as e:
        raise RuntimeError(f"Error approving project: {str(e)}") from e


# Remove projects within a subcourse
def project_unapprove(project_id, subcourse_id):
    """Unapprove a project from a subcourse

    Args:
        project_id (str)
        subcourse_id (str)

    Returns:
        Object: Project
    """
    try:
        project = Project.find_one({"_id": ObjectId(project_id)}).run()

        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if project is None:
            raise ValueError("Project cannot be found in database")
        if subcourse is None:
            raise ValueError("Subcourse cannot be found in database")

        # Remove project id from subcourse
        if ObjectId(project_id) in subcourse.projects:
            subcourse.projects.remove(ObjectId(project_id))
        else:
            raise ValueError("Project did not exist in subcourse")

        clients = project.clients
        for client in clients:
            alt_project = False
            temp_client = Client.find_one({"_id": client}).run()

            for temp_project in temp_client.projects:
                if temp_project in subcourse.projects and temp_project != ObjectId(
                    project_id
                ):
                    alt_project = True
            if alt_project is False:
                subcourse.clients.remove(client)
        subcourse.save()

        project.status = "unavailable"
        project.subcourse = None
        project.save()

        client_project_outcome_notification(project.clients, project.id)

        return project.model_dump_json()
    except RuntimeError as e:
        raise RuntimeError(f"Error making project unavailable - {str(e)}") from e


def reject_proj(project_id):
    """Reject a project

    Args:
        project_id (str)

    Raises:
        ValueError: Project does not exist in the database
        RuntimeError: Error making rejected projects

    Returns:
        Object: Project
    """
    project = Project.find_one({"_id": ObjectId(project_id)}).run()

    if project is None:
        raise ValueError("Project does not exist in database")

    try:
        project.status = "draft"
        project.save()

        # Notify clients
        client_project_outcome_notification(project.clients, project_id)
        return project.model_dump_json()
    except RuntimeError as e:
        raise RuntimeError(f"Error making rejecting projects - {str(e)}") from e


@projects_bp.route("/api/project/reject/<project_id>", methods=["PUT"])
@jwt_required()
# @role_required("course admin")
def project_reject(project_id):
    """Reject a project from course that client applied for

    Args:
        project_id (str)

    Returns:
        Object: Project
    """

    try:
        id_validation(project_id)
        return reject_proj(project_id)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


def project_search(data, subcourse_id):
    """Project Search based off query

    Args:
        data (str)
        subcourse_id (str)

    Raises:
        ValueError: Subcourse cannot be found

    Returns:
        List: Projects
    """
    try:
        embedded_query = get_embedding(data)

        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse not found")

        subcourse_projects = subcourse.projects

        # Empty list of projects
        if not subcourse_projects:
            return ProjectViewList.dump_json([])

        pipeline = [
            {
                "$vectorSearch": {
                    "index": "project_vector_search",
                    "path": "embedded_background",
                    "queryVector": embedded_query,
                    "numCandidates": 200,
                    "limit": 30,
                    "filter": {"subcourse": {"$eq": ObjectId(subcourse_id)}},
                }
            }
        ]

        result = Project.aggregate(pipeline, projection_model=ProjectView).run()
        return ProjectViewList.dump_python(result)
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@projects_bp.route("/api/unapproved/projects/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("course admin")
def get_unapproved_projects(subcourse_id):
    """Get unapproved projects

    Args:
        subcourse_id (str)

    Returns:
        List: Projects
    """
    try:
        id_validation(subcourse_id)

        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if not subcourse:
            return jsonify({"Error": "Subcourse does not exist"}), 400

        course_id = subcourse.parent_course
        return unapproved_projects(course_id)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@projects_bp.route(
    "/api/project/unapprove/<project_id>/<subcourse_id>", methods=["DELETE"]
)
@jwt_required()
@role_required("course admin")
def unapprove_projects(project_id, subcourse_id):
    """Unapprove a project

    Args:
        project_id (str)
        subcourse_id (str)

    Returns:
        Object: Project
    """

    try:
        id_validation(project_id)
        id_validation(subcourse_id)
        return project_unapprove(project_id, subcourse_id)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@projects_bp.route("/api/project/summary/<project_id>", methods=["GET"])
def project_summary(project_id):
    """Get project summary

    Args:
        project_id (str)

    Returns:
        String: The description of a project
    """
    try:
        id_validation(project_id)
        project = get_project_summary(project_id)
        return jsonify(project), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@projects_bp.route("/api/project/profile/<project_id>", methods=["GET"])
def project_profile(project_id):
    """Profile of a project

    Args:
        project_id (str)

    Returns:
        Obj: Project
    """

    try:
        id_validation(project_id)
        project = get_project_profile(project_id)
        return jsonify(project), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@projects_bp.route("/api/project/create", methods=["POST"])
@jwt_required()
@role_required("client")
def project_create():
    """Create a project

    Raises:
        ValueError: JSON request object not found

    Returns:
        message
    """
    client_id = get_jwt_identity()
    try:
        id_validation(client_id)

        data = request.get_json()
        if not data:
            raise ValidationError("Request object not found")

        add_project(client_id, data)
        return jsonify({"message": "Project added successfully!"}), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@projects_bp.route("/api/project/update/<project_id>", methods=["PUT"])
@jwt_required()
@role_required("client", "course admin")
def project_update(project_id):
    """Update a project

    Args:
        project_id (str)
    Raises:
        ValueError: Invalid project ID or JSON request object not found

    Returns:
        Obj: Project
    """

    try:
        id_validation(project_id)
        project_data = request.data
        if project_data is None:
            raise ValueError("Json request object not found")
        obj = update_project(project_id, project_data)
        return jsonify(obj)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@projects_bp.route("/api/projects/list", methods=["POST"])
def projects_list():
    """Provide a list of projects given a list of project_id

    Returns:
        List: Project ID
    """
    try:
        data = request.json
        ids = data.get("projects")
        projects = Project.aggregate(
            [{"$match": {"_id": {"$in": [ObjectId(i) for i in ids]}}}]
        ).run()
        return jsonify(projects), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@projects_bp.route("/api/projects/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("student", "course admin", "tutor")
def get_subcourse_projects(subcourse_id):
    """Get al projects in a subcourse

    Args:
        subcourse_id (str)

    Returns:
        List: Project
    """
    try:
        id_validation(subcourse_id)

        query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
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
            {
                "$lookup": {
                    "from": "groups",
                    "localField": "groups",
                    "foreignField": "_id",
                    "as": "groups",
                }
            },
            {
                "$lookup": {
                    "from": "clients",
                    "localField": "clients",
                    "foreignField": "_id",
                    "as": "clients",
                }
            },
        ]

        projects = Subcourse.aggregate(query, projection_model=ProjectGroupView).run()
        return ProjectGroupViewList.dump_json(projects)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@projects_bp.route("/api/project/search", methods=["GET"])
def search_projects():
    """Search through all projects based off query

    Raises:
        ValueError: Query is not of type string

    Returns:
        List: Projects
    """
    try:
        subcourse_id = request.args.get("subcourse_id", type=str)
        id_validation(subcourse_id)

        query = request.args.get("query", type=str)
        if not isinstance(query, str):
            raise ValueError("Query must be of type string")

        return jsonify(project_search(query, subcourse_id)), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


@projects_bp.route("/api/project/approve/<project_id>/<subcourse_id>", methods=["PUT"])
@jwt_required()
@role_required("course admin")
def approve_project(project_id, subcourse_id):
    """Approve a project

    Args:
        project_id (str)
        subcourse_id (str)

    Returns:
        Obj: Project
    """
    try:
        return project_approve(project_id, subcourse_id), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


def available_projects(subcourse_id):
    """
    Retrieve the number of available projects for a given subcourse

    Args:
        subcourse_id (str): The ID of the subcourse

    Returns:
        dict: A dictionary containing the count of available projects
    """

    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        available_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
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
            {"$match": {"status": "available"}},
            {"$count": "available_projects"},
        ]

        number_available = Subcourse.aggregate(available_query).run()
        # Empty array
        if not number_available:
            return {"available_projects": 0}
        return number_available[0]

    except RuntimeError as e:
        raise RuntimeError(
            f"Error retrieving number of available projects - {str(e)}"
        ) from e


def unavailable_projects(subcourse_id):
    """
    Retrieve the number of unavailable projects for a given subcourse

    Args:
        subcourse_id (str): The ID of the subcourse

    Returns:
        dict: A dictionary containing the count of unavailable projects
    """
    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        unavailable_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
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
            {"$match": {"status": "unavailable"}},
            {"$count": "unavailable_projects"},
        ]

        number_unavailable = Subcourse.aggregate(unavailable_query).run()
        # Empty array
        if not number_unavailable:
            return {"unavailable_projects": 0}
        return number_unavailable[0]

    except RuntimeError as e:
        raise RuntimeError(
            f"Error retrieving number of unavailable projects - {str(e)}"
        ) from e


def submitted_projects(course_id):
    """
    Retrieve the number of submitted (pending approval) projects for a given course

    Args:
        course_id (str): The ID of the course

    Returns:
        dict: A dictionary containing the count of submitted projects
    """
    try:
        # Check this subcourse exists
        course = Course.find_one({"_id": ObjectId(course_id)}).run()

        if course is None:
            raise ValueError("Subcourse does not exist in the database")

        submitted_query = [
            {"$match": {"_id": ObjectId(course_id)}},
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
            {"$match": {"status": "submitted"}},
            {"$count": "submitted_projects"},
        ]

        number_submitted = Course.aggregate(submitted_query).run()

        # Empty array
        if not number_submitted:
            return {"submitted_projects": 0}
        return number_submitted[0]

    except RuntimeError as e:
        raise RuntimeError(
            f"Error retrieving number of submitted projects - {str(e)}"
        ) from e


@projects_bp.route("/api/client/delete/project/<project_id>", methods=["DELETE"])
@jwt_required()
@role_required("client")
def delete_project(project_id):
    """
    Delete a project for a given client

    Only projects with status "submitted" or "draft" can be deleted.
    Approved projects ("available" or "unavailable") cannot be deleted.

    Args:
        project_id (str): The ID of the project to delete.

    Returns:
        Response
    """

    client_id = get_jwt_identity()

    try:
        id_validation(project_id)
        id_validation(client_id)
        response = project_delete(project_id, client_id)
        return response.model_dump_json(), 200
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500


def project_delete(project_id, client_id):
    """
    Deleting a project

    Args:
        project_id (str): The ID of the project to be deleted
        client_id (str): The ID of the client requesting the deletion

    Returns:
        Client: The updated client object after project deletion
    """
    try:
        client = Client.find_one({"_id": ObjectId(client_id)}).run()

        project = Project.find_one({"_id": ObjectId(project_id)}).run()

        if client is None:
            raise ValueError("Client does not exist in the database")
        if project is None:
            raise ValueError("Project does not exist in the database")

        if project.status in ["available", "unavailable"]:
            raise ValueError("Cannot delete an approved project")

        courses = Course.find_all()
        # Removing submitted project from any course
        if project.status == "submitted":
            for course in courses:
                if ObjectId(project_id) in course.projects:
                    course.projects.remove(ObjectId(project_id))
                    course.save()
                    # If client does not have any other project, remove them from the course
                    if not alt_projects_exist(
                        client.projects, course.projects, project_id
                    ):
                        course.clients.remove(ObjectId(client_id))
                        course.save()
        if project.status in ["submitted", "draft"]:
            client.projects.remove(ObjectId(project_id))
            client.save()
            Project.find_one({"_id": ObjectId(project_id)}).delete().run()
        return client
    except RuntimeError as e:
        raise RuntimeError(f"Error deleting project - {str(e)}") from e
