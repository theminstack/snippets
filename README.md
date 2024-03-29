# MinStack Snippets

Completely free TypeScript one-file source code snippets _with tests_, which can be copied to **avoid extra dependencies** (contributions welcome).

[![publish](https://github.com/theminstack/snippets/actions/workflows/publish.yml/badge.svg)](https://github.com/theminstack/snippets/actions/workflows/publish.yml)
[![codecov](https://codecov.io/gh/theminstack/snippets/branch/main/graph/badge.svg?token=E2VYI8XJLB)](https://codecov.io/gh/theminstack/snippets)

## Snippets

- [debounced](debounced) - Ignore repeating calls that happen too fast.
- [deferred](deferred) - Delay execution until idle.
- [escape-regexp](escape-regexp) - Escape all regular expression special/meta characters
- [events](events) - Typed events class.
- [fetch-error](fetch-error) - Error type for failed fetch requests.
- [fetch-sdk](fetch-sdk) - Helper for creating fetch SDK classes.
- [fsm](fsm) - Finite state machine.
- [hash-djb2a](hash-djb2a) - Fast and good string hash function.
- [is-json-safe](is-json-safe) - Can a value be converted to and from JSON without data loss.
- [limiter](limiter) - Run asynchronous tasks with limited concurrency.
- [maybe](maybe) - Functionally represent and manipulate possibly missing/error values.
- [react-decorator](react-decorator) - Decorate non-empty DOM content with a wrapper.
- [react-use-boolean](react-use-boolean) - Boolean React states with helpful setters.
- [react-use-mutation](react-use-mutation) - Minimal asynchronous create/update/delete hook.
- [react-use-query](react-use-query) - Minimal asynchronous data read hook.
- [react-use-subject](react-use-subject) - Subjects as sharable, atomic, React states.
- [react-use-viewport-size](react-use-viewport-size) - Use the viewport (window) dimensions.
- [read-stream](read-stream) - Read all data from a stream.
- [retry](retry) - Retry asynchronous actions on error (rejection).
- [schema](schema) - Composable type predicates for runtime type checking.
- [semaphore](semaphore) - Limit the concurrency of asynchronous tasks.
- [sorted-list](sorted-list) - Always sorted list with binary searching.
- [subject](subject) - Values you can subscribe to.
- [subject-selector](subject-selector) - Computed values you can subscribe to.
- [throttled](throttled) - Execute as fast as possible, but no faster.
- [to-array](to-array) - Coerce a value to an array.

## The case for copying

What if, instead of adding _another_ dependency to your project, or having to write utility code yourself, you just copied some already tested code? You've probably already even done this privately.

Copying isn't a good solution for large dependencies (eg. React), but its definitely feasible for smaller dependencies like: individual RxJS utilities, simple state management, collections, algorithms, validation, string parsing, React hooks, types, etc. Think [stack overflow](https://stackoverflow.com/), but _curated and tested_.

Pros:

- Still leveraging community written code
- publish are already written
- No risk of [supply chain attacks](https://blog.sonatype.com/npm-project-used-by-millions-hijacked-in-supply-chain-attack)
- No risk of version hell
- No licensing conflicts
- Build-time downleveling and transpiling
- Customizable
- Easier to debug

Cons:

- Possible code duplication in multiple projects
  - Larger source/bundle sizes
  - Diverging implementations
- No versioned updates

Duplication can be mitigated by using a monorepo to _locally_ share code, or by relying on compression to reduce the duplication overhead.

Even though updates aren't as simple as changing a version number, re-copying over a single file is not very much overhead. Also, the code being in your project allows for ad-hoc/custom updates. If the tests still pass after the new code is copied, then the update should be safe.

## Requirements for copyable snippets

There are some simple rules of thumb for code that is easy and helpful to copy into your project.

- No runtime dependencies
  - With the exception of a single _popular_ framework, if the snippet is specifically designed for that framework (eg. React)
- One reasonably sized source file (~150 lines)
- One reasonably sized _types_ file (~150 lines)
- One test file (Jest compatible in this repo)
- Free and unencumbered in the public domain (eg. under the [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt) license)

It is acceptable to split your source and types into two files, for the following reasons.

- Types sometimes take up a lot of lines, but contribute no actual bundle size. - It's an organization that is common in the wild.
- It can more accurately reflect complexity.

## Contributing to this repository

By contributing code to this repository, you agree to release it into the public domain under the [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt) license, and that others are free to copy and modify the code as they see fit.

If you agree, then...

- Fork the repository
- Add a new directory containing three (or four with types) files:
  - A source file (eg. `foo/foo.ts`)
    - Add docblock comments to all exports
    - Please use [kebab-case](https://en.wiktionary.org/wiki/kebab_case) for directory and file names
  - An (optional) types file matching the source file (eg. `foo/foo.types.ts`)
  - A test file matching the source file (eg. `foo/foo.test.ts`)
  - A readme file (eg. `foo/README.md`)
    - Describe what the snippet for
    - Show example use
- Run `npm test` at the repo root to ensure tests run, pass, and have reasonable (80%) coverage
- Add an entry to the end of the [Snippets](#snippets) list
- Open a pull request

Pull requests will be merged after verifying that the code meets the requirements called out in this document.
