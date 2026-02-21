// Extracts param names from a path template: '/users/:id/posts/:postId' -> 'id' | 'postId'
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type ParamRecord<T extends string> = { [K in ExtractParams<T>]: string | number | boolean };

type IsNever<T> = [T] extends [never] ? true : false;

type BuildArgs<T extends string> =
  IsNever<ExtractParams<T>> extends true ? [] : [params: ParamRecord<T>];

type MatchResult<T extends string> =
  IsNever<ExtractParams<T>> extends true ? {} : ParamRecord<T>;

export type Path<T extends string> = {
  readonly template: T;
  build: (...args: BuildArgs<T>) => string;
  match: (pathname: string) => MatchResult<T> | null;
};

export function path<T extends string>(template: T): Path<T> {
  const segments = template.split('/');

  // pre-compute the regex and param names once
  const paramNames: string[] = [];
  const regexParts = segments.map(seg => {
    if (seg.startsWith(':')) {
      paramNames.push(seg.slice(1));
      return '([^/]+)';
    }
    return escapeRegex(seg);
  });
  const pattern = new RegExp('^' + regexParts.join('/') + '$');

  return {
    template,

    build(...args: BuildArgs<T>): string {
      const params = (args[0] ?? {}) as Record<string, string | number | boolean>;
      return segments.map(seg => {
        if (!seg.startsWith(':')) return seg;
        const key = seg.slice(1);
        const val = params[key];
        if (val === undefined) throw new Error(`Missing path param: ${key}`);
        return encodeURIComponent(String(val));
      }).join('/');
    },

    match(pathname: string): MatchResult<T> | null {
      const m = pattern.exec(pathname);
      if (!m) return null;
      const result: Record<string, string> = {};
      for (let i = 0; i < paramNames.length; i++) {
        result[paramNames[i]!] = decodeURIComponent(m[i + 1]!);
      }
      return result as MatchResult<T>;
    },
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
