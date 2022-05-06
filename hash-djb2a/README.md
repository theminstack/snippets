# Hash DJB2a

XOR version of the [DJB2](http://www.cse.yorku.ca/~oz/hash.html) string hashing algorithm (sometimes referred to as DJB2a), originally written by [Daniel J. Bernstein](https://en.wikipedia.org/wiki/Daniel_J._Bernstein).

To quote this [site](http://www.cse.yorku.ca/%7Eoz/hash.html):

> If you just want to have a good hash function, and cannot wait, djb2 is one of the best string hash functions i know. it has excellent distribution and speed on many different sets of keys and table sizes. you are not likely to do better with one of the "well known" functions such as PJW, K&R, etc.

See this [stack exchange question](https://softwareengineering.stackexchange.com/questions/49550) for a good evaluation of different string hashing functions.

```ts
const result = hash('hello world');

console.log(result.value);
// stdout: 4173747013;
```

Base-36 strings are good way to represent the hash value in a URL and CSS identifier safe way.

```ts
console.log(result.value.toString(36));
// stdout: 1x0xvt1
```

Hashes can be calculated progressively by passing a previous result as the hash function's second argument.

```ts
const partial = hash('hello ');
const result = hash('world', partial);

result.value === hash('hello world').value;
// true
```

One of the use cases for this hash function is unique class names for CSS-in-JS libraries. In fact, [styled-components](https://github.com/styled-components/styled-components/blob/main/packages/styled-components/src/utils/hash.ts) is using a reversed iteration version of this algorithm. Reversing the iteration order can give a very slight performance increase, but it does not produce the same results and it makes streaming hash calculation problematic.
