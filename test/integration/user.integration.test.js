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

describe("Testing Delete /user/:id", () => {
  let adminToken, studentToken, instructorToken;
  let userIdToDelete;

  beforeAll(async () => {
    // login users
    const adminRes = await request(app).post("/user/login").send(adminUser);
    adminToken = adminRes.body.token;

    const studentRes = await request(app).post("/user/login").send(studentUser);
    studentToken = studentRes.body.token;

    const instructorRes = await request(app)
      .post("/user/login")
      .send(instructorUser);
    instructorToken = instructorRes.body.token;

    // create a user to delete
    const newUser = createUser();
    const createRes = await request(app)
      .post("/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newUser);

    userIdToDelete = createRes.body.user.id;
  });

  // ✅ Positive
  describe("Positive Testing", () => {
    it("should allow admin to delete user by id", async () => {
      const res = await request(app)
        .delete(`/user/${userIdToDelete}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
  });
  describe("Negative Testing", () => {
    // ❌ Authorization scenarios
    const authScenarios = [
      { name: "missing", setHeader: (req) => req },
      { name: "empty", setHeader: (req) => req.set("Authorization", "") },
      {
        name: "invalid",
        values: ["Bearer invalid", "invalid", "Bearer ", "123"],
      },
      {
        name: "student token",
        setHeader: (req) => req.set("Authorization", `Bearer ${studentToken}`),
      },
      {
        name: "instructor token",
        setHeader: (req) =>
          req.set("Authorization", `Bearer ${instructorToken}`),
      },
    ];

    authScenarios.forEach((scenario) => {
      if (scenario.name === "invalid") {
        scenario.values.forEach((value) => {
          it(`should return 401 for invalid auth (${value})`, async () => {
            const res = await request(app)
              .delete(`/user/${userIdToDelete}`)
              .set("Authorization", value);

            expect(res.status).toBe(401);
          });
        });
      } else {
        it(`should return 401 if auth is ${scenario.name}`, async () => {
          let req = request(app).delete(`/user/${userIdToDelete}`);
          req = scenario.setHeader(req);

          const res = await req;

          expect(res.status).toBe(401);
        });
      }
    });

    // ❌ Edge cases
    it("should return 404 if user does not exist", async () => {
      const res = await request(app)
        .delete(`/user/999999`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid id format", async () => {
      const res = await request(app)
        .delete(`/user/invalid-id`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});

describe("DELETE /user/me", () => {
  // ✅ Positive (each test gets fresh user)
  describe("Positive Testing", () => {
    const successScenarios = [
      { name: "admin", user: () => createUser("admin") },
      { name: "student", user: () => createUser("student") },
      { name: "instructor", user: () => createUser("instructor") },
    ];

    successScenarios.forEach(async (scenario) => {
      it(`should allow ${scenario.name} to delete their own account`, async () => {
        const user = scenario.user();
        const token = await createAndLoginUser(user);

        const res = await request(app)
          .delete("/user/me")
          .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
  // ❌ Authorization scenarios
  describe("Negative Testing", () => {
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
          it(`should return 401 if token is invalid (${value})`, async () => {
            const res = await request(app)
              .delete("/user/me")
              .set("Authorization", value);

            expect(res.status).toBe(401);
          });
        });
      } else {
        it(`should return 401 if auth is ${scenario.name}`, async () => {
          let req = request(app).delete("/user/me");
          req = scenario.setHeader(req);

          const res = await req;

          expect(res.status).toBe(401);
        });
      }
    });

    // 🔥 Security: token should not work after deletion
    it("should not allow reuse of token after self deletion", async () => {
      const user = createUser("student");
      const token = await createAndLoginUser(user);

      const res = await request(app)
        .delete("/user/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const retry = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${token}`);

      expect(retry.status).toBe(401);
    });
  });
});

describe("Testing PUT /user/me", () => {
  // ✅ Positive (each test gets fresh user)
  describe("Positive Testing", () => {
    const successScenarios = [
      { name: "admin", user: () => createUser("admin") },
      { name: "student", user: () => createUser("student") },
      { name: "instructor", user: () => createUser("instructor") },
    ];
    describe("should allow users to update only one field in their own account", () => {
      const updateFields = [
        "first_name",
        "last_name",
        "phone_number",
        "address",
        "email",
      ];
      successScenarios.forEach((scenario) => {
        let user;
        let token;
        const randomUser = createUser();
        beforeAll(async () => {
          user = scenario.user();
          token = await createAndLoginUser(user);
        });

        updateFields.forEach((updateField) => {
          it(`should allow ${scenario.name} to update only ${updateField} field in their own account`, async () => {
            const res = await request(app)
              .put("/user/me")
              .set("Authorization", `Bearer ${token}`)
              .send({ [`${updateField}`]: randomUser[updateField] });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
          });
        });
      });
    });
    describe("should allow users to update more than one field in their own account", () => {
      successScenarios.forEach((scenario) => {
        let user;
        let token;
        const randomUser = createUser();
        delete randomUser.password;
        delete randomUser.role;
        beforeAll(async () => {
          user = scenario.user();
          token = await createAndLoginUser(user);
        });

        it(`should allow ${scenario.name} to update more than one field in their own account`, async () => {
          const res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${token}`)
            .send(randomUser);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
    describe("should invalidate the token of users if they update their own email account", () => {
      successScenarios.forEach((scenario) => {
        let user;
        let token;
        const randomUser = createUser();
        delete randomUser.password;
        delete randomUser.role;
        beforeAll(async () => {
          user = scenario.user();
          token = await createAndLoginUser(user);
        });
        it(`should invalidate the token of ${scenario.name} if the user update their own email account`, async () => {
          let res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${token}`)
            .send(randomUser);

          res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${token}`)
            .send(randomUser);
          expect(res.status).toBe(401);
          expect(res.body.errors[0]).toHaveProperty("message");
        });
      });
    });
    describe("should not invalidate the token of users if they didn't update their own email account", () => {
      successScenarios.forEach((scenario) => {
        let user;
        let token;
        const randomUser = createUser();
        delete randomUser.password;
        delete randomUser.role;
        delete randomUser.email;
        beforeAll(async () => {
          user = scenario.user();
          token = await createAndLoginUser(user);
        });
        it(`should invalidate the token of ${scenario.name} if the user update their own email account`, async () => {
          let res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${token}`)
            .send(randomUser);

          res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${token}`)
            .send(randomUser);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
  });
  // ❌ Authorization scenarios
  describe("Negative Testing", () => {
    describe("Authorization scenarios", () => {
      const authScenarios = [
        { name: "missing", setHeader: (req) => req },
        { name: "empty", setHeader: (req) => req.set("Authorization", "") },
        {
          name: "invalid",
          values: ["Bearer invalid", "invalid", "Bearer ", "123"],
        },
      ];
      const randomUser = createUser();

      authScenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if token is invalid (${value})`, async () => {
              const res = await request(app)
                .put("/user/me")
                .set("Authorization", value)
                .send(randomUser);

              expect(res.status).toBe(401);
            });
          });
        } else {
          it(`should return 401 if auth is ${scenario.name}`, async () => {
            let req = request(app).put("/user/me").send(randomUser);
            req = scenario.setHeader(req);

            const res = await req;

            expect(res.status).toBe(401);
          });
        }
      });
    });
    describe("Should return 400 if the body request is (missing, empty, invalid fields)", () => {
      let adminToken, studentToken, instructorToken;
      beforeAll(async () => {
        // login users
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

      const roles = [
        { name: "admin", token: () => adminToken },
        { name: "student", token: () => studentToken },
        { name: "instructor", token: () => instructorToken },
      ];
      roles.forEach((role) => {
        const scenarios = [
          { name: "missing", value: undefined },
          { name: "empty", value: "" },
          {
            name: "invalid field (password)",
            value: { password: "Password@123" },
          },
          {
            name: "invalid field (role)",
            value: { role: "admin" },
          },
        ];
        scenarios.forEach((scenario) => {
          it(`should return 400 if the body of request  is (${scenario.name})  (${role.name})`, async () => {
            const res = await request(app)
              .put("/user/me")
              .set("Authorization", `Bearer ${role.token()}`)
              .send(scenario.value);

            expect(res.status).toBe(400);
            expect(res.body.errors[0]).toHaveProperty("message");
          });
        });
      });
    });
    describe("User update validation (Empty, Invalid)", () => {
      let adminToken, studentToken, instructorToken;
      beforeAll(async () => {
        // login users
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

      const roles = [
        { name: "admin", token: () => adminToken },
        { name: "student", token: () => studentToken },
        { name: "instructor", token: () => instructorToken },
      ];

      const requiredFields = [
        "first_name",
        "last_name",
        "phone_number",
        "address",
        "email",
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
              }  (${role.name})`, async () => {
                const user = {};

                user[field] = value;

                const response = await request(app)
                  .put("/user/me")
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(user);

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

describe("Testing PUT /user/:id", () => {
  // ✅ Positive (each test gets fresh user)
  describe("Positive Testing", () => {
    let adminToken, userIdToUpdate;
    beforeAll(async () => {
      // login users
      const adminRes = await request(app).post("/user/login").send(adminUser);
      adminToken = adminRes.body.token;
      const newUser = createUser("student");
      const createRes = await request(app)
        .post("/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser);
      userIdToUpdate = createRes.body.user.id;
    });

    describe("should allow users to update only one field in given user profile by id", () => {
      const updateFields = [
        "first_name",
        "last_name",
        "phone_number",
        "address",
        "email",
      ];
      const randomUser = createUser();

      updateFields.forEach((updateField) => {
        it(`should allow admin to update only ${updateField} field in given user profile by id`, async () => {
          const res = await request(app)
            .put(`/user/${userIdToUpdate}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ [`${updateField}`]: randomUser[updateField] });
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });

    describe("should allow users to update more than one field in given user profile by id", () => {
      const randomUser = createUser();
      delete randomUser.password;
      delete randomUser.role;

      it(`should allow admin to update more than one field in given user profile by id`, async () => {
        const res = await request(app)
          .put(`/user/${userIdToUpdate}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(randomUser);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
    describe("should invalidate the token of users if the admin update their email accounts", () => {
      const randomUser = createUser();

      it(`should invalidate the token of given user if the user update an user's email account`, async () => {
        let newUser = createUser("student");
        let token = await createAndLoginUser(newUser);
        res = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${token}`);
        let id = res.body.user.id;

        res = await request(app)
          .put(`/user/${id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(randomUser);

        res = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(401);
        expect(res.body.errors[0]).toHaveProperty("message");
      });
    });
    describe("should not invalidate the token of users if the admin didn't update their email account", () => {
      const randomUser = createUser();
      delete randomUser.password;
      delete randomUser.role;
      delete randomUser.email;

      it(`should not invalidate the token of given user if the admin didn't update an user's email account`, async () => {
        let newUser = createUser("student");
        let token = await createAndLoginUser(newUser);
        res = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${token}`);
        let id = res.body.user.id;

        res = await request(app)
          .put(`/user/${id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(randomUser);

        res = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
      });
    });
  });
  // ❌ Authorization scenarios
  describe("Negative Testing", () => {
    let adminToken, userIdToUpdate;
    beforeAll(async () => {
      // login users
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
      const newUser = createUser("student");
      const createRes = await request(app)
        .post("/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser);
      userIdToUpdate = createRes.body.user.id;
    });
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
            req.set("Authorization", `Bearer ${instructorToken}`),
        },
      ];
      const randomUser = createUser();

      authScenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if token is invalid (${value})`, async () => {
              const res = await request(app)
                .put(`/user/${userIdToUpdate}`)
                .set("Authorization", value)
                .send(randomUser);

              expect(res.status).toBe(401);
            });
          });
        } else {
          it(`should return 401 if auth is ${scenario.name}`, async () => {
            let req = request(app)
              .put(`/user/${userIdToUpdate}`)
              .send(randomUser);
            req = scenario.setHeader(req);

            const res = await req;

            expect(res.status).toBe(401);
          });
        }
      });
    });
    describe("Should return 400 if the body request is (missing, empty, invalid fields)", () => {
      const scenarios = [
        { name: "missing", value: undefined },
        { name: "empty", value: "" },
        {
          name: "invalid field (password)",
          value: { password: "Password@123" },
        },
        {
          name: "invalid field (role)",
          value: { role: "admin" },
        },
      ];
      scenarios.forEach((scenario) => {
        it(`should return 400 if the body of request  is (${scenario.name})`, async () => {
          const res = await request(app)
            .put(`/user/${userIdToUpdate}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(scenario.value);

          expect(res.status).toBe(400);
          expect(res.body.errors[0]).toHaveProperty("message");
        });
      });
    });
    describe("User update validation (Empty, Invalid)", () => {
      const requiredFields = [
        "first_name",
        "last_name",
        "phone_number",
        "address",
        "email",
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
      const scenarios = ["empty", "invalid"];
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
              const user = {};

              user[field] = value;

              const response = await request(app)
                .put(`/user/${userIdToUpdate}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(user);

              expect(response.status).toBe(400);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});
