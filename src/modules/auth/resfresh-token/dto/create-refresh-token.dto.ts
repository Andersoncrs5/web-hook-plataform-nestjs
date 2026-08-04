export class CreateRefreshTokenDTO {
    userId: string;
    expiresAt: Date;
    revokedAt?: Date | undefined;
}