# TinySource

Tiny source code snippets, _with tests_, completely free to **copy into your project**.

[![Node.js CI](https://github.com/tinysource/tinysource/actions/workflows/node.js.yml/badge.svg)](https://github.com/tinysource/tinysource/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/tinysource/tinysource/badge.svg?branch=main)](https://coveralls.io/github/tinysource/tinysource?branch=main)

## The problem

The JavaScript/NodeJS ecosystem is full of libraries. This can be a good thing, because it lets you accomplish more by doing less. But it can also be a bad thing, because each dependency you use opens up a path for a [supply chain attack](https://blog.sonatype.com/npm-project-used-by-millions-hijacked-in-supply-chain-attack), they can lead to dependency hell, there can be licensing conflicts, and sometimes too many dependencies can slow down development and/or runtime performance.

## The opposite problem

Alright, then just don't use as many dependencies. But, there are some problems with this approach too. You have to write more. Everything you write yourself, you have to test. There's not much community around code that is only used by you and maybe your team. The documentation might not be as complete as for a widely adopted open source project.

## A possible solution

What if, instead of taking a dependency on a library (eg. installed with NPM), you simply _copied_ some code (and its tests) into your project?

This isn't a good solution for large dependencies (eg. React), but its definitely feasible for smaller dependencies like: individual RxJS utilities, simple state management, collections, algorithms, validation, string parsing, React hooks, types, etc.

Pros:

- Still leveraging community written code
- Tests are already written
- No risk of supply chain attacks
- No risk of version hell
- Build-time downleveling and transpiling
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
- One reasonably sized (~150 lines max) source file (not including a separate tests file)
- One test file (for Jest in this repo)
- Free and unencumbered in the public domain (eg. under the [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt) license)

## Contributing to this repository

By contributing code to this repository, you agree to release it into the public domain under the [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt) license, and that others are free to copy and modify the code as they see fit.

If you agree, then...

- Fork the repository
- Add a new directory containing three files:
  - A source file (eg. `foo/foo.ts`)
    - Please use [kebab-case](https://en.wiktionary.org/wiki/kebab_case) for directory and file names
  - A test file matching the source file (eg. `foo/foo.test.ts`)
  - A `README.md` file
    - Describe what it's for
    - Show example use
- Run `npm test` at the repo root to ensure tests run, pass, and have reasonable (80%) coverage
- Open a pull request

Pull request will be merged after verifying that the code meets the requirements called out in this document.
