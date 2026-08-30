import { Test, TestingModule } from '@nestjs/testing';
import { ExistsOrganizationByNameUseCase } from './exists-organization-by-name.use-case.service';
import { IOrganizationRepository } from '../../repository/iorganization.repository';

describe('ExistsOrganizationByNameUseCase ( UnitTest )', () => {
    let service: ExistsOrganizationByNameUseCase;
    let repository: jest.Mocked<IOrganizationRepository>;

    const mockIOrganizationRepository = {
        existsByName: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExistsOrganizationByNameUseCase,
                {
                    provide: IOrganizationRepository,
                    useValue: mockIOrganizationRepository,
                },
            ],
        }).compile();

        service = module.get<ExistsOrganizationByNameUseCase>(ExistsOrganizationByNameUseCase);
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
        it('should return bad request when name is empty', async () => {
            const result = await service.execute('   ');

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Name cannot be empty');
            expect(repository.existsByName).not.toHaveBeenCalled();
        });

        it('should return true when organization name exists', async () => {
            repository.existsByName.mockResolvedValue(true);

            const result = await service.execute('Acme Corp');

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(true);
            expect(repository.existsByName).toHaveBeenCalledWith('Acme Corp');
        });

        it('should return false when organization name does not exist', async () => {
            repository.existsByName.mockResolvedValue(false);

            const result = await service.execute('Non Existent Corp');

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(false);
            expect(repository.existsByName).toHaveBeenCalledWith('Non Existent Corp');
        });
    });
});