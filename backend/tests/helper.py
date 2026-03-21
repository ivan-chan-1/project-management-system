"""
Helper Functions for Tests
"""

from datetime import timedelta
from bson import ObjectId
from flask_jwt_extended import create_access_token
from ..models.preference import Preference
from ..models.student import Student, Details
from ..models.project import Project
from ..models.group import Group
from ..models.subcourse import Subcourse
from ..models.staff import Staff, Class
from ..models.course import Course
from ..models.client import Client

from ..src.helper import generate_random_color


def generate_token(user):
    """
    Generates a JWT token for any user (student, client, staff).

    Args:
        user (Student | Client | Staff): the user object.

    Returns:
        str: A JWT token with additional claims.
    """
    user_claims = {
        "role": user.role,
        "name": user.name,
        "email": user.email,
    }

    token = create_access_token(
        identity=str(user.id),
        additional_claims=user_claims,
        expires_delta=timedelta(hours=8),
    )
    return token


def create_student(subcourse=None, project=None, preferences=None):
    """
    Creates an instance of a Student object

    Args:
        subcourse (_type_, optional): _description_. Defaults to None.
        project (_type_, optional): _description_. Defaults to None.

    Returns:
        _type_: _description_
    """
    subcourses = []

    if subcourse is not None:
        wishlist = []
        preference = []
        if project is not None:
            wishlist = [project]

        if preferences is not None:
            preference = [
                Preference(project=p["project"], notes=p["notes"], rank=p["rank"])
                for p in preferences
            ]

        details = Details(
            subcourse=subcourse,
            tutorial="H12A",
            group=None,
            draft_alloc=None,
            wishlist=wishlist,
            preferences=preference,
        )

        subcourses.append(details)

    student = Student(
        name="John Smith",
        zid="z1234567",
        email="z1234567@ad.unsw.edu.au",
        password="TempPW",
        year=1,
        role="student",
        subcourses=subcourses,
        experiences=[],
        reset_pin=None,
    )

    return student


def create_staff(subcourse=None):
    """
    Instantiates a test Staff
    """
    classes = []
    if subcourse is not None:
        classes.append(Class(subcourse=subcourse, tutorials=["H12A"]))

    return Staff(
        name="Jane Smith",
        zid="z1111111",
        email="z1111111@ad.unsw.edu.au",
        password="TempPW",
        role="course admin",
        classes=classes,
        reset_pin=None,
        links=[],
    )


def create_project(subcourse):
    """
    Instantiates a test Project
    """
    return Project(
        name="Project 1",
        clients=[],
        groups=[],
        is_allocated=False,
        status="available",
        capacity=2,
        category="AI",
        course=None,
        terms=[1, 2],
        areas=["AI"],
        background="",
        scope="",
        req_skills="",
        outcomes="",
        date_created="",
        date_modified="",
        attachments=[],
        responses=[],
        proj_no=1,
        embedded_background=[],
        subcourse=subcourse,
        color="",
    )

def create_group(member):
    """
    Instantiates a test Group
    """
    return Group(
        name="H12A-DRAGONFRUIT",
        members=[member],
        tutorial="H12A",
        bio=None,
        goal=None,
        project=None,
        draft_alloc=None,
        proj_preferences=[],
        topic_preferences=[],
        is_draft=False,
        links=[],
        responses=[],
        lead=None,
    )


def create_course():
    """
    Instantiating a course
    """
    return Course(
        name="COMP3900",
        code="COMP3900",
        description="",
        owner=ObjectId(),
        terms=[1],
        term_dates={},
        clients=[],
        projects=[],
        def_client_questionnaire=[],
        def_project_preference_form=[],
        color="",
        embedded_description=[],
    )


def create_client():
    """
    Instantiating a client
    """
    return Client(
        name="Sophie",
        email="Sophie@gmail.com",
        password="asdfghjhgfds",
        role="client",
        phone="",
        is_verified=False,
        company_name="",
        company_brief="",
        company_address="",
        company_industry="",
        company_abn="",
        contact_hours="",
        projects=[],
        courses=[],
        wishlist=[],
        preferences=[],
        reset_pin=None,
    )


def init_course_admin():
    """
    Helper function to create a course admin
    """
    staff = Staff(
        name="John Smith",
        zid="z1234567",
        email="z1234567@ad.unsw.edu.au",
        password="TempPW",
        role="course admin",
        classes=[],
        reset_pin=None,
        links=[],
    )
    staff.insert()
    return staff


