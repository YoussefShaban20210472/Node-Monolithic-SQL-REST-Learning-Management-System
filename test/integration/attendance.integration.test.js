const app = require("../../app");
const request = require("supertest");
jest.setTimeout(10000);
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
function createLesson() {
  let lesson = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    start_date: createDateTime(2026, 6, 20),
    end_date: createDateTime(2026, 7, 20),
  };
  return lesson;
}
function createDateTime(year, month, day, hours = 0, minutes = 0, seconds = 0) {
  // ⚠️ month is 0-based in JS (0 = Jan, 11 = Dec)
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds),
  ).toISOString();
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
async function enrollStudent(adminToken, studentToken, courseId) {
  let response = await request(app)
    .get(`/user/me`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send();
  let studentId = response.body.user.id;
  response = await request(app)
    .post(`/course/${courseId}/enrollment`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send();
  expect(response.status).toBe(201);
  response = await request(app)
    .put(`/course/${courseId}/enrollment`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ student_id: `${studentId}`, status: "accepted" });
  expect(response.status).toBe(200);
}

describe("Testing Post /course/:course_id/lesson/:lesson_id/attendance", () => {
  let adminToken, instructorToken, studentToken, studentId;
  let courseId, lessonId, otp;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    expect(response.status).toBe(201);
    courseId = response.body.course.id;
    const lesson = createLesson();
    response = await request(app)
      .post(`/course/${courseId}/lesson`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(lesson);
    expect(response.status).toBe(201);
    lessonId = response.body.lesson.id;
    otp = response.body.lesson.otp;
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
  describe("Positive Testing", () => {
    beforeAll(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let token = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, token, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
    });

    it(`Should allow student to attend a lesson`, async () => {
      let response = await request(app)
        .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ otp });
      expect(response.status).toBe(201);
    });
    it(`Should allow admin to attend a student into a lesson`, async () => {
      let response = await request(app)
        .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ otp, student_id: `${studentId}` });
      expect(response.status).toBe(201);
    });
  });
  describe("Negative Testing", () => {
    beforeAll(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let token = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, token, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
    });
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      const lesson = createLesson();
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the lesson is not found", () => {
      let lessonId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the lesson is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(404);
        });
      });
    });
    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the lesson is invalid", () => {
      let lessonId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the lesson is invalid (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];
      const lesson = createLesson();
      roles.forEach((role) => {
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
            });
          });
        });
      });
    });
    describe("Should return 409 if a student tries to attend twice to a same lesson.", () => {
      it(`Should return 409 if a student tries to attend twice to a same lesson.`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ otp });
        response = await request(app)
          .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ otp });
        expect(response.status).toBe(409);
      });
      it(`Should return 409 if the admin tries to attend a student twice to a same lesson.`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ otp, student_id: `${studentId}` });
        response = await request(app)
          .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ otp, student_id: `${studentId}` });
        expect(response.status).toBe(409);
      });
    });
    describe("Should return 400 if the otp of the lesson is wrong", () => {
      roles.forEach((role) => {
        it(`Should return 400 if the otp of the lesson is wrong (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${studentToken}`)
            .send({ ...[role.body()], otp: "1000000000000000000000" });
          expect(response.status).toBe(400);
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
            { name: "student user", token: () => unauthorizedStudentToken },
            {
              name: "unauthorized instructor user",
              token: () => unauthorizedInstructorToken,
            },
            {
              name: "authorized instructor user",
              token: () => instructorToken,
            },
          ],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
                .set("Authorization", value)
                .send({ otp, student_id: `${studentId}` });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send({ otp, student_id: `${studentId}` });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
              .send({ otp, student_id: `${studentId}` });
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Attendance body Validation", () => {
      const requiredFields = ["student_id", "otp"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          if (role.name == "student" && field == "student_id") return;
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
                const attendance = { student_id: "1", otp };

                if (scenario === "missing") delete attendance[field];
                else attendance[field] = value;

                const response = await request(app)
                  .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(attendance);

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

describe("Testing Get /course/:course_id/lesson/:lesson_id/attendance", () => {
  let adminToken, instructorToken, studentToken, studentId;
  let courseId, lessonId, otp;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    expect(response.status).toBe(201);
    courseId = response.body.course.id;
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

    let token = await createAndLoginUser(createUser("student"));
    await enrollStudent(adminToken, token, courseId);
    response = await request(app)
      .get(`/user/me`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(response.status).toBe(200);
    studentId = response.body.user.id;

    response = await request(app)
      .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ otp });

    response = await request(app)
      .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ otp, student_id: `${studentId}` });
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
      let courseId = "999999";
      const lesson = createLesson();
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the lesson is not found", () => {
      let lessonId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the lesson is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the attendance is not found", () => {
      let studentId;
      beforeAll(async () => {
        let token = await createAndLoginUser(createUser("student"));
        await enrollStudent(adminToken, token, courseId);
        response = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${token}`)
          .send();
        expect(response.status).toBe(200);
        studentId = response.body.user.id;
      });
      roles.forEach((role) => {
        if (role.name == "student") return;
        it(`Should return 404 if the attendance is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send({ student_id: `${studentId}` });
          expect(response.status).toBe(404);
        });
      });
    });
    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the lesson is invalid", () => {
      let lessonId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the lesson is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];
      const lesson = createLesson();
      roles.forEach((role) => {
        if (role.name == "student") return;
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
            });
          });
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
            { name: "student user", token: () => unauthorizedStudentToken },
            {
              name: " instructor user",
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
                .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
                .set("Authorization", value)
                .send({ student_id: `${studentId}` });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send({ student_id: `${studentId}` });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
              .send({ student_id: `${studentId}` });
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Attendance body Validation", () => {
      const requiredFields = ["student_id"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];
      roles.forEach((role) => {
        if (role.name == "student") return;
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
                const attendance = { student_id: "1" };

                if (scenario === "missing") delete attendance[field];
                else attendance[field] = value;

                const response = await request(app)
                  .get(`/course/${courseId}/lesson/${lessonId}/attendance`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(attendance);

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

describe("Testing Get /course/:course_id/lesson/:lesson_id/attendance/all", () => {
  let adminToken, instructorToken, studentToken, studentId;
  let courseId, lessonId, otp;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    expect(response.status).toBe(201);
    courseId = response.body.course.id;
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

    let token = await createAndLoginUser(createUser("student"));
    await enrollStudent(adminToken, token, courseId);
    response = await request(app)
      .get(`/user/me`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(response.status).toBe(200);
    studentId = response.body.user.id;

    response = await request(app)
      .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ otp });

    response = await request(app)
      .post(`/course/${courseId}/lesson/${lessonId}/attendance`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ otp, student_id: `${studentId}` });
  });
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
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      const lesson = createLesson();
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the lesson is not found", () => {
      let lessonId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the lesson is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
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
    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the lesson is invalid", () => {
      let lessonId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the lesson is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
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
              name: "unauthorized student user",
              token: () => unauthorizedStudentToken,
            },
            {
              name: "authorized student user",
              token: () => studentToken,
            },
            {
              name: " instructor user",
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
                .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
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
                .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/lesson/${lessonId}/attendance/all`)
              .send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });
  });
});
