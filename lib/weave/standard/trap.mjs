import { AranPointcutError, AranTypeError } from "../../report.mjs";
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
import { isClosureKind, isProgramKind } from "../parametrization.mjs";
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
 *   kind: import("../parametrization").ControlKind,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockSetup = (
  { "block@setup": predicate },
  depth,
  kind,
  hash,
) =>
  predicate(kind, hash)
    ? [
        makeWriteEffect(
          mangleStateVariable(incrementDepth(depth)),
          makeTrapExpression("block@setup", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(hash),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").RoutineKind,
 *   head: (
 *     | import("../../header").ModuleHeader
 *     | import("../../header").DeclareHeader
 *   )[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapRoutineBlockBefore = (
  {
    "program-block@before": program_predicate,
    "closure-block@before": closure_predicate,
  },
  depth,
  kind,
  head,
  hash,
) => {
  if (isProgramKind(kind)) {
    return program_predicate(kind, hash)
      ? [
          makeExpressionEffect(
            makeTrapExpression("program-block@before", [
              makeReadExpression(mangleStateVariable(depth)),
              makePrimitiveExpression(kind),
              makeJsonExpression(head),
              makePrimitiveExpression(hash),
            ]),
          ),
        ]
      : [];
  } else if (isClosureKind(kind)) {
    return closure_predicate(kind, hash)
      ? [
          makeExpressionEffect(
            makeTrapExpression("closure-block@before", [
              makeReadExpression(mangleStateVariable(depth)),
              makePrimitiveExpression(kind),
              makePrimitiveExpression(hash),
            ]),
          ),
        ]
      : [];
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").SegmentKind,
 *   labels: import("../atom").Label[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapControlBlockBefore = (
  { "segment-block@before": predicate },
  depth,
  kind,
  labels,
  hash,
) =>
  predicate(kind, hash)
    ? [
        makeExpressionEffect(
          makeTrapExpression("segment-block@before", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makeJsonExpression(labels),
            makePrimitiveExpression(hash),
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
 *   kind: import("../parametrization").ControlKind,
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockDeclaration = (
  { "block@declaration": predicate },
  depth,
  kind,
  parameters,
  variables,
  hash,
) =>
  predicate(kind, hash)
    ? [
        makeExpressionEffect(
          makeTrapExpression("block@declaration", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makeFrameExpression(parameters, variables),
            makePrimitiveExpression(hash),
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
 *   kind: import("../parametrization").ControlKind,
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockDeclarationOverwrite = (
  { "block@declaration-overwrite": predicate },
  depth,
  kind,
  parameters,
  variables,
  hash,
) =>
  predicate(kind, hash)
    ? concat_XX(
        makeWriteEffect(
          FRAME_VARIABLE,
          makeTrapExpression("block@declaration-overwrite", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makeFrameExpression(parameters, variables),
            makePrimitiveExpression(hash),
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
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapGeneratorBlockSuspension = (
  { "generator-block@suspension": predicate },
  depth,
  kind,
  hash,
) =>
  predicate(kind, hash)
    ? [
        makeExpressionEffect(
          makeTrapExpression("generator-block@suspension", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(hash),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").GeneratorKind,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapGeneratorBlockResumption = (
  { "generator-block@resumption": predicate },
  depth,
  kind,
  hash,
) =>
  predicate(kind, hash)
    ? [
        makeExpressionEffect(
          makeTrapExpression("generator-block@resumption", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(hash),
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
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapRoutineBlockAfter = (
  {
    "program-block@after": program_predicate,
    "closure-block@after": closure_predicate,
  },
  depth,
  kind,
  argument,
  hash,
) => {
  if (isProgramKind(kind)) {
    return program_predicate(kind, hash)
      ? makeTrapExpression("program-block@after", [
          makeReadExpression(mangleStateVariable(depth)),
          makePrimitiveExpression(kind),
          argument,
          makePrimitiveExpression(hash),
        ])
      : argument;
  } else if (isClosureKind(kind)) {
    return closure_predicate(kind, hash)
      ? makeTrapExpression("closure-block@after", [
          makeReadExpression(mangleStateVariable(depth)),
          makePrimitiveExpression(kind),
          argument,
          makePrimitiveExpression(hash),
        ])
      : argument;
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").SegmentKind,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapControlBlockAfter = (
  { "segment-block@after": predicate },
  depth,
  kind,
  hash,
) =>
  predicate(kind, hash)
    ? [
        makeExpressionEffect(
          makeTrapExpression("segment-block@after", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(hash),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").ControlKind,
 *   argument: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapBlockThrowing = (
  { "block@throwing": predicate },
  depth,
  kind,
  argument,
  hash,
) =>
  predicate(kind, hash)
    ? makeTrapExpression("block@throwing", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(kind),
        argument,
        makePrimitiveExpression(hash),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").ControlKind,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockTeardown = (
  { "block@teardown": predicate },
  depth,
  kind,
  hash,
) =>
  predicate(kind, hash)
    ? [
        makeExpressionEffect(
          makeTrapExpression("block@teardown", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(kind),
            makePrimitiveExpression(hash),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   label: import("../atom").Label,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResEffect[]}
 */
export const trapBreakBefore = (
  { "break@before": predicate },
  depth,
  label,
  hash,
) =>
  predicate(label, hash)
    ? [
        makeExpressionEffect(
          makeTrapExpression("break@before", [
            makeReadExpression(mangleStateVariable(depth)),
            makePrimitiveExpression(label),
            makePrimitiveExpression(hash),
          ]),
        ),
      ]
    : [];

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   argument: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapDropBefore = (
  { "drop@before": predicate },
  depth,
  argument,
  hash,
) =>
  predicate(hash)
    ? makeTrapExpression("drop@before", [
        makeReadExpression(mangleStateVariable(depth)),
        argument,
        makePrimitiveExpression(hash),
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
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapWriteBefore = (
  { "write@before": predicate },
  depth,
  variable,
  argument,
  hash,
) =>
  predicate(variable, hash)
    ? makeTrapExpression("write@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(variable),
        argument,
        makePrimitiveExpression(hash),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   specifier: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   argument: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapExportBefore = (
  { "export@before": predicate },
  depth,
  specifier,
  argument,
  hash,
) =>
  predicate(specifier, hash)
    ? makeTrapExpression("export@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(specifier),
        argument,
        makePrimitiveExpression(hash),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   primitive: import("../../lang").RuntimePrimitive,
 *   result: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapPrimitiveAfter = (
  { "primitive@after": predicate },
  depth,
  primitive,
  result,
  hash,
) =>
  predicate(primitive, hash)
    ? makeTrapExpression("primitive@after", [
        makeReadExpression(mangleStateVariable(depth)),
        result,
        makePrimitiveExpression(hash),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   intrinsic: import("../../lang").Intrinsic,
 *   result: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapIntrinsicAfter = (
  { "intrinsic@after": predicate },
  depth,
  intrinsic,
  result,
  hash,
) =>
  predicate(intrinsic, hash)
    ? makeTrapExpression("intrinsic@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(intrinsic),
        result,
        makePrimitiveExpression(hash),
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
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapReadAfter = (
  { "read@after": predicate },
  depth,
  variable,
  result,
  hash,
) =>
  predicate(variable, hash)
    ? makeTrapExpression("read@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(variable),
        result,
        makePrimitiveExpression(hash),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   source: import("estree-sentry").SourceValue,
 *   specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   result: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapImportAfter = (
  { "import@after": predicate },
  depth,
  source,
  specifier,
  result,
  hash,
) =>
  predicate(source, specifier, hash)
    ? makeTrapExpression("import@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(source),
        makePrimitiveExpression(specifier),
        result,
        makePrimitiveExpression(hash),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: import("../parametrization").ClosureKind,
 *   result: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapClosureAfter = (
  { "closure@after": predicate },
  depth,
  kind,
  result,
  hash,
) =>
  predicate(kind, hash)
    ? makeTrapExpression("closure@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(kind),
        result,
        makePrimitiveExpression(hash),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   delegate: boolean,
 *   argument: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapYieldBefore = (
  { "yield@before": predicate },
  depth,
  delegate,
  argument,
  hash,
) =>
  predicate(delegate, hash)
    ? makeTrapExpression("yield@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(delegate),
        argument,
        makePrimitiveExpression(hash),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   delegate: boolean,
 *   result: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapYieldAfter = (
  { "yield@after": predicate },
  depth,
  delegate,
  result,
  hash,
) =>
  predicate(delegate, hash)
    ? makeTrapExpression("yield@after", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(delegate),
        result,
        makePrimitiveExpression(hash),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   argument: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapAwaitBefore = (
  { "await@before": predicate },
  depth,
  argument,
  hash,
) =>
  predicate(hash)
    ? makeTrapExpression("await@before", [
        makeReadExpression(mangleStateVariable(depth)),
        argument,
        makePrimitiveExpression(hash),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   result: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapAwaitAfter = (
  { "await@after": predicate },
  depth,
  result,
  hash,
) =>
  predicate(hash)
    ? makeTrapExpression("await@after", [
        makeReadExpression(mangleStateVariable(depth)),
        result,
        makePrimitiveExpression(hash),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   context: import("../../source").DeepLocalSitu,
 *   argument: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapEvalBefore = (
  { "eval@before": predicate },
  depth,
  context,
  argument,
  hash,
) => {
  if (predicate(hash)) {
    return makeTrapExpression("eval@before", [
      makeReadExpression(mangleStateVariable(depth)),
      makeJsonExpression(context),
      argument,
      makePrimitiveExpression(hash),
    ]);
  } else {
    throw new AranPointcutError({
      type: "MissingCut",
      point: "eval@before",
      hash,
    });
  }
};

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   result: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapEvalAfter = (
  { "eval@after": predicate },
  depth,
  result,
  hash,
) =>
  predicate(hash)
    ? makeTrapExpression("eval@after", [
        makeReadExpression(mangleStateVariable(depth)),
        result,
        makePrimitiveExpression(hash),
      ])
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   kind: "if" | "while" | "conditional",
 *   argument: import("../atom").ResExpression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapTestBefore = (
  { "test@before": predicate },
  depth,
  kind,
  argument,
  hash,
) =>
  predicate(kind, hash)
    ? makeTrapExpression("test@before", [
        makeReadExpression(mangleStateVariable(depth)),
        makePrimitiveExpression(kind),
        argument,
        makePrimitiveExpression(hash),
      ])
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   callee: import("../atom").ResExpression,
 *   self: import("../atom").ResExpression,
 *   input: import("../atom").ResExpression[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapApplyAround = (
  { "apply@around": predicate },
  depth,
  callee,
  self,
  input,
  hash,
) =>
  predicate(hash)
    ? makeTrapExpression("apply@around", [
        makeReadExpression(mangleStateVariable(depth)),
        callee,
        self,
        makeApplyExpression(
          makeIntrinsicExpression("Array.of"),
          makeIntrinsicExpression("undefined"),
          input,
        ),
        makePrimitiveExpression(hash),
      ])
    : makeApplyExpression(callee, self, input);

/**
 * @type {(
 *   pointcut: import("./aspect").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   callee: import("../atom").ResExpression,
 *   input: import("../atom").ResExpression[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").ResExpression}
 */
export const trapConstructAround = (
  { "construct@around": predicate },
  depth,
  callee,
  input,
  hash,
) =>
  predicate(hash)
    ? makeTrapExpression("construct@around", [
        makeReadExpression(mangleStateVariable(depth)),
        callee,
        makeApplyExpression(
          makeIntrinsicExpression("Array.of"),
          makeIntrinsicExpression("undefined"),
          input,
        ),
        makePrimitiveExpression(hash),
      ])
    : makeConstructExpression(callee, input);
