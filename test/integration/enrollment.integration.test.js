const app = require("../../app");
const request = require("supertest");

function createUser(role = "admin") {
  const numbersString = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");

  const user = {
    first_name: "John",
    last_name: "Doe",
    email: `john@a${numbersString}z.com`,
    password: "Password@123",
    phone_number: numbersString,
    address: "253 N. Cherry St.",
    role: role,
  };
  return user;
}

function createDateTime(year, month, day, hours = 0, minutes = 0, seconds = 0) {
  // ⚠️ month is 0-based in JS (0 = Jan, 11 = Dec)
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds),
  ).toISOString();
}

function createCourse() {
  const course = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    short_description: generateRandomString(100),
    start_date: createDateTime(2026, 5, 20),
    end_date: createDateTime(2026, 8, 20),
    tag: [
      generateRandomString(10),
      generateRandomString(10),
      generateRandomString(10),
    ],
    category: [
      generateRandomString(10),
      generateRandomString(10),
      generateRandomString(10),
    ],
  };
  return course;
}
function generateRandomString(length) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    result += letters[randomIndex];
  }
  return result;
}

const adminUser = {
  email: "admin@example.com",
  password: "0Admin@example.com",
};

const studentUser = {
  email: "student@example.com",
  password: "Password@123",
};

const instructorUser = {
  email: "instructor@example.com",
  password: "Password@123",
};

// Common invalid values for most fields
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
// helper to create + login user dynamically
async function createAndLoginUser(userData) {
  let response = await request(app).post("/user/login").send(adminUser);
  const token = response.body.token;
  // create user
  await request(app)
    .post("/user")
    .set("Authorization", `Bearer ${token}`)
    .send(userData);

  // login user
  const loginRes = await request(app).post("/user/login").send({
    email: userData.email,
    password: userData.password,
  });

  return loginRes.body.token;
}
// helper to login user dynamically
async function getToken(userData) {
  // login user
  const loginRes = await request(app).post("/user/login").send({
    email: userData.email,
    password: userData.password,
  });

  return loginRes.body.token;
}

