import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { compare } from "bcryptjs";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let showUserProfileUseCase: ShowUserProfileUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase

describe("Show User's Profile", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(
      usersRepositoryInMemory
    );
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
  });

  it("should be able to list user's profile", async () => {
    const user = {
      name: "Lucas Feliciano",
      email:"lucasfeliciano@email.com",
      password: "123456",
    };

    const userCreated = await createUserUseCase.execute({
      name: user.name,
      email: user.email,
      password: user.password
    });

    expect(userCreated).toHaveProperty("id");
    const listUser = await showUserProfileUseCase.execute(userCreated.id as string)

    const passwordMatch = await compare(user.password, listUser.password);

    expect(listUser).toHaveProperty("id")
    expect(listUser.email).toEqual(user.email)
    expect(listUser.name).toEqual(user.name)
    expect(passwordMatch).toBe(true)
  });

  it("should not be able to list un-existing user's profile", async () => {
    expect(async () => {
      const user_id = "fake-id"
      await showUserProfileUseCase.execute(user_id)
    }).rejects.toBeInstanceOf(ShowUserProfileError)
  })
});
