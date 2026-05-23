const {
  app,
  request,
  createUser,
  createCourse,
  generateRandomString,
  adminUser,
  instructorUser,
  studentUser,
  createAndLoginUser,
  getToken,
  enrollStudent,
} = require("../utils/testingUtils");

const {
  testInvalidBodyRequest,
  testInvalidObjectCreationRequest,
  testInvalidAuthenticationAndAuthorizationRequest,
  testNotFoundObjectRequest,
  testInvalidObjectIDFormatRequest,
} = require("../utils/preMadeTests");
jest.setTimeout(30000);
const requiredFields = ["student_id"];
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

let adminToken, instructorToken, studentToken, courseId;

beforeAll(async () => {
  adminToken = await getToken(adminUser);
  instructorToken = await getToken(instructorUser);
  studentToken = await getToken(studentUser);
  const course = createCourse();
  response = await request(app)
    .post("/course")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(course);
  courseId = response.body.course.id;
});

const roles = [
  {
    name: "admin",
    token: () => adminToken,
  },
  {
    name: "student",
    token: () => studentToken,
  },
];
describe("Testing Post /enrollment", () => {
  describe("Positive Testing", () => {
    let studentToken, studentId;
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      studentId = response.body.user.id;
    });

    it("Should allow student to enroll to a course", async () => {
      let response = await request(app)
        .post(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(201);
    });

    it("Should allow admin to enroll a student to a course", async () => {
      let response = await request(app)
        .post(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ student_id: `${studentId}` });
      expect(response.status).toBe(201);
    });
  });
  describe("Negative Testing", () => {
    let studentToken, studentId;
    beforeAll(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      studentId = response.body.user.id;
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999999/enrollment`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/enrollment`,
        () => undefined,
        [{ name: "instructor user", token: () => instructorToken }],
        (req, url) => req.post(url),
      );
    });

    describe("Should return 404 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/enrollment`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/enrollment`,
        [roles[0]],
        (req, url) => req.post(url),
      );
    });
    describe("Enrollment body Validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/enrollment`,
        [roles[0]],
        requiredFields,
        [],
        commonInvalids,
        () => {
          return { student_id: "1" };
        },
      );
    });
    describe("Should return 409 if a student tries to enroll twice to a same course.", () => {
      let studentToken, studentId;
      beforeEach(async () => {
        studentToken = await createAndLoginUser(createUser("student"));
        let response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        studentId = response.body.user.id;
      });
      it("hould return 409 if a student tries to enroll twice to a same course. (student)", async () => {
        let response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        expect(response.status).toBe(409);
      });
      it("hould return 409 if a student tries to enroll twice to a same course. (admin)", async () => {
        let response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ student_id: `${studentId}` });
        response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ student_id: `${studentId}` });
        expect(response.status).toBe(409);
      });
    });
  });
});

describe("Testing Delete /enrollment", () => {
  describe("Positive Testing", () => {
    let studentToken, studentId;
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      studentId = response.body.user.id;
      await enrollStudent(adminToken, studentToken, courseId);
    });
    it("Should allow student to unenroll to a course", async () => {
      let response = await request(app)
        .delete(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
    });
    it("Should allow admin to unenroll a student to a course", async () => {
      let response = await request(app)
        .delete(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ student_id: `${studentId}` });
      expect(response.status).toBe(200);
    });
  });
  describe("Negative Testing", () => {
    let studentToken, studentId;
    beforeAll(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      studentId = response.body.user.id;
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/9999999/enrollment`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/enrollment`,
        () => undefined,
        [{ name: "instructor user", token: () => instructorToken }],
        (req, url) => req.delete(url),
      );
    });

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/enrollment`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the enrollment is not found", () => {
      it("Should return 404 if the enrollment is not found (student)", async () => {
        let response = await request(app)
          .delete(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        expect(response.status).toBe(404);
      });
      it("Should return 404 if the enrollment is not found (admin)", async () => {
        let response = await request(app)
          .delete(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ student_id: `${studentId}` });
        expect(response.status).toBe(404);
      });
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/enrollment`,
        [roles[0]],
        (req, url) => req.delete(url),
      );
    });
    describe("Enrollment body Validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/enrollment`,
        [roles[0]],
        requiredFields,
        [],
        commonInvalids,
        () => {
          return { student_id: "1" };
        },
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 409 if a student tries to delete his rejected enrollment", () => {
      let studentToken, studentId;
      beforeAll(async () => {
        studentToken = await createAndLoginUser(createUser("student"));
        let response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        studentId = response.body.user.id;
        await enrollStudent(adminToken, studentToken, courseId);

        response = await request(app)
          .put(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({ status: "rejected", student_id: `${studentId}` });
        expect(response.status).toBe(200);
      });
      it("Should return 409 if a student tries to delete his rejected enrollment (student)", async () => {
        let response = await request(app)
          .delete(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        expect(response.status).toBe(409);
      });
      it("Should return 409 if a student tries to delete his rejected enrollment (admin)", async () => {
        let response = await request(app)
          .delete(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ student_id: `${studentId}` });
        expect(response.status).toBe(409);
      });
    });
  });
});

