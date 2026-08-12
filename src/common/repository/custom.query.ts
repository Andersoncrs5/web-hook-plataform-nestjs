import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export function eqIgnoreCase(
    column: AnyPgColumn,
    value: string,
): SQL {
    return sql`lower(${column}) = lower(${value})`;
}