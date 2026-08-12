import { Test, TestingModule } from "@nestjs/testing";
import * as argon2 from "argon2";

import { PasswordService } from "./password.service";

describe("PasswordService", () => {
    let service: PasswordService;

    beforeEach(async () => {
        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    PasswordService,
                ],
            }).compile();

        service = module.get(PasswordService);
    });

    describe("hash", () => {
        it("should hash a password", async () => {
            const password = "12345678";

            const hash =
                await service.hash(password);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe("string");
            expect(hash).not.toBe(password);
        });

        it("should generate a valid Argon2id hash", async () => {
            const password = "12345678";

            const hash =
                await service.hash(password);

            expect(hash).toMatch(
                /^\$argon2id\$v=\d+\$m=\d+,p=\d+,t=\d+\$.+\$.+$/,
            );
        });

        it("should generate a different hash for the same password", async () => {
            const password = "12345678";

            const hash1 =
                await service.hash(password);

            const hash2 =
                await service.hash(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe("verify", () => {
        it("should return true when password matches", async () => {
            const password = "12345678";

            const hash =
                await service.hash(password);

            const result =
                await service.verify(hash, password);

            expect(result).toBe(true);
        });

        it("should return false when password does not match", async () => {
            const password = "12345678";
            const wrongPassword = "87654321";

            const hash =
                await service.hash(password);

            const result =
                await service.verify(
                    hash,
                    wrongPassword,
                );

            expect(result).toBe(false);
        });

        it("should return false for an invalid hash", async () => {
            const result =
                await service.verify(
                    "invalid-hash",
                    "12345678",
                );

            expect(result).toBe(false);
        });
    });
});