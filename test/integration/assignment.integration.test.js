const {
  app,
  request,
  createUser,
  createCourse,
  createAssignment,
  createDateTime,
  generateRandomString,
  adminUser,
  studentUser,
  instructorUser,
  createAndLoginUser,
  getToken,
  duriationFieldInvalids,
  enrollStudent,
} = require("../utils/testingUtils");
const {
  testInvalidBodyRequest,
  testInvalidObjectCreationRequest,
  testInvalidObjectUpdateRequest,
  testInvalidAuthenticationAndAuthorizationRequest,
  testNotFoundObjectRequest,
  testInvalidObjectIDFormatRequest,
  testUpdateOneFieldInObjectRequest,
  testUpdateManyFieldsInObjectRequest,
  testInvalidObjectDuriationRequest,
} = require("../utils/preMadeTests");
jest.setTimeout(30000);
const commonInvalids = [
  "123",
  "123000",
  "5",
  "10",
  "96",
  generateRandomString(501),
  generateRandomString(700),
  generateRandomString(1000),
  generateRandomString(3),
  generateRandomString(10) + "123546",
  -123,
  123,
  -5.999,
  -0.1999,
  200.1999,
  100.1999,
  110.1999,
  910.1999,
  "a",
  "aa",
  "@#$dadsadad@#",
  ".1000",
  null,
  true,
  false,
  generateRandomString(50) + "@" + generateRandomString(10) + ".",
  "A@A.A",
  [],
  [1, 2],
  ["Sadda", 0],
  [true],
  [null],
  "2021-01-01T00:00:00Z",
  "2020-01-01T00:00:00Z",
  "2000-01-01T00:00:00Z",
  "2029-01-01T00:00:00Z",
  "2030-01-01T00:00:00Z",
  "2110-01-01T00:00:00Z",
];
const requiredFields = [
  "title",
  "description",
  "start_date",
  "end_date",
  "score",
];
const fieldInvalids = {
  description: [...commonInvalids.slice(8), "123", "123000", "5", "10", "96"], // too long string example
};
let adminToken, instructorToken, studentToken, courseId;
let unauthorizedInstructorToken, unauthorizedStudentToken;
let assignmentIdToGet;
beforeAll(async () => {
  adminToken = await getToken(adminUser);
  instructorToken = await getToken(instructorUser);
  studentToken = await getToken(studentUser);
  unauthorizedInstructorToken = await createAndLoginUser(
    createUser("instructor"),
  );
  unauthorizedStudentToken = await createAndLoginUser(createUser("student"));
  const course = createCourse();
  response = await request(app)
    .post("/course")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(course);
  courseId = response.body.course.id;

  await enrollStudent(adminToken, studentToken, courseId);

  const assignment = createAssignment();
  response = await request(app)
    .post(`/course/${courseId}/assignment`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(assignment);
  expect(response.status).toBe(201);
  assignmentIdToGet = response.body.assignment.id;
});
const roles = [
  { name: "admin", token: () => adminToken },
  { name: "instructor", token: () => instructorToken },
];
describe("Testing Post /course/:course_id/assignment", () => {
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const assignment = createAssignment();
      it(`Should allow ${role.name} to create a new assignment`, async () => {
        response = await request(app)
          .post(`/course/${courseId}/assignment`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(assignment);
        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/assignment`,
        roles,
        createAssignment,
        (req, url) => req.post(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/assignment`,
        createAssignment,
        [
          { name: "authorized student user", token: () => studentToken },
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.post(url),
      );
    });
    describe("Should return 404 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/assignment`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/assignment`,
        roles,
        (req, url) => req.post(url),
      );
    });
    describe("Assignment creation validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/assignment`,
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
        createAssignment,
      );
    });
    describe("Assignment Duriation validation", () => {
      testInvalidObjectDuriationRequest(
        () => `/course/${courseId}/assignment`,
        roles,
        createAssignment,
        duriationFieldInvalids,
        (req, url) => req.post(url),
      );
    });
  });
});

