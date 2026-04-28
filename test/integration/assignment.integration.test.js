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
function createAssignment() {
  let assignment = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    start_date: createDateTime(2026, 6, 20),
    end_date: createDateTime(2026, 7, 20),
    score: 50,
  };
  return assignment;
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

// Custom invalid values for specific fields
const fieldInvalids = {
  description: [...commonInvalids.slice(8), "123", "123000", "5", "10", "96"], // too long string example
};
describe("Testing Post /course/:course_id/assignment", () => {
  let adminToken, instructorToken, instructorId;
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
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const assignment = createAssignment();
      it(`Should allow ${role.name} to create a new assignment`, async () => {
        response = await request(app)
          .post(`/course/${courseId}/assignment`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(assignment);
        console.log(response.body);
        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Assignment creation validation (Missing, Empty, Invalid)", () => {
      const requiredFields = [
        "title",
        "description",
        "start_date",
        "end_date",
        "score",
      ];

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
                const assignment = createAssignment();

                if (scenario === "missing") delete assignment[field];
                else assignment[field] = value;

                const response = await request(app)
                  .post(`/course/${courseId}/assignment`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(assignment);

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
      const assignment = createAssignment();
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/assignment`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(assignment);
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
      const assignment = createAssignment();
      roles.forEach((role) => {
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .post(`/course/${courseId}/assignment`)
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
      beforeAll(async () => {
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

      const assignment = createAssignment();
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/assignment`)
                .set("Authorization", value)
                .send(assignment);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .post(`/course/${courseId}/assignment`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send(assignment);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .post(`/course/${courseId}/assignment`)
              .send(assignment);
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Assignment Duriation validation", () => {
      const requiredFields = ["start_date", "end_date"];
      const course_start_date = "2026-05-20T00:00:00Z";
      const course_end_date = "2026-08-20T00:00:00Z";

      const assignment_start_date = "2026-06-20T00:00:00Z";
      const assignment_end_date = "2026-07-20T00:00:00Z";
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

          // assignment_end_date => 2026, 7, 20, 0
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

          // assignment_start_date => 2026, 6, 20, 0

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

      const assignment = createAssignment();
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          let values = fieldInvalids[field];

          values.forEach((value) => {
            assignment["start_date"] =
              field == "start_date" ? value : assignment_start_date;
            assignment["end_date"] =
              field == "end_date" ? value : assignment_end_date;
            it(`should return 400 if duriation is invalid (${assignment["start_date"]}) ((${assignment["end_date"]})) (${role.name})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/assignment`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(assignment);

              expect(response.status).toBe(400);

              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});

describe("Testing Delete /course/:course_id/assignment/:assignment_id", () => {
  let adminToken, instructorToken;
  let courseId;
  let assignmentIdToDelete;

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
    beforeAll(async () => {
      const assignment = createAssignment();
      let response = await request(app)
        .post(`/course/${courseId}/assignment`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(assignment);
      assignmentIdToDelete = response.body.assignment.id;
    });

    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/assignment/${assignmentIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentIdToDelete = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/assignment/${assignmentIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
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
                .delete(
                  `/course/${courseId}/assignment/${assignmentIdToDelete}`,
                )
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
                .delete(
                  `/course/${courseId}/assignment/${assignmentIdToDelete}`,
                )
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .delete(`/course/${courseId}/assignment/${assignmentIdToDelete}`)
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
            .delete(`/course/${courseId}/assignment/${assignmentIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the assignment is invalid", () => {
      let assignmentIdToDelete = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the assignment is invalid (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/assignment/${assignmentIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/assignment/:assignment_id", () => {
  let adminToken, instructorToken, studentToken;
  let courseId;
  let assignmentIdToGet;

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
    { name: "student", token: () => studentToken },
  ];
  // ✅ Positive
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
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentIdToGet = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
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
                .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
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
                .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
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
            .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the assignment is invalid", () => {
      let assignmentIdToGet = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the assignment is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/assignment/${assignmentIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/assignment/all", () => {
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

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
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
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/assignment/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
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
                .get(`/course/${courseId}/assignment/all`)
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
                .get(`/course/${courseId}/assignment/all`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/assignment/all`)
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
            .get(`/course/${courseId}/assignment/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return [] if the assignments are empty", () => {
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
  let adminToken, instructorToken;
  let courseId;
  let assignmentIdToUpdate;

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

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    assignmentIdToUpdate = response.body.assignment.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
  describe("Positive Testing", () => {
    describe("should allow admin and instructor to update only one field in given assignment by id", () => {
      const updateFields = [
        "title",
        "description",
        "start_date",
        "end_date",
        "score",
      ];
      roles.forEach((role) => {
        const randomAssignment = createAssignment();
        updateFields.forEach((updateField) => {
          it(`should allow ${role.name} to update only ${updateField} field in given assignment by id`, async () => {
            const res = await request(app)
              .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send({ [`${updateField}`]: randomAssignment[updateField] });
            console.log(res.body);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
          });
        });
      });
    });

    describe("should allow admin and instructor to update more than one field in given course by id", () => {
      roles.forEach((role) => {
        const randomAssignment = createAssignment();
        it(`should allow ${role.name} to update more than one field in given user profile by id `, async () => {
          const res = await request(app)
            .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomAssignment);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
  });
  describe("Negative Testing", () => {
    const assignment = createAssignment();

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];
      const assignment = createAssignment();
      roles.forEach((role) => {
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
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
            .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(assignment);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentIdToUpdate = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(assignment);
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
                .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
                .set("Authorization", value)
                .send(assignment);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send(assignment);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
              .send(assignment);
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
            .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(assignment);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the assignment is invalid", () => {
      let assignmentIdToUpdate = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the assignment is invalid (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(assignment);
          expect(response.status).toBe(400);
        });
      });
    });

    describe("Assignment update validation (Empty, Invalid)", () => {
      const requiredFields = [
        "title",
        "description",
        "start_date",
        "end_date",
        "score",
      ];

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
                const assignment = {};

                assignment[field] = value;

                const response = await request(app)
                  .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(assignment);

                expect(response.status).toBe(400);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        });
      });
    });

    describe("Assignment Duriation validation", () => {
      const requiredFields = ["start_date", "end_date"];
      const course_start_date = "2026-05-20T00:00:00Z";
      const course_end_date = "2026-08-20T00:00:00Z";

      const assignment_start_date = "2026-06-20T00:00:00Z";
      const assignment_end_date = "2026-07-20T00:00:00Z";
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

          // assignment_end_date => 2026, 7, 20, 0
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

          // assignment_start_date => 2026, 6, 20, 0

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
            it(`should return 400 if duriation is invalid (${field == "start_date" ? value : assignment_start_date}) (${field == "end_date" ? value : assignment_end_date}) (${role.name})`, async () => {
              const response = await request(app)
                .put(`/course/${courseId}/assignment/${assignmentIdToUpdate}`)
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
