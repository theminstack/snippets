# Maybe monad

Safely represent and manipulate a value which may be unavailable, possibly due to an error.

A [Maybe monad](https://en.wikipedia.org/wiki/Monad_(functional_programming)#An_example:_Maybe) is an immutable wrapper which allows you to defer handling of null/undefined values and errors until you want to capture the result of an operation. It's an alternative to frequent nullish checks and try/catch blocks.

Let's say you want to access a user object which is stored as a JSON string in session or local storage. The vanilla way to do so might look like the following.

```ts
function getUsername() {
  const json = sessionStorage.getItem('user')
    ?? localStorage.getItem('user');
  
  if (json == null) {
    return null;
  }

  // Might throw a JSON parsing error.
  const name = JSON.parse(json)?.name;

  if (typeof name !== 'string') {
    return null;
  }

  return name
}

// The above function might return a username,
// null, or throw an error. So you have to access
// it as follows.

let username: string | null;

try {
  username = getUsername();
} catch (error) {
  console.error(error);
}

if (username == null) {
  console.warn('no username');
} else {
  console.log('username = ' + username);
}
```

Using a Maybe monad makes this much cleaner, because each step in the operation can assume the input value is non-nullish (not null or undefined) and that there is no error. If there is an error, it's returned instead of thrown.

```ts
function getUsername(): Maybe<string> {
  return maybe(sessionStorage.getItem('user'))
    .else(() => localStorage.getItem('user'))
    .map((json) => JSON.parse(json)?.name)
    .filter((name) => typeof name === 'string');
}

const username = getUsername();

if (username.ok) {
  console.log('username = ' + username.value);
} else if (username.error != null) {
  console.error(username.error);
} else {
  console.warn('no username');
}
```

The `Maybe` monad has the following properties and methods.

- `ok` - True if the monad is not empty (ie. has a non-nullish value).
- `empty` - True if the monad is empty (ie. has no value).
- `value` - Get the non-nullish value, or throw an error if the monad is empty.
- `error` - Get the error (if any) that caused the monad to be empty.
- `map(next)` - Get the next monad if the current monad is ok (not empty).
- `else(next)` - Get the next monad if the current monad is empty, and does _NOT_ have an error.
- `catch(next)` - Get the next monad if the current monad has an error.
- `filter(predicate)` - Get an empty monad if the current monad is ok (not empty), but does not match the predicate.
- `toArray()` - Return an array containing the monad value if the monad is ok (not empty), or an empty array if the monad is empty.

In addition to creating a monad from an initial value (eg. `maybe(value)`), you can also create explicitly empty and error monads.

```ts
const empty = maybe.empty<Type>();
const error = maybe.error<Type>(new Error());
```

Wrapping a monad or returning a monad in a `next` callback, just returns the inner monad. So, monads can never be nested and the value of a monad is never another monad.

```ts
const a = maybe(1);
const b = maybe(a);
const c = maybe.empty().else(() => a);
a === b; // true
a === c; // true
a.value; // 1
b.value; // 1
c.value; // 1
```
