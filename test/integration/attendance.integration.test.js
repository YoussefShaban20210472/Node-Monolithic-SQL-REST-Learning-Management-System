const {
  app,
  request,
  createUser,
  createCourse,
  createLesson,
  generateRandomString,
  adminUser,
  studentUser,
  instructorUser,
  createAndLoginUser,
  getToken,
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
jest.setTimeout(100000);
const commonInvalids = [
  "01",
  "010",
  "000015550",
  "000015550000000000",
  "-123",
  "+123000",
  "05",
  "0000010",
  "096",
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
const requiredFields = ["student_id", "otp"];

let adminToken, instructorToken, studentToken, studentId, courseId;
let unauthorizedInstructorToken, unauthorizedStudentToken;
let lessonId, otp;
beforeAll(async () => {
  adminToken = await getToken(adminUser);
  instructorToken = await getToken(instructorUser);
  studentToken = await getToken(studentUser);
  let response = await request(app)
    .get(`/user/me`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send();
  expect(response.status).toBe(200);
  studentId = response.body.user.id;
  unauthorizedInstructorToken = await createAndLoginUser(
    createUser("instructor"),
  );
  unauthorizedStudentToken = await createAndLoginUser(createUser("student"));
  const course = createCourse();
  response = await request(app)
    .post("/course")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(course);
  expect(response.status).toBe(201);
  courseId = response.body.course.id;
  await enrollStudent(adminToken, studentToken, courseId);

  const lesson = createLesson();
  response = await request(app)
    .post(`/course/${courseId}/lesson`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(lesson);
  expect(response.status).toBe(201);
  lessonId = response.body.lesson.id;
  otp = response.body.lesson.otp;

  response = await request(app)
    .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send({ otp });
  expect(response.status).toBe(201);
});
const roles = [
  { name: "admin", token: () => adminToken },
  { name: "student", token: () => studentToken },
];
describe("Testing Post /course/:course_id/lesson/:lesson_id/attendance", () => {
  describe("Positive Testing", () => {
    let studentToken, studentId;
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        body: () => {
          return { otp, student_id: `${studentId}` };
        },
      },
      {
        name: "student",
        token: () => studentToken,
        body: () => {
          return { otp };
        },
      },
    ];
    roles.forEach((role) => {
      it(`Should allow student to attendance a lesson (${role.name})`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(role.body());
        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/99999999/lesson/${lessonId}/attendance`,
        roles,
        () => {
          return { otp, student_id: `${studentId}` };
        },
        (req, url) => req.post(url),
      );
    });
    describe("Should return 404 if the lesson is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/lesson/99999999/attendance`,
        roles,
        () => {
          return { otp, student_id: `${studentId}` };
        },
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/${lessonId}/attendance`,
        roles,
        () => {
          return { otp, student_id: `${studentId}` };
        },
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if the lesson id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/lesson/invalid-id/attendance`,
        roles,
        () => {
          return { otp, student_id: `${studentId}` };
        },
        (req, url) => req.post(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance`,
        () => {
          return { otp, student_id: `${studentId}` };
        },
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
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance`,
        roles,
        (req, url) => req.post(url),
      );
    });
    describe("Attendance Body validation (Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance`,
        [roles[0]],
        requiredFields,
        [],
        commonInvalids,
        () => {
          return { student_id: "1", otp };
        },
        (req, url) => req.post(url),
      );
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance`,
        [roles[1]],
        ["otp"],
        [],
        commonInvalids,
        () => {
          return { otp };
        },
        (req, url) => req.post(url),
      );
    });
  });
  describe("Negative Testing", () => {
    let studentToken, studentId;
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        body: () => {
          return { otp, student_id: `${studentId}` };
        },
      },
      {
        name: "student",
        token: () => studentToken,
        body: () => {
          return { otp };
        },
      },
    ];
    describe("Should return 409 if a student tries to attendance twice to a same lesson.", () => {
      roles.forEach((role) => {
        it(`Should return 409 if a student tries to attendance twice to a same lesson (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(201);
          response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(409);
        });
      });
    });
    describe("Should return 400 if the otp of the lesson is wrong", () => {
      roles.forEach((role) => {
        it(`Should return 400 if the otp of the lesson is wrong (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send({ ...[role.body()], otp: "1000000000000000000000" });
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/lesson/:lesson_id/attendance", () => {
  const roles = [
    {
      name: "admin",
      token: () => adminToken,
      body: () => {
        return { student_id: `${studentId}` };
      },
    },
    {
      name: "instructor",
      token: () => instructorToken,
      body: () => {
        return { student_id: `${studentId}` };
      },
    },
    {
      name: "student",
      token: () => studentToken,
      body: () => {
        return {};
      },
    },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`Should allow ${role.name} to get an attendance`, async () => {
        let response = await request(app)
          .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(role.body());
        expect(response.status).toBe(200);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/99999999/lesson/${lessonId}/attendance`,
        roles,
        () => {
          return { student_id: `${studentId}` };
        },
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the lesson is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/lesson/99999999/attendance`,
        roles,
        () => {
          return { student_id: `${studentId}` };
        },
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/${lessonId}/attendance`,
        roles,
        () => {
          return { student_id: `${studentId}` };
        },
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the lesson id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/lesson/invalid-id/attendance`,
        roles,
        () => {
          return { student_id: `${studentId}` };
        },
        (req, url) => req.get(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance`,
        () => {
          return { student_id: `${studentId}` };
        },
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
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance`,
        roles.slice(0, 2),
        (req, url) => req.get(url),
      );
    });
    describe("Attendance Body validation (Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance`,
        roles.slice(0, 2),
        ["student_id"],
        [],
        commonInvalids,
        () => {
          return { student_id: "1" };
        },
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the attendance is not found", () => {
      let studentToken, studentId;
      beforeAll(async () => {
        studentToken = await createAndLoginUser(createUser("student"));
        await enrollStudent(adminToken, studentToken, courseId);
        response = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        expect(response.status).toBe(200);
        studentId = response.body.user.id;
      });
      const roles = [
        {
          name: "admin",
          token: () => adminToken,
          body: () => {
            return { student_id: `${studentId}` };
          },
        },
        {
          name: "instructor",
          token: () => instructorToken,
          body: () => {
            return { student_id: `${studentId}` };
          },
        },
        {
          name: "student",
          token: () => studentToken,
          body: () => {
            return {};
          },
        },
      ];
      roles.forEach((role) => {
        it(`Should return 404 if the attendance is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(404);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/lesson/:lesson_id/attendance/all", () => {
  const roles = [
    {
      name: "admin",
      token: () => adminToken,
    },
    {
      name: "instructor",
      token: () => instructorToken,
    },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`Should allow ${role.name} to get all attendances`, async () => {
        let response = await request(app)
          .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(response.status).toBe(200);
        expect(response.body.attendances.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    let studentToken, studentId;
    let lessonId, otp;
    beforeAll(async () => {
      const lesson = createLesson();
      response = await request(app)
        .post(`/course/${courseId}/lesson`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(lesson);
      expect(response.status).toBe(201);
      lessonId = response.body.lesson.id;
      otp = response.body.lesson.otp;

      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;

      response = await request(app)
        .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ otp });
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/99999999/lesson/${lessonId}/attendance/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the lesson is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/lesson/99999999/attendance/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/lesson/${lessonId}/attendance/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the lesson id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/lesson/invalid-id/attendance/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/lesson/${lessonId}/attendance/all`,
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
    describe("Should return [] if the attendances is empty", () => {
      let lessonId;
      beforeAll(async () => {
        const lesson = createLesson();
        let response = await request(app)
          .post(`/course/${courseId}/lesson`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(lesson);
        expect(response.status).toBe(201);
        lessonId = response.body.lesson.id;
      });
      roles.forEach((role) => {
        if (role.name == "student") return;
        it(`Should return 404 if the attendance is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(200);
          expect(response.body.attendances.length).toBe(0);
        });
      });
    });
  });
});
