/**
 * @type {(
 *   context: (
 *     | import("./context").Context
 *     | import("./context").RootContext
 *   ),
 *   scope: import("./scope").Scope,
 * ) => import("./context").Context}
 */
export const updateContextScope = (context, scope) => ({
  ...context,
  scope,
});
