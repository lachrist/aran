export type GlobalOptions = import("./program.js").GlobalProgram & {
  mode: "sloppy";
  base: import("../../type/options.d.ts").Base;
  context: null;
};

export type AlienLocalOptions = import("./program.js").AlienLocalProgram & {
  mode: "strict" | "sloppy";
  base: import("../../type/options.d.ts").Base;
  context: null;
};

export type ReifyLocalOptions = import("./program.js").ReifyLocalProgram & {
  mode: null;
  base: import("../../type/options.d.ts").Base;
  context: import("./context.d.ts").EvalContext;
};

export type RootOptions = GlobalOptions | AlienLocalOptions;

export type NodeOptions = ReifyLocalOptions;

export type Options = RootOptions | NodeOptions;
