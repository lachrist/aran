export const makeScriptProgram = (field0, annotation = null) => ["ScriptProgram", field0, annotation];
export const makeModuleProgram = (field0, field1, annotation = null) => ["ModuleProgram", field0, field1, annotation];
export const makeEvalProgram = (field0, annotation = null) => ["EvalProgram", field0, annotation];
export const makeImportLink = (field0, field1, annotation = null) => ["ImportLink", field0, field1, annotation];
export const makeExportLink = (field0, annotation = null) => ["ExportLink", field0, annotation];
export const makeAggregateLink = (field0, field1, field2, annotation = null) => ["AggregateLink", field0, field1, field2, annotation];
export const makeBlock = (field0, field1, field2, annotation = null) => ["Block", field0, field1, field2, annotation];
export const makeEffectStatement = (field0, annotation = null) => ["EffectStatement", field0, annotation];
export const makeReturnStatement = (field0, annotation = null) => ["ReturnStatement", field0, annotation];
export const makeBreakStatement = (field0, annotation = null) => ["BreakStatement", field0, annotation];
export const makeDebuggerStatement = (annotation = null) => ["DebuggerStatement", annotation];
export const makeDeclareExternalStatement = (field0, field1, field2, annotation = null) => ["DeclareExternalStatement", field0, field1, field2, annotation];
export const makeBlockStatement = (field0, annotation = null) => ["BlockStatement", field0, annotation];
export const makeIfStatement = (field0, field1, field2, annotation = null) => ["IfStatement", field0, field1, field2, annotation];
export const makeWhileStatement = (field0, field1, annotation = null) => ["WhileStatement", field0, field1, annotation];
export const makeTryStatement = (field0, field1, field2, annotation = null) => ["TryStatement", field0, field1, field2, annotation];
export const makeWriteEffect = (field0, field1, annotation = null) => ["WriteEffect", field0, field1, annotation];
export const makeWriteExternalEffect = (field0, field1, annotation = null) => ["WriteExternalEffect", field0, field1, annotation];
export const makeExportEffect = (field0, field1, annotation = null) => ["ExportEffect", field0, field1, annotation];
export const makeConditionalEffect = (field0, field1, field2, annotation = null) => ["ConditionalEffect", field0, field1, field2, annotation];
export const makeExpressionEffect = (field0, annotation = null) => ["ExpressionEffect", field0, annotation];
export const makeParameterExpression = (field0, annotation = null) => ["ParameterExpression", field0, annotation];
export const makeLiteralExpression = (field0, annotation = null) => ["LiteralExpression", field0, annotation];
export const makeIntrinsicExpression = (field0, annotation = null) => ["IntrinsicExpression", field0, annotation];
export const makeImportExpression = (field0, field1, annotation = null) => ["ImportExpression", field0, field1, annotation];
export const makeReadExpression = (field0, annotation = null) => ["ReadExpression", field0, annotation];
export const makeReadExternalExpression = (field0, annotation = null) => ["ReadExternalExpression", field0, annotation];
export const makeTypeofExternalExpression = (field0, annotation = null) => ["TypeofExternalExpression", field0, annotation];
export const makeClosureExpression = (field0, field1, field2, field3, annotation = null) => ["ClosureExpression", field0, field1, field2, field3, annotation];
export const makeAwaitExpression = (field0, annotation = null) => ["AwaitExpression", field0, annotation];
export const makeYieldExpression = (field0, field1, annotation = null) => ["YieldExpression", field0, field1, annotation];
export const makeSequenceExpression = (field0, field1, annotation = null) => ["SequenceExpression", field0, field1, annotation];
export const makeConditionalExpression = (field0, field1, field2, annotation = null) => ["ConditionalExpression", field0, field1, field2, annotation];
export const makeEvalExpression = (field0, annotation = null) => ["EvalExpression", field0, annotation];
export const makeApplyExpression = (field0, field1, field2, annotation = null) => ["ApplyExpression", field0, field1, field2, annotation];
export const makeConstructExpression = (field0, field1, annotation = null) => ["ConstructExpression", field0, field1, annotation];


          import {slice} from "array-lite";
          export const annotateNode = (node, annotation) => {
            node = slice(node, 0, node.length);
            node[node.length - 1] = annotation;
            return node;
          };
        
