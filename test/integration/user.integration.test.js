const {
  app,
  request,
  createUser,
  generateRandomString,
  adminUser,
  studentUser,
  instructorUser,
  createAndLoginUser,
  getToken,
} = require("../utils/testingUtils");

const {
  testInvalidBodyRequest,
  testInvalidObjectCreationRequest,
  testInvalidObjectUpdateRequest,
  testInvalidAuthenticationAndAuthorizationRequest,
  testNotFoundObjectRequest,
  testInvalidObjectIDFormatRequest,
  testUpdateOneFieldInObjectRequest,
  testUpdateManyFieldsInObjectRequest,
} = require("../utils/preMadeTests");

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
const updateFields = [
  "first_name",
  "last_name",
  "phone_number",
  "address",
  "email",
];
let adminToken, studentToken, instructorToken;

beforeAll(async () => {
  adminToken = await getToken(adminUser);
  studentToken = await getToken(studentUser);
  instructorToken = await getToken(instructorUser);
});
describe("Testing Post /user", () => {
  describe("Positive Testing", () => {
    it("Should create a new user", async () => {
      const user = createUser();
      response = await request(app)
        .post("/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(user);
      const createdUser = response.body.user;
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
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => "/user",
        [{ name: "admin", token: () => adminToken }],
        (req, url) => req.post(url),
      );
    });
    describe("User creation validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => "/user",
        [{ name: "admin", token: () => adminToken }],
        requiredFields,
        fieldInvalids,
        commonInvalids,
        createUser,
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user",
        createUser,
        [
          { name: "student user", token: () => studentToken },
          { name: "instructor user", token: () => instructorToken },
        ],
        (req, url) => req.post(url),
      );
    });
  });
});

