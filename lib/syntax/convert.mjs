/* eslint-disable no-use-before-define */

import { slice, map, hasOwn, includes, join } from "../util/index.mjs";

import {
  INTRINSIC_ENUM,
  isParameter,
  makeAggregateLink,
  makeExportLink,
  makeImportLink,
} from "../node.mjs";
import { convertLabel, convertVariable } from "./identifier.mjs";

const { String, undefined, SyntaxError } = globalThis;

/** @type {convert.Location} */
const MISSING_LOCATION = { line: 0, column: 0 };

/** @type {(loc: estree.SourceLocation | null | undefined) => convert.Location} */
const locate = (loc) => (loc ? loc.start : MISSING_LOCATION);

/** @type {(node: estree.Node) => SyntaxError} */
const makeSyntaxError = (node) =>
  new SyntaxError(
    `Node ${node.type} at ${
      node.loc
        ? `${String(node.loc.start.line)}:${String(node.loc.start.column)}`
        : /* c8 ignore next */ "???"
    }`,
  );

/** @type {(node: estree.Pattern) => aran.Parameter | convert.Variable}  */
const convertIdentifier = (node) => {
  /* c8 ignore next 3 */
  if (node.type !== "Identifier") {
    throw makeSyntaxError(node);
  }
  return convertVariable(/** @type {estree.Variable} */ (node.name));
};

/** @type {(node: estree.VariableDeclarator) => convert.Variable} */
const convertVariableDeclarator = (node) => {
  /* c8 ignore next 3 */
  if (node.init !== null) {
    throw makeSyntaxError(node);
  }
  const variable = convertIdentifier(node.id);
  /* c8 ignore next 3 */
  if (isParameter(variable)) {
    throw makeSyntaxError(node);
  }
  return variable;
};

/** @type {(node: estree.VariableDeclaration) => convert.Variable[]} */
const convertVariableDeclaration = (node) => {
  /* c8 ignore next 3 */
  if (node.kind !== "let") {
    throw makeSyntaxError(node);
  }
  return map(node.declarations, convertVariableDeclarator);
};

