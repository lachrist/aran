import type { Depth } from "./weave/depth";
import type { Reboot } from "./reboot";
import type { ModuleProgram, Path, ScriptProgram } from "estree-sentry";
import type { HashProp } from "./hash";

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

export type RawProgram = {
  type: "Program";
  sourceType: "module" | "script";
  body: unknown[];
};

export type RawSource = {
  /**
   * The actual `estree.Program` node to instrument.
   */
  root: RawProgram;
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

export type ModuleSource = {
  kind: "module";
  situ: GlobalSitu;
  root: ModuleProgram<HashProp>;
};

export type ScriptSource = {
  kind: "script";
  situ: Situ;
  root: ScriptProgram<HashProp>;
};

export type EvalSource = {
  kind: "eval";
  situ: Situ;
  root: ScriptProgram<HashProp>;
};

export type Source = ModuleSource | ScriptSource | EvalSource;

export type GlobalEvalSource = EvalSource & {
  situ: { type: "global" };
};

export type DeepLocalEvalSource = EvalSource & {
  situ: { type: "local" };
};

export type RootLocalEvalSource = EvalSource & {
  situ: { type: "aran" };
};

export type LocalEvalSource = EvalSource & {
  situ: { type: "local" | "aran" };
};

export type RootSource =
  | ModuleSource
  | ScriptSource
  | GlobalEvalSource
  | RootLocalEvalSource;

export type DeepSource = DeepLocalEvalSource;
