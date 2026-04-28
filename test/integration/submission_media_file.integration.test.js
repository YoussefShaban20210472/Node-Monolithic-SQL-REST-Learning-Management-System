const fs = require("fs");
const os = require("os");
const path = require("path");
jest.setTimeout(20000);
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

// function createDummyFile(name = "test.pdf", content = "hello world") {
//   const filePath = path.join(os.tmpdir(), name);
//   fs.writeFileSync(filePath, content);
//   return filePath;
// }
function createDummyFile(name = "test.pdf", sizeMB = 1) {
  const sizeInBytes = sizeMB * 1024 * 1024;

  return {
    name,
    buffer: Buffer.alloc(sizeInBytes), // file content
  };
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

describe("Testing Post /course/:course_id/assignment/:assignment_id/submission", () => {
  let counter = 0;
  let adminToken, instructorToken, studentToken, studentId, instructorId;
  let courseId;
  let assignmentId;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;
    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    assignmentId = response.body.assignment.id;
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
  describe("Positive Testing", () => {
    beforeEach(async () => {
      console.log(++counter);
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
      console.log(counter, studentId);
    });

    roles.forEach((role) => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add only one media file to an submission`, async () => {
        let response;
        if (role.name == "student")
          response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);
        else
          response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .field("student_id", `${studentId}`)
            .attach("files", file.buffer, file.name);
        console.log(response.body);
        expect(response.status).toBe(201);
      });
    });
    roles.forEach((role) => {
      const file1 = createDummyFile(`${generateRandomString(10)}.pdf`);
      const file2 = createDummyFile(`${generateRandomString(10)}.pdf`);
      const file3 = createDummyFile(`${generateRandomString(10)}.pdf`);
      const file4 = createDummyFile(`${generateRandomString(10)}.pdf`);
      const file5 = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add more tha one media file to an submission`, async () => {
        let response;
        if (role.name == "student")
          response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file1.buffer, file1.name)
            .attach("files", file2.buffer, file2.name)
            .attach("files", file3.buffer, file3.name)
            .attach("files", file4.buffer, file4.name)
            .attach("files", file5.buffer, file5.name);
        else
          response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .field("student_id", `${studentId}`)
            .attach("files", file1.buffer, file1.name)
            .attach("files", file2.buffer, file2.name)
            .attach("files", file3.buffer, file3.name)
            .attach("files", file4.buffer, file4.name)
            .attach("files", file5.buffer, file5.name);
        console.log(response.body);
        expect(response.status).toBe(201);
      });
    });
  });

  describe("Negative Testing", () => {
    beforeAll(async () => {
      console.log(++counter);
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
      console.log(counter, studentId);
    });
    // describe("Should return 404 if the course is not found", () => {
    //   let courseId = "999999";
    //   const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    //   roles.forEach((role) => {
    //     it(`Should return 404 if the course is not found (${role.name})`, async () => {
    //       let response = await request(app)
    //         .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
    //         .set("Authorization", `Bearer ${role.token()}`)
    //         .attach("files", file);
    //       expect(response.status).toBe(404);
    //     });
    //   });
    // });
    // describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
    //   let unauthorizedInstructorToken, unauthorizedStudentToken;
    //   beforeAll(async () => {
    //     unauthorizedInstructorToken = await createAndLoginUser(
    //       createUser("instructor"),
    //     );
    //     unauthorizedStudentToken = await createAndLoginUser(
    //       createUser("student"),
    //     );
    //   });
    //   const scenarios = [
    //     {
    //       name: "missing",
    //       setHeader: (req) => req, // do nothing
    //     },
    //     {
    //       name: "empty",
    //       setHeader: (req) => req.set("Authorization", ""),
    //     },
    //     {
    //       name: "invalid",
    //       values: ["Bearer invalidtoken", "invalidtoken", "Bearer ", "12345"],
    //     },
    //     {
    //       name: "Unauthorized",
    //       values: [
    //         { name: "student user", token: () => unauthorizedStudentToken },
    //         {
    //           name: "instructor user",
    //           token: () => unauthorizedInstructorToken,
    //         },
    //       ],
    //     },
    //   ];
    //   const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    //   scenarios.forEach((scenario) => {
    //     if (scenario.name === "invalid") {
    //       scenario.values.forEach((value) => {
    //         it(`should return 401 if Authorization is invalid (${value})`, async () => {
    //           const response = await request(app)
    //             .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
    //             .set("Authorization", value)
    //             .attach("files", file);
    //           expect(response.status).toBe(401);
    //           expect(response.body.errors[0]).toHaveProperty("message");
    //         });
    //       });
    //     } else if (scenario.name === "Unauthorized") {
    //       scenario.values.forEach((value) => {
    //         it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
    //           response = await request(app)
    //             .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
    //             .set("Authorization", `Bearer ${value.token()}`)
    //             .attach("files", file);
    //           expect(response.status).toBe(401);
    //           expect(response.body.errors[0]).toHaveProperty("message");
    //         });
    //       });
    //     } else {
    //       it(`should return 401 if Authorization is ${scenario.name}`, async () => {
    //         let req = request(app)
    //           .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
    //           .attach("files", file);
    //         req = scenario.setHeader(req);
    //         const response = await req;
    //         expect(response.status).toBe(401);
    //         expect(response.body.errors[0]).toHaveProperty("message");
    //       });
    //     }
    //   });
    // });

    describe("Should return 400 if files are empty", () => {
      roles.forEach((role) => {
        it(`Should return 400 if files are empty ${role.name}`, async () => {
          let response;
          if (role.name == "student")
            response = await request(app)
              .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send();
          else
            response = await request(app)
              .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
              .set("Authorization", `Bearer ${role.token()}`)
              .send({ student_id: `${studentId}` });
          expect(response.status).toBe(400);
        });
      });
    });

    describe("Should return 400 if files extensions are not pdf", () => {
      describe("Should return 400 if file extension is not pdf (single file)", () => {
        roles.forEach((role) => {
          const fileExtensions = [
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
          fileExtensions.forEach((fileExtension) => {
            const file = createDummyFile(
              `${generateRandomString(10)}.${fileExtension}`,
            );
            it(`Should return 400 if file extension is not pdf ${role.name}`, async () => {
              let response;
              if (role.name == "student")
                response = await request(app)
                  .post(
                    `/course/${courseId}/assignment/${assignmentId}/submission`,
                  )
                  .set("Authorization", `Bearer ${role.token()}`)
                  .attach("files", file.buffer, file.name);
              else
                response = await request(app)
                  .post(
                    `/course/${courseId}/assignment/${assignmentId}/submission`,
                  )
                  .set("Authorization", `Bearer ${role.token()}`)
                  .field("student_id", `${studentId}`)
                  .attach("files", file.buffer, file.name);
              expect(response.status).toBe(400);
            });
          });
        });
      });
      describe("Should return 400 if files extensions are not pdf (multi files)", () => {
        roles.forEach((role) => {
          const file1 = createDummyFile(`${generateRandomString(10)}.pdf}`);
          const file2 = createDummyFile(`${generateRandomString(10)}.pdf}`);
          const file3 = createDummyFile(`${generateRandomString(10)}.mp3}`);
          const file4 = createDummyFile(`${generateRandomString(10)}.pdf}`);
          it(`Should return 400 if files extensions are not pdf ${role.name}`, async () => {
            let response;
            if (role.name == "student")
              response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .attach("files", file1.buffer, file1.name)
                .attach("files", file2.buffer, file2.name)
                .attach("files", file3.buffer, file3.name)
                .attach("files", file4.buffer, file4.name);
            else
              response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .field("student_id", `${studentId}`)
                .attach("files", file1.buffer, file1.name)
                .attach("files", file2.buffer, file2.name)
                .attach("files", file3.buffer, file3.name)
                .attach("files", file4.buffer, file4.name);
            expect(response.status).toBe(400);
          });
        });
      });
    });
    describe("Should return 400 if files sizes are more than 50mb", () => {
      describe("Should return 400 if file size is more than 50mb (single file)", () => {
        roles.forEach((role) => {
          const fileSizes = [51, 52, 55, 59, 61, 71, 81, 91, 111];
          fileSizes.forEach((fileSize) => {
            const file = createDummyFile(
              `${generateRandomString(10)}.pdf`,
              fileSize,
            );
            it(`Should return 400 if file size is more than 50mb ${role.name}`, async () => {
              let response;
              if (role.name == "student")
                response = await request(app)
                  .post(
                    `/course/${courseId}/assignment/${assignmentId}/submission`,
                  )
                  .set("Authorization", `Bearer ${role.token()}`)
                  .attach("files", file.buffer, file.name);
              else
                response = await request(app)
                  .post(
                    `/course/${courseId}/assignment/${assignmentId}/submission`,
                  )
                  .set("Authorization", `Bearer ${role.token()}`)
                  .field("student_id", `${studentId}`)
                  .attach("files", file.buffer, file.name);
              expect(response.status).toBe(400);
            });
          });
        });
      });
      describe("Should return 400 if files sizes are more than 50mb (multi files)", () => {
        roles.forEach((role) => {
          const file1 = createDummyFile(`${generateRandomString(10)}.pdf}`, 10);
          const file2 = createDummyFile(`${generateRandomString(10)}.pdf}`, 20);
          const file3 = createDummyFile(`${generateRandomString(10)}.pdf}`, 60);
          const file4 = createDummyFile(
            `${generateRandomString(10)}.pdf}`,
            100,
          );
          it(`Should return 400 if files extensions are not pdf ${role.name}`, async () => {
            let response;
            if (role.name == "student")
              response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .attach("files", file1.buffer, file1.name)
                .attach("files", file2.buffer, file2.name)
                .attach("files", file3.buffer, file3.name)
                .attach("files", file4.buffer, file4.name);
            else
              response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .field("student_id", `${studentId}`)
                .attach("files", file1.buffer, file1.name)
                .attach("files", file2.buffer, file2.name)
                .attach("files", file3.buffer, file3.name)
                .attach("files", file4.buffer, file4.name);
            expect(response.status).toBe(400);
          });
        });
      });
    });
  });
});

