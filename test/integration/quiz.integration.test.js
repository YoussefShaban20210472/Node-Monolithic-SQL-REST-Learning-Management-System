const app = require("../../app");
const request = require("supertest");
jest.setTimeout(10000);
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
function createQuestionBank(type = "true_false") {
  let questionBank = {
    question: generateRandomString(50),
    answer: generateRandomString(10),
    score: 50,
    type: type,
    choice: [],
  };

  if (type == "mcq") {
    for (let i = 0; i < 3; i++) {
      questionBank.choice.push(generateRandomString(10));
    }
    questionBank.choice.push(questionBank.answer);
  }
  return questionBank;
}

function createQuiz(questions_ids, questions_length = 10) {
  let quiz = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    start_date: createDateTime(2026, 6, 20),
    end_date: createDateTime(2026, 7, 20),
    question: [
      ...questions_ids.slice(
        0,
        Math.min(questions_length, questions_ids.length),
      ),
    ],
  };

  return quiz;
}
function createDateTime(year, month, day, hours = 0, minutes = 0, seconds = 0) {
  // ⚠️ month is 0-based in JS (0 = Jan, 11 = Dec)
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds),
  ).toISOString();
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

// Common invalid values for most fields
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

// Custom invalid values for specific fields
const fieldInvalids = {
  description: [...commonInvalids.slice(3)],
};

