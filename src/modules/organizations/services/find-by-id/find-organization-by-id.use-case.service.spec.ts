import { Test, TestingModule } from '@nestjs/testing';
import { FindOrganizationByIdUseCase } from './find-organization-by-id.use-case.service';
import { IOrganizationRepository } from '../../repository/iorganization.repository';
import { OrganizationEntity } from '../../entities/organization.entity';
import { OrganizationStatus } from 'src/common/enums/organization/organization-status.enum';

describe('FindOrganizationByIdUseCase ( UnitTest )', () => {
    let service: FindOrganizationByIdUseCase;
    let repository: jest.Mocked<IOrganizationRepository>;

    const mockIOrganizationRepository = {
        findById: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUuid = 'invalid-uuid-1234';

    const organizationMock: OrganizationEntity = {
        id: validUuid,
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: OrganizationStatus.ACTIVE,
        userId: 'user-uuid-1234-5678',
        metadata: { tier: 'pro' },
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindOrganizationByIdUseCase,
                {
                    provide: IOrganizationRepository,
                    useValue: mockIOrganizationRepository,
                },
            ],
        }).compile();

        service = module.get<FindOrganizationByIdUseCase>(FindOrganizationByIdUseCase);
        repository = module.get(IOrganizationRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
    });

    describe('execute', () => {
        it('should return bad request when id is not a valid UUID', async () => {
            const result = await service.execute(invalidUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Id should be a UUID');
            expect(repository.findById).not.toHaveBeenCalled();
        });

        it('should return not found when organization does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Organization not found');
            expect(repository.findById).toHaveBeenCalledTimes(1);
            expect(repository.findById).toHaveBeenCalledWith(validUuid);
        });

        it('should return organization when valid id is found (Happy Path)', async () => {
            repository.findById.mockResolvedValue(organizationMock);

            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(organizationMock);
            expect(repository.findById).toHaveBeenCalledTimes(1);
            expect(repository.findById).toHaveBeenCalledWith(validUuid);
        });
    });
});