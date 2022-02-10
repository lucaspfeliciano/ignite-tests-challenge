import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid"


import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;

const generalUser = {
  name: "Lucas Feliciano",
  email: "lucasfeliciano@email.com",
  password: "123456"
}

describe("Get Statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: generalUser.name,
      email: generalUser.email,
      password: generalUser.password
    })
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: generalUser.email,
      password: generalUser.password,
    });

    const { token } = responseToken.body;

    const responseDeposit = await request(app)
    .post("/api/v1/statements/deposit")
    .send({
      amount: 100,
      description: "Deposito"
    }).set({
      Authorization: `Bearer ${token}`
    })

    const statement_id = responseDeposit.body.id

    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("id")
    expect(response.body.type).toEqual("deposit")
    expect(response.body.amount).toEqual("100.00")
  });

  it("should be not able to get statement from non-existing user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "usernonexistent@email.com",
      password: "usernonexistentpassword",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.message).toEqual('Incorrect email or password')
    expect(responseToken.body.token).toBe(undefined)
    const { token } = responseToken.body;

    const statement_id = uuidv4()
    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual('JWT invalid token!')
  });

  it("should be not able to get non-existing statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: generalUser.email,
      password: generalUser.password,
    });

    const { token } = responseToken.body;

    const statement_id = uuidv4()
    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(404)
    expect(response.body.message).toEqual('Statement not found')
  });
});
