# Backend

Make sure you are in the virtual environemnt. You can tell you are if there is a `(venv`) in your terminal

Run the backend with:
```shell
flask run --debug
```
MAKE SURE YOU EXIT THE VENV WHEN CODING FRONTEND.

## Getting Started
I recommend watching / reading the following:
- [A Brief Introduction to Flask (Python Web Framework)](https://www.youtube.com/watch?v=AgVqsmz-ZW4)
- [Session vs Token Authentication in 100 Seconds](https://www.youtube.com/watch?v=UBUNrFtufWo)

## Installing Dependencies
Make sure you are in the backend directory.
Initialise a virtual environment
```shell
python3 -m venv venv
source venv/bin/activate # For Linux and MacOS
venv\Scripts\activate    # For Windows
```
You should now see a (venv) in front your command prompt.
To install dependencies, run the following:
```shell
pip install --quiet --upgrade -r requirements.txt
```

Install a new dependency `package` with:
```shell
pip install package
pip freeze > requirements.txt
```

## Code
Make sure YOU ARE INSIDE the venv (virtual environment) while coding.

## Code Style and Linting
Running PyLint in the backend directory.
```shell
pylint .
```

## Swagger file
Run the backend application. Once returned the URL, open that on browser. Append /swagger and you should be redirected to a swagger page titled **3900-h12a-DRAGONFRUIT**

## Recommendations
Backend Devs should download and use [Postman](https://www.postman.com/downloads/) when working with backend API calls.
Installing MongoDB Compass will also be useful in verifying the database.
