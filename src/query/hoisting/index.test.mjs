import {parse as parseAcorn} from "acorn";
import {assertDeepEqual} from "../../__fixture__.mjs";
import {
  makeVarDeclaration,
  makeLetDeclaration,
  makeConstDeclaration,
  makeFunctionDeclaration,
  makeParameterDeclaration,
  makeSimpleParameterDeclaration,
  exportDeclaration,
} from "./declaration.mjs";
import {
  hoistProgram,
  hoistBlockStatement,
  hoistSwitchStatement,
  hoistCatchClauseHead,
  hoistClosureHead,
  hoistClosureBody,
} from "./index.mjs";

const module_options = {
  ecmaVersion: 2021,
  sourceType: "module",
};

const script_options = {
  ecmaVersion: 2021,
  sourceType: "script",
};

const parseScript = (code) => parseAcorn(code, script_options);
const parseModule = (code) => parseAcorn(code, module_options);

assertDeepEqual(
  hoistProgram(parseScript("let x; var y; var y; function f () {}; var f;")),
  [
    makeVarDeclaration("y"),
    makeFunctionDeclaration("f"),
    makeLetDeclaration("x"),
  ],
);
assertDeepEqual(hoistProgram(parseModule("let x; var y; export { x as z };")), [
  exportDeclaration(makeLetDeclaration("x"), "z"),
  makeVarDeclaration("y"),
]);

assertDeepEqual(hoistBlockStatement(parseScript("{ let x; var y; }").body[0]), [
  makeLetDeclaration("x"),
]);

assertDeepEqual(
  hoistSwitchStatement(
    parseScript(
      `
        switch (1) {
          case 2: let x = 3;
          case 4: const y = 5;
          case 6: var z = 7;
        }
      `,
    ).body[0],
  ),
  [makeLetDeclaration("x"), makeConstDeclaration("y")],
);

assertDeepEqual(
  hoistCatchClauseHead(parseScript("try { } catch {}").body[0].handler),
  [],
);
assertDeepEqual(
  hoistCatchClauseHead(parseScript("try { } catch (e) {}").body[0].handler),
  [makeSimpleParameterDeclaration("e")],
);
assertDeepEqual(
  hoistCatchClauseHead(parseScript("try { } catch ([e]) {}").body[0].handler),
  [makeParameterDeclaration("e")],
);

assertDeepEqual(
  hoistClosureHead(parseScript("((x, y) => {});").body[0].expression),
  [makeParameterDeclaration("x"), makeParameterDeclaration("y")],
);
assertDeepEqual(
  hoistClosureHead(parseScript("(function ([x, y]) {});").body[0].expression),
  [makeParameterDeclaration("x"), makeParameterDeclaration("y")],
);
assertDeepEqual(
  hoistClosureHead(parseScript("(function (x, y) {});").body[0].expression),
  [makeSimpleParameterDeclaration("x"), makeSimpleParameterDeclaration("y")],
);

assertDeepEqual(
  hoistClosureBody(parseScript("(() => 123);").body[0].expression),
  [],
);

assertDeepEqual(
  hoistClosureBody(
    parseScript("(function () { let x; var y; });").body[0].expression,
  ),
  [makeVarDeclaration("y"), makeLetDeclaration("x")],
);
