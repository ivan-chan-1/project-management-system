/// <reference types="cypress" />

describe("Client Project Submission and Management", () => {
  const pwd = "securePassword123";

  beforeEach(function () {
    // Load fixtures
    cy.fixture("logins.json").as("logins");
    cy.fixture("userdetails.json").as("userdetails");
    cy.fixture("subcourses.json").as("subcourses");
    cy.fixture("courses.json").as("courses");
    cy.fixture("projects.json").as("projects");

    // Visit login page
    cy.visit("/login");
  });

  it("allows a client to apply to a course and submit a project", function () {
    const { access_token, id, email } = this.logins.client;
    let courseDetailsCallCount = 0;
    let projectFetchCount = 0;

    // Mock client login
    cy.intercept("POST", "/api/client/login", {
      statusCode: 200,
      body: { access_token, user: "client", id },
    }).as("clientLogin");

    // Mock client details
    cy.intercept("GET", `/api/client/details/${id}`, {
      statusCode: 200,
      body: this.userdetails.client,
    }).as("clientDetails");

    cy.intercept("GET", "/api/course/search?query=BABS3121", {
      statusCode: 200,
      body: [this.courses.BABS3121],
    }).as("searchCourse");

    cy.intercept("GET", "/api/client/subcourse/all", (req) => {
      courseDetailsCallCount++;
      if (courseDetailsCallCount <= 1) {
        req.reply({
          statusCode: 200,
          body: [],
        });
      } else {
        req.reply({
          statusCode: 200,
          body: [this.subcourses.BABS3121T1],
        });
      }
    }).as("getSubcourses");

    cy.intercept("GET", "/api/course/details/BABS3121", (req) => {
      courseDetailsCallCount++;
      if (courseDetailsCallCount <= 2) {
        req.reply({
          statusCode: 200,
          body: this.courses.BABS3121,
        });
      } else if (courseDetailsCallCount <= 3) {
        const updatedCourse = {
          ...this.courses.BABS3121,
          clients: [id],
        };
        req.reply({
          statusCode: 200,
          body: updatedCourse,
        });
      } else {
        const courseWithProject = {
          ...this.courses.BABS3121,
          clients: [id],
          projects: [...this.courses.BABS3121.projects, "project_004"],
        };
        req.reply({
          statusCode: 200,
          body: courseWithProject,
        });
      }
    }).as("getCourseDetails");

    cy.intercept("GET", "/api/subcourse/BABS3121T1", {
      statusCode: 200,
      body: this.subcourses.BABS3121T1,
    }).as("getSubcourseDetails");

    cy.intercept(
      "GET",
      `/api/client/projects?clientId=${id}&courseId=BABS3121T1`,
      (req) => {
        projectFetchCount++;
        if (projectFetchCount === 1) {
          req.reply({
            statusCode: 200,
            body: [this.projects.project6],
          });
        } else {
          req.reply({
            statusCode: 200,
            body: [this.projects.project6, this.projects.project10],
          });
        }
      },
    ).as("getProjects");

    cy.intercept("GET", "/api/course/client/questionnaire/BABS3121T1", {
      statusCode: 200,
      body: this.courses.BABS3121.def_client_questionaire,
    }).as("getProjectQuestionnaire");

    cy.intercept("POST", "/api/project/create", {
      statusCode: 201,
      body: this.projects.project7,
    }).as("createProject");

    cy.intercept("GET", "/api/course/term-dates/BABS3121T1", {
      statusCode: 200,
      body: this.courses.BABS3121.termDates,
    }).as("getTermDates");

    cy.intercept("GET", "/api/project/profile/project6", {
      statusCode: 200,
      body: this.projects.project6,
    }).as("getProjectData");

    cy.intercept("PUT", "/api/course/addclient", {
      statusCode: 200,
      body: { success: true },
    }).as("clientApply");
    cy.intercept("GET", "/api/project/details/project_004", {
      statusCode: 200,
      body: this.projects.project6,
    }).as("getProjectDetails");

    cy.get("button").contains("Client").click();
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(pwd);
    cy.get("button").contains("LOGIN").click();

    cy.wait("@clientLogin").its("response.statusCode").should("eq", 200);
    cy.wait("@clientDetails").its("response.statusCode").should("eq", 200);
    cy.wait("@getSubcourses").its("response.statusCode").should("eq", 200);

    cy.contains("My Courses").should("exist");

    cy.get("#view").click();
    cy.wait("@getProjects").its("response.statusCode").should("eq", 200);

    cy.contains("My Projects").click();
    cy.wait("@getProjects").its("response.statusCode").should("eq", 200);
    cy.get("#createProject").click();

    cy.wait("@getTermDates").its("response.statusCode").should("eq", 200);
    cy.wait("@getProjectQuestionnaire")
      .its("response.statusCode")
      .should("eq", 200);
    cy.get('input[placeholder="Project Name"]').type("Sample Project");
    cy.get('input[type="checkbox"]').first().check(); // Selects Term 1
    cy.get('textarea[placeholder="Background"]').type(
      "This project aims to develop a new application.",
    );
    cy.get('textarea[placeholder="Required Skills"]').type(
      "JavaScript, React, CSS",
    );
    cy.get('textarea[placeholder="Project Description"]').type(
      "JavaScript, React, CSS",
    );

    cy.get('textarea[placeholder="Outcome"]').type(
      "A fully functional web application.",
    );

    cy.get('input[placeholder="Number of Groups"]').type("3");

    cy.get("select").first().select("AI");

    cy.contains("button", "SUBMIT PROJECT").click();
    cy.contains("button", "GO").click();
  });

  it("allows a client to view their profile", function () {
    const { access_token, id, email } = this.logins.client;

    // Mock client login
    cy.intercept("POST", "/api/client/login", {
      statusCode: 200,
      body: { access_token, user: "client", id },
    }).as("clientLogin");

    cy.intercept("GET", `/api/client/details/${id}`, {
      statusCode: 200,
      body: this.userdetails.client,
    }).as("clientDetails");

    cy.intercept("GET", "/api/client/subcourse/all", {
      statusCode: 200,
      body: [],
    }).as("getSubcourses");

    cy.intercept("POST", "/api/logout", {
      statusCode: 200,
      body: { success: true },
    }).as("logout");

    // Login as client
    cy.get("button").contains("Client").click();
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(pwd);
    cy.get("button").contains("LOGIN").click();

    cy.wait("@clientLogin").its("response.statusCode").should("eq", 200);
    cy.wait("@clientDetails").its("response.statusCode").should("eq", 200);
    cy.wait("@getSubcourses").its("response.statusCode").should("eq", 200);

    // Verify we're on the dashboard
    cy.url().should("include", "/dash");
    cy.contains("DASHBOARD").should("be.visible");

    // Interact with the navbar dropdown to view profile
    cy.get(".dropdown-hover").within(() => {
      // Click the profile button to open the dropdown
      cy.get(".btn.bg-transparent").click();
      // Click the "View Profile" option
      cy.contains("View Profile").click();
    });

    cy.url().should("include", "/client/profile");

    cy.contains("TestCompany123").should("be.visible");
    cy.contains("h@gmail.com").should("be.visible");

    cy.contains("Logout").click();
  });
  it("allows a client to edit their profile", function () {
    const { access_token, id, email } = this.logins.client;

    // Mock client login
    cy.intercept("POST", "/api/client/login", {
      statusCode: 200,
      body: { access_token, user: "client", id },
    }).as("clientLogin");
    cy.intercept("GET", `/api/client/details/${id}`, {
      statusCode: 200,
      body: this.userdetails.client,
    }).as("clientDetails");

    cy.intercept("GET", "/api/client/subcourse/all", {
      statusCode: 200,
      body: [this.subcourses.BABS3121T1],
    }).as("getSubcourses");

    cy.intercept("GET", `/api/client/details/${id}`, {
      statusCode: 200,
      body: this.userdetails.client,
    }).as("clientDetails");

    cy.intercept("PUT", `/api/client/update/${id}`, (req) => {
      const { name } = req.body;
      if (name && name.length > 0) {
        req.reply({
          statusCode: 200,
          body: { ...this.userdetails.client, name },
        });
      } else {
        req.reply({
          statusCode: 400,
          body: { error: "Invalid name" },
        });
      }
    }).as("updateClient");

    cy.get("button").contains("Client").click();
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(pwd);
    cy.get("button").contains("LOGIN").click();

    cy.wait("@clientLogin").its("response.statusCode").should("eq", 200);
    cy.wait("@clientDetails").its("response.statusCode").should("eq", 200);
    cy.wait("@getSubcourses").its("response.statusCode").should("eq", 200);

    cy.url().should("include", "/dash");
    cy.contains("DASHBOARD").should("be.visible");

    cy.get(".dropdown-hover").within(() => {
      cy.get(".btn.bg-transparent").click();

      cy.contains("View Profile").click();
    });

    cy.url().should("include", "/client/profile");

    cy.contains("TestCompany123").should("be.visible");
    cy.contains("h@gmail.com").should("be.visible");

    cy.contains("Edit").click();
    cy.get("#name-input").clear().type("Alex Jo");
    cy.contains("Save").click();
  });
});
