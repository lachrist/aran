
import { isClosureNode } from "../closure.mjs";
import { collectDeclarator } from "./collect.mjs";
import {
  makeVarDeclaration,
  makeLetDeclaration,
  makeConstDeclaration,
  makeSimpleParameterDeclaration,
  makeParameterDeclaration,
} from "./data.mjs";

/////////////////////////
// hoistParameterArray //
/////////////////////////

export const hoistParameterArray = (patterns) => {
  const identifiers = flatMap(patterns, collectPattern);
  return map(
    identifiers,
    every(patterns, isIdentifier)
      ? makeSimpleParameterVariable
      : makeParameterVariable
  );
};

//////////////////
// hoistClosure //
//////////////////


////////////////
// hoistBlock //
////////////////
