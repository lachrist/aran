import { AranPointcutError, AranTypeError } from "../../error.mjs";
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
 *   name: keyof import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   input: import("../atom.d.ts").ResExpression[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
const makeTrapExpression = (name, input, tag) =>
  makeApplyExpression(
    makeApplyExpression(
      makeIntrinsicExpression("aran.getValueProperty", tag),
      makeIntrinsicExpression("undefined", tag),
      [
        makeReadExpression(ADVICE_VARIABLE, tag),
        makePrimitiveExpression(name, tag),
      ],
      tag,
    ),
    makeReadExpression(ADVICE_VARIABLE, tag),
    input,
    tag,
  );

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").ControlKind,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapBlockSetup = (
  { "block@setup": predicate },
  depth,
  kind,
  tag,
) =>
  predicate(kind, tag)
    ? makeWriteEffect(
        mangleStateVariable(incrementDepth(depth)),
        makeTrapExpression(
          "block@setup",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").SegmentKind,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapSegmentBlockSetup = (
  { "block@setup": predicate },
  depth,
  kind,
  tag,
) =>
  predicate(kind, tag)
    ? makeWriteEffect(
        mangleStateVariable(incrementDepth(depth)),
        makeTrapExpression(
          "block@setup",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").RoutineKind,
 *   head: (
 *     | import("../../lang/header.d.ts").ModuleHeader
 *     | import("../../lang/header.d.ts").DeclareHeader
 *   )[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapRoutineBlockBefore = (
  {
    "program-block@before": program_predicate,
    "closure-block@before": closure_predicate,
  },
  depth,
  kind,
  head,
  tag,
) => {
  if (isProgramKind(kind)) {
    return program_predicate(kind, tag)
      ? makeExpressionEffect(
          makeTrapExpression(
            "program-block@before",
            [
              makeReadExpression(mangleStateVariable(depth), tag),
              makePrimitiveExpression(kind, tag),
              makeJsonExpression(head, tag),
              makeJsonExpression(tag, tag),
            ],
            tag,
          ),
          tag,
        )
      : null;
  } else if (isClosureKind(kind)) {
    return closure_predicate(kind, tag)
      ? makeExpressionEffect(
          makeTrapExpression(
            "closure-block@before",
            [
              makeReadExpression(mangleStateVariable(depth), tag),
              makePrimitiveExpression(kind, tag),
              makeJsonExpression(tag, tag),
            ],
            tag,
          ),
          tag,
        )
      : null;
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").SegmentKind,
 *   labels: import("../atom.d.ts").Label[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapSegmentBlockBefore = (
  { "segment-block@before": predicate },
  depth,
  kind,
  labels,
  tag,
) =>
  predicate(kind, tag)
    ? makeExpressionEffect(
        makeTrapExpression(
          "segment-block@before",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeJsonExpression(labels, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   variable: import("../atom.d.ts").ArgVariable,
 *   tag: import("../atom.d.ts").Tag,
 * ) => [
 *   import("../atom.d.ts").ResExpression,
 *   import("../atom.d.ts").ResExpression,
 * ]}
 */
const makeVariableEntry = (variable, tag) => [
  makePrimitiveExpression(variable, tag),
  makeReadExpression(mangleOriginalVariable(variable), tag),
];

/**
 * @type {(
 *   parameter: import("../../lang/syntax.d.ts").Parameter,
 *   tag: import("../atom.d.ts").Tag,
 * ) => [
 *   import("../atom.d.ts").ResExpression,
 *   import("../atom.d.ts").ResExpression,
 * ]}
 */
const makeParameterEntry = (parameter, tag) => [
  makePrimitiveExpression(parameter, tag),
  makeReadExpression(parameter, tag),
];

/**
 * @type {(
 *   parameters: import("../../lang/syntax.d.ts").Parameter[],
 *   variables: import("../atom.d.ts").ArgVariable[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
const makeFrameExpression = (parameters, variables, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makeIntrinsicExpression("undefined", tag),
    concat_XX(
      makePrimitiveExpression(null, tag),
      flatMap(parameters, (parameter) => makeParameterEntry(parameter, tag)),
      flatMap(variables, (variable) => makeVariableEntry(variable, tag)),
    ),
    tag,
  );

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").ControlKind,
 *   parameters: import("../../lang/syntax.d.ts").Parameter[],
 *   variables: import("../atom.d.ts").ArgVariable[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapBlockDeclaration = (
  { "block@declaration": predicate },
  depth,
  kind,
  parameters,
  variables,
  tag,
) =>
  predicate(kind, tag)
    ? makeExpressionEffect(
        makeTrapExpression(
          "block@declaration",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeFrameExpression(parameters, variables, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   parameter: import("../../lang/syntax.d.ts").Parameter,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResEffect}
 */
const makeOverwriteParameterEffect = (parameter, tag) =>
  makeWriteEffect(
    parameter,
    makeApplyExpression(
      makeIntrinsicExpression("aran.getValueProperty", tag),
      makeIntrinsicExpression("undefined", tag),
      [
        makeReadExpression(FRAME_VARIABLE, tag),
        makePrimitiveExpression(parameter, tag),
      ],
      tag,
    ),
    tag,
  );

/**
 * @type {(
 *   parameter: import("../atom.d.ts").ArgVariable,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResEffect}
 */
const makeOverwriteVariableEffect = (variable, tag) =>
  makeWriteEffect(
    mangleOriginalVariable(variable),
    makeApplyExpression(
      makeIntrinsicExpression("aran.getValueProperty", tag),
      makeIntrinsicExpression("undefined", tag),
      [
        makeReadExpression(FRAME_VARIABLE, tag),
        makePrimitiveExpression(variable, tag),
      ],
      tag,
    ),
    tag,
  );

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").ControlKind,
 *   parameters: import("../../lang/syntax.d.ts").Parameter[],
 *   variables: import("../atom.d.ts").ArgVariable[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapBlockDeclarationOverwrite = (
  { "block@declaration-overwrite": predicate },
  depth,
  kind,
  parameters,
  variables,
  tag,
) =>
  predicate(kind, tag)
    ? [
        makeWriteEffect(
          FRAME_VARIABLE,
          makeTrapExpression(
            "block@declaration-overwrite",
            [
              makeReadExpression(mangleStateVariable(depth), tag),
              makePrimitiveExpression(kind, tag),
              makeFrameExpression(parameters, variables, tag),
              makeJsonExpression(tag, tag),
            ],
            tag,
          ),
          tag,
        ),
        map(parameters, (parameter) =>
          makeOverwriteParameterEffect(parameter, tag),
        ),
        map(variables, (variable) =>
          makeOverwriteVariableEffect(variable, tag),
        ),
      ]
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").GeneratorKind,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapGeneratorBlockSuspension = (
  { "generator-block@suspension": predicate },
  depth,
  kind,
  tag,
) =>
  predicate(kind, tag)
    ? makeExpressionEffect(
        makeTrapExpression(
          "generator-block@suspension",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").GeneratorKind,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapGeneratorBlockResumption = (
  { "generator-block@resumption": predicate },
  depth,
  kind,
  tag,
) =>
  predicate(kind, tag)
    ? makeExpressionEffect(
        makeTrapExpression(
          "generator-block@resumption",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").RoutineKind,
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapRoutineBlockAfter = (
  {
    "program-block@after": program_predicate,
    "closure-block@after": closure_predicate,
  },
  depth,
  kind,
  argument,
  tag,
) => {
  if (isProgramKind(kind)) {
    return program_predicate(kind, tag)
      ? makeTrapExpression(
          "program-block@after",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            argument,
            makeJsonExpression(tag, tag),
          ],
          tag,
        )
      : argument;
  } else if (isClosureKind(kind)) {
    return closure_predicate(kind, tag)
      ? makeTrapExpression(
          "closure-block@after",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            argument,
            makeJsonExpression(tag, tag),
          ],
          tag,
        )
      : argument;
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").SegmentKind,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapSegmentBlockAfter = (
  { "segment-block@after": predicate },
  depth,
  kind,
  tag,
) =>
  predicate(kind, tag)
    ? makeExpressionEffect(
        makeTrapExpression(
          "segment-block@after",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").ControlKind,
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapBlockThrowing = (
  { "block@throwing": predicate },
  depth,
  kind,
  argument,
  tag,
) =>
  predicate(kind, tag)
    ? makeTrapExpression(
        "block@throwing",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(kind, tag),
          argument,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").ControlKind,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapBlockTeardown = (
  { "block@teardown": predicate },
  depth,
  kind,
  tag,
) =>
  predicate(kind, tag)
    ? makeExpressionEffect(
        makeTrapExpression(
          "block@teardown",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(kind, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   label: import("../atom.d.ts").Label,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
export const trapBreakBefore = (
  { "break@before": predicate },
  depth,
  label,
  tag,
) =>
  predicate(label, tag)
    ? makeExpressionEffect(
        makeTrapExpression(
          "break@before",
          [
            makeReadExpression(mangleStateVariable(depth), tag),
            makePrimitiveExpression(label, tag),
            makeJsonExpression(tag, tag),
          ],
          tag,
        ),
        tag,
      )
    : null;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapDropBefore = (
  { "drop@before": predicate },
  depth,
  argument,
  tag,
) =>
  predicate(tag)
    ? makeTrapExpression(
        "drop@before",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          argument,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   variable: (
 *     | import("../../lang/syntax.d.ts").Parameter
 *     | import("../atom.d.ts").ArgVariable
 *   ),
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapWriteBefore = (
  { "write@before": predicate },
  depth,
  variable,
  argument,
  tag,
) =>
  predicate(variable, tag)
    ? makeTrapExpression(
        "write@before",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(variable, tag),
          argument,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   specifier: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapExportBefore = (
  { "export@before": predicate },
  depth,
  specifier,
  argument,
  tag,
) =>
  predicate(specifier, tag)
    ? makeTrapExpression(
        "export@before",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(specifier, tag),
          argument,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   primitive: import("../../lang/syntax.d.ts").RuntimePrimitive,
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapPrimitiveAfter = (
  { "primitive@after": predicate },
  depth,
  primitive,
  result,
  tag,
) =>
  predicate(primitive, tag)
    ? makeTrapExpression(
        "primitive@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   intrinsic: import("../../lang/syntax.d.ts").Intrinsic,
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapIntrinsicAfter = (
  { "intrinsic@after": predicate },
  depth,
  intrinsic,
  result,
  tag,
) =>
  predicate(intrinsic, tag)
    ? makeTrapExpression(
        "intrinsic@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(intrinsic, tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   variable: (
 *     | import("../../lang/syntax.d.ts").Parameter
 *     | import("../atom.d.ts").ArgVariable
 *   ),
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapReadAfter = (
  { "read@after": predicate },
  depth,
  variable,
  result,
  tag,
) =>
  predicate(variable, tag)
    ? makeTrapExpression(
        "read@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(variable, tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   source: import("estree-sentry").SourceValue,
 *   specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapImportAfter = (
  { "import@after": predicate },
  depth,
  source,
  specifier,
  result,
  tag,
) =>
  predicate(source, specifier, tag)
    ? makeTrapExpression(
        "import@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(source, tag),
          makePrimitiveExpression(specifier, tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: import("../parametrization.d.ts").ClosureKind,
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapClosureAfter = (
  { "closure@after": predicate },
  depth,
  kind,
  result,
  tag,
) =>
  predicate(kind, tag)
    ? makeTrapExpression(
        "closure@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(kind, tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   delegate: boolean,
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapYieldBefore = (
  { "yield@before": predicate },
  depth,
  delegate,
  argument,
  tag,
) =>
  predicate(delegate, tag)
    ? makeTrapExpression(
        "yield@before",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(delegate, tag),
          argument,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   delegate: boolean,
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapYieldAfter = (
  { "yield@after": predicate },
  depth,
  delegate,
  result,
  tag,
) =>
  predicate(delegate, tag)
    ? makeTrapExpression(
        "yield@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(delegate, tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapAwaitBefore = (
  { "await@before": predicate },
  depth,
  argument,
  tag,
) =>
  predicate(tag)
    ? makeTrapExpression(
        "await@before",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          argument,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapAwaitAfter = (
  { "await@after": predicate },
  depth,
  result,
  tag,
) =>
  predicate(tag)
    ? makeTrapExpression(
        "await@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapEvalBefore = (
  { "eval@before": predicate },
  depth,
  argument,
  tag,
) => {
  if (predicate(tag)) {
    return makeTrapExpression(
      "eval@before",
      [
        makeReadExpression(mangleStateVariable(depth), tag),
        argument,
        makeJsonExpression(tag, tag),
      ],
      tag,
    );
  } else {
    throw new AranPointcutError({
      type: "MissingCut",
      point: "eval@before",
      tag,
    });
  }
};

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   result: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapEvalAfter = (
  { "eval@after": predicate },
  depth,
  result,
  tag,
) =>
  predicate(tag)
    ? makeTrapExpression(
        "eval@after",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          result,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : result;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   kind: "if" | "while" | "conditional",
 *   argument: import("../atom.d.ts").ResExpression,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapTestBefore = (
  { "test@before": predicate },
  depth,
  kind,
  argument,
  tag,
) =>
  predicate(kind, tag)
    ? makeTrapExpression(
        "test@before",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          makePrimitiveExpression(kind, tag),
          argument,
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : argument;

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   callee: import("../atom.d.ts").ResExpression,
 *   self: import("../atom.d.ts").ResExpression,
 *   input: import("../atom.d.ts").ResExpression[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapApplyAround = (
  { "apply@around": predicate },
  depth,
  callee,
  self,
  input,
  tag,
) =>
  predicate(tag)
    ? makeTrapExpression(
        "apply@around",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          callee,
          self,
          makeApplyExpression(
            makeIntrinsicExpression("Array.of", tag),
            makeIntrinsicExpression("undefined", tag),
            input,
            tag,
          ),
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : makeApplyExpression(callee, self, input, tag);

/**
 * @type {(
 *   pointcut: import("./aspect-internal.d.ts").NormalInternalPointcut,
 *   depth: import("../depth.d.ts").Depth,
 *   callee: import("../atom.d.ts").ResExpression,
 *   input: import("../atom.d.ts").ResExpression[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
export const trapConstructAround = (
  { "construct@around": predicate },
  depth,
  callee,
  input,
  tag,
) =>
  predicate(tag)
    ? makeTrapExpression(
        "construct@around",
        [
          makeReadExpression(mangleStateVariable(depth), tag),
          callee,
          makeApplyExpression(
            makeIntrinsicExpression("Array.of", tag),
            makeIntrinsicExpression("undefined", tag),
            input,
            tag,
          ),
          makeJsonExpression(tag, tag),
        ],
        tag,
      )
    : makeConstructExpression(callee, input, tag);
