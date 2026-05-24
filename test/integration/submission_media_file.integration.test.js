const {
  app,
  request,
  createUser,
  createCourse,
  createAssignment,
  createDummyFile,
  generateRandomString,
  adminUser,
  studentUser,
  instructorUser,
  createAndLoginUser,
  getToken,
  enrollStudent,
  invalidFileExtensions,
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
const requiredFields = ["score"];
// Common invalid values for most fields
const commonInvalids = [
  "123",
  "123000",
  "5",
  "10",
  "96",
  123,
  generateRandomString(501),
  generateRandomString(700),
  generateRandomString(1000),
  generateRandomString(3),
  generateRandomString(10) + "123546",
  -123,
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
const fieldInvalids = {
  student_id: [...commonInvalids.slice(6)],
};
let adminToken, instructorToken, studentToken, courseId;
let unauthorizedInstructorToken, unauthorizedStudentToken;
let assignmentId;
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

  const assignment = createAssignment();
  response = await request(app)
    .post(`/course/${courseId}/assignment`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(assignment);
  expect(response.status).toBe(201);
  assignmentId = response.body.assignment.id;
});

describe("Testing Post /course/:course_id/assignment/:assignment_id/submission", () => {
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
        setHeader: (req, student_id) => req.set("student_id", student_id),
      },
      {
        name: "student",
        token: () => studentToken,
        setHeader: (req, _) => req,
      },
    ];
    roles.forEach((role) => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add only one media file to an submission`, async () => {
        let req = request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
          .set("Authorization", `Bearer ${role.token()}`);

        req = role.setHeader(req, `${studentId}`);
        let response = await req.attach("files", file.buffer, file.name);
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
        let req = request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
          .set("Authorization", `Bearer ${role.token()}`)
          .attach("files", file1.buffer, file1.name)
          .attach("files", file2.buffer, file2.name)
          .attach("files", file3.buffer, file3.name)
          .attach("files", file4.buffer, file4.name)
          .attach("files", file5.buffer, file5.name);

        req = role.setHeader(req, `${studentId}`);
        let response = await req;
        expect(response.status).toBe(201);
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
        setHeader: (req, student_id) => req.set("student_id", student_id),
      },
      {
        name: "student",
        token: () => studentToken,
        setHeader: (req, _) => req,
      },
    ];
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let req = request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);

          req = role.setHeader(req, `${studentId}`);
          let response = await req;
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentId = "999999";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let req = request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);

          req = role.setHeader(req, `${studentId}`);
          let response = await req;
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 400 if the course id is not valid", () => {
      let courseId = "invalid-id";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 400 if the course id is not valid (${role.name})`, async () => {
          let req = request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);

          req = role.setHeader(req, `${studentId}`);
          let response = await req;
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 400 if the assignment id is not valid", () => {
      let assignmentId = "invalid-id";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 400 if the assignment id is not valid (${role.name})`, async () => {
          let req = request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);

          req = role.setHeader(req, `${studentId}`);
          let response = await req;
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
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
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", value)
                .attach("files", file.buffer, file.name);
              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else if (scenario.name === "Unauthorized") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is unauthorized as (${value.name})`, async () => {
              response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${value.token()}`)
                .attach("files", file.buffer, file.name);
              expect(response.status).toBe(401);
              expect(response.body.errors[0]).toHaveProperty("message");
            });
          });
        } else {
          it(`should return 401 if Authorization is ${scenario.name}`, async () => {
            let req = request(app)
              .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
              .attach("files", file.buffer, file.name);
            req = scenario.setHeader(req);
            const response = await req;
            expect(response.status).toBe(401);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        }
      });
    });

    describe("Should return 400 if files are empty", () => {
      roles.forEach((role) => {
        it(`Should return 400 if files are empty ${role.name}`, async () => {
          let response = await request(app)
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
          invalidFileExtensions.forEach((fileExtension) => {
            const file = createDummyFile(
              `${generateRandomString(10)}.${fileExtension}`,
            );
            it(`Should return 400 if file extension is not pdf ${role.name}`, async () => {
              let req = request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .attach("files", file.buffer, file.name);

              req = role.setHeader(req, `${studentId}`);
              let response = await req;
              expect(response.status).toBe(400);
            });
          });
        });
      });
      describe("Should return 400 if files extensions are not pdf (multi files)", () => {
        roles.forEach((role) => {
          invalidFileExtensions.forEach((fileExtension) => {
            const file = createDummyFile(
              `${generateRandomString(10)}.${fileExtension}`,
            );
            const file1 = createDummyFile(`${generateRandomString(10)}.pdf}`);
            const file2 = createDummyFile(`${generateRandomString(10)}.pdf}`);
            const file3 = createDummyFile(`${generateRandomString(10)}.mp3}`);
            const file4 = createDummyFile(`${generateRandomString(10)}.pdf}`);
            it(`Should return 400 if files extensions are not pdf ${role.name}`, async () => {
              let req = request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .attach("files", file1.buffer, file1.name)
                .attach("files", file2.buffer, file2.name)
                .attach("files", file3.buffer, file3.name)
                .attach("files", file4.buffer, file4.name);

              req = role.setHeader(req, `${studentId}`);
              let response = await req;
              expect(response.status).toBe(400);
            });
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
              let req = request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/submission`,
                )
                .set("Authorization", `Bearer ${role.token()}`)
                .attach("files", file.buffer, file.name);

              req = role.setHeader(req, `${studentId}`);
              let response = await req;
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
            let req = request(app)
              .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
              .set("Authorization", `Bearer ${role.token()}`)
              .attach("files", file1.buffur, file1.name)
              .attach("files", file2.buffur, file2.name)
              .attach("files", file3.buffur, file3.name)
              .attach("files", file4.buffur, file4.name);
            req = role.setHeader(req, `${studentId}`);
            let response = await req;
            expect(response.status).toBe(400);
          });
        });
      });
    });

    describe("Submission Header validation (Missing, Empty, Invalid)", () => {
      const requiredFields = ["student_id"];
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      const scenarios = ["empty", "invalid"];
      roles.forEach((role) => {
        requiredFields.forEach((field) => {
          scenarios.forEach((scenario) => {
            let values = [];
            if (scenario === "empty") {
              values = [""]; // empty string
            } else if (scenario === "invalid") {
              values = fieldInvalids[field] || commonInvalids;
            }

            values.forEach((value) => {
              it(`should return 400 if ${field} is ${scenario} (admin)${
                scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
              }`, async () => {
                let response = await request(app)
                  .post(
                    `/course/${courseId}/assignment/${assignmentId}/submission`,
                  )
                  .set("Authorization", `Bearer ${adminToken}`)
                  .set("student_id", JSON.stringify(value))
                  .attach("files", file.buffer, file.name);

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

describe("Testing Delete /course/:course_id/assignment/:assignment_id/submission/:submission_id", () => {
  describe("Positive Testing", () => {
    let studentToken, studentId;
    let submissiontIdToBeDelete;
    const roles = [
      { name: "admin", token: () => adminToken },
      { name: "student", token: () => studentToken },
    ];
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
    });
    roles.forEach((role) => {
      it(`Should allow ${role.name} to delete a submission`, async () => {
        let response = await request(app)
          .delete(
            `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
          )
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(response.status).toBe(200);
      });
    });
  });
  describe("Negative Testing", () => {
    let studentToken, studentId;
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
    });
    afterAll(async () => {
      let response = await request(app)
        .delete(
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send();
    });
    const roles = [
      { name: "admin", token: () => adminToken },
      { name: "student", token: () => studentToken },
    ];
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/99999999/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/99999999/submission/${submissiontIdToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the submission is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/99999999`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
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
        (req, url) => req.delete(url),
      );
    });

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/invalid-id/assignment/${assignmentId}/submission/${submissiontIdToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/invalid-id/submission/${submissiontIdToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the submission id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
  });
});

describe("Testing Get /course/:course_id/assignment/:assignment_id/submission/:submission_id/media_file/:filename", () => {
  let studentToken, studentId;
  let submissiontId;
  let filenameToBeGet;

  beforeAll(async () => {
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
      testNotFoundObjectRequest(
        () =>
          `/course/99999999/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/99999999/submission/${submissiontId}/media_file/${filenameToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the submission is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/99999999/media_file/${filenameToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the filename is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/not_found.pdf`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
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

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/invalid-id/assignment/${assignmentId}/submission/${submissiontId}/media_file/${filenameToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/invalid-id/submission/${submissiontId}/media_file/${filenameToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the submission id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/invalid-id/media_file/${filenameToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
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
          it(`Should return 400 if the filename is not valid (${invalidFileName}) (${role.name})`, async () => {
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
  });
});

describe("Testing Get /course/:course_id/assignment/:assignment_id/submission/:submission_id", () => {
  let studentToken, studentId, instructorId;
  let submissiontIdToBeGet;
  beforeAll(async () => {
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
      it(`Should allow ${role.name} to get a submission`, async () => {
        let response = await request(app)
          .get(
            `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
          )
          .set("Authorization", `Bearer ${role.token()}`)
          .send();
        expect(response.status).toBe(200);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/99999999/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/99999999/submission/${submissiontIdToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the submission is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/99999999`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
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

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/invalid-id/assignment/${assignmentId}/submission/${submissiontIdToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/invalid-id/submission/${submissiontIdToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 400 if the submission id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/invalid-id`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
  });
});

describe("Testing Patch /course/:course_id/assignment/:assignment_id/submission/:submission_id", () => {
  let studentToken, studentId, instructorId;
  let submissiontIdToBePatch;
  beforeAll(async () => {
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
          expect(response.status).toBe(200);
          expect(response.body.submission.score).toBe(score);
        });
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/99999999/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
        roles,
        () => {
          return { score: 50 };
        },
        (req, url) => req.patch(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/99999999/submission/${submissiontIdToBePatch}`,
        roles,
        () => {
          return { score: 50 };
        },
        (req, url) => req.patch(url),
      );
    });
    describe("Should return 404 if the submission is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/99999999`,
        roles,
        () => {
          return { score: 50 };
        },
        (req, url) => req.patch(url),
      );
    });

    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
        () => {
          return { score: 50 };
        },
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
        (req, url) => req.patch(url),
      );
    });

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/invalid-id/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
        roles,
        () => {
          return { score: 50 };
        },
        (req, url) => req.patch(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/invalid-id/submission/${submissiontIdToBePatch}`,
        roles,
        () => {
          return { score: 50 };
        },
        (req, url) => req.patch(url),
      );
    });
    describe("Should return 400 if the submission id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/invalid-id`,
        roles,
        () => {
          return { score: 50 };
        },
        (req, url) => req.get(url),
      );
    });
    describe("Submission Score update validation (Empty, Invalid)", () => {
      testInvalidObjectCreationRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontIdToBePatch}`,
        roles,
        requiredFields,
        [],
        commonInvalids,
        () => {
          return { score: 50 };
        },
        (req, url) => req.patch(url),
      );
    });
  });
});
