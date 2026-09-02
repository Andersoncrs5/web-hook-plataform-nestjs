import { Param, ParseUUIDPipe, ParseUUIDPipeOptions } from '@nestjs/common';

export const UUIDParam = (property: string, options?: ParseUUIDPipeOptions) =>
  Param(property, new ParseUUIDPipe({ version: '4', ...options }));
