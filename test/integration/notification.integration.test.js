const app = require("../../app");
const request = require("supertest");
jest.setTimeout(90000);
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
function createLesson() {
  let lesson = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    start_date: createDateTime(2026, 6, 20),
    end_date: createDateTime(2026, 7, 20),
  };
  return lesson;
}
function createAssignment() {
  let assignment = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    start_date: createDateTime(2026, 6, 20),
    end_date: createDateTime(2026, 7, 20),
    score: 50,
  };
  return assignment;
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
function createDummyFile(name = "test.pdf", sizeMB = 1) {
  const sizeInBytes = sizeMB * 1024 * 1024;

  return {
    name,
    buffer: Buffer.alloc(sizeInBytes), // file content
  };
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
const commonInvalids = [
  generateRandomString(501),
  generateRandomString(700),
  generateRandomString(1000),
  generateRandomString(10) + "123546",
  "",
  null,
  "0123",
  "000123",
  "+123",
  "-123",
  "-+123",
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
describe("Testing Get /notification", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  beforeAll(async () => {
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));
    adminToken = await createAndLoginUser(createUser("admin"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;
    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;
  });
  describe("Negative Testing", () => {
    describe("Should return [] if the user don't have any notification at all", () => {
      const roles = [
        { name: "instructor", token: () => instructorToken },
        { name: "student", token: () => studentToken },
      ];
      const ids = [
        { name: "instructor", id: () => instructorId },
        { name: "student", id: () => studentId },
      ];
      const statuses = [undefined, "all", "read", "unread"];

      statuses.forEach((status) => {
        roles.forEach((role) => {
          it(`Should return [] if the user don't have any notification at all (${role.name})`, async () => {
            let response = await request(app)
              .get(`/notification`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send({ status: status });
            expect(response.status).toBe(200);
            expect(response.body.notifications.length).toBe(0);
          });
        });
        ids.forEach((id) => {
          it(`Should return [] if the user don't have any notification at all (admin) (${id.name})`, async () => {
            let response = await request(app)
              .get(`/notification`)
              .set("Authorization", `Bearer ${adminToken}`)
              .send({ user_id: `${id.id()}`, status: status });
            expect(response.status).toBe(200);
            expect(response.body.notifications.length).toBe(0);
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

      scenarios.forEach((scenarios) => {
        const values = scenarios.values;
        values.forEach((value) => {
          it(`Should return 400 if request body is ${scenarios.name} (${value})`, async () => {
            let response = await request(app)
              .get(`/notification`)
              .set("Authorization", `Bearer ${adminToken}`)
              .send(value);
            expect(response.status).toBe(400);
          });
        });
      });
    });

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
                .get(`/notification`)
                .set("Authorization", value)
                .send();

              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app).get(`/notification`).send();
            req = scenario.setHeader(req);

            const response = await req;

            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Notification body Validation", () => {
      const roles = [
        { name: "admin", token: () => adminToken },
        { name: "instructor", token: () => instructorToken },
        { name: "student", token: () => studentToken },
      ];
      const requiredFields = ["user_id", "status"];

      // Define all scenarios: missing, empty, invalid
      const scenarios = ["missing", "empty", "invalid"];

      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          if (field == "user_id" && role.name != "admin") return;
          scenarios.forEach((scenario) => {
            let values = [];

            if (scenario === "missing") {
              return;
            } else if (scenario === "empty") {
              values = [""]; // empty string
            } else if (scenario === "invalid") {
              values = commonInvalids; // invalid values
            }

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario}${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }`, async () => {
                const notification = { user_id: "1", status: "all" };

                if (scenario === "missing") delete notification[field];
                else notification[field] = value;

                const response = await request(app)
                  .get(`/notification`)
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(notification);

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
describe("Testing Get /notification (Student Enrollment)", () => {
  let adminToken, instructorToken, studentToken, instructorId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow instructor to see enrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("unread");
  });
  it(`Should allow admin to see enrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("read");
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("read");
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Student Unenrollment)", () => {
  let adminToken, instructorToken, studentToken, instructorId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;
    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .delete(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow instructor to see unenrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see unenrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${instructorId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Student Enrollment Accepted)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see accepted enrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("unread");
  });
  it(`Should allow admin to see accepted enrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("read");
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("read");
  });

  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});
describe("Testing Get /notification (Student Enrollment Rejected)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "rejected", student_id: `${studentId}` });
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see rejected enrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("unread");
  });
  it(`Should allow admin to see rejected enrollment notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("read");
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].status).toBe("read");
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});
describe("Testing Get /notification (Course Update)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const newCourse = createCourse();
    response = await request(app)
      .put(`/course/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(newCourse);
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see course update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see course update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Lesson Creation)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const lesson = createLesson();
    response = await request(app)
      .post(`/course/${courseId}/lesson`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(lesson);
    expect(response.status).toBe(201);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see lesson creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see lesson creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});
describe("Testing Get /notification (Lesson Deletion)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const lesson = createLesson();
    response = await request(app)
      .post(`/course/${courseId}/lesson`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(lesson);
    expect(response.status).toBe(201);
    const lessonId = response.body.lesson.id;
    response = await request(app)
      .delete(`/course/${courseId}/lesson/${lessonId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see lesson deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see lesson deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Lesson Update)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const lesson = createLesson();
    response = await request(app)
      .post(`/course/${courseId}/lesson`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(lesson);
    expect(response.status).toBe(201);
    const lessonId = response.body.lesson.id;

    const newLesson = createLesson();
    response = await request(app)
      .put(`/course/${courseId}/lesson/${lessonId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(newLesson);
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see lesson update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see lesson update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Assignment Creation)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    expect(response.status).toBe(201);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see assignment creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see assignment creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Assignment Deletion)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    expect(response.status).toBe(201);
    const assignmentId = response.body.assignment.id;
    response = await request(app)
      .delete(`/course/${courseId}/assignment/${assignmentId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see assignment deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see assignment deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Assignment Update)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    expect(response.status).toBe(201);
    const assignmentId = response.body.assignment.id;

    const newAssignment = createAssignment();
    response = await request(app)
      .put(`/course/${courseId}/assignment/${assignmentId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(newAssignment);
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see assignment update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see assignment update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Quiz Creation)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  let questions_ids = [];
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
    const quiz = createQuiz(questions_ids);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    expect(response.status).toBe(201);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see quiz creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see quiz creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Quiz Deletion)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  let questions_ids = [];
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
    const quiz = createQuiz(questions_ids);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    expect(response.status).toBe(201);

    const quizId = response.body.quiz.id;
    response = await request(app)
      .delete(`/course/${courseId}/quiz/${quizId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see quiz deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see quiz deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Quiz Update)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  let questions_ids = [];
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
    const quiz = createQuiz(questions_ids);
    response = await request(app)
      .post(`/course/${courseId}/quiz`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(quiz);
    expect(response.status).toBe(201);

    const quizId = response.body.quiz.id;

    const newQuiz = createQuiz(questions_ids);
    response = await request(app)
      .put(`/course/${courseId}/quiz/${quizId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(newQuiz);
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see quiz update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see quiz update notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Course Media File Creation)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/media_file`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .attach("files", file.buffer, file.name);
    expect(response.status).toBe(201);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see course media file creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see course media file creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(2);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Course Media File Deletion)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/media_file`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .attach("files", file.buffer, file.name);
    expect(response.status).toBe(201);

    response = await request(app)
      .delete(`/course/${courseId}/media_file/${file.name}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see course media file deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see course media file deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Assignment Media File Creation)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    expect(response.status).toBe(201);
    const assignmentId = response.body.assignment.id;

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .attach("files", file.buffer, file.name);
    expect(response.status).toBe(201);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see assignment media file creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see assignment media file creation notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Assignment Media File Deletion)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    expect(response.status).toBe(201);
    const assignmentId = response.body.assignment.id;

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .attach("files", file.buffer, file.name);
    expect(response.status).toBe(201);

    response = await request(app)
      .delete(
        `/course/${courseId}/assignment/${assignmentId}/media_file/${file.name}`,
      )
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see assignment media file deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(4);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });

  it(`Should allow admin to see assignment media file deletion notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(4);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(4);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});

describe("Testing Get /notification (Assignment Submission Grade)", () => {
  let adminToken, instructorToken, studentToken, instructorId, studentId;
  let courseId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await createAndLoginUser(createUser("instructor"));
    studentToken = await createAndLoginUser(createUser("student"));

    let response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send();
    instructorId = response.body.user.id;

    response = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    studentId = response.body.user.id;

    const course = createCourse();
    response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;

    response = await request(app)
      .post(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send();
    expect(response.status).toBe(201);

    response = await request(app)
      .put(`/course/${courseId}/enrollment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "accepted", student_id: `${studentId}` });
    expect(response.status).toBe(200);

    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    expect(response.status).toBe(201);
    const assignmentId = response.body.assignment.id;

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
      .set("Authorization", `Bearer ${studentToken}`)
      .attach("files", file.buffer, file.name);
    expect(response.status).toBe(201);
    const submissiontId = response.body.submission.id;

    response = await request(app)
      .patch(
        `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}`,
      )
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ score: 50 });
    expect(response.status).toBe(200);
  });
  it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "read" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
  it(`Should allow student to see assignment submission grade notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("unread");
    }
  });
  it(`Should allow admin to see assignment submission grade notification`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}` });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should allow user to see all notifications if status was all`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "all" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(3);
    const notifications = response.body.notifications;
    for (let notification of notifications) {
      expect(notification.status).toBe("read");
    }
  });
  it(`Should return [] if the user has read all notifications and wants to see only unread notifications`, async () => {
    let response = await request(app)
      .get(`/notification`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: `${studentId}`, status: "unread" });
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(0);
  });
});
