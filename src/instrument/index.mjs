
import {makeTrapExpression} from "./trap.mjs";
import {
  makeScopeBlock,
} from "./scope.mjs";

const makeArrayExpression = (expressions) => makeApplyExpression(
  makeIntrinsicExpression("Array.of"),
  makePrimitiveExpression({undefined:null}),
  expressions,
);

const makeErrorExpression = () => makeApplyExpression(
  makeIntrinsicExpression("Reflect.get"),
  makePrimitiveExpression({undefined:null}),
  [
    makeInputExpression(),
    makePrimitiveExpression("error"),
  ],
);

const isCompletionKind = (kind) => (
  kind === "eval" ||
  kind === "arrow" ||
  kind === "function" ||
  kind === "method" ||
  kind === "constructor"
);

const default_callback = generateThrowError("Could not instrument node");

const generateVisit = (callbacks) => (context, node) => dispatch(contex, node, callbacks, default_callback);

const visitBlock = generateVisit({
  __proto__: null,
  Block: (context, serial, labels, variables, statements) => makeScopeBlock(
    context.scope,
    labels,
    variables,
    (extended_scope) => {
      const enter_cut = cut(context.pointcut, "enter", frame, null, serial);
      const completion_cut = cut(context.pointcut, "completion", frame, serial);
      const catch_cut = cut(context.pointcut, "catch", frame, null, serial);
      const leave_cut = cut(context.pointcut, "leave", frame, serial);
      const frame_variable = makeScopeNewVariable(extended_scope, "frame");
      const head_statements = (enter_cut || completion_cut || catch_cut || leave_cut) ?
        [makeEffectStatement(makeScopeNewWriteEffect(
          extended_scope,
          frame_variable,
          makeExpression(
            makeObjectExpression(
              makePrimitiveExpression(null),
              [
                [
                  makePrimitiveExpression("kind"),
                  makePrimitiveExpression(context.kind),
                ],
                [
                  makePrimitiveExpression("callee"),
                  context.callee === null ? makePrimitiveExpression(null) : makeScopeNewReadExpression(extended_scope, context.callee),
                ],
                [
                  makePrimitiveExpression("labels"),
                  makeArrayExpression(
                    labels.map((label) => makeScopeLabReadExpression(extended_scope, label)),
                  ),
                ],
                [
                  makePrimitiveExpression("variables"),
                  makeArrayExpression(
                    variables.map((variable) => makeScopeVarReadExpression(extended_scope, variable)),
                  ),
                ],
              ],
            ),
          ),
        ))] :
        [];
      const try_statements = concat(
        enter_cut
          ? makeTrapStatementArray(context.namespace, "enter", [makeScopeFrameReadExpression(extended_scope), makePrimitiveExpression(serial)])
          : [],
        map(statements, (statement) => visitStatement({...context, callee:null, kind:null, scope:extended_scope}, statement)),
        completion_cut && !isCompletionKind(context.kind)
          ? makeTrapStatementArray(context.namespace, "completion", [makeScopeFrameReadExpression(extended_scope), makePrimitiveExpression(serial)])
          : []
      );
      return (catch_cut || leave_cut) ?
        {
          head: head_statements,
          try: try_statements,
          catch: [
            makeEffectStatement(
              makeExpressionEffect(
                makeThrowExpression(
                  catch_cut
                    ? makeTrapExpression(context.namespace, "catch", [makeScopeFrameReadExpression(scope, frame_variable), makeErrorExpression(), makePrimitiveExpression(serial)])
                    : makeErrorExpression()
                ),
              ),
            ),
          ],
          finally: leave_cut
            ? makeTrapStatementArray(context.namespace, "leave", [makeScopeFrameReadExpression(extended_scope), makePrimitiveExpression(serial)])
            : [],
          tail: [],
        } :
        concat(
          head_statements,
          try_statements,
        ),
    },
  ),
});
