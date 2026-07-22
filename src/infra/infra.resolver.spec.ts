import { Test, TestingModule } from '@nestjs/testing';
import { InfraResolver } from './infra.resolver';

describe('InfraResolver', () => {
  let resolver: InfraResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfraResolver],
    }).compile();

    resolver = module.get<InfraResolver>(InfraResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
