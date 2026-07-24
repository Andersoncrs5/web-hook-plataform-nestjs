import { UserDto } from "src/modules/user/dto/user.dto";
import { Tokens } from "../../classes/token.class";

export class LoginResponse {
    tokens: Tokens;
    user: UserDto;
    roles: string[];
}