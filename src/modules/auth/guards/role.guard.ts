import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import {ROLES_KEY} from "../decorators/roles.decorator";
import { Payload } from '../classes/payload.class';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ],
        );

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        const user = request.user as Payload;

        if (!user) {
            throw new ForbiddenException();
        }

        const userRoles: string[] = user.roles

        const allowed = requiredRoles.some(role =>
            userRoles.includes(role),
        );

        if (!allowed) {
            throw new ForbiddenException(
                'You do not have permission',
            );
        }

        return true;
    }
}