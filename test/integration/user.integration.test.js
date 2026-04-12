const app = require("../../app");
const request = require("supertest");

function createUser() {
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
    role: "student",
  };
  return user;
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
describe("Testing Post /user", () => {
  describe("Positive Testing", () => {
    it("Should create a new user", async () => {
      let response = await request(app).post("/user/login").send(adminUser);
      const token = response.body.token;
      const user = createUser();
      response = await request(app)
        .post("/user")
        .set("Authorization", `Bearer ${token}`)
        .send(user);
      const createdUser = response.body.user;
      console.log(createdUser);
      expect(response.status).toBe(201);
      expect(createdUser.first_name).toBe(user.first_name);
      expect(createdUser.last_name).toBe(user.last_name);
      expect(createdUser.email).toBe(user.email);
      expect(createdUser.phone_number).toBe(user.phone_number);
      expect(createdUser.address).toBe(user.address);
      expect(createdUser.role).toBe(user.role);
      expect(createdUser).toHaveProperty("id");
      expect(createdUser.password).toBeUndefined();
    });
  });
  describe("Negative Testing", () => {
    it("Should return 400 if nothing is sent", async () => {
      let response = await request(app).post("/user/login").send(adminUser);
      const token = response.body.token;
      response = await request(app)
        .post("/user")
        .set("Authorization", `Bearer ${token}`);
      const createdUser = response.body.user;
      console.log(createdUser);
      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty("message");
    });
    describe("User creation validation (Missing, Empty, Invalid)", () => {
      let token;

      beforeEach(async () => {
        // Log in once and get token
        const response = await request(app).post("/user/login").send(adminUser);
        token = response.body.token;
      });

      const requiredFields = [
        "first_name",
        "last_name",
        "phone_number",
        "address",
        "role",
        "email",
        "password",
      ];

      // Common invalid values for most fields
      const commonInvalids = [
        generateRandomString(50),
        generateRandomString(100),
        generateRandomString(10) + "123546",
        123,
        5.999,
        "a",
        "aa",
        "@#$dadsadad@#",
        null,
        true,
        false,
        generateRandomString(50) + "@" + generateRandomString(10) + ".",
        "A@A.A",
      ];

      // Custom invalid values for specific fields
      const fieldInvalids = {
        address: [...commonInvalids.slice(3), "x".repeat(1000)], // too long string example
      };

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
            values = fieldInvalids[field] || commonInvalids; // invalid values
          }

          values.forEach((value) => {
            it(`should return 400 if ${field} is ${scenario}${
              scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
            }`, async () => {
              const user = createUser();

              if (scenario === "missing") delete user[field];
              else user[field] = value;

              const response = await request(app)
                .post("/user")
                .set("Authorization", `Bearer ${token}`)
                .send(user);
              if (response.status == 401) console.log(response.body);
              expect(response.status).toBe(400);
              expect(response.body.errors[0]).toHaveProperty("property", field);
              expect(response.body.errors[0]).toHaveProperty("message");
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
            { name: "student user", user: studentUser },
            { name: "instructor user", user: instructorUser },
          ],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const user = createUser();

              const response = await request(app)
                .post("/user")
                .set("Authorization", value)
                .send(user);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              let response = await request(app)
                .post("/user/login")
                .send(value.user);
              const token = response.body.token;
              const user = createUser();

              response = await request(app)
                .post("/user")
                .set("Authorization", `Bearer ${token}`)
                .send(user);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            const user = createUser();

            let req = request(app).post("/user").send(user);
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

describe("Testing Get /user/all", () => {
  describe("Positive Testing", () => {
    it("Should get a list of all existing users only if the caller was an admin", async () => {
      let response = await request(app).post("/user/login").send(adminUser);
      const token = response.body.token;
      console.log(token);
      response = await request(app)
        .get("/user/all")
        .set("Authorization", `Bearer ${token}`)
        .send();
      const users = response.body.users;
      console.log(users);
      const user = users[0];
      expect(response.status).toBe(200);
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("first_name");
      expect(user).toHaveProperty("last_name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("address");
      expect(user).toHaveProperty("phone_number");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("created_at");
      expect(user).toHaveProperty("updated_at");

      expect(user).not.toHaveProperty("password");
    });
  });
  describe("Negative Testing", () => {
    describe("Authorization validation (Missing, Empty, Invalid)", () => {
      let adminToken;
      let studentToken;
      let instructorToken;

      beforeAll(async () => {
        const adminRes = await request(app).post("/user/login").send(adminUser);

        adminToken = adminRes.body.token;

        const studentRes = await request(app)
          .post("/user/login")
          .send(studentUser);

        studentToken = studentRes.body.token;

        const instructorRes = await request(app)
          .post("/user/login")
          .send(instructorUser);

        instructorToken = instructorRes.body.token;
      });

      const scenarios = [
        {
          name: "missing",
          setHeader: (req) => req, // no Authorization header
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
          name: "student token",
          setHeader: (req) =>
            req.set("Authorization", `Bearer ${studentToken}`),
        },
        {
          name: "instructor token",
          setHeader: (req) =>
            req.set("Authorization", `Bearer ${instructorToken}`),
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              let req = request(app).get("/users");

              req = req.set("Authorization", value);

              const response = await req;

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app).get("/users");

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

describe("Testing Get /user/me", () => {
  describe("Positive Testing", () => {
    let adminToken;
    let studentToken;
    let instructorToken;

    beforeAll(async () => {
      const adminRes = await request(app).post("/user/login").send(adminUser);
      adminToken = adminRes.body.token;

      const studentRes = await request(app)
        .post("/user/login")
        .send(studentUser);
      studentToken = studentRes.body.token;

      const instructorRes = await request(app)
        .post("/user/login")
        .send(instructorUser);
      instructorToken = instructorRes.body.token;
    });

    const scenarios = [
      {
        name: "admin user",
        token: () => adminToken,
        user: adminUser,
      },
      {
        name: "student user",
        token: () => studentToken,
        user: studentUser,
      },
      {
        name: "instructor user",
        token: () => instructorToken,
        user: instructorUser,
      },
    ];

    scenarios.forEach((scenario) => {
      it(`should get user info successfully for ${scenario.name}`, async () => {
        const response = await request(app)
          .get("/user/me")
          .set("Authorization", `Bearer ${scenario.token()}`);
        const user = response.body.user;

        expect(response.status).toBe(200);
        expect(scenario.user.email).toBe(user.email);

        expect(user).toHaveProperty("first_name");
        expect(user).toHaveProperty("last_name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("phone_number");
        expect(user).toHaveProperty("address");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("id");
        expect(user.password).toBeUndefined();
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Authorization validation (Missing, Empty, Invalid)", () => {
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
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .get("/user/me")
                .set("Authorization", value);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app).get("/user/me");
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

describe("Testing Get /user/:id", () => {
  describe("Positive Testing", () => {
    it("Should get user info of given id only if the caller was an admin and the given id is there", async () => {
      let response = await request(app).post("/user/login").send(adminUser);
      const token = response.body.token;
      const id = "1";
      response = await request(app)
        .get(`/user/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      const user = response.body.user;
      expect(response.status).toBe(200);
      expect(`${user.id}`).toBe(id);
      expect(user).toHaveProperty("first_name");
      expect(user).toHaveProperty("last_name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("phone_number");
      expect(user).toHaveProperty("address");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("id");
      expect(user.password).toBeUndefined();
    });
  });
  describe("Negative Testing", () => {
    it("Should return 404 if the given id is not found only if the caller was an admin and the given id is there", async () => {
      let response = await request(app).post("/user/login").send(adminUser);
      const token = response.body.token;
      const id = "6000";
      response = await request(app)
        .get(`/user/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send();
      expect(response.status).toBe(404);
      expect(response.body.errors[0]).toHaveProperty("message");
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
            { name: "student user", user: studentUser },
            { name: "instructor user", user: instructorUser },
          ],
        },
      ];
      const ids = ["1", "2", "3", "5", "10", "15", "20", "50", "100", "125"];
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            ids.forEach((id) => {
              it(`should return 401 if Authorization is invalid (${value}) and id is (${id})`, async () => {
                const response = await request(app)
                  .get(`/user/${id}`)
                  .set("Authorization", value)
                  .send();

                expect(response.status).toBe(401);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            ids.forEach((id) => {
              it(`should return 401 if Authorization is unauthorized as (${value}) and id is (${id})`, async () => {
                const response = await request(app)
                  .get(`/user/${id}`)
                  .set("Authorization", value)
                  .send();

                expect(response.status).toBe(401);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        } else {
          ids.forEach((id) => {
            it(`should return 401 if Authorization is ${scenario.name} and id is (${id})`, async () => {
              let response = request(app).get(`/user/${id}`).send();
              response = scenario.setHeader(response);
              response = await response;

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        }
      });
    });
  });
});
