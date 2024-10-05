
/**
 * @type {(
 *   scope: import("./deadzone").Scope,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./deadzone").Status}
*/
export const lookup = (scope) => TODO;

/**
 * @type {(
*   node: (
*     | import("estree-sentry").Expression<import("../../hash").HashProp>
*     | import("estree-sentry").Super<import("../../hash").HashProp>
*     | import("estree-sentry").SpreadElement<import("../../hash").HashProp>
*     | import("estree-sentry").ObjectProperty<import("../../hash").HashProp>
*     | import("estree-sentry").OptionalCallExpression<import("../../hash").HashProp>
*     | import("estree-sentry").OptionalMemberExpression<import("../../hash").HashProp>
*   ),
*   scope: import("./deadzone").Scope,
* ) => import("./deadzone").Deadzone}
*/
export const zoneExpression (node, scope) => TODO;
