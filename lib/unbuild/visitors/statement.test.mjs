import { parseScript } from "../../parse.fixture.mjs";
import { assertEqual } from "../../test.fixture.mjs";
import { map } from "../../util/index.mjs";
import { listSwitchRemainder } from "./statement.mjs";

/**
 * @type {(
 *   source: string,
 *   identifiers: string[],
 * ) => void}
 */
const test = (source, identifiers) => {
  const node = parseScript(source);
  assertEqual(node.body.length, 1);
  assertEqual(node.body[0].type, "SwitchStatement");
  assertEqual(
    map(listSwitchRemainder(node.body[0]), (node) => {
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
