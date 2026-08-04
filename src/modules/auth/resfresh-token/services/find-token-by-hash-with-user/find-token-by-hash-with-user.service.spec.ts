import { Test, TestingModule } from "@nestjs/testing";
import { RefreshTokenRepository } from "../../repository/refresh-token.repository";
import { RefreshTokenEntity } from "../../entities/refresh-token.entity";
import { RefreshTokenStatus } from "src/common/enums/refresh-token/refresh-token-status.enum";
import { User } from "src/modules/user/entities/user.entity";
import { FindRefreshTokenWithUserService } from "./find-token-by-hash-with-user.service";

describe("FindRefreshTokenWithUserService ( UnitTest )", () => {

    let service: FindRefreshTokenWithUserService;
    let repository: jest.Mocked<RefreshTokenRepository>;

    const mockRepository = {
        findByTokenHashWithUser: jest.fn(),
    };

    const fakeTokenHash = "some-token-hash-string";

    const fakeUser: User = {
        id: "user-uuid-5678",
        name: "John Doe",
        fullName: "Johnathan Doe",
        email: "johndoe@example.com",
        passwordHash: "fake-password-hash",
        emailVerified: true,
        status: "ACTIVE" as any,
        lastLoginAt: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const fakeRefreshToken: RefreshTokenEntity = {
        id: "token-uuid-1234",
        userId: fakeUser.id,
        tokenHash: fakeTokenHash,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        status: RefreshTokenStatus.ACTIVE,
        revokedAt: null,
        replacedByTokenId: null,
        version: 0,
        updatedAt: new Date(),
        deletedAt: null,
    };

    const fakeRefreshTokenWithUser = {
        refreshToken: fakeRefreshToken,
        user: fakeUser,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindRefreshTokenWithUserService,
                {
                    provide: RefreshTokenRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<FindRefreshTokenWithUserService>(
            FindRefreshTokenWithUserService,
        );

        repository = module.get(RefreshTokenRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and dependencies correctly mocked", () => {

        expect(service).toBeDefined();
        expect(repository).toBeDefined();

    });

    describe("execute", () => {

        it("should successfully return refresh token with user when found (Happy Path)", async () => {

            // Arrange
            repository.findByTokenHashWithUser.mockResolvedValue(
                fakeRefreshTokenWithUser,
            );

            // Act
            const result =
                await service.execute(fakeTokenHash);

            // Assert
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);

            expect(result.value).toEqual(
                fakeRefreshTokenWithUser,
            );

            expect(result.value?.refreshToken).toEqual(
                fakeRefreshToken,
            );

            expect(result.value?.user).toEqual(
                fakeUser,
            );

            // Verify
            expect(
                repository.findByTokenHashWithUser,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findByTokenHashWithUser,
            ).toHaveBeenCalledWith(fakeTokenHash);

        });

        it("should return not found when refresh token does not exist (Sad Path)", async () => {

            // Arrange
            repository.findByTokenHashWithUser.mockResolvedValue(
                null,
            );

            // Act
            const result =
                await service.execute(fakeTokenHash);

            // Assert
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);

            expect(result.errors[0]).toBe(
                "Refresh token not found.",
            );

            // Verify
            expect(
                repository.findByTokenHashWithUser,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findByTokenHashWithUser,
            ).toHaveBeenCalledWith(fakeTokenHash);

        });

        it("should propagate repository error", async () => {

            // Arrange
            const repositoryError =
                new Error("Database connection failed");

            repository.findByTokenHashWithUser.mockRejectedValue(
                repositoryError,
            );

            // Act & Assert
            await expect(
                service.execute(fakeTokenHash),
            ).rejects.toThrow(
                "Database connection failed",
            );

            // Verify
            expect(
                repository.findByTokenHashWithUser,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findByTokenHashWithUser,
            ).toHaveBeenCalledWith(fakeTokenHash);

        });

    });

});

