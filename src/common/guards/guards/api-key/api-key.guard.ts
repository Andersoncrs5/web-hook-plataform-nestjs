import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidateApiKeyUseCase } from 'src/modules/api-key/services/validate-api-key/validate-api-key.use-case.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly validateApiKeyUseCase: ValidateApiKeyUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawApiKey = request.headers['x-api-key'] as string;

    if (!rawApiKey) {
      throw new UnauthorizedException('API Key header is missing');
    }

    const result = await this.validateApiKeyUseCase.execute(rawApiKey);

    if (result.isFailure) {
      throw new UnauthorizedException(result.errors[0]);
    }

    request.apiKey = result.value;
    return true;
  }
}
