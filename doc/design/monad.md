Currently, `unbuild` is using the writer monad extensively. This enables
automated handling of prelude. But scope still need to be passed around
manually. Most of the time, a reader monad would be sufficient. The only
(contagious) case that would require the state monad is
`listInitializeScopeEffect`. This function updates the deadzone of variables to
remove many runtime checks. We could have a monad that handles all these cases
and use characters to type the arguments of monadic functions. For instance:

- `X`: pure `X`
- `R`: reader + writer `(state: S) => [W, X]`
- `W`: writer `[W, X]`
- `S`: state + writer `(state: S) => [S, W, X]`

```js
/**
 * @type {<W, X1, X2, Y>(
 *   f: (x1: X1, x2: X2) => Y,
 *   x: X,
 *   w: [W, X2],
 * ) => [W, Y]}
 */
const liftXW = TODO;

/**
 * @type {<W, X1, X2, Y>(
 *   f: (x1: X1, x2: X2) => Y,
 *   r: (s: S) => [W1, X1],
 *   s: (s: S) => [S, W2, X2],
 * ) => (s: S) => [S, W1 | W2, Y]}
 */
const liftRS = TODO;
```
