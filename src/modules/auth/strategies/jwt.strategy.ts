import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Payload } from '../classes/payload.class';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: configService.getOrThrow<boolean>('IGNORE_EXPIRATION'),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      issuer: configService.getOrThrow<string>('ISSUER'),
      audience: configService.getOrThrow<string>('AUDIENCE'),
    });
  }

  async validate(payload: Payload): Promise<Payload> {
    if (!payload.sub) {
      throw new UnauthorizedException('Token invalid');
    }

    return payload;
  }
}
