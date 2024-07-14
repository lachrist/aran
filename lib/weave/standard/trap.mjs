import { concat_XX, flatMap, map } from "../../util/index.mjs";
import { incrementDepth } from "../depth.mjs";
import { makeJsonExpression } from "../json.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makeReadExpression,
  makePrimitiveExpression,
  makeWriteEffect,
  makeExpressionEffect,
  makeConstructExpression,
} from "../node.mjs";
import {
  ADVICE_VARIABLE,
  FRAME_VARIABLE,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";

/**
 * @type {(
 *   name:  keyof import("./aspect").NormalPointcut,
 *   input: import("../atom").ResExpression[],
 * ) => import("../atom").ResExpression}
 */
const makeTrapExpression = (name, input) =>
  makeApplyExpression(
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makeIntrinsicExpression("undefined"),
      [makeReadExpression(ADVICE_VARIABLE), makePrimitiveExpression(name)],
    ),
    makeReadExpression(ADVICE_VARIABLE),
    input,
  );

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").BlockKind,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockSetup = (
  { "block@setup": predicate },
  depth,
  kind,
  path,
) =>
  predicate(kind, path)
    ? [
        makeWriteEffect(
          mangleStateVariable(incrementDepth(depth)),
          makeTrapExpression("block@setup", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").ProgramKind,
 *   head: (
 *     | import("../../header").ModuleHeader
 *     | import("../../header").DeclareHeader
 *   )[],
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapProgramBlockDefinition = (
  { "program-block@definition": predicate },
  depth,
  kind,
  head,
  path,
) =>
  predicate(kind, path)
    ? [
        makeExpressionEffect(
          makeTrapExpression("program-block@definition", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makeJsonExpression(head),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").ControlKind,
 *   labels: import("../atom").Label[],
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapControlBlockLabeling = (
  { "control-block@labeling": predicate },
  depth,
  kind,
  labels,
  path,
) =>
  predicate(kind, path)
    ? [
        makeExpressionEffect(
          makeTrapExpression("control-block@labeling", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makeJsonExpression(labels),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   variable: import("../atom").ArgVariable,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeVariableEntry = (variable) => [
  makePrimitiveExpression(variable),
  makeReadExpression(mangleOriginalVariable(variable)),
];

/**
 * @type {(
 *   parameter: import("../../lang").Parameter,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeParameterEntry = (parameter) => [
  makePrimitiveExpression(parameter),
  makeReadExpression(parameter),
];

/**
 * @type {(
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 * ) => import("../atom").ResExpression}
 */
const makeFrameExpression = (parameters, variables) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeIntrinsicExpression("undefined"),
    concat_XX(
      makePrimitiveExpression(null),
      flatMap(parameters, makeParameterEntry),
      flatMap(variables, makeVariableEntry),
    ),
  );

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").BlockKind,
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockDeclaration = (
  { "block@declaration": predicate },
  depth,
  kind,
  parameters,
  variables,
  path,
) =>
  predicate(kind, path)
    ? [
        makeExpressionEffect(
          makeTrapExpression("block@declaration", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makeFrameExpression(parameters, variables),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   parameter: import("../../lang").Parameter,
 * ) => import("../atom").ResEffect}
 */
const makeOverwriteParameterEffect = (parameter) =>
  makeWriteEffect(
    parameter,
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makeIntrinsicExpression("undefined"),
      [makeReadExpression(FRAME_VARIABLE), makePrimitiveExpression(parameter)],
    ),
  );

/**
 * @type {(
 *   parameter: import("../atom").ArgVariable,
 * ) => import("../atom").ResEffect}
 */
const makeOverwriteVariableEffect = (variable) =>
  makeWriteEffect(
    mangleOriginalVariable(variable),
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makeIntrinsicExpression("undefined"),
      [makeReadExpression(FRAME_VARIABLE), makePrimitiveExpression(variable)],
    ),
  );

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").BlockKind,
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockDeclarationOverwrite = (
  { "block@declaration-overwrite": predicate },
  depth,
  kind,
  parameters,
  variables,
  path,
) =>
  predicate(kind, path)
    ? concat_XX(
        makeWriteEffect(
          FRAME_VARIABLE,
          makeTrapExpression("block@declaration-overwrite", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makeFrameExpression(parameters, variables),
            makePrimitiveExpression(path),
          ]),
        ),
        map(parameters, makeOverwriteParameterEffect),
        map(variables, makeOverwriteVariableEffect),
      )
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").GeneratorKind,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapGeneratorBlockSuspension = (
  { "generator-block@suspension": predicate },
  depth,
  kind,
  path,
) =>
  predicate(kind, path)
    ? [
        makeExpressionEffect(
          makeTrapExpression("generator-block@suspension", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").GeneratorKind,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapGeneratorBlockResumption = (
  { "generator-block@resumption": predicate },
  depth,
  kind,
  path,
) =>
  predicate(kind, path)
    ? [
        makeExpressionEffect(
          makeTrapExpression("generator-block@resumption", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").ControlKind,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapControlBlockCompletion = (
  { "control-block@completion": predicate },
  depth,
  kind,
  path,
) =>
  predicate(kind, path)
    ? [
        makeExpressionEffect(
          makeTrapExpression("control-block@completion", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").RoutineKind,
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapRoutineBlockCompletion = (
  { "routine-block@completion": predicate },
  depth,
  kind,
  argument,
  path,
) =>
  predicate(kind, path)
    ? makeTrapExpression("routine-block@completion", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(kind),
        makeIntrinsicExpression("undefined"),
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").BlockKind,
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapBlockThrowing = (
  { "block@throwing": predicate },
  depth,
  kind,
  argument,
  path,
) =>
  predicate(kind, path)
    ? makeTrapExpression("block@throwing", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(kind),
        argument,
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").BlockKind,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockTeardown = (
  { "block@teardown": predicate },
  depth,
  kind,
  path,
) =>
  predicate(kind, path)
    ? [
        makeExpressionEffect(
          makeTrapExpression("block@teardown", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   label: import("../atom").Label,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBreakBefore = (
  { "break@before": predicate },
  depth,
  label,
  path,
) =>
  predicate(label, path)
    ? [
        makeWriteEffect(
          mangleStateVariable(incrementDepth(depth)),
          makeTrapExpression("break@before", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(label),
            makePrimitiveExpression(path),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapDropBefore = (
  { "drop@before": predicate },
  depth,
  argument,
  path,
) =>
  predicate(path)
    ? makeTrapExpression("drop@before", [
        makeReadExpression(mangleStateVariable(depth)),
        argument,
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   variable: (
 *     | import("../../lang").Parameter
 *     | import("../atom").ArgVariable
 *   ),
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapWriteBefore = (
  { "write@before": predicate },
  depth,
  variable,
  argument,
  path,
) =>
  predicate(variable, path)
    ? makeTrapExpression("write@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(variable),
        argument,
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   specifier: import("../../estree").Specifier,
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapExportBefore = (
  { "export@before": predicate },
  depth,
  specifier,
  argument,
  path,
) =>
  predicate(specifier, path)
    ? makeTrapExpression("export@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(specifier),
        argument,
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   primitive: import("../../lang").RuntimePrimitive,
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapPrimitiveAfter = (
  { "primitive@after": predicate },
  depth,
  primitive,
  result,
  path,
) =>
  predicate(primitive, path)
    ? makeTrapExpression("primitive@after", [
        makeReadExpression(mangleStateVariable(depth)),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   intrinsic: import("../../lang").Intrinsic,
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapIntrinsicAfter = (
  { "intrinsic@after": predicate },
  depth,
  intrinsic,
  result,
  path,
) =>
  predicate(intrinsic, path)
    ? makeTrapExpression("intrinsic@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(intrinsic),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   variable: (
 *     | import("../../lang").Parameter
 *     | import("../atom").ArgVariable
 *   ),
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapReadAfter = (
  { "read@after": predicate },
  depth,
  variable,
  result,
  path,
) =>
  predicate(variable, path)
    ? makeTrapExpression("read@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(variable),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   source: import("../../estree").Source,
 *   specifier: import("../../estree").Specifier | null,
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapImportAfter = (
  { "import@after": predicate },
  depth,
  source,
  specifier,
  result,
  path,
) =>
  predicate(source, specifier, path)
    ? makeTrapExpression("read@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(source),
        makePrimitiveExpression(specifier),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").ClosureKind,
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapClosureAfter = (
  { "closure@after": predicate },
  depth,
  kind,
  result,
  path,
) =>
  predicate(kind, path)
    ? makeTrapExpression("closure@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(kind),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   delegate: boolean,
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapYieldBefore = (
  { "yield@before": predicate },
  depth,
  delegate,
  argument,
  path,
) =>
  predicate(delegate, path)
    ? makeTrapExpression("yield@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(delegate),
        argument,
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   delegate: boolean,
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapYieldAfter = (
  { "yield@after": predicate },
  depth,
  delegate,
  result,
  path,
) =>
  predicate(delegate, path)
    ? makeTrapExpression("yield@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(delegate),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapAwaitBefore = (
  { "await@before": predicate },
  depth,
  argument,
  path,
) =>
  predicate(path)
    ? makeTrapExpression("await@before", [
        makeReadExpression(mangleStateVariable(depth)),
        argument,
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapAwaitAfter = (
  { "await@after": predicate },
  depth,
  result,
  path,
) =>
  predicate(path)
    ? makeTrapExpression("await@after", [
        makeReadExpression(mangleStateVariable(depth)),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   context: import("../../source").DeepLocalContext,
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression | null}
 */
export const trapEvalBefore = (
  { "eval@before": predicate },
  depth,
  context,
  argument,
  path,
) =>
  predicate(path)
    ? makeTrapExpression("eval@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makeJsonExpression(context),
        argument,
        makePrimitiveExpression(path),
      ])
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   result: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapEvalAfter = (
  { "eval@after": predicate },
  depth,
  result,
  path,
) =>
  predicate(path)
    ? makeTrapExpression("eval@after", [
        makeReadExpression(mangleStateVariable(depth)),
        result,
        makePrimitiveExpression(path),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: "if" | "while" | "conditional",
 *   argument: import("../atom").ResExpression,
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapTestBefore = (
  { "test@before": predicate },
  depth,
  kind,
  argument,
  path,
) =>
  predicate(kind, path)
    ? makeTrapExpression("test@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(kind),
        argument,
        makePrimitiveExpression(path),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   callee: import("../atom").ResExpression,
 *   self: import("../atom").ResExpression,
 *   input: import("../atom").ResExpression[],
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapApplyAround = (
  { "apply@around": predicate },
  depth,
  callee,
  self,
  input,
  path,
) =>
  predicate(path)
    ? makeTrapExpression("apply@around", [
        makeReadExpression(mangleStateVariable(depth)),
        callee,
        self,
        makeApplyExpression(
          makeIntrinsicExpression("Array.of"),
          makeIntrinsicExpression("undefined"),
          input,
        ),
        makePrimitiveExpression(path),
      ])
    : makeApplyExpression(callee, self, input);

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   callee: import("../atom").ResExpression,
 *   input: import("../atom").ResExpression[],
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
export const trapConstructAround = (
  { "construct@around": predicate },
  depth,
  callee,
  input,
  path,
) =>
  predicate(path)
    ? makeTrapExpression("construct@around", [
        makeReadExpression(mangleStateVariable(depth)),
        callee,
        makeApplyExpression(
          makeIntrinsicExpression("Array.of"),
          makeIntrinsicExpression("undefined"),
          input,
        ),
        makePrimitiveExpression(path),
      ])
    : makeConstructExpression(callee, input);
