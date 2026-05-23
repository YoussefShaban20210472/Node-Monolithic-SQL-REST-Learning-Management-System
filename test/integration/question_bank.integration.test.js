// const {
//   app,
//   request,
//   createUser,
//   createCourse,
//   createQuestionBank,
//   generateRandomString,
//   adminUser,
//   studentUser,
//   instructorUser,
//   createAndLoginUser,
//   getToken,
//   enrollStudent,
// } = require("../utils/testingUtils");
// const {
//   testInvalidBodyRequest,
//   testInvalidObjectCreationRequest,
//   testInvalidObjectUpdateRequest,
//   testInvalidAuthenticationAndAuthorizationRequest,
//   testNotFoundObjectRequest,
//   testInvalidObjectIDFormatRequest,
//   testUpdateOneFieldInObjectRequest,
//   testUpdateManyFieldsInObjectRequest,
//   testInvalidObjectDuriationRequest,
// } = require("../utils/preMadeTests");
// jest.setTimeout(100000);
// const commonInvalids = [
//   "",
//   null,
//   undefined,
//   "123",
//   "123000",
//   "5",
//   "10",
//   "96",
//   generateRandomString(501),
//   generateRandomString(700),
//   generateRandomString(1000),
//   generateRandomString(10) + "123546",
//   -123,
//   123,
//   -5.999,
//   -0.1999,
//   200.1999,
//   100.1999,
//   110.1999,
//   910.1999,
//   "@#$dadsadad@#",
//   ".1000",
//   null,
//   true,
//   false,
//   generateRandomString(50) + "@" + generateRandomString(10) + ".",
//   "A@A.A",
//   [],
//   [1, 2],
//   ["Sadda", 0],
//   [true],
//   [null],
//   "2021-01-01T00:00:00Z",
//   "2020-01-01T00:00:00Z",
//   "2000-01-01T00:00:00Z",
//   "2029-01-01T00:00:00Z",
//   "2030-01-01T00:00:00Z",
//   "2110-01-01T00:00:00Z",
// ];
// const requiredFields = ["question", "answer", "type", "choice", "score"];

// const fieldInvalids = {
//   question: [...commonInvalids, "a", "ddddd", "qqqsds", "aaa"],
// };

// let adminToken, instructorToken, studentToken, courseId;
// let unauthorizedInstructorToken, unauthorizedStudentToken;
// beforeAll(async () => {
//   adminToken = await getToken(adminUser);
//   instructorToken = await getToken(instructorUser);
//   studentToken = await getToken(studentUser);
//   unauthorizedInstructorToken = await createAndLoginUser(
//     createUser("instructor"),
//   );
//   unauthorizedStudentToken = await createAndLoginUser(createUser("student"));
//   const course = createCourse();
//   response = await request(app)
//     .post("/course")
//     .set("Authorization", `Bearer ${instructorToken}`)
//     .send(course);
//   courseId = response.body.course.id;

//   await enrollStudent(adminToken, studentToken, courseId);
// });
// const roles = [
//   { name: "admin", token: () => adminToken },
//   { name: "instructor", token: () => instructorToken },
// ];

