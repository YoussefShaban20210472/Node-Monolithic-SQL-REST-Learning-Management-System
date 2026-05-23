// const {
//   app,
//   request,
//   createUser,
//   createCourse,
//   createLesson,
//   createAssignment,
//   createQuiz,
//   createDummyFile,
//   generateRandomString,
//   adminUser,
//   commonInvalids,
//   createAndLoginUser,
//   getToken,
//   addQuestionsAndGetIDs,
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
// const requiredFields = ["user_id", "status"];
// jest.setTimeout(100000);
// let adminToken;
// beforeAll(async () => {
//   adminToken = await getToken(adminUser);
// });
// async function TestEmptyNotification(user_id, status) {
//   it(`Should return [] if the user hasn't read any notification and wants to see only read notifications`, async () => {
//     let response = await request(app)
//       .get(`/notification`)
//       .set("Authorization", `Bearer ${adminToken}`)
//       .send({ user_id: `${user_id()}`, status });
//     expect(response.status).toBe(200);
//     expect(response.body.notifications.length).toBe(0);
//   });
// }
// async function TestSeeAllReadNotification(user_id, notificationSize) {
//   it(`Should allow user to see all notifications if status was all`, async () => {
//     let response = await request(app)
//       .get(`/notification`)
//       .set("Authorization", `Bearer ${adminToken}`)
//       .send({ user_id: `${user_id()}`, status: "all" });
//     expect(response.status).toBe(200);
//     expect(response.body.notifications.length).toBe(notificationSize);
//     const notifications = response.body.notifications;
//     for (let notification of notifications) {
//       expect(notification.status).toBe("read");
//     }
//   });
// }
// async function TestSeeNotification(roles, message, notificationSize) {
//   roles.forEach((role) => {
//     it(`Should allow ${role.name} to see ${message} notification`, async () => {
//       let response = await request(app)
//         .get(`/notification`)
//         .set("Authorization", `Bearer ${role.token()}`)
//         .send(role.body());
//       expect(response.status).toBe(200);
//       expect(response.body.notifications.length).toBe(notificationSize);
//       const notifications = response.body.notifications;
//       for (let notification of notifications) {
//         expect(notification.status).toBe(role.status);
//       }
//     });
//   });
// }
// function createRoles(name, token, body) {
//   return [
//     {
//       name: name,
//       token: token,
//       body: () => {
//         return {};
//       },
//       status: "unread",
//     },
//     {
//       name: "admin",
//       token: () => adminToken,
//       body: body,
//       status: "read",
//     },
//   ];
// }
// async function TestNotification(
//   name,
//   token,
//   id,
//   body,
//   message,
//   notificationSize,
// ) {
//   TestEmptyNotification(id, "read");
//   TestSeeNotification(
//     createRoles(name, token, body),
//     message,
//     notificationSize,
//   );
//   TestSeeAllReadNotification(id, notificationSize);
//   TestEmptyNotification(id, "unread");
// }
// const rules = {
//   enroll: true,
//   unenroll: true,
//   acceptStudent: true,
//   rejectStudent: true,
//   updateCourse: true,
//   deleteCourse: true,
//   createLesson: true,
//   updateLesson: true,
//   deleteLesson: true,
//   createAssignment: true,
//   updateAssignment: true,
//   deleteAssignment: true,
//   createQuiz: true,
//   updateQuiz: true,
//   deleteQuiz: true,
//   createCourseMediaFile: true,
//   deleteCourseMediaFile: true,
//   createAssignmentMediaFile: true,
//   deleteAssignmentMediaFile: true,
//   gradeSubmission: true,
// };
// async function initialize(rules) {
//   let instructorToken, studentToken, instructorId, studentId;
//   let courseId, assignmentId, quizId, lessonId;
//   let courseFilename, assignmentFilename;
//   let response;
//   instructorToken = await createAndLoginUser(createUser("instructor"));
//   studentToken = await createAndLoginUser(createUser("student"));
//   response = await request(app)
//     .get("/user/me")
//     .set("Authorization", `Bearer ${instructorToken}`)
//     .send();
//   expect(response.status).toBe(200);
//   instructorId = response.body.user.id;
//   response = await request(app)
//     .get("/user/me")
//     .set("Authorization", `Bearer ${studentToken}`)
//     .send();
//   expect(response.status).toBe(200);
//   studentId = response.body.user.id;

