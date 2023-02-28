/* c8 ignore start */
import { reduce } from "array-lite";
import { assertSuccess } from "../../__fixture__.mjs";
import { getOwn } from "../../util/index.mjs";
import { parseBabel } from "../../babel.mjs";
import {
  allignProgram,
  allignBlock,
  allignExpression,
} from "../../allign/index.mjs";
import { createInitialContext, visit } from "./context.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split },
  },
} = globalThis;

const splitPath = (path) => (path === null ? [] : apply(split, path, ["/"]));

const parseInput = (code, path) => {
  const node = parseBabel(code);
  return reduce(splitPath(path), getOwn, node);
};

const compileTestNode =
  (allignNode) => (name, input, path, context, site, output) => {
    // console.log({name, input, path, context, site, output});
    assertSuccess(
      allignNode(
        visit(
          name,
          parseInput(input, path),
          {
            ...createInitialContext(),
            ...context,
          },
          site,
        ),
        output,
      ),
    );
  };

export const testProgram = compileTestNode(allignProgram);

export const testBlock = compileTestNode(allignBlock);

export const testExpression = compileTestNode(allignExpression);
