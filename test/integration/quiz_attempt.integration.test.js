const {
  app,
  request,
  createUser,
  createCourse,
  createQuiz,
  generateRandomString,
  adminUser,
  studentUser,
  instructorUser,
  createAndLoginUser,
  getToken,
  enrollStudent,
  addQuestionsAndGetIDsAndAnswers,
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
jest.setTimeout(100000);
const requiredFields = ["student_id", "answer"];

const commonInvalids = [
  "123",
  "123000",
  "5",
  "10",
  "96",
  generateRandomString(501),
  generateRandomString(700),
  generateRandomString(1000),
  generateRandomString(10) + "123546",
  "",
  null,
  undefined,
  -123,
  123,
  -5.999,
  -0.1999,
  200.1999,
  100.1999,
  110.1999,
  910.1999,
  "@#$dadsadad@#",
  ".1000",
  null,
  true,
  false,
  generateRandomString(50) + "@" + generateRandomString(10) + ".",
  "A@A.A",
  [1, 2],
  ["01", "012", "222", "1"],
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

const fieldInvalids = {
  student_id: [...commonInvalids.slice(5)],
};

let adminToken, instructorToken, studentToken, courseId;
let unauthorizedInstructorToken, unauthorizedStudentToken;
let questions_ids = [];
let questions_answers = [];
let quizId;
beforeAll(async () => {
  adminToken = await getToken(adminUser);
  instructorToken = await getToken(instructorUser);
  studentToken = await getToken(studentUser);
  unauthorizedInstructorToken = await createAndLoginUser(
    createUser("instructor"),
  );
  unauthorizedStudentToken = await createAndLoginUser(createUser("student"));
  const course = createCourse();
  response = await request(app)
    .post("/course")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(course);
  courseId = response.body.course.id;

  await enrollStudent(adminToken, studentToken, courseId);

  let result = await addQuestionsAndGetIDsAndAnswers(courseId, instructorToken);
  questions_ids = result.questions_ids;
  questions_answers = result.questions_answers;

  const quiz = createQuiz(questions_ids, 20);
  response = await request(app)
    .post(`/course/${courseId}/quiz`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(quiz);
  expect(response.status).toBe(201);
  quizId = response.body.quiz.id;
});
describe("Testing Post /course/:course_id/quiz/:quiz_id/attempt", () => {
  describe("Positive Testing", () => {
    let studentToken, studentId;
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        body: () => {
          return { student_id: `${studentId}`, answer: questions_answers };
        },
      },
      {
        name: "student",
        token: () => studentToken,
        body: () => {
          return { answer: questions_answers };
        },
      },
    ];
    roles.forEach((role) => {
      it(`Should allow ${role.name} to solve a quiz with one question`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send({ ...role.body(), answer: [questions_answers[0]] });
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(50);
      });
    });

    roles.forEach((role) => {
      it(`Should allow ${role.name} to solve a quiz with all questions`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(role.body());
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(1000);
      });
    });
  });
  describe("Negative Testing", () => {
    let studentToken, studentId;
    beforeAll(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
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
    ];
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/quiz/${quizId}/attempt`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });
    describe("Should return 404 if the quiz is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/quiz/999999/attempt`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz/${quizId}/attempt`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if the quiz id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/quiz/invalid-id/attempt`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt`,
        () => undefined,
        [
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "authorized instructor user",
            token: () => instructorToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.post(url),
      );
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt`,
        roles,
        (req, url) => req.post(url),
      );
    });
    describe("Quiz Attempt creation validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt`,
        [roles[0]],
        requiredFields,
        fieldInvalids,
        commonInvalids,
        () => {
          return { student_id: "1", answer: [] };
        },
      );
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt`,
        [roles[1]],
        ["answer"],
        fieldInvalids,
        commonInvalids,
        () => {
          return { answer: [] };
        },
      );
    });
  });
  describe("Negative Testing", () => {
    let studentToken, studentId;
    beforeEach(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
    });
    const roles = [
      {
        name: "admin",
        token: () => adminToken,
        body: () => {
          return { student_id: `${studentId}`, answer: [] };
        },
      },
      {
        name: "student",
        token: () => studentToken,
        body: () => {
          return { answer: [] };
        },
      },
    ];
    describe("Should return score 0 if a student didn't solve anything", () => {
      roles.forEach((role) => {
        it(`Should return score 0 if a student didn't solve anything (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(200);
          expect(response.body.score).toBe(0);
        });
      });
    });
    describe("Should return score 0 if a student solved questions wrongly", () => {
      roles.forEach((role) => {
        it(`Should return score 0 if a student solved questions wrongly (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send({
              ...role.body(),
              answer: [{ ...questions_answers[0], answer: "Wrong" }],
            });
          expect(response.status).toBe(200);
          expect(response.body.score).toBe(0);
        });
      });
    });
    describe("Should return 409 if a student tried to solve the same quiz twice", () => {
      roles.forEach((role) => {
        it(`Should return 409 if a student tried to solve the same quiz twice (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(200);
          expect(response.body.score).toBe(0);
          response = await request(app)
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(409);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/quiz/:quiz_id/attempt", () => {
  let studentToken, studentId;
  beforeAll(async () => {
    studentToken = await createAndLoginUser(createUser("student"));
    await enrollStudent(adminToken, studentToken, courseId);
    response = await request(app)
      .get(`/user/me`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(200);
    studentId = response.body.user.id;

    response = await request(app)
      .post(`/course/${courseId}/quiz/${quizId}/attempt`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ answer: questions_answers });
  });
  const roles = [
    {
      name: "admin",
      token: () => adminToken,
      body: () => {
        return { student_id: `${studentId}` };
      },
    },
    {
      name: "instructor",
      token: () => instructorToken,
      body: () => {
        return { student_id: `${studentId}` };
      },
    },
    {
      name: "student",
      token: () => studentToken,
      body: () => {
        return {};
      },
    },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get a student quiz attempt`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(role.body());
        expect(res.status).toBe(200);
        expect(res.body.score).toBe(1000);
        expect(`${res.body.quiz_id}`).toBe(`${quizId}`);
        expect(`${res.body.student_id}`).toBe(`${studentId}`);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/quiz/${quizId}/attempt`,
        roles,
        () => {
          undefined;
        },
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the quiz is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/quiz/999999/attempt`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz/${quizId}/attempt`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the quiz id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/quiz/invalid-id/attempt`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt`,
        () => undefined,
        [
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt`,
        roles.slice(0, 2),
        (req, url) => req.get(url),
      );
    });
    describe("Quiz Attempt validation (Missing, Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt`,
        [roles[0]],
        ["student_id"],
        fieldInvalids,
        commonInvalids,
        () => {
          return { student_id: "1" };
        },
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the student didn't solve the quiz yet", () => {
      let studentToken, studentId;
      beforeAll(async () => {
        studentToken = await createAndLoginUser(createUser("student"));
        await enrollStudent(adminToken, studentToken, courseId);
        response = await request(app)
          .get(`/user/me`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send();
        expect(response.status).toBe(200);
        studentId = response.body.user.id;
      });
      const roles = [
        {
          name: "admin",
          token: () => adminToken,
          body: () => {
            return { student_id: `${studentId}` };
          },
        },
        {
          name: "instructor",
          token: () => instructorToken,
          body: () => {
            return { student_id: `${studentId}` };
          },
        },
        {
          name: "student",
          token: () => studentToken,
          body: () => {
            return {};
          },
        },
      ];
      roles.forEach((role) => {
        it(`Should return 404 if the student didn't solve the quiz yet ${role.name}`, async () => {
          const res = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(res.status).toBe(404);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/quiz/:quiz_id/attempt/all", () => {
  let studentToken, studentId;
  beforeAll(async () => {
    studentToken = await createAndLoginUser(createUser("student"));
    await enrollStudent(adminToken, studentToken, courseId);
    response = await request(app)
      .get(`/user/me`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(200);
    studentId = response.body.user.id;

    response = await request(app)
      .post(`/course/${courseId}/quiz/${quizId}/attempt`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ answer: questions_answers });
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
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get all quiz attempts`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(res.status).toBe(200);
        expect(res.body.attempts.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/quiz/${quizId}/attempt/all`,
        roles,
        () => {
          undefined;
        },
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the quiz is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/quiz/999999/attempt/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz/${quizId}/attempt/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the quiz id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/quiz/invalid-id/attempt/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz/${quizId}/attempt/all`,
        () => undefined,
        [
          {
            name: "authorized student user",
            token: () => studentToken,
          },
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.get(url),
      );
    });
    describe("Should return [] if the quiz hasn't been solved yet", () => {
      let quizId;
      beforeAll(async () => {
        const { questions_ids, questions_answers } =
          await addQuestionsAndGetIDsAndAnswers(courseId, instructorToken);

        const quiz = createQuiz(questions_ids, 20);
        response = await request(app)
          .post(`/course/${courseId}/quiz`)
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(quiz);
        expect(response.status).toBe(201);
        quizId = response.body.quiz.id;
      });
      roles.forEach((role) => {
        it(`Should return 404 if the student didn't solve the quiz yet ${role.name}`, async () => {
          const res = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(res.status).toBe(200);
          expect(res.body.attempts.length).toBe(0);
        });
      });
    });
  });
});
