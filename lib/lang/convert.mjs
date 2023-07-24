/* eslint-disable arrow-body-style, no-use-before-define */

import { slice, map, concat, hasOwn, includes, join } from "../util/index.mjs";

import { intrinsics } from "./intrinsics.mjs";

const { String, undefined, SyntaxError } = globalThis;

/** @typedef {string} Location */

/** @type {(loc: null | undefined | import("estree").SourceLocation) => Location} */
const locate = (loc) =>
  loc ? `${String(loc.start.line)}:${String(loc.start.column)}` : "???";

/** @type {(node: import("estree").Node) => SyntaxError} */
const makeSyntaxError = (node) =>
  new SyntaxError(`Node ${node.type} at ${locate(node.loc)}`);

/** @type {(node: import("estree").Pattern) => Variable}  */
const convertVariable = (node) => {
  if (node.type !== "Identifier") {
    throw makeSyntaxError(node);
  }
  return node.name;
};

/** @type {(node: import("estree").VariableDeclarator) => Variable} */
const convertVariableDeclarator = (node) => {
  if (node.init !== null) {
    throw makeSyntaxError(node);
  }
  return convertVariable(node.id);
};

/** @type {(node: import("estree").VariableDeclaration) => Variable[]} */
const convertVariableDeclaration = (node) => {
  if (node.kind !== "let") {
    throw makeSyntaxError(node);
  }
  return map(node.declarations, convertVariableDeclarator);
};

/** @type {(node: import("estree").Program) => Program<Location>} */
export const convertProgram = (node) => {
  if (node.body.length < 1) {
    throw makeSyntaxError(node);
  }
  if (node.body[0].type !== "ExpressionStatement") {
    throw makeSyntaxError(node);
  }
  if (node.body[0].expression.type !== "Literal") {
    throw makeSyntaxError(node);
  }
  const directive = node.body[0].expression.value;
  if (directive === "script") {
    return {
      type: "ScriptProgram",
      statements: map(slice(node.body, 1, node.body.length), convertStatement),
      tag: locate(node.loc),
    };
  } else if (directive === "module") {
    if (node.body.length < 2) {
      throw makeSyntaxError(node);
    }
    return {
      type: "ModuleProgram",
      links: map(slice(node.body, 1, node.body.length - 1), convertLink),
      body: convertBlock(node.body[node.body.length - 1], []),
      tag: locate(node.loc),
    };
  } else if (directive === "eval") {
    if (node.body.length !== 2) {
      throw makeSyntaxError(node);
    }
    return {
      type: "EvalProgram",
      body: convertBlock(node.body[1], []),
      tag: locate(node.loc),
    };
  } else {
    throw makeSyntaxError(node);
  }
};

