import { map, flatMap, concat, every, filterOut } from "array-lite";
import { isDuplicate } from "../../util/index.mjs";
import {
  checkoutDeclarationArray,
  makeLetDeclaration,
} from "./declaration.mjs";
import { collectPattern } from "./helper.mjs";
import { hoistShallow } from "./hoist-shallow.mjs";
import { hoistDeep } from "./hoist-deep.mjs";

const isIdentifier = ({ type }) => type === "Identifier";

const getName = ({ name }) => name;

export const hoistBodyShallow = (nodes) =>
  checkoutDeclarationArray(flatMap(nodes, hoistShallow));

export const hoistBodyDeep = (nodes) =>
  checkoutDeclarationArray(
    concat(flatMap(nodes, hoistDeep), flatMap(nodes, hoistShallow)),
  );

export const hoistHead = (patterns) =>
  checkoutDeclarationArray(
    map(
      every(patterns, isIdentifier)
        ? filterOut(map(patterns, getName), isDuplicate)
        : flatMap(patterns, collectPattern),
      makeLetDeclaration,
    ),
  );
