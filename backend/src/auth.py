"""
API routes and helper functions for authentication related functionality
"""

import os
import random
from datetime import timedelta
import string

import bcrypt
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from mailersend import emails
from dotenv import load_dotenv

from pydantic import ValidationError
from ..config import SALT_ROUNDS
from ..models.student import Student
from ..models.client import Client
from ..models.staff import Staff
from ..models.request_data import StudentRegister, Login, StaffRegister, ClientRegister
from .notifications import send_email
from ..extensions import mongo


load_dotenv()

MAILERSEND_API_KEY = os.getenv("MAILERSEND_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")
SALT_ROUNDS = int(os.getenv("SALT_ROUNDS", "12"))

mailer = emails.NewEmail(MAILERSEND_API_KEY)
auth_bp = Blueprint("auth", __name__)


##################
#
# Helper Functions
#
##################
def hash_str(password):
    """
    Creates a hash of given plaintext password

    :params str password: the password
    :return: the hashed password
    """
    if isinstance(password, str):
        password = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=SALT_ROUNDS)
    hashed = bcrypt.hashpw(password, salt)
    return hashed.decode("utf-8")


def verify(plain_str, hashed_str):
    """
    Verifies if given password, matches stored password

    Args:
        plain_str (str): user input plaintext password
        hashed_str (str): stored hashed password

    Returns:
        bool: if true, authenticates user into the system
    """
    if isinstance(plain_str, str):
        plain_str = plain_str.encode("utf-8")
    if isinstance(hashed_str, str):
        hashed_str = hashed_str.encode("utf-8")
    return bcrypt.checkpw(plain_str, hashed_str)


def authenticate_user(username, password, role):
    """
    Authenticates a user based on email (username), password, and role

    Args:
        username (str): The user's email address.
        password (str): The user's password.
        role (str): The role of the user (student, client, or staff).

    Returns:
        tuple: (access_token (str or None), user_id (str or None),
                error_message (str or None), status_code (int))
    """
    if role == "student":
        user = mongo.db.students.find_one({"email": username})
    elif role == "client":
        user = mongo.db.clients.find_one({"email": username})
    else:
        user = mongo.db.staff.find_one({"email": username})

    if not user:
        return None, None, "User not found", 404
    if not verify(password, user["password"]):
        return None, None, "Invalid password", 401

    if role == "staff" and user["role"] != "course admin" and user["role"] != "tutor":
        return None, None, "Invalid role", 401

    if role not in ("staff", user["role"]):
        return None, None, "Invalid role", 401

    try:
        user_claims = {
            "role": user.get("role", "user"),
            "name": user.get("name"),
            "email": user.get("email"),
        }

        access_token = create_access_token(
            identity=str(user["_id"]),
            additional_claims=user_claims,
            expires_delta=timedelta(hours=8),
        )

        return access_token, str(user["_id"]), None, 200
    except RuntimeError as e:
        return None, None, f"Token generation error: {str(e)}", 500


def register_student(data):
    """
    Registers a new student

    :params StudentRegister data: the data to register
    :return: None
    """

    # else store the new student
    name = data.firstName + " " + data.lastName
    hashed_password = hash_str(data.password)

    new_student = Student(
        name=name,
        zid=data.zid,
        email=data.email,
        password=hashed_password,
        year=None,
        role="student",
        subcourses=[],
        experiences=[],
        reset_pin=None,
    )
    new_student.insert()
    return new_student


def register_staff(data, role):
    """
    Registers a new staff member

    :params StaffRegister data: the data to register
    :return: None
    """
    name = data.firstName + " " + data.lastName
    hashed_password = hash_str(data.password)

    new_staff = Staff(
        role=role,
        name=name,
        zid=data.zid,
        email=data.email,
        password=hashed_password,
        classes=[],
        reset_pin=None,
        links=[],
    )

    new_staff.insert()
    return new_staff


def generate_password():
    """
    Generates a random password for the user
    :return: the generated password
    """

    length = 12
    characters = string.ascii_letters + string.digits + string.punctuation
    password = "".join(random.choice(characters) for i in range(length))
    return password


