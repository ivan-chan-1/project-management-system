"""
API routes and helper functions for group related functionality
"""

from collections import Counter
from bson import ObjectId
from pydantic import ValidationError
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask import Blueprint, jsonify, request

from ..models.group import Group
from ..models.subcourse import Subcourse
from ..models.student import Student
from ..models.request_data import (
    PreferenceView,
    PreferenceData,
    PreferenceViewList,
    WishlistProjects,
    WishlistProjectsList,
    StudentDetailsView,
    StudentDetailsList,
    IndividualPreferenceView,
    GroupStudentView,
    GroupStudentViewList,
    WebLink,
    webLinksList,
)

from .helper import role_required, unique_group_link, id_validation, get_subcourse_index

groups_bp = Blueprint("groups", __name__)


def get_group_details(group_id):
    """Getting details of a groups

    Args:
        groupId (str): Group Id

    Raises:
        ValueError: Group cannot be found in database
        RuntimeError: Error retrieving the group

    Returns:
        Object: Group
    """
    try:
        group = Group.find_one({"_id": ObjectId(group_id)}).run()

        # If project is null
        if group is None:
            raise ValueError("Group cannot be found in database")

        return group.model_dump()
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving group - {str(e)}") from e


def get_all_groups(subcourse_id):
    """Given a subcourse, find all the groups within it

    Args:
        subcourseId (str): Subcourse Id

    Raises:
        ValueError: Subcourse does not exist in the database
        RuntimeError: Error retrieving groups for the subcourse

    Returns:
        List: Students
    """
    try:
        # Check if subcourse exists in the db
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the databas")

        group_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$groups"},
            {"$project": {"groups": 1, "_id": 0}},
            {
                "$lookup": {
                    "from": "groups",
                    "localField": "groups",
                    "foreignField": "_id",
                    "as": "col",
                }
            },
            {"$unwind": "$col"},
            {"$replaceRoot": {"newRoot": "$col"}},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "members",
                    "foreignField": "_id",
                    "as": "members",
                }
            },
        ]

        return_groups = Subcourse.aggregate(
            group_query, projection_model=GroupStudentView
        ).run()
        return GroupStudentViewList.dump_json(return_groups)
    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving groups for courses - {str(e)}") from e


def add_link(group_id, data):
    """Add a link

    Args:
        group_id (str): group id
        data (obj): Containing info about the link - {"name": ...., "url": ...}

    Returns:
        List: Links
    """
    try:
        group = Group.find_one({"_id": ObjectId(group_id)}).run()

        if group is None:
            raise ValueError("Group does not exist in the database")

        if not unique_group_link(data, group.links):
            raise ValueError("Name and/or URL exists in the database")

        group.links.append(data)
        group.save()
        return webLinksList.dump_json(group.links)
    except RuntimeError as e:
        raise RuntimeError(f"Error adding group links - {str(e)}") from e


@groups_bp.route("/api/subcourse/groups/<subcourse_id>", methods=["GET"])
def subcourse_group(subcourse_id):
    """Route to get all groups w/i a subcourse

    Args:
        subcourse_id (str): subcourse Id

    Returns:
        List: groups
    """
    if subcourse_id is None:
        return jsonify({"Error: Missing parameter"}), 400

    try:
        id_validation(subcourse_id)
        groups = get_all_groups(subcourse_id)
        return groups
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/details/<group_id>", methods=["GET"])
def group_details(group_id):
    """Gets group details

    Args:
        group_id (str): Group Id

    Returns:
        Obj: Group
    """
    try:
        group = get_group_details(group_id)
        return jsonify(group), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/join", methods=["PUT"])
