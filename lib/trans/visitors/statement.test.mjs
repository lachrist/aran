import { guardScriptProgram } from "estree-sentry";
import { parseScript } from "../../parse.fixture.mjs";
import { assertEqual } from "../../test.fixture.mjs";
import { map } from "../../util/index.mjs";
import { listSwitchRemainder } from "./statement.mjs";

const { Error } = globalThis;

/**
 * @type {(
 *   source: string,
 *   identifiers: string[],
 * ) => void}
 */
const test = (source, identifiers) => {
  const node = guardScriptProgram(parseScript(source));
  if (node.body.length !== 1) {
    throw new Error("Expected a switch statement.");
  }
  const head = node.body[0];
  if (head.type !== "SwitchStatement") {
    throw new Error("Expected a switch statement.");
  }
  assertEqual(
    map(listSwitchRemainder(head), (node) => {
      assertEqual(node.type, "ExpressionStatement");
      assertEqual(node.expression.type, "Identifier");
      return node.expression.name;
    }),
    identifiers,
  );
};

test(
  `
    switch (discriminant) {}
  `,
  [],
);

test(
  `
    switch (discriminant) {
      case head1: body1;
      case head2: body2;
    }
  `,
  [],
);

test(
  `
    switch (discriminant) {
      case head1: body1;
      case head2: body2;
      default: body;
    }
  `,
  [],
);

test(
  `
    switch (discriminant) {
      case head1: body1;
      default: body;
      case head2: body2;
    }
  `,
  ["body", "body2"],
);

test(
  `
    switch (discriminant) {
      default: body;
      case head1: body1;
      case head2: body2;
    }
  `,
  ["body", "body1", "body2"],
);