describe("Testing Delete /course/:course_id/assignment/:assignment_id", () => {
  describe("Positive Testing", () => {
    let assignmentIdToDelete;
    beforeEach(async () => {
      const assignment = createAssignment();
      let response = await request(app)
        .post(`/course/${courseId}/assignment`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(assignment);
      assignmentIdToDelete = response.body.assignment.id;
    });
    roles.forEach((role) => {
      it(`should allow ${role.name} to delete a assignment by id`, async () => {
        const res = await request(app)
          .delete(`/course/${courseId}/assignment/${assignmentIdToDelete}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
  describe("Negative Testing", () => {
    let assignmentIdToDelete;
    beforeAll(async () => {
      const assignment = createAssignment();
      let response = await request(app)
        .post(`/course/${courseId}/assignment`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(assignment);
      assignmentIdToDelete = response.body.assignment.id;
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/assignment/${assignmentIdToDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/assignment/999999`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/assignment/${assignmentIdToDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/assignment/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToDelete}`,
        () => undefined,
        [
          {
            name: "authorized student user",
            token: () => studentToken,
          },
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.delete(url),
      );
    });
  });
});

describe("Testing Get /course/:course_id/assignment/:assignment_id", () => {
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
    { name: "student", token: () => studentToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get a assignment by id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(`${res.body.assignment.id}`).toBe(`${assignmentIdToGet}`);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/assignment/${assignmentIdToGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/assignment/999999`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/assignment/${assignmentIdToGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/assignment/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToGet}`,
        () => undefined,
        [
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing Get /course/:course_id/assignment/all", () => {
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
    { name: "student", token: () => studentToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get all assignments of given course id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/assignment/all`)
          .set("Authorization", `Bearer ${role.token()}`);
        expect(res.status).toBe(200);
        expect(res.body.assignments.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/assignment/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/assignment/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/assignment/all`,
        () => undefined,
        [
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.get(url),
      );
    });
    describe("Should return [] if the assignments are empty", () => {
      let courseId;
      beforeAll(async () => {
        const course = createCourse();
        response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        expect(response.status).toBe(201);
        courseId = response.body.course.id;
        await enrollStudent(adminToken, studentToken, courseId);
      });
      roles.forEach((role) => {
        it(`Should return [] if the assignments are empty (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/assignment/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(200);
          expect(response.body.assignments.length).toBe(0);
        });
      });
    });
  });
});

describe("Testing Put /course/:course_id/assignment/:assignment_id", () => {
  let assignmentIdToUpdate;
  beforeAll(async () => {
    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    assignmentIdToUpdate = response.body.assignment.id;
  });
  describe("Positive Testing", () => {
    describe("should allow admin and instructor to update only one field in given assignment by id", () => {
      testUpdateOneFieldInObjectRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToUpdate}`,
        roles,
        createAssignment,
        requiredFields,
      );
    });
    describe("should allow admin and instructor to update more than one field in given assignment by id", () => {
      testUpdateManyFieldsInObjectRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToUpdate}`,
        roles,
        createAssignment,
      );
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/9999999/assignment/${assignmentIdToUpdate}`,
        roles,
        createAssignment,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/assignment/99999999`,
        roles,
        createAssignment,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/assignment/${assignmentIdToUpdate}`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/assignment/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToUpdate}`,
        createAssignment,
        [
          { name: "student user", token: () => studentToken },
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToUpdate}`,
        roles,
        (req, url) => req.put(url),
      );
    });
    describe("Assignment update validation (Empty, Invalid)", () => {
      testInvalidObjectUpdateRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToUpdate}`,
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
      );
    });
    describe("Assignment Duriation validation", () => {
      testInvalidObjectDuriationRequest(
        () => `/course/${courseId}/assignment/${assignmentIdToUpdate}`,
        roles,
        createAssignment,
        duriationFieldInvalids,
        (req, url) => req.put(url),
      );
    });
  });
});
