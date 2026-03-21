"""Config File"""

SERVER_PORT = 5000
SALT_ROUNDS = 10
JWT_SECRET_KEY = "DRAGONFRUIT_SECRET_KEY"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_TIMER = "8h"


def get_jwt_expiry_seconds():
    """JWT Configuration"""
    value = JWT_EXPIRY_TIMER[:-1]
    unit = JWT_EXPIRY_TIMER[-1]

    if unit == "h":
        return int(value) * 3600
    if unit == "m":
        return int(value) * 60
    if unit == "d":
        return int(value) * 86400
    return 28800  # default to 8 hours (in seconds)
