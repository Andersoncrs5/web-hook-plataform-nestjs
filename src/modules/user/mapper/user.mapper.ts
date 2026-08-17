    import { users } from "src/infra/database/schema/user.schema";
    import { User } from "../entities/user.entity";
    import { UserStatus } from "src/common/enums/user/user-status.enum";
    import { UpdateUserDto } from "../dto/update-user.dto";
import { UserDto } from "../dto/user.dto";

    type SchemaUser = typeof users.$inferSelect;

    export class UserMapper {
        
        static merge(user: User, dto: UpdateUserDto): void {
            const updatableFields = Object.fromEntries(
                Object.entries(dto).filter(([_, value]) => value !== undefined)
            );

            delete updatableFields.password;

            Object.assign(user, updatableFields);
        }
        
        static toDomain(raw: SchemaUser): User {
            
            const user = new User();
            
            Object.assign(user, raw);
            
            user.status = raw.status as UserStatus; 

            return user;
        }

        static toPersistence(user: User) {
            const { id, name, fullName, email, passwordHash, emailVerified, status, lastLoginAt, version } = user;
            
            return {
                id,
                name,
                fullName,
                email,
                passwordHash,
                emailVerified,
                status,
                lastLoginAt,
                version,
            };
        }

        static toDto(user: User): UserDto {
            const dto: UserDto = { 
                ...user
            }

            return dto
        }

    }