// describe("Testing Post /course/:course_id/question_bank", () => {
//   describe("Positive Testing", () => {
//     const questionTypes = ["mcq", "true_false", "short_answer"];
//     roles.forEach((role) => {
//       questionTypes.forEach((questionType) => {
//         const questionBank = createQuestionBank(questionType);
//         it(`Should allow ${role.name} to add a new question to a course question bank`, async () => {
//           response = await request(app)
//             .post(`/course/${courseId}/question_Bank`)
//             .set("Authorization", `Bearer ${role.token()}`)
//             .send(questionBank);
//           expect(response.status).toBe(201);
//         });
//       });
//     });
//   });
//   describe("Negative Testing", () => {
//     describe("Should return 404 if the course is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/999999/question_bank`,
//         roles,
//         createQuestionBank,
//         (req, url) => req.post(url),
//       );
//     });
//     describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
//       testInvalidAuthenticationAndAuthorizationRequest(
//         () => `/course/${courseId}/question_bank`,
//         createQuestionBank,
//         [
//           { name: "authorized student user", token: () => studentToken },
//           {
//             name: "unauthorized student user",
//             token: () => unauthorizedStudentToken,
//           },
//           {
//             name: "unauthorized instructor user",
//             token: () => unauthorizedInstructorToken,
//           },
//         ],
//         (req, url) => req.post(url),
//       );
//     });
//     describe("Should return 404 if the course id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/invalid-id/question_bank`,
//         roles,
//         () => undefined,
//         (req, url) => req.post(url),
//       );
//     });
//     describe("Should return 400 if request body is (missing, empty, invalid)", () => {
//       testInvalidBodyRequest(
//         () => `/course/${courseId}/question_bank`,
//         roles,
//         (req, url) => req.post(url),
//       );
//     });
//     describe("Question Bank creation validation (Missing, Empty, Invalid)", () => {
//       testInvalidObjectCreationRequest(
//         () => `/course/${courseId}/question_bank`,
//         roles,
//         requiredFields,
//         fieldInvalids,
//         commonInvalids,
//         createQuestionBank,
//       );
//     });
//   });
//   describe("Negative Testing", () => {
//     describe("Should return 400 if question type is not mcq and choice is not empty", () => {
//       roles.forEach((role) => {
//         const questionTypes = ["true_false", "short_answer"];
//         questionTypes.forEach((questionType) => {
//           const questionBank = createQuestionBank("mcq");
//           questionBank.type = questionType;
//           it(`Should return 400 if question type is not mcq and choice is not empty (${role.name})`, async () => {
//             let response = await request(app)
//               .post(`/course/${courseId}/question_bank`)
//               .set("Authorization", `Bearer ${role.token()}`)
//               .send(questionBank);
//             expect(response.status).toBe(400);
//           });
//         });
//       });
//     });
//     describe("Should return 400 if question type is mcq and choice doesn't contain the correct answer", () => {
//       roles.forEach((role) => {
//         const questionBank = createQuestionBank("mcq");
//         questionBank.choice.pop();
//         it(`Should return 400 if question type is mcq and choice doesn't contain the correct answer (${role.name})`, async () => {
//           let response = await request(app)
//             .post(`/course/${courseId}/question_bank`)
//             .set("Authorization", `Bearer ${role.token()}`)
//             .send(questionBank);
//           expect(response.status).toBe(400);
//         });
//       });
//     });
//     describe("Should return 400 if question type is mcq and choice length is less than 2", () => {
//       roles.forEach((role) => {
//         const questionBank = createQuestionBank("mcq");
//         questionBank.choice = [questionBank.answer];
//         it(`Should return 400 if question type is mcq and choice length is less than 2 (${role.name})`, async () => {
//           let response = await request(app)
//             .post(`/course/${courseId}/question_bank`)
//             .set("Authorization", `Bearer ${role.token()}`)
//             .send(questionBank);
//           expect(response.status).toBe(400);
//         });
//       });
//     });
//   });
// });

// describe("Testing Delete /course/:course_id/question_bank/:question_id", () => {
//   describe("Positive Testing", () => {
//     let questionBankIdToDelete;
//     beforeEach(async () => {
//       const questionBank = createQuestionBank();
//       let response = await request(app)
//         .post(`/course/${courseId}/question_bank`)
//         .set("Authorization", `Bearer ${instructorToken}`)
//         .send(questionBank);
//       questionBankIdToDelete = response.body.question.question_id;
//     });

//     roles.forEach((role) => {
//       it(`should allow ${role.name} to delete a question bank by id`, async () => {
//         const res = await request(app)
//           .delete(`/course/${courseId}/question_bank/${questionBankIdToDelete}`)
//           .set("Authorization", `Bearer ${role.token()}`);

//         expect(res.status).toBe(200);
//         expect(res.body).toHaveProperty("message");
//       });
//     });
//   });
//   describe("Negative Testing", () => {
//     let questionBankIdToDelete;
//     beforeAll(async () => {
//       const questionBank = createQuestionBank();
//       let response = await request(app)
//         .post(`/course/${courseId}/question_bank`)
//         .set("Authorization", `Bearer ${instructorToken}`)
//         .send(questionBank);
//       questionBankIdToDelete = response.body.question.question_id;
//     });
//     describe("Should return 404 if the course is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/999999/question_bank/${questionBankIdToDelete}`,
//         roles,
//         () => undefined,
//         (req, url) => req.delete(url),
//       );
//     });
//     describe("Should return 404 if the question is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/${courseId}/question_bank/999999999`,
//         roles,
//         () => undefined,
//         (req, url) => req.delete(url),
//       );
//     });
//     describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
//       testInvalidAuthenticationAndAuthorizationRequest(
//         () => `/course/${courseId}/question_bank/${questionBankIdToDelete}`,
//         () => undefined,
//         [
//           { name: "authorized student user", token: () => studentToken },
//           {
//             name: "unauthorized student user",
//             token: () => unauthorizedStudentToken,
//           },
//           {
//             name: "unauthorized instructor user",
//             token: () => unauthorizedInstructorToken,
//           },
//         ],
//         (req, url) => req.delete(url),
//       );
//     });
//     describe("Should return 404 if the course id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/invalid-id/question_bank/${questionBankIdToDelete}`,
//         roles,
//         () => undefined,
//         (req, url) => req.delete(url),
//       );
//     });
//     describe("Should return 404 if the question id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/${courseId}/question_bank/invalid-id`,
//         roles,
//         () => undefined,
//         (req, url) => req.delete(url),
//       );
//     });
//   });
// });