@jwt_required()
@role_required("student")
def group_join():
    """
    Adds a student to a group.
    """
    data = request.json
    group_id = data.get("group_id")
    subcourse_id = data.get("subcourse_id")

    try:
        user_id = get_jwt_identity()
        # Not a BSON id type
        id_validation(group_id)
        id_validation(subcourse_id)

        student = Student.get(user_id).run()
        if student is None:
            return jsonify({"Error": "This student does not exist"}), 400

        index = get_subcourse_index(student.subcourses, ObjectId(subcourse_id))

        if student.subcourses[index].group is not None:
            return jsonify({"Error": "You are already in a group"}), 400

        group = Group.get(group_id).run()

        if group is None:
            return jsonify({"Error": "This group does not exist"}), 400

        if group.tutorial != student.subcourses[index].tutorial:
            return jsonify(
                {"Error": "Student does not belong in the correct tutorial"}
            ), 400

        student.subcourses[index].group = ObjectId(group_id)
        student.save()
        group.update({"$push": {"members": ObjectId(user_id)}})

        return jsonify({"message": "Student added to group successfully"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/leave", methods=["PUT"])
@jwt_required()
@role_required("student")
def leave_group():
    """Allow students to leave groups

    Returns:
        Message
    """
    data = request.json
    group_id = data.get("group_id")
    subcourse_id = data.get("subcourse_id")
    user_id = get_jwt_identity()

    try:
        id_validation(group_id)
        id_validation(subcourse_id)

        # Removing group id from student -> subcourse
        student = Student.get(ObjectId(user_id)).run()
        if student is None:
            return jsonify({"Error": "This student does not exist"}), 400
        index = get_subcourse_index(student.subcourses, ObjectId(subcourse_id))
        student.subcourses[index].group = None

        student.save()

        # Removing student id in the group -> members
        group = Group.get(group_id).run()
        if group is None:
            return jsonify({"Error": "This group does not exist"}), 400

        if group.lead == ObjectId(user_id):
            group.lead = None

        group.save()
        group.update({"$pull": {"members": ObjectId(user_id)}})

        return jsonify({"message": "Student removed from group successfully"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 400


@groups_bp.route("/api/group/preference/submit/<group_id>", methods=["POST"])
@jwt_required()
@role_required("student")
def group_preference_submit(group_id):
    """
    Adds the group's project preferences to the database after submitting
    """

    try:
        id_validation(group_id)
        if request.json.get("proj_preferences") is None:
            return jsonify({"Error": "No field proj_preferences"}), 400

        preferences = [
            PreferenceData.model_validate(x)
            for x in request.json.get("proj_preferences")
        ]

        group = Group.get(group_id).run()
        if not group:
            return jsonify({"Error": "Group not found"}), 400

        group.proj_preferences = preferences
        group.is_draft = True
        group.save()
        return jsonify({"message": "Preference saved successfully!"}), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/preference/topic/submit/<group_id>", methods=["POST"])
@jwt_required()
@role_required("student")
def group_topic_preference_submit(group_id):
    """
    Adds the group's topic preferences to the database after submitting
    """

    try:
        id_validation(group_id)
        if request.json.get("topic_preferences") is None:
            return jsonify({"Error": "No field topic_preferences"}), 400

        group = Group.get(group_id).run()
        if not group:
            return jsonify({"Error": "Group not found"}), 400

        group.topic_preferences = request.json.get("topic_preferences")
        group.is_draft = request.json.get("is_draft")
        group.save()

        return jsonify({"message": "Topic preference saved successfully!"}), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/preference/topic/<group_id>", methods=["GET"])
def group_topic_preference_view(group_id):
    """
    Given group_id, get their topic preferences
    """

    try:
        id_validation(group_id)
        group = Group.get(group_id).run()
        return jsonify(group.topic_preferences), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/preference/<group_id>", methods=["GET"])
@jwt_required()
@role_required("student", "tutor", "course admin")
def group_preference_view(group_id):
    """
    Given group_id, get their preferences
    """

    try:
        id_validation(group_id)
        query = [
            {"$match": {"_id": ObjectId(group_id)}},
            {"$unwind": "$proj_preferences"},
            {"$replaceRoot": {"newRoot": "$proj_preferences"}},
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
        preferences = Group.aggregate(query, projection_model=PreferenceView).run()
        return PreferenceViewList.dump_json(preferences), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/wishlist/<group_id>/<subcourse_id>", methods=["GET"])
@jwt_required()
@role_required("student")
def group_wishlist(group_id, subcourse_id):
    """
    Given a group_id, get the wishlists of all members
    """

    try:
        id_validation(group_id)
        query = [
            {"$match": {"_id": ObjectId(group_id)}},
            {"$unwind": "$members"},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "members",
                    "foreignField": "_id",
                    "as": "members",
                }
            },
            {"$unwind": "$members"},
            {"$replaceRoot": {"newRoot": "$members"}},
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
        ]

        wishlist = Group.aggregate(query, projection_model=WishlistProjects).run()
        if not wishlist:
            return jsonify({"Error": "Group not found"}), 400

        return WishlistProjectsList.dump_json(wishlist), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/members/<group_id>", methods=["GET"])
def group_members(group_id):
    """Get all members of a group

    Args:
        group_id (string): the id of the group
    """

    try:
        id_validation(group_id)
        query = [
            {"$match": {"_id": ObjectId(group_id)}},
            {"$unwind": "$members"},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "members",
                    "foreignField": "_id",
                    "as": "members",
                }
            },
            {"$unwind": "$members"},
            {"$replaceRoot": {"newRoot": "$members"}},
        ]

        members = Group.aggregate(query, projection_model=StudentDetailsView).run()
        return StudentDetailsList.dump_json(members), 200
    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/links/<group_id>", methods=["POST"])
@jwt_required()
@role_required("student")
def post_link(group_id):
    """Add links for a particular group

    Args:
        group_id (str): group id

    Returns:
        List: Links
    """
    if group_id is None:
        return jsonify({"Error: Missing parameter/s"}), 400

    try:
        id_validation(group_id)
        data = WebLink.model_validate_json(request.data)

        return add_link(group_id, data)
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route(
    "/api/group/preference/auto/<subcourse_id>/<group_id>", methods=["GET"]
)
@jwt_required()
@role_required("student")
def group_auto_preference(subcourse_id, group_id):
    """Allow students to preference projects based off individual preferences

    Args:
        subcourse_id (str): subcourse id
        group_id (str): group id

    Returns:
        List: sorted preferences
    """

    try:
        id_validation(subcourse_id)
        id_validation(group_id)
        query = [
            {"$match": {"_id": ObjectId(group_id)}},
            {
                "$lookup": {
                    "from": "students",
                    "localField": "members",
                    "foreignField": "_id",
                    "as": "members",
                }
            },
            {"$unwind": "$members"},
            {"$replaceRoot": {"newRoot": "$members"}},
            {"$unwind": "$subcourses"},
            {"$match": {"subcourses.subcourse": ObjectId(subcourse_id)}},
            {"$addFields": {"preferences": "$subcourses.preferences"}},
            {"$project": {"preferences": 1}},
            {"$addFields": {"preferences.id": "$_id"}},
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
            {
                "$group": {
                    "_id": "$id",
                    "preferences": {
                        "$push": {
                            "project": "$project",
                            "rank": "$rank",
                            "notes": "$notes",
                        }
                    },
                }
            },
        ]

        member_preferences = Group.aggregate(
            query, projection_model=IndividualPreferenceView
        ).run()

        # gets all the preferences of every member in the group - and calculates rank
        distinct_preferences = Counter()
        project_details = {}
        for m in member_preferences:
            for pref in m.preferences:
                project_id = str(pref.project.id)
                distinct_preferences[project_id] += 8 - pref.rank

                if project_id not in project_details:
                    project_details[project_id] = {
                        "project": pref.project.model_dump(),
                        "rank": "",
                    }

        # sorts the preferences by rank
        sorted_projects = sorted(
            distinct_preferences.items(), key=lambda x: x[1], reverse=True
        )

        sorted_project_list = [
            project_details[proj_id]
            for proj_id, _ in sorted_projects
            if proj_id in project_details
        ]
        sorted_project_list = sorted_project_list[:7]

        for i, project in enumerate(sorted_project_list):
            project["rank"] = i + 1

        return jsonify(sorted_project_list), 200

    except ValidationError as e:
        return jsonify({"Error": e.errors()}), 400


@groups_bp.route("/api/group/<group_id>/lead", methods=["POST"])
@jwt_required()
@role_required("student")
def group_lead(group_id):
    """
    Promotes a group member to group leader

    Args:
        group_id (str): identifier of the group
    """

    try:
        id_validation(group_id)

        lead = request.json.get("lead")

        if lead == "":
            return jsonify({"Error": "No group lead was selected"}), 400
        if not lead:
            return jsonify({"Error": "No field lead"}), 400

        group = Group.get(group_id).run()
        group.lead = ObjectId(lead)
        group.save()
        return jsonify({}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/<group_id>/lead", methods=["GET"])
@jwt_required()
def group_is_lead(group_id):
    """
    Checks if user is the group leader

    Args:
        group_id (str): identifier of the group
    """
    user_id = get_jwt_identity()

    try:
        id_validation(group_id)

        group = Group.get(group_id).run()
        return jsonify({"lead": group.lead == ObjectId(user_id)}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/<group_id>/lead/who", methods=["GET"])
@jwt_required()
def group_who_lead(group_id):
    """
    Checks if user is the group leader

    Args:
        group_id (str): identifier of the group
    """

    try:
        id_validation(group_id)

        group = Group.get(group_id).run()
        student = Student.find_one({"_id": group.lead}).run()

        if student is None:
            return jsonify({"lead": None}), 200

        return jsonify({"lead": str(student.id)}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


@groups_bp.route("/api/group/<group_id>/bio", methods=["POST"])
def group_bio(group_id):
    """
    Updates the group's bio and goal

    Args:
        group_id (str): identifier of the group
    """

    try:
        id_validation(group_id)

        bio = request.json.get("bio")
        goal = request.json.get("goal")
        if not bio or not goal:
            return jsonify({"Error": "Missing field"}), 400

        group = Group.get(group_id).run()
        group.bio = bio
        group.goal = goal
        group.save()
        return jsonify({}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


def groups_course(subcourse_id):
    """
    Retrieve the total number of groups in a given subcourse

    Args:
        subcourse_id (str): The ID of the subcourse

    Returns:
        dict: A dictionary containing the statistic
    """
    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        groups_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$groups"},
            {"$count": "number_groups"},
        ]

        number_groups = Subcourse.aggregate(groups_query).run()

        if not number_groups:
            return {"number_groups": 0}
        return number_groups[0]

    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of groups - {str(e)}") from e


def groups_allocated(subcourse_id):
    """
    Retrieve the total number of allocated groups in a given subcourse

    Args:
        subcourse_id (str): The ID of the subcourse

    Returns:
        dict: A dictionary containing the statistic
    """
    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        groups_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$groups"},
            {"$project": {"groups": 1, "_id": 0}},
            {
                "$lookup": {
                    "from": "groups",
                    "localField": "groups",
                    "foreignField": "_id",
                    "as": "col",
                }
            },
            {"$unwind": "$col"},
            {"$replaceRoot": {"newRoot": "$col"}},
            {"$match": {"project": {"$ne": None}}},
            {"$count": "allocated_groups"},
        ]

        allocated_groups = Subcourse.aggregate(groups_query).run()

        if not allocated_groups:
            return {"allocated_groups": 0}
        return allocated_groups[0]

    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of groups - {str(e)}") from e


def groups_unallocated(subcourse_id):
    """
    Retrieve the total number of unallocated groups in a given subcourse

    Args:
        subcourse_id (str): The ID of the subcourse

    Returns:
        dict: A dictionary containing the statistic
    """
    try:
        # Check this subcourse exists
        subcourse = Subcourse.find_one({"_id": ObjectId(subcourse_id)}).run()

        if subcourse is None:
            raise ValueError("Subcourse does not exist in the database")

        groups_query = [
            {"$match": {"_id": ObjectId(subcourse_id)}},
            {"$unwind": "$groups"},
            {"$project": {"groups": 1, "_id": 0}},
            {
                "$lookup": {
                    "from": "groups",
                    "localField": "groups",
                    "foreignField": "_id",
                    "as": "col",
                }
            },
            {"$unwind": "$col"},
            {"$replaceRoot": {"newRoot": "$col"}},
            {"$match": {"project": None}},
            {"$count": "unallocated_groups"},
        ]

        unallocated_groups = Subcourse.aggregate(groups_query).run()

        if not unallocated_groups:
            return {"unallocated_groups": 0}
        return unallocated_groups[0]

    except RuntimeError as e:
        raise RuntimeError(f"Error retrieving number of groups - {str(e)}") from e
