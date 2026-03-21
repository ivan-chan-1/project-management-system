/// <reference types="cypress" />

describe("User Register & Login (mocked)", () => {
  const pwd = "securePassword123";

  beforeEach(function () {
    cy.visit("/login");
    cy.fixture("registers.json").as("regs");
    cy.fixture("logins.json").as("logins");
    cy.fixture("userdetails.json").as("userdetails");
  });

  it("mocks staff registration", function () {
    cy.intercept("POST", "/api/staff/register", {
      statusCode: 201,
      body: this.regs.staff,
    }).as("staffReg");

    cy.get("button").contains("Staff").click();
    cy.get("span").contains("Register here").click();
    cy.get('input[name="firstName"]').type(this.regs.staff.firstName);
    cy.get('input[name="lastName"]').type(this.regs.staff.lastName);
    cy.get('input[name="zid"]').type(this.regs.staff.zid);
    cy.get('input[name="email"]').type(this.regs.staff.email);
    cy.get('input[name="password"]').type(pwd);
    cy.get('input[name="confirmPassword"]').type(pwd);
    cy.get("button").contains("SUBMIT").click();

    cy.wait("@staffReg").its("response.statusCode").should("eq", 201);
    cy.contains("Registration successful").should("exist");
  });

  it("should allow a staff member to log in", function () {
    const { access_token, id, email } = this.logins.staff;

    cy.intercept("POST", "/api/staff/login", {
      statusCode: 200,
      body: {
        access_token,
        user: "staff",
        id,
      },
    }).as("staffLogin");

    cy.intercept("GET", `/api/staff/details/${id}`, {
      statusCode: 200,
      body: this.userdetails.staff,
    }).as("staffDetails");

    cy.get("button").contains("Staff").click();
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(pwd);
    cy.get("button").contains("LOGIN").click();

    // assert stub was called & returned 200
    cy.wait("@staffLogin").its("response.statusCode").should("eq", 200);

    cy.wait("@staffDetails").its("response.statusCode").should("eq", 200);

    // check localStorage got the token
    cy.window().its("localStorage.token").should("eq", access_token);

    // store the user in local storage
    cy.window().its("localStorage.user").should("eq", "staff");

    // final landing‐page assertion
    cy.contains("My Courses").should("exist");
  });

  it("mocks student registration", function () {
    cy.intercept("POST", "/api/student/register", {
      statusCode: 201,
      body: this.regs.student,
    }).as("studentReg");

    cy.get("button").contains("Student").click();
    cy.get("span").contains("Register here").click();
    cy.get('input[name="firstName"]').type(this.regs.student.firstName);
    cy.get('input[name="lastName"]').type(this.regs.student.lastName);
    cy.get('input[name="zid"]').type(this.regs.student.zid);
    cy.get('input[name="email"]').type(this.regs.student.email);
    cy.get('input[name="password"]').type(pwd);
    cy.get('input[name="confirmPassword"]').type(pwd);
    cy.get("button").contains("SUBMIT").click();

    cy.wait("@studentReg").its("response.statusCode").should("eq", 201);
    cy.contains("Registration successful").should("exist");
  });

  it("should allow a student to log in and fetch their details", function () {
    // pull from your fixture
    const { access_token, id, email } = this.logins.student;

    // stub the login POST
    cy.intercept("POST", "/api/student/login", {
      statusCode: 200,
      body: { access_token, user: "student", id },
    }).as("studentLogin");

    // stub the details GET
    cy.intercept("GET", `/api/student/details/${id}`, {
      statusCode: 200,
      body: this.userdetails.student,
    }).as("studentDetails");

    cy.get("button").contains("Student").click();
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(pwd);
    cy.get("button").contains("LOGIN").click();

    cy.wait("@studentLogin").its("response.statusCode").should("eq", 200);
    cy.wait("@studentDetails").its("response.statusCode").should("eq", 200);

    cy.window().its("localStorage.token").should("eq", access_token);
    cy.window().its("localStorage.user").should("eq", "student");

    cy.contains("My Courses").should("exist");
  });

  it("mocks client registration", function () {
    cy.intercept("POST", "/api/client/register", {
      statusCode: 201,
      body: this.regs.client,
    }).as("clientReg");

    cy.get("button").contains("Client").click();
    cy.get("span").contains("Register here").click();
    cy.get('input[name="firstName"]').type(this.regs.client.firstName);
    cy.get('input[name="lastName"]').type(this.regs.client.lastName);
    cy.get('input[name="email"]').type(this.regs.client.email);
    cy.get('input[name="phone"]').type(this.regs.client.phone);
    cy.get('input[name="password"]').type(pwd);
    cy.get('input[name="confirmPassword"]').type(pwd);
    cy.get("button").contains("NEXT").click();

    cy.get('input[name="companyName"]').type(this.regs.client.companyName);
    cy.get('input[name="companyABN"]').type(this.regs.client.companyABN);
    cy.get('input[name="industry"]').type(this.regs.client.industry);
    cy.get('input[name="contactHours"]').type(this.regs.client.contactHours);
    cy.get("button").contains("SUBMIT").click();

    cy.wait("@clientReg").its("response.statusCode").should("eq", 201);
    cy.contains("Registration successful").should("exist");
  });

  it("should allow a client to log in and fetch their details", function () {
    const { access_token, id, email } = this.logins.client;

    cy.intercept("POST", "/api/client/login", {
      statusCode: 200,
      body: { access_token, user: "client", id },
    }).as("clientLogin");

    cy.intercept("GET", `/api/client/details/${id}`, {
      statusCode: 200,
      body: this.userdetails.client,
    }).as("clientDetails");

    cy.get("button").contains("Client").click();
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(pwd);
    cy.get("button").contains("LOGIN").click();

    cy.wait("@clientLogin").its("response.statusCode").should("eq", 200);
    cy.wait("@clientDetails").its("response.statusCode").should("eq", 200);

    cy.window().its("localStorage.token").should("eq", access_token);
    cy.window().its("localStorage.user").should("eq", "client");

    cy.contains("My Courses").should("exist");
  });
});
