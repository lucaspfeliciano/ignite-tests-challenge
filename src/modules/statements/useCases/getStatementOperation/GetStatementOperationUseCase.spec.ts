import { OperationType } from "../../../statements/entities/Statement";
import { InMemoryStatementsRepository } from "../../../statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";


let createUserUseCase: CreateUserUseCase
let getStatementOperationUseCase: GetStatementOperationUseCase
let createStatementUseCase: CreateStatementUseCase
let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

describe("Get Balance", () => {
  beforeEach(() => {
    statementsRepositoryInMemory = new InMemoryStatementsRepository()
    usersRepositoryInMemory = new InMemoryUsersRepository()
    getStatementOperationUseCase = new GetStatementOperationUseCase(usersRepositoryInMemory, statementsRepositoryInMemory)
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory)
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
  })

  it("should be able to get statement", async () => {
    const user: ICreateUserDTO = {
      name: "Lucas Feliciano",
      email: "lucasfeliciano@email.com",
      password: "123456"
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

    const resultDeposit = await createStatementUseCase.execute(deposit)

    expect(resultDeposit).toHaveProperty("id")
    const statement_id = resultDeposit.id as string

    const resultStatement = await getStatementOperationUseCase.execute({
      user_id,
      statement_id
    })

    expect(resultStatement).toHaveProperty("id")
    expect(resultStatement.id).toEqual(statement_id)
    expect(resultStatement.user_id).toEqual(user_id)
    expect(resultStatement.type).toEqual(deposit.type)
    expect(resultStatement.amount).toEqual(deposit.amount)
  })

  it("should be not able to get statement from non-existing user", async () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: "non-existing-user",
        statement_id: "non-existing-statement"
      })
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
  })

  it("should be not able to get non-existing statement", async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: "Lucas Feliciano",
        email: "lucasfeliciano@email.com",
        password: "123456"
      };

      const userCreated = await createUserUseCase.execute(user);

      expect(userCreated).toHaveProperty("id");
      const user_id = userCreated.id as string
      const statement_id = "non-existing-statement"

      await getStatementOperationUseCase.execute({
        user_id,
        statement_id
      })

    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
  })
})