/** @type {(node: estree.Program) => aran.Program<convert.Atom>} */
export const convertProgram = (node) => {
  /* c8 ignore next 3 */
  if (node.body.length < 1) {
    throw makeSyntaxError(node);
  }
  /* c8 ignore next 3 */
  if (node.body[0].type !== "ExpressionStatement") {
    throw makeSyntaxError(node);
  }
  /* c8 ignore next 3 */
  if (node.body[0].expression.type !== "Literal") {
    throw makeSyntaxError(node);
  }
  const directive = node.body[0].expression.value;
  if (directive === "script") {
    return {
      type: "ScriptProgram",
      body: convertPseudoBlock(slice(node.body, 1, node.body.length), node),
      tag: locate(node.loc),
    };
  } else if (directive === "module") {
    /* c8 ignore next 3 */
    if (node.body.length < 2) {
      throw makeSyntaxError(node);
    }
    return {
      type: "ModuleProgram",
      links: map(slice(node.body, 1, node.body.length - 1), convertLink),
      body: convertClosureBlock(node.body[node.body.length - 1]),
      tag: locate(node.loc),
    };
  } else if (directive === "eval") {
    /* c8 ignore next 3 */
    if (node.body.length !== 2) {
      throw makeSyntaxError(node);
    }
    return {
      type: "EvalProgram",
      body: convertClosureBlock(node.body[1]),
      tag: locate(node.loc),
    };
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Node) => aran.Link<convert.Atom>} */
export const convertLink = (node) => {
  if (node.type === "ImportDeclaration") {
    if (node.specifiers.length === 0) {
      return makeImportLink(
        /** @type {convert.Source} */ (node.source.value),
        null,
        locate(node.loc),
      );
    } else {
      /* c8 ignore next 3 */
      if (node.specifiers.length !== 1) {
        throw makeSyntaxError(node);
      }
      /* c8 ignore next 3 */
      if (node.specifiers[0].type !== "ImportSpecifier") {
        throw makeSyntaxError(node);
      }
      /* c8 ignore next 3 */
      if (node.specifiers[0].imported.name !== node.specifiers[0].local.name) {
        throw makeSyntaxError(node);
      }
      return makeImportLink(
        /** @type {convert.Source} */ (node.source.value),
        /** @type {convert.Specifier} */ (node.specifiers[0].imported.name),
        locate(node.loc),
      );
    }
  } else if (node.type === "ExportAllDeclaration") {
    return makeAggregateLink(
      /** @type {convert.Source} */ (node.source.value),
      null,
      /** @type {convert.Specifier} */ (
        node.exported === null ? null : node.exported.name
      ),
      locate(node.loc),
    );
  } else if (node.type === "ExportNamedDeclaration") {
    /* c8 ignore next 3 */
    if (node.declaration !== null) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.specifiers.length !== 1) {
      throw makeSyntaxError(node);
    }
    if (node.source == null) {
      /* c8 ignore next 3 */
      if (node.specifiers[0].exported.name !== node.specifiers[0].local.name) {
        throw makeSyntaxError(node);
      }
      return makeExportLink(
        /** @type {convert.Specifier} */ (node.specifiers[0].exported.name),
        locate(node.loc),
      );
    } else {
      return makeAggregateLink(
        /** @type {convert.Source} */ (node.source.value),
        /** @type {convert.Specifier} */ (node.specifiers[0].local.name),
        /** @type {convert.Specifier} */ (node.specifiers[0].exported.name),
        locate(node.loc),
      );
    }
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(nodes: estree.Node[]) => { head: convert.Variable[], tail: estree.Node[]}} */
const splitDeclaration = (nodes) =>
  nodes.length > 0 &&
  nodes[0].type === "VariableDeclaration" &&
  nodes[0].kind === "let" &&
  nodes[0].declarations[0].init == null
    ? {
        head: convertVariableDeclaration(nodes[0]),
        tail: slice(nodes, 1, nodes.length),
      }
    : {
        head: [],
        tail: nodes,
      };

/** @type {(nodes: estree.Node[], parent: estree.Node) => { init: estree.Node[], last: estree.Node}} */
const splitCompletion = (nodes, parent) => {
  /* c8 ignore next 3 */
  if (nodes.length === 0) {
    throw makeSyntaxError(parent);
  }
  const node = nodes[nodes.length - 1];
  /* c8 ignore next 3 */
  if (node.type !== "ExpressionStatement") {
    throw makeSyntaxError(parent);
  }
  return {
    init: slice(nodes, 0, nodes.length - 1),
    last: node.expression,
  };
};

/** @type {(nodes: estree.Node[], parent: estree.Node) => aran.PseudoBlock<convert.Atom>} */
export const convertPseudoBlock = (nodes, parent) => {
  const { init, last } = splitCompletion(nodes, parent);
  return {
    type: "PseudoBlock",
    statements: map(init, convertStatement),
    completion: convertExpression(last),
    tag: locate(null),
  };
};

/** @type {(node: estree.Node) => aran.ClosureBlock<convert.Atom>} */
export const convertClosureBlock = (node) => {
  /* c8 ignore next 3 */
  if (node.type !== "BlockStatement") {
    throw makeSyntaxError(node);
  }
  const { head, tail } = splitDeclaration(node.body);
  const { init, last } = splitCompletion(tail, node);
  return {
    type: "ClosureBlock",
    variables: head,
    statements: map(init, convertStatement),
    completion: convertExpression(last),
    tag: locate(node.loc),
  };
};

