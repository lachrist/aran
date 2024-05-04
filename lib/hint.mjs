import { AranTypeError } from "./error.mjs";
import { listChild } from "./lang.mjs";
import { createRecord, hasOwn, listValue } from "./util/index.mjs";

/**
 * @type {(
 *   hint: import("./hint").Hint,
 * ) => hint is import("./hint").MetaPropertyHint & {
 *   property: "import.meta",
 * }}
 */
export const isImportMetaHint = (hint) =>
  hint.type === "meta.property" && hint.property === "import.meta";

/**
 * @type {(
 *   hint: import("./hint").Hint,
 * ) => string}
 */
const hashHint = (hint) => {
  switch (hint.type) {
    case "private": {
      return `private.${hint.operation}/${hint.key ?? "*"}`;
    }
    case "lookup": {
      return `lookup.${hint.operation}.${hint.mode}/${hint.variable ?? "*"}`;
    }
    default: {
      throw new AranTypeError(hint);
    }
  }
};

/**
 * @type {(
 *   hint: import("./hint").Hint,
 *   name: string,
 * ) => import("./hint").Hint}
 */
const toStaticHint = (hint, name) => {
  switch (hint.type) {
    case "private": {
      return { ...hint, key: /** @type {estree.PrivateKey} */ (name) };
    }
    case "lookup": {
      return { ...hint, variable: /** @type {estree.Variable} */ (name) };
    }
    default: {
      throw new AranTypeError(hint);
    }
  }
};

/** @type {{[key in string] ?: import("./hint").Hint}} */
const dynamic_hint_record = {
  // @ts-ignore
  "__proto__": null,
  // private //
  "private.has": {
    type: "private",
    operation: "has",
    key: null,
  },
  "private.get": {
    type: "private",
    operation: "get",
    key: null,
  },
  "private.set": {
    type: "private",
    operation: "set",
    key: null,
  },
  // scope //
  "read.strict": {
    type: "lookup",
    operation: "read",
    mode: "strict",
    variable: null,
  },
  "read.sloppy": {
    type: "lookup",
    operation: "read",
    mode: "sloppy",
    variable: null,
  },
  "write.strict": {
    type: "lookup",
    operation: "write",
    mode: "strict",
    variable: null,
  },
  "write.sloppy": {
    type: "lookup",
    operation: "write",
    mode: "sloppy",
    variable: null,
  },
  "typeof.strict": {
    type: "lookup",
    operation: "typeof",
    mode: "strict",
    variable: null,
  },
  "typeof.sloppy": {
    type: "lookup",
    operation: "typeof",
    mode: "sloppy",
    variable: null,
  },
  "discard.sloppy": {
    type: "lookup",
    operation: "discard",
    mode: "sloppy",
    variable: null,
  },
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   root: aran.Program<aran.Atom>,
 * ) => import("./hint").Hint[]}
 */
export const listHint = (root) => {
  /** @type {aran.Node<aran.Atom>[]} */
  const stack = [root];
  let length = 1;
  /** @type {{[key in string]: import("./hint").Hint}} */
  const hints = createRecord();
  while (length > 0) {
    length -= 1;
    const node = stack[length];
    if (node.type === "ApplyExpression") {
      if (node.callee.type === "ReadExpression") {
        if (
          hasOwn(dynamic_hint_record, node.callee.variable) &&
          node.arguments.length > 0 &&
          node.arguments[0].type === "PrimitiveExpression" &&
          typeof node.arguments[0].primitive === "string"
        ) {
          const hint = toStaticHint(
            dynamic_hint_record[node.callee.variable],
            node.arguments[0].primitive,
          );
          hints[hashHint(hint)] = hint;
        }
      } else {
        stack[length] = node.callee;
        length += 1;
      }
      stack[length] = node.this;
      for (const argument of node.arguments) {
        stack[length] = argument;
        length += 1;
      }
    } else if (node.type === "ReadExpression") {
      if (hasOwn(dynamic_hint_record, node.variable)) {
        const hint = dynamic_hint_record[node.variable];
        hints[hashHint(hint)] = hint;
      }
    } else {
      for (const child of listChild(node)) {
        stack[length] = child;
        length += 1;
      }
    }
  }
  return listValue(hints);
};
/* eslint-enable local/no-impure */
