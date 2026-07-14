const VOLATILE_QUERY_PARAMS = ['utm_referrer'] as const;

const SINGLE_VALUE_QUERY_PARAMS = [
    'backend',
    'clusterName',
    'database',
    'databasePage',
    'tenantPage',
    'schema',
    'name',
    'sort',
    'heatmap',
    'currentMetric',
    'queryTab',
    'diagnosticsTab',
    'summaryTab',
    'metricsTab',
    'shardsMode',
    'shardsDateFrom',
    'shardsDateTo',
    'topQueriesDateFrom',
    'topQueriesDateTo',
    'selectedConsumer',
    'monitoringTab',
    'from',
    'to',
    'interval',
    'showHealthcheck',
    'view',
    'issuesFilter',
    'showGrantAccess',
    'aclSubject',
    'queryMode',
    'timeFrame',
    'selectedRow',
    'selectedPartition',
    'selectedOffset',
    'startTimestamp',
    'topicDataFilter',
    'activeOffset',
] as const;

type VolatileQueryParam = (typeof VOLATILE_QUERY_PARAMS)[number];

function findLastStringValue(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value;
    }

    if (value === null || typeof value !== 'object') {
        return undefined;
    }

    const values = Array.isArray(value) ? value : Object.values(value);
    for (let index = values.length - 1; index >= 0; index--) {
        const result = findLastStringValue(values[index]);
        if (result !== undefined) {
            return result;
        }
    }

    return undefined;
}

export function canonicalizeSingleValueQueryParams<T extends Record<string, unknown>>(query: T): T {
    let result: Record<string, unknown> = query;

    SINGLE_VALUE_QUERY_PARAMS.forEach((param) => {
        const value = result[param];
        const isStructured = Array.isArray(value) || (value !== null && typeof value === 'object');

        if (!isStructured) {
            return;
        }

        if (result === query) {
            result = {...query};
        }

        const normalizedValue = findLastStringValue(value);
        if (normalizedValue === undefined) {
            delete result[param];
        } else {
            result[param] = normalizedValue;
        }
    });

    return result as T;
}

export function omitVolatileQueryParams<T extends Record<string, unknown>>(
    query: T,
): Omit<T, VolatileQueryParam> {
    let result = query;

    VOLATILE_QUERY_PARAMS.forEach((param) => {
        if (Object.prototype.hasOwnProperty.call(result, param)) {
            if (result === query) {
                result = {...query};
            }

            delete result[param];
        }
    });

    return result;
}
