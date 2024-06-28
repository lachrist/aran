/* eslint-disable no-use-before-define */

import { AranError, AranTypeError } from "../../error.mjs";
import { joinDeepPath, joinPath } from "../../path.mjs";
import {
  EMPTY,
  concatXX,
  concatXXX,
  concatXXXX,
  every,
  filterNarrow,
  flatMapIndex,
  hasOwn,
  map,
  mapIndex,
  some,
  someIndex,
} from "../../util/index.mjs";
import { hasUseStrictDirective } from "./strict.mjs";

//////////
// util //
//////////

/**
 * @type {(
 *   node: import("../../estree").Node,
 * ) => node is import("../../estree").Identifier}
 */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   mode: import("./hoist2").Mode,
 *   body: (
 *     | import("../../estree").Statement
 *     | import("../../estree").Directive
 *     | import("../../estree").ModuleDeclaration
 *   )[],
 * ) => import("./hoist2").Mode}
 */
const updateMode = (mode, body) =>
  mode === "strict"
    ? "strict"
    : hasUseStrictDirective(body)
    ? "strict"
    : "sloppy";

//////////
// kind //
//////////

/**
 * @type {(
 *   kind: import("./hoist2").Kind,
 * ) => boolean}
 */
const isKindDuplicable = (kind) => {
  switch (kind) {
    case "var": {
      return true;
    }
    case "let": {
      return false;
    }
    case "const": {
      return false;
    }
    case "function-strict": {
      return true;
    }
    case "function-sloppy": {
      return true;
    }
    case "class": {
      return false;
    }
    case "param": {
      return false;
    }
    case "param-legacy": {
      return true;
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/////////////
// scoping //
/////////////

/** @type {import("./hoist2").Scoping} */
const PARAM_SCOPING = {
  "param": true,
  "param-legacy": true,
};

/** @type {import("./hoist2").Scoping} */
const CLOSURE_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": true,
  "class": true,
};

/** @type {import("./hoist2").Scoping} */
const BLOCK_SCOPING = {
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": false,
  "class": true,
};

/** @type {import("./hoist2").Scoping} */
const EMPTY_SCOPING = {};

/**
 * @type {(
 *   kind: "module" | "eval" | "script",
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Scoping}
 */
const getProgramScoping = (kind, mode) => {
  switch (kind) {
    case "module": {
      return CLOSURE_SCOPING;
    }
    case "script": {
      return EMPTY_SCOPING;
    }
    case "eval": {
      switch (mode) {
        case "strict": {
          return CLOSURE_SCOPING;
        }
        case "sloppy": {
          return BLOCK_SCOPING;
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

//////////////
// accessor //
//////////////

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 * ) => import("./hoist2").Hoist[]}
 */
const voidHoist = (_variable) => EMPTY;

/**
 * @type {import("./hoist2").UnboundStatus}
 */
const UNBOUND_STATUS = {
  type: "unbound",
  backup: null,
};

/**
 * @type {import("./hoist2").ReportStatus}
 */
const REPORT_STATUS = {
  type: "report",
};

/**
 * @type {(
 *   hoist: import("./hoist2").Hoist,
 * ) => hoist is import("./hoist2").UnboundHoist}
 */
const isUnboundHoist = (hoist) => hoist.status.type === "unbound";

/**
 * @type {(
 *   hoist: import("./hoist2").Hoist,
 * ) => hoist is import("./hoist2").BoundHoist}
 */
const isBoundHoist = (hoist) => hoist.status.type === "bound";

/**
 * @type {(
 *   hoist: import("./hoist2").Hoist,
 * ) => hoist is import("./hoist2").ReportHoist}
 */
const isReportHoist = (hoist) => hoist.status.type === "report";

/**
 * @type {(
 *   hoist: import("./hoist2").UnboundHoist,
 *   path: import("../../path").Path,
 * ) => import("./hoist2").UnboundHoist}
 */
const backupHoist = (hoist, path) => ({
  ...hoist,
  status: {
    type: "unbound",
    backup: path,
  },
});

/**
 * @type {(
 *   hoist: import("./hoist2").UnboundHoist,
 *   path: import("../../path").Path,
 * ) => import("./hoist2").BoundHoist}
 */
const bindHoist = (hoist, path) => ({
  ...hoist,
  status: {
    type: "bound",
    path,
  },
});

/**
 * @type {(
 *   hoist: import("./hoist2").UnboundHoist,
 * ) => import("./hoist2").ReportHoist}
 */
const reportHoist = (hoist) => ({
  ...hoist,
  status: REPORT_STATUS,
});

/**
 * @type {(
 *   hoisting: import("./hoist2").UnboundHoist[],
 * ) => import("./hoist2").Hoist[]}
 */
const reportDuplicate = (hoisting) =>
  mapIndex(hoisting.length, (index) => {
    const hoist = hoisting[index];
    if (hoist.kind === "function-sloppy") {
      if (
        some(
          hoisting,
          (other_hoist) =>
            other_hoist.variable === hoist.variable &&
            !isKindDuplicable(other_hoist.kind),
        )
      ) {
        if (hoist.status.backup === null) {
          return reportHoist(hoist);
        } else {
          return bindHoist(hoist, hoist.status.backup);
        }
      } else {
        return hoist;
      }
    } else if (
      !isKindDuplicable(hoist.kind) &&
      someIndex(
        hoisting.length,
        (other_index) =>
          index !== other_index &&
          hoist.variable === hoisting[other_index].variable,
      )
    ) {
      return reportHoist(hoist);
    } else {
      return hoist;
    }
  });

/**
 * @type {(
 *   scoping: import("./hoist2").Scoping,
 *   hoist: import("./hoist2").UnboundHoist,
 *   path: import("../../path").Path,
 * ) => import("./hoist2").Hoist}
 */
const scopeHoist = (scoping, hoist, path) => {
  if (hasOwn(scoping, hoist.kind)) {
    if (scoping[hoist.kind]) {
      return bindHoist(hoist, path);
    } else {
      if (hoist.status.backup === null) {
        return backupHoist(hoist, path);
      } else {
        return hoist;
      }
    }
  } else {
    throw new AranError("out-of-scope kind", { scoping, hoist, path });
  }
};

/**
 * @type {(
 *   scoping: import("./hoist2").Scoping,
 *   hoisting: import("./hoist2").Hoist[],
 *   path: import("../../path").Path,
 * ) => import("./hoist2").Hoist[]}
 */
const scopeHoisting = (scoping, hoisting, path) =>
  concatXXX(
    map(reportDuplicate(filterNarrow(hoisting, isUnboundHoist)), (hoist) =>
      isUnboundHoist(hoist) ? scopeHoist(scoping, hoist, path) : hoist,
    ),
    filterNarrow(hoisting, isBoundHoist),
    filterNarrow(hoisting, isReportHoist),
  );

///////////
// hoist //
///////////

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Property
 *     | import("../../estree").SpreadElement
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistExpressionProperty = (node, path, mode) => {
  switch (node.type) {
    case "Property": {
      return concatXX(
        hoistPrivateable(node.key, joinPath(path, "key"), mode),
        hoistExpression(
          /** @type {import("../../estree").Expression} */ (node.value),
          joinPath(path, "value"),
          mode,
        ),
      );
    }
    case "SpreadElement": {
      return hoistExpression(node.argument, joinPath(path, "argument"), mode);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").Program,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 *   kind: "module" | "eval" | "script",
 * ) => import("./hoist2").Hoist[]}
 */
const hoistProgram = (node, path, mode, kind) => {
  const next_mode = updateMode(
    node.sourceType === "module" ? "strict" : mode,
    node.body,
  );
  return scopeHoisting(
    getProgramScoping(kind, next_mode),
    flatMapIndex(node.body.length, (index) =>
      hoistProgramElement(
        node.body[index],
        joinDeepPath(path, "body", index),
        next_mode,
      ),
    ),
    path,
  );
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Expression
 *     | import("../../estree").Declaration
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistDefault = (node, path, mode) => {
  if (
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration" ||
    node.type === "VariableDeclaration"
  ) {
    return hoistStatement(node, path, mode);
  } else {
    return hoistExpression(node, path, mode);
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Directive
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistProgramElement = (node, path, mode) => {
  if (node.type === "ImportDeclaration") {
    return EMPTY;
  } else if (node.type === "ExportDefaultDeclaration") {
    return hoistDefault(node.declaration, joinPath(path, "declaration"), mode);
  } else if (node.type === "ExportNamedDeclaration") {
    return node.declaration == null
      ? EMPTY
      : hoistStatement(node.declaration, joinPath(path, "declaration"), mode);
  } else if (node.type === "ExportAllDeclaration") {
    return EMPTY;
  } else {
    return hoistStatement(node, path, mode);
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").SpreadElement
 *     | import("../../estree").Expression
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistSpreadable = (node, path, mode) =>
  node.type === "SpreadElement"
    ? hoistExpression(node.argument, joinPath(path, "argument"), mode)
    : hoistExpression(node, path, mode);

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Super
 *     | import("../../estree").Expression
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistSuperable = (node, path, mode) =>
  node.type === "Super" ? EMPTY : hoistExpression(node, path, mode);

/**
 * @type {(
 *   node: (
 *     | import("../../estree").PrivateIdentifier
 *     | import("../../estree").Expression
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistPrivateable = (node, path, mode) =>
  node.type === "PrivateIdentifier" ? EMPTY : hoistExpression(node, path, mode);

/**
 * @type {(
 *   node: (
 *     | import("../../estree").BlockStatement
 *     | import("../../estree").StaticBlock
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 *   scoping: import("./hoist2").Scoping,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistBlock = (node, path, mode, scoping) =>
  scopeHoisting(
    scoping,
    flatMapIndex(node.body.length, (index) =>
      hoistStatement(node.body[index], joinDeepPath(path, "body", index), mode),
    ),
    path,
  );

/**
 * @type {(
 *   node: import("../../estree").Expression,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistExpression = (node, path, mode) => {
  switch (node.type) {
    case "ClassExpression": {
      return concatXX(
        node.superClass == null
          ? EMPTY
          : hoistExpression(
              node.superClass,
              joinPath(path, "superClass"),
              "strict",
            ),
        hoistClassBody(node.body, joinPath(path, "body"), "strict"),
      );
    }
    case "FunctionExpression": {
      return hoistFunction(node, path, updateMode(mode, node.body.body));
    }
    case "ArrowFunctionExpression": {
      return hoistFunction(
        node,
        path,
        updateMode(
          mode,
          node.body.type === "BlockStatement" ? node.body.body : EMPTY,
        ),
      );
    }
    case "AssignmentExpression": {
      return concatXX(
        hoistPattern(node.left, joinPath(path, "left"), mode, voidHoist),
        hoistExpression(node.right, joinPath(path, "right"), mode),
      );
    }
    case "LogicalExpression": {
      return concatXX(
        hoistExpression(node.left, joinPath(path, "left"), mode),
        hoistExpression(node.right, joinPath(path, "right"), mode),
      );
    }
    case "BinaryExpression": {
      return concatXX(
        hoistExpression(node.left, joinPath(path, "left"), mode),
        hoistExpression(node.right, joinPath(path, "right"), mode),
      );
    }
    case "UnaryExpression": {
      return hoistExpression(node.argument, joinPath(path, "argument"), mode);
    }
    case "UpdateExpression": {
      return hoistExpression(node.argument, joinPath(path, "argument"), mode);
    }
    case "CallExpression": {
      return concatXX(
        hoistSuperable(node.callee, joinPath(path, "callee"), mode),
        flatMapIndex(node.arguments.length, (index) =>
          hoistSpreadable(
            node.arguments[index],
            joinDeepPath(path, "arguments", index),
            mode,
          ),
        ),
      );
    }
    case "NewExpression": {
      return concatXX(
        hoistSuperable(node.callee, joinPath(path, "callee"), mode),
        flatMapIndex(node.arguments.length, (index) =>
          hoistSpreadable(
            node.arguments[index],
            joinDeepPath(path, "arguments", index),
            mode,
          ),
        ),
      );
    }
    case "MemberExpression": {
      return concatXX(
        hoistSuperable(node.object, joinPath(path, "object"), mode),
        hoistPrivateable(node.property, joinPath(path, "property"), mode),
      );
    }
    case "ConditionalExpression": {
      return concatXXX(
        hoistExpression(node.test, joinPath(path, "test"), mode),
        hoistExpression(node.consequent, joinPath(path, "consequent"), mode),
        hoistExpression(node.alternate, joinPath(path, "alternate"), mode),
      );
    }
    case "ArrayExpression": {
      return flatMapIndex(node.elements.length, (index) => {
        const child = node.elements[index];
        return child == null
          ? EMPTY
          : hoistSpreadable(child, joinDeepPath(path, "elements", index), mode);
      });
    }
    case "ThisExpression": {
      return EMPTY;
    }
    case "Literal": {
      return EMPTY;
    }
    case "TaggedTemplateExpression": {
      return concatXX(
        hoistExpression(node.tag, joinPath(path, "tag"), mode),
        hoistExpression(node.quasi, joinPath(path, "quasi"), mode),
      );
    }
    case "TemplateLiteral": {
      return flatMapIndex(node.expressions.length, (index) =>
        hoistExpression(
          node.expressions[index],
          joinDeepPath(path, "expressions", index),
          mode,
        ),
      );
    }
    case "AwaitExpression": {
      return hoistExpression(node.argument, joinPath(path, "argument"), mode);
    }
    case "YieldExpression": {
      return node.argument == null
        ? EMPTY
        : hoistExpression(node.argument, joinPath(path, "argument"), mode);
    }
    case "MetaProperty": {
      return EMPTY;
    }
    case "ImportExpression": {
      return hoistExpression(node.source, joinPath(path, "source"), mode);
    }
    case "ChainExpression": {
      return hoistExpression(
        node.expression,
        joinPath(path, "expression"),
        mode,
      );
    }
    case "Identifier": {
      return EMPTY;
    }
    case "SequenceExpression": {
      return flatMapIndex(node.expressions.length, (index) =>
        hoistExpression(
          node.expressions[index],
          joinDeepPath(path, "expressions", index),
          mode,
        ),
      );
    }
    case "ObjectExpression": {
      return flatMapIndex(node.properties.length, (index) =>
        hoistExpressionProperty(
          node.properties[index],
          joinDeepPath(path, "properties", index),
          mode,
        ),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").AssignmentProperty
 *     | import("../../estree").RestElement
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 *   makeHoist: (
 *     variable: import("../../estree").Variable,
 *   ) => import("./hoist2").Hoist[],
 * ) => import("./hoist2").Hoist[]}
 */
const hoistPatternProperty = (node, path, mode, listHoist) => {
  switch (node.type) {
    case "RestElement": {
      return hoistPattern(node.argument, path, mode, listHoist);
    }
    case "Property": {
      return concatXX(
        hoistExpression(
          /** @type {import("../../estree").Expression} */ (node.key),
          joinPath(path, "key"),
          mode,
        ),
        hoistPattern(node.value, joinPath(path, "value"), mode, listHoist),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").Pattern,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 *   listHoist: (
 *     variable: import("../../estree").Variable,
 *   ) => import("./hoist2").Hoist[],
 * ) => import("./hoist2").Hoist[]}
 */
const hoistPattern = (node, path, mode, listHoist) => {
  switch (node.type) {
    case "ArrayPattern": {
      return flatMapIndex(node.elements.length, (index) => {
        const child = node.elements[index];
        return child == null
          ? EMPTY
          : hoistPattern(
              child,
              joinDeepPath(path, "elements", index),
              mode,
              listHoist,
            );
      });
    }
    case "ObjectPattern": {
      return flatMapIndex(node.properties.length, (index) =>
        hoistPatternProperty(
          node.properties[index],
          joinDeepPath(path, "properties", index),
          mode,
          listHoist,
        ),
      );
    }
    case "AssignmentPattern": {
      return concatXX(
        hoistPattern(node.left, joinPath(path, "left"), mode, listHoist),
        hoistExpression(node.right, joinPath(path, "right"), mode),
      );
    }
    case "Identifier": {
      return listHoist(
        /** @type {import("../../estree").Variable} */ (node.name),
      );
    }
    case "MemberExpression": {
      return concatXX(
        node.object.type === "Super"
          ? EMPTY
          : hoistExpression(node.object, joinPath(path, "object"), mode),
        node.property.type === "PrivateIdentifier"
          ? EMPTY
          : hoistExpression(node.property, joinPath(path, "property"), mode),
      );
    }
    case "RestElement": {
      return hoistPattern(node.argument, path, mode, listHoist);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").VariableDeclarator,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 *   listHoist: (
 *     variable: import("../../estree").Variable,
 *   ) => import("./hoist2").Hoist[],
 * ) => import("./hoist2").Hoist[]}
 */
const hoistDeclarator = (node, path, mode, listHoist) =>
  concatXX(
    hoistPattern(node.id, joinPath(path, "id"), mode, listHoist),
    node.init == null
      ? EMPTY
      : hoistExpression(node.init, joinPath(path, "init"), mode),
  );

/**
 * @type {(
 *   node: import("../../estree").ClassBody,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistClassBody = (node, path, mode) =>
  flatMapIndex(node.body.length, (index) =>
    hoistClassElement(
      node.body[index],
      joinDeepPath(path, "body", index),
      mode,
    ),
  );

/**
 * @type {(
 *   node: import("../../estree").Function,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistFunction = (node, path, mode) => {
  /** @type {import("./hoist2").Kind} */
  const kind =
    node.type !== "ArrowFunctionExpression" && every(node.params, isIdentifier)
      ? "param-legacy"
      : "param";
  return concatXX(
    scopeHoisting(
      PARAM_SCOPING,
      flatMapIndex(node.params.length, (index) =>
        hoistPattern(
          node.params[index],
          joinDeepPath(path, "params", index),
          mode,
          (variable) => [
            {
              kind,
              variable,
              origin: path,
              status: UNBOUND_STATUS,
            },
          ],
        ),
      ),
      path,
    ),
    node.body.type === "BlockStatement"
      ? hoistBlock(node.body, joinPath(path, "body"), mode, CLOSURE_SCOPING)
      : hoistExpression(node.body, joinPath(path, "body"), mode),
  );
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistClassElement = (node, path, mode) => {
  switch (node.type) {
    case "MethodDefinition": {
      return concatXX(
        node.key.type === "PrivateIdentifier"
          ? EMPTY
          : hoistExpression(node.key, joinPath(path, "key"), mode),
        hoistExpression(node.value, joinPath(path, "value"), mode),
      );
    }
    case "PropertyDefinition": {
      return concatXX(
        node.key.type === "PrivateIdentifier"
          ? EMPTY
          : hoistExpression(node.key, joinPath(path, "key"), mode),
        node.value == null
          ? EMPTY
          : hoistExpression(node.value, joinPath(path, "value"), mode),
      );
    }
    case "StaticBlock": {
      return hoistStatement(node, path, mode);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").CatchClause,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistCatchClause = (node, path, mode) =>
  concatXX(
    node.param == null
      ? EMPTY
      : scopeHoisting(
          PARAM_SCOPING,
          hoistPattern(
            node.param,
            joinPath(path, "param"),
            mode,
            (variable) => [
              {
                kind: "param",
                variable,
                origin: path,
                status: UNBOUND_STATUS,
              },
            ],
          ),
          path,
        ),
    hoistBlock(
      node.body,
      joinPath(path, "body"),
      updateMode(mode, node.body.body),
      BLOCK_SCOPING,
    ),
  );

/**
 * @type {(
 *   node: import("../../estree").SwitchCase,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistSwitchCase = (node, path, mode) =>
  concatXX(
    node.test == null
      ? EMPTY
      : hoistExpression(node.test, joinPath(path, "test"), mode),
    flatMapIndex(node.consequent.length, (index) =>
      hoistStatement(
        node.consequent[index],
        joinDeepPath(path, "consequent", index),
        mode,
      ),
    ),
  );

/**
 * @type {(
 *   node: import("../../estree").Statement,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 * ) => import("./hoist2").Hoist[]}
 */
const hoistStatement = (node, path, mode) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return flatMapIndex(node.declarations.length, (index) =>
        hoistDeclarator(
          node.declarations[index],
          joinDeepPath(path, "declarations", index),
          mode,
          (variable) => [
            {
              kind: node.kind,
              variable,
              origin: path,
              status: UNBOUND_STATUS,
            },
          ],
        ),
      );
    }
    case "ClassDeclaration": {
      return concatXXX(
        node.id == null
          ? EMPTY
          : [
              {
                kind: "class",
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
                origin: path,
                status: UNBOUND_STATUS,
              },
            ],
        node.superClass == null
          ? EMPTY
          : hoistExpression(
              node.superClass,
              joinPath(path, "superClass"),
              "strict",
            ),
        hoistClassBody(node.body, joinPath(path, "body"), "strict"),
      );
    }
    case "FunctionDeclaration": {
      const next_mode = updateMode(mode, node.body.body);
      return concatXX(
        node.id == null
          ? EMPTY
          : [
              {
                kind: `function-${next_mode}`,
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
                origin: path,
                status: UNBOUND_STATUS,
              },
            ],
        hoistFunction(node, path, next_mode),
      );
    }
    case "IfStatement": {
      return concatXXX(
        hoistExpression(node.test, joinPath(path, "test"), mode),
        hoistStatement(node.consequent, joinPath(path, "consequent"), mode),
        node.alternate == null
          ? EMPTY
          : hoistStatement(node.alternate, joinPath(path, "alternate"), mode),
      );
    }
    case "LabeledStatement": {
      return hoistStatement(node.body, joinPath(path, "body"), mode);
    }
    case "WhileStatement": {
      return concatXX(
        hoistExpression(node.test, joinPath(path, "test"), mode),
        hoistStatement(node.body, joinPath(path, "body"), mode),
      );
    }
    case "DoWhileStatement": {
      return concatXX(
        hoistStatement(node.body, joinPath(path, "body"), mode),
        hoistExpression(node.test, joinPath(path, "test"), mode),
      );
    }
    case "ForStatement": {
      if (node.init != null && node.init.type === "VariableDeclaration") {
        return scopeHoisting(
          BLOCK_SCOPING,
          concatXXXX(
            hoistStatement(node.init, joinPath(path, "left"), mode),
            node.test == null
              ? EMPTY
              : hoistExpression(node.test, joinPath(path, "test"), mode),
            node.update == null
              ? EMPTY
              : hoistExpression(node.update, joinPath(path, "update"), mode),
            hoistStatement(node.body, joinPath(path, "body"), mode),
          ),
          path,
        );
      } else {
        return concatXXXX(
          node.init == null
            ? EMPTY
            : hoistExpression(node.init, joinPath(path, "init"), mode),
          node.test == null
            ? EMPTY
            : hoistExpression(node.test, joinPath(path, "test"), mode),
          node.update == null
            ? EMPTY
            : hoistExpression(node.update, joinPath(path, "update"), mode),
          hoistStatement(node.body, joinPath(path, "body"), mode),
        );
      }
    }
    case "ForInStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeHoisting(
          BLOCK_SCOPING,
          concatXXX(
            hoistStatement(node.left, joinPath(path, "left"), mode),
            hoistExpression(node.right, joinPath(path, "right"), mode),
            hoistStatement(node.body, joinPath(path, "body"), mode),
          ),
          path,
        );
      } else {
        return concatXXX(
          hoistPattern(node.left, joinPath(path, "left"), mode, voidHoist),
          hoistExpression(node.right, joinPath(path, "right"), mode),
          hoistStatement(node.body, joinPath(path, "body"), mode),
        );
      }
    }
    case "ForOfStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeHoisting(
          BLOCK_SCOPING,
          concatXXX(
            hoistStatement(node.left, joinPath(path, "left"), mode),
            hoistExpression(node.right, joinPath(path, "right"), mode),
            hoistStatement(node.body, joinPath(path, "body"), mode),
          ),
          path,
        );
      } else {
        return concatXXX(
          hoistPattern(node.left, joinPath(path, "left"), mode, voidHoist),
          hoistExpression(node.right, joinPath(path, "right"), mode),
          hoistStatement(node.body, joinPath(path, "body"), mode),
        );
      }
    }
    case "StaticBlock": {
      return hoistBlock(node, path, mode, BLOCK_SCOPING);
    }
    case "BlockStatement": {
      return hoistBlock(node, path, mode, BLOCK_SCOPING);
    }
    case "ExpressionStatement": {
      return hoistExpression(
        node.expression,
        joinPath(path, "expression"),
        mode,
      );
    }
    case "ReturnStatement": {
      return node.argument == null
        ? EMPTY
        : hoistExpression(node.argument, joinPath(path, "argument"), mode);
    }
    case "SwitchStatement": {
      return concatXX(
        hoistExpression(
          node.discriminant,
          joinPath(path, "discriminant"),
          mode,
        ),
        scopeHoisting(
          BLOCK_SCOPING,
          flatMapIndex(node.cases.length, (index) =>
            hoistSwitchCase(
              node.cases[index],
              joinDeepPath(path, "cases", index),
              mode,
            ),
          ),
          path,
        ),
      );
    }
    case "ThrowStatement": {
      return hoistExpression(node.argument, joinPath(path, "argument"), mode);
    }
    case "TryStatement": {
      return concatXXX(
        hoistStatement(node.block, joinPath(path, "block"), mode),
        node.handler == null
          ? EMPTY
          : hoistCatchClause(node.handler, joinPath(path, "handler"), mode),
        node.finalizer == null
          ? EMPTY
          : hoistStatement(node.finalizer, joinPath(path, "finalizer"), mode),
      );
    }
    case "WithStatement": {
      return concatXX(
        hoistExpression(node.object, joinPath(path, "object"), mode),
        hoistStatement(node.body, joinPath(path, "body"), mode),
      );
    }
    case "ContinueStatement": {
      return EMPTY;
    }
    case "BreakStatement": {
      return EMPTY;
    }
    case "EmptyStatement": {
      return EMPTY;
    }
    case "DebuggerStatement": {
      return EMPTY;
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

////////////
// export //
////////////

/**
 * @type {(
 *   kind: import("./hoist2").Kind,
 * ) => import("./hoist2").Writable}
 */
const getKindWritable = (kind) => {
  switch (kind) {
    case "var": {
      return "yes";
    }
    case "let": {
      return "yes";
    }
    case "const": {
      return "no-report";
    }
    case "function-strict": {
      return "yes";
    }
    case "function-sloppy": {
      return "yes";
    }
    case "class": {
      return "yes";
    }
    case "param": {
      return "yes";
    }
    case "param-legacy": {
      return "yes";
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/**
 * @type {(
 *   kind: import("./hoist2").Kind,
 * ) => import("./hoist2").Baseline}
 */
const getKindBaseline = (kind) => {
  switch (kind) {
    case "var": {
      return "undefined";
    }
    case "let": {
      return "deadzone";
    }
    case "const": {
      return "deadzone";
    }
    case "function-strict": {
      return "undefined";
    }
    case "function-sloppy": {
      return "undefined";
    }
    case "class": {
      return "deadzone";
    }
    case "param": {
      return "deadzone";
    }
    case "param-legacy": {
      return "undefined";
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/**
 * @type {(
 *   hoist: import("./hoist2").Hoist,
 * ) => import("./hoist2").Binding}
 */
const toBinding = ({ kind, variable }) => ({
  variable,
  baseline: getKindBaseline(kind),
  writable: getKindWritable(kind),
});

/**
 * @type {(
 *   hoist: import("./hoist2").Hoist,
 * ) => import("./hoist2").Duplicate}
 */
const toDuplicate = ({ variable, origin }) => ({ variable, origin });

/**
 * @type {(
 *   bindings: import("./hoist2").Binding[],
 *   variable: import("../../estree").Variable,
 * ) => boolean}
 */
const hasVariable = (bindings, variable) => {
  for (const { variable: other_variable } of bindings) {
    if (variable === other_variable) {
      return true;
    }
  }
  return false;
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: import("../../estree").Program,
 *   path: import("../../path").Path,
 *   mode: import("./hoist2").Mode,
 *   kind: "module" | "eval" | "script",
 * ) => import("./hoist2").Result}
 */
export const hoist = (node, path, mode, kind) => {
  const hoisting = hoistProgram(node, path, mode, kind);
  /** @type {import("./hoist2").Binding[]} */
  const unbound = [];
  /** @type {import("./hoist2").Registery} */
  const bound = /** @type {any} */ ({ __proto__: null });
  /** @type {import("./hoist2").Duplicate[]} */
  const report = [];
  for (const hoist of hoisting) {
    if (hoist.status.type === "unbound") {
      if (!hasVariable(unbound, hoist.variable)) {
        unbound[unbound.length] = toBinding(hoist);
      }
    } else if (hoist.status.type === "bound") {
      if (hasOwn(bound, hoist.status.path)) {
        const bindings = bound[hoist.status.path];
        if (!hasVariable(bindings, hoist.variable)) {
          bindings[bindings.length] = toBinding(hoist);
        }
      } else {
        bound[hoist.status.path] = [toBinding(hoist)];
      }
    } else if (hoist.status.type === "report") {
      report[report.length] = toDuplicate(hoist);
    } else {
      throw new AranTypeError(hoist.status);
    }
  }
  return { unbound, bound, report };
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   registery: import("./hoist2").Registery,
 *   path: import("../../path").Path,
 * ) => import("./hoist2").Binding[]}
 */
export const listBinding = (registery, path) =>
  hasOwn(registery, path) ? registery[path] : EMPTY;
