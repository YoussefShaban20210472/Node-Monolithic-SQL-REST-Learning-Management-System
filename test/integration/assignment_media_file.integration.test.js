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
describe("Testing Post /course/:course_id/assignment/:assignment_id/media_file", () => {
  let adminToken, instructorToken, instructorId;
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
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add only one media file to a assignment`, async () => {
        response = await request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
          .set("Authorization", `Bearer ${role.token()}`)
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
      it(`Should allow ${role.name} to add more tha one media file to a course`, async () => {
        response = await request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
          .set("Authorization", `Bearer ${role.token()}`)
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
    // describe("Should return 404 if the course is not found", () => {
    //   let courseId = "999999";
    //   const file = createDummyFile(`${generateRandomString(10)}.pdf`);
    //   roles.forEach((role) => {
    //     it(`Should return 404 if the course is not found (${role.name})`, async () => {
    //       let response = await request(app)
    //         .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
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
    //             .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
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
    //             .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
    //             .set("Authorization", `Bearer ${value.token()}`)
    //             .attach("files", file);
    //           expect(response.status).toBe(401);
    //           expect(response.body.errors[0]).toHaveProperty("message");
    //         });
    //       });
    //     } else {
    //       it(`should return 401 if Authorization is ${scenario.name}`, async () => {
    //         let req = request(app)
    //           .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
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
          response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
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
              let response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/media_file`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
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
            let response = await request(app)
              .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
              .set("Authorization", `Bearer ${role.token()}`)
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
              let response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/media_file`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .attach("files", file.buffur, file.name);
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
            let response = await request(app)
              .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
              .set("Authorization", `Bearer ${role.token()}`)
              .attach("files", file1.buffur, file1.name)
              .attach("files", file2.buffur, file2.name)
              .attach("files", file3.buffur, file3.name)
              .attach("files", file4.buffur, file4.name);
            expect(response.status).toBe(400);
          });
        });
      });
    });
  });
});

describe("Testing Delete /course/:course_id/assignment/:assignment_id/media_file/:filename", () => {
  let adminToken, instructorToken, instructorId;
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
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add only one media file to a course`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
          .set("Authorization", `Bearer ${role.token()}`)
          .attach("files", file.buffer, file.name);
        response = await request(app)
          .delete(
            `/course/${courseId}/assignment/${assignmentId}/media_file/${file.name}`,
          )
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Negative Testing", () => {
    let fileToBeDelete;
    beforeAll(async () => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      let response = await request(app)
        .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .attach("files", file.buffer, file.name);
      expect(response.status).toBe(201);
      fileToBeDelete = file.name;
    });
    afterAll(async () => {
      let response = await request(app)
        .delete(
          `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
        )
        .set("Authorization", `Bearer ${instructorToken}`)
        .send();
    });
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the filename is not found", () => {
      let fileToBeDelete = "aaa.pdf";
      roles.forEach((role) => {
        it(`Should return 404 if the filename is not found (${role.name})`, async () => {
          let response = await request(app)
            .delete(
              `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
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
                  `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
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
                  `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
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
                `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
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
    describe("Should return 400 if the filename is not valid", () => {
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
          it(`Should return 404 if the filename is not found ((${invalidFileName})) (${role.name})`, async () => {
            let response = await request(app)
              .delete(
                `/course/${courseId}/assignment/${assignmentId}/media_file/${invalidFileName}`,
              )
              .set("Authorization", `Bearer ${role.token()}`)
              .send();
            expect(response.status).toBe(400);
          });
        });
      });
    });
  });
});
describe("Testing Get /course/:course_id/assignment/:assignment_id/media_file/:filename", () => {
  let adminToken, instructorToken, instructorId;
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
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
  ];
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add only one media file to a course`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
          .set("Authorization", `Bearer ${role.token()}`)
          .attach("files", file.buffer, file.name);
        response = await request(app)
          .get(
            `/course/${courseId}/assignment/${assignmentId}/media_file/${file.name}`,
          )
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(response.status).toBe(200);
        response = await request(app)
          .delete(
            `/course/${courseId}/assignment/${assignmentId}/media_file/${file.name}`,
          )
          .set("Authorization", `Bearer ${instructorToken}`)
          .send();
      });
    });
  });

  describe("Negative Testing", () => {
    let fileToBeGet;
    beforeAll(async () => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      let response = await request(app)
        .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .attach("files", file.buffer, file.name);
      expect(response.status).toBe(201);
      fileToBeGet = file.name;
    });
    afterAll(async () => {
      let response = await request(app)
        .delete(
          `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
        )
        .set("Authorization", `Bearer ${instructorToken}`)
        .send();
    });

    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
            )
            .set("Authorization", `Bearer ${role.token()}`)
            .send();
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the filename is not found", () => {
      let fileToBeGet = "aaa.pdf";
      roles.forEach((role) => {
        it(`Should return 404 if the filename is not found (${role.name})`, async () => {
          let response = await request(app)
            .get(
              `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
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
                .get(
                  `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
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
                  `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
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
                `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
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
    describe("Should return 400 if the filename is not valid", () => {
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
          it(`Should return 404 if the filename is not found ((${invalidFileName})) (${role.name})`, async () => {
            let response = await request(app)
              .delete(
                `/course/${courseId}/assignment/${assignmentId}/media_file/${invalidFileName}`,
              )
              .set("Authorization", `Bearer ${role.token()}`)
              .send();
            expect(response.status).toBe(400);
          });
        });
      });
    });
  });
});
