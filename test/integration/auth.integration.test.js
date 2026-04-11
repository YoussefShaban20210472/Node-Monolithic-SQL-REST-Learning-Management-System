const app = require("../../app");
const request = require("supertest");

const adminUser = {
  email: "admin@example.com",
  password: "0Admin@example.com",
};

describe("Testing Post /user/login", () => {
  describe("Positive Testing", () => {
    it("Should login successfully", async () => {
      let response = await request(app).post("/user/login").send(adminUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });
  });
  describe("Negative Testing", () => {
    it("Should return 400 if nothing is sent", async () => {
      let response = await request(app).post("/user/login");
      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty("message");
    });

    describe("User login validation (Missing, Empty, Invalid)", () => {
      const requiredFields = ["email", "password"];

      // Common invalid values for most fields
      const commonInvalids = [123, 5.999, null, true, false];

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
              const user = {
                email: "test@example.com",
                password: "Test@1230",
              };

              if (scenario === "missing") delete user[field];
              else user[field] = value;

              const response = await request(app)
                .post("/user/login")
                .send(user);

              expect(response.status).toBe(400);
              expect(response.body.errors[0]).toHaveProperty("property", field);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
  });
});

describe("Testing Post /user/logout", () => {
  describe("Positive Testing", () => {
    it("Should logout successfully", async () => {
      let response = await request(app).post("/user/login").send(adminUser);
      const token = response.body.token;
      response = await request(app)
        .post("/user/logout")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
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
                .post("/user/logout")
                .set("Authorization", value);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app).post("/user/logout");
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
