const {
  app,
  request,
  createUser,
  createCourse,
  generateRandomString,
  adminUser,
  studentUser,
  instructorUser,
  createAndLoginUser,
  getToken,
  courseDuriationFieldInvalids,
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
  testInvalidObjectDuriationRequest,
} = require("../utils/preMadeTests");
jest.setTimeout(30000);
let adminToken, instructorToken, studentToken, instructorId;

beforeAll(async () => {
  adminToken = await getToken(adminUser);
  instructorToken = await getToken(instructorUser);
  studentToken = await getToken(studentUser);
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
  },
  {
    name: "instructor",
    token: () => instructorToken,
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
  description: [...commonInvalids.slice(8), "123", "123000", "5", "10", "96"], // too long string example
  instructor_id: [...commonInvalids.slice(5)],
};

describe("Testing Post /course", () => {
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`Should allow ${role.name} to create a new course`, async () => {
        const course = createCourse();
        course.instructor_id = `${instructorId}`;
        response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${role.token()}`)
          .send(course);

        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => "/course",
        roles,
        (req, url) => req.post(url),
      );
    });
    describe("Course creation validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => "/course",
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
        () => {
          return { ...createCourse(), instructor_id: `${instructorId}` };
        },
      );
      testInvalidObjectCreationRequest(
        () => "/course",
        [roles[0]],
        ["instructor_id"],
        fieldInvalids,
        commonInvalids,
        () => {
          return { ...createCourse(), instructor_id: `${instructorId}` };
        },
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/course",
        createCourse,
        [{ name: "student user", token: () => studentToken }],
        (req, url) => req.post(url),
      );
    });
    describe("Course Duriation validation", () => {
      testInvalidObjectDuriationRequest(
        () => "/course",
        roles,
        createCourse,
        courseDuriationFieldInvalids,
        (req, url) => req.post(url),
      );
    });
  });
});

describe("Testing Delete /course/:course_id", () => {
  describe("Positive Testing", () => {
    let courseIdToDelete;
    beforeEach(async () => {
      const course = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseIdToDelete = response.body.course.id;
    });
    roles.forEach((role) => {
      it(`should allow ${role.name} to delete course by id`, async () => {
        const res = await request(app)
          .delete(`/course/${courseIdToDelete}`)
          .set("Authorization", `Bearer ${role.token()}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
  describe("Negative Testing", () => {
    let courseIdToDelete;
    beforeAll(async () => {
      const course = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseIdToDelete = response.body.course.id;
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => "/course/9999999",
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let instructorToken;
      beforeAll(async () => {
        instructorToken = await createAndLoginUser(createUser("instructor"));
      });
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseIdToDelete}`,
        () => undefined,
        [
          { name: "student user", token: () => studentToken },
          { name: "instructor user", token: () => instructorToken },
        ],
        (req, url) => req.delete(url),
      );
    });

    describe("Should return 404 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => "/course/invalid-id",
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
  });
});

describe("Testing Get /course/:course_id", () => {
  let courseIdToGet;
  beforeAll(async () => {
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseIdToGet = response.body.course.id;
  });
  describe("Positive Testing", () => {
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
      it(`should allow ${role.name} to get course by id ${role.hint}`, async () => {
        const res = await request(app)
          .get(`/course/${courseIdToGet}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("course");
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => "/course/9999999",
        [...roles, { name: "student", token: () => studentToken }],
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let instructorToken;
      beforeAll(async () => {
        instructorToken = await createAndLoginUser(createUser("instructor"));
      });
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseIdToGet}`,
        () => undefined,
        [{ name: "instructor user", token: () => instructorToken }],
        (req, url) => req.get(url),
      );
    });

    describe("Should return 404 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => "/course/invalid-id",
        [...roles, { name: "student", token: () => studentToken }],
        () => undefined,
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing Get /course/all", () => {
  describe("Positive Testing", () => {
    let newInstructorToken;
    beforeAll(async () => {
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
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => "/course/all",
        () => undefined,
        [],
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing PUT /course/:course_id", () => {
  describe("Positive Testing", () => {
    let courseIdToUpdate;
    beforeEach(async () => {
      const course = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      courseIdToUpdate = response.body.course.id;
    });
    describe("should allow admin and instructor to update only one field in given course by id", () => {
      testUpdateOneFieldInObjectRequest(
        () => `/course/${courseIdToUpdate}`,
        roles,
        createCourse,
        requiredFields,
      );
    });

    describe("should allow admin and instructor to update more than one field in given course by id", () => {
      testUpdateManyFieldsInObjectRequest(
        () => `/course/${courseIdToUpdate}`,
        roles,
        createCourse,
      );
    });
  });

  describe("Negative Testing", () => {
    let courseIdToUpdate;
    beforeAll(async () => {
      const course = createCourse();
      let response = await request(app)
        .post("/course")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(course);
      expect(response.status).toBe(201);
      courseIdToUpdate = response.body.course.id;
    });
    describe("Should return 404 if the user is not found", () => {
      testNotFoundObjectRequest(
        () => "/course/9999999",
        roles,
        createCourse,
        (req, url) => req.put(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let instructorToken;
      beforeAll(async () => {
        instructorToken = await createAndLoginUser(createUser("instructor"));
      });
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseIdToUpdate}`,
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
        () => "/course/invalid-id",
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseIdToUpdate}`,
        roles,
        (req, url) => req.put(url),
      );
    });
    describe("Course update validation (Empty, Invalid)", () => {
      testInvalidObjectUpdateRequest(
        () => `/course/${courseIdToUpdate}`,
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
      );
      testInvalidObjectUpdateRequest(
        () => `/course/${courseIdToUpdate}`,
        roles,
        ["instructor_id"],
        fieldInvalids,
        commonInvalids,
      );
    });
    describe("Course Duriation validation", () => {
      testInvalidObjectDuriationRequest(
        () => `/course/${courseIdToUpdate}`,
        roles,
        createCourse,
        courseDuriationFieldInvalids,
        (req, url) => req.put(url),
      );
    });
  });
});
