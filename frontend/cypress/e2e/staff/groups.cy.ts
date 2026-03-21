/// <reference types="cypress" />

describe("AllGroups Page", () => {
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

    cy.fixture("group_details.json").then((groups) => {
      cy.intercept("GET", `/api/subcourse/groups/${subcourseId}`, {
        statusCode: 200,
        body: groups,
      }).as("getGroups");
    });

    cy.intercept("GET", `/api/admin/students/unallocated/${subcourseId}`, {
      statusCode: 200,
      body: 5,
    }).as("getUnallocated");

    cy.intercept("GET", `/api/subcourse/${subcourseId}/active`, {
      statusCode: 200,
      body: { active: true },
    }).as("isActive");

    window.localStorage.setItem("token", "fakeToken");
    window.localStorage.setItem("user", "staff");
    window.localStorage.setItem("subcourse", "fakeSubcourseId");
    window.localStorage.setItem("id", "fakeUserId");

    cy.visit("/admin/allgroups");

    cy.wait("@getUserData");
    cy.wait("@getGroups");
    cy.wait("@getUnallocated");
    cy.wait("@isActive");
  });

  it("should display groups and stats", () => {
    // Check page title
    cy.contains("Groups").should("exist");

    // Check group names
    cy.contains("H12A-APPLE").should("exist");
    cy.contains("H12A-BANANA").should("exist");

    // Check tutorial names
    cy.contains("H12A").should("exist");

    // Check member counts
    cy.contains("2/6").should("exist"); // H12A-APPLE (2 members)
    cy.contains("1/6").should("exist"); // H12A-BANANA (6 members)

    // Check stats
    cy.contains("Unallocated Students").should("exist");
    cy.contains("Available Groups").should("exist");
    cy.contains("Full Groups").should("exist");
  });
});
