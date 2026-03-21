/// <reference types="cypress" />

describe("AllMembers Page", () => {
  beforeEach(() => {
    const token = "fakeToken";
    const user = "staff";
    const subcourseId = "fakeSubcourseId";
    const id = "fakeUserId";
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("user", user);
    window.localStorage.setItem("subcourse", subcourseId);
    window.localStorage.setItem("token", "fakeToken");
    window.localStorage.setItem("id", id);

    cy.fixture("staff_userdetails.json").then((userData) => {
      cy.intercept("GET", `/api/staff/details/${id}`, {
        statusCode: 200,
        body: userData,
      }).as("getUserData");
    });

    cy.fixture("members.json").then((members) => {
      cy.intercept("GET", `/api/admin/subcourse/members/${subcourseId}`, {
        statusCode: 200,
        body: members,
      }).as("getAllSubcourseMembers");
    });

    cy.intercept("GET", `/api/subcourse/${subcourseId}/active`, {
      statusCode: 200,
      body: { active: true },
    }).as("isActive");

    cy.intercept("DELETE", "/api/student/remove*", {
      statusCode: 200,
      body: {},
    }).as("deleteMember");

    cy.intercept("POST", "/api/staff/subcourse/add-students", {
      statusCode: 200,
      body: {},
    }).as("addStudents");

    cy.visit("/admin/allstudents");
  });

  it("should load members", function () {
    cy.wait("@getUserData");
    cy.wait("@getAllSubcourseMembers");
    cy.wait("@isActive");

    // Should display stats
    cy.contains("Students").should("exist");
    cy.contains("Staff").should("exist");

    // Should list members
    cy.contains("John Doe").should("exist");
    cy.contains("Jane Smith").should("exist");
  });

  it("should allow searching", function () {
    cy.wait("@getUserData");
    cy.wait("@getAllSubcourseMembers");
    cy.wait("@isActive");

    cy.get('input[name="search-bar"]').type("Jane");
    cy.contains("John Doe").should("not.exist");
    cy.contains("Jane Smith").should("exist");
    cy.contains("Jane Doe").should("exist");
  });

  it("should filter members by tutorial", function () {
    cy.wait("@getUserData");
    cy.wait("@getAllSubcourseMembers");
    cy.wait("@isActive");

    // Open the filter dropdown
    cy.get('div[class*="dropdown-end"]').first().click();

    // Click the tutorial filter
    cy.get('input[aria-label="W10A"]').click({ force: true });

    // Now check that only members from H12A are shown
    cy.contains("John Doe").should("exist");
    cy.contains("Jane Smith").should("not.exist");
    cy.contains("Jane Doe").should("not.exist");
    // Reset the filter
    cy.get('input[type="reset"]').click({ force: true });

    // All members should reappear
    cy.contains("John Doe").should("exist");
    cy.contains("Jane Smith").should("exist");
  });

  it("should allow deletion", function () {
    cy.wait("@getUserData");
    cy.wait("@getAllSubcourseMembers");
    cy.wait("@isActive");

    // Click remove member
    cy.contains("John Doe")
      .parents("tr")
      .within(() => {
        cy.contains("Delete").click();
      });

    // Confirm deletion
    cy.wait("@deleteMember");

    // After deletion, John Doe should not exist
    cy.contains("John Doe").should("not.exist");
  });

  it("should allow inviting students", function () {
    cy.wait("@getUserData");
    cy.wait("@getAllSubcourseMembers");
    cy.wait("@isActive");

    cy.contains("Manage").click();
    cy.contains("Invite/Update Students").click();
    cy.url().should("include", "/course/invite/student");

    const invite = "Nikki Qin, z1111111@ad.unsw.edu.au, z1111111, H12A";
    cy.get('textarea[name="members"]').type(invite);
    cy.contains("NEXT").click();
  });

  it("should allow inviting tutors", function () {
    cy.wait("@getUserData");
    cy.wait("@getAllSubcourseMembers");
    cy.wait("@isActive");

    cy.contains("Manage").click();
    cy.contains("Invite/Update Tutors").click();
    cy.url().should("include", "/course/invite/tutor");

    const invite = "Nikki Tutor, z1111111@ad.unsw.edu.au, z1111112, H12A";
    cy.get('textarea[name="members"]').type(invite);
    cy.contains("SUBMIT").click();
  });
});
