// cypress/e2e/groups_page.cy.ts
/// <reference types="cypress" />
import userDetailsRaw from "../../fixtures/userdetails.json";
import groups from "../../fixtures/group.json";

describe("Groups Page", () => {
  const subcourseId = "68097aabb19b3262e2a01389";
  const userId = "424242";
  const token = "fake-token";
  const groupId = "68097aacb19b3262e2a0138b";

  beforeEach(function () {
    const courseId = "fake-course-id";
    // stub the groups list
    cy.fixture("group.json").then((groupsData) => {
      cy.intercept("GET", `/api/subcourse/groups/${subcourseId}`, {
        body: groupsData,
      }).as("getAllGroups");
    });

    // stub projects list
    cy.fixture("project.json").then((projectsData) => {
      cy.intercept("GET", `/api/projects/${subcourseId}`, {
        body: projectsData,
      }).as("getProjects");
    });

    // stub the student tutorial
    cy.intercept("GET", `/api/student/tutorial/${userId}/${subcourseId}`, {
      body: "T1",
    }).as("getStudentTutorial");

    cy.fixture("preferences.json").then((prefData) => {
      cy.intercept("GET", `/api/group/preference/${groupId}`, {
        body: prefData,
      }).as("getGroupPreferences");
    });

    // loading the group profile
    cy.intercept("GET", `/api/group/details/${groupId}`, {
      body: groups[0],
    }).as("getGroupDetails");

    // stub the user details
    cy.fixture("userdetails.json").as("userDetails");

    // stub the group details
    cy.fixture("group.json").as("groupData");

    // seed localStorage and visit the page
    cy.visit(`/student/dashboard/${courseId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", token);
        win.localStorage.setItem("subcourse", subcourseId);
        win.localStorage.setItem("user", "student");
        win.localStorage.setItem("id", userId);
      },
    });
  });

  it("renders the table with all groups and allows joining", () => {
    cy.intercept("GET", `/api/student/details/${userId}`, {
      statusCode: 200,
      body: {
        ...userDetailsRaw.student,
        subcourses: [
          {
            subcourse: subcourseId,
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
    cy.wait("@getUserData");
    cy.wait("@getProjects");

    cy.contains("NOT IN A GROUP").should("be.visible");

    cy.contains("Find a project").should("exist");

    cy.get("#group-button").click();
    cy.contains("All Groups").should("be.visible");

    cy.wait("@getAllGroups");
    cy.wait("@getStudentTutorial");

    // page title
    cy.contains("All Groups").should("be.visible");

    // table headings
    cy.get("table thead th").then(($ths) => {
      const titles = Array.from($ths, (th) => th.innerText.trim());
      expect(titles).to.eql([
        "Group Name",
        "Tutorial",
        "Count",
        "Bio",
        "Members",
        "",
      ]);
    });

    // now pull in the fixture again for assertions
    cy.fixture("group.json").then((groups) => {
      // number of rows matches fixture length
      cy.get("table tbody tr").should("have.length", groups.length);

      // each row’s contents
      groups.forEach((g, i) => {
        cy.get("table tbody tr")
          .eq(i)
          .within(() => {
            cy.contains(g.name).should("exist");
            cy.contains(g.tutorial).should("exist");
            cy.contains(`${g.members.length}/6`).should("exist");
            if (g.bio) cy.contains(g.bio).should("exist");
            g.members.forEach((m) => {
              cy.contains(m.name).should("exist");
            });
          });
      });

      // clicking "Join" on the first row
      cy.get("table tbody tr").first().find("button").click();
      cy.url().should("include", `/group/profile/${groups[0].id}`);
    });

  });
});
