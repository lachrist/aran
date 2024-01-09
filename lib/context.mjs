import { AranTypeError } from "./error.mjs";
import { removeDuplicate } from "./util/index.mjs";

///////////////
// Predicate //
///////////////

/**
 * @type {(
 *   context: import("./context").Context
 * ) => context is import("./context").ModuleContext}
 */
export const isModuleContext = (context) => context.source === "module";

/**
 * @type {(
 *   context: import("./context").Context
 * ) => context is import("./context").ScriptContext}
 */
export const isScriptContext = (context) => context.source === "script";

/**
 * @type {(
 *   context: import("./context").Context
 * ) => context is import("./context").EvalContext}
 */
export const isEvalContext = (context) =>
  context.source === "global-eval" ||
  context.source === "local-eval" ||
  context.source === "aran-eval";

/**
 * @type {(
 *   context: import("./context").Context
 * ) => context is import("./context").GlobalContext}
 */
export const isGlobalContext = (context) =>
  context.source === "module" ||
  context.source === "script" ||
  context.source === "global-eval";

/**
 * @type {(
 *   context: import("./context").Context
 * ) => context is import("./context").LocalContext}
 */
export const isLocalContext = (context) =>
  context.source === "local-eval" || context.source === "aran-eval";

/**
 * @type {(
 *   context: import("./context").Context
 * ) => context is import("./context").RootContext}
 */
export const isRootContext = (context) =>
  context.source === "module" ||
  context.source === "script" ||
  context.source === "global-eval" ||
  context.source === "local-eval";

/**
 * @type {(
 *   context: import("./context").Context
 * ) => context is import("./context").NodeContext}
 */
export const isNodeContext = (context) => context.source === "aran-eval";

////////////
// Getter //
////////////

/**
 * @type {<C extends import("./context").Context>(
 *   context: import("./context").Context,
 * ) => C}
 */
export const useStrictContext = (context) =>
  /** @type {any} */ ({
    ...context,
    mode: "strict",
  });

/**
 * @type {(
 *   context: import("./context").RootContext,
 * ) => "strict" | "sloppy"}
 */
export const getRootContextMode = (context) => {
  if (context.source === "module") {
    return "strict";
  } else if (context.source === "script" || context.source === "global-eval") {
    return "sloppy";
  } else if (context.source === "local-eval") {
    return context.mode;
  } else {
    throw new AranTypeError(context);
  }
};

/**
 * @type {(
 *   context: import("./context").RootContext,
 * ) => "reify" | "alien"}
 */
export const getRootContextScope = (context) => {
  if (
    context.source === "module" ||
    context.source === "script" ||
    context.source === "global-eval"
  ) {
    return context.scope;
  } else if (context.source === "local-eval") {
    return "alien";
  } else {
    throw new AranTypeError(context);
  }
};

/**
 * @type {(
 *   context: import("./context").Context,
 * ) => import("./header").HeaderParameter[]}
 */
export const listContextParameter = (context) => {
  if (context.source === "module") {
    if (context.scope === "reify") {
      return ["import.meta", "import.dynamic"];
    } else if (context.scope === "alien") {
      return ["import.meta", "import.dynamic", "lookup.strict"];
    } else {
      throw new AranTypeError(context.scope);
    }
  } else if (context.source === "script" || context.source === "global-eval") {
    if (context.scope === "reify") {
      return ["import.dynamic"];
    } else if (context.scope === "alien") {
      if (context.mode === "strict") {
        return ["import.dynamic", "lookup.strict"];
      } else if (context.mode === "sloppy") {
        return ["import.dynamic", "lookup.strict", "lookup.sloppy"];
      } else {
        throw new AranTypeError(context.mode);
      }
    } else {
      throw new AranTypeError(context.scope);
    }
  } else if (context.source === "local-eval") {
    if (context.mode === "sloppy") {
      return [
        "this",
        "import.dynamic",
        "lookup.strict",
        "lookup.sloppy",
        ...removeDuplicate(context.scope),
      ];
    } else if (context.mode === "strict") {
      return [
        "this",
        "import.dynamic",
        "lookup.strict",
        "private",
        ...removeDuplicate(context.scope),
      ];
    } else {
      throw new AranTypeError(context.mode);
    }
  } else if (context.source === "aran-eval") {
    return [];
  } else {
    throw new AranTypeError(context);
  }
};
