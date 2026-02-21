import { describe, it, expect } from 'bun:test';
import { path } from '../src/index.js';

type AssertEqual<T, U> = [T] extends [U] ? ([U] extends [T] ? true : never) : never;
const typeEqual = <T, U>(_check: AssertEqual<T, U>) => {};

describe('path - build', () => {
  it('builds a path with one param', () => {
    const p = path('/users/:id');
    expect(p.build({ id: '42' })).toBe('/users/42');
  });

  it('builds a path with multiple params', () => {
    const p = path('/users/:id/posts/:postId');
    expect(p.build({ id: '1', postId: '2' })).toBe('/users/1/posts/2');
  });

  it('URL-encodes param values', () => {
    const p = path('/users/:name');
    expect(p.build({ name: 'hello world' })).toBe('/users/hello%20world');
  });

  it('stringifies numeric params', () => {
    const p = path('/users/:id');
    expect(p.build({ id: 42 })).toBe('/users/42');
  });

  it('works with no params', () => {
    const p = path('/health');
    expect(p.build()).toBe('/health');
  });

  it('throws on missing param', () => {
    const p = path('/users/:id');
    // @ts-expect-error - testing runtime guard
    expect(() => p.build({})).toThrow('Missing path param: id');
  });

  it('preserves template', () => {
    const p = path('/users/:id/posts/:postId');
    expect(p.template).toBe('/users/:id/posts/:postId');
  });
});

describe('path - match', () => {
  it('matches a single param', () => {
    const p = path('/users/:id');
    expect(p.match('/users/42')).toEqual({ id: '42' });
  });

  it('matches multiple params', () => {
    const p = path('/users/:id/posts/:postId');
    expect(p.match('/users/1/posts/2')).toEqual({ id: '1', postId: '2' });
  });

  it('decodes URL-encoded values', () => {
    const p = path('/users/:name');
    expect(p.match('/users/hello%20world')).toEqual({ name: 'hello world' });
  });

  it('returns null on no match', () => {
    const p = path('/users/:id');
    expect(p.match('/posts/1')).toBeNull();
  });

  it('returns null on partial match', () => {
    const p = path('/users/:id/posts/:postId');
    expect(p.match('/users/1')).toBeNull();
  });

  it('returns null on extra segments', () => {
    const p = path('/users/:id');
    expect(p.match('/users/1/extra')).toBeNull();
  });

  it('matches static paths', () => {
    const p = path('/health');
    expect(p.match('/health')).toEqual({});
  });

  it('returns null for wrong static path', () => {
    const p = path('/health');
    expect(p.match('/ready')).toBeNull();
  });
});

describe('path - type inference', () => {
  it('infers param names from template', () => {
    const p = path('/users/:id/posts/:postId');
    type Params = Parameters<typeof p.build>[0];
    typeEqual<Params, { id: string | number | boolean; postId: string | number | boolean }>(true);
    expect(true).toBe(true);
  });

  it('build takes no args for static paths', () => {
    const p = path('/health');
    type Args = Parameters<typeof p.build>;
    typeEqual<Args, []>(true);
    expect(true).toBe(true);
  });

  it('match returns typed params', () => {
    const p = path('/users/:id');
    const result = p.match('/users/42');
    if (result) {
      typeEqual<typeof result, { id: string | number | boolean }>(true);
    }
    expect(true).toBe(true);
  });

  it('match returns empty object for static paths', () => {
    const p = path('/health');
    const result = p.match('/health');
    if (result) {
      typeEqual<typeof result, {}>(true);
    }
    expect(true).toBe(true);
  });
});
