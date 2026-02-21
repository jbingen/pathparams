# 🔗 pathparams

[![npm version](https://img.shields.io/npm/v/@jbingen/pathparams)](https://www.npmjs.com/package/@jbingen/pathparams)
[![npm bundle size](https://img.shields.io/npm/unpacked-size/@jbingen/pathparams)](https://www.npmjs.com/package/@jbingen/pathparams)
[![license](https://img.shields.io/github/license/jbingen/pathparams)](https://github.com/jbingen/pathparams/blob/main/LICENSE)

Type-safe path builder and matcher for URL templates.

For anyone tired of hand-rolling `/users/${id}/posts/${postId}` without encoding safety, missing-param checks, or type guarantees.

```
npm install @jbingen/pathparams
```

```typescript
// before
`/users/${id}/posts/${postId}`; // untyped, unencoded, unchecked

// after
userPost.build({ id: "1", postId: "2" }); // typed, encoded, safe
```

Param names are inferred directly from the template string. No manual type annotations needed.

```typescript
import { path } from '@jbingen/pathparams';

const userPost = path("/users/:id/posts/:postId");

userPost.build({ id: "1", postId: "2" });
// "/users/1/posts/2"

userPost.build({ id: "1" });
// compile error - missing postId

userPost.match("/users/1/posts/2");
// { id: "1", postId: "2" }

userPost.match("/other/path");
// null
```

## Why

Everyone hand-rolls URL construction with template literals. That works until someone forgets to encode a value, misses a param, or changes a route shape without updating every call site.

pathparams fixes all three in ~70 lines with zero dependencies. The template string is the single source of truth - TypeScript infers the rest.

## API

### `path(template)`

Creates a typed path from a URL template. Params are `:name` segments.

```typescript
const p = path("/users/:id/posts/:postId");
```

Returns an object with `template`, `build`, and `match`.

### `.build(params)`

Builds a URL string from params. Values are stringified and URL-encoded.

```typescript
p.build({ id: "1", postId: "2" }); // "/users/1/posts/2"
p.build({ id: 42, postId: 7 }); // "/users/42/posts/7"
```

Static paths (no params) take no arguments:

```typescript
const health = path("/health");
health.build(); // "/health"
```

Throws at runtime if a param is missing. Catches it at compile time if you're using TypeScript.

### `.match(pathname)`

Matches a pathname against the template. Returns typed params or `null`.

```typescript
p.match("/users/1/posts/2"); // { id: "1", postId: "2" }
p.match("/users/1"); // null
p.match("/other"); // null
```

Values are URL-decoded. Match is exact - no partial matches, no trailing segment tolerance.

### `.template`

The original template string, preserved as a string literal type.

```typescript
p.template; // "/users/:id/posts/:postId"
```

## How types work

Param names are extracted from the template at the type level using template literal inference:

```typescript
path("/users/:id/posts/:postId");
// build requires: { id: string | number | boolean, postId: string | number | boolean }
// match returns:  { id: string | number | boolean, postId: string | number | boolean } | null

path("/health");
// build requires: no arguments
// match returns:  {} | null
```

No generics to pass manually. The template string is the source of truth.

## Status

Early, but stable. The API surface is intentionally small and expected to remain mostly additive.

## Design decisions

- Zero dependencies. ~70 lines of TypeScript.
- Param names inferred from template literals at compile time.
- Values are stringified, URL-encoded on build, URL-decoded on match.
- Static segments are regex-escaped for safe matching.
- No partial matching, no wildcards, no query strings. Just path params.
