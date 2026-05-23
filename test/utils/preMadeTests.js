const { app, request, duriationRequiredFields } = require("./testingUtils");
const invalidBodyScenarios = [
  { name: "missing", values: [undefined] },
  { name: "empty", values: [""] },
  { name: "invalid", values: ["adad", "{}"] },
];

const invalidObjectCreationScenarios = ["missing", "empty", "invalid"];
const invalidObjectUpdateScenarios = ["empty", "invalid"];

const invalidAuthenticationScenarios = [
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

async function testInvalidBodyRequest(url, roles, SetRequestType) {
  roles.forEach((role) => {
    invalidBodyScenarios.forEach((scenarios) => {
      const values = scenarios.values;
      values.forEach((value) => {
        it(`Should return 400 if request body is ${scenarios.name} (${value}) (${role.name})`, async () => {
          let req = request(app);
          req = SetRequestType(req, url());
          const response = await req
            .set("Authorization", `Bearer ${role.token()}`)
            .send(value);
          expect(response.status).toBe(400);
          expect(response.body.errors[0]).toHaveProperty("message");
        });
      });
    });
  });
}

async function testInvalidObjectCreationRequest(
  url,
  roles,
  requiredFields,
  fieldInvalids,
  commonInvalids,
  createObject,
  setRequestType = (req, url) => req.post(url),
) {
  roles.forEach((role) => {
    requiredFields.forEach((field) => {
      invalidObjectCreationScenarios.forEach((scenario) => {
        let values = [];

        if (scenario === "missing") {
          values = [undefined];
        } else if (scenario === "empty") {
          values = [""];
        } else if (scenario === "invalid") {
          values = fieldInvalids[field] || commonInvalids;
        }

        values.forEach((value) => {
          it(`should return 400 if ${field} is ${scenario}${
            scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
          }`, async () => {
            const object = createObject();

            if (scenario === "missing") delete object[field];
            else object[field] = value;
            let req = request(app);
            req = setRequestType(req, url());
            const response = await req
              .set("Authorization", `Bearer ${role.token()}`)
              .send(object);

            expect(response.status).toBe(400);
            // expect(response.body.errors[0]).toHaveProperty("property", field);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        });
      });
    });
  });
}
async function testInvalidObjectUpdateRequest(
  url,
  roles,
  updateFields,
  fieldInvalids,
  commonInvalids,
) {
  roles.forEach((role) => {
    updateFields.forEach((field) => {
      invalidObjectUpdateScenarios.forEach((scenario) => {
        let values = [];

        if (scenario === "empty") {
          values = [""];
        } else if (scenario === "invalid") {
          values = fieldInvalids[field] || commonInvalids;
        }

        values.forEach((value) => {
          it(`should return 400 if ${field} is ${scenario}${
            scenario === "invalid" ? ` (${JSON.stringify(value)})` : ""
          }`, async () => {
            const object = {};

            object[field] = value;

            const response = await request(app)
              .put(url())
              .set("Authorization", `Bearer ${role.token()}`)
              .send(object);

            expect(response.status).toBe(400);
            expect(response.body.errors[0]).toHaveProperty("message");
          });
        });
      });
    });
  });
}

async function testInvalidAuthenticationAndAuthorizationRequest(
  url,
  createObject,
  invalidAuthorizationScenarios,
  SetRequestType,
) {
  invalidAuthenticationScenarios.forEach((scenario) => {
    const object = createObject();
    if (scenario.name === "invalid") {
      scenario.values.forEach((value) => {
        it(`should return 401 if Authorization is invalid (${value})`, async () => {
          let req = request(app);
          req = SetRequestType(req, url());
          const response = await req.send(object).set("Authorization", value);

          expect(response.status).toBe(401);
          expect(response.body.errors[0]).toHaveProperty("message");
        });
      });
    } else {
      it(`should return 401 if Authorization is ${scenario.name}`, async () => {
        let req = request(app);
        req = SetRequestType(req, url());
        req = scenario.setHeader(req);
        const response = await req.send(object);

        expect(response.status).toBe(401);
        expect(response.body.errors[0]).toHaveProperty("message");
      });
    }
  });
  invalidAuthorizationScenarios.forEach((scenario) => {
    const object = createObject();

    it(`should return 401 if Authorization is unauthorized as (${scenario.name})`, async () => {
      let req = request(app);
      req = SetRequestType(req, url());
      const response = await req
        .send(object)
        .set("Authorization", `Bearer ${scenario.token()}`);

      expect(response.status).toBe(401);
      expect(response.body.errors[0]).toHaveProperty("message");
    });
  });
}
async function testNotFoundObjectRequest(
  url,
  roles,
  createObject,
  SetRequestType,
) {
  const object = createObject();
  roles.forEach((role) => {
    it(`should return 404 if the object is not found (${role.name})`, async () => {
      let req = request(app);
      req = SetRequestType(req, url());
      const response = await req
        .send(object)
        .set("Authorization", `Bearer ${role.token()}`);

      expect(response.status).toBe(404);
      expect(response.body.errors[0]).toHaveProperty("message");
    });
  });
}
async function testInvalidObjectIDFormatRequest(
  url,
  roles,
  createObject,
  SetRequestType,
) {
  const object = createObject();
  roles.forEach((role) => {
    it(`should return 400 if the object id is invalid id (${role.name})`, async () => {
      let req = request(app);
      req = SetRequestType(req, url());
      const response = await req
        .send(object)
        .set("Authorization", `Bearer ${role.token()}`);

      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty("message");
    });
  });
}
async function testUpdateOneFieldInObjectRequest(
  url,
  roles,
  createObject,
  updateFields,
) {
  roles.forEach((role) => {
    const object = createObject();

    updateFields.forEach((updateField) => {
      it(`should allow ${role.name} to update only ${updateField} field`, async () => {
        const res = await request(app)
          .put(url())
          .set("Authorization", `Bearer ${role.token()}`)
          .send({ [`${updateField}`]: object[updateField] });
        console.log(res.body, object);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
      });
    });
  });
}
async function testUpdateManyFieldsInObjectRequest(url, roles, createObject) {
  roles.forEach((role) => {
    const object = createObject();
    it(`should allow ${role.name} to update many fields`, async () => {
      const res = await request(app)
        .put(url())
        .set("Authorization", `Bearer ${role.token()}`)
        .send(object);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
  });
}

async function testInvalidObjectDuriationRequest(
  url,
  roles,
  createObject,
  duriationFieldInvalids,
  setRequestType,
) {
  const object = createObject();
  const start_date = object.start_date;
  const end_date = object.end_date;
  roles.forEach((role) => {
    duriationRequiredFields.forEach((field) => {
      let values = duriationFieldInvalids[field];
      values.forEach((value) => {
        object["start_date"] = field == "start_date" ? value : start_date;
        object["end_date"] = field == "end_date" ? value : end_date;
        it(`should return 400 if duriation is invalid (${object["start_date"]}) ((${object["end_date"]})) (${role.name})`, async () => {
          let req = request(app);
          req = setRequestType(req, url());
          const response = await req
            .set("Authorization", `Bearer ${role.token()}`)
            .send(object);
          expect(response.status).toBe(400);
          expect(response.body.errors[0]).toHaveProperty("message");
        });
      });
    });
  });
}
module.exports = {
  testInvalidBodyRequest,
  testInvalidObjectCreationRequest,
  testInvalidObjectUpdateRequest,
  testInvalidAuthenticationAndAuthorizationRequest,
  testNotFoundObjectRequest,
  testInvalidObjectIDFormatRequest,
  testUpdateOneFieldInObjectRequest,
  testUpdateManyFieldsInObjectRequest,
  testInvalidObjectDuriationRequest,
};