describe("Testing Post /enrollment", () => {
  describe("Positive Testing", () => {
    let adminToken, instructorToken, studentToken, studentId;
    let courseId;
    beforeAll(async () => {
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      studentToken = await createAndLoginUser(createUser("student"));
      let token = await createAndLoginUser(createUser("student"));

      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${token}`)
        .send();
      studentId = response.body.user.id;
      const course = createCourse();
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseId = response.body.course.id;
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
    let adminToken, studentToken, studentId, instructorToken;
    let courseId;
    beforeAll(async () => {
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      studentToken = await createAndLoginUser(createUser("student"));
      let token = await createAndLoginUser(createUser("student"));

      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${token}`)
        .send();
      studentId = response.body.user.id;
      const course = createCourse();
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseId = response.body.course.id;
    });
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      it("Should return 404 if the course is not found (student)", async () => {
        let response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        expect(response.status).toBe(404);
      });

      it("Should return 404 if the course is not found (admin)", async () => {
        let response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ student_id: `${studentId}` });
        expect(response.status).toBe(404);
      });
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];

      scenarios.forEach((scenarios) => {
        const values = scenarios.values;
        values.forEach((value) => {
          it(`Should return 400 if request body is ${scenarios.name} (${value})`, async () => {
            let response = await request(app)
              .post(`/course/${courseId}/enrollment`)
              .set("Authorization", `Bearer ${adminToken}`)
              .send(value);
            expect(response.status).toBe(400);
          });
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      const scenarios = [
        {
          name: "missing",
          setHeader: (req) => req, // do nothing
        },
        {
          name: "empty",
          setHeader: (req) => req.set("Authorization", ""),
        },
        {
          name: "invalid",
          values: ["Bearer invalidtoken", "invalidtoken", "Bearer ", "12345"],
        },
        {
          name: "Unauthorized",
          values: [{ name: "instructor user", token: () => instructorToken }],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/enrollment`)
                .set("Authorization", value)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/enrollment`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .post(`/course/${courseId}/enrollment`)
              .send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });
    describe("Should return 409 if a student tries to enroll twice to a same course.", () => {
      let adminToken, instructorToken, studentToken, studentId;
      let courseId;
      beforeAll(async () => {
        adminToken = await getToken(adminUser);
        instructorToken = await getToken(instructorUser);
        studentToken = await createAndLoginUser(createUser("student"));
        let token = await createAndLoginUser(createUser("student"));

        let response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${token}`)
          .send();
        studentId = response.body.user.id;
        const course = createCourse();
        response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        courseId = response.body.course.id;
      });

      it("Should allow student to enroll to a course", async () => {
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

      it("Should allow admin to enroll a student to a course", async () => {
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
    describe("Enrollment body Validation", () => {
      const requiredFields = ["student_id"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];
      requiredFields.forEach((field) => {
        scenarios.forEach((scenario) => {
          let values = [];

          if (scenario === "missing") {
            values = [undefined]; // field will be deleted
          } else if (scenario === "empty") {
            values = [""]; // empty string
          } else if (scenario === "invalid") {
            values = commonInvalids; // invalid values
          }

          values.forEach((value) => {
            it(`should return 400 if ${field} is ${scenario}${
              scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
            }`, async () => {
              const enrollment = { student_id: "1" };

              if (scenario === "missing") delete enrollment[field];
              else enrollment[field] = value;

              const response = await request(app)
                .post(`/course/${courseId}/enrollment`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(enrollment);

              expect(response.status).toBe(400);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});

describe("Testing Delete /enrollment", () => {
  describe("Positive Testing", () => {
    let adminToken, instructorToken, studentToken, studentId;
    let courseId;
    beforeAll(async () => {
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      studentToken = await createAndLoginUser(createUser("student"));
      let token = await createAndLoginUser(createUser("student"));

      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${token}`)
        .send();
      studentId = response.body.user.id;
      const course = createCourse();
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseId = response.body.course.id;
    });

    it("Should allow student to unenroll to a course", async () => {
      let response = await request(app)
        .post(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      response = await request(app)
        .delete(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
    });

    it("Should allow admin to unenroll a student to a course", async () => {
      let response = await request(app)
        .post(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ student_id: `${studentId}` });
      response = await request(app)
        .delete(`/course/${courseId}/enrollment`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ student_id: `${studentId}` });
      expect(response.status).toBe(200);
    });
  });
  describe("Negative Testing", () => {
    let adminToken, studentToken, studentId, instructorToken;
    let courseId;
    beforeAll(async () => {
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      studentToken = await createAndLoginUser(createUser("student"));
      let token = await createAndLoginUser(createUser("student"));

      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${token}`)
        .send();
      studentId = response.body.user.id;
      const course = createCourse();
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseId = response.body.course.id;
    });
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      it("Should return 404 if the course is not found (student)", async () => {
        let response = await request(app)
          .delete(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        expect(response.status).toBe(404);
      });

      it("Should return 404 if the course is not found (admin)", async () => {
        let response = await request(app)
          .delete(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ student_id: `${studentId}` });
        expect(response.status).toBe(404);
      });
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
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];

      scenarios.forEach((scenarios) => {
        const values = scenarios.values;
        values.forEach((value) => {
          it(`Should return 400 if request body is ${scenarios.name} (${value})`, async () => {
            let response = await request(app)
              .delete(`/course/${courseId}/enrollment`)
              .set("Authorization", `Bearer ${adminToken}`)
              .send(value);
            expect(response.status).toBe(400);
          });
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      const scenarios = [
        {
          name: "missing",
          setHeader: (req) => req, // do nothing
        },
        {
          name: "empty",
          setHeader: (req) => req.set("Authorization", ""),
        },
        {
          name: "invalid",
          values: ["Bearer invalidtoken", "invalidtoken", "Bearer ", "12345"],
        },
        {
          name: "Unauthorized",
          values: [{ name: "instructor user", token: () => instructorToken }],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .delete(`/course/${courseId}/enrollment`)
                .set("Authorization", value)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              const response = await request(app)
                .delete(`/course/${courseId}/enrollment`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .delete(`/course/${courseId}/enrollment`)
              .send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });
    describe("Should return 409 if a student tries to delete his rejected enrollment", () => {
      let adminToken, instructorToken, studentToken, studentId;
      let courseId;
      beforeAll(async () => {
        adminToken = await getToken(adminUser);
        instructorToken = await getToken(instructorUser);

        const course = createCourse();
        response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        courseId = response.body.course.id;
      });
      beforeEach(async () => {
        studentToken = await createAndLoginUser(createUser("student"));

        let response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        studentId = response.body.user.id;
      });

      const roles = [
        {
          name: "student",
          token: () => {
            return studentToken;
          },
          body: () => undefined,
        },
        {
          name: "admin",
          token: () => {
            return adminToken;
          },
          body: () => {
            return { student_id: `${studentId}` };
          },
        },
      ];
      roles.forEach((role) => {
        it(`Should return 409 if a student tries to delete his rejected enrollment (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/enrollment`)
            .set("Authorization", `Bearer ${studentToken}`)
            .send();
          expect(response.status).toBe(201);

          response = await request(app)
            .put(`/course/${courseId}/enrollment`)
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({ status: "rejected", student_id: `${studentId}` });
          expect(response.status).toBe(200);

          response = await request(app)
            .delete(`/course/${courseId}/enrollment`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(409);
        });
      });
    });
    describe("Enrollment body Validation", () => {
      const requiredFields = ["student_id"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];
      requiredFields.forEach((field) => {
        scenarios.forEach((scenario) => {
          let values = [];

          if (scenario === "missing") {
            values = [undefined]; // field will be deleted
          } else if (scenario === "empty") {
            values = [""]; // empty string
          } else if (scenario === "invalid") {
            values = commonInvalids; // invalid values
          }

          values.forEach((value) => {
            it(`should return 400 if ${field} is ${scenario}${
              scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
            }`, async () => {
              const enrollment = { student_id: "1" };

              if (scenario === "missing") delete enrollment[field];
              else enrollment[field] = value;

              const response = await request(app)
                .delete(`/course/${courseId}/enrollment`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(enrollment);

              expect(response.status).toBe(400);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});

describe("Testing Put /enrollment", () => {
  describe("Positive Testing", () => {
    let adminToken, instructorToken, studentToken, studentId;
    let courseId;
    beforeAll(async () => {
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);

      const course = createCourse();
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseId = response.body.course.id;
    });
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));

      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      studentId = response.body.user.id;
    });

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
    roles.forEach((role) => {
      const values = ["accepted", "rejected"];
      values.forEach((value) => {
        it(`Should allow ${role.name} to accept/reject an enrollment (${value}) `, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/enrollment`)
            .set("Authorization", `Bearer ${studentToken}`)
            .send();
          expect(response.status).toBe(201);
          response = await request(app)
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
    let adminToken, studentToken, studentId, instructorToken, instructorToken2;
    let courseId;
    beforeAll(async () => {
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      instructorToken2 = await getToken(createCourse("instructor"));
      studentToken = await createAndLoginUser(createUser("student"));
      let token = await createAndLoginUser(createUser("student"));

      let response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${token}`)
        .send();
      studentId = response.body.user.id;
      const course = createCourse();
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseId = response.body.course.id;
    });
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      it("Should return 404 if the course is not found (student)", async () => {
        let response = await request(app)
          .put(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({ status: "accepted", student_id: `${studentId}` });
        expect(response.status).toBe(404);
      });

      it("Should return 404 if the course is not found (admin)", async () => {
        let response = await request(app)
          .put(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: "accepted", student_id: `${studentId}` });
        expect(response.status).toBe(404);
      });
    });

    describe("Should return 404 if the enrollment is not found", () => {
      it("Should return 404 if the enrollment is not found (student)", async () => {
        let response = await request(app)
          .put(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({ status: "accepted", student_id: `${studentId}` });
        expect(response.status).toBe(404);
      });

      it("Should return 404 if the enrollment is not found (admin)", async () => {
        let response = await request(app)
          .put(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: "accepted", student_id: `${studentId}` });
        expect(response.status).toBe(404);
      });
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];
      const roles = [
        {
          name: "admin",
          token: () => {
            return adminToken;
          },
          name: "instructor",
          token: () => {
            return instructorToken;
          },
        },
      ];
      roles.forEach((role) => {
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .put(`/course/${courseId}/enrollment`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
            });
          });
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      const scenarios = [
        {
          name: "missing",
          setHeader: (req) => req, // do nothing
        },
        {
          name: "empty",
          setHeader: (req) => req.set("Authorization", ""),
        },
        {
          name: "invalid",
          values: ["Bearer invalidtoken", "invalidtoken", "Bearer ", "12345"],
        },
        {
          name: "Unauthorized",
          values: [
            { name: "instructor user", token: () => instructorToken2 },
            { name: "student user", token: () => studentToken },
          ],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .put(`/course/${courseId}/enrollment`)
                .set("Authorization", value)
                .send({ status: "accepted", student_id: `${studentId}` });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              const response = await request(app)
                .put(`/course/${courseId}/enrollment`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send({ status: "accepted", student_id: `${studentId}` });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .put(`/course/${courseId}/enrollment`)
              .send({ status: "accepted", student_id: `${studentId}` });
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Enrollment body Validation", () => {
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
      const requiredFields = ["status", "student_id"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          scenarios.forEach((scenario) => {
            let values = [];

            if (scenario === "missing") {
              values = [undefined]; // field will be deleted
            } else if (scenario === "empty") {
              values = [""]; // empty string
            } else if (scenario === "invalid") {
              values = commonInvalids; // invalid values
            }

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario} (${role.name})${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }`, async () => {
                const enrollment = { status: "rejected", student_id: "1" };

                if (scenario === "missing") delete enrollment[field];
                else enrollment[field] = value;

                const response = await request(app)
                  .put(`/course/${courseId}/enrollment`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(enrollment);

                expect(response.status).toBe(400);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/enrollment/all", () => {
  let adminToken, instructorToken, studentToken;
  let courseId;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    studentToken = await createAndLoginUser(createUser("student"));
    let response = await request(app)
      .get(`/user/me`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(200);
    let studentId = response.body.user.id;

    const course = createCourse();

    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    expect(response.status).toBe(201);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);
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
  // ✅ Positive
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
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "9999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/enrollment/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeEach(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
      });
      const scenarios = [
        {
          name: "missing",
          setHeader: (req) => req, // do nothing
        },
        {
          name: "empty",
          setHeader: (req) => req.set("Authorization", ""),
        },
        {
          name: "invalid",
          values: ["Bearer invalidtoken", "invalidtoken", "Bearer ", "12345"],
        },
        {
          name: "Unauthorized",
          values: [
            {
              name: "authorized student user",
              token: () => studentToken,
            },
            {
              name: "unauthorized student user",
              token: () => unauthorizedStudentToken,
            },
            {
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .get(`/course/${courseId}/enrollment/all`)
                .set("Authorization", value)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .get(`/course/${courseId}/enrollment/all`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/enrollment/all`)
              .send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/enrollment/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
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
