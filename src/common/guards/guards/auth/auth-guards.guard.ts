import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { Payload } from 'src/modules/auth/classes/payload.class';

@Injectable()
export class JwtGuard implements CanActivate {

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {

        const request =
            context.switchToHttp().getRequest<FastifyRequest>();

        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token not found');
        }

        try {

            const payload =
                await this.jwtService.verifyAsync<Payload>(
                    token,
                    {
                        secret: this.configService.getOrThrow<string>(
                            'JWT_SECRET',
                        ),
                    },
                );

            request['user'] = payload;

            return true;

        } catch {
            throw new UnauthorizedException(
                'Token invalid or expired',
            );
        }
    }

    private extractTokenFromHeader(
        request: FastifyRequest,
    ): string | undefined {

        const [type, token] =
            request.headers.authorization?.split(' ') ?? [];

        return type === 'Bearer'
            ? token
            : undefined;
    }
}