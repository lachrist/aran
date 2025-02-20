// // @ts-nocheck
// /* eslint-disable */

import { setupile, transpile, retropile } from "aran";
import { parse } from "acorn";
import { generate } from "astring";

const { eval: evalGlobal } = globalThis;

const _intrinsics = evalGlobal(generate(setupile({})));

const code = `{
  class Foo extends Map {}
  const foo = new Foo();
  foo.has({});
}`;

console.log(
  generate(
    retropile(
      transpile(
        {
          kind: "eval",
          path: "main",
          root: parse(code, {
            sourceType: "script",
            ecmaVersion: "latest",
          }),
        },
        {
          digest: (_node, node_path, _file_path, _node_kind) => node_path,
          global_declarative_record: "builtin",
        },
      ),
      {
        mode: "normal",
      },
    ),
  ),
);
