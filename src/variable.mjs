// StratifiedStratifiedIdentifier = MetaStratifiedIdentifier / BaseStratifiedIdentifier
// MetaStratifiedIdentifier = $("_" StratifiedIdentifier)
// BaseStratifiedIdentifier = $("$" StratifiedIdentifier)
// StratifiedIdentifier = MetaIdentifier / BaseIdentifier
// BaseIdentifier = "$0newtarget" / $("$" Identifier)
// MetaIdentifier = "_0newtarget" / $("_" Identifier)
// Identifier = "new.target" / $(IdentifierHead IdentifierPart*)
// IdentifierHead = s:(.) & { return /\p{ID_Start}|\$|_/u.test(s) }
// IdentifierPart = s:(.) & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(s) }

import {forEach} from "array-lite";

import {incrementCounter} from "./util.mjs";

const {
  Reflect: {apply},
  String: {
    prototype: {substring},
  },
} = globalThis;

const BASE_HEAD = "$";
const META_HEAD = "_";

const convert_mapping = {__proto__: null};
const revert_mapping = {__proto__: null};
forEach([["new", "target"], ["import, meta"]], (pair) => {
  const meta_property = `${pair[0]}.${pair[1]}`;
  const converted_meta_property = `${BASE_HEAD}0${pair[0]}${pair[1]}`;
  convert_mapping[meta_property] = converted_meta_property;
  revert_mapping[converted_meta_property] = meta_property;
});

const ONE = [1];
export const getVariableBody = (variable) =>
  variable in revert_mapping
    ? revert_mapping[variable]
    : apply(substring, variable, ONE);

export const makeBaseVariable = (variable) =>
  variable in convert_mapping
    ? convert_mapping[variable]
    : `${BASE_HEAD}${variable}`;

export const freshenVariable = (variable, depth, counter) =>
  `${variable}_${depth}_${incrementCounter(counter)}`;

export const makeMetaVariable = (variable) => `${META_HEAD}${variable}`;

export const isBaseVariable = (variable) => variable[0] === BASE_HEAD;

export const isMetaVariable = (variable) => variable[0] === META_HEAD;
