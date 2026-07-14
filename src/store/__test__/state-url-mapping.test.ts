jest.mock('../reducers/heatmap', () => ({
    initialState: {sort: false, heatmap: false},
}));

jest.mock('../reducers/tenant/tenant', () => ({
    initialState: {metricsTab: undefined},
}));

import type {Location} from 'history';

import {restoreUnknownParams} from '../state-url-mapping';

const CORRUPTED_SEARCH =
    '?currentMetric=Old' +
    '&clusterName%5B0%5D=stale&clusterName%5B21%5D=global' +
    '&database%5B0%5D=stale&database%5B21%5D=db' +
    '&tenantPage=query&tenantPage%5B21%5D=diagnostics' +
    '&databasePage%5B0%5D=database&databasePage%5B21%5D=query' +
    '&schema%5B0%5D=%2Fdb%2Fstale&schema%5B21%5D=%2Fdb%2Ftable' +
    '&monitoringTab%5B0%5D=overview&monitoringTab%5B21%5D=diagnostics' +
    '&from%5B0%5D=1&from%5B21%5D=2' +
    '&to%5B0%5D=3&to%5B21%5D=4' +
    '&interval%5B0%5D=1h&interval%5B21%5D=1d' +
    '&utm_referrer%5B0%5D=https%3A%2F%2Fexample.test&' +
    'utm_referrer=https%3A%2F%2Fexample.test%2Fdatabase';

function createLocation(search: string): Location {
    return {pathname: '/database', search, hash: '', state: undefined};
}

function getSearchParams(search: string) {
    return new URLSearchParams(search);
}

function expectNoBracketKeys(search: string) {
    const hasBracketKey = Array.from(getSearchParams(search).keys()).some((key) =>
        key.includes('['),
    );

    expect(hasBracketKey).toBe(false);
}

describe('restoreUnknownParams', () => {
    test('canonicalizes corrupted single-value params across sequential transitions', () => {
        const first = restoreUnknownParams(
            createLocation('?currentMetric=RowUpdates'),
            createLocation(CORRUPTED_SEARCH),
        );
        const second = restoreUnknownParams(
            createLocation('?currentMetric=CPU'),
            createLocation(first.search),
        );
        const params = getSearchParams(second.search);

        expectNoBracketKeys(second.search);
        expect(params.getAll('clusterName')).toEqual(['global']);
        expect(params.getAll('database')).toEqual(['db']);
        expect(params.getAll('tenantPage')).toEqual(['diagnostics']);
        expect(params.getAll('databasePage')).toEqual(['query']);
        expect(params.getAll('schema')).toEqual(['/db/table']);
        expect(params.getAll('monitoringTab')).toEqual(['diagnostics']);
        expect(params.getAll('from')).toEqual(['2']);
        expect(params.getAll('to')).toEqual(['4']);
        expect(params.getAll('interval')).toEqual(['1d']);
        expect(params.getAll('currentMetric')).toEqual(['CPU']);
        expect(params.has('utm_referrer')).toBe(false);
    });

    test('does not add a dangling delimiter when all restored params are removed', () => {
        const result = restoreUnknownParams(
            createLocation('?currentMetric=RowUpdates'),
            createLocation('?currentMetric=Old&utm_referrer=volatile'),
        );

        expect(result.search).toBe('?currentMetric=RowUpdates');
    });

    test('keeps an unknown multi-value param in repeat format', () => {
        const result = restoreUnknownParams(
            createLocation('?currentMetric=RowUpdates'),
            createLocation('?currentMetric=Old&tag=one&tag=two'),
        );
        const params = getSearchParams(result.search);

        expect(params.getAll('tag')).toEqual(['one', 'two']);
        expectNoBracketKeys(result.search);
    });
});