def init_course(staff):
    """
    Helper function to create a course
    """
    course = Course(
        name="Computing Project",
        code="COMP1234",
        description="This is a course description",
        owner=staff.id,
        terms=[1, 2],
        term_dates={1: "2025T1", 2: "2025T2"},
        clients=[],
        projects=[],
        def_client_questionnaire=[],
        def_project_preference_form=[],
        color="#FF5733",
        embedded_description=[],
    )
    return course


def init_subcourse(staff):
    """
    Helper function to create a subcourse
    """
    subcourse = Subcourse(
        name="2025T1",
        code="COMP1234",
        owner=staff.id,
        term=1,
        year=2025,
        is_archived=False,
        parent_course=ObjectId(),
        students=[],
        staff=[staff.id],
        groups=[],
        projects=[],
        clients=[],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=False,
        max_group_size=6,
        preference_release=False,
        color="#FF5733",
    )
    return subcourse

def init_subcourse1(staff):
    """
    Helper function to create a subcourse
    """
    subcourse = Subcourse(
        name="2025T1",
        code = "COMP2314",
        owner = staff.id,
        term=1,
        year=2025,
        is_archived = False,
        parent_course = ObjectId(),
        students = [],
        staff = [staff.id],
        groups = [],
        projects = [],
        clients = [],
        channels = [],
        client_questionnaire = [],
        project_preference_form = [],
        is_published = False,
        max_group_size = 6,
        preference_release = False,
        color = "#FF5733",
    )
    return subcourse

def init_subcourse2(staff):
    """
    Helper function to create a subcourse
    """
    subcourse = Subcourse(
        name="2025T1",
        code = "COMP6245",
        owner = staff.id,
        term=1,
        year=2025,
        is_archived = False,
        parent_course = ObjectId(),
        students = [],
        staff = [staff.id],
        groups = [],
        projects = [],
        clients = [],
        channels = [],
        client_questionnaire = [],
        project_preference_form = [],
        is_published = False,
        max_group_size = 6,
        preference_release = False,
        color = "#FF5733",
    )
    return subcourse

def init_student():
    """
    Helper function to create a student
    """
    student = Student(
        name="Janice Parker",
        zid="z2345678",
        email="z2345678@ad.unsw.edu.au",
        password="TempPW",
        year=1,
        role="student",
        subcourses=[],
        experiences=[],
        reset_pin=None,
    )
    return student


def init_student1():
    """
    Helper function to create a student
    """
    student = Student(
        name="Jole Miller",
        zid="z3456789",
        email="z3456789@ad.unsw.edu.au",
        password="TempPW",
        year=1,
        role="student",
        subcourses=[],
        experiences=[],
        reset_pin=None,
    )
    return student


def init_student2():
    """
    Helper function to create a student
    """
    student = Student(
        name="Peter Parker",
        zid="z4567890",
        email="z4567890@ad.unsw.edu.au",
        password="TempPW",
        year=1,
        role="student",
        subcourses=[],
        experiences=[],
        reset_pin=None,
    )
    return student


def init_student3():
    """
    Helper function to create a student
    """
    student = Student(
        name="William Nelson",
        zid="z0000000",
        email="z0000000@ad.unsw.edu.au",
        password="TempPW",
        year=1,
        role="student",
        subcourses=[],
        experiences=[],
        reset_pin=None,
    )
    return student


def init_student4():
    """
    Helper function to create a student
    """
    student = Student(
        name="Benjamin Franklin",
        zid="z9999999",
        email="z9999999@ad.unsw.edu.au",
        password="TempPW",
        year=1,
        role="student",
        subcourses=[],
        experiences=[],
        reset_pin=None,
    )
    return student


def init_group(project_id):
    """
    Helper function to create a group
    """
    group = Group(
        name="Group 1",
        members=[],
        tutorial="H12A",
        bio=None,
        goal=None,
        project=None,
        draft_alloc=None,
        proj_preferences=[
            {
                "project": project_id,
                "notes": "We have experience in ML, AI, and software development.",
                "rank": 1,
            }
        ],
        topic_preferences=[],
        is_draft=False,
        links=[],
        responses=[],
        lead=None,
    )
    return group


