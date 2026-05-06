const app = require("../../app");
const request = require("supertest");
jest.setTimeout(30000);
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
  "",
  null,
  undefined,
  "123",
  "123000",
  "5",
  "10",
  "96",
  generateRandomString(501),
  generateRandomString(700),
  generateRandomString(1000),
  generateRandomString(10) + "123546",
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
  question: [...commonInvalids, "a", "ddddd", "qqqsds", "aaa"],
};

describe("Testing Post /course/:course_id/question_bank", () => {
  let adminToken, instructorToken, instructorId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    const questionTypes = ["mcq", "true_false", "short_answer"];
    roles.forEach((role) => {
      questionTypes.forEach((questionType) => {
        const questionBank = createQuestionBank(questionType);
        it(`Should allow ${role.name} to create a new question bank`, async () => {
          response = await request(app)
            .post(`/course/${courseId}/question_Bank`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
          console.log(response.body);
          expect(response.status).toBe(201);
        });
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Question Bank creation validation (Missing, Empty, Invalid)", () => {
      const requiredFields = ["question", "answer", "type", "choice", "score"];

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
                const questionBank = createQuestionBank("mcq");

                if (scenario === "missing") delete questionBank[field];
                else questionBank[field] = value;

                const response = await request(app)
                  .post(`/course/${courseId}/question_bank`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(questionBank);

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
      const questionBank = createQuestionBank();
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/question_bank`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
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
      const questionBank = createQuestionBank();
      roles.forEach((role) => {
        scenarios.forEach((scenarios) => {
          const values = scenarios.values;
          values.forEach((value) => {
            it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
              let response = await request(app)
                .post(`/course/${courseId}/question_bank`)
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
              name: "instructor user",
              token: () => unauthorizedInstructorToken,
            },
          ],
        },
      ];

      const questionBank = createQuestionBank();
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(`/course/${courseId}/question_bank`)
                .set("Authorization", value)
                .send(questionBank);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .post(`/course/${courseId}/question_bank`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send(questionBank);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .post(`/course/${courseId}/question_bank`)
              .send(questionBank);
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Should return 400 if question type is not mcq and choice is not empty", () => {
      roles.forEach((role) => {
        const questionTypes = ["true_false", "short_answer"];
        questionTypes.forEach((questionType) => {
          const questionBank = createQuestionBank("mcq");
          questionBank.type = questionType;
          it(`Should return 400 if question type is not mcq and choice is not empty (${role.name})`, async () => {
            let response = await request(app)
              .post(`/course/${courseId}/question_bank`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send(questionBank);
            expect(response.status).toBe(400);
          });
        });
      });
    });
    describe("Should return 400 if question type is mcq and choice doesn't contain the correct answer", () => {
      roles.forEach((role) => {
        const questionBank = createQuestionBank("mcq");
        questionBank.choice.pop();
        it(`Should return 400 if question type is mcq and choice doesn't contain the correct answer (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/question_bank`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if question type is mcq and choice length is less than 2", () => {
      roles.forEach((role) => {
        const questionBank = createQuestionBank("mcq");
        questionBank.choice = [questionBank.answer];
        it(`Should return 400 if question type is mcq and choice length is less than 2 (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/question_bank`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Delete /course/:course_id/question_bank/:question_id", () => {
  let adminToken, instructorToken;
  let courseId;
  let questionBankIdToDelete;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    const course = createCourse();

    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);

    courseId = response.body.course.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
  describe("Positive Testing", () => {
    beforeEach(async () => {
      const questionBank = createQuestionBank();
      let response = await request(app)
        .post(`/course/${courseId}/question_bank`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(questionBank);
      questionBankIdToDelete = response.body.question.question_id;
    });

    roles.forEach((role) => {
      it(`should allow ${role.name} to delete a question bank by id`, async () => {
        const res = await request(app)
          .delete(`/course/${courseId}/question_bank/${questionBankIdToDelete}`)
          .set("Authorization", `Bearer ${role.token()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
  describe("Negative Testing", () => {
    beforeAll(async () => {
      const questionBank = createQuestionBank();
      let response = await request(app)
        .post(`/course/${courseId}/question_bank`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(questionBank);
      questionBankIdToDelete = response.body.question.question_id;
    });

    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the question bank is not found", () => {
      let questionBankIdToDelete = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
            )
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
                .delete(
                  `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
                )
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
                .delete(
                  `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
                )
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .delete(
                `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
              )
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
            .delete(
              `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the question bank is invalid", () => {
      let questionBankIdToDelete = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the questionBank is invalid (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/question_bank/:question_id", () => {
  let adminToken, instructorToken;
  let courseId;
  let questionBankIdToGet;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    const course = createCourse();

    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);

    courseId = response.body.course.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
  describe("Positive Testing", () => {
    let questionBank;
    let index = 0;
    const questionTypes = ["mcq", "true_false", "short_answer"];
    beforeEach(async () => {
      questionBank = createQuestionBank(questionTypes[index]);
      let response = await request(app)
        .post(`/course/${courseId}/question_bank`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(questionBank);
      expect(response.status).toBe(201);
      questionBankIdToGet = response.body.question.question_id;
      index = (index + 1) % questionTypes.length;
    });
    roles.forEach((role) => {
      questionTypes.forEach((questionType) => {
        it(`should allow ${role.name} to get a question bank by id (${questionType})`, async () => {
          const res = await request(app)
            .get(`/course/${courseId}/question_bank/${questionBankIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();

          expect(res.status).toBe(200);
          expect(res.body.question.question).toBe(questionBank.question);
          expect(res.body.question.answer).toBe(questionBank.answer);
          expect(res.body.question.score).toBe(questionBank.score);
          expect(res.body.question.type).toBe(questionBank.type);
          expect(`${res.body.question.choice.length}`).toBe(
            `${questionBank.choice.length}`,
          );
        });
      });
    });
  });
  describe("Negative Testing", () => {
    beforeAll(async () => {
      const questionBank = createQuestionBank();
      let response = await request(app)
        .post(`/course/${courseId}/question_bank`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(questionBank);
      questionBankIdToGet = response.body.question.question_id;
    });

    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/question_bank/${questionBankIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the question bank is not found", () => {
      let questionBankIdToGet = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/question_bank/${questionBankIdToGet}`)
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
                .delete(
                  `/course/${courseId}/question_bank/${questionBankIdToGet}`,
                )
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
                .delete(
                  `/course/${courseId}/question_bank/${questionBankIdToGet}`,
                )
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .delete(
                `/course/${courseId}/question_bank/${questionBankIdToGet}`,
              )
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
            .delete(`/course/${courseId}/question_bank/${questionBankIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the question bank is invalid", () => {
      let questionBankIdToGet = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the questionBank is invalid (${role.name})`, async () => {
          let response = await request(app)
            .delete(`/course/${courseId}/question_bank/${questionBankIdToGet}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
  });
});

describe("Testing Get /course/:course_id/question_bank/all", () => {
  let adminToken, instructorToken, studentToken;
  let courseId;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    const course = createCourse();

    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);

    courseId = response.body.course.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
  describe("Positive Testing", () => {
    beforeAll(async () => {
      const questionBank = createQuestionBank();
      let response = await request(app)
        .post(`/course/${courseId}/question_bank`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(questionBank);
      expect(response.status).toBe(201);
    });
    roles.forEach((role) => {
      it(`should allow ${role.name} to get all questions Bank of given course id`, async () => {
        const res = await request(app)
          .get(`/course/${courseId}/question_bank/all`)
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        console.log(res.body);
        expect(res.status).toBe(200);
        expect(res.body.questions.length).toBeGreaterThan(0);
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
            .get(`/course/${courseId}/question_bank/all`)
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
                .get(`/course/${courseId}/question_bank/all`)
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
                .get(`/course/${courseId}/question_bank/all`)
                .set("Authorization", `Bearer ${value.token()}`)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .get(`/course/${courseId}/question_bank/all`)
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
            .get(`/course/${courseId}/question_bank/all`)
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
            .get(`/course/${courseId}/question_bank/all`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(200);
          expect(response.body.questions.length).toBe(0);
        });
      });
    });
  });
});

describe("Testing Put /course/:course_id/question_bank/:question_id", () => {
  let adminToken, instructorToken;
  let courseId;
  let questionBankIdToUpdate;

  beforeAll(async () => {
    // login users
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);

    const course = createCourse();

    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);

    courseId = response.body.course.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  // ✅ Positive
  describe("Positive Testing", () => {
    beforeEach(async () => {
      const questionBank = createQuestionBank();
      let response = await request(app)
        .post(`/course/${courseId}/question_bank`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(questionBank);
      questionBankIdToUpdate = response.body.question.question_id;
    });

    describe("should allow admin and instructor to update only one field in given question bank by id", () => {
      const updateFields = ["question", "score", "type", "choice", "answer"];
      roles.forEach((role) => {
        const randomQuestionBank = createQuestionBank();
        updateFields.forEach((updateField) => {
          it(`should allow ${role.name} to update only ${updateField} field in given question bank by id`, async () => {
            const res = await request(app)
              .put(
                `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
              )
              .set("Authorization", `Bearer ${role.token()}`)
              .send({ [`${updateField}`]: randomQuestionBank[updateField] });
            console.log(res.body);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
          });
        });
      });
    });

    describe("should allow admin and instructor to update more than one field in given question bank by id", () => {
      roles.forEach((role) => {
        const randomQuestionBank = createQuestionBank();
        it(`should allow ${role.name} to update more than one field in given question bank by id `, async () => {
          const res = await request(app)
            .put(`/course/${courseId}/question_bank/${questionBankIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(randomQuestionBank);
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty("message");
        });
      });
    });
  });
  describe("Negative Testing", () => {
    const questionBank = createQuestionBank();
    beforeAll(async () => {
      const questionBank = createQuestionBank("mcq");
      let response = await request(app)
        .post(`/course/${courseId}/question_bank`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send(questionBank);
      questionBankIdToUpdate = response.body.question.question_id;
    });

    // ❌ Authorization scenarios
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/question_bank/${questionBankIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the question bank is not found", () => {
      let questionBankIdToUpdate = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/question_bank/${questionBankIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
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
                .put(
                  `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
                )
                .set("Authorization", value)
                .send(questionBank);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .put(
                  `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
                )
                .set("Authorization", `Bearer ${value.token()}`)
                .send(questionBank);

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .put(
                `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
              )
              .send(questionBank);
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
            .put(`/course/${courseId}/question_bank/${questionBankIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("should return 400 if the id of the question bank is invalid", () => {
      let questionBankIdToUpdate = "invalid-id";
      roles.forEach((role) => {
        it(`Should return 400 if the id of the questionBank is invalid (${role.name})`, async () => {
          let response = await request(app)
            .put(`/course/${courseId}/question_bank/${questionBankIdToUpdate}`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send(questionBank);
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
                .put(
                  `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .send(value);
              expect(response.status).toBe(400);
            });
          });
        });
      });
    });
    describe("Question Bank Update validation (Empty, Invalid)", () => {
      const requiredFields = ["question", "answer", "type", "choice", "score"];

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
                const questionBank = {};

                questionBank[field] = value;

                const response = await request(app)
                  .put(
                    `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
                  )
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(questionBank);

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