/** @type {(node: estree.Node, labels: estree.Label[]) => aran.ControlBlock<convert.Atom>} */
export const convertControlBlockInner = (node, labels) => {
  if (node.type === "LabeledStatement") {
    return convertControlBlockInner(node.body, [
      ...labels,
      /** @type {estree.Label} */ (node.label.name),
    ]);
  } else if (node.type === "BlockStatement") {
    const { head: variables, tail: body } = splitDeclaration(node.body);
    return {
      type: "ControlBlock",
      labels: map(labels, convertLabel),
      variables,
      statements: map(body, convertStatement),
      tag: locate(node.loc),
    };
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Node) => aran.ControlBlock<convert.Atom>} */
export const convertControlBlock = (node) => convertControlBlockInner(node, []);

// TODO: differentiate with genuinely nested labeled statement.
/** @type {(node: estree.BlockStatement) => aran.ControlBlock<convert.Atom>} */
export const convertNakedControlBlock = (node) =>
  node.type === "BlockStatement" &&
  node.body.length === 1 &&
  node.body[0].type === "LabeledStatement"
    ? convertControlBlock(node.body[0])
    : convertControlBlock(node);

/** @type {(node: estree.Node) => aran.Statement<convert.Atom>} */
export const convertStatement = (node) => {
  if (node.type === "BlockStatement") {
    return {
      type: "BlockStatement",
      do: convertControlBlock(node),
      tag: locate(node.loc),
    };
  } else if (node.type === "LabeledStatement") {
    return {
      type: "BlockStatement",
      do: convertControlBlockInner(node.body, [
        /** @type {estree.Label} */ (node.label.name),
      ]),
      tag: locate(node.loc),
    };
  } else if (node.type === "TryStatement") {
    /* c8 ignore next 3 */
    if (node.handler == null) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.handler.param !== null) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.finalizer == null) {
      throw makeSyntaxError(node);
    }
    return {
      type: "TryStatement",
      try: convertNakedControlBlock(node.block),
      catch: convertNakedControlBlock(node.handler.body),
      finally: convertNakedControlBlock(node.finalizer),
      tag: locate(node.loc),
    };
  } else if (node.type === "IfStatement") {
    /* c8 ignore next 3 */
    if (node.alternate == null) {
      throw makeSyntaxError(node);
    }
    return {
      type: "IfStatement",
      if: convertExpression(node.test),
      then: convertControlBlock(node.consequent),
      else: convertControlBlock(node.alternate),
      tag: locate(node.loc),
    };
  } else if (node.type === "WhileStatement") {
    return {
      type: "WhileStatement",
      while: convertExpression(node.test),
      do: convertControlBlock(node.body),
      tag: locate(node.loc),
    };
  } else if (node.type === "DebuggerStatement") {
    return {
      type: "DebuggerStatement",
      tag: locate(node.loc),
    };
  } else if (node.type === "ExpressionStatement") {
    return {
      type: "EffectStatement",
      inner: convertEffect(node.expression),
      tag: locate(node.loc),
    };
  } else if (node.type === "ReturnStatement") {
    /* c8 ignore next 3 */
    if (node.argument == null) {
      throw makeSyntaxError(node);
    }
    return {
      type: "ReturnStatement",
      result: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "BreakStatement") {
    /* c8 ignore next 3 */
    if (node.label == null) {
      throw makeSyntaxError(node);
    }
    return {
      type: "BreakStatement",
      label: convertLabel(/** @type {estree.Label} */ (node.label.name)),
      tag: locate(node.loc),
    };
  } else if (node.type === "VariableDeclaration") {
    /* c8 ignore next 3 */
    if (node.declarations.length !== 1) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.declarations[0].init == null) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.declarations[0].id.type !== "ArrayPattern") {
      throw makeSyntaxError(node);
    } /* c8 ignore next 3 */
    if (node.declarations[0].id.elements.length !== 1) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.declarations[0].id.elements[0] === null) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.declarations[0].id.elements[0].type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return {
      type: "DeclareEnclaveStatement",
      kind: node.kind,
      variable: /** @type {convert.EnclaveVariable} */ (
        node.declarations[0].id.elements[0].name
      ),
      right: convertExpression(node.declarations[0].init),
      tag: locate(node.loc),
    };
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Node) => convert.Specifier} */
export const convertSpecifier = (node) => {
  if (node.type === "Literal") {
    /* c8 ignore next 3 */
    if (typeof node.value !== "string") {
      throw makeSyntaxError(node);
    }
    return /** @type {convert.Specifier} */ (node.value);
  } else if (node.type === "Identifier") {
    return /** @type {convert.Specifier} */ (node.name);
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Node) => aran.Effect<convert.Atom>[]} */
export const convertEffectArray = (node) => {
  if (node.type === "SequenceExpression") {
    return map(node.expressions, convertEffect);
  } else if (node.type === "Identifier") {
    /* c8 ignore next 3 */
    if (node.name !== "undefined") {
      throw makeSyntaxError(node);
    }
    return [];
  } else {
    return [convertEffect(node)];
  }
};

