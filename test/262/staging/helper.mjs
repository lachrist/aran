import { record } from "../record/index.mjs";
import { recreateError } from "../util/error.mjs";

const {
  Object: { keys, entries },
  Array: {
    from: toArray,
    prototype: { join },
  },
  Reflect: { apply },
} = globalThis;

export const listKey = /**
 * @type {<K extends string>(
 *   record: {[k in K]: unknown},
 * ) => K[]}
 */ (keys);

export const listEntry = /**
 * @type {<K extends string, V>(
 *   record: {[k in K]?: V},
 * ) => [K, V][]}
 */ (entries);

/**
 * @type {<X, Y>(
 *   array: X[],
 *   transform: (item: X) => Y,
 * ) => Y[]}
 */
export const map = (array, transform) =>
  toArray(
    {
      // @ts-ignore
      __proto__: null,
      length: array.length,
    },
    (_, index) => transform(array[index]),
  );

/**
 * @type {<X>(
 *   array1: X[],
 *   array2: X[],
 * ) => X[]}
 */
export const concat = (array1, array2) => {
  const { length: length1 } = array1;
  const { length: length2 } = array2;
  return toArray(
    /** @type {{length: number}} */ ({
      __proto__: null,
      length: length1 + length2,
    }),
    (_, index) => (index < length1 ? array1[index] : array2[index - length1]),
  );
};

/**
 * @type {<X, Y>(
 *   array: X[],
 *   accumulate: (result: Y, item: X) => Y,
 *   initial: Y,
 * ) => Y}
 */
export const reduce = (array, accumulate, result) => {
  const { length } = array;
  for (let index = 0; index < length; index++) {
    result = accumulate(result, array[index]);
  }
  return result;
};

/**
 * @type {(
 *   parts: string[],
 * ) => string}
 */
export const compileFunctionCode = (parts) => {
  const { length } = parts;
  if (length === 0) {
    return "(function anonymous() {\n})";
  } else {
    const params = toArray(
      {
        // @ts-ignore
        __proto__: null,
        length: length - 1,
      },
      (_, index) => parts[index],
    );
    const body = parts[parts.length - 1];
    return `(function anonymous(${apply(join, params, [","])}\n) {\n${body}\n})`;
  }
};

/**
 * @type {<I, E, P extends string, atom extends import("aran").Atom>(
 *   config: {
 *     toEvalPath: (
 *       kind: "script" | "eval" | "function",
 *     ) => P,
 *     weave: (
 *       root: import("aran").Program<atom>,
 *     ) => import("aran").Program<atom>,
 *     trans: (
 *       path: P,
 *       kind: "script" | "module" | "eval",
 *       code: string,
 *     ) => import("aran").Program<atom>,
 *     retro: (
 *       root: import("aran").Program<atom>,
 *     ) => string,
 *     String: (external: E) => string,
 *     enterValue: (external: E) => I,
 *     leaveValue: (internal: I) => E,
 *     SyntaxError: new (message: string) => unknown,
 *     evalGlobal: E & ((code: string) => E),
 *     evalScript: E & ((code: string) => E),
 *     Function: E,
 *     apply: (callee: I, that: I, input: I[]) => I,
 *     construct: (callee: I, input: I[]) => I,
 *     record_directory: null | URL,
 *   },
 * ) => {
 *   apply: (callee: I, that: I, input: I[]) => I,
 *   construct: (callee: I, input: I[]) => I,
 * }}
 */
export const compileInterceptEval = ({
  toEvalPath,
  weave,
  trans,
  retro,
  enterValue,
  leaveValue,
  String,
  SyntaxError,
  evalGlobal,
  evalScript,
  Function,
  apply,
  construct,
  record_directory,
}) => {
  const syntax_error_mapping = {
    SyntaxError,
    AranSyntaxError: SyntaxError,
  };
  const internals = {
    evalGlobal: enterValue(evalGlobal),
    evalScript: enterValue(evalScript),
    Function: enterValue(Function),
  };
  return {
    apply: (callee, that, input) => {
      if (callee === internals.evalGlobal && input.length > 0) {
        const code = leaveValue(input[0]);
        if (typeof code === "string") {
          try {
            const path = toEvalPath("eval");
            const { content } = record(
              {
                path,
                content: retro(weave(trans(path, "eval", code))),
              },
              record_directory,
            );
            return enterValue(evalGlobal(content));
          } catch (error) {
            throw recreateError(error, syntax_error_mapping);
          }
        }
      }
      if (callee === internals.evalScript && input.length > 0) {
        const code = String(leaveValue(input[0]));
        try {
          const path = toEvalPath("script");
          const { content } = record(
            {
              path,
              content: retro(weave(trans(path, "script", code))),
            },
            record_directory,
          );
          return enterValue(evalScript(content));
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      if (callee === internals.Function) {
        const parts = map(map(input, leaveValue), String);
        try {
          const path = toEvalPath("function");
          const code = compileFunctionCode(parts);
          const { content } = record(
            {
              path,
              content: retro(weave(trans(path, "script", code))),
            },
            record_directory,
          );
          return enterValue(evalGlobal(content));
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      return apply(callee, that, input);
    },
    construct: (callee, input) => {
      if (callee === internals.Function) {
        const parts = map(map(input, leaveValue), String);
        try {
          const path = toEvalPath("function");
          const code = compileFunctionCode(parts);
          const { content } = record(
            {
              path,
              content: retro(weave(trans(path, "script", code))),
            },
            record_directory,
          );
          return enterValue(evalGlobal(content));
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      return construct(callee, input);
    },
  };
};