// describe("Testing Get /course/:course_id/question_bank/:question_id", () => {
//   describe("Positive Testing", () => {
//     let questionBank;
//     let index = 0;
//     const questionTypes = ["mcq", "true_false", "short_answer"];
//     beforeEach(async () => {
//       questionBank = createQuestionBank(questionTypes[index]);
//       let response = await request(app)
//         .post(`/course/${courseId}/question_bank`)
//         .set("Authorization", `Bearer ${instructorToken}`)
//         .send(questionBank);
//       expect(response.status).toBe(201);
//       questionBankIdToGet = response.body.question.question_id;
//       index = (index + 1) % questionTypes.length;
//     });
//     roles.forEach((role) => {
//       questionTypes.forEach((questionType) => {
//         it(`should allow ${role.name} to get a question bank by id (${questionType})`, async () => {
//           const res = await request(app)
//             .get(`/course/${courseId}/question_bank/${questionBankIdToGet}`)
//             .set("Authorization", `Bearer ${role.token()}`)
//             .send();

//           expect(res.status).toBe(200);
//           expect(res.body.question.question).toBe(questionBank.question);
//           expect(res.body.question.answer).toBe(questionBank.answer);
//           expect(res.body.question.score).toBe(questionBank.score);
//           expect(res.body.question.type).toBe(questionBank.type);
//           expect(`${res.body.question.choice.length}`).toBe(
//             `${questionBank.choice.length}`,
//           );
//         });
//       });
//     });
//   });
//   describe("Negative Testing", () => {
//     let questionBankIdToGet;
//     beforeAll(async () => {
//       const questionBank = createQuestionBank();
//       let response = await request(app)
//         .post(`/course/${courseId}/question_bank`)
//         .set("Authorization", `Bearer ${instructorToken}`)
//         .send(questionBank);
//       questionBankIdToGet = response.body.question.question_id;
//     });
//     describe("Should return 404 if the course is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/999999/question_bank/${questionBankIdToGet}`,
//         roles,
//         () => undefined,
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Should return 404 if the question is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/${courseId}/question_bank/999999999`,
//         roles,
//         () => undefined,
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
//       testInvalidAuthenticationAndAuthorizationRequest(
//         () => `/course/${courseId}/question_bank/${questionBankIdToGet}`,
//         () => undefined,
//         [
//           { name: "authorized student user", token: () => studentToken },
//           {
//             name: "unauthorized student user",
//             token: () => unauthorizedStudentToken,
//           },
//           {
//             name: "unauthorized instructor user",
//             token: () => unauthorizedInstructorToken,
//           },
//         ],
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Should return 404 if the course id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/invalid-id/question_bank/${questionBankIdToGet}`,
//         roles,
//         () => undefined,
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Should return 404 if the question id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/${courseId}/question_bank/invalid-id`,
//         roles,
//         () => undefined,
//         (req, url) => req.get(url),
//       );
//     });
//   });
// });

// describe("Testing Get /course/:course_id/question_bank/all", () => {
//   describe("Positive Testing", () => {
//     beforeAll(async () => {
//       const questionBank = createQuestionBank();
//       let response = await request(app)
//         .post(`/course/${courseId}/question_bank`)
//         .set("Authorization", `Bearer ${instructorToken}`)
//         .send(questionBank);
//       expect(response.status).toBe(201);
//     });
//     roles.forEach((role) => {
//       it(`should allow ${role.name} to get all questions Bank of given course id`, async () => {
//         const res = await request(app)
//           .get(`/course/${courseId}/question_bank/all`)
//           .set("Authorization", `Bearer ${role.token()}`)
//           .send();
//         expect(res.status).toBe(200);
//         expect(res.body.questions.length).toBeGreaterThan(0);
//       });
//     });
//   });
//   describe("Negative Testing", () => {
//     describe("Should return 404 if the course is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/999999/question_bank/all`,
//         roles,
//         () => undefined,
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
//       testInvalidAuthenticationAndAuthorizationRequest(
//         () => `/course/${courseId}/question_bank/all`,
//         () => undefined,
//         [
//           { name: "authorized student user", token: () => studentToken },
//           {
//             name: "unauthorized student user",
//             token: () => unauthorizedStudentToken,
//           },
//           {
//             name: "unauthorized instructor user",
//             token: () => unauthorizedInstructorToken,
//           },
//         ],
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Should return 404 if the course id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/invalid-id/question_bank/all`,
//         roles,
//         () => undefined,
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Should return [] if the questions Bank are empty", () => {
//       let courseId;
//       beforeAll(async () => {
//         const course = createCourse();
//         let response = await request(app)
//           .post("/course")
//           .set("Authorization", `Bearer ${instructorToken}`)
//           .send(course);
//         expect(response.status).toBe(201);
//         courseId = response.body.course.id;
//       });
//       roles.forEach((role) => {
//         it(`Should return [] if the questions bank are empty (${role.name})`, async () => {
//           let response = await request(app)
//             .get(`/course/${courseId}/question_bank/all`)
//             .set("Authorization", `Bearer ${role.token()}`)
//             .send();
//           expect(response.status).toBe(200);
//           expect(response.body.questions.length).toBe(0);
//         });
//       });
//     });
//   });
// });

// describe("Testing Put /course/:course_id/question_bank/:question_id", () => {
//   describe("Positive Testing", () => {
//     describe("should allow admin and instructor to update only one field in given question bank by id", () => {
//       let questionBankIdToUpdate;
//       beforeAll(async () => {
//         const questionBank = createQuestionBank("true_false");
//         let response = await request(app)
//           .post(`/course/${courseId}/question_bank`)
//           .set("Authorization", `Bearer ${instructorToken}`)
//           .send(questionBank);
//         questionBankIdToUpdate = response.body.question.question_id;
//       });
//       testUpdateOneFieldInObjectRequest(
//         () => `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
//         roles,
//         () => createQuestionBank("true_false"),
//         requiredFields,
//       );
//     });
//     describe("should allow admin and instructor to update more than one field in given question bank by id", () => {
//       let questionBankIdToUpdate;
//       beforeAll(async () => {
//         const questionBank = createQuestionBank("true_false");
//         let response = await request(app)
//           .post(`/course/${courseId}/question_bank`)
//           .set("Authorization", `Bearer ${instructorToken}`)
//           .send(questionBank);
//         questionBankIdToUpdate = response.body.question.question_id;
//       });
//       testUpdateManyFieldsInObjectRequest(
//         () => `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
//         roles,
//         createQuestionBank,
//       );
//     });
//   });
//   describe("Negative Testing", () => {
//     let questionBankIdToUpdate;
//     beforeAll(async () => {
//       const questionBank = createQuestionBank("mcq");
//       let response = await request(app)
//         .post(`/course/${courseId}/question_bank`)
//         .set("Authorization", `Bearer ${instructorToken}`)
//         .send(questionBank);
//       questionBankIdToUpdate = response.body.question.question_id;
//     });
//     describe("Should return 404 if the course is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/999999/question_bank/${questionBankIdToUpdate}`,
//         roles,
//         createQuestionBank,
//         (req, url) => req.put(url),
//       );
//     });
//     describe("Should return 404 if the question is not found", () => {
//       testNotFoundObjectRequest(
//         () => `/course/${courseId}/question_bank/999999999`,
//         roles,
//         createQuestionBank,
//         (req, url) => req.put(url),
//       );
//     });
//     describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
//       testInvalidAuthenticationAndAuthorizationRequest(
//         () => `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
//         createQuestionBank,
//         [
//           { name: "authorized student user", token: () => studentToken },
//           {
//             name: "unauthorized student user",
//             token: () => unauthorizedStudentToken,
//           },
//           {
//             name: "unauthorized instructor user",
//             token: () => unauthorizedInstructorToken,
//           },
//         ],
//         (req, url) => req.put(url),
//       );
//     });
//     describe("Should return 404 if the course id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/invalid-id/question_bank/${questionBankIdToUpdate}`,
//         roles,
//         createQuestionBank,
//         (req, url) => req.put(url),
//       );
//     });
//     describe("Should return 404 if the question id is invalid id format", () => {
//       testInvalidObjectIDFormatRequest(
//         () => `/course/${courseId}/question_bank/invalid-id`,
//         roles,
//         createQuestionBank,
//         (req, url) => req.put(url),
//       );
//     });
//     describe("Should return 400 if request body is (missing, empty, invalid)", () => {
//       testInvalidBodyRequest(
//         () => `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
//         roles,
//         (req, url) => req.put(url),
//       );
//     });
//     describe("Question Bank update validation (Empty, Invalid)", () => {
//       testInvalidObjectUpdateRequest(
//         () => `/course/${courseId}/question_bank/${questionBankIdToUpdate}`,
//         roles,
//         requiredFields,
//         fieldInvalids,
//         commonInvalids,
//       );
//     });
//   });
// });
