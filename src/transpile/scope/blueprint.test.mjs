import {forEach} from "array-lite";

import "../../__fixture__.mjs";

import {makeLiteralExpression} from "../../ast/index.mjs";

import {partial_x} from "../../util/index.mjs";

import {
  CLOSURE_STATIC_BLOCK,
  CLOSURE_DYNAMIC_BLOCK,
  createParamFrame,
  createConstFrame,
} from "./blueprint.mjs";

forEach(CLOSURE_STATIC_BLOCK, createConstFrame);

forEach(
  CLOSURE_DYNAMIC_BLOCK,
  partial_x(createParamFrame, makeLiteralExpression("dynamic")),
);
