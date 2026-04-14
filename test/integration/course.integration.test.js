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
    start_date: new Date(2026, 5, 20).toISOString(),
    end_date: new Date(2026, 8, 20).toISOString(),
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
      console.log(response.body);
      console.log(response.body, response.status, instructorToken);
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
      console.log(response.body, instructorId, response.status, adminToken);
      // console.log(response.status);
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
  });
});