describe("Testing Get /course/:course_id/enrollment/all", () => {
  let studentToken;
  beforeAll(async () => {
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    let studentId = response.body.user.id;

    await enrollStudent(adminToken, studentToken, courseId);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ student_id: `${studentId}`, status: "accepted" });
    expect(response.status).toBe(200);
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get all enrollments of given course id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/enrollment/all`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body.enrollments.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999999/enrollment/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let instructorToken;
      beforeAll(async () => {
        instructorToken = await createAndLoginUser(createUser("instructor"));
      });
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/enrollment/all`,
        () => undefined,
        [
          { name: "instructor user", token: () => instructorToken },
          { name: "student user", token: () => studentToken },
        ],
        (req, url) => req.get(url),
      );
    });

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/enrollment/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Should return [] if the enrollments are empty", () => {
      let courseId;
      beforeAll(async () => {
        const course = createCourse();
        let response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        expect(response.status).toBe(201);
        courseId = response.body.course.id;
      });

      roles.forEach((role) => {
        it(`Should return [] if the enrollments are empty (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/enrollment/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(200);
          expect(response.body.enrollments.length).toBe(0);
        });
      });
    });
  });
});

describe("Testing Put /enrollment", () => {
  const roles = [
    {
      name: "instructor",
      token: () => {
        return instructorToken;
      },
    },
    {
      name: "admin",
      token: () => {
        return adminToken;
      },
    },
  ];
  describe("Positive Testing", () => {
    let studentToken, studentId;
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      studentId = response.body.user.id;
      await enrollStudent(adminToken, studentToken, courseId);
    });
    roles.forEach((role) => {
      const values = ["accepted", "rejected"];
      values.forEach((value) => {
        it(`Should allow ${role.name} to accept/reject an enrollment (${value}) `, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/enrollment`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send({ status: value, student_id: `${studentId}` });
          expect(response.status).toBe(200);

          response = await request(app)
            .put(`/course/${courseId}/enrollment`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send({
              status: value == "accepted" ? "rejected" : "accepted",
              student_id: `${studentId}`,
            });
          expect(response.status).toBe(200);
        });
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999999/enrollment`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 404 if the enrollment is not found", () => {
      let studentToken, studentId;
      beforeAll(async () => {
        studentToken = await createAndLoginUser(createUser("student"));
        let response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        studentId = response.body.user.id;
      });
      roles.forEach((role) => {
        it(`Should return 404 if the enrollment is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/enrollment`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send({ student_id: `${studentId}`, status: "accepted" });
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let instructorToken, studentToken;
      beforeAll(async () => {
        studentToken = await createAndLoginUser(createUser("student"));
        let response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        let studentId = response.body.user.id;
        await enrollStudent(adminToken, studentToken, courseId);
        instructorToken = await createAndLoginUser(createUser("instructor"));
      });
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/enrollment`,
        () => undefined,
        [
          { name: "instructor user", token: () => instructorToken },
          { name: "student user", token: () => studentToken },
        ],
        (req, url) => req.put(url),
      );
    });

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/enrollment`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/enrollment`,
        roles,
        (req, url) => req.put(url),
      );
    });
    describe("Enrollment body Validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/enrollment`,
        roles,
        ["student_id", "status"],
        [],
        commonInvalids,
        () => {
          return { student_id: "1", status: "accepted" };
        },
        (req, url) => req.put(url),
      );
    });
  });
});
