import {constant_, assert, deadcode_____} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
  makeConditionalEffect,
} from "../../../ast/index.mjs";

import {
  makeDefineExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

const {undefined} = globalThis;

export const KINDS = ["var", "function"];

export const create = (_layer, {dynamic, observable}) => ({
  dynamic,
  observable,
});

export const conflict = constant_(undefined);

export const harvest = constant_({
  header: [],
  prelude: [],
});

export const makeDeclareStatements = (
  _strict,
  {dynamic},
  _kind,
  variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected global imported variable");
  assert(eexports.length === 0, "unexpected global exported variable");
  return [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
          makeLiteralExpression({undefined: null}),
          makeDefineExpression(
            dynamic,
            makeLiteralExpression(variable),
            makeDataDescriptorExpression(
              makeLiteralExpression({undefined: null}),
              makeLiteralExpression(true),
              makeLiteralExpression(true),
              makeLiteralExpression(false),
            ),
          ),
        ),
      ),
    ),
  ];
};

export const makeInitializeStatements = deadcode_____(
  "var/function variables should not be initialized",
);

export const generateMakeLookupNode =
  (makeConditionalNode, makeDynamicLookupNode) =>
  (next, strict, _escaped, {dynamic, observable}, variable, right) =>
    makeConditionalNode(
      makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
      makeDynamicLookupNode(strict, dynamic, variable, right, observable),
      next(),
    );

export const makeLookupEffect = generateMakeLookupNode(
  makeConditionalEffect,
  makeDynamicLookupEffect,
);

export const makeLookupExpression = generateMakeLookupNode(
  makeConditionalExpression,
  makeDynamicLookupExpression,
);
