"""
Fixtures and configuration for setting up the Flask testing framework.
"""

import pytest
from ..app import create_app
from ..extensions import mongo


@pytest.fixture
def app():
    """
    Creates a Flask app instance

    Returns:
        Flask
    """
    _app = create_app(test=True)
    return _app


# pylint: disable=redefined-outer-name
@pytest.fixture
def client(app):
    """
    Creates and configures a Flask test client for use in tests.

    Yields:
        FlaskClient: A test client for sending HTTP requests to the application.
    """
    with app.test_client() as _client:
        yield _client


@pytest.fixture(autouse=True)
def clean_collections():
    """
    Cleans all collections made in the test database
    """
    yield
    mongo.db.drop_collection("students")
    mongo.db.drop_collection("staff")
    mongo.db.drop_collection("courses")
    mongo.db.drop_collection("subcourses")
    mongo.db.drop_collection("projects")
    mongo.db.drop_collection("groups")
    mongo.db.drop_collection("clients")
    mongo.db.drop_collection("channels")
