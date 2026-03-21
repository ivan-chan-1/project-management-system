/// <reference types="cypress" />

interface CourseFormData {
  name: string;
  code: string;
  structure: string;
  termDates: Record<string, string>;
  description: string;
}

interface SubcourseFormData {
  name: string;
  term: string;
  year: string;
  code: string;
}

// Course and subcourse creation
describe("Admin Dashboard Page, Course & Subcourse Creation", () => {
  beforeEach(() => {
    cy.fixture("new_course.json").as("courseData");
    cy.fixture("new_subcourse.json").as("subcourseData");
    cy.fixture("staff_subcourses.json").then((subcourses) => {
      cy.intercept("GET", "/api/staff/subcourse/all", {
        statusCode: 200,
        body: subcourses,
      }).as("getSubcourses");
    });

    window.localStorage.setItem("token", "fakeToken");
    window.localStorage.setItem("user", "staff");
    cy.fixture("course_codes.json").then((courseCodes) => {
      cy.intercept("GET", "/api/staff/all-course-codes", {
        statusCode: 200,
        body: courseCodes,
      }).as("getCourseCodes");
    });
    cy.intercept("GET", "/api/course/term-dates/fakeid123", {
      statusCode: 200,
      body: {
        "1": "01-02-2025 to 01-05-2025",
        "2": "01-06-2025 to 01-08-2025",
        "3": "01-09-2025 to 01-12-2026",
      },
    }).as("getTermDates");
    cy.visit("/dash");
    cy.wait("@getSubcourses");
  });

  it("should display courses and allow creating a new course", () => {
    cy.get<CourseFormData>("@courseData").then((data) => {
      cy.contains("My Courses").should("exist");
      cy.contains("COMP3900").should("exist");
      cy.contains("BABS3121").should("exist");
      cy.contains("Archived").should("exist");

      cy.contains("CREATE COURSE").click();
      cy.get("dialog#my_modal_2").should("be.visible");

      cy.contains("CREATE SUBCOURSE").should("exist");
      cy.contains("CREATE NEW COURSE").click();

      cy.url().should("include", "/admin/course/create");
      cy.contains("Create New Course").should("exist");

      cy.get('input[name="name"]').type(data.name);
      cy.get('input[name="code"]').type(data.code);
      cy.get('select[name="structure"]').select(data.structure);

      cy.get("label").contains(`${data.structure} 1 dates:`).should("exist");

      Object.entries(data.termDates).forEach(([termNum, dateRange]) => {
        cy.get(`input[type="checkbox"][data-tag="${termNum}"]`).check({
          force: true,
        });
        cy.get(`input[name="termDates"][data-tag="${termNum}"]`)
          .clear()
          .type(dateRange);
      });

      cy.get("textarea#description").type(data.description);

      cy.intercept("POST", "/api/staff/course/create", {
        statusCode: 200,
        body: {}, // empty body
      }).as("createCourse");

      cy.get('button[type="submit"]').click();
      cy.wait("@createCourse").then((interception) => {
        // Assert api was called with mock response
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.response?.body).to.deep.eq({});
      });
      cy.contains("Your course has been successfully created").should("exist");
    });
  });
  it("should create a new subcourse", () => {
    cy.contains("CREATE COURSE").click();
    cy.get("dialog#my_modal_2").should("be.visible");

    cy.contains("CREATE SUBCOURSE").should("exist");
    cy.contains("CREATE SUBCOURSE").click();

    cy.url().should("include", "/admin/subcourse/create");
    cy.contains("Create New Subcourse").should("exist");

    cy.get<SubcourseFormData>("@subcourseData").then((data) => {
      // Intercept the subcourse creation
      cy.intercept("POST", "/api/staff/subcourse/create", {
        statusCode: 200,
        body: { subcourseId: "fakeSubcourseId124" },
      }).as("createSubcourse");

      // Step 1: Fill form
      cy.get('input[name="name"]').type(data.name);
      cy.get('select[name="code"]').select(data.code);
      cy.get('input[name="term"]').each(($el) => {
        if ($el.val() === "1") {
          cy.wrap($el).check({ force: true });
        }
      });
      cy.get('input[name="year"]').type(data.year);

      cy.intercept("GET", "/api/subcourse/existing*", {
        statusCode: 200,
        body: {},
      }).as("checkSubcourseExists");

      cy.contains("NEXT").click(); // add students
      cy.contains("NEXT").click(); // add tutors

      cy.contains("SUBMIT").click(); // submit

      cy.wait("@createSubcourse").then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);

        expect(interception.request.body).to.deep.include({
          name: data.name,
          code: data.code,
          term: parseInt(data.term),
          year: parseInt(data.year),
        });

        expect(interception.response?.body).to.deep.eq({
          subcourseId: "fakeSubcourseId124",
        });
      });
    });
  });
});
