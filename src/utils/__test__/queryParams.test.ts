import qs from 'qs';

import {canonicalizeSingleValueQueryParams} from '../queryParams';

describe('canonicalizeSingleValueQueryParams', () => {
    test.each([
        ['clusterName=stale&clusterName=global', 'clusterName', 'global'],
        ['schema%5B0%5D=%2Fdb%2Fstale&schema%5B1%5D=%2Fdb%2Ftable', 'schema', '/db/table'],
        ['tenantPage=query&tenantPage%5B21%5D=diagnostics', 'tenantPage', 'diagnostics'],
        ['database%5B0%5D=stale&database%5B21%5D=db', 'database', 'db'],
    ])('selects the last string from %s', (search, key, expected) => {
        const result = canonicalizeSingleValueQueryParams(qs.parse(search));

        expect(result[key]).toBe(expected);
    });

    test('selects the last string from nested structured values', () => {
        const result = canonicalizeSingleValueQueryParams({
            database: {first: ['stale'], second: {nested: 'db'}},
        });

        expect(result.database).toBe('db');
    });

    test('removes an allowlisted structured value with no string leaf', () => {
        expect(
            canonicalizeSingleValueQueryParams({database: [{nested: 42}, null]}),
        ).not.toHaveProperty('database');
    });

    test('preserves direct scalar values', () => {
        const query = {sort: false, selectedOffset: 0, backend: ''};

        expect(canonicalizeSingleValueQueryParams(query)).toBe(query);
        expect(query).toEqual({sort: false, selectedOffset: 0, backend: ''});
    });

    test('does not normalize an unknown multi-value parameter', () => {
        const query = {tag: ['one', 'two']};

        expect(canonicalizeSingleValueQueryParams(query)).toBe(query);
        expect(query.tag).toEqual(['one', 'two']);
    });

    test('does not mutate the input when a known value is normalized', () => {
        const query = qs.parse('database=stale&database=db');
        const result = canonicalizeSingleValueQueryParams(query);

        expect(result).not.toBe(query);
        expect(query.database).toEqual(['stale', 'db']);
        expect(result.database).toBe('db');
    });
});
