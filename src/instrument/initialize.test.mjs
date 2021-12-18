/* eslint-disable no-unused-vars */

import {assertEqual, assertThrow} from "../__fixture__.mjs";
import {allignExpression} from "../allign/index.mjs";
import {makeFullBreakLabel} from "../label.mjs";
import {makeBaseVariable} from "../variable.mjs";

import {
  makeVarVariable,
  makeLabVariable,
  makeOldVariable,
  makeNewVariable,
  makeRECVariable,
  makeWECVariable,
  makeTECVariable,
} from "./variable.mjs";

import {
  makeInitializeExpression,
  PERFORM_SET_SUPER_ENCLAVE,
  PERFORM_GET_SUPER_ENCLAVE,
  PERFORM_CALL_SUPER_ENCLAVE,
  PERFORM_DYNAMIC_IMPORT,
} from "./initialize.mjs";

assertEqual(
  allignExpression(
    makeInitializeExpression(makeLabVariable(makeFullBreakLabel("label"))),
    `({
      __proto__: null,
      ["kind"]: "break",
      ["name"]: "label",
      ["identifier"]: "${makeFullBreakLabel("label")}",
    })`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeVarVariable(makeBaseVariable("variable"))),
    `({
      __proto__: null,
      ["kind"]: "base",
      ["name"]: "variable",
      ["identifier"]: "${makeBaseVariable("variable")}",
    })`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeRECVariable("variable")),
    `(() => {
      return $variable;
    });`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeTECVariable("variable")),
    `(() => {
      return typeof $variable;
    });`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeWECVariable("variable")),
    `(() => {
      return (
        $variable = intrinsic("Reflect.get")(undefined, input, 0),
        undefined
      );
    });`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeNewVariable(PERFORM_DYNAMIC_IMPORT)),
    `(() => {
      return import(
        intrinsic("Reflect.get")(undefined, input, 0),
      );
    })`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeNewVariable(PERFORM_GET_SUPER_ENCLAVE)),
    `(() => {
      return $super[
        intrinsic("Reflect.get")(undefined, input, 0)
      ];
    })`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeNewVariable(PERFORM_CALL_SUPER_ENCLAVE)),
    `(() => {
      return $super(
        ... intrinsic("Reflect.get")(undefined, input, 0),
      );
    })`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeInitializeExpression(makeNewVariable(PERFORM_SET_SUPER_ENCLAVE)),
    `(() => {
      let _input;
      _input = input;
      $super[
        intrinsic("Reflect.get")(undefined, _input, 0)
      ] = intrinsic("Reflect.get")(undefined, _input, 1);
      return undefined;
    })`,
  ),
  null,
);

assertThrow(() =>
  makeInitializeExpression(makeNewVariable("UNKNOWN_NEW_VARIABLE")),
);

assertThrow(() => makeInitializeExpression(makeOldVariable("variable")));
