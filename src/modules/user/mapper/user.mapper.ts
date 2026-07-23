// src/infra/database/mapper/user.mapper.ts
import { users } from "src/infra/database/schema/user.schema";
import { User } from "../entities/user.entity";
import { UserStatus } from "src/common/enums/user/user-status.enum";

type SchemaUser = typeof users.$inferSelect;

export class UserMapper {
    
    static toDomain(raw: SchemaUser): User {
        
        const user = new User();

        user.id = raw.id;
        user.version = raw.version;
        user.createdAt = raw.createdAt;
        user.updatedAt = raw.updatedAt;
        user.deletedAt = raw.deletedAt;

        user.name = raw.name;
        user.fullName = raw.fullName;
        user.email = raw.email;
        user.passwordHash = raw.passwordHash;
        user.emailVerified = raw.emailVerified;
        user.status = raw.status as UserStatus; 
        user.lastLoginAt = raw.lastLoginAt;

        return user;
    }

    static toPersistence(user: User) {
        return {
            id: user.id,
            name: user.name,
            fullName: user.fullName,
            email: user.email,
            passwordHash: user.passwordHash,
            emailVerified: user.emailVerified,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            version: user.version,
        };
    }
}