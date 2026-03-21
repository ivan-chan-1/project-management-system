/// <reference types="cypress" />

describe("Edit Course Details Page", () => {
  beforeEach(() => {
    const token = "fakeToken";
    const user = "staff";
    const subcourseId = "fakeSubcourseId";
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("user", user);
    window.localStorage.setItem("subcourse", subcourseId);

    cy.fixture("subcourse_details.json").as("subcourseData");
    cy.fixture("course_details.json").as("courseData");

    let parentCourseId = "";
    cy.fixture("subcourse_details.json").then((subcourseData) => {
      cy.intercept("GET", `/api/subcourse/${subcourseId}`, {
        statusCode: 200,
        body: subcourseData,
      }).as("getSubcourseDetails");
      parentCourseId = subcourseData.parent_course;
    });

    cy.fixture("course_details.json").then((courseData) => {
      cy.intercept("GET", `/api/course/details/${parentCourseId}`, {
        statusCode: 200,
        body: courseData,
      }).as("getCourseDetails");
    });

    cy.intercept("GET", `/api/subcourse/${subcourseId}/archive`, {
      statusCode: 200,
      body: { archived: false },
    }).as("isArchived");

    cy.intercept("GET", `/api/subcourse/${subcourseId}/active`, {
      statusCode: 200,
      body: { active: false },
    }).as("isActive");

    cy.intercept("GET", `/api/subcourse/${subcourseId}/activatable`, {
      statusCode: 200,
      body: { active: true },
    }).as("canActivate");

    cy.intercept("PUT", `/api/course/update/date`, {
      statusCode: 200,
      body: {},
    }).as("updateTermDates");

    cy.intercept("PUT", `/api/subcourse/update/${subcourseId}`, {
      statusCode: 200,
      body: {},
    }).as("updateSubcourse");

    cy.intercept("PUT", "/api/staff/course/term-dates", {
      statusCode: 200,
      body: {},
    }).as("updateTermDates");

    cy.visit("/editCourse");
  });

  it("should load, edit and save course details", function () {
    cy.wait("@getSubcourseDetails");
    cy.wait("@getCourseDetails");
    cy.wait("@isArchived");
    cy.wait("@isActive");
    cy.wait("@canActivate");

    // expand "Course Details"
    cy.contains("Course Details").click();
    cy.get('input[name="course-name"]').clear().type("COMP9999 2026");

    // expand "Parent Course Term Dates"
    cy.contains("Parent Course Term Dates").click();
    cy.get('input[name="term-1"]').clear().type("01-01-2026 to 01-05-2026");

    // expand "Group Rules"
    cy.contains("Group Rules").click();
    cy.get('input[name="group-size"]').clear().type("7");

    // save the changes
    cy.contains("SAVE").click();

    // should trigger update API calls
    cy.wait("@updateSubcourse").its("response.statusCode").should("eq", 200);
    cy.wait("@updateTermDates").its("response.statusCode").should("eq", 200);

    cy.contains("Updated successfully").should("exist");
  });
});
