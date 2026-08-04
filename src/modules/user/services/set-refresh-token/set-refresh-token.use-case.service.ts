import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../repository/iuser.repository";
import { User } from "../../entities/user.entity";

@Injectable()
export class SetRefreshToken {
    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(user: User, refreshToken: string | null = null) {
        
    }

}