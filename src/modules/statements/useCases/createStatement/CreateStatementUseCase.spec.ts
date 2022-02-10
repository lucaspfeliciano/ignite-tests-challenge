import { Statement } from './../../entities/Statement';
import { OperationType } from "../../../statements/entities/Statement";
import { InMemoryStatementsRepository } from "../../../statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";
import { CreateStatementError } from './CreateStatementError';

let createUserUseCase: CreateUserUseCase
let createStatementUseCase: CreateStatementUseCase
let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

describe("Create Statement", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    statementsRepositoryInMemory = new InMemoryStatementsRepository()
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory)
  })

  it("should be able to make deposit", async () => {
    const user: ICreateUserDTO = {
      email: "lucasfeliciano@email.com",
      password: "123456",
      name: "Lucas Feliciano",
    };

    const userCreated = await createUserUseCase.execute(user);

    expect(userCreated).toHaveProperty("id");
    const user_id = userCreated.id as string

    const deposit: ICreateStatementDTO = {
      user_id,
      type: "deposit" as OperationType,
      amount: 100,
      description: "Deposito",
    }

    const result = await createStatementUseCase.execute(deposit)

    expect(result).toHaveProperty("id")
    expect(result.user_id).toEqual(user_id)
    expect(result.type).toEqual(deposit.type)
    expect(result.amount).toEqual(deposit.amount)
  })

  it("should be able to make withdraw", async () => {
    const user: ICreateUserDTO = {
      email: "lucasfeliciano@email.com",
      password: "123456",
      name: "Lucas Feliciano",
    };

    const userCreated = await createUserUseCase.execute(user);

    expect(userCreated).toHaveProperty("id");
    const user_id = userCreated.id as string

    const deposit: ICreateStatementDTO = {
      user_id,
      type: "deposit" as OperationType,
      amount: 100,
      description: "Deposito",
    }

    await createStatementUseCase.execute(deposit)

    const withdraw: ICreateStatementDTO = {
      user_id,
      type: "withdraw" as OperationType,
      amount: 100,
      description: "Retirada",
    }

    const resultWithdraw = await createStatementUseCase.execute(withdraw)

    expect(resultWithdraw).toBeInstanceOf(Statement)
    expect(resultWithdraw).toHaveProperty("id")
    expect(resultWithdraw.amount).toEqual(withdraw.amount)
    expect(resultWithdraw.type).toEqual(withdraw.type)
    expect(resultWithdraw.user_id).toEqual(user_id)
  })

  it("should not be able to deposit/withdraw with non-existing user", async () => {
    expect(async () => {
      const user_id = "non-existing-user"
      const deposit: ICreateStatementDTO = {
        user_id,
        type: "deposit" as OperationType,
        amount: 100,
        description: "Deposito",
      }

      await createStatementUseCase.execute(deposit)
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })

  it("should not be able to withdraw without money", async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        email: "lucasfeliciano2@email.com",
        password: "123456",
        name: "Lucas Feliciano 2",
      };

      const userCreated = await createUserUseCase.execute(user);

      expect(userCreated).toHaveProperty("id");
      const user_id = userCreated.id as string

      const withdraw: ICreateStatementDTO = {
        user_id,
        type: "withdraw" as OperationType,
        amount: 100,
        description: "Retirada",
      }

      await createStatementUseCase.execute(withdraw)
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
  })
})
