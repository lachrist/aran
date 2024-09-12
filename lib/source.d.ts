import type { Path } from "./path";
import type {
  ModuleProgram as EstreeModuleProgram,
  ScriptProgram as EstreeScriptProgram,
  Program as EstreeProgram,
} from "./estree";
import type { Depth } from "./weave/depth";
import type { Reboot } from "./reboot";

export type GlobalSitu = {
  type: "global";
};

export type RootLocalSitu = {
  type: "local";
  mode: "strict" | "sloppy";
};

export type DeepLocalSitu = Reboot & {
  type: "aran";
  depth: Depth;
};

export type Situ = GlobalSitu | RootLocalSitu | DeepLocalSitu;

export type PartialSource = {
  /**
   * The actual `estree.Program` node to instrument.
   */
  root: EstreeProgram;
  /**
   * Indicates how the source will be executed.
   *
   * Default: either `"script"` or `"module"` based on `source.root.sourceType`.
   */
  kind?: "module" | "script" | "eval";
  /**
   * Further precises the context in which the source will be executed. Only
   * relevant when `source.kind` is `"eval"`.
   *
   * - `GlobalSitu`: The source will be executed in the global context. It is
   * the only valid option when `source.kind` is `"module"` or `"script"`.
   * - `RootLocalSitu`: The source will be executed in a local context that is
   * not controlled by Aran -- ie: a direct eval call within non-instrumented
   * code.
   * - `DeepLocalSitu`: The source will be executed in a local context that is
   * controlled by Aran -- ie: direct eval call within instrumented code. This
   * data structure is provided by Aran as argument to the `eval@before` aspect.
   *
   * Default: `{ type: "global" }`.
   */
  situ?: Situ;
  /**
   * Aspect functions will receive the location of the current node as a JSON
   * path. This value will be used as the root segment for all the path of all
   * nodes residing in `source.root`.
   *
   * Default: `"$"`.
   */
  path?: Path;
};

export type Source =
  | {
      kind: "module";
      situ: GlobalSitu;
      path: Path;
      root: EstreeModuleProgram;
    }
  | {
      kind: "script";
      situ: GlobalSitu;
      path: Path;
      root: EstreeScriptProgram;
    }
  | {
      kind: "eval";
      situ: Situ;
      path: Path;
      root: EstreeScriptProgram;
    };

export type ModuleSource = Source & {
  kind: "module";
};

export type ScriptSource = Source & {
  kind: "script";
};

export type EvalSource = Source & {
  kind: "eval";
};

export type GlobalEvalSource = Source & {
  kind: "eval";
  situ: { type: "global" };
};

export type DeepLocalEvalSource = Source & {
  kind: "eval";
  situ: { type: "local" };
};

export type RootLocalEvalSource = Source & {
  kind: "eval";
  situ: { type: "aran" };
};

export type LocalEvalSource = Source & {
  kind: "eval";
  situ: { type: "local" | "aran" };
};

export type RootSource = Source & {
  situ: { type: "global" | "local" };
};

export type DeepSource = Source & {
  situ: { type: "aran" };
};
