import { Test, TestingModule } from '@nestjs/testing';
import { FindAllOrganizationUseCase } from './find-all-organization.use-case.service';
import { IOrganizationRepository } from '../../repository/iorganization.repository';
import { OrganizationFilter } from '../../dto/page/organization-filter.dto';
import { OrganizationSort } from '../../dto/page/organization-sort.dto';
import { Page, Pageable, SortDirection } from 'src/common/page/page';
import { OrganizationEntity } from '../../entities/organization.entity';
import { OrganizationStatus } from 'src/common/enums/organization/organization-status.enum';

describe('FindAllOrganizationUseCase ( UnitTest )', () => {
    let service: FindAllOrganizationUseCase;
    let repository: jest.Mocked<IOrganizationRepository>;

    const mockIOrganizationRepository = {
        findAll: jest.fn(),
    };

    const filterMock: OrganizationFilter = {
        name: 'Acme',
        status: [OrganizationStatus.ACTIVE],
    };

    const pageableMock: Pageable<OrganizationSort> = {
        page: 1,
        size: 10,
        sortBy: OrganizationSort.CREATED_AT,
        direction: SortDirection.DESC,
    };

    const organizationMock: OrganizationEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
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

    const pageMock = new Page<OrganizationEntity>([organizationMock], 1, 10, 1);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindAllOrganizationUseCase,
                {
                    provide: IOrganizationRepository,
                    useValue: mockIOrganizationRepository,
                },
            ],
        }).compile();

        service = module.get<FindAllOrganizationUseCase>(FindAllOrganizationUseCase);
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
        it('should return a paginated result when filter and pageable are provided (Happy Path)', async () => {
            repository.findAll.mockResolvedValue(pageMock);

            const result = await service.execute(filterMock, pageableMock);

            expect(result).toBeDefined();
            expect(result).toEqual(pageMock);
            expect(result.content.length).toBe(1);
            expect(result.totalElements).toBe(1);
            expect(result.totalPages).toBe(1);

            expect(repository.findAll).toHaveBeenCalledTimes(1);
            expect(repository.findAll).toHaveBeenCalledWith(filterMock, pageableMock);
        });

        it('should handle empty page result when no records match filter', async () => {
            const emptyPageMock = new Page<OrganizationEntity>([], 1, 10, 0);
            repository.findAll.mockResolvedValue(emptyPageMock);

            const result = await service.execute(filterMock, pageableMock);

            expect(result).toBeDefined();
            expect(result.content).toEqual([]);
            expect(result.totalElements).toBe(0);
            expect(result.totalPages).toBe(0);

            expect(repository.findAll).toHaveBeenCalledTimes(1);
            expect(repository.findAll).toHaveBeenCalledWith(filterMock, pageableMock);
        });

        it('should propagate repository errors if repository throws', async () => {
            const dbError = new Error('Database error');
            repository.findAll.mockRejectedValue(dbError);

            await expect(service.execute(filterMock, pageableMock)).rejects.toThrow('Database error');
            expect(repository.findAll).toHaveBeenCalledTimes(1);
        });
    });
});