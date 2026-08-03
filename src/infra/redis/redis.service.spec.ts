import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { HttpStatus } from '@nestjs/common';
import { Result } from 'src/common/result/result';

interface Value {
  foo: string,
  bar: string
}

describe('RedisService', () => {
  let service: RedisService;

  const key: string = "25343434564576476452674564565"
  const value: Value = {
    foo: 'bar',
    bar: 'baz',
  }

  const valueStr: string = JSON.stringify(value);

  const redisMock = {
    ping: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    increment: jest.fn(),
    clear: jest.fn(),
    flushdb: jest.fn(),
    incr: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS',
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('METHOD set', () => {
    it('should set value', async () => {
      redisMock.set.mockResolvedValue("OK");

      const result = await service.set(key, value);

      expect(result.value).toEqual(true)
      expect(result.isSuccess).toBe(true);
      expect(result.status).toEqual(HttpStatus.OK);

      expect(redisMock.set).toHaveBeenCalledWith(key, valueStr);
      expect(redisMock.set).toHaveBeenCalledTimes(1);
    })
    it('should set value with ttl', async () => {
      redisMock.set.mockResolvedValue("OK");

      const result = await service.set(key, value, 12);

      expect(result.value).toEqual(true)
      expect(result.isSuccess).toBe(true);
      expect(result.status).toEqual(HttpStatus.OK);

      expect(redisMock.set).toHaveBeenCalledWith(key, valueStr, "EX", 12);
      expect(redisMock.set).toHaveBeenCalledTimes(1);
    })
  })

  describe('METHOD get', () => {
    it('should get value', async () => {
      redisMock.get.mockResolvedValue(valueStr);

      const result = await service.get<Value>(key);

      expect(result.value.bar).toEqual(value.bar)
      expect(result.value.foo).toEqual(value.foo);

      expect(result.isSuccess).toBe(true);
      expect(result.status).toEqual(HttpStatus.OK);

      expect(redisMock.get).toHaveBeenCalledWith(key);
      expect(redisMock.get).toHaveBeenCalledTimes(1);
    })
    it('should get value and return not found', async () => {
      redisMock.get.mockResolvedValue(null);

      const result: Result<Value> = await service.get<Value>(key);

      expect(result.isFailure).toBe(true);
      expect(result.value).toBeNull();
      expect(result.status).toBe(HttpStatus.NOT_FOUND);

      expect(redisMock.get).toHaveBeenCalledWith(key);
    });
  })

  describe('METHOD delete', () => {
    it('should delete value', async () => {
      redisMock.del.mockResolvedValue(1);

      const result = await service.delete(key);

      expect(result.value).toBeNull();
      expect(result.isSuccess).toBe(true);
      expect(result.status).toBe(HttpStatus.OK);
      expect(redisMock.del).toHaveBeenCalledWith(key);
    })

    it('should return notFound', async () => {
      redisMock.del.mockResolvedValue(0);

      const result: Result<null> = await service.delete(key);

      expect(result.value).toBeNull();
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.isFailure).toBe(true);

      expect(redisMock.del).toHaveBeenCalledWith(key);
      expect(redisMock.del).toHaveBeenCalledTimes(1);

    });
  })

  describe('METHOD exists', () => {
    it('should exists value', async () => {
      redisMock.exists.mockResolvedValue(true);

      const result: Result<null> = await service.exists(key);

      expect(result.value).toBeNull();
      expect(result.isSuccess).toBe(true);
      expect(result.status).toBe(HttpStatus.OK);

      expect(redisMock.exists).toHaveBeenCalledWith(key);
    })

    it('should exists return false', async () => {
      redisMock.exists.mockResolvedValue(false);

      const result: Result<null> = await service.exists(key);

      expect(result.value).toBeNull();
      expect(result.isSuccess).toBe(false);
      expect(result.status).toBe(HttpStatus.NOT_FOUND);

      expect(redisMock.exists).toHaveBeenCalledWith(key);
    })

  })

  describe('METHOD ttl', () => {
    it('should return ttl value', async () => {
      redisMock.ttl.mockResolvedValue(120);

      const result: Result<number> = await service.ttl(key);

      expect(result.value).toBe(120);
      expect(result.isSuccess).toBe(true);
      expect(result.status).toBe(HttpStatus.OK);

      expect(redisMock.ttl).toHaveBeenCalledWith(key);
      expect(redisMock.ttl).toHaveBeenCalledTimes(1);
    });
  });

  describe('METHOD increment', () => {
    it('should increment value', async () => {
      redisMock.incr.mockResolvedValue(5);

      const result: Result<number> = await service.increment(key);

      expect(result.value).toBe(5);
      expect(result.isSuccess).toBe(true);
      expect(result.status).toBe(HttpStatus.OK);

      expect(redisMock.incr).toHaveBeenCalledWith(key);
      expect(redisMock.incr).toHaveBeenCalledTimes(1);
    });
  });

  describe('METHOD clear', () => {
    it('should clear database', async () => {
      redisMock.flushdb.mockResolvedValue('OK');

      const result: Result<null> = await service.clear();

      expect(result.value).toBeNull();
      expect(result.isSuccess).toBe(true);
      expect(result.status).toBe(HttpStatus.OK);

      expect(redisMock.flushdb).toHaveBeenCalledTimes(1);
    });
  });

  describe('LIFECYCLE', () => {
    it('should call ping on module init', async () => {
      redisMock.ping.mockResolvedValue('PONG');

      await service.onModuleInit();

      expect(redisMock.ping).toHaveBeenCalledTimes(1);
    });

    it('should call quit on module destroy', async () => {
      redisMock.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(redisMock.quit).toHaveBeenCalledTimes(1);
    });
  });

});