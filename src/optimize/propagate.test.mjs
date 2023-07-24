import { assertSuccess } from "../__fixture__.mjs";
import { parseBlock } from "../lang/index.mjs";
import { allignBlock } from "../allign/index.mjs";
import { propagate } from "./propagate.mjs";

const testPropagate = (input, output) => {
  assertSuccess(allignBlock(propagate(parseBlock(input)), output));
};

testPropagate(
  `
    {
      let x;
      x = 123;
      void x;
    }
  `,
  `
    {
      let x;
      x = 123;
      void 123;
    }
  `,
);
