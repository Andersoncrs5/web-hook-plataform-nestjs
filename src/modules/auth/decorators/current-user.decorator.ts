import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Payload } from '../classes/payload.class';

export const CurrentUser = createParamDecorator(
  (
    data: keyof Payload | undefined,
    ctx: ExecutionContext,
  ): Payload | Payload[keyof Payload] | undefined => {
    let request: any;

    if (ctx.getType() === 'http') {
      request = ctx.switchToHttp().getRequest();
    } else if ((ctx.getType() as string) === 'graphql') {
      request = ctx.getArgs()[2]?.req;
    } else {
      request = ctx.switchToHttp().getRequest();
    }

    const user = request?.user as Payload | undefined;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
