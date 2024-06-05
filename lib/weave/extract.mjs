/**
 * @type {<K, V>(
 *   entry: [
 *     K,
 *     { pointcut: V },
 *   ],
 * ) => [K, V]}
 */
export const extractPointcutEntry = ([key, { pointcut }]) => [key, pointcut];

/**
 * @type {<K, V>(
 *   entry: [
 *     K,
 *     { advice: V },
 *   ],
 * ) => [K, V]}
 */
export const extractAdviceEntry = ([key, { advice }]) => [key, advice];
