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
jest.setTimeout(100000);

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
const roles = [
  { name: "admin", token: () => adminToken },
  { name: "instructor", token: () => instructorToken },
];
describe("Testing Post /course/:course_id/media_file", () => {
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add only one media file to a course`, async () => {
        response = await request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
          .set("Authorization", `Bearer ${role.token()}`)
          .attach("files", file.buffer, file.name);
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
        expect(response.status).toBe(201);
      });
    });
  });
  describe("Negative Testing", () => {
    describe("Should return 404 if the course is not found", () => {
      let courseId = "999999";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 400 if the course id is not valid", () => {
      let courseId = "invalid-id";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 400 if the course is not valid (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);
          expect(response.status).toBe(400);
        });
      });
    });
    describe("Should return 404 if the assignment is not found", () => {
      let assignmentId = "999999";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 404 if the course is not found (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);
          expect(response.status).toBe(404);
        });
      });
    });
    describe("Should return 400 if the assignment id is not valid", () => {
      let assignmentId = "invalid-id";
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      roles.forEach((role) => {
        it(`Should return 400 if the course is not valid (${role.name})`, async () => {
          let response = await request(app)
            .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
            .set("Authorization", `Bearer ${role.token()}`)
            .attach("files", file.buffer, file.name);
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
        },
      ];
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      scenarios.forEach((scenario) => {
        if (scenario.name === "invalid") {
          scenario.values.forEach((value) => {
            it(`should return 401 if Authorization is invalid (${value})`, async () => {
              const response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/media_file`,
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
                  `/course/${courseId}/assignment/${assignmentId}/media_file`,
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
              .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
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
          invalidFileExtensions.forEach((fileExtension) => {
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
          invalidFileExtensions.forEach((fileExtension) => {
            const file = createDummyFile(
              `${generateRandomString(10)}.${fileExtension}`,
            );
            const file1 = createDummyFile(`${generateRandomString(10)}.pdf}`);
            const file2 = createDummyFile(`${generateRandomString(10)}.pdf}`);
            const file3 = createDummyFile(`${generateRandomString(10)}.mp3}`);
            const file4 = createDummyFile(`${generateRandomString(10)}.pdf}`);
            it(`Should return 400 if files extensions are not pdf ${role.name}`, async () => {
              let response = await request(app)
                .post(
                  `/course/${courseId}/assignment/${assignmentId}/media_file`,
                )
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

describe("Testing Delete /course/:course_id/media_file/:filename", () => {
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      const file = createDummyFile(`${generateRandomString(10)}.pdf`);
      it(`Should allow ${role.name} to add only one media file to a course`, async () => {
        let response = await request(app)
          .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
          .set("Authorization", `Bearer ${role.token()}`)
          .attach("files", file.buffer, file.name);
        expect(response.status).toBe(201);
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
      testNotFoundObjectRequest(
        () =>
          `/course/999999/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/99999999/media_file/${fileToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 404 if the filename is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/media_file/notfound.pdf`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
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
        (req, url) => req.delete(url),
      );
    });

    describe("Should return 400 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/invalid-id/assignment/${assignmentId}/media_file/${fileToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
      );
    });
    describe("Should return 400 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/invalid-id/media_file/${fileToBeDelete}`,
        roles,
        () => undefined,
        (req, url) => req.delete(url),
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
          it(`Should return 404 if the filename is not valid (${invalidFileName}) (${role.name})`, async () => {
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

describe("Testing Get /course/:course_id/media_file/:filename", () => {
  let fileToBeGet;
  const roles = [
    { name: "admin", token: () => adminToken },
    { name: "instructor", token: () => instructorToken },
    { name: "student", token: () => studentToken },
  ];
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
  describe("Positive Testing", () => {
    roles.forEach((role) => {
      it(`Should allow ${role.name} to get a media file`, async () => {
        let response = await request(app)
          .get(
            `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
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
          `/course/999999/assignment/${assignmentId}/media_file/${fileToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the assignment is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/99999999/media_file/${fileToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the filename is not found", () => {
      testNotFoundObjectRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/media_file/notfound.pdf`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
      testInvalidAuthenticationAndAuthorizationRequest(
        () =>
          `/course/${courseId}/assignment/${assignmentId}/media_file/${fileToBeGet}`,
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
    describe("Should return 404 if the course id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/invalid-id/assignment/${assignmentId}/media_file/${fileToBeGet}`,
        roles,
        () => undefined,
        (req, url) => req.get(url),
      );
    });
    describe("Should return 404 if the assignment id is invalid id format", () => {
      testInvalidObjectIDFormatRequest(
        () =>
          `/course/${courseId}/assignment/invalid-id/media_file/${fileToBeGet}`,
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
          it(`Should return 404 if the filename is not found (${invalidFileName}) (${role.name})`, async () => {
            let response = await request(app)
              .get(
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
