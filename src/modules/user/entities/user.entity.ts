import { BaseEntity } from "src/common/base/entity/base.entity.base"
import { UserStatus } from "src/common/enums/user/user-status.enum";

// export type User = ;

export class User extends BaseEntity {

    name: string;
    fullName: string | null;
    email: string;
    passwordHash: string;
    emailVerified: boolean;
    status: UserStatus;
    lastLoginAt: Date | null;

    static create(props: {
        id: string;
        name: string;
        fullName: string | null;
        email: string;
        passwordHash: string;
    }): User {

        const user = new User();

        user.id = props.id;
        user.name = props.name;
        user.fullName = props.fullName;
        user.email = props.email;
        user.passwordHash = props.passwordHash;

        user.emailVerified = false;
        user.status = UserStatus.ACTIVE;
        user.lastLoginAt = null;

        return user;
    }
}