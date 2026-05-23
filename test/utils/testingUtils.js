const app = require("../../app");
const request = require("supertest");

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

function createDateTime(year, month, day, hours = 0, minutes = 0, seconds = 0) {
  // ⚠️ month is 0-based in JS (0 = Jan, 11 = Dec)
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds),
  ).toISOString();
}
function setYear(date = new Date(), year) {
  date.setFullYear(date.getFullYear() + year);
  return date;
}
function setMonth(date = new Date(), month) {
  date.setMonth(date.getMonth() + month);
  return date;
}
function setDate(date = new Date(), day) {
  date.setDate(date.getDate() + day);
  return date;
}
function setHour(date = new Date(), hour) {
  date.setHours(date.getHours() + hour);
  return date;
}
function setMinute(date = new Date(), minute) {
  date.setMinutes(date.getMinutes() + minute);
  return date;
}
const course_start_date = setDate(new Date(), 1).toISOString();
const course_end_date = setYear(new Date(course_start_date), 1).toISOString();
const start_date = setMonth(new Date(course_start_date), 1).toISOString();
const end_date = setMonth(new Date(start_date), 1).toISOString();

function createCourse() {
  const course = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    short_description: generateRandomString(100),
    start_date: course_start_date,
    end_date: course_end_date,
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
    start_date,
    end_date,
  };
  return lesson;
}
function createAssignment() {
  let assignment = {
    title: generateRandomString(50),
    description: generateRandomString(200),
    start_date,
    end_date,
    score: 50,
  };
  return assignment;
}
function createQuestionBank(type = "mcq") {
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
    start_date,
    end_date,
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
  expect(loginRes.status).toBe(200);
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

const duriationRequiredFields = ["start_date", "end_date"];
/* start_date

  --Target--  
  
  now
  
  
  -- allowed area 

  end_date - 7


  --Target--


  end_date


  --Target--


  1 year


  --Target--


*/

/* end_date
  
  start_date + 7
  
  
  -- allowed area 


  start_date + 1 year


  --Target--


*/

function createIntervals(start, end) {
  const tempStart = new Date(start.getTime());
  const intervals = [];
  const size = 5;
  for (let i = 0; i < size; i++) {
    if (tempStart.getFullYear() < end.getFullYear()) {
      tempStart.setFullYear(tempStart.getFullYear() + 1);
      intervals.push(tempStart.toISOString());
    } else {
      break;
    }
  }
  tempStart.setFullYear(end.getFullYear());
  tempStart.setMonth(end.getMonth() - 1);
  for (let i = 0; i < size; i++) {
    if (tempStart >= end) {
      break;
    }
    intervals.push(tempStart.toISOString());
    tempStart.setMonth(tempStart.getMonth() - 1);
  }

  tempStart.setFullYear(end.getFullYear());
  tempStart.setMonth(end.getMonth());
  tempStart.setDate(end.getDate() - 1);
  for (let i = 0; i < size; i++) {
    if (tempStart >= end) {
      break;
    }
    intervals.push(tempStart.toISOString());
    tempStart.setDate(tempStart.getDate() - 1);
  }
  tempStart.setFullYear(end.getFullYear());
  tempStart.setMonth(end.getMonth());
  tempStart.setDate(end.getDate());
  tempStart.setHours(end.getHours() - 1);
  for (let i = 0; i < size; i++) {
    if (tempStart >= end) {
      break;
    }
    intervals.push(tempStart.toISOString());
    tempStart.setHours(tempStart.getHours() - 1);
  }
  tempStart.setFullYear(end.getFullYear());
  tempStart.setMonth(end.getMonth());
  tempStart.setDate(end.getDate());
  tempStart.setHours(end.getHours());
  tempStart.setMinutes(end.getMinutes() - 1);
  for (let i = 0; i < size; i++) {
    if (tempStart >= end) {
      break;
    }
    intervals.push(tempStart.toISOString());
    tempStart.setMinutes(tempStart.getMinutes() - 1);
  }
  return intervals;
}
const courseDuriationFieldInvalids = {
  start_date: [
    ...createIntervals(new Date("2000-05-20T00:00:00Z"), new Date()),
    ...createIntervals(
      setDate(new Date(course_end_date), -7),
      new Date(course_end_date),
    ),
    ...createIntervals(
      new Date(course_end_date),
      setYear(new Date(course_end_date), 1),
    ),
    ...createIntervals(
      setYear(new Date(course_end_date), 1),
      setYear(new Date(course_end_date), 5),
    ),
  ],
  end_date: [
    ...createIntervals(
      setYear(new Date(course_start_date), -5),
      setDate(new Date(course_start_date), 7),
    ),
    ...createIntervals(
      setYear(new Date(course_start_date), 1),
      setYear(new Date(course_start_date), 5),
    ),
  ],
};

const duriationFieldInvalids = {
  start_date: [
    ...createIntervals(
      setYear(new Date(course_start_date), -5),
      new Date(course_start_date),
    ),

    // course_start_date

    // --- allowed area ---

    // end_date - 30 minutes
    ...createIntervals(setMinute(new Date(end_date), -30), new Date(end_date)),

    // end_date

    ...createIntervals(new Date(end_date), new Date(course_end_date)),

    // course_end_date

    ...createIntervals(
      new Date(course_end_date),
      setYear(new Date(course_end_date), 5),
    ),
  ],
  end_date: [
    ...createIntervals(
      setYear(new Date(course_start_date), -5),
      new Date(course_start_date),
    ),

    // course_start_date

    ...createIntervals(new Date(course_start_date), new Date(start_date)),

    // start_date
    ...createIntervals(
      new Date(start_date),
      setMinute(new Date(start_date), 30),
    ),

    // start_date + 30

    // --- allowed area

    // course_end_date
    ...createIntervals(
      new Date(course_end_date),
      setYear(new Date(course_end_date), 5),
    ),
  ],
};
const invalidFileExtensions = [
  "doc",
  "docx",
  "txt",
  "rtf",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "mp3",
  "wav",
  "aac",
  "ogg",
  "flac",
  "m4a",
  "mp4",
  "mkv",
  "mov",
  "avi",
  "webm",
  "flv",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "json",
  "xml",
  "csv",
  "yaml",
  "yml",
  "js",
  "ts",
  "html",
  "css",
  "c",
  "cpp",
  "java",
  "py",
  "go",
  "php",
];
module.exports = {
  app,
  request,
  createUser,
  createCourse,
  createLesson,
  createAssignment,
  createQuestionBank,
  createQuiz,
  createDummyFile,
  createDateTime,
  generateRandomString,
  adminUser,
  studentUser,
  instructorUser,
  commonInvalids,
  createAndLoginUser,
  getToken,
  addQuestionsAndGetIDs,
  addQuestionsAndGetIDsAndAnswers,
  enrollStudent,
  duriationRequiredFields,
  course_start_date,
  course_end_date,
  courseDuriationFieldInvalids,
  start_date,
  end_date,
  duriationFieldInvalids,
  invalidFileExtensions,
};