//   const course = createCourse();
//   response = await request(app)
//     .post("/course")
//     .set("Authorization", `Bearer ${instructorToken}`)
//     .send(course);
//   expect(response.status).toBe(201);
//   courseId = response.body.course.id;

//   response = await request(app)
//     .post(`/course/${courseId}/enrollment`)
//     .set("Authorization", `Bearer ${studentToken}`)
//     .send();
//   expect(response.status).toBe(201);

//   if (rules.unenroll) {
//     response = await request(app)
//       .delete(`/course/${courseId}/enrollment`)
//       .set("Authorization", `Bearer ${studentToken}`)
//       .send();
//     expect(response.status).toBe(200);
//   }
//   if (rules.rejectStudent == null && rules.unenroll == null) {
//     response = await request(app)
//       .put(`/course/${courseId}/enrollment`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send({ status: "accepted", student_id: `${studentId}` });
//     expect(response.status).toBe(200);
//   }
//   if (rules.rejectStudent) {
//     response = await request(app)
//       .put(`/course/${courseId}/enrollment`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send({ status: "rejected", student_id: `${studentId}` });
//     expect(response.status).toBe(200);
//   }
//   if (rules.updateCourse) {
//     const newCourse = createCourse();
//     response = await request(app)
//       .put(`/course/${courseId}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send(newCourse);
//     expect(response.status).toBe(200);
//   }
//   if (rules.createLesson || rules.updateLesson || rules.deleteLesson) {
//     const lesson = createLesson();
//     response = await request(app)
//       .post(`/course/${courseId}/lesson`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send(lesson);
//     expect(response.status).toBe(201);
//     lessonId = response.body.lesson.id;
//   }
//   if (rules.updateLesson) {
//     const newLesson = createLesson();
//     response = await request(app)
//       .put(`/course/${courseId}/lesson/${lessonId}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send(newLesson);
//     expect(response.status).toBe(200);
//   }
//   if (rules.deleteLesson) {
//     response = await request(app)
//       .delete(`/course/${courseId}/lesson/${lessonId}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send();
//     expect(response.status).toBe(200);
//   }
//   if (
//     rules.createAssignment ||
//     rules.updateAssignment ||
//     rules.deleteAssignment ||
//     rules.createAssignmentMediaFile ||
//     rules.deleteAssignmentMediaFile ||
//     rules.gradeSubmission
//   ) {
//     const assignment = createAssignment();
//     response = await request(app)
//       .post(`/course/${courseId}/assignment`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send(assignment);
//     expect(response.status).toBe(201);
//     assignmentId = response.body.assignment.id;
//   }
//   if (rules.updateAssignment) {
//     const newAssignment = createAssignment();
//     response = await request(app)
//       .put(`/course/${courseId}/assignment/${assignmentId}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send(newAssignment);
//     expect(response.status).toBe(200);
//   }
//   if (rules.deleteAssignment) {
//     response = await request(app)
//       .delete(`/course/${courseId}/assignment/${assignmentId}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send();
//     expect(response.status).toBe(200);
//   }
//   if (rules.createQuiz || rules.updateQuiz || rules.deleteQuiz) {
//     questions_ids = await addQuestionsAndGetIDs(courseId, instructorToken);
//     const quiz = createQuiz(questions_ids);
//     response = await request(app)
//       .post(`/course/${courseId}/quiz`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send(quiz);
//     expect(response.status).toBe(201);
//     quizId = response.body.quiz.id;
//   }
//   if (rules.updateQuiz) {
//     const newQuiz = createQuiz(questions_ids);
//     response = await request(app)
//       .put(`/course/${courseId}/quiz/${quizId}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send(newQuiz);
//     expect(response.status).toBe(200);
//   }
//   if (rules.deleteQuiz) {
//     response = await request(app)
//       .delete(`/course/${courseId}/quiz/${quizId}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send();
//     expect(response.status).toBe(200);
//   }
//   if (rules.createCourseMediaFile || rules.deleteCourseMediaFile) {
//     const file = createDummyFile(`${generateRandomString(10)}.pdf`);
//     response = await request(app)
//       .post(`/course/${courseId}/media_file`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .attach("files", file.buffer, file.name);
//     expect(response.status).toBe(201);
//     courseFilename = file.name;
//   }
//   if (rules.deleteCourseMediaFile) {
//     response = await request(app)
//       .delete(`/course/${courseId}/media_file/${courseFilename}`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send();
//     expect(response.status).toBe(200);
//   }
//   if (rules.createAssignmentMediaFile || rules.deleteAssignmentMediaFile) {
//     const file = createDummyFile(`${generateRandomString(10)}.pdf`);
//     response = await request(app)
//       .post(`/course/${courseId}/assignment/${assignmentId}/media_file`)
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .attach("files", file.buffer, file.name);
//     expect(response.status).toBe(201);
//     assignmentFilename = file.name;
//   }
//   if (rules.deleteAssignmentMediaFile) {
//     response = await request(app)
//       .delete(
//         `/course/${courseId}/assignment/${assignmentId}/media_file/${assignmentFilename}`,
//       )
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send();
//     expect(response.status).toBe(200);
//   }
//   if (rules.gradeSubmission) {
//     const file = createDummyFile(`${generateRandomString(10)}.pdf`);
//     response = await request(app)
//       .post(`/course/${courseId}/assignment/${assignmentId}/submission`)
//       .set("Authorization", `Bearer ${studentToken}`)
//       .attach("files", file.buffer, file.name);
//     expect(response.status).toBe(201);
//     const submissiontId = response.body.submission.id;

