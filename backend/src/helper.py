"""
General Helper Functions
"""

import random
from functools import wraps

from bson import ObjectId
from flask_jwt_extended import get_jwt
from flask import jsonify
from ..models.student import Student
from ..models.staff import Staff
from ..models.client import Client
from ..models.subcourse import Subcourse


def get_subcourse_index(subcourses, subcourse_id):
    """
    Get the index of a subcourse in student's subcourses list

    :params list[Subcourse] subcourses: the list of subcourses
    :params str subcourse_id: the id of the desired subcourse
    :return: -1 if not found, else index
    """
    return next(
        (i for i, s in enumerate(subcourses) if s.subcourse == subcourse_id), -1
    )

def unique_link(new_link, links, subcourse_id):
    """
    Checks whether the new link being added for a staff exists already in their list of links.

    Args:
        new_link (WebLink): the new link to add
        links (list[WebLinks]): the exising links of a group
        subcourse_id(str): the identifer of the subcourse

    Returns:
        bool: indicates whether the link already exists
    """
    for item in links:
        print(item)
        if item.subcourse == ObjectId(subcourse_id):
            if item.name == new_link.name:
                return False
            if item.url == new_link.url:
                return False
    return True


def unique_group_link(new_link, links):
    """
    Checks whether the new link being added for a group exists already in their list of links.

    Args:
        new_link (WebLink): the new link to add
        links (list[WebLinks]): the exising links of a group

    Returns:
        bool: indicates whether the link already exists
    """
    temp = True
    for item in links:
        if item.name == new_link.name:
            temp = False
        if item.url == new_link.url:
            temp = False
    return temp


def generate_random_color():
    """
    Generates a random hex code

    Returns:
        str: a hext code
    """
    return f"#{random.randint(0, 0xFFFFFF):06x}"


def alt_projects_exist(client_projects, course_projects, project_id):
    """
    Checks if the client has any other projects within the course

    Args:
        client_projects (list[PydanticObjectId]): list of client's projects as ids
        course_projects (list[PydanticObjectId]): list of course's projects as ids
        project_id (PydanticObjectId): the identifier of the current project

    Returns:
        bool: indicates whether the client has any other projects within the course
    """
    for project in client_projects:
        if project != ObjectId(project_id):
            if project in course_projects:
                return True
    return False


def role_required(*roles):
    """
    Checks if the user calling the route has the required credentials
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"Error": "Invalid user credentials"}), 401
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def id_validation(oid):
    """
    Validates if id is a valid ObjectId

    Args:
        oid (str): a hex string
    """
    if oid is None:
        raise ValueError("Missing parameter/s")

    if not ObjectId.is_valid(oid):
        raise ValueError("Invalid ID format")


def get_user_by_id(user_id):
    """
    Fetch a user (student, staff, or client) by their ID.
    """
    user = Student.find_one({"_id": ObjectId(user_id)}).run()
    if user:
        return user

    user = Staff.find_one({"_id": ObjectId(user_id)}).run()
    if user:
        return user

    user = Client.find_one({"_id": ObjectId(user_id)}).run()
    if user:
        return user

    raise ValueError("User not found")


def get_subcourse_by_id(subcourse_id):
    """
    Fetch a subcourse by its ID.
    """
    subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()
    if not subcourse:
        raise ValueError("Subcourse not found")
    return subcourse