describe("Testing Delete /course/:course_id/assignment/:assignment_id/submission/:submission_id", () => {
  let adminToken, instructorToken, studentToken, studentId, instructorId;
  let courseId;
  let assignmentId;
  let submissiontIdToBeDelete;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;
    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    assignmentId = response.body.assignment.id;
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "student", token: () => studentToken },
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
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      response = await request(app)
        .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("files", file.buffer, file.name);
      submissiontIdToBeDelete = response.body.submission.id;
      console.log(submissiontIdToBeDelete);
    });
    roles.forEach((role) => {
      it(`Should allow ${role.name} to delete a submission`, async () => {
        let response = await request(app)
          .delete(
            `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
          )
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        console.log(response.body);
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Negative Testing", () => {
    let submissiontIdToBeDelete;
    beforeAll(async () => {
      studentToken = await createAndLoginUser(createUser("student"));
      await enrollStudent(adminToken, studentToken, courseId);
      let response = await request(app)
        .get(`/user/me`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send();
      expect(response.status).toBe(200);
      studentId = response.body.user.id;
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      response = await request(app)
        .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("files", file.buffer, file.name);
      submissiontIdToBeDelete = response.body.submission.id;
      console.log(submissiontIdToBeDelete);
    });
    afterAll(async () => {
      let response = await request(app)
        .delete(
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send();
      console.log(response.body);
    });
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the submission is not found", () => {
      let submissiontIdToBeDelete = "9999999";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Should return 400 if the course is invalid", () => {
      let courseId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the assignment is invalid", () => {
      let assignmentId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the submission is invalid", () => {
      let submissiontIdToBeDelete = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
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
              name: "authorized instructor user",
              token: () => instructorToken,
            },
            {
              name: "unauthorized instructor user",
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
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
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
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
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
                `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
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
  });
});

describe("Testing Get /course/:course_id/assignment/:assignment_id/submission/:submission_id/media_file/:filename", () => {
  let adminToken, instructorToken, studentToken, studentId, instructorId;
  let courseId;
  let assignmentId;

  let submissiontId;
  let filenameToBeGet;

  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;
    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    assignmentId = response.body.assignment.id;

    studentToken = await createAndLoginUser(createUser("student"));
    await enrollStudent(adminToken, studentToken, courseId);

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
      .set("Authorization", `Bearer ${studentToken}`)
      .attach("files", file.buffer, file.name);
    submissiontId = response.body.submission.id;
    filenameToBeGet = file.name;
  });
  afterAll(async () => {
    let response = await request(app)
      .delete(
        `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .send();
    console.log(response.body);
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
    { name: "student", token: () => studentToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`Should allow ${role.name} to get a file in a submission`, async () => {
        let response = await request(app)
          .get(
            `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
          )
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the submission is not found", () => {
      let submissiontId = "9999999";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the filename is not found", () => {
      let filenameToBeGet = "NOTFOUND.pdf";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Should return 400 if the course is invalid", () => {
      let courseId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the assignment is invalid", () => {
      let assignmentId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the submission is invalid", () => {
      let submissiontId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the filename is invalid", () => {
      roles.forEach((role) => {
        const invalidFileNames = [
          "aaa",
          ".pdf",
          "aaa.mp3",
          "pdf.",
          "pdf_pdf",
          ".mp3",
          "adwa.mp4",
        ];
        invalidFileNames.forEach((invalidFileName) => {
          it(`Should return 400 if the filename is invalid ((${invalidFileName})) (${role.name})`, async () => {
            let response = await request(app)
              .get(
                `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${invalidFileName}`,
              )
              .set("Authorization", `Bearer ${role.token()}`)
              .send();
            expect(response.status).toBe(400);
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
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .get(
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
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
                .get(
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
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
              .get(
                `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
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
  });
});

describe("Testing Get /course/:course_id/assignment/:assignment_id/submission/:submission_id", () => {
  let adminToken, instructorToken, studentToken, studentId, instructorId;
  let courseId;
  let assignmentId;
  let submissiontIdToBeGet;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;
    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    assignmentId = response.body.assignment.id;

    studentToken = await createAndLoginUser(createUser("student"));
    await enrollStudent(adminToken, studentToken, courseId);

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
      .set("Authorization", `Bearer ${studentToken}`)
      .attach("files", file.buffer, file.name);
    submissiontIdToBeGet = response.body.submission.id;
  });
  afterAll(async () => {
    let response = await request(app)
      .delete(
        `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .send();
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "student", token: () => studentToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`Should allow ${role.name} to delete a submission`, async () => {
        let response = await request(app)
          .get(
            `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
          )
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        console.log(response.body);
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the submission is not found", () => {
      let submissiontIdToBeGet = "9999999";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Should return 400 if the course is invalid", () => {
      let courseId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the assignment is invalid", () => {
      let assignmentId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the submission is invalid", () => {
      let submissiontIdToBeGet = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(400);
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
                .get(
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
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
                .get(
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
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
              .get(
                `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
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
  });
});

describe("Testing Patch /course/:course_id/assignment/:assignment_id/submission/:submission_id", () => {
  let adminToken, instructorToken, studentToken, studentId, instructorId;
  let courseId;
  let assignmentId;
  let submissiontIdToBePatch;
  beforeAll(async () => {
    adminToken = await getToken(adminUser);
    instructorToken = await getToken(instructorUser);
    const course = createCourse();
    let response = await request(app)
      .post("/course")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(course);
    courseId = response.body.course.id;
    const assignment = createAssignment();
    response = await request(app)
      .post(`/course/${courseId}/assignment`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(assignment);
    assignmentId = response.body.assignment.id;

    studentToken = await createAndLoginUser(createUser("student"));
    await enrollStudent(adminToken, studentToken, courseId);

    const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    response = await request(app)
      .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
      .set("Authorization", `Bearer ${studentToken}`)
      .attach("files", file.buffer, file.name);
    submissiontIdToBePatch = response.body.submission.id;
  });
  afterAll(async () => {
    let response = await request(app)
      .delete(
        `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .send();
  });
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const scores = [1.5, 5, 5.9, 10, 95.0, 9, 67.111, 99.1, 100, 1, 0, 0.09];
      scores.forEach((score) => {
        it(`Should allow ${role.name} to score a submission (${score})`, async () => {
          let response = await request(app)
            .patch(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send({ score });
          console.log(response.body);
          expect(response.status).toBe(200);
          expect(response.body.submission.score).toBe(score);
        });
      });
    });
  });

  describe("Negative Testing", () => {
    const body = { score: 50 };
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .patch(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send(body);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .patch(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send(body);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the submission is not found", () => {
      let submissiontIdToBePatch = "9999999";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .patch(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send(body);
          expect(response.status).toBe(404);
        });
      });
    });

    describe("Should return 400 if the course is invalid", () => {
      let courseId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .patch(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send(body);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the assignment is invalid", () => {
      let assignmentId = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the assignment is not found (${role.name})`, async () => {
          let response = await request(app)
            .patch(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send(body);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the submission is invalid", () => {
      let submissiontIdToBePatch = "invalid";
      roles.forEach((role) => {
        it(`Should return 404 if the submission is not found (${role.name})`, async () => {
          let response = await request(app)
            .patch(
              `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send(body);
          expect(response.status).toBe(400);
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
            {
              name: "unauthorized student user",
              token: () => unauthorizedStudentToken,
            },
            { name: "authorized student user", token: () => studentToken },

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
                .patch(
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
                )
                .set("Authorization", value)
                .send(body);
              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .patch(
                  `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
                )
                .set("Authorization", `Bearer ${value.token()}`)
                .send(body);
              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .patch(
                `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
              )
              .send(body);
            req = scenario.setHeader(req);
            const response = await req;
            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });
    describe("Submission Score update validation (Empty, Invalid)", () => {
      const requiredFields = ["score"];
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
        -123,
        123,
        -5.999,
        -0.1999,
        200.1999,
        100.1999,
        110.1999,
        910.1999,
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
      // Define all scenarios: missing, empty, invalid
      const scenarios = ["empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          scenarios.forEach((scenario) => {
            let values = [];

            if (scenario === "empty") {
              values = [""]; // empty string
            } else if (scenario === "invalid") {
              values = commonInvalids; // invalid values
            }

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario}${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }  `, async () => {
                const submission = {};

                submission[field] = value;

                const response = await request(app)
                  .patch(
                    `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
                  )
                  .set("Authorization", `Bearer ${role.token()}`)
                  .send(submission);

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