//     response = await request(app)
//       .patch(
//         `/course/${courseId}/assignment/${assignmentId}/submission/${submissiontId}`,
//       )
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send({ score: 50 });
//     expect(response.status).toBe(200);
//   }
//   return { studentId, studentToken, instructorId, instructorToken };
// }
// describe("Testing Get /notification", () => {
//   let adminToken, instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     instructorToken = await createAndLoginUser(createUser("instructor"));
//     studentToken = await createAndLoginUser(createUser("student"));
//     adminToken = await createAndLoginUser(createUser("admin"));

//     let response = await request(app)
//       .get("/user/me")
//       .set("Authorization", `Bearer ${instructorToken}`)
//       .send();
//     instructorId = response.body.user.id;
//     response = await request(app)
//       .get("/user/me")
//       .set("Authorization", `Bearer ${studentToken}`)
//       .send();
//     studentId = response.body.user.id;
//   });
//   describe("Negative Testing", () => {
//     describe("Should return [] if the user don't have any notification at all", () => {
//       const roles = [
//         { name: "instructor", token: () => instructorToken },
//         { name: "student", token: () => studentToken },
//       ];
//       const users = [
//         { name: "instructor", id: () => instructorId },
//         { name: "student", id: () => studentId },
//       ];
//       const statuses = [undefined, "all", "read", "unread"];

//       roles.forEach((role) => {
//         statuses.forEach((status) => {
//           it(`Should return [] if the user don't have any notification at all (${role.name})`, async () => {
//             let response = await request(app)
//               .get(`/notification`)
//               .set("Authorization", `Bearer ${role.token()}`)
//               .send({ status: status });
//             expect(response.status).toBe(200);
//             expect(response.body.notifications.length).toBe(0);
//           });
//         });
//       });
//       users.forEach((user) => {
//         statuses.forEach((status) => {
//           it(`Should return [] if the user don't have any notification at all (admin) (${user.name})`, async () => {
//             let response = await request(app)
//               .get(`/notification`)
//               .set("Authorization", `Bearer ${adminToken}`)
//               .send({ status: status, user_id: `${user.id()}` });
//             expect(response.status).toBe(200);
//             expect(response.body.notifications.length).toBe(0);
//           });
//         });
//       });
//     });
//     describe("Authentication and Authorization validation (Missing, Empty, Invalid, Unauthorized)", () => {
//       testInvalidAuthenticationAndAuthorizationRequest(
//         () => `/notification`,
//         () => undefined,
//         [],
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Should return 400 if request body is (missing, empty, invalid)", () => {
//       testInvalidBodyRequest(
//         () => `/notification`,
//         [{ name: "admin", token: () => adminToken }],
//         (req, url) => req.get(url),
//       );
//     });
//     describe("Notification body Validation (Missing, Empty, Invalid)", () => {
//       const roles = [
//         { name: "admin", token: () => adminToken },
//         { name: "instructor", token: () => instructorToken },
//         { name: "student", token: () => studentToken },
//       ];

