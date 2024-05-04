/**
 * @type {(
 *   variable: import("./atom").ResVariable,
 *   initializer: Json,
 * ) => import("./binding").Binding}
 */
export const makeBinding = (variable, initializer) => [variable, initializer];
