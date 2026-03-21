"""
Tests for the authentication module.
"""

from ..models.student import Student
from ..models.staff import Staff
from ..models.client import Client


def test_student_register(client):
    """
    Test the student registration endpoint.
    """
    data = {
        "firstName": "John",
        "lastName": "Doe",
        "zid": "z1234567",
        "email": "z1234567@ad.unsw.edu.au",
        "password": "TempPW",
    }
    res = client.post(
        "/api/student/register",
        json=data,
    )
    assert res.status_code == 201
    assert res.json["message"] == "Student registered successfully!"
    # Check if the student is in the database
    student = Student.find_one({"zid": data["zid"]}).run()
    assert student is not None
    assert student.email == data["email"]


def test_staff_register(client):
    """
    Test the staff registration endpoint.
    """
    data = {
        "firstName": "Jane",
        "lastName": "Smith",
        "zid": "z1111111",
        "email": "z1111111@ad.unsw.edu.au",
        "password": "TempPW",
    }
    res = client.post(
        "/api/staff/register",
        json=data,
    )
    assert res.status_code == 201
    # Check if the staff is in the database
    staff = Staff.find_one({"zid": data["zid"]}).run()
    assert staff is not None
    assert staff.email == data["email"]


def test_client_register(client):
    """
    Test the client registration endpoint.
    """
    data = {
        "firstName": "Jane",
        "lastName": "Smith",
        "phone": "111111111",
        "email": "zoology@gmail.com",
        "password": "TempPW",
        "companyName": "String Pty Ltd",
        "industry": "String Products",
        "companyABN": "12345678900",
        "contactHours": "9:00AM-5:00PM",
    }
    res = client.post(
        "/api/client/register",
        json=data,
    )
    assert res.status_code == 201
    # Check if the client is in the database
    client = Client.find_one({"email": data["email"]}).run()
    assert client is not None
    assert client.phone == data["phone"]
    assert client.company_name == data["companyName"]
    assert client.company_industry == data["industry"]
    assert client.company_abn == data["companyABN"]
    assert client.contact_hours == data["contactHours"]


def test_student_login(client):
    """
    Test the student login endpoint.
    """
    # First, register a student
    test_student_register(client)
    data = {
        "email": "z1234567@ad.unsw.edu.au",
        "password": "TempPW",
    }
    res = client.post(
        "/api/student/login",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["access_token"] is not None


def test_staff_login(client):
    """
    Test the staff login endpoint.
    """
    # First, register a staff
    test_staff_register(client)
    data = {
        "email": "z1111111@ad.unsw.edu.au",
        "password": "TempPW",
    }
    res = client.post(
        "/api/staff/login",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["access_token"] is not None


def test_client_login(client):
    """
    Test the client login endpoint.
    """
    # First, register a client
    test_client_register(client)
    data = {
        "email": "zoology@gmail.com",
        "password": "TempPW",
    }
    res = client.post(
        "/api/client/login",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["access_token"] is not None


def test_student_forgot_password(client):
    """
    Test the forgot password endpoint.
    """
    test_student_register(client)
    input_data = {
        "email": "z1234567@ad.unsw.edu.au",
    }
    res = client.post(
        "/api/student/forgot-password",
        json=input_data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["message"] == "Reset password email sent successfully!"
    student = Student.find_one({"email": input_data["email"]}).run()
    assert student is not None
    assert student.reset_pin is not None


def test_staff_forgot_password(client):
    """
    Test the forgot password endpoint.
    """
    test_staff_register(client)
    input_data = {
        "email": "z1111111@ad.unsw.edu.au",
    }
    res = client.post(
        "/api/staff/forgot-password",
        json=input_data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["message"] == "Reset password email sent successfully!"
    staff = Staff.find_one({"email": input_data["email"]}).run()
    assert staff is not None
    assert staff.reset_pin is not None


def test_client_forgot_password(client):
    """
    Test the forgot password endpoint.
    """
    test_client_register(client)
    input_data = {
        "email": "zoology@gmail.com",
    }
    res = client.post(
        "/api/client/forgot-password",
        json=input_data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["message"] == "Reset password email sent successfully!"
    client = Client.find_one({"email": input_data["email"]}).run()
    assert client is not None
    assert client.reset_pin is not None


def test_student_verify_reset_pin(client):
    """
    Test the verify reset pin endpoint.
    """
    test_student_forgot_password(client)
    data = {
        "email": "z1234567@ad.unsw.edu.au",
        "pin": "123456",  # incorrect pin
    }
    res = client.post(
        "/api/student/verify-pin",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 401


def test_staff_verify_reset_pin(client):
    """
    Test the verify reset pin endpoint.
    """
    test_staff_forgot_password(client)
    data = {
        "email": "z1111111@ad.unsw.edu.au",
        "pin": "123456",  # incorrect pin
    }
    res = client.post(
        "/api/staff/verify-pin",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 401


def test_client_verify_reset_pin(client):
    """
    Test the verify reset pin endpoint.
    """
    test_client_forgot_password(client)
    data = {
        "email": "zoology@gmail.com",
        "pin": "123456",  # incorrect pin
    }
    res = client.post(
        "/api/client/verify-pin",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 401


def test_student_reset_password(client):
    """
    Test the reset password endpoint.
    """
    test_student_verify_reset_pin(client)
    email = "z1234567@ad.unsw.edu.au"
    data = {
        "email": email,
        "password": "NewTempPW",
    }
    student = Student.find_one({"email": email}).run()
    old_password = student.password
    res = client.post(
        "/api/student/reset-password",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["message"] == "Password reset successfully!"
    student = Student.find_one({"email": email}).run()
    assert student is not None
    assert student.password != old_password


def test_staff_reset_password(client):
    """
    Test the reset password endpoint.
    """
    test_staff_verify_reset_pin(client)
    email = "z1111111@ad.unsw.edu.au"
    data = {
        "email": email,
        "password": "NewTempPW",
    }
    staff = Staff.find_one({"email": email}).run()
    old_password = staff.password
    res = client.post(
        "/api/staff/reset-password",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["message"] == "Password reset successfully!"
    staff = Staff.find_one({"email": email}).run()
    assert staff is not None
    assert staff.password != old_password


def test_client_reset_password(client):
    """
    Test the reset password endpoint.
    """
    test_client_verify_reset_pin(client)
    email = "zoology@gmail.com"
    data = {
        "email": email,
        "password": "NewTempPW",
    }
    user_client = Client.find_one({"email": email}).run()
    old_password = user_client.password
    res = client.post(
        "/api/client/reset-password",
        json=data,
    )
    data = res.get_json()
    assert res.status_code == 200
    assert data["message"] == "Password reset successfully!"
    user_client = Client.find_one({"email": email}).run()
    assert user_client is not None
    assert user_client.password != old_password
