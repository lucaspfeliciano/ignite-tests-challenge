import request from "supertest";
import { Connection } from "typeorm";


import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;

const generalUser = {
  name: "Lucas Feliciano",
  email: "lucasfeliciano@email.com",
  password: "123456"
}

describe("Create Statement", () => {
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

  it("should be able to deposit", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: generalUser.email,
      password: generalUser.password,
    });

    const { token } = responseToken.body;

    console.log(token);

    const response = await request(app)
    .post("/api/v1/statements/deposit")
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: 100,
      description: "Deposito"
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.type).toEqual("deposit")
    expect(response.body.amount).toBe(100)
  });

  it("should be able to withdraw", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: generalUser.email,
      password: generalUser.password,
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .post("/api/v1/statements/withdraw")
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: 100,
      description: "Retirada"
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.amount).toBe(100)
    expect(response.body.type).toEqual("withdraw")
  });

  it("should not be able to deposit/withdraw with non-existing user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "usernonexistent@email.com",
      password: "usernonexistentpassword",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.message).toEqual('Incorrect email or password')
    expect(responseToken.body.token).toBe(undefined)
    const { token } = responseToken.body;

    const response = await request(app)
    .post("/api/v1/statements/deposit")
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: 100,
      description: "Deposito"
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual('JWT invalid token!')
  });

  it("should not be able to withdraw without money", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: generalUser.email,
      password: generalUser.password,
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .post("/api/v1/statements/withdraw")
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: 100,
      description: "Retirada"
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toEqual('Insufficient funds')
  });
});
