
import { ApiProperty } from '@nestjs/swagger';

export class Payload {
    @ApiProperty({
        description: 'Identificador único do usuário (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000'
    })
    sub: string;

    @ApiProperty({
        description: 'Nome de usuário único',
        example: 'darkness_dev'
    })
    name: string;

    @ApiProperty({
        description: 'Endereço de e-mail do usuário',
        example: 'dev@manga.com'
    })
    email: string;

    @ApiProperty({
        description: 'Lista de permissões/papéis do usuário',
        example: ['ADMIN', 'USER'],
        type: [String]
    })
    roles: string[];
}