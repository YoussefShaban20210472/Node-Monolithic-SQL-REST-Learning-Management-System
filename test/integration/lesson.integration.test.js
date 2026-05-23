const {
  app,
  request,
  createUser,
  createCourse,
  createLesson,
  generateRandomString,
  adminUser,
  instructorUser,
  studentUser,
  createAndLoginUser,
  getToken,
  enrollStudent,
  duriationFieldInvalids,
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
let adminToken, instructorToken, studentToken, courseId;
let unauthorizedInstructorToken, unauthorizedStudentToken;
let lessonIdToGet;
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

  const lesson = createLesson();
  response = await request(app)
    .post(`/course/${courseId}/lesson`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(lesson);
  expect(response.status).toBe(201);
  lessonIdToGet = response.body.lesson.id;
});
const roles = [
  { name: "admin", token: () => adminToken },
  { name: "instructor", token: () => instructorToken },
];

const requiredFields = ["title", "description", "start_date", "end_date"];

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
  123,
  5.999,
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

const fieldInvalids = {
  description: [...commonInvalids.slice(8), "123", "123000", "5", "10", "96"],
};

describe("Testing Post /course/:course_id/lesson", () => {
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const lesson = createLesson();
      it(`Should allow ${role.name} to create a new lesson`, async () => {
        response = await request(app)
          .post(`/course/${courseId}/lesson`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(lesson);
        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/lesson`,
        roles,
        createLesson,
        (req, url) => req.post(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson`,
        createLesson,
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
        () => `/course/invalid-id/lesson`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/lesson`,
        roles,
        (req, url) => req.post(url),
      );
    });
    describe("Lesson creation validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/lesson`,
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
        createLesson,
      );
    });
    describe("Lesson Duriation validation", () => {
      testInvalidObjectDuriationRequest(
        () => `/course/${courseId}/lesson`,
        roles,
        createLesson,
        duriationFieldInvalids,
        (req, url) => req.post(url),
      );
    });
  });
});

describe("Testing Delete /course/:course_id/lesson/:lesson_id", () => {
  describe("Positive Testing", () => {
    let lessonIdToDelete;
    beforeEach(async () => {
      const lesson = createLesson();
      let response = await request(app)
        .post(`/course/${courseId}/lesson`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(lesson);
      lessonIdToDelete = response.body.lesson.id;
    });
    roles.forEach((role) => {
      it(`should allow ${role.name} to delete a lesson by id`, async () => {
        const res = await request(app)
          .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
  describe("Negative Testing", () => {
    let lessonIdToDelete;
    beforeAll(async () => {
      const lesson = createLesson();
      let response = await request(app)
        .post(`/course/${courseId}/lesson`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(lesson);
      lessonIdToDelete = response.body.lesson.id;
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/lesson/${lessonIdToDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the lesson is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/lesson/999999`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/${lessonIdToDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the lesson id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/lesson/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/${lessonIdToDelete}`,
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

describe("Testing Get /course/:course_id/lesson/:lesson_id", () => {
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
    { name: "student", token: () => studentToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get a lesson by id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(`${res.body.lesson.id}`).toBe(`${lessonIdToGet}`);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/lesson/${lessonIdToGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the lesson is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/lesson/999999`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/${lessonIdToGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the lesson id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/lesson/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/${lessonIdToGet}`,
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

describe("Testing Get /course/:course_id/lesson/:lesson_id/otp", () => {
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get the otp of lesson by id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(`${res.body.lesson.id}`).toBe(`${lessonIdToGet}`);
        expect(res.body.lesson).toHaveProperty("otp");
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/lesson/${lessonIdToGet}/otp`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the lesson is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/lesson/999999/otp`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/${lessonIdToGet}/otp`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the lesson id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/lesson/invalid-id/otp`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/${lessonIdToGet}/otp`,
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
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing Get /course/:course_id/lesson/all", () => {
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
    { name: "student", token: () => studentToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get all lessons of given course id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/lesson/all`)
          .set("Authorization", `Bearer ${role.token()}`);
        expect(res.status).toBe(200);
        expect(res.body.lessons.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/lesson/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/all`,
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
    describe("Should return [] if the lessons are empty", () => {
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
        it(`Should return [] if the lessons are empty (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(200);
          expect(response.body.lessons.length).toBe(0);
        });
      });
    });
  });
});

describe("Testing Put /course/:course_id/lesson/:lesson_id", () => {
  let lessonIdToUpdate;
  beforeAll(async () => {
    const lesson = createLesson();
    response = await request(app)
      .post(`/course/${courseId}/lesson`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(lesson);
    lessonIdToUpdate = response.body.lesson.id;
  });
  describe("Positive Testing", () => {
    describe("should allow admin and instructor to update only one field in given lesson by id", () => {
      testUpdateOneFieldInObjectRequest(
        () => `/course/${courseId}/lesson/${lessonIdToUpdate}`,
        roles,
        createLesson,
        requiredFields,
      );
    });
    describe("should allow admin and instructor to update more than one field in given lesson by id", () => {
      testUpdateManyFieldsInObjectRequest(
        () => `/course/${courseId}/lesson/${lessonIdToUpdate}`,
        roles,
        createLesson,
      );
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/9999999/lesson/${lessonIdToUpdate}`,
        roles,
        createLesson,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 404 if the lesson is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/lesson/99999999`,
        roles,
        createLesson,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/${lessonIdToUpdate}`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if the lesson id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/lesson/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/${lessonIdToUpdate}`,
        createLesson,
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
        () => `/course/${courseId}/lesson/${lessonIdToUpdate}`,
        roles,
        (req, url) => req.put(url),
      );
    });
    describe("Lesson update validation (Empty, Invalid)", () => {
      testInvalidObjectUpdateRequest(
        () => `/course/${courseId}/lesson/${lessonIdToUpdate}`,
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
      );
    });
    describe("Lesson Duriation validation", () => {
      testInvalidObjectDuriationRequest(
        () => `/course/${courseId}/lesson/${lessonIdToUpdate}`,
        roles,
        createLesson,
        duriationFieldInvalids,
        (req, url) => req.put(url),
      );
    });
  });
});
