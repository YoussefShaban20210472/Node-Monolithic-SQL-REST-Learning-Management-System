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

describe("Testing Post /course/:course_id/lesson", () => {
  let adminToken, instructorToken, instructorId;
  let courseId;
  beforeEach(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const lesson = createLesson();
      it(`Should allow ${role.name} to create a new lesson`, async () => {
        response = await request(app)
          .post(`/course/${courseId}/lesson`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(lesson);
        console.log(response.body);
        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Lesson creation validation (Missing, Empty, Invalid)", () => {
      const requiredFields = ["title", "description", "start_date", "end_date"];

      // Common invalid values for most fields
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

      // Custom invalid values for specific fields
      const fieldInvalids = {
        description: [
          ...commonInvalids.slice(8),
          "123",
          "123000",
          "5",
          "10",
          "96",
        ], // too long string example
      };

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
              values = fieldInvalids[field] || commonInvalids; // invalid values
            }

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario} (${role.name})${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }`, async () => {
                const lesson = createLesson();

                if (scenario === "missing") delete lesson[field];
                else lesson[field] = value;

                const response = await request(app)
                  .post(`/course/${courseId}/lesson`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(lesson);

                expect(response.status).toBe(400);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        });
      });
    });
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      const lesson = createLesson();
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/lesson`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(lesson);
          expect(response.status).toBe(404);
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
                .post(`/course/${courseId}/lesson`)
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
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];

      const lesson = createLesson();
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/lesson`)
                .set("Authorization", value)
                .send(lesson);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .post(`/course/${courseId}/lesson`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send(lesson);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .post(`/course/${courseId}/lesson`)
              .send(lesson);
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Lesson Duriation validation", () => {
      const requiredFields = ["start_date", "end_date"];
      const course_start_date = "2026-05-20T00:00:00Z";
      const course_end_date = "2026-08-20T00:00:00Z";

      const lesson_start_date = "2026-06-20T00:00:00Z";
      const lesson_end_date = "2026-07-20T00:00:00Z";
      // Common invalid values for most fields

      // Custom invalid values for specific fields
      const fieldInvalids = {
        start_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          // --- allowed area ---

          // lesson_end_date => 2026, 7, 20, 0
          createDateTime(2026, 7, 20, 1),
          createDateTime(2026, 7, 20, 5),
          createDateTime(2026, 7, 20, 7),
          createDateTime(2026, 8, 1, 7),

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ], // too long string example
        end_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          createDateTime(2026, 5, 21),
          createDateTime(2026, 6, 10),
          createDateTime(2026, 6, 15),
          createDateTime(2026, 6, 18, 7),
          createDateTime(2026, 6, 19, 23),

          // lesson_start_date => 2026, 6, 20, 0

          createDateTime(2026, 6, 20, 0, 1),
          createDateTime(2026, 6, 20, 0, 5),
          createDateTime(2026, 6, 20, 0, 10),
          createDateTime(2026, 6, 20, 0, 20),

          // --- allowed area --- 2026, 6, 20, 0,30

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ],
      };

      const lesson = createLesson();
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          let values = fieldInvalids[field];

          values.forEach((value) => {
            lesson["start_date"] =
              field == "start_date" ? value : lesson_start_date;
            lesson["end_date"] = field == "end_date" ? value : lesson_end_date;
            it(`should return 400 if duriation is invalid (${lesson["start_date"]}) ((${lesson["end_date"]})) (${role.name})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/lesson`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(lesson);

              expect(response.status).toBe(400);

              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});

describe("Testing Delete /course/:course_id/lesson/:lesson_id", () => {
  let adminToken, instructorToken;
  let courseId;
  let lessonIdToDelete;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    const course = createCourse();

    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);

    courseId = response.body.course.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
  describe("Positive Testing", () => {
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
    beforeAll(async () => {
      const lesson = createLesson();
      let response = await request(app)
        .post(`/course/${courseId}/lesson`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(lesson);
      lessonIdToDelete = response.body.lesson.id;
    });

    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the lesson is not found", () => {
      let lessonIdToDelete = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
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
            { name: "student user", token: () => unauthorizedStudentToken },
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
                .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
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
                .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
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
            .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the lesson is invalid", () => {
      let lessonIdToDelete = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the lesson is invalid (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/lesson/${lessonIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/lesson/:lesson_id", () => {
  let adminToken, instructorToken, studentToken;
  let courseId;
  let lessonIdToGet;

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
    { name: "student", token: () => studentToken },
  ];
  // ✅ Positive
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
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the lesson is not found", () => {
      let lessonIdToGet = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
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
            { name: "student user", token: () => unauthorizedStudentToken },
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
                .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
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
                .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
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
            .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the lesson is invalid", () => {
      let lessonIdToGet = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the lesson is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/lesson/:lesson_id/otp", () => {
  let adminToken, instructorToken;
  let courseId;
  let lessonIdToGet;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    const course = createCourse();

    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    expect(response.status).toBe(201);
    courseId = response.body.course.id;

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
  // ✅ Positive
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
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the lesson is not found", () => {
      let lessonIdToGet = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken,
        authorizedstudentToken,
        unauthorizedStudentToken;

      beforeAll(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        authorizedstudentToken = await createAndLoginUser(
          createUser("student"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
        let response = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${authorizedstudentToken}`)
          .send();
        expect(response.status).toBe(200);
        let studentId = response.body.user.id;

        response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${authorizedstudentToken}`)
          .send();

        expect(response.status).toBe(201);

        response = await request(app)
          .put(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({ student_id: `${studentId}`, status: "accepted" });
        expect(response.status).toBe(200);
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
              token: () => authorizedstudentToken,
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
                .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
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
                .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
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
            .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the lesson is invalid", () => {
      let lessonIdToGet = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the lesson is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/${lessonIdToGet}/otp`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/lesson/all", () => {
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

    const lesson = createLesson();
    response = await request(app)
      .post(`/course/${courseId}/lesson`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(lesson);
    expect(response.status).toBe(201);
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
    { name: "student", token: () => studentToken },
  ];
  // ✅ Positive
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
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/lesson/all`)
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
            { name: "student user", token: () => unauthorizedStudentToken },
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
                .get(`/course/${courseId}/lesson/all`)
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
                .get(`/course/${courseId}/lesson/all`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app).get(`/course/${courseId}/lesson/all`).send();
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
            .get(`/course/${courseId}/lesson/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return [] if the lessons are empty", () => {
      let courseId;

      beforeAll(async () => {
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
  let adminToken, instructorToken;
  let courseId;
  let lessonIdToUpdate;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    const course = createCourse();

    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);

    courseId = response.body.course.id;

    const lesson = createLesson();
    response = await request(app)
      .post(`/course/${courseId}/lesson`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(lesson);
    lessonIdToUpdate = response.body.lesson.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
  describe("Positive Testing", () => {
    describe("should allow admin and instructor to update only one field in given lesson by id", () => {
      const updateFields = ["title", "description", "start_date", "end_date"];
      roles.forEach((role) => {
        const randomLesson = createLesson();
        updateFields.forEach((updateField) => {
          it(`should allow ${role.name} to update only ${updateField} field in given lesson by id`, async () => {
            const res = await request(app)
              .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send({ [`${updateField}`]: randomLesson[updateField] });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
          });
        });
      });
    });

    describe("should allow admin and instructor to update more than one field in given course by id", () => {
      roles.forEach((role) => {
        const randomLesson = createLesson();
        it(`should allow ${role.name} to update more than one field in given user profile by id `, async () => {
          const res = await request(app)
            .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomLesson);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
  });
  describe("Negative Testing", () => {
    const lesson = createLesson();

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
                .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
            });
          });
        });
      });
    });

    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(lesson);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the lesson is not found", () => {
      let lessonIdToUpdate = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(lesson);
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken,
        authorizedstudentToken,
        unauthorizedStudentToken;

      beforeAll(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        authorizedstudentToken = await createAndLoginUser(
          createUser("student"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
        let response = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${authorizedstudentToken}`)
          .send();
        expect(response.status).toBe(200);
        let studentId = response.body.user.id;

        response = await request(app)
          .post(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${authorizedstudentToken}`)
          .send();

        expect(response.status).toBe(201);

        response = await request(app)
          .put(`/course/${courseId}/enrollment`)
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({ student_id: `${studentId}`, status: "accepted" });
        expect(response.status).toBe(200);
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
              token: () => authorizedstudentToken,
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
                .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
                .set("Authorization", value)
                .send(lesson);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send(lesson);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
              .send(lesson);
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
            .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(lesson);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the lesson is invalid", () => {
      let lessonIdToUpdate = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the lesson is invalid (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(lesson);
          expect(response.status).toBe(400);
        });
      });
    });

    describe("Lesson update validation (Empty, Invalid)", () => {
      const requiredFields = ["title", "description", "start_date", "end_date"];

      // Common invalid values for most fields
      const commonInvalids = [
        generateRandomString(501),
        generateRandomString(700),
        generateRandomString(1000),
        "123",
        "123000",
        "5",
        "10",
        "96",
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

      // Custom invalid values for specific fields
      const fieldInvalids = {
        description: [...commonInvalids.slice(3)], // too long string example
      };

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          scenarios.forEach((scenario) => {
            let values = [];

            if (scenario === "empty") {
              values = [""]; // empty string
            } else if (scenario === "invalid") {
              values = fieldInvalids[field] || commonInvalids; // invalid values
            }

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario}${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }  `, async () => {
                const lesson = {};

                lesson[field] = value;

                const response = await request(app)
                  .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(lesson);

                expect(response.status).toBe(400);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        });
      });
    });

    describe("Lesson Duriation validation", () => {
      const requiredFields = ["start_date", "end_date"];
      const course_start_date = "2026-05-20T00:00:00Z";
      const course_end_date = "2026-08-20T00:00:00Z";

      const lesson_start_date = "2026-06-20T00:00:00Z";
      const lesson_end_date = "2026-07-20T00:00:00Z";
      // Common invalid values for most fields

      // Custom invalid values for specific fields
      const fieldInvalids = {
        start_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          // --- allowed area ---

          // lesson_end_date => 2026, 7, 20, 0
          createDateTime(2026, 7, 20, 1),
          createDateTime(2026, 7, 20, 5),
          createDateTime(2026, 7, 20, 7),
          createDateTime(2026, 8, 1, 7),

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ], // too long string example
        end_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          createDateTime(2026, 5, 21),
          createDateTime(2026, 6, 10),
          createDateTime(2026, 6, 15),
          createDateTime(2026, 6, 18, 7),
          createDateTime(2026, 6, 19, 23),

          // lesson_start_date => 2026, 6, 20, 0

          createDateTime(2026, 6, 20, 0, 1),
          createDateTime(2026, 6, 20, 0, 5),
          createDateTime(2026, 6, 20, 0, 10),
          createDateTime(2026, 6, 20, 0, 20),

          // --- allowed area --- 2026, 6, 20, 0,30

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ],
      };

      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          let values = fieldInvalids[field];
          values.forEach((value) => {
            it(`should return 400 if duriation is invalid (${field == "start_date" ? value : lesson_start_date}) (${field == "end_date" ? value : lesson_end_date}) (${role.name})`, async () => {
              const response = await request(app)
                .put(`/course/${courseId}/lesson/${lessonIdToUpdate}`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send({ [field]: value });

              expect(response.status).toBe(400);

              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});
