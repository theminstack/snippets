# TinySource

Completely free TS/JS one-file source code snippets _with tests_, which can be copied to **avoid extra dependencies** (contributions welcome).

[![checks](https://badgen.net/github/checks/tinysource/tinysource)](https://github.com/tinysource/tinysource/actions/workflows/node.js.yml)
[![coverage](https://badgen.net/coveralls/c/github/tinysource/tinysource)](https://coveralls.io/github/tinysource/tinysource)

## Snippets

- [debounce](debounce) - Ignore repeating calls that happen too fast.
- [defer](defer) - Delay execution until idle.
- [events](events) - Named events with publication and subscription.
- [fsm](fsm) - Finite state machine.
- [hash-djb2a](hash-djb2a) - Fast and good string hash function.
- [maybe](maybe) - Functionally represent and manipulate possibly missing/error values.
- [react-decorator](react-decorator) - Decorate non-empty DOM content with a wrapper.
- [react-use-boolean](react-use-boolean) - Boolean React states with helpful setters.
- [react-use-subject](react-use-subject) - Subjects as sharable, atomic, React states.
- [subject](subject) - Subscribable values.
- [subject-selector](subject-selector) - Subscribable values computed from other subjects.
- [throttle](throttle) - Execute as fast as possible, but no faster.

## The case for copying

What if, instead of adding _another_ dependency to your project, or having to write utility code yourself, you just copied some already tested code? You've probably already even done this privately.

Copying isn't a good solution for large dependencies (eg. React), but its definitely feasible for smaller dependencies like: individual RxJS utilities, simple state management, collections, algorithms, validation, string parsing, React hooks, types, etc. Think [stack overflow](https://stackoverflow.com/), but _curated and tested_.

Pros:

- Still leveraging community written code
- Tests are already written
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
- One test file (Jest compatible in this repo)
- Free and unencumbered in the public domain (eg. under the [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt) license)

## Contributing to this repository

By contributing code to this repository, you agree to release it into the public domain under the [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt) license, and that others are free to copy and modify the code as they see fit.

If you agree, then...

- Fork the repository
- Add a new directory containing three files:
  - A source file (eg. `foo/foo.ts`)
    - Add docblock comments to all exports
    - Please use [kebab-case](https://en.wiktionary.org/wiki/kebab_case) for directory and file names
  - A test file matching the source file (eg. `foo/foo.test.ts`)
  - A readme file (eg. `foo/README.md`)
    - Describe what the snippet for
    - Show example use
- Run `npm test` at the repo root to ensure tests run, pass, and have reasonable (80%) coverage
- Add an entry to the end of the [Snippets](#snippets) list
- Open a pull request

Pull requests will be merged after verifying that the code meets the requirements called out in this document.
