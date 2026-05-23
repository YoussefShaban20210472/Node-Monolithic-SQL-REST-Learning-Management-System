const {
  app,
  request,
  createUser,
  createCourse,
  createQuiz,
  createDateTime,
  generateRandomString,
  adminUser,
  instructorUser,
  createAndLoginUser,
  getToken,
  addQuestionsAndGetIDs,
  studentUser,
  duriationFieldInvalids,
  enrollStudent,
  duriationRequiredFields,
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
jest.setTimeout(70000);
const requiredFields = [
  "title",
  "description",
  "start_date",
  "end_date",
  "question",
];
const commonInvalids = [
  generateRandomString(501),
  generateRandomString(700),
  generateRandomString(1000),
  generateRandomString(10) + "123546",
  "",
  null,
  undefined,
  "123",
  "123000",
  "5",
  "10",
  "96",

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
  [],
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
  description: [...commonInvalids.slice(3)],
};

let adminToken, instructorToken, studentToken, courseId;
let unauthorizedInstructorToken, unauthorizedStudentToken;
let questions_ids = [];
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
  questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
});

const roles = [
  { name: "admin", token: () => adminToken },
  { name: "instructor", token: () => instructorToken },
];

describe("Testing Post /course/:course_id/quiz", () => {
  describe("Positive Testing", () => {
    let questionSizes = [1, 10];
    questionSizes.forEach((questionSize) => {
      roles.forEach((role) => {
        it(`Should allow ${role.name} to create a new quiz with ${questionSize == 1 ? "one question" : "many questions"}`, async () => {
          const quiz = createQuiz(questions_ids, questionSize);
          let response = await request(app)
            .post(`/course/${courseId}/quiz`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(quiz);
          expect(response.status).toBe(201);
        });
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/quiz`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz`,
        () => undefined,
        [
          { name: "authorized student user", token: () => studentToken },
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.post(url),
      );
    });

    describe("Should return 404 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz`,
        roles,
        () => undefined,
        (req, url) => req.post(url),
      );
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/quiz`,
        roles,
        (req, url) => req.post(url),
      );
    });
    describe("Quiz creation validation (Missing, Empty, Invalid)", () => {
      const scenarios = ["missing", "empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          scenarios.forEach((scenario) => {
            let values = [];

            if (scenario === "missing") {
              values = [undefined];
            } else if (scenario === "empty") {
              values = [""];
            } else if (scenario === "invalid") {
              values = fieldInvalids[field] || commonInvalids;
            }

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario} (${role.name})${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }`, async () => {
                const quiz = createQuiz(questions_ids);

                if (scenario === "missing") delete quiz[field];
                else quiz[field] = value;

                const response = await request(app)
                  .post(`/course/${courseId}/quiz`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(quiz);

                expect(response.status).toBe(400);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
        });
      });
    });
    describe("Quiz Duriation validation", () => {
      const quiz = createQuiz([]);
      const start_date = quiz.start_date;
      const end_date = quiz.end_date;
      roles.forEach((role) => {
        duriationRequiredFields.forEach((field) => {
          let values = duriationFieldInvalids[field];

          values.forEach((value) => {
            quiz["start_date"] = field == "start_date" ? value : start_date;
            quiz["end_date"] = field == "end_date" ? value : end_date;
            it(`should return 400 if duriation is invalid (${quiz["start_date"]}) ((${quiz["end_date"]})) (${role.name})`, async () => {
              quiz.question = createQuiz(questions_ids).question;
              const response = await request(app)
                .post(`/course/${courseId}/quiz`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(quiz);

              expect(response.status).toBe(400);

              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        });
      });
    });
    describe("Should return 404 if one of questions is not found", () => {
      roles.forEach((role) => {
        it(`Should return 404 if the one of questions is not found ${role.name}`, async () => {
          const quiz = createQuiz(questions_ids);
          quiz.question.push("9999999");
          let response = await request(app)
            .post(`/course/${courseId}/quiz`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(quiz);
          expect(response.status).toBe(404);
        });
      });
    });
  });
});

describe("Testing Delete /course/:course_id/quiz/:quiz_id", () => {
  let quizIdToDelete;
  describe("Positive Testing", () => {
    beforeEach(async () => {
      const quiz = createQuiz(questions_ids);
      let response = await request(app)
        .post(`/course/${courseId}/quiz`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(quiz);
      quizIdToDelete = response.body.quiz.id;
    });

    roles.forEach((role) => {
      it(`should allow ${role.name} to delete a quiz by id`, async () => {
        const res = await request(app)
          .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
  describe("Negative Testing", () => {
    let quizIdToDelete;
    beforeAll(async () => {
      const quiz = createQuiz(questions_ids);
      let response = await request(app)
        .post(`/course/${courseId}/quiz`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(quiz);
      quizIdToDelete = response.body.quiz.id;
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/quiz/${quizIdToDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the quiz is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/quiz/999999`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz/${quizIdToDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the quiz id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/quiz/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz/${quizIdToDelete}`,
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
        (req, url) => req.delete(url),
      );
    });
  });
});

describe("Testing Get /course/:course_id/quiz/:quiz_id", () => {
  let quizIdToGet;
  let quiz;
  beforeAll(async () => {
    quiz = createQuiz(questions_ids);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    quizIdToGet = response.body.quiz.id;
  });
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get a quiz by id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/quiz/${quizIdToGet}`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(res.status).toBe(200);
        expect(res.body.quiz.title).toBe(quiz.title);
        expect(res.body.quiz.description).toBe(quiz.description);

        expect(`${res.body.quiz.question.length}`).toBe(
          `${quiz.question.length}`,
        );
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/quiz/${quizIdToGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the quiz is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/quiz/999999`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz/${quizIdToGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the quiz id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/quiz/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz/${quizIdToGet}`,
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
  });
});

describe("Testing Get /course/:course_id/quiz/all", () => {
  describe("Positive Testing", () => {
    beforeAll(async () => {
      const quiz = createQuiz(questions_ids);
      let response = await request(app)
        .post(`/course/${courseId}/quiz`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(quiz);
      expect(response.status).toBe(201);
    });
    roles.forEach((role) => {
      it(`should allow ${role.name} to get all quizzes of given course id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/quiz/all`)
          .set("Authorization", `Bearer ${role.token()}`);
        expect(res.status).toBe(200);
        expect(res.body.quizzes.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/999999/quiz/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz/all`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz/all`,
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
    describe("Should return [] if the quizzes are empty", () => {
      let courseId;
      beforeAll(async () => {
        const course = createCourse();
        response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        expect(response.status).toBe(201);
        courseId = response.body.course.id;
      });
      roles.forEach((role) => {
        it(`Should return [] if the quizzes are empty (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(200);
          expect(response.body.quizzes.length).toBe(0);
        });
      });
    });
  });
});

describe("Testing Put /course/:course_id/quiz/:quiz_id", () => {
  let quizIdToUpdate;
  beforeAll(async () => {
    const quiz = createQuiz(questions_ids);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    quizIdToUpdate = response.body.quiz.id;
  });
  describe("Positive Testing", () => {
    describe("should allow admin and instructor to update only one field in given quiz by id", () => {
      roles.forEach((role) => {
        requiredFields.forEach((updateField) => {
          it(`should allow ${role.name} to update only ${updateField} field in given quiz by id`, async () => {
            const randomQuiz = createQuiz(questions_ids);
            const res = await request(app)
              .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send({ [`${updateField}`]: randomQuiz[updateField] });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
          });
        });
      });
    });
    describe("should allow admin and instructor to update more than one field in given quiz by id", () => {
      roles.forEach((role) => {
        it(`should allow ${role.name} to update more than one field in given quiz by id `, async () => {
          const randomQuiz = createQuiz(questions_ids);
          const res = await request(app)
            .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomQuiz);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
  });
  describe("Negative Testing", () => {
    let quizIdToUpdate;
    beforeAll(async () => {
      const quiz = createQuiz(questions_ids);
      response = await request(app)
        .post(`/course/${courseId}/quiz`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(quiz);
      quizIdToUpdate = response.body.quiz.id;
    });
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/9999999/quiz/${quizIdToUpdate}`,
        roles,
        () => {
          return { ...createQuiz([], 1), question: undefined };
        },
        (req, url) => req.put(url),
      );
    });
    describe("Should return 404 if the quiz is not found", () => {
      testNotFoundObjectRequest(
        () => `/course/${courseId}/quiz/99999999`,
        roles,
        () => {
          return { ...createQuiz([], 1), question: undefined };
        },
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/invalid-id/quiz/${quizIdToUpdate}`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if the quiz id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () => `/course/${courseId}/quiz/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.put(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () => `/course/${courseId}/quiz/${quizIdToUpdate}`,
        () => undefined,
        [
          { name: "authorized student user", token: () => studentToken },
          {
            name: "unauthorized student user",
            token: () => unauthorizedStudentToken,
          },
          {
            name: "unauthorized instructor user",
            token: () => unauthorizedInstructorToken,
          },
        ],
        (req, url) => req.put(url),
      );
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      testInvalidBodyRequest(
        () => `/course/${courseId}/quiz/${quizIdToUpdate}`,
        roles,
        (req, url) => req.put(url),
      );
    });
    describe("Quiz update validation (Empty, Invalid)", () => {
      testInvalidObjectUpdateRequest(
        () => `/course/${courseId}/quiz/${quizIdToUpdate}`,
        roles,
        requiredFields,
        fieldInvalids,
        commonInvalids,
      );
    });
    describe("Quiz Duriation validation", () => {
      testInvalidObjectDuriationRequest(
        () => `/course/${courseId}/quiz/${quizIdToUpdate}`,
        roles,
        () => {
          return { ...createQuiz([], 1), question: undefined };
        },
        duriationFieldInvalids,
        (req, url) => req.put(url),
      );
    });
  });
});
