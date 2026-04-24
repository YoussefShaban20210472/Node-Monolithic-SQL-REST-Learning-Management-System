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

describe("Testing Post /course", () => {
  describe("Positive Testing", () => {
    let adminToken, instructorToken, instructorId;
    beforeEach(async () => {
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      const response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send();
      instructorId = response.body.user.id;
    });

    it("Should allow instructor to create a new course", async () => {
      const course = createCourse();
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      // const createdCourse = response.body.course;
      expect(response.status).toBe(201);
    });
    it("Should allow admin to create a new course with given an instructor id", async () => {
      const course = createCourse();
      course.instructor_id = `${instructorId}`;
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(course);
      // const createdCourse = response.body.course;
      expect(response.status).toBe(201);
    });
  });
  describe("Negative Testing", () => {
    it("Should return 400 if nothing is sent", async () => {
      const token = await getToken(instructorUser);
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty("message");
    });
    describe("Course creation validation (Missing, Empty, Invalid)", () => {
      let adminToken, instructorToken, instructorId;
      beforeEach(async () => {
        adminToken = await getToken(adminUser);
        instructorToken = await getToken(instructorUser);
        const response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send();
        instructorId = response.body.user.id;
      });
      const roles = [
        {
          name: "admin",
          token: () => adminToken,
          instructorId: () => instructorId,
        },
        {
          name: "instructor",
          token: () => instructorToken,
          instructorId: () => null,
        },
      ];
      const requiredFields = [
        "title",
        "description",
        "short_description",
        "start_date",
        "end_date",
        "tag",
        "category",
        "instructor_id",
      ];

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
        instructor_id: [...commonInvalids.slice(5)],
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
            if (role.name == "instructor" && field == "instructor_id") return;

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario} (${role.name})${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }`, async () => {
                const course = createCourse();
                course["instructor_id"] = `${role.instructorId()}`;

                if (scenario === "missing") delete course[field];
                else course[field] = value;

                const response = await request(app)
                  .post("/course")
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(course);

                expect(response.status).toBe(400);
                if (field != "instructor_id")
                  expect(response.body.errors[0]).toHaveProperty(
                    "property",
                    field,
                  );
                expect(response.body.errors[0]).toHaveProperty("message");
              });
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
          values: [{ name: "student user", user: studentUser }],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const course = createCourse();

              const response = await request(app)
                .post("/course")
                .set("Authorization", value)
                .send(course);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              const token = await getToken(value.user);
              const course = createCourse();

              response = await request(app)
                .post("/course")
                .set("Authorization", `Bearer ${token}`)
                .send(course);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            const course = createCourse();

            let req = request(app).post("/course").send(course);
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });
    describe("Course Duriation validation", () => {
      let adminToken, instructorToken, instructorId;
      beforeEach(async () => {
        adminToken = await getToken(adminUser);
        instructorToken = await getToken(instructorUser);
        const response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send();
        instructorId = response.body.user.id;
      });
      const roles = [
        {
          name: "admin",
          token: () => adminToken,
          instructorId: () => instructorId,
        },
        {
          name: "instructor",
          token: () => instructorToken,
          instructorId: () => null,
        },
      ];
      const requiredFields = ["start_date", "end_date"];
      const start_date = "2026-05-20T00:00:00Z";
      const end_date = "2026-08-20T00:00:00Z";
      // Common invalid values for most fields

      // Custom invalid values for specific fields
      const fieldInvalids = {
        start_date: [
          "2000-05-20T00:00:00Z",
          "2021-05-20T00:00:00Z",
          "2022-05-20T00:00:00Z",
          "2023-05-20T00:00:00Z",
          "2024-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-06-20T00:00:00Z",
          "2025-07-20T00:00:00Z",
          "2025-08-18T00:00:00Z",
          "2025-08-19T00:00:00Z",

          "2026-08-14T00:00:00Z",
          "2026-08-15T00:00:00Z",
          "2026-08-16T00:00:00Z",
          "2026-08-17T00:00:00Z",
          "2026-08-18T00:00:00Z",
          "2026-08-19T00:00:00Z",
          "2026-08-20T00:00:00Z", // ---------------
          "2026-08-21T00:00:00Z",
          "2026-08-22T00:00:00Z",
          "2026-08-23T00:00:00Z",
          "2026-08-24T00:00:00Z",
          "2026-08-25T00:00:00Z",
          "2026-08-26T00:00:00Z",

          "2026-09-26T00:00:00Z",
          "2027-08-26T00:00:00Z",
          "2028-08-26T00:00:00Z",
          "2029-08-26T00:00:00Z",
          "2030-08-26T00:00:00Z",
          "2046-08-26T00:00:00Z",
          "2056-08-26T00:00:00Z",
          "2126-08-26T00:00:00Z",
        ], // too long string example
        end_date: [
          "2000-05-20T00:00:00Z",
          "2021-05-20T00:00:00Z",
          "2022-05-20T00:00:00Z",
          "2023-05-20T00:00:00Z",
          "2024-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-06-20T00:00:00Z",
          "2025-07-20T00:00:00Z",
          "2026-03-18T00:00:00Z",
          "2026-04-19T00:00:00Z",

          "2026-05-14T00:00:00Z",
          "2026-05-15T00:00:00Z",
          "2026-05-16T00:00:00Z",
          "2026-05-17T00:00:00Z",
          "2026-05-18T00:00:00Z",
          "2026-05-19T00:00:00Z",
          "2026-05-20T00:00:00Z", // ---------------
          "2026-05-21T00:00:00Z",
          "2026-05-22T00:00:00Z",
          "2026-05-23T00:00:00Z",
          "2026-05-24T00:00:00Z",
          "2026-05-25T00:00:00Z",
          "2026-05-26T00:00:00Z",

          "2027-05-21T00:00:00Z",
          "2027-05-22T00:00:00Z",
          "2027-05-23T00:00:00Z",
          "2027-05-24T00:00:00Z",
          "2027-05-25T00:00:00Z",
          "2027-05-26T00:00:00Z",
          "2027-05-24T00:00:00Z",
          "2027-06-24T00:00:00Z",
          "2027-07-24T00:00:00Z",
          "2027-08-24T00:00:00Z",
          "2027-09-24T00:00:00Z",
          "2028-09-24T00:00:00Z",
          "2029-09-24T00:00:00Z",
          "2049-09-24T00:00:00Z",
          "2159-09-24T00:00:00Z",
          "2179-09-24T00:00:00Z",
          "2199-09-24T00:00:00Z",
        ],
      };

      const course = createCourse();
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          let values = fieldInvalids[field];

          values.forEach((value) => {
            course["start_date"] = field == "start_date" ? value : start_date;
            course["end_date"] = field == "end_date" ? value : end_date;
            it(`should return 400 if duriation is invalid (${course["start_date"]}) ((${course["end_date"]})) (${role.name})`, async () => {
              const response = await request(app)
                .post("/course")
                .set("Authorization", `Bearer ${role.token()}`)
                .send(course);

              expect(response.status).toBe(400);

              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});

describe("Testing Delete /course/:course_id", () => {
  // ✅ Positive
  describe("Positive Testing", () => {
    let adminToken, instructorToken;
    let courseIdToDelete1, courseIdToDelete2;

    beforeAll(async () => {
      // login users
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);

      const course = createCourse();
      const course2 = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseIdToDelete1 = response.body.course.id;
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course2);
      courseIdToDelete2 = response.body.course.id;
    });

    it("should allow admin to delete course by id", async () => {
      const res = await request(app)
        .delete(`/course/${courseIdToDelete1}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
    it("should allow instructor to delete his own course by id", async () => {
      const res = await request(app)
        .delete(`/course/${courseIdToDelete2}`)
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
  });
  describe("Negative Testing", () => {
    // ❌ Authorization scenarios
    describe("Authorization scenarios", () => {
      let instructorToken, studentToken, unauthorizedInstructorToken;
      let courseIdToDelete;

      beforeAll(async () => {
        // login users
        instructorToken = await getToken(instructorUser);
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        studentToken = await getToken(studentUser);

        const course = createCourse();
        let response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        courseIdToDelete = response.body.course.id;
      });

      const authScenarios = [
        { name: "missing", setHeader: (req) => req },
        { name: "empty", setHeader: (req) => req.set("Authorization", "") },
        {
          name: "invalid",
          values: ["Bearer invalid", "invalid", "Bearer ", "123"],
        },
        {
          name: "student token",
          setHeader: (req) =>
            req.set("Authorization", `Bearer ${studentToken}`),
        },
        {
          name: "instructor token",
          setHeader: (req) =>
            req.set("Authorization", `Bearer ${unauthorizedInstructorToken}`),
        },
      ];

      authScenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 for invalid auth (${value})`, async () => {
              const res = await request(app)
                .delete(`/course/${courseIdToDelete}`)
                .set("Authorization", value);

              expect(res.status).toBe(401);
            });
          });
        } else {
          it(`should return 401 if auth is (${scenario.name})`, async () => {
            let req = request(app).delete(`/course/${courseIdToDelete}`);
            req = scenario.setHeader(req);

            const res = await req;

            expect(res.status).toBe(401);
          });
        }
      });
    });

    // ❌ Edge cases
    describe("Edge cases", () => {
      let adminToken, instructorToken;
      beforeAll(async () => {
        // login users
        adminToken = await getToken(adminUser);
        instructorToken = await getToken(instructorUser);
      });
      const roles = [
        { name: "admin", token: () => adminToken },
        { name: "instructor", token: () => instructorToken },
      ];
      roles.forEach((role) => {
        it(`should return 404 if user does not exist (${role.name})`, async () => {
          const res = await request(app)
            .delete(`/course/999999`)
            .set("Authorization", `Bearer ${role.token()}`);

          expect(res.status).toBe(404);
        });

        it(`should return 400 for invalid id format (${role.name}`, async () => {
          const res = await request(app)
            .delete(`/course/invalid-id`)
            .set("Authorization", `Bearer ${role.token()}`);

          expect(res.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id", () => {
  // ✅ Positive
  describe("Positive Testing", () => {
    let adminToken, instructorToken, studentToken;
    let courseIdToGet;

    beforeAll(async () => {
      // login users
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      studentToken = await getToken(studentUser);

      const course = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseIdToGet = response.body.course.id;
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        hint: "",
      },
      {
        name: "instructor",
        token: () => instructorToken,
        hint: "his own course",
      },
      ,
      {
        name: "student",
        token: () => studentToken,
        hint: "",
      },
      ,
    ];
    roles.forEach((role) => {
      it(`should allow ${role.name} to delete course by id ${role.hint}`, async () => {
        const res = await request(app)
          .get(`/course/${courseIdToGet}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("course");
      });
    });
  });
  describe("Negative Testing", () => {
    // ❌ Authorization scenarios
    describe("Authorization scenarios", () => {
      let instructorToken, unauthorizedInstructorToken;
      let courseIdToGet;

      beforeAll(async () => {
        // login users
        instructorToken = await getToken(instructorUser);
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        const course = createCourse();
        let response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        courseIdToGet = response.body.course.id;
      });

      const authScenarios = [
        { name: "missing", setHeader: (req) => req },
        { name: "empty", setHeader: (req) => req.set("Authorization", "") },
        {
          name: "invalid",
          values: ["Bearer invalid", "invalid", "Bearer ", "123"],
        },
        {
          name: "instructor token",
          setHeader: (req) =>
            req.set("Authorization", `Bearer ${unauthorizedInstructorToken}`),
        },
      ];

      authScenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 for invalid auth (${value})`, async () => {
              const res = await request(app)
                .get(`/course/${courseIdToGet}`)
                .set("Authorization", value);

              expect(res.status).toBe(401);
            });
          });
        } else {
          it(`should return 401 if auth is (${scenario.name})`, async () => {
            let req = request(app).get(`/course/${courseIdToGet}`);
            req = scenario.setHeader(req);

            const res = await req;

            expect(res.status).toBe(401);
          });
        }
      });
    });

    // ❌ Edge cases
    describe("Edge cases", () => {
      let adminToken, instructorToken, studentToken;
      beforeAll(async () => {
        // login users
        adminToken = await getToken(adminUser);
        instructorToken = await getToken(instructorUser);
        studentToken = await getToken(studentUser);
      });
      const roles = [
        { name: "admin", token: () => adminToken },
        { name: "instructor", token: () => instructorToken },
        { name: "student", token: () => studentToken },
      ];
      roles.forEach((role) => {
        it(`should return 404 if user does not exist (${role.name})`, async () => {
          const res = await request(app)
            .get(`/course/999999`)
            .set("Authorization", `Bearer ${role.token()}`);

          expect(res.status).toBe(404);
        });

        it(`should return 400 for invalid id format (${role.name}`, async () => {
          const res = await request(app)
            .get(`/course/invalid-id`)
            .set("Authorization", `Bearer ${role.token()}`);

          expect(res.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/all", () => {
  //   // ✅ Positive
  describe("Positive Testing", () => {
    let adminToken, instructorToken, studentToken, newInstructorToken;

    beforeAll(async () => {
      // login users
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);
      studentToken = await getToken(studentUser);
      newInstructorToken = await createAndLoginUser(createUser("instructor"));
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        hint: "",
      },
      {
        name: "instructor",
        token: () => instructorToken,
        hint: "his own courses",
      },
      {
        name: "new instructor",
        token: () => newInstructorToken,
        hint: "Should return []",
      },
      ,
      {
        name: "student",
        token: () => studentToken,
        hint: "",
      },
      ,
    ];
    roles.forEach((role) => {
      it(`should allow ${role.name} to get all courses ${role.hint}`, async () => {
        const res = await request(app)
          .get(`/course/all`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("courses");
        if (role.name == "new instructor") {
          expect(res.body.courses.length).toBe(0);
        } else {
          expect(res.body.courses.length).toBeGreaterThan(0);
        }
      });
    });
  });
  describe("Negative Testing", () => {
    // ❌ Authorization scenarios
    describe("Authorization scenarios", () => {
      const authScenarios = [
        { name: "missing", setHeader: (req) => req },
        { name: "empty", setHeader: (req) => req.set("Authorization", "") },
        {
          name: "invalid",
          values: ["Bearer invalid", "invalid", "Bearer ", "123"],
        },
      ];

      authScenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 for invalid auth (${value})`, async () => {
              const res = await request(app)
                .get(`/course/all`)
                .set("Authorization", value);

              expect(res.status).toBe(401);
            });
          });
        } else {
          it(`should return 401 if auth is (${scenario.name})`, async () => {
            let req = request(app).get(`/course/all`);
            req = scenario.setHeader(req);

            const res = await req;

            expect(res.status).toBe(401);
          });
        }
      });
    });
  });
});