/** @type {(node: import("estree").Node) => Link<Location>} */
export const convertLink = (node) => {
  if (node.type === "ImportDeclaration") {
    if (node.specifiers.length === 0) {
      return {
        type: "ImportLink",
        source: /** @type Source */ (node.source.value),
        import: null,
        tag: locate(node.loc),
      };
    } else {
      if (node.specifiers.length !== 1) {
        throw makeSyntaxError(node);
      }
      if (node.specifiers[0].type !== "ImportSpecifier") {
        throw makeSyntaxError(node);
      }
      if (node.specifiers[0].imported.name !== node.specifiers[0].local.name) {
        throw makeSyntaxError(node);
      }
      return {
        type: "ImportLink",
        source: /** @type Source */ (node.source.value),
        import: node.specifiers[0].imported.name,
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "ExportAllDeclaration") {
    return {
      type: "AggregateLink",
      source: /** @type Source */ (node.source.value),
      import: null,
      export: node.exported === null ? null : node.exported.name,
      tag: locate(node.loc),
    };
  } else if (node.type === "ExportNamedDeclaration") {
    if (node.declaration !== null) {
      throw makeSyntaxError(node);
    }
    if (node.specifiers.length !== 1) {
      throw makeSyntaxError(node);
    }
    if (node.source === null || node.source === undefined) {
      if (node.specifiers[0].exported.name !== node.specifiers[0].local.name) {
        throw makeSyntaxError(node);
      }
      return {
        type: "ExportLink",
        export: node.specifiers[0].exported.name,
        tag: locate(node.loc),
      };
    } else {
      return {
        type: "AggregateLink",
        source: /** @type Source */ (node.source.value),
        import: node.specifiers[0].local.name,
        export: node.specifiers[0].exported.name,
        tag: locate(node.loc),
      };
    }
  } else {
    throw makeSyntaxError(node);
  }
};

/** @type {(node: import("estree").Node, labels: Label[]) => Block<Location>} */
export const convertBlock = (node, labels) => {
  if (node.type === "LabeledStatement") {
    return convertBlock(node.body, concat(labels, [node.label.name]));
  } else if (node.type === "BlockStatement") {
    if (
      node.body.length > 0 &&
      node.body[0].type === "VariableDeclaration" &&
      node.body[0].kind === "let" &&
      node.body[0].declarations[0].init === null
    ) {
      return {
        type: "Block",
        labels,
        variables: convertVariableDeclaration(node.body[0]),
        statements: map(
          slice(node.body, 1, node.body.length),
          convertStatement,
        ),
        tag: locate(node.loc),
      };
    } else {
      return {
        type: "Block",
        labels,
        variables: [],
        statements: map(node.body, convertStatement),
        tag: locate(node.loc),
      };
    }
  } else {
    throw makeSyntaxError(node);
  }
};

/** @type {(node: import("estree").Node) => Statement<Location>} */
export const convertStatement = (node) => {
  if (node.type === "BlockStatement") {
    return {
      type: "BlockStatement",
      body: convertBlock(node, []),
      tag: locate(node.loc),
    };
  } else if (node.type === "LabeledStatement") {
    return {
      type: "BlockStatement",
      body: convertBlock(node, []),
      tag: locate(node.loc),
    };
  } else if (node.type === "TryStatement") {
    if (node.handler === null || node.handler === undefined) {
      throw makeSyntaxError(node);
    }
    if (node.handler.param !== null) {
      throw makeSyntaxError(node);
    }
    if (node.finalizer === null || node.finalizer === undefined) {
      throw makeSyntaxError(node);
    }
    return {
      type: "TryStatement",
      body: convertBlock(node.block, []),
      catch: convertBlock(node.handler.body, []),
      finally: convertBlock(node.finalizer, []),
      tag: locate(node.loc),
    };
  } else if (node.type === "IfStatement") {
    if (node.alternate === null || node.alternate === undefined) {
      throw makeSyntaxError(node);
    }
    return {
      type: "IfStatement",
      test: convertExpression(node.test),
      then: convertBlock(node.consequent, []),
      else: convertBlock(node.alternate, []),
      tag: locate(node.loc),
    };
  } else if (node.type === "WhileStatement") {
    return {
      type: "WhileStatement",
      test: convertExpression(node.test),
      body: convertBlock(node.body, []),
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
      effect: convertEffect(node.expression),
      tag: locate(node.loc),
    };
  } else if (node.type === "ReturnStatement") {
    if (node.argument === null || node.argument === undefined) {
      throw makeSyntaxError(node);
    }
    return {
      type: "ReturnStatement",
      value: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "BreakStatement") {
    if (node.label === null || node.label === undefined) {
      throw makeSyntaxError(node);
    }
    return {
      type: "BreakStatement",
      label: node.label.name,
      tag: locate(node.loc),
    };
  } else if (node.type === "VariableDeclaration") {
    if (node.declarations.length !== 1) {
      throw makeSyntaxError(node);
    }
    if (
      node.declarations[0].init === null ||
      node.declarations[0].init === undefined
    ) {
      throw makeSyntaxError(node);
    }
    if (node.declarations[0].id.type !== "ArrayPattern") {
      throw makeSyntaxError(node);
    }
    if (node.declarations[0].id.elements.length !== 1) {
      throw makeSyntaxError(node);
    }
    if (node.declarations[0].id.elements[0] === null) {
      throw makeSyntaxError(node);
    }
    if (node.declarations[0].id.elements[0].type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return {
      type: "DeclareExternalStatement",
      kind: node.kind,
      variable: node.declarations[0].id.elements[0].name,
      value: convertExpression(node.declarations[0].init),
      tag: locate(node.loc),
    };
  } else {
    throw makeSyntaxError(node);
  }
};

/** @type {(node: import("estree").Node) => String} */
export const convertSpecifier = (node) => {
  if (node.type === "Literal") {
    if (typeof node.value !== "string") {
      throw makeSyntaxError(node);
    }
    return node.value;
  } else if (node.type === "Identifier") {
    return node.name;
  } else {
    throw makeSyntaxError(node);
  }
};

/** @type {(node: import("estree").Node) => Effect<Location>[]} */
export const convertEffectArray = (node) => {
  if (node.type === "SequenceExpression") {
    return map(node.expressions, convertEffect);
  } else if (node.type === "Identifier") {
    if (node.name !== "undefined") {
      throw makeSyntaxError(node);
    }
    return [];
  } else {
    return [convertEffect(node)];
  }
};

/** @type {(node: import("estree").Node) => Effect<Location>} */
export const convertEffect = (node) => {
  if (node.type === "ConditionalExpression") {
    return {
      type: "ConditionalEffect",
      test: convertExpression(node.test),
      positive: convertEffectArray(node.consequent),
      negative: convertEffectArray(node.alternate),
      tag: locate(node.loc),
    };
  } else if (node.type === "UnaryExpression") {
    if (node.operator !== "void") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ExpressionEffect",
      discard: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "BinaryExpression") {
    if (node.operator !== "<<") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ExportEffect",
      export: convertSpecifier(node.left),
      value: convertExpression(node.right),
      tag: locate(node.loc),
    };
  } else if (node.type === "AssignmentExpression") {
    if (node.operator !== "=") {
      throw makeSyntaxError(node);
    }
    if (node.left.type === "Identifier") {
      return {
        type: "WriteEffect",
        variable: node.left.name,
        value: convertExpression(node.right),
        tag: locate(node.loc),
      };
    } else if (node.left.type === "ArrayPattern") {
      if (node.left.elements.length !== 1) {
        throw makeSyntaxError(node);
      }
      if (node.left.elements[0] === null) {
        throw makeSyntaxError(node);
      }
      if (node.left.elements[0].type !== "Identifier") {
        throw makeSyntaxError(node);
      }
      return {
        type: "WriteExternalEffect",
        variable: node.left.elements[0].name,
        value: convertExpression(node.right),
        tag: locate(node.loc),
      };
    } else {
      throw makeSyntaxError(node);
    }
  } else {
    throw makeSyntaxError(node);
  }
};

/** @type {(node: import("estree").Node) => string[]} */
export const convertIntrinsic = (node) => {
  if (node.type === "Identifier") {
    if (node.name !== "intrinsic") {
      throw makeSyntaxError(node);
    }
    return [];
  } else if (node.type === "MemberExpression") {
    if (node.optional) {
      throw makeSyntaxError(node);
    }
    if (node.computed) {
      throw makeSyntaxError(node);
    }
    if (node.property.type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return concat(convertIntrinsic(node.object), [node.property.name]);
  } else {
    throw makeSyntaxError(node);
  }
};

/** @type {(node: import("estree").Node) => Expression<Location>} */
export const convertExpression = (node) => {
  if (node.type === "Literal") {
    if (hasOwn(node, "bigint")) {
      return {
        type: "PrimitiveExpression",
        primitive: {
          bigint: /** @type {import("estree").BigIntLiteral} */ (node).bigint,
        },
        tag: locate(node.loc),
      };
    } else if (hasOwn(node, "regex")) {
      throw makeSyntaxError(node);
    } else {
      return {
        type: "PrimitiveExpression",
        primitive: /** @type {import("estree").SimpleLiteral} */ (node).value,
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "ArrowFunctionExpression") {
    if (node.params.length !== 0) {
      throw makeSyntaxError(node);
    }
    if (node.async === undefined) {
      throw makeSyntaxError(node);
    }
    if (node.generator === undefined) {
      throw makeSyntaxError(node);
    }
    return {
      type: "ClosureExpression",
      kind: "arrow",
      asynchronous: node.async,
      generator: node.generator,
      body: convertBlock(node.body, []),
      tag: locate(node.loc),
    };
  } else if (node.type === "FunctionExpression") {
    if (node.params.length !== 0) {
      throw makeSyntaxError(node);
    }
    if (node.async === undefined) {
      throw makeSyntaxError(node);
    }
    if (node.generator === undefined) {
      throw makeSyntaxError(node);
    }
    if (node.id === null || node.id === undefined) {
      return {
        type: "ClosureExpression",
        kind: "function",
        asynchronous: node.async,
        generator: node.generator,
        body: convertBlock(node.body, []),
        tag: locate(node.loc),
      };
    } else {
      if (node.id.name !== "method" && node.id.name !== "constructor") {
        throw makeSyntaxError(node);
      }
      return {
        type: "ClosureExpression",
        kind: node.id.name,
        asynchronous: node.async,
        generator: node.generator,
        body: convertBlock(node.body, []),
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "UnaryExpression") {
    if (node.operator !== "typeof") {
      throw makeSyntaxError(node);
    }
    if (node.argument.type !== "ArrayExpression") {
      throw makeSyntaxError(node);
    }
    if (node.argument.elements.length !== 1) {
      throw makeSyntaxError(node);
    }
    if (node.argument.elements[0] === null) {
      throw makeSyntaxError(node);
    }
    if (node.argument.elements[0].type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return {
      type: "TypeofExternalExpression",
      variable: node.argument.elements[0].name,
      tag: locate(node.loc),
    };
  } else if (node.type === "ArrayExpression") {
    if (node.elements.length !== 1) {
      throw makeSyntaxError(node);
    }
    if (node.elements[0] === null) {
      throw makeSyntaxError(node);
    }
    if (node.elements[0].type !== "Identifier") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ReadExternalExpression",
      variable: node.elements[0].name,
      tag: locate(node.loc),
    };
  } else if (node.type === "Identifier") {
    if (node.name === "undefined") {
      return {
        type: "PrimitiveExpression",
        primitive: { undefined: null },
        tag: locate(node.loc),
      };
    } else if (node.name === "error" || node.name === "arguments") {
      return {
        type: "ParameterExpression",
        parameter: node.name,
        tag: locate(node.loc),
      };
    } else {
      return {
        type: "ReadExpression",
        variable: node.name,
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "SequenceExpression") {
    if (node.expressions.length !== 2) {
      throw makeSyntaxError(node);
    }
    return {
      type: "SequenceExpression",
      effect: convertEffect(node.expressions[0]),
      value: convertExpression(node.expressions[1]),
      tag: locate(node.loc),
    };
  } else if (node.type === "ConditionalExpression") {
    return {
      type: "ConditionalExpression",
      test: convertExpression(node.test),
      consequent: convertExpression(node.consequent),
      alternate: convertExpression(node.alternate),
      tag: locate(node.loc),
    };
  } else if (node.type === "AwaitExpression") {
    return {
      type: "AwaitExpression",
      value: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "YieldExpression") {
    if (node.argument === null || node.argument === undefined) {
      throw makeSyntaxError(node);
    }
    return {
      type: "YieldExpression",
      delegate: node.delegate,
      value: convertExpression(node.argument),
      tag: locate(node.loc),
    };
  } else if (node.type === "MemberExpression") {
    if (node.object.type === "Super") {
      if (node.computed) {
        throw makeSyntaxError(node);
      }
      if (node.property.type !== "Identifier") {
        throw makeSyntaxError(node);
      }
      if (
        node.property.name !== "get" &&
        node.property.name !== "set" &&
        node.property.name !== "call"
      ) {
        throw makeSyntaxError(node);
      }
      return {
        type: "ParameterExpression",
        parameter: `super.${node.property.name}`,
        tag: locate(node.loc),
      };
    } else if (
      node.object.type === "Identifier" &&
      node.object.name === "intrinsic" &&
      node.computed &&
      node.property.type === "Literal"
    ) {
      if (typeof node.property.value !== "string") {
        throw makeSyntaxError(node);
      }
      const intrinsic = /** @type {Intrinsic} */ (node.property.value);
      if (!includes(intrinsics, intrinsic)) {
        throw makeSyntaxError(node);
      }
      return {
        type: "IntrinsicExpression",
        intrinsic,
        tag: locate(node.loc),
      };
    } else {
      const intrinsic = /** @type {Intrinsic} */ (
        join(convertIntrinsic(node), ".")
      );
      if (!includes(intrinsics, intrinsic)) {
        throw makeSyntaxError(node);
      }
      return {
        type: "IntrinsicExpression",
        intrinsic,
        tag: locate(node.loc),
      };
    }
  } else if (node.type === "ThisExpression") {
    return {
      type: "ParameterExpression",
      parameter: "this",
      tag: locate(node.loc),
    };
  } else if (node.type === "MetaProperty") {
    if (node.meta.name === "new") {
      if (node.property.name !== "target") {
        throw makeSyntaxError(node);
      }
      return {
        type: "ParameterExpression",
        parameter: "new.target",
        tag: locate(node.loc),
      };
    } else if (node.meta.name === "import") {
      if (node.property.name === "meta") {
        return {
          type: "ParameterExpression",
          parameter: "import.meta",
          tag: locate(node.loc),
        };
      } else if (node.property.name === "dynamic") {
        return {
          type: "ParameterExpression",
          parameter: "import",
          tag: locate(node.loc),
        };
      } else {
        throw makeSyntaxError(node);
      }
    } else {
      throw makeSyntaxError(node);
    }
  } else if (node.type === "BinaryExpression") {
    if (node.operator !== ">>") {
      throw makeSyntaxError(node);
    }
    if (node.left.type !== "Literal") {
      throw makeSyntaxError(node);
    }
    if (typeof node.left.value !== "string") {
      throw makeSyntaxError(node);
    }
    return {
      type: "ImportExpression",
      source: node.left.value,
      import:
        node.right.type === "Literal" && node.right.value === "*"
          ? null
          : convertSpecifier(node.right),
      tag: locate(node.loc),
    };
  } else if (node.type === "CallExpression") {
    if (node.optional) {
      throw makeSyntaxError(node);
    }
    if (node.callee.type === "Identifier" && node.callee.name === "eval") {
      if (node.arguments.length !== 1) {
        throw makeSyntaxError(node);
      }
      return {
        type: "EvalExpression",
        argument: convertExpression(node.arguments[0]),
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
  } else {
    throw makeSyntaxError(node);
  }
};
