const {
  app,
  request,
  createAndLoginUser,
  createUser,
  getToken,
} = require("../utils/testingUtils");
const {
  testInvalidBodyRequest,
  testInvalidObjectCreationRequest,
  testInvalidAuthenticationAndAuthorizationRequest,
} = require("../utils/preMadeTests");

const adminUser = {
  email: "admin2@example.com",
  password: "Password@123",
};

const studentUser = {
  email: "student2@example.com",
  password: "Password@123",
};

const instructorUser = {
  email: "instructor2@example.com",
  password: "Password@123",
};
const requiredFields = ["email", "password"];

const commonInvalids = [123, 5.999, null, true, false];
describe("Testing Post /user/login", () => {
  describe("Positive Testing", () => {
    const roles = [
      {
        name: "admin",
        user: adminUser,
      },
      {
        name: "student",
        user: studentUser,
      },
      {
        name: "instructor",
        user: instructorUser,
      },
    ];

    roles.forEach((role) => {
      it(`should login successfully as ${role.name}`, async () => {
        const response = await request(app).post("/user/login").send(role.user);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(typeof response.body.token).toBe("string");
        expect(response.body.token.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => "/user/login",
        [{ name: "", token: () => "" }],
        (req, url) => req.post(url),
      );
    });
    describe("User login validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => "/user/login",
        [{ name: "", token: () => "" }],
        requiredFields,
        {},
        commonInvalids,
        createUser,
      );
    });
  });
});

describe("Testing Post /user/logout", () => {
  describe("Positive Testing", () => {
    let adminToken, studentToken, instructorToken;

    beforeAll(async () => {
      adminToken = await getToken(adminUser);
      studentToken = await getToken(studentUser);
      instructorToken = await getToken(instructorUser);
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
      {
        name: "instructor",
        token: () => instructorToken,
      },
    ];

    roles.forEach((role) => {
      it(`should logout successfully for ${role.name}`, async () => {
        const response = await request(app)
          .post("/user/logout")
          .set("Authorization", `Bearer ${role.token()}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message");
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user/logout",
        () => undefined,
        [],
        (req, url) => req.post(url),
      );
    });
  });
});
