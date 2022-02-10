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

describe("Get Balance", () => {
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

  it("should be able to get balance", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: generalUser.email,
      password: generalUser.password,
    });

    const { token } = responseToken.body;

    await request(app)
    .post("/api/v1/statements/deposit")
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: 100,
      description: "Deposito"
    })

    await request(app)
    .post("/api/v1/statements/withdraw")
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: 50,
      description: "Retirada"
    })

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`
    })


    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("balance")
    expect(response.body.balance).toEqual(50)
    expect(response.body.statement[0]).toHaveProperty("id")
    expect(response.body.statement[1]).toHaveProperty("id")
  });

  it("should not be able to get balance from non-existing user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "usernonexistent@email.com",
      password: "usernonexistentpassword",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.message).toEqual('Incorrect email or password')
    expect(responseToken.body.token).toBe(undefined)
    const { token } = responseToken.body;

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual('JWT invalid token!')
  });
});
