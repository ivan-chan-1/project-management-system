/// <reference types="cypress" />
import projects from "../../fixtures/project.json";
import userDetailsRaw from "../../fixtures/userdetails.json";
import groupRaw from "../../fixtures/group.json";

describe("Student Dashboard Page (fixed)", () => {
  const subcourseId = "68097aabb19b3262e2a01389";
  const userId = "424242";
  const groupId = "68097aacb19b3262e2a0138b";
  const token = "fake-token";
  const courseId = "fake-course-id";

  const searchProjects = projects.filter(
    (p) => p.name === "GreenTrack – Smart Plant Monitoring System",
  );

  beforeEach(function () {
    cy.intercept("GET", `/api/projects/${subcourseId}`, {
      body: projects,
    }).as("getProjects");

    cy.intercept("GET", `/api/student/details/${userId}`, {
      body: userDetailsRaw.student,
    }).as("getUserData");

    cy.intercept("GET", `/api/group/details/${groupId}`, {
      body: groupRaw[0],
    }).as("getGroupData");

    cy.intercept(
      "GET",
      `/api/project/search?query=*&subcourse_id=${subcourseId}`,
      { body: searchProjects },
    ).as("searchProjects");

    // Seed localStorage and visit
    cy.visit(`/student/dashboard/${courseId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", token);
        win.localStorage.setItem("subcourse", subcourseId);
        win.localStorage.setItem("user", "student");
        win.localStorage.setItem("id", userId);
      },
    });
  });

  it("renders all projects and group info", function () {
    // wait for the three initial calls
    cy.wait("@getProjects");
    cy.wait("@getUserData");
    cy.wait("@getGroupData");

    // assert the correct number of cards
    cy.get(".grid > *").should("have.length", projects.length);

    // assert the actual names from your fixture
    cy.contains("SmartScan Road Insights").should("be.visible");
    cy.contains("GreenTrack – Smart Plant Monitoring System").should(
      "be.visible",
    );

    // check StudentInfoCard shows the right group info
    cy.get(".flex.flex-row.items-center")
      .eq(0)
      .within(() => {
        // group name from your fixture
        cy.contains(groupRaw[0].name).should("be.visible");
        // status badge
        cy.contains("IN A GROUP").should("be.visible");
      });

    // check the project card shows the right project info
    cy.get(".flex.flex-row.items-center")
      .eq(1)
      .within(() => {
        cy.contains("My Project").should("be.visible");
        cy.contains("ALLOCATED").should("be.visible");
      });
  });

  it("navigates to preference when heart is clicked", () => {
    // stub the preference and wishlist GETs
    cy.intercept("GET", `/api/student/preference/${subcourseId}/${userId}`, {
      fixture: "preferences.json",
    }).as("getPreferences");
    cy.intercept("GET", `/api/student/wishlist/${subcourseId}/${userId}`, {
      fixture: "wishlists.json",
    }).as("getWishlist");

    cy.get("#wish-list").click();
    cy.url().should("include", "/student/preference");

    cy.wait("@getPreferences");
    cy.wait("@getWishlist");

    // 5) Page title is shown
    cy.contains("My Project Preferences").should("exist");

    // 6) Preferences from fixture are rendered
    cy.fixture("preferences.json").then((prefs) => {
      prefs.forEach((p) => {
        // we assume ProjectPreferencer renders the notes text
        cy.contains(p.notes).should("exist");
      });
    });

    cy.fixture("wishlists.json").then((arr) => {
      const firstUser = arr[0];

      firstUser.wishlist.forEach((w) => {
        cy.contains(w.name).should("exist");
      });
    });
  });

  it("filters projects via search", function () {
    cy.contains("SmartScan Road Insights").should("exist");
    cy.contains("GreenTrack – Smart Plant Monitoring System").should("exist");

    // type a search term
    cy.get("input[type=text]").type("GreenTrack");
    // click the search button
    cy.get("#search-button").click();

    cy.contains("SmartScan Road Insights").should("not.exist");
    cy.contains("GreenTrack – Smart Plant Monitoring System").should("exist");
  });

  it("if the user does not exist in a group", function () {
    cy.intercept("GET", `/api/student/details/${userId}`, {
      statusCode: 200,
      body: {
        ...userDetailsRaw.student,
        subcourses: [
          {
            subcourse: "68097aabb19b3262e2a01389",
            tutorial: "H12A",
            group: null,
            draft_alloc: null,
            wishlist: [
              "680981ba9caa0cce193734db",
              "68098359474776cb88a817b0",
              "6809848ca7ee7d353764f457",
            ],
            preferences: [],
          },
        ],
      },
    }).as("getUserData");

    cy.intercept("GET", `/api/group/details/${groupId}`, () => {
      throw new Error("student/details should NOT be fetched in this scenario");
    });

    // reload so the dashboard re‐fetches group details
    cy.reload();
    cy.wait("@getUserData");

    // assert the “not in group” state appears
    // adjust the selector/text to match your actual UI
    cy.contains("NOT IN A GROUP").should("be.visible");

    // load the group and tutorial data
    cy.intercept("GET", `/api/subcourse/groups/${subcourseId}`, {
      fixture: "group.json",
    }).as("getAllGroups");

    cy.intercept("GET", `/api/student/tutorial/${userId}/${subcourseId}`, {
      body: userDetailsRaw.student.subcourses[0].tutorial,
    }).as("getStudentTutorial");

    // if i click into the group then it loads all groups table
    cy.get("#group-button").click();

    cy.wait("@getAllGroups");

    cy.contains("All Groups").should("exist");

    // check only one group loads aka the tr label is only loaded once
    cy.get("table tbody tr").should("have.length", 1);

    cy.get("table tbody tr").within(() => {
      cy.contains("H12A-APPLE").should("exist");
      cy.contains("Test Student").should("exist");
      cy.get('[data-cy="join-button"]').should("have.length", 1);
    });
  });
});
