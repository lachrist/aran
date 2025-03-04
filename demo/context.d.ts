import * as aran from "aran";
import * as linvail from "linvail";

type foo = (typeof aran)["transpile"];

export type Context = {
  target: string;
  log: (message: string) => void;
  aran: typeof aran;
  linvail: typeof linvail;
  astring: {
    generate: (node: { type: "Program" }) => string;
  };
  acorn: {
    parse: (
      code: string,
      options: {
        ecmaVersion: number;
        sourceType: "script" | "module";
      },
    ) => {
      type: "Program";
      sourceType: "script" | "module";
      body: object[];
    };
  };
};