//       const scenarios = ["empty", "invalid"];

//       roles.forEach((role) => {
//         requiredFields.forEach((field) => {
//           if (field == "user_id" && role.name != "admin") return;
//           scenarios.forEach((scenario) => {
//             let values = [];

//             if (scenario === "empty") {
//               values = [""]; // empty string
//             } else if (scenario === "invalid") {
//               values = commonInvalids; // invalid values
//             }

//             values.forEach((value) => {
//               it(`should return 400 if ${field} is ${scenario}${
//                 scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
//               }`, async () => {
//                 const notification = { user_id: "1", status: "all" };

//                 notification[field] = value;

//                 const response = await request(app)
//                   .get(`/notification`)
//                   .set("Authorization", `Bearer ${role.token()}`)
//                   .send(notification);

//                 expect(response.status).toBe(400);
//                 expect(response.body.errors[0]).toHaveProperty("message");
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// });
// describe("Testing Get /notification (Student Enrollment)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ enroll: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "instructor",
//     () => instructorToken,
//     () => `${instructorId}`,
//     () => {
//       return { user_id: `${instructorId}` };
//     },
//     "enrollment",
//     1,
//   );
// });

// describe("Testing Get /notification (Student Unenrollment)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ unenroll: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "instructor",
//     () => instructorToken,
//     () => `${instructorId}`,
//     () => {
//       return { user_id: `${instructorId}` };
//     },
//     "unenrollment",
//     2,
//   );
// });

// describe("Testing Get /notification (Student Enrollment Accepted)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ enroll: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "accepted enrollment",
//     1,
//   );
// });
// describe("Testing Get /notification (Student Enrollment Rejected)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ enroll: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "rejected enrollment",
//     1,
//   );
// });
// describe("Testing Get /notification (Course Update)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ updateCourse: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "course update",
//     2,
//   );
// });

// describe("Testing Get /notification (Lesson Creation)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ createLesson: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "lesson creation",
//     2,
//   );
// });
// describe("Testing Get /notification (Lesson Deletion)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ deleteLesson: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "lesson deletion",
//     3,
//   );
// });

// describe("Testing Get /notification (Lesson Update)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ updateLesson: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "lesson update",
//     3,
//   );
// });

// describe("Testing Get /notification (Assignment Creation)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ createAssignment: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "assignment creation",
//     2,
//   );
// });

// describe("Testing Get /notification (Assignment Deletion)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ deleteAssignment: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "assignment deletion",
//     3,
//   );
// });

// describe("Testing Get /notification (Assignment Update)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ updateAssignment: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "assignment update",
//     3,
//   );
// });

// describe("Testing Get /notification (Quiz Creation)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ createQuiz: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "quiz creation",
//     2,
//   );
// });

// describe("Testing Get /notification (Quiz Deletion)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ deleteQuiz: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "quiz deletion",
//     3,
//   );
// });

// describe("Testing Get /notification (Quiz Update)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ updateQuiz: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "quiz update",
//     3,
//   );
// });

// describe("Testing Get /notification (Course Media File Creation)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ createCourseMediaFile: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "course media file creation",
//     2,
//   );
// });

// describe("Testing Get /notification (Course Media File Deletion)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ deleteCourseMediaFile: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "course media file deletion",
//     3,
//   );
// });

// describe("Testing Get /notification (Assignment Media File Creation)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ createAssignmentMediaFile: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "assignment media file creation",
//     3,
//   );
// });

// describe("Testing Get /notification (Assignment Media File Deletion)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ deleteAssignmentMediaFile: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "assignment media file deletion",
//     4,
//   );
// });

// describe("Testing Get /notification (Assignment Submission Grade)", () => {
//   let instructorToken, studentToken, instructorId, studentId;
//   beforeAll(async () => {
//     const result = await initialize({ gradeSubmission: true });
//     instructorToken = result.instructorToken;
//     studentToken = result.studentToken;
//     instructorId = result.instructorId;
//     studentId = result.studentId;
//   });
//   TestNotification(
//     "student",
//     () => studentToken,
//     () => `${studentId}`,
//     () => {
//       return { user_id: `${studentId}` };
//     },
//     "assignment submission grade",
//     3,
//   );
// });