########
#
# Routes
#
########
@auth_bp.route("/api/student/register", methods=["POST"])
def student_register():
    """
    Register a new student

    Returns:
        Response: JSON message indicating success or failure
    """
    try:
        # Validate data
        data = StudentRegister.model_validate_json(request.data)

        # check if the student already exists
        existing_student = Student.find_one({"email": data.email}).run()
        if existing_student:
            return jsonify({"message": "Email already in use"}), 400
        existing_student = Student.find_one({"zid": data.zid}).run()
        if existing_student:
            return jsonify({"message": "zID already in use"}), 400

        register_student(data)
        return jsonify({"message": "Student registered successfully!"}), 201
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
    except ValueError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 404


@auth_bp.route("/api/staff/register", methods=["POST"])
def staff_register():
    """
    Register a new staff

    Returns:
        Response: JSON message indicating success or failure
    """
    try:
        data = StaffRegister.model_validate_json(request.data)

        # check if the staff member already exists
        existing_staff = Staff.find_one({"email": data.email}).run()
        if existing_staff:
            return jsonify({"message": "Email already in use"}), 400

        existing_staff = Staff.find_one({"zid": data.zid}).run()
        if existing_staff:
            return jsonify({"message": "zID already in use"}), 400

        register_staff(data, "course admin")

        return jsonify({"message": "Staff registered successfully!"}), 201
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@auth_bp.route("/api/client/register", methods=["POST"])
def client_register():
    """
    Register a new client

    Returns:
        Response: JSON message indicating success or failure
    """
    try:
        data = ClientRegister.model_validate_json(request.data)

        # check if the client member already exists
        existing_client = Client.find_one({"email": data.email}).run()

        if existing_client:
            return jsonify({"message": "Email already in use"}), 400
        name = data.firstName + " " + data.lastName
        hashed_password = hash_str(data.password)

        new_client = Client(
            role="client",
            name=name,
            email=data.email,
            phone=data.phone,
            password=hashed_password,
            is_verified=False,
            company_name=data.companyName,
            company_brief="",
            company_address="",
            company_industry=data.industry,
            company_abn=data.companyABN,
            contact_hours=data.contactHours,
            projects=[],
            courses=[],
            wishlist=[],
            preferences=[],
            reset_pin=None,
        )

        new_client.insert()
        return jsonify({"message": "Client registered successfully!"}), 201
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@auth_bp.route("/api/<user_type>/login", methods=["POST"])
def login(user_type):
    """
    Logs in a user based on user type (student, client, or staff)

    Args:
        user_type (str): Type of the user (student, client, or staff)

    Returns:
        Response: JSON response with access token and user information or an error message
    """
    try:
        data = Login.model_validate_json(request.data)
        access_token, user_id, message, status_code = authenticate_user(
            data.email, data.password, user_type
        )
        if access_token:
            return jsonify(
                {"access_token": access_token, "user": user_type, "id": user_id}
            ), 200

        return jsonify({"message": message}), status_code
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@auth_bp.route("/api/<user_type>/verify-pin", methods=["POST"])
def verify_reset_pin(user_type):
    """
    Verify a user's reset pin during password reset

    Args:
        user_type (str): Type of the user (student, client, or staff)

    Returns:
        Response: JSON response indicating whether the pin verification was successful
    """
    try:
        data = request.json
        email = data.get("email")
        pin = data.get("pin")

        if not email or not pin:
            return jsonify({"message": "Missing required fields"}), 400

        if user_type == "student":
            user = mongo.db.students.find_one({"email": email})
        elif user_type == "client":
            user = mongo.db.clients.find_one({"email": email})
        elif user_type == "staff":
            user = mongo.db.staff.find_one({"email": email})
        else:
            return jsonify({"message": "Invalid user type"}), 400

        if not user:
            return jsonify({"message": "User not found"}), 404

        if verify(pin, user.get("reset_pin")) is False:
            return jsonify({"message": "Invalid pin"}), 401

        # Clear reset pin after verifying
        if user_type == "student":
            mongo.db.students.update_one(
                {"_id": user["_id"]}, {"$set": {"reset_pin": None}}
            )
        elif user_type == "client":
            mongo.db.clients.update_one(
                {"_id": user["_id"]}, {"$set": {"reset_pin": None}}
            )
        else:
            mongo.db.staff.update_one(
                {"_id": user["_id"]}, {"$set": {"reset_pin": None}}
            )

        return jsonify({"message": "Reset pin verified successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@auth_bp.route("/api/<user_type>/reset-password", methods=["POST"])
def reset_password(user_type):
    """
    Resets a user's password

    Args:
        user_type (str): Type of the user (student, client, or staff)

    Returns:
        Response: JSON message indicating success or failure of password reset
    """
    try:
        data = request.json
        email = data.get("email")
        new_password = data.get("password")

        if not email or not new_password:
            return jsonify({"message": "Missing required fields"}), 400

        hashed_password = hash_str(new_password)

        if user_type == "student":
            user = mongo.db.students.find_one({"email": email})
        elif user_type == "client":
            user = mongo.db.clients.find_one({"email": email})
        elif user_type == "staff":
            user = mongo.db.staff.find_one({"email": email})
        else:
            return jsonify({"message": "Invalid user type"}), 400

        if not user:
            return jsonify({"message": "User not found"}), 404

        if user_type == "student":
            mongo.db.students.update_one(
                {"_id": user["_id"]}, {"$set": {"password": hashed_password}}
            )
        elif user_type == "client":
            mongo.db.clients.update_one(
                {"_id": user["_id"]}, {"$set": {"password": hashed_password}}
            )
        else:
            mongo.db.staff.update_one(
                {"_id": user["_id"]}, {"$set": {"password": hashed_password}}
            )

        return jsonify({"message": "Password reset successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@auth_bp.route("/api/<user_type>/forgot-password", methods=["POST"])
def send_reset_email(user_type):
    """
    Sends a password reset email with a reset pin

    Args:
        user_type (str): Type of the user (student, client, or staff)

    Returns:
        Response: JSON message indicating whether the reset email was successfully sent
    """
    data = request.json
    email = data.get("email")
    try:
        if not email:
            return jsonify({"message": "Missing required fields"}), 400

        reset_pin = str(random.randint(100000, 999999))

        if user_type == "student":
            user = mongo.db.students.find_one({"email": email})
            if not user:
                return jsonify({"message": "User not found"}), 404
            mongo.db.students.update_one(
                {"_id": user["_id"]}, {"$set": {"reset_pin": hash_str(reset_pin)}}
            )
        elif user_type == "client":
            user = mongo.db.clients.find_one({"email": email})
            if not user:
                return jsonify({"message": "User not found"}), 404
            mongo.db.clients.update_one(
                {"_id": user["_id"]}, {"$set": {"reset_pin": hash_str(reset_pin)}}
            )
        else:
            user = mongo.db.staff.find_one({"email": email})
            if not user:
                return jsonify({"message": "User not found"}), 404
            mongo.db.staff.update_one(
                {"_id": user["_id"]}, {"$set": {"reset_pin": hash_str(reset_pin)}}
            )

        message = f"""
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #000000;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 20px;
                }}
                .header h1 {{
                    color: #4CAF50;
                }}
                .content {{
                    margin-bottom: 20px;
                }}
                .reset-pin {{
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #4CAF50;
                    text-align: center;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    font-size: 0.9em;
                    color: #777;
                }}
            </style>
        </head>
        <body>
            <div class="content">
                <p>Dear <strong>{user["name"]}</strong>,</p>
                <p>We received a request to reset your password for your account associated with 
                this email address. Use the 6-digit pin below to reset it:</p>
                <div class="reset-pin">{reset_pin}</div>
                <p>If you did not request this, please ignore this email.</p>
                <p>Thanks,<br>Your Capstone Management Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Capstone Management System. All rights reserved.</p>
            </div>
        </body>
        """
        send_email(
            recipient_name=user["name"],
            recipient_email=email,
            subject="Reset Your Password",
            message=message,
        )
        return jsonify({"message": "Reset password email sent successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 500
