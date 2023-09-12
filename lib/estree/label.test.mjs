import { drill, assertEqual } from "../test.fixture.mjs";
import { parseScript } from "../parse.fixture.mjs";
import { hasEmptyBreak, hasEmptyContinue } from "./label.mjs";

const LABEL = "label";

/** @type {(query: (node: estree.Node) => boolean) => (code: string, result: boolean) => void} */
const compileTest = (query) => (code, result) => {
  assertEqual(
    query(
      /** @type {estree.Node} */ (
        drill(parseScript(`${LABEL}: while (true) ${code}`), [
          "body",
          0,
          "body",
          "body",
        ])
      ),
    ),
    result,
  );
};

const testBreak = compileTest(hasEmptyBreak);

const testContinue = compileTest(hasEmptyContinue);

// BreakStatement //
testBreak(`break;`, true);
testBreak(`break ${LABEL};`, false);
testContinue(`break;`, false);

// ContinueStatement //
testBreak(`continue;`, false);
testContinue(`continue;`, true);
testContinue(`continue ${LABEL};`, false);

// BlockStatement //
testBreak(`{ 123; 456; 789; }`, false);
testBreak(`{ 123; break; 456; }`, true);

// LabeledStatement //
testBreak(`LABEL: { 123; }`, false);
testBreak(`LABEL: { break; }`, true);

// IfStatement //
testBreak(`if (123) { 456; } else { 789; }`, false);
testBreak(`if (123) { break; } else { 789; }`, true);
testBreak(`if (123) { 456; } else { break; }`, true);
testBreak(`if (123) { 456; }`, false);
testBreak(`if (123) { break; }`, true);

// TryStatement //
testBreak(`try { 123; } catch { 456; } finally { 789; }`, false);
testBreak(`try { break; } catch { 456; } finally { 789; }`, true);
testBreak(`try { 123; } catch { break; } finally { 789; }`, true);

// WithStatement //
testBreak(`with (123) { 456; }`, false);
testBreak(`with (123) { break; }`, true);

// SwitchStatement //
testBreak(
  `
    switch (123) {
      case 456: 789;
    }
  `,
  false,
);
testBreak(
  `
    switch (123) {
      case 456: break;
    }
  `,
  false,
);
testContinue(
  `
    switch (123) {
      case 456: continue;
    }
  `,
  true,
);
