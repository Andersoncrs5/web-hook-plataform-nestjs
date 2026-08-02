import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as argon2 from "argon2";

@Injectable()
export class PasswordService {

    async hash(password: string): Promise<string> {
        try {
            return await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: Number(process.env.ARGON_MEMORY) || 65536,
                timeCost: Number(process.env.ARGON_ITERATIONS) || 3,
                parallelism: Number(process.env.ARGON_PARALLELISM) || 1,
            });
        } catch (error) {
            throw new InternalServerErrorException('Error hashing password');
        }
    }

    async verify(hash: string, password: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, password);
        } catch (error) {
            return false;
        }
    }

}