/** @type {(node: estree.Node) => aran.Effect<convert.Atom>} */
export const convertEffect = (node) => {
  if (node.type === "ConditionalExpression") {
    return {
      type: "ConditionalEffect",
      condition: convertExpression(node.test),
      positive: convertEffectArray(node.consequent),
      negative: convertEffectArray(node.alternate),
      tag: locate(node.loc),
    };
  } else if (node.type === "UnaryExpression") {
    /* c8 ignore next 3 */
    if (node.operator !== "void") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ExpressionEffect",
      discard: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "BinaryExpression") {
    /* c8 ignore next 3 */
    if (node.operator !== "<<") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ExportEffect",
      export: convertSpecifier(node.left),
      right: convertExpression(node.right),
      tag: locate(node.loc),
    };
  } else if (node.type === "AssignmentExpression") {
    /* c8 ignore next 3 */
    if (node.operator !== "=") {
      throw makeSyntaxError(node);
    }
    if (node.left.type === "Identifier") {
      return {
        type: "WriteEffect",
        variable: convertVariable(
          /** @type {estree.Variable} */ (node.left.name),
        ),
        right: convertExpression(node.right),
        tag: locate(node.loc),
      };
    } else if (node.left.type === "ArrayPattern") {
      /* c8 ignore next 3 */
      if (node.left.elements.length !== 1) {
        throw makeSyntaxError(node);
      }
      /* c8 ignore next 3 */
      if (node.left.elements[0] === null) {
        throw makeSyntaxError(node);
      }
      /* c8 ignore next 3 */
      if (node.left.elements[0].type !== "Identifier") {
        throw makeSyntaxError(node);
      }
      return {
        type: "WriteEnclaveEffect",
        variable: /** @type {convert.EnclaveVariable} */ (
          node.left.elements[0].name
        ),
        right: convertExpression(node.right),
        tag: locate(node.loc),
      };
    } /* c8 ignore start */ else {
      throw makeSyntaxError(node);
    } /* c8 ignore stop */
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Node) => string[]} */
export const convertIntrinsic = (node) => {
  if (node.type === "Identifier") {
    /* c8 ignore next 3 */
    if (node.name !== "intrinsic") {
      throw makeSyntaxError(node);
    }
    return [];
  } else if (node.type === "MemberExpression") {
    /* c8 ignore next 3 */
    if (node.optional) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.computed) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.property.type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return [...convertIntrinsic(node.object), node.property.name];
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Node) => aran.Expression<convert.Atom>} */
export const convertExpression = (node) => {
  if (node.type === "Literal") {
    if (hasOwn(node, "bigint")) {
      return {
        type: "PrimitiveExpression",
        primitive: {
          bigint: node.bigint,
        },
        tag: locate(node.loc),
      };
    } /* c8 ignore start */ else if (hasOwn(node, "regex")) {
      throw makeSyntaxError(node);
    } /* c8 ignore stop */ else {
      return {
        type: "PrimitiveExpression",
        primitive: node.value,
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "ArrowFunctionExpression") {
    /* c8 ignore next 3 */
    if (node.params.length !== 0) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.async === undefined) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.generator === undefined) {
      throw makeSyntaxError(node);
    }
    return {
      type: "ClosureExpression",
      kind: "arrow",
      asynchronous: node.async,
      generator: node.generator,
      body: convertClosureBlock(node.body),
      tag: locate(node.loc),
    };
  } else if (node.type === "FunctionExpression") {
    /* c8 ignore next 3 */
    if (node.params.length !== 0) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.async === undefined) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.generator === undefined) {
      throw makeSyntaxError(node);
    }
    if (node.id == null) {
      return {
        type: "ClosureExpression",
        kind: "function",
        asynchronous: node.async,
        generator: node.generator,
        body: convertClosureBlock(node.body),
        tag: locate(node.loc),
      };
    } else {
      /* c8 ignore next 3 */
      if (node.id.name !== "method" && node.id.name !== "constructor") {
        throw makeSyntaxError(node);
      }
      return {
        type: "ClosureExpression",
        kind: node.id.name,
        asynchronous: node.async,
        generator: node.generator,
        body: convertClosureBlock(node.body),
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "UnaryExpression") {
    /* c8 ignore next 3 */
    if (node.operator !== "typeof") {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.argument.type !== "ArrayExpression") {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.argument.elements.length !== 1) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.argument.elements[0] === null) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.argument.elements[0].type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return {
      type: "TypeofEnclaveExpression",
      variable: /** @type {convert.EnclaveVariable} */ (
        node.argument.elements[0].name
      ),
      tag: locate(node.loc),
    };
  } else if (node.type === "ArrayExpression") {
    /* c8 ignore next 3 */
    if (node.elements.length !== 1) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.elements[0] === null) {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.elements[0].type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ReadEnclaveExpression",
      variable: /** @type {convert.EnclaveVariable} */ (node.elements[0].name),
      tag: locate(node.loc),
    };
  } else if (node.type === "Identifier") {
    if (node.name === "undefined") {
      return {
        type: "PrimitiveExpression",
        primitive: { undefined: null },
        tag: locate(node.loc),
      };
    } else {
      return {
        type: "ReadExpression",
        variable: convertVariable(/** @type {estree.Variable} */ (node.name)),
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "SequenceExpression") {
    /* c8 ignore next 3 */
    if (node.expressions.length !== 2) {
      throw makeSyntaxError(node);
    }
    return {
      type: "SequenceExpression",
      head: convertEffect(node.expressions[0]),
      tail: convertExpression(node.expressions[1]),
      tag: locate(node.loc),
    };
  } else if (node.type === "ConditionalExpression") {
    return {
      type: "ConditionalExpression",
      condition: convertExpression(node.test),
      consequent: convertExpression(node.consequent),
      alternate: convertExpression(node.alternate),
      tag: locate(node.loc),
    };
  } else if (node.type === "AwaitExpression") {
    return {
      type: "AwaitExpression",
      promise: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "YieldExpression") {
    /* c8 ignore next 3 */
    if (node.argument == null) {
      throw makeSyntaxError(node);
    }
    return {
      type: "YieldExpression",
      delegate: node.delegate,
      item: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "MemberExpression") {
    if (
      node.object.type === "Identifier" &&
      node.object.name === "intrinsic" &&
      node.computed &&
      node.property.type === "Literal"
    ) {
      /* c8 ignore next 3 */
      if (typeof node.property.value !== "string") {
        throw makeSyntaxError(node);
      }
      const intrinsic = node.property.value;
      /* c8 ignore next 3 */
      if (!includes(INTRINSIC_ENUM, intrinsic)) {
        throw makeSyntaxError(node);
      }
      return {
        type: "IntrinsicExpression",
        // eslint-disable-next-line object-shorthand
        intrinsic: /** @type {aran.Intrinsic} */ (intrinsic),
        tag: locate(node.loc),
      };
    } else {
      const intrinsic = join(convertIntrinsic(node), ".");
      /* c8 ignore next 3 */
      if (!includes(INTRINSIC_ENUM, intrinsic)) {
        throw makeSyntaxError(node);
      }
      return {
        type: "IntrinsicExpression",
        // eslint-disable-next-line object-shorthand
        intrinsic: /** @type {aran.Intrinsic} */ (intrinsic),
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "BinaryExpression") {
    /* c8 ignore next 3 */
    if (node.operator !== ">>") {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (node.left.type !== "Literal") {
      throw makeSyntaxError(node);
    }
    /* c8 ignore next 3 */
    if (typeof node.left.value !== "string") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ImportExpression",
      source: /** @type {convert.Source} */ (node.left.value),
      import:
        node.right.type === "Literal" && node.right.value === "*"
          ? null
          : convertSpecifier(node.right),
      tag: locate(node.loc),
    };
  } else if (node.type === "CallExpression") {
    /* c8 ignore next 3 */
    if (node.optional) {
      throw makeSyntaxError(node);
    }
    if (node.callee.type === "Identifier" && node.callee.name === "eval") {
      /* c8 ignore next 3 */
      if (node.arguments.length !== 1) {
        throw makeSyntaxError(node);
      }
      return {
        type: "EvalExpression",
        code: convertExpression(node.arguments[0]),
        tag: locate(node.loc),
      };
    } else if (
      node.arguments.length > 0 &&
      node.arguments[0].type === "UnaryExpression" &&
      node.arguments[0].operator === "!"
    ) {
      return {
        type: "ApplyExpression",
        callee: convertExpression(node.callee),
        this: convertExpression(node.arguments[0].argument),
        arguments: map(
          slice(node.arguments, 1, node.arguments.length),
          convertExpression,
        ),
        tag: locate(node.loc),
      };
    } else {
      return {
        type: "ApplyExpression",
        callee: convertExpression(node.callee),
        this: {
          type: "PrimitiveExpression",
          primitive: { undefined: null },
          tag: locate(node.loc),
        },
        arguments: map(node.arguments, convertExpression),
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "NewExpression") {
    return {
      type: "ConstructExpression",
      callee: convertExpression(node.callee),
      arguments: map(node.arguments, convertExpression),
      tag: locate(node.loc),
    };
  } /* c8 ignore start */ else {
    throw makeSyntaxError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Program) => aran.Node<convert.Atom>} */
export const convert = (node) => {
  /* c8 ignore next 3 */
  if (node.body.length === 0) {
    throw makeSyntaxError(node);
  }
  /* c8 ignore next 3 */
  if (node.body[0].type !== "ExpressionStatement") {
    throw makeSyntaxError(node);
  }
  /* c8 ignore next 3 */
  if (node.body[0].expression.type !== "Literal") {
    throw makeSyntaxError(node);
  }
  const directive = node.body[0].expression.value;
  if (
    directive === "script" ||
    directive === "module" ||
    directive === "eval"
  ) {
    return convertProgram(node);
  } else if (directive === "pseudo-block") {
    return convertPseudoBlock(slice(node.body, 1, node.body.length), node);
  } else {
    /* c8 ignore next 3 */
    if (node.body.length !== 2) {
      throw makeSyntaxError(node);
    }
    switch (directive) {
      case "link":
        return convertLink(node.body[1]);
      case "closure-block":
        return convertClosureBlock(node.body[1]);
      case "control-block":
        return convertControlBlock(node.body[1]);
      case "statement":
        return convertStatement(node.body[1]);
      case "effect":
        /* c8 ignore next 3 */
        if (node.body[1].type !== "ExpressionStatement") {
          throw makeSyntaxError(node);
        }
        return convertEffect(node.body[1].expression);
      case "expression":
        /* c8 ignore next 3 */
        if (node.body[1].type !== "ExpressionStatement") {
          throw makeSyntaxError(node);
        }
        return convertExpression(node.body[1].expression);
      /* c8 ignore next 2 */
      default:
        throw makeSyntaxError(node);
    }
  }
};