describe("Testing PUT /course/:course_id", () => {
  // ✅ Positive (each test gets fresh user)
  describe("Positive Testing", () => {
    let adminToken, instructorToken, courseIdToUpdate1, courseIdToUpdate2;
    beforeAll(async () => {
      // login users
      adminToken = await getToken(adminUser);
      instructorToken = await getToken(instructorUser);

      const course = createCourse();
      const course2 = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseIdToUpdate1 = response.body.course.id;
      response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course2);
      courseIdToUpdate2 = response.body.course.id;
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        hint: "",
        course_id: () => courseIdToUpdate1,
      },
      {
        name: "instructor",
        token: () => instructorToken,
        hint: "his own course",
        course_id: () => courseIdToUpdate2,
      },
      ,
    ];
    describe("should allow admin and instructor to update only one field in given course by id", () => {
      const updateFields = [
        "title",
        "description",
        "short_description",
        "start_date",
        "end_date",
        "tag",
        "category",
      ];
      roles.forEach((role) => {
        const randomCourse = createCourse();
        updateFields.forEach((updateField) => {
          it(`should allow ${role.name} to update only ${updateField} field in given course by id ${role.hint}`, async () => {
            const res = await request(app)
              .put(`/course/${role.course_id()}`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send({ [`${updateField}`]: randomCourse[updateField] });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
          });
        });
      });
    });

    describe("should allow admin and instructor to update more than one field in given course by id", () => {
      roles.forEach((role) => {
        const randomCourse = createCourse();
        it(`should allow ${role.name} to update more than one field in given user profile by id ${role.hint}`, async () => {
          const res = await request(app)
            .put(`/course/${role.course_id()}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomCourse);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
  });

  // ❌ Authorization scenarios
  describe("Negative Testing", () => {
    let adminToken, instructorToken, studentToken, unauthorizedInstructorToken;
    let courseIdToUpdate;

    beforeAll(async () => {
      // login users
      instructorToken = await getToken(instructorUser);
      adminToken = await getToken(adminUser);
      unauthorizedInstructorToken = await createAndLoginUser(
        createUser("instructor"),
      );
      const course = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseIdToUpdate = response.body.course.id;
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        hint: "",
      },
      {
        name: "instructor",
        token: () => instructorToken,
        hint: "his own course",
      },
      ,
    ];
    describe("Authorization scenarios", () => {
      const authScenarios = [
        { name: "missing", setHeader: (req) => req },
        { name: "empty", setHeader: (req) => req.set("Authorization", "") },
        {
          name: "invalid",
          values: ["Bearer invalid", "invalid", "Bearer ", "123"],
        },
        {
          name: "student token",
          setHeader: (req) =>
            req.set("Authorization", `Bearer ${studentToken}`),
        },
        {
          name: "instructor token",
          setHeader: (req) =>
            req.set("Authorization", `Bearer ${unauthorizedInstructorToken}`),
        },
      ];
      const randomCourse = createCourse();
      authScenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 for invalid auth (${value})`, async () => {
              const res = await request(app)
                .put(`/course/${courseIdToUpdate}`)
                .set("Authorization", value)
                .send(randomCourse);

              expect(res.status).toBe(401);
            });
          });
        } else {
          it(`should return 401 if auth is (${scenario.name})`, async () => {
            let req = request(app)
              .put(`/course/${courseIdToUpdate}`)
              .send(randomCourse);
            req = scenario.setHeader(req);

            const res = await req;

            expect(res.status).toBe(401);
          });
        }
      });
    });

    // ❌ Edge cases
    describe("Edge cases", () => {
      const roles = [
        { name: "admin", token: () => adminToken },
        { name: "instructor", token: () => instructorToken },
      ];
      const randomCourse = createCourse();
      roles.forEach((role) => {
        it(`should return 404 if user does not exist (${role.name})`, async () => {
          const res = await request(app)
            .put(`/course/999999`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomCourse);

          expect(res.status).toBe(404);
        });

        it(`should return 400 for invalid id format (${role.name}`, async () => {
          const res = await request(app)
            .delete(`/course/invalid-id`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomCourse);

          expect(res.status).toBe(400);
        });
      });
    });

    describe("Should return 400 if the body request is (missing, empty, invalid fields)", () => {
      const scenarios = [
        { name: "missing", value: undefined },
        { name: "empty", value: "" },
        {
          name: "invalid field (instructor_id)",
          value: { instructor_id: "10" },
        },
      ];
      roles.forEach((role) => {
        scenarios.forEach((scenario) => {
          it(`should return 400 if the body of request is (${scenario.name}) (${role.name})`, async () => {
            const res = await request(app)
              .put(`/course/${courseIdToUpdate}`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send(scenario.value);

            expect(res.status).toBe(400);
            expect(res.body.errors[0]).toHaveProperty("message");
          });
        });
      });
    });
    describe("Course update validation (Empty, Invalid)", () => {
      const requiredFields = [
        "title",
        "description",
        "short_description",
        "start_date",
        "end_date",
        "tag",
        "category",
      ];

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
                const course = {};

                course[field] = value;

                const response = await request(app)
                  .put(`/course/${courseIdToUpdate}`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(course);

                expect(response.status).toBe(400);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        });
      });
    });
    describe("Course Duriation validation", () => {
      const requiredFields = ["start_date", "end_date"];
      const start_date = "2026-05-20T00:00:00Z";
      const end_date = "2026-08-20T00:00:00Z";
      // Common invalid values for most fields

      // Custom invalid values for specific fields
      const fieldInvalids = {
        start_date: [
          "2000-05-20T00:00:00Z",
          "2021-05-20T00:00:00Z",
          "2022-05-20T00:00:00Z",
          "2023-05-20T00:00:00Z",
          "2024-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-06-20T00:00:00Z",
          "2025-07-20T00:00:00Z",
          "2025-08-18T00:00:00Z",
          "2025-08-19T00:00:00Z",

          "2026-08-14T00:00:00Z",
          "2026-08-15T00:00:00Z",
          "2026-08-16T00:00:00Z",
          "2026-08-17T00:00:00Z",
          "2026-08-18T00:00:00Z",
          "2026-08-19T00:00:00Z",
          "2026-08-20T00:00:00Z", // ---------------
          "2026-08-21T00:00:00Z",
          "2026-08-22T00:00:00Z",
          "2026-08-23T00:00:00Z",
          "2026-08-24T00:00:00Z",
          "2026-08-25T00:00:00Z",
          "2026-08-26T00:00:00Z",

          "2026-09-26T00:00:00Z",
          "2027-08-26T00:00:00Z",
          "2028-08-26T00:00:00Z",
          "2029-08-26T00:00:00Z",
          "2030-08-26T00:00:00Z",
          "2046-08-26T00:00:00Z",
          "2056-08-26T00:00:00Z",
          "2126-08-26T00:00:00Z",
        ], // too long string example
        end_date: [
          "2000-05-20T00:00:00Z",
          "2021-05-20T00:00:00Z",
          "2022-05-20T00:00:00Z",
          "2023-05-20T00:00:00Z",
          "2024-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-05-20T00:00:00Z",
          "2025-06-20T00:00:00Z",
          "2025-07-20T00:00:00Z",
          "2026-03-18T00:00:00Z",
          "2026-04-19T00:00:00Z",

          "2026-05-14T00:00:00Z",
          "2026-05-15T00:00:00Z",
          "2026-05-16T00:00:00Z",
          "2026-05-17T00:00:00Z",
          "2026-05-18T00:00:00Z",
          "2026-05-19T00:00:00Z",
          "2026-05-20T00:00:00Z", // ---------------
          "2026-05-21T00:00:00Z",
          "2026-05-22T00:00:00Z",
          "2026-05-23T00:00:00Z",
          "2026-05-24T00:00:00Z",
          "2026-05-25T00:00:00Z",
          "2026-05-26T00:00:00Z",

          "2027-05-21T00:00:00Z",
          "2027-05-22T00:00:00Z",
          "2027-05-23T00:00:00Z",
          "2027-05-24T00:00:00Z",
          "2027-05-25T00:00:00Z",
          "2027-05-26T00:00:00Z",
          "2027-05-24T00:00:00Z",
          "2027-06-24T00:00:00Z",
          "2027-07-24T00:00:00Z",
          "2027-08-24T00:00:00Z",
          "2027-09-24T00:00:00Z",
          "2028-09-24T00:00:00Z",
          "2029-09-24T00:00:00Z",
          "2049-09-24T00:00:00Z",
          "2159-09-24T00:00:00Z",
          "2179-09-24T00:00:00Z",
          "2199-09-24T00:00:00Z",
        ],
      };

      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          let values = fieldInvalids[field];
          values.forEach((value) => {
            it(`should return 400 if duriation is invalid (${field == "start_date" ? value : start_date}) (${field == "end_date" ? value : end_date}) (${role.name})`, async () => {
              const response = await request(app)
                .post("/course")
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
