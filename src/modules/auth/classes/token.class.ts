import { UserDto } from "src/modules/user/dto/user.dto";

export class Tokens {
    token: string;
    tokenExp: Date
    refreshToken: string;
    refreshTokenExp: Date

    user: UserDto
    roles: string[]
}