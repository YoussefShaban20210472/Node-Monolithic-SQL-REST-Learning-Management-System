const app = require("../../app");
const request = require("supertest");
jest.setTimeout(60000);
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

// Custom invalid values for specific fields
const fieldInvalids = {
  student_id: [...commonInvalids.slice(5)],
};

async function addQuestionsAndGetIDsAndAnswers(
  courseId,
  instructorToken,
  length = 20,
) {
  const questions_ids = [];
  const questions_answers = [];
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
    questions_answers.push({
      question_id: `${response.body.question.question_id}`,
      answer: questionBank.answer,
    });
  }
  return { questions_ids, questions_answers };
}
async function enrollStudent(adminToken, studentToken, courseId) {
  let response = await request(app)
    .get(`/user/me`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send();
  let studentId = response.body.user.id;
  response = await request(app)
    .post(`/course/${courseId}/enrollment`)
    .set("Authorization", `Bearer ${studentToken}`)
    .send();
  expect(response.status).toBe(201);
  response = await request(app)
    .put(`/course/${courseId}/enrollment`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ student_id: `${studentId}`, status: "accepted" });
  expect(response.status).toBe(200);
}
describe("Testing Post /course/:course_id/quiz/:quiz_id/attempt", () => {
  let adminToken, instructorToken, instructorId, studentToken, studentId;
  let courseId;
  let questions_ids = [];
  let questions_answers = [];
  let quizId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    let result = await addQuestionsAndGetIDsAndAnswers(
      courseId,
      instructorToken,
    );
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
  describe("Positive Testing", () => {
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
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(1000);
      });
    });
  });

  describe("Negative Testing", () => {
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
    describe("quiz attempt validation (Missing, Empty, Invalid)", () => {
      const requiredFields = ["student_id", "answer"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          scenarios.forEach((scenario) => {
            if (role.name == "student" && field == "student_id") return;
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
                const quizAttemtp = { student_id: "1", answer: [] };

                if (scenario === "missing") delete quizAttemtp[field];
                else quizAttemtp[field] = value;

                const response = await request(app)
                  .post(`/course/${courseId}/quiz/${quizId}/attempt`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(quizAttemtp);
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
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the quiz is not found", () => {
      let quizId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
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
                .post(`/course/${courseId}/quiz/${quizId}/attempt`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
            });
          });
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
              name: "unauthorized instructor user",
              token: () => unauthorizedInstructorToken,
            },
            {
              name: "authorized instructor user",
              token: () => instructorToken,
            },
          ],
        },
      ];

      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/quiz/${quizId}/attempt`)
                .set("Authorization", value)
                .send({ answer: [] });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .post(`/course/${courseId}/quiz/${quizId}/attempt`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send({ answer: [] });

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .post(`/course/${courseId}/quiz/${quizId}/attempt`)
              .send({ answer: [] });
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
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the quiz is invalid", () => {
      let quizId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the quiz is invalid (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });

    describe("Should return score 0 if a student didn't solve anything", () => {
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

      it(`Should return score 0 if a student didn't solve anything (student)`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ answer: [] });
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(0);
      });
      it(`Should return score 0 if a student didn't solve anything (admin)`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ student_id: `${studentId}`, answer: [] });
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(0);
      });
    });

    describe("Should return score 0 if a student solved questions wrongly", () => {
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

      it(`Should return score 0 if a student solved questions wrongly (student)`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ answer: [{ ...questions_answers[0], answer: "Wrong" }] });
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(0);
      });
      it(`Should return score 0 if a student solved questions wrongly (admin)`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            student_id: `${studentId}`,
            answer: [{ ...questions_answers[0], answer: "Wrong" }],
          });
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(0);
      });
    });
    describe("Should return 409 if a student tried to solve the same quiz twice", () => {
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

      it(`Should return 409 if a student tried to solve the same quiz twice (student)`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ answer: [] });
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(0);
        response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ answer: [] });
        expect(response.status).toBe(409);
      });
      it(`Should return 409 if a student tried to solve the same quiz twice (admin)`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            student_id: `${studentId}`,
            answer: [],
          });
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(0);
        response = await request(app)
          .post(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            student_id: `${studentId}`,
            answer: [],
          });
        expect(response.status).toBe(409);
      });
    });
  });
});

describe("Testing Get /course/:course_id/quiz/:quiz_id/attempt", () => {
  let adminToken, instructorToken, instructorId, studentToken, studentId;
  let courseId;
  let quizId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    const { questions_ids, questions_answers } =
      await addQuestionsAndGetIDsAndAnswers(courseId, instructorToken);

    const quiz = createQuiz(questions_ids, 20);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    expect(response.status).toBe(201);
    quizId = response.body.quiz.id;

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
  // ✅ Positive
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`should allow ${role.name} to get a student quiz attempt`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/quiz/${quizId}/attempt`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send(role.body());
        console.log(res.body);
        expect(res.status).toBe(200);
        expect(res.body.score).toBe(1000);
        expect(`${res.body.quiz_id}`).toBe(`${quizId}`);
        expect(`${res.body.student_id}`).toBe(`${studentId}`);
      });
    });
  });
  describe("Negative Testing", () => {
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
    describe("quiz attempt validation (Missing, Empty, Invalid)", () => {
      const requiredFields = ["student_id"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          scenarios.forEach((scenario) => {
            if (role.name == "student" && field == "student_id") return;
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
                const quizAttemtp = { student_id: "1" };

                if (scenario === "missing") delete quizAttemtp[field];
                else quizAttemtp[field] = value;

                const response = await request(app)
                  .get(`/course/${courseId}/quiz/${quizId}/attempt`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(quizAttemtp);
                expect(response.status).toBe(400);
                expect(response.body.errors[0]).toHaveProperty("message");
              });
            });
          });
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
        if (role.name == "student") return;
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .get(`/course/${courseId}/quiz/${quizId}/attempt`)
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
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
            .get(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the quiz is not found", () => {
      let quizId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
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
                .get(`/course/${courseId}/quiz/${quizId}/attempt`)
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
                .get(`/course/${courseId}/quiz/${quizId}/attempt`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/quiz/${quizId}/attempt`)
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
            .get(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the quiz is invalid", () => {
      let quizId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the quiz is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 404 if the student didn't solve the quiz yet", () => {
      roles.forEach((role) => {
        it(`Should return 404 if the student didn't solve the quiz yet ${role.name}`, async () => {
          const res = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(role.body());
          console.log(res.body);
          expect(res.status).toBe(404);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/quiz/:quiz_id/attempt/all", () => {
  let adminToken, instructorToken, instructorId, studentToken, studentId;
  let courseId;
  let quizId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    const { questions_ids, questions_answers } =
      await addQuestionsAndGetIDsAndAnswers(courseId, instructorToken);

    const quiz = createQuiz(questions_ids, 20);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    expect(response.status).toBe(201);
    quizId = response.body.quiz.id;

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
  // ✅ Positive
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

    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the quiz is not found", () => {
      let quizId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
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
                .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
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
                .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
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
            .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the quiz is invalid", () => {
      let quizId = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the quiz is invalid (${role.name})`, async () => {
          let response = await request(app)
            .get(`/course/${courseId}/quiz/${quizId}/attempt/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return [] if the quiz hasn't been solved yet", () => {
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
