import { Test, TestingModule } from '@nestjs/testing';
import { ExistsOrganizationBySlugUseCase } from './exists-organization-by-slug.use-case.service';
import { IOrganizationRepository } from '../../repository/iorganization.repository';

describe('ExistsOrganizationBySlugUseCase ( UnitTest )', () => {
    let service: ExistsOrganizationBySlugUseCase;
    let repository: jest.Mocked<IOrganizationRepository>;

    const mockIOrganizationRepository = {
        existsBySlug: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExistsOrganizationBySlugUseCase,
                {
                    provide: IOrganizationRepository,
                    useValue: mockIOrganizationRepository,
                },
            ],
        }).compile();

        service = module.get<ExistsOrganizationBySlugUseCase>(ExistsOrganizationBySlugUseCase);
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
        it('should return bad request when slug is empty', async () => {
            const result = await service.execute('');

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Slug cannot be empty');
            expect(repository.existsBySlug).not.toHaveBeenCalled();
        });

        it('should return true when organization slug exists', async () => {
            repository.existsBySlug.mockResolvedValue(true);

            const result = await service.execute('acme-corp');

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(true);
            expect(repository.existsBySlug).toHaveBeenCalledWith('acme-corp');
        });

        it('should return false when organization slug does not exist', async () => {
            repository.existsBySlug.mockResolvedValue(false);

            const result = await service.execute('non-existent-slug');

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(false);
            expect(repository.existsBySlug).toHaveBeenCalledWith('non-existent-slug');
        });
    });
});