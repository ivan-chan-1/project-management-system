"""Establishing the application routes"""

from flask import Flask
from flask_cors import CORS
from bunnet import init_bunnet
from dotenv import dotenv_values
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, emit, join_room, leave_room
from bson import ObjectId
from pydantic import ValidationError
from .extensions import mongo
from .models.student import Student
from .models.staff import Staff
from .models.group import Group
from .models.project import Project
from .models.client import Client
from .models.subcourse import Subcourse
from .models.channel import Channel
from .models.course import Course
from .src.projects import projects_bp
from .src.students import students_bp
from .src.auth import auth_bp
from .src.clients import clients_bp
from .src.groups import groups_bp
from .src.courses import courses_bp
from .src.admin import admin_bp
from .src.subcourses import subcourses_bp
from .src.channels import channels_bp, save_post, save_reply

# Loading environment variables from .env file
config = dotenv_values(".env")
JWT_SECRET_KEY = config["JWT_SECRET_KEY"]
JWT_ALGORITHM = config["JWT_ALGORITHM"]
JWT_EXPIRY_TIMER = int(config["JWT_EXPIRY_TIMER"])

# Files
socketio = SocketIO(cors_allowed_origins="*")


def create_app(test=False):
    """Creates and configures the Flask application instance.

    Args:
        test (bool, optional): Indicates if testing environment. Defaults to False.

    Returns:
        Flask: Flask instance
    """
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Initialising database and ODM

    # - w/ Docker (comment out if using VENV)
    # app.config["MONGO_URI"] = os.getenv("DB_URI")

    # - w/ VENV (comment out if using Docker)
    # config = dotenv_values(".env")

    if test:
        app.config["MONGO_URI"] = config["TEST_DB_URI"]
        app.config["TESTING"] = True
    else:
        app.config["MONGO_URI"] = config["DB_URI"]

    # Load environment variables
    app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    app.config["JWT_ALGORITHM"] = JWT_ALGORITHM
    app.config["JWT_EXPIRY_TIMER"] = JWT_EXPIRY_TIMER

    mongo.init_app(app)
    init_bunnet(
        database=mongo.db,
        document_models=[
            Student,
            Staff,
            Group,
            Project,
            Client,
            Course,
            Channel,
            Subcourse,
        ],
    )
    JWTManager(app)

    socketio.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(subcourses_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(groups_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(channels_bp)

    return app


@socketio.on("connect")
def handle_connect():
    """
    Connects client to server
    """
    print("connected")
    emit("connected", {"data": "Connected"})


@socketio.on("disconnect")
def handle_disconnect():
    """
    Disconnects client from server
    """
    print("Client disconnected")


@socketio.on("post")
def handle_post(channel_id, payload):
    """
    Adds post to database and sends post to users in channel
    """
    post_id = ObjectId()
    payload["id"] = str(post_id)
    try:
        save_post(channel_id, payload)
        emit("post", payload, include_self=True, to=channel_id)
    except ValidationError as e:
        emit("exception", {"Error": str(e)}, include_self=True)


@socketio.on("reply")
def handle_reply(channel_id, op_id, payload):
    """
    Adds reply to database and sends reply to users in channel
    """
    post_id = ObjectId()
    payload["id"] = str(post_id)
    try:
        save_reply(channel_id, op_id, payload)
        emit("reply", (op_id, payload), include_self=True, to=channel_id)
    except ValidationError as e:
        emit("exception", {"Error": str(e)}, include_self=True)


@socketio.on("join")
def on_join(channel_id):
    """
    Joins room
    """
    join_room(channel_id)
    print(f"joined room {channel_id}")


@socketio.on("leave")
def on_leave(channel_id):
    """
    Leave room
    """
    leave_room(channel_id)
    print(f"left room {channel_id}")


if __name__ == "__main__":
    socketio.run(create_app())
