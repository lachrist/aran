import { assertDeepEqual } from "../../__fixture__.mjs";
import { parseScript } from "../../__fixture__parser__.mjs";
import { makeVarDeclaration, makeLetDeclaration } from "./declaration.mjs";
import { hoistBodyDeep, hoistBodyShallow, hoistHead } from "./index.mjs";

assertDeepEqual(hoistBodyShallow(parseScript("var x; let y").body), [
  makeLetDeclaration("y"),
]);

assertDeepEqual(hoistBodyDeep(parseScript("var x; let y").body), [
  makeVarDeclaration("x"),
  makeLetDeclaration("y"),
]);

assertDeepEqual(hoistHead(parseScript("function f (x, x) {}").body[0].params), [
  makeLetDeclaration("x"),
]);

assertDeepEqual(
  hoistHead(parseScript("function f ([x, y]) {}").body[0].params),
  [makeLetDeclaration("x"), makeLetDeclaration("y")],
);