describe("Testing Get /user/all", () => {
  describe("Positive Testing", () => {
    it("Should get a list of all existing users only if the caller was an admin", async () => {
      let response = await request(app)
        .get("/user/all")
        .set("Authorization", `Bearer ${adminToken}`)
        .send();
      const users = response.body.users;
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
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user/all",
        () => undefined,
        [
          { name: "student user", token: () => studentToken },
          { name: "instructor user", token: () => instructorToken },
        ],
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing Get /user/me", () => {
  describe("Positive Testing", () => {
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
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user/me",
        () => undefined,
        [],
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing Get /user/:id", () => {
  describe("Positive Testing", () => {
    it("Should get user info of given id only if the caller was an admin and the given id is there", async () => {
      const id = "1";
      response = await request(app)
        .get(`/user/${id}`)
        .set("Authorization", `Bearer ${adminToken}`)
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
    describe("Should return 404 if the user is not found", () => {
      testNotFoundObjectRequest(
        () => "/user/9999999",
        [{ name: "admin", token: () => adminToken }],
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user/1",
        () => undefined,
        [
          { name: "student user", token: () => studentToken },
          { name: "instructor user", token: () => instructorToken },
        ],
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the user id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => "/user/invalid-id",
        [{ name: "admin", token: () => adminToken }],
        () => undefined,
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing Delete /user/:id", () => {
  let userIdToDelete;
  beforeAll(async () => {
    const newUser = createUser("student");
    const createRes = await request(app)
      .post("/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newUser);
    userIdToDelete = createRes.body.user.id;
  });

  describe("Positive Testing", () => {
    it("should allow admin to delete user by id", async () => {
      const res = await request(app)
        .delete(`/user/${userIdToDelete}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the user is not found", () => {
      testNotFoundObjectRequest(
        () => "/user/9999999",
        [{ name: "admin", token: () => adminToken }],
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user/1",
        () => undefined,
        [
          { name: "student user", token: () => studentToken },
          { name: "instructor user", token: () => instructorToken },
        ],
        (req, url) => req.delete(url),
      );
    });

    describe("Should return 404 if the user id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => "/user/invalid-id",
        [{ name: "admin", token: () => adminToken }],
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
  });
});

describe("DELETE /user/me", () => {
  describe("Positive Testing", () => {
    let adminToken, studentToken, instructorToken;

    beforeAll(async () => {
      adminToken = await createAndLoginUser(createUser("admin"));
      studentToken = await createAndLoginUser(createUser("student"));
      instructorToken = await createAndLoginUser(createUser("instructor"));
    });
    const roles = [
      { name: "admin", token: () => adminToken },
      { name: "student", token: () => studentToken },
      { name: "instructor", token: () => instructorToken },
    ];

    roles.forEach(async (scenario) => {
      it(`should allow ${scenario.name} to delete their own account`, async () => {
        const res = await request(app)
          .delete("/user/me")
          .set("Authorization", `Bearer ${scenario.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user/me",
        () => undefined,
        [],
        (req, url) => req.delete(url),
      );
    });

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
  describe("Positive Testing", () => {
    let adminToken, studentToken, instructorToken;
    let adminUser, studentUser, instructorUser;

    beforeEach(async () => {
      adminToken = await createAndLoginUser(createUser("admin"));
      studentToken = await createAndLoginUser(createUser("student"));
      instructorToken = await createAndLoginUser(createUser("instructor"));
    });
    const roles = [
      { name: "admin", token: () => adminToken },
      { name: "student", token: () => studentToken },
      { name: "instructor", token: () => instructorToken },
    ];
    describe("should allow users to update only one field in their own account", () => {
      testUpdateOneFieldInObjectRequest(
        () => "/user/me",
        roles,
        createUser,
        updateFields,
      );
    });
    describe("should allow users to update more than one field in their own account", () => {
      testUpdateManyFieldsInObjectRequest(() => "/user/me", roles, createUser);
    });
    describe("should return 401 if the users updated their emails and tried to use the old token again", () => {
      roles.forEach((role) => {
        const randomUser = createUser();

        it(`should return 401 if the users updated their emails and tried to use the old token again ${role.name}`, async () => {
          let res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomUser);
          expect(res.status).toBe(200);
          res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomUser);
          expect(res.status).toBe(401);
          expect(res.body.errors[0]).toHaveProperty("message");
        });
      });
    });
    describe("Should return 200 if the users tries to update their accounts(without email) more than times using the same token", () => {
      roles.forEach((role) => {
        const randomUser = createUser();
        delete randomUser.password;
        delete randomUser.role;
        delete randomUser.email;

        it(`Should return 200 if the users tries to update their accounts(without email) more than times using the same token (${role.name})`, async () => {
          let res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomUser);

          res = await request(app)
            .put("/user/me")
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomUser);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
  });

  describe("Negative Testing", () => {
    let adminToken, studentToken, instructorToken;
    beforeAll(async () => {
      adminToken = await createAndLoginUser(createUser("admin"));
      studentToken = await createAndLoginUser(createUser("student"));
      instructorToken = await createAndLoginUser(createUser("instructor"));
    });

    const roles = [
      { name: "admin", token: () => adminToken },
      { name: "student", token: () => studentToken },
      { name: "instructor", token: () => instructorToken },
    ];
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/user/me",
        createUser,
        [],
        (req, url) => req.put(url),
      );
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => "/user/me",
        roles,
        (req, url) => req.put(url),
      );
    });
    describe("User update validation (Empty, Invalid)", () => {
      testInvalidObjectUpdateRequest(
        () => "/user/me",
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
      );
    });
  });
});

describe("Testing PUT /user/:id", () => {
  describe("Positive Testing", () => {
    let userIdToUpdate;
    beforeEach(async () => {
      const newUser = createUser("student");
      const createRes = await request(app)
        .post("/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser);
      userIdToUpdate = createRes.body.user.id;
    });

    describe("should allow users to update only one field in given user profile by id", () => {
      testUpdateOneFieldInObjectRequest(
        () => `/user/${userIdToUpdate}`,
        [{ name: "admin", token: () => adminToken }],
        createUser,
        updateFields,
      );
    });

    describe("should allow users to update more than one field in given user profile by id", () => {
      testUpdateManyFieldsInObjectRequest(
        () => `/user/${userIdToUpdate}`,
        [{ name: "admin", token: () => adminToken }],
        createUser,
      );
    });

    describe("should return 401 if the admin updated a user's email and the user tried to use the old token again", () => {
      const randomUser = createUser();

      it(`should return 401 if the admin updated user's email and the user tried to use the old token again`, async () => {
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
    describe("Should return 200 if the admin update a user's account(without email) and the user try to use the old token", () => {
      const randomUser = createUser();
      delete randomUser.password;
      delete randomUser.role;
      delete randomUser.email;

      it(`Should return 200 if the admin update a user's account(without email) and the user try to use the old token`, async () => {
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

  describe("Negative Testing", () => {
    let userIdToUpdate;
    beforeAll(async () => {
      const newUser = createUser("student");
      const createRes = await request(app)
        .post("/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser);
      expect(createRes.status).toBe(201);
      userIdToUpdate = createRes.body.user.id;
    });
    describe("Should return 404 if the user is not found", () => {
      testNotFoundObjectRequest(
        () => "/user/9999999",
        [{ name: "admin", token: () => adminToken }],
        createUser,
        (req, url) => req.put(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/user/${userIdToUpdate}`,
        () => undefined,
        [
          { name: "student user", token: () => studentToken },
          { name: "instructor user", token: () => instructorToken },
        ],
        (req, url) => req.put(url),
      );
    });

    describe("Should return 404 if the user id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => "/user/invalid-id",
        [{ name: "admin", token: () => adminToken }],
        () => undefined,
        (req, url) => req.put(url),
      );
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/user/${userIdToUpdate}`,
        [{ name: "admin", token: () => adminToken }],
        (req, url) => req.put(url),
      );
    });
    describe("User update validation (Empty, Invalid)", () => {
      testInvalidObjectUpdateRequest(
        () => `/user/${userIdToUpdate}`,
        [{ name: "admin", token: () => adminToken }],
        requiredFields,
        fieldInvalids,
        commonInvalids,
      );
    });
  });
});
