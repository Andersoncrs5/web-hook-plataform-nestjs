import { Test, TestingModule } from '@nestjs/testing';
import { FindRoleByIds } from './find-role-by-ids.use-case.service';
import { IRoleRepository } from '../../repository/iroles.repository';
import { Role } from '../../entities/role.entity';

describe('FindRoleByIds  ( UnitTest )', () => {
    let service: FindRoleByIds;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockIRoleRepository = {
        findByIds: jest.fn(),
    };

    const validUuid1 = '123e4567-e89b-12d3-a456-426614174000';
    const validUuid2 = '987fc532-e89b-12d3-a456-426614174000';

    const mockRoles: Role[] = [
        {
            id: validUuid1,
            name: 'admin',
            description: null,
            isActive: true,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null
        },
        {
            id: validUuid2,
            name: 'user',
            description: null,
            isActive: true,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindRoleByIds,
                {
                    provide: IRoleRepository,
                    useValue: mockIRoleRepository,
                },
            ],
        }).compile();

        service = module.get<FindRoleByIds>(FindRoleByIds);
        roleRepository = module.get(IRoleRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(roleRepository).toBeDefined();
    });

    describe('execute', () => {
        it('should return roles when valid array of UUIDs is provided (Happy Path)', async () => {
            roleRepository.findByIds.mockResolvedValue(mockRoles);

            const result = await service.execute([validUuid1, validUuid2]);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(mockRoles);

            expect(roleRepository.findByIds).toHaveBeenCalledTimes(1);
            expect(roleRepository.findByIds).toHaveBeenCalledWith([validUuid1, validUuid2], 50);
        });

        it('should respect custom limit parameter when provided', async () => {
            roleRepository.findByIds.mockResolvedValue(mockRoles);

            const result = await service.execute([validUuid1], 10);

            expect(result.isSuccess).toBe(true);
            expect(roleRepository.findByIds).toHaveBeenCalledWith([validUuid1], 10);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it.each([
                ['empty array', []],
                ['null', null as any],
                ['undefined', undefined as any],
                ['non-array', 'not-an-array' as any],
            ])('should return bad request when ids is %s', async (_, invalidInput) => {
                const result = await service.execute(invalidInput);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Ids is empty');

                expect(roleRepository.findByIds).not.toHaveBeenCalled();
            });

            it('should return bad request when any id in array is not a valid UUID', async () => {
                const result = await service.execute([validUuid1, 'invalid-uuid']);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('All ids should be valid UUIDs');

                expect(roleRepository.findByIds).not.toHaveBeenCalled();
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository fails', async () => {
                const dbError = new Error('Database connection failure');
                roleRepository.findByIds.mockRejectedValue(dbError);

                await expect(service.execute([validUuid1])).rejects.toThrow('Database connection failure');

                expect(roleRepository.findByIds).toHaveBeenCalledTimes(1);
                expect(roleRepository.findByIds).toHaveBeenCalledWith([validUuid1], 50);
            });
        });
    });
});