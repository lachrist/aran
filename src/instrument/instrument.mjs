
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
      const input_variable = makeScopeNewVariable(extended_scope, "input");
      const try_statements = concat(
        (enter_cut || completion_cut || catch_cut || leave_cut) ?
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
          [],
        enter_cut ? [makeEffectStatement(makeScopeNewWriteEffect(
          input_variable,
          makeTrapExpression(
            context.namespace,
            "enter",
            [
              makeScopeNewReadExpression(extended_scope, frame_variable),
              makeInputExpression(),
              makePrimitiveExpression(serial),
            ]
          ),
        ))] : [],
        map(statements, (statement) => visitStatement({...context, callee:null, kind:null, input:enter_cut ? input_variable : null, scope:extended_scope}, statement)),
        completion_cut
          ? makeTrapStatementArray(context.namespace, "completion", [makeScopeFrameReadExpression(extended_scope), makePrimitiveExpression(serial)])
          : []
      );
      return (catch_cut || leave_cut) ?
        {
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
          ];
          finally: leave_cut
            ? makeTrapStatementArray(context.namespace, "leave", [makeScopeFrameReadExpression(extended_scope), makePrimitiveExpression(serial)])
            : []
        } :
        concat(
          frame_statements,
          try_statements,
        );
    },
  ),
});
