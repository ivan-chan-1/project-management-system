"""
Constants
"""

from bson import ObjectId

DEFAULT_CLIENT_FORM = [
    {
        "id": ObjectId(),
        "input_type": "text",
        "label": "Project Name",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "checkbox",
        "label": "Offering Terms",
        "value": None,
        "options": ["1", "2", "3"],
    },
    {
        "id": ObjectId(),
        "input_type": "textarea",
        "label": "Background",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "textarea",
        "label": "Project Description",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "textarea",
        "label": "Required Skills",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "textarea",
        "label": "Outcome",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "number",
        "label": "Number of Groups",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "select",
        "label": "Category",
        "value": None,
        "options": [
            "AI",
            "Web Development",
            "Mobile Development",
            "Data Science",
            "Cyber Security",
        ],
    },
    {
        "id": ObjectId(),
        "input_type": "dropdown",
        "label": "Product Areas",
        "value": None,
        "options": [
            "AI",
            "Web Development",
            "Mobile Development",
            "Data Science",
            "Cyber Security",
        ],
    },
]

DEFAULT_PROJECT_PREFERENCE_FORM = [
    {
        "id": ObjectId(),
        "input_type": "select",
        "label": "What is the first topic area you are interested in, if you don't get your project preferences?",
        "value": None,
        "options": [
            "AI/ML",
            "NLP",
            "Web Development",
            "Web Application",
            "Data Science",
            "VR/AR",
            "Cyber Security",
        ],
    },
    {
        "id": ObjectId(),
        "input_type": "text",
        "label": "Why are you interested in this topic area?",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "select",
        "label": "What is the second topic area you are interested in, if you don't get your project preferences?",
        "value": None,
        "options": [
            "AI/ML",
            "NLP",
            "Web Development",
            "Web Application",
            "Data Science",
            "VR/AR",
            "Cyber Security",
        ],
    },
    {
        "id": ObjectId(),
        "input_type": "text",
        "label": "Why are you interested in this topic area?",
        "value": None,
        "options": [],
    },
    {
        "id": ObjectId(),
        "input_type": "select",
        "label": "What is the third topic area you are interested in, if you don't get your project preferences?",
        "value": None,
        "options": [
            "AI/ML",
            "NLP",
            "Web Development",
            "Web Application",
            "Data Science",
            "VR/AR",
            "Cyber Security",
        ],
    },
    {
        "id": ObjectId(),
        "input_type": "text",
        "label": "Why are you interested in this topic area?",
        "value": None,
        "options": [],
    },
]

GROUP_NAMES = [
    "APPLE",
    "BANANA",
    "CELERY",
    "DRAGONFRUIT",
    "ELDERBERRY",
    "FIG",
    "GRAPE",
    "HONEYDEW",
]

DEFAULT_COURSE_CHANNELS = [
    {"name": "Announcements", "channel_type": "announcement"},
    {"name": "Forum", "channel_type": "forum"},
    {"name": "General", "channel_type": "text"},
]

DEFAULT_PROJECT_CHANNELS = [
    {"name": "Announcements", "channel_type": "announcement"},
    {"name": "General", "channel_type": "text"},
]