def init_project(subcourse_id):
    """
    Helper function to create a project
    """
    project = Project(
        name="Project 1",
        clients=[],
        groups=[],
        is_allocated=False,
        status="available",
        capacity=5,
        category="Software Engineering",
        course=None,
        terms=[1],
        areas=["AI", "ML"],
        background="This is a project background",
        scope="This is a project scope",
        req_skills="Python, Java",
        outcomes="This is a project outcome",
        date_created="2023-01-01",
        date_modified="2023-01-01",
        attachments=[],
        responses=[],
        proj_no=1,
        embedded_background=[],
        subcourse=subcourse_id,
        color="#FF5733",
    )
    return project

def init_project1(subcourse_id):
    """
    Helper function to create a project
    """
    project = Project(
        name="Project 2",
        clients=[],
        groups=[],
        is_allocated=False,
        status="available",
        capacity=5,
        category="Computer Engineering",
        course=None,
        terms=[1],
        areas=["AI", "ML"],
        background="This is a project background",
        scope="This is a project scope",
        req_skills="Python, Java",
        outcomes="This is a project outcome",
        date_created="2023-01-01",
        date_modified="2023-01-01",
        attachments=[],
        responses=[],
        proj_no=2,
        embedded_background=[],
        subcourse=subcourse_id,
        color="#FF5733",
    )
    return project

def init_project2(subcourse_id):
    """
    Helper function to create a project
    """
    project = Project(
        name="Project 3",
        clients=[],
        groups=[],
        is_allocated=False,
        status="available",
        capacity=5,
        category="Electrical Engineering",
        course=None,
        terms=[1],
        areas=["Circuits", "Signals"],
        background="This is a project background",
        scope="This is a project scope",
        req_skills="Circuits, Signals",
        outcomes="This is a project outcome",
        date_created="2023-01-01",
        date_modified="2023-01-01",
        attachments=[],
        responses=[],
        proj_no=3,
        embedded_background=[],
        subcourse=subcourse_id,
        color="#FF5733",
    )
    return project

def init_project3(subcourse_id):
    """
    Helper function to create a project
    """
    project = Project(
        name="Project 4",
        clients=[],
        groups=[],
        is_allocated=False,
        status="available",
        capacity=5,
        category="Civil Engineering",
        course=None,
        terms=[1],
        areas=["Soil", "Materials"],
        background="This is a project background",
        scope="This is a project scope",
        req_skills="Soil, Materials",
        outcomes="This is a project outcome",
        date_created="2023-01-01",
        date_modified="2023-01-01",
        attachments=[],
        responses=[],
        proj_no=3,
        embedded_background=[],
        subcourse=subcourse_id,
        color="#FF5733",
    )
    return project

def init_project4(subcourse_id):
    """
    Helper function to create a project
    """
    project = Project(
        name="Project 5",
        clients=[],
        groups=[],
        is_allocated=False,
        status="available",
        capacity=5,
        category="Chemical Engineering",
        course=None,
        terms=[1],
        areas=["Molecules", "Electrons"],
        background="This is a project background",
        scope="This is a project scope",
        req_skills="Molecules, Electrons",
        outcomes="This is a project outcome",
        date_created="2023-01-01",
        date_modified="2023-01-01",
        attachments=[],
        responses=[],
        proj_no=3,
        embedded_background=[],
        subcourse=subcourse_id,
        color="#FF5733",
    )
    return project

def append_subcourses(students):
    """
    Helper function to append subcourses to students
    """
    for student in students:
        student.subcourses.append(
            {
                "subcourse": ObjectId(),
                "tutorial": "H12A",
                "group": None,
                "draft_alloc": None,
                "wishlist": [],
                "preferences": [],
            }
        )
        student.insert()

def create_subcourse():
    """
    Instantiates a test Subcourse
    """
    return Subcourse(
        name="COMP3900 T1",
        code="COMP3900",
        owner=ObjectId(),
        year=2025,
        term=1,
        is_archived=False,
        parent_course=ObjectId(),
        students=[],
        staff=[],
        groups=[],
        projects=[],
        clients=[ObjectId()],
        channels=[],
        client_questionnaire=[],
        project_preference_form=[],
        is_published=False,
        max_group_size=6,
        preference_release=False,
        color=generate_random_color(),
    )