async function addQuestionsAndGetIDs(courseId, instructorToken, length = 20) {
  const questions_ids = [];
  const questionTypes = ["mcq", "true_false", "short_answer"];
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * questionTypes.length);
    const questionType = questionTypes[randomIndex];
    const questionBank = createQuestionBank(questionType);
    const response = await request(app)
      .post(`/course/${courseId}/question_Bank`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(questionBank);
    expect(response.status).toBe(201);
    questions_ids.push(`${response.body.question.question_id}`);
  }
  return questions_ids;
}
describe("Testing Post /course/:course_id/quiz", () => {
  let adminToken, instructorToken, instructorId;
  let courseId;
  let questions_ids = [];
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`Should allow ${role.name} to create a new quiz with one question`, async () => {
        const quiz = createQuiz(questions_ids, 1);
        let response = await request(app)
          .post(`/course/${courseId}/quiz`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(quiz);
        expect(response.status).toBe(201);
      });
    });
    roles.forEach((role) => {
      it(`Should allow ${role.name} to create a new quiz with many questions`, async () => {
        const quiz = createQuiz(questions_ids, 10);
        let response = await request(app)
          .post(`/course/${courseId}/quiz`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(quiz);
        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    let quiz;
    beforeAll(async () => {
      quiz = createQuiz(questions_ids);
    });
    describe("quiz creation validation (Missing, Empty, Invalid)", () => {
      const requiredFields = [
        "title",
        "description",
        "start_date",
        "end_date",
        "question",
      ];

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
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";

      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/quiz`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(quiz);
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];

      roles.forEach((role) => {
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .post(`/course/${courseId}/quiz`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
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

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
      });
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
            { name: "student user", token: () => unauthorizedStudentToken },
            {
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/quiz`)
                .set("Authorization", value)
                .send(quiz);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .post(`/course/${courseId}/quiz`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send(quiz);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app).post(`/course/${courseId}/quiz`).send(quiz);
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });
    describe("Quiz Duriation validation", () => {
      const requiredFields = ["start_date", "end_date"];
      const course_start_date = "2026-05-20T00:00:00Z";
      const course_end_date = "2026-08-20T00:00:00Z";

      const quiz_start_date = "2026-06-20T00:00:00Z";
      const quiz_end_date = "2026-07-20T00:00:00Z";
      // Common invalid values for most fields

      // Custom invalid values for specific fields
      const fieldInvalids = {
        start_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          // --- allowed area ---

          // quiz_end_date => 2026, 7, 20, 0
          createDateTime(2026, 7, 20, 1),
          createDateTime(2026, 7, 20, 5),
          createDateTime(2026, 7, 20, 7),
          createDateTime(2026, 8, 1, 7),

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ], // too long string example
        end_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          createDateTime(2026, 5, 21),
          createDateTime(2026, 6, 10),
          createDateTime(2026, 6, 15),
          createDateTime(2026, 6, 18, 7),
          createDateTime(2026, 6, 19, 23),

          // quiz_start_date => 2026, 6, 20, 0

          createDateTime(2026, 6, 20, 0, 1),
          createDateTime(2026, 6, 20, 0, 5),
          createDateTime(2026, 6, 20, 0, 10),
          createDateTime(2026, 6, 20, 0, 20),

          // --- allowed area --- 2026, 6, 20, 0,30

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ],
      };

      const quiz = createQuiz(questions_ids);
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          let values = fieldInvalids[field];

          values.forEach((value) => {
            quiz["start_date"] =
              field == "start_date" ? value : quiz_start_date;
            quiz["end_date"] = field == "end_date" ? value : quiz_end_date;
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
  });
});

describe("Testing Delete /course/:course_id/quiz/:quiz_id", () => {
  let adminToken, instructorToken;
  let courseId;
  let quizIdToDelete;
  let questions_ids = [];
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
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
    beforeAll(async () => {
      const quiz = createQuiz(questions_ids);
      let response = await request(app)
        .post(`/course/${courseId}/quiz`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(quiz);
      quizIdToDelete = response.body.quiz.id;
    });

    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the quiz is not found", () => {
      let quizIdToDelete = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
      });
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
            { name: "student user", token: () => unauthorizedStudentToken },
            {
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
                .set("Authorization", value)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
              .send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the quiz is invalid", () => {
      let quizIdToDelete = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the quiz is invalid (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/quiz/${quizIdToDelete}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/quiz/:quiz_id", () => {
  let adminToken, instructorToken;
  let courseId;
  let quizIdToGet;
  let quiz;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);

    quiz = createQuiz(questions_ids);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    quizIdToGet = response.body.quiz.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
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
        // expect(res.body.quiz.start_date).toBe(quiz.start_date);
        // expect(res.body.quiz.end_date).toBe(quiz.end_date);
        expect(`${res.body.quiz.question.length}`).toBe(
          `${quiz.question.length}`,
        );
      });
    });
  });
  describe("Negative Testing", () => {
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the quiz is not found", () => {
      let quizIdToGet = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
      });
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
            { name: "student user", token: () => unauthorizedStudentToken },
            {
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .get(`/course/${courseId}/quiz/${quizIdToGet}`)
                .set("Authorization", value)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .get(`/course/${courseId}/quiz/${quizIdToGet}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/quiz/${quizIdToGet}`)
              .send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the quiz is invalid", () => {
      let quizIdToGet = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the quiz is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/quiz/all", () => {
  let adminToken, instructorToken, studentToken;
  let courseId;
  let questions_ids = [];
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
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
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(res.status).toBe(200);
        expect(res.body.quizzes.length).toBeGreaterThan(0);
      });
    });
  });
  describe("Negative Testing", () => {
    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
      });
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
            { name: "student user", token: () => unauthorizedStudentToken },
            {
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .get(`/course/${courseId}/quiz/all`)
                .set("Authorization", value)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .get(`/course/${courseId}/quiz/all`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app).get(`/course/${courseId}/quiz/all`).send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return [] if the questions Bank are empty", () => {
      let courseId;

      beforeAll(async () => {
        const course = createCourse();
        let response = await request(app)
          .post("/course")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send(course);
        expect(response.status).toBe(201);
        courseId = response.body.course.id;
      });
      roles.forEach((role) => {
        it(`Should return [] if the questions bank are empty (${role.name})`, async () => {
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
  let adminToken, instructorToken;
  let courseId;
  let quizIdToUpdate;
  let questions_ids = [];
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];

  // ✅ Positive
  describe("Positive Testing", () => {
    beforeEach(async () => {
      const quiz = createQuiz(questions_ids);
      let response = await request(app)
        .post(`/course/${courseId}/quiz`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(quiz);
      quizIdToUpdate = response.body.quiz.id;
    });

    describe("should allow admin and instructor to update only one field in given quiz by id", () => {
      const updateFields = [
        "title",
        "description",
        "start_date",
        "end_date",
        "question",
      ];
      roles.forEach((role) => {
        updateFields.forEach((updateField) => {
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
    let quiz;
    beforeAll(async () => {
      quiz = createQuiz(questions_ids);
      let response = await request(app)
        .post(`/course/${courseId}/quiz`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(quiz);
      quizIdToUpdate = response.body.quiz.id;
      quiz = createQuiz(questions_ids);
    });

    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(quiz);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the quiz is not found", () => {
      let quizIdToUpdate = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(quiz);
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      let unauthorizedInstructorToken, unauthorizedStudentToken;
      beforeAll(async () => {
        unauthorizedInstructorToken = await createAndLoginUser(
          createUser("instructor"),
        );
        unauthorizedStudentToken = await createAndLoginUser(
          createUser("student"),
        );
      });
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
            { name: "student user", token: () => unauthorizedStudentToken },
            {
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
                .set("Authorization", value)
                .send(quiz);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send(quiz);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
              .send(quiz);
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("should return 400 if the id of the course is invalid", () => {
      let courseId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the course is invalid (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(quiz);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the quiz is invalid", () => {
      let quizIdToUpdate = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the quiz is invalid (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(quiz);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if request body is (missing, empty, invalid)", () => {
      const scenarios = [
        { name: "missing", values: [undefined] },
        { name: "empty", values: [""] },
        { name: "invalid", values: ["adad", "{}"] },
      ];
      roles.forEach((role) => {
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
            });
          });
        });
      });
    });
    describe("quiz Update validation (Empty, Invalid)", () => {
      const requiredFields = [
        "title",
        "description",
        "start_date",
        "end_date",
        "question",
      ];

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
              it(`should return 400 if ${field} is ${scenario} (${role.name})${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }`, async () => {
                const quiz = {};

                quiz[field] = value;

                const response = await request(app)
                  .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
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
      const requiredFields = ["start_date", "end_date"];
      const course_start_date = "2026-05-20T00:00:00Z";
      const course_end_date = "2026-08-20T00:00:00Z";

      const quiz_start_date = "2026-06-20T00:00:00Z";
      const quiz_end_date = "2026-07-20T00:00:00Z";
      // Common invalid values for most fields

      // Custom invalid values for specific fields
      const fieldInvalids = {
        start_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          // --- allowed area ---

          // quiz_end_date => 2026, 7, 20, 0
          createDateTime(2026, 7, 20, 1),
          createDateTime(2026, 7, 20, 5),
          createDateTime(2026, 7, 20, 7),
          createDateTime(2026, 8, 1, 7),

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ], // too long string example
        end_date: [
          createDateTime(2025, 5, 17),
          createDateTime(2026, 5, 17),
          createDateTime(2026, 5, 18),
          createDateTime(2026, 5, 19),

          // course_start_date => 2026, 5, 20

          createDateTime(2026, 5, 21),
          createDateTime(2026, 6, 10),
          createDateTime(2026, 6, 15),
          createDateTime(2026, 6, 18, 7),
          createDateTime(2026, 6, 19, 23),

          // quiz_start_date => 2026, 6, 20, 0

          createDateTime(2026, 6, 20, 0, 1),
          createDateTime(2026, 6, 20, 0, 5),
          createDateTime(2026, 6, 20, 0, 10),
          createDateTime(2026, 6, 20, 0, 20),

          // --- allowed area --- 2026, 6, 20, 0,30

          // course_end_date => 2026, 8, 20,0

          createDateTime(2026, 8, 20, 1),
          createDateTime(2026, 8, 20, 5),
          createDateTime(2026, 8, 20, 7),
          createDateTime(2026, 8, 21),
          createDateTime(2026, 8, 22),
          createDateTime(2026, 8, 23),
          createDateTime(2027, 8, 19),
        ],
      };

      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          let values = fieldInvalids[field];
          values.forEach((value) => {
            it(`should return 400 if duriation is invalid (${field == "start_date" ? value : quiz_start_date}) (${field == "end_date" ? value : quiz_end_date}) (${role.name})`, async () => {
              const response = await request(app)
                .put(`/course/${courseId}/quiz/${quizIdToUpdate}`)
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
