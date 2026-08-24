import {
    and,
    arrayContained,
    arrayContains,
    arrayOverlaps,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNotNull,
    isNull,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notIlike,
    notInArray,
    notLike,
    or,
    sql,
    type SQL,
} from "drizzle-orm";

import type { AnyColumn } from "drizzle-orm";

import type { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Case-insensitive equality.
 *
 * lower(column) = lower(value)
 */
export function eqIgnoreCase(
    column: AnyPgColumn,
    value: string,
): SQL {
    return sql`lower(${column}) = lower(${value})`;
}

/**
 * Case-insensitive LIKE.
 *
 * lower(column) LIKE lower(value)
 */
export function likeIgnoreCase(
    column: AnyPgColumn,
    value: string,
): SQL {
    return sql`lower(${column}) LIKE lower(${value})`;
}

/**
 * Case-insensitive partial match.
 *
 * Equivalent to:
 * column ILIKE '%value%'
 */
export function containsIgnoreCase(
    column: AnyPgColumn,
    value: string,
): SQL {
    return sql`lower(${column}) LIKE lower(${'%' + value + '%'})`;
}

/**
 * Case-insensitive prefix match.
 *
 * Equivalent to:
 * column ILIKE 'value%'
 */
export function startsWithIgnoreCase(
    column: AnyPgColumn,
    value: string,
): SQL {
    return sql`lower(${column}) LIKE lower(${value + '%'})`;
}

/**
 * Case-insensitive suffix match.
 *
 * Equivalent to:
 * column ILIKE '%value'
 */
export function endsWithIgnoreCase(
    column: AnyPgColumn,
    value: string,
): SQL {
    return sql`lower(${column}) LIKE lower(${'%' + value})`;
}

/**
 * Checks whether the column contains any value from the provided list,
 * ignoring case.
 *
 * Example:
 * containsAnyIgnoreCase(users.email, ["gmail", "hotmail"])
 */
export function containsAnyIgnoreCase(
    column: AnyPgColumn,
    values: string[],
): SQL {
    if (values.length === 0) {
        return sql`false`;
    }

    return sql`lower(${column}) LIKE ANY (
        ARRAY[${sql.join(
            values.map(
                (value) => sql`lower(${`%${value}%`})`,
            ),
            sql`, `,
        )}]
    )`;
}

// =========================================================
// NOT EQUAL IGNORING CASE
// =========================================================

export function neIgnoreCase(
    column: AnyColumn,
    value: string,
): SQL {
    return sql`lower(${column}) <> lower(${value})`;
}


// =========================================================
// EXACT TEXT
// =========================================================

export function contains(
    column: AnyColumn,
    value: string,
): SQL {
    return sql`${column} LIKE ${`%${value}%`}`;
}


// =========================================================
// STARTS WITH
// =========================================================

export function startsWith(
    column: AnyColumn,
    value: string,
): SQL {
    return sql`${column} LIKE ${`${value}%`}`;
}


// =========================================================
// ENDS WITH
// =========================================================

export function endsWith(
    column: AnyColumn,
    value: string,
): SQL {
    return sql`${column} LIKE ${`%${value}`}`;
}


// =========================================================
// BETWEEN OPTIONAL
// =========================================================

export function betweenOptional<T>(
    column: AnyColumn,
    min?: T | null,
    max?: T | null,
): SQL | undefined {
    if (min != null && max != null) {
        return between(column, min, max);
    }

    if (min != null) {
        return gte(column, min);
    }

    if (max != null) {
        return lte(column, max);
    }

    return undefined;
}


// =========================================================
// IS NULL OR EQUAL
// =========================================================

export function isNullOrEqual(
    column: AnyColumn,
    value: unknown,
): SQL {
    return or(
        isNull(column),
        eq(column, value),
    )!;
}


// =========================================================
// IS NOT NULL OR NOT EQUAL
// =========================================================

export function isNullOrNotEqual(
    column: AnyColumn,
    value: unknown,
): SQL {
    return or(
        isNotNull(column),
        ne(column, value),
    )!;
}


// =========================================================
// GREATER THAN OPTIONAL
// =========================================================

export function gtOptional(
    column: AnyColumn,
    value?: unknown | null,
): SQL | undefined {
    return value != null
        ? gt(column, value)
        : undefined;
}


// =========================================================
// GREATER THAN OR EQUAL OPTIONAL
// =========================================================

export function gteOptional(
    column: AnyColumn,
    value?: unknown | null,
): SQL | undefined {
    return value != null
        ? gte(column, value)
        : undefined;
}


// =========================================================
// LESS THAN OPTIONAL
// =========================================================

export function ltOptional(
    column: AnyColumn,
    value?: unknown | null,
): SQL | undefined {
    return value != null
        ? lt(column, value)
        : undefined;
}


// =========================================================
// LESS THAN OR EQUAL OPTIONAL
// =========================================================

export function lteOptional(
    column: AnyColumn,
    value?: unknown | null,
): SQL | undefined {
    return value != null
        ? lte(column, value)
        : undefined;
}


// =========================================================
// IN OPTIONAL
// =========================================================

export function inArrayOptional<T>(
    column: AnyColumn,
    values?: T[] | null,
): SQL | undefined {
    if (!values?.length) {
        return undefined;
    }

    return inArray(column, values);
}


// =========================================================
// NOT IN OPTIONAL
// =========================================================

export function notInArrayOptional<T>(
    column: AnyColumn,
    values?: T[] | null,
): SQL | undefined {
    if (!values?.length) {
        return undefined;
    }

    return notInArray(column, values);
}


// =========================================================
// LIKE OPTIONAL
// =========================================================

export function likeOptional(
    column: AnyColumn,
    value?: string | null,
): SQL | undefined {
    if (!value?.trim()) {
        return undefined;
    }

    return sql`${column} LIKE ${`%${value}%`}`;
}


// =========================================================
// ILIKE OPTIONAL
// =========================================================

export function ilikeOptional(
    column: AnyColumn,
    value?: string | null,
): SQL | undefined {
    if (!value?.trim()) {
        return undefined;
    }

    return ilike(column, `%${value}%`);
}


// =========================================================
// IS NULL OPTIONAL
// =========================================================

export function isNullOptional(
    column: AnyColumn,
    enabled?: boolean,
): SQL | undefined {
    return enabled
        ? isNull(column)
        : undefined;
}


// =========================================================
// IS NOT NULL OPTIONAL
// =========================================================

export function isNotNullOptional(
    column: AnyColumn,
    enabled?: boolean,
): SQL | undefined {
    return enabled
        ? isNotNull(column)
        : undefined;
}


// =========================================================
// NOT
// =========================================================

export function notCondition(
    condition: SQL,
): SQL {
    return not(condition);
}


// =========================================================
// EXISTS
// =========================================================

export function existsCondition(
    query: any,
): SQL {
    return exists(query);
}


// =========================================================
// NOT EXISTS
// =========================================================

export function notExistsCondition(
    query: any,
): SQL {
    return notExists(query);
}


// =========================================================
// ARRAY CONTAINS
// =========================================================

export {
    arrayContains,
    arrayContained,
    arrayOverlaps,
};


// =========================================================
// COMBINATORS
// =========================================================

export {
    and,
    or,
};