"""
Notification-related functionality
"""

import os

from dotenv import load_dotenv
from bson import ObjectId
from flask import Blueprint, jsonify
from mailersend import emails

from ..models.client import Client
from ..models.project import Project
from .helper import id_validation, get_user_by_id

load_dotenv()
MAILERSEND_API_KEY = os.getenv("MAILERSEND_API_KEY")
mailer = emails.NewEmail(MAILERSEND_API_KEY)
notifications_bp = Blueprint("notifications", __name__)


def send_email(recipient_name, recipient_email, subject, message):
    """
    Send an email using MailerSend API.
    """
    try:
        mail = (
            emails.NewEmail()
        )  # assigning NewEmail() without params defaults to MAILERSEND_API_KEY env var
        mail_body = {}
        mail_from = {
            "name": "Capstone Management System",
            "email": "noreply@capstonemanagementsystem.tech",
        }
        recipients = [
            {
                "name": recipient_name,
                "email": recipient_email,
            }
        ]
        reply_to = {
            "name": None,
            "email": None,
        }
        mail.set_mail_from(mail_from, mail_body)
        mail.set_mail_to(recipients, mail_body)
        mail.set_subject(subject, mail_body)
        mail.set_html_content(message, mail_body)
        mail.set_plaintext_content(message, mail_body)
        mail.set_reply_to(reply_to, mail_body)
        mail.send(mail_body)

        return jsonify({}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 400


def client_outcome_notification(client_id):
    """
    Notify client through email whether they have been accepted or rejected
    """
    try:
        id_validation(client_id)
        client = Client.find_one({"_id": ObjectId(client_id)}).run()
        if not client:
            return jsonify({"Error": "Client not found"}), 404

        if client.is_verified:
            contents = (
                "Congratulations! You are now a verified client for UNSW. "
                "As a client, you can create projects and communicate with student groups "
                "to execute solutions that meet your requirements. "
                "You will be responsible for communicating promptly with course staff and students "
                "as well as following certain timeline requirements for the course. "
                "If you have any questions, please reach out to the course admin."
            )
        else:
            contents = (
                "Unfortunately, you have not been accepted as a verified client. "
                "Please reach out to the course admin if you would like more information."
            )

        message = f"""
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Verification Status</title>
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
                .footer {{
                    text-align: center;
                    font-size: 0.9em;
                    color: #777;
                }}
            </style>
        </head>
        <body>
            <div class="content">
                <p>Dear <strong>{client.name}</strong>,</p>
                <p>{contents}</p>
                <p>Thanks,<br>Your Capstone Management Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Capstone Management System. All rights reserved.</p>
            </div>
        </body>
        """
        send_email(client.name, client.email, "Client Verification Outcome", message)
        return jsonify({"message": "Notification sent successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


# notify client of project outcome
def client_project_outcome_notification(client_ids, project_id):
    """
    Notify client through email whether their project has been accepted or rejected
    """
    try:
        id_validation(project_id)
        project = Project.find_one({"_id": ObjectId(project_id)}).run()
        if not project:
            return jsonify({"Error": "Project not found"}), 404

        contents = ""
        if project.status == "available":
            contents = (
                "Congratulations! Your project has been accepted and is now visible to students. "
                "If you have any questions, please reach out to the course admin."
            )
        elif project.status == "unavailable":
            contents = (
                "Congratulations! Your project has been accepted but is not visible to students yet"
                " as it is unavailable for the current course offering. If you have any questions, "
                "please reach out to the course admin."
            )
        else:
            contents = (
                "Unfortunately, your project has not been accepted as a verified project. "
                "Please reach out to the course admin if you would like more information."
            )

        for client_id in client_ids:
            id_validation(client_id)
            client = Client.find_one({"_id": ObjectId(client_id)}).run()
            if not client:
                return jsonify({"Error": "Client not found"}), 404
            message = f"""
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Project Outcome</title>
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
                    .footer {{
                        text-align: center;
                        font-size: 0.9em;
                        color: #777;
                    }}
                </style>
            </head>
            <body>
                <div class="content">
                    <p>Dear <strong>{client.name}</strong>,</p>
                    <p>{contents}</p>
                    <p>Thanks,<br>Your Capstone Management Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Management System. All rights reserved.</p>
                </div>
            </body>
            """
            send_email(
                client.name, client.email, "Project Application Outcome", message
            )
            return jsonify({"message": "Notification sent successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


def course_invite_notification(name, email, course_name, course_code):
    """
    Notify user through email that they have been added to a course
    """
    try:  # TODOX: check whether student will also receive this email when their
        # details surrounding this course offering are updated
        message = f"""
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Capstone Management System Registration</title>
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
                <p>Dear <strong>{name}</strong>,</p>
                <p>You have been added to the course {course_name} ({course_code})
                    or your details for this course have been updated.</p>
                <p>Please log in to the Capstone Management System to view your course:
                    <a href="http://localhost:3001/login">https://capstonemanagementsystem.tech/login</a>
                </p> 
                <p>If you are not enrolled in this course, please contact the course administrator.</p>
                <p>Thanks,<br>Your Capstone Management Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Capstone Management System. All rights reserved.</p>
            </div>
        </body>
        """
        send_email(name, email, "Course Invitation", message)
        return jsonify(
            {"message": "Student invitation notification sent successfully!"}
        ), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


def user_registration_notification(name, email, user_type, access_code):
    """
    Notify user through email that they have been registered to the system
    """
    try:
        encoded_email = email.replace("@", "%40")
        message = f"""
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Capstone Management System Registration</title>
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
                <p>Dear <strong>{name}</strong>,</p>
                <p>You have been registered for the Capstone Management System by your course admin. 
                Use the Access Code below to set your password:</p>
                <div class="reset-pin">{access_code}</div>
                <p>Access your course: 
                    <a href="http://localhost:3001/reset-password/verify/{user_type}/{encoded_email}">
                    https://capstonemanagementsystem.tech/reset-password/verify/{user_type}/{encoded_email}
                    </a>
                </p> 
                <p>Thanks,<br>Your Capstone Management Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Capstone Management System. All rights reserved.</p>
            </div>
        </body>
        """
        send_email(name, email, "Capstone Management System Registration", message)
        return jsonify(
            {"message": "User registration notification sent successfully!"}
        ), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


def thread_reply_notification(creator_id, replier_id, contents):
    """
    Notifies creator via email when user replies to a user's thread

    Args:
        creator_id (str): the identifier of the creator
        replier_id (str): the identifier of the replier
        contents (str): the content of the email
    """
    if not creator_id or not replier_id or not contents:
        return jsonify({"message": "Missing required fields"}), 400

    try:
        id_validation(creator_id)
        id_validation(replier_id)
        creator = get_user_by_id(creator_id)
        if not creator:
            return jsonify({"Error": "Thread creator not found"}), 400
        creator_name = creator.name
        creator_email = creator.email

        replier = get_user_by_id(replier_id)
        if not replier:
            return jsonify({"Error": "Replier not found"}), 400
        replier_name = replier.name

        message = f"""
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Thread Reply From {replier_name}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
            <p></strong>{replier_name}</strong> says:</p>
            <div class="email-container">
                <div class="content">
                    <p>{contents}</p>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 Capstone Management System. All rights reserved.</p>
            </div>
        </body>
        </html>
        """

        send_email(
            creator_name,
            creator_email,
            "New Thread Reply From " + replier_name,
            message,
        )
        return jsonify({"message": "Notification sent successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404


def announcement_notification(creator_name, recipient_id, contents):
    """
    Notifies users of an announcement

    Args:
        creator_name (str): the name of the creator
        recipient_id (str): the identifier of the recipient
        contents (str): the content of the email
    """

    if not creator_name or not recipient_id or not contents:
        return jsonify({"message": "Missing required fields"}), 400

    try:
        recipient = get_user_by_id(recipient_id)
        if not recipient:
            return jsonify({"Error": "Recipient not found"}), 400
        recipient_name = recipient.name
        recipient_email = recipient.email

        message = f"""
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Announcement From {creator_name}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
            <p></strong>{creator_name}</strong> says:</p>
            <div class="email-container">
                <div class="content">
                     <p>{contents}</p>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 Capstone Management System. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        send_email(
            recipient_name,
            recipient_email,
            "New Announcement From " + creator_name,
            message,
        )
        return jsonify({"message": "Notification sent successfully!"}), 200
    except RuntimeError as e:
        return jsonify({"Error": str(e)}), 404
