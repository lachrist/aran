import {map, forEach, concat, flatMap, slice} from "array-lite";

import {
  assert,
  bind_,
  partialx_,
  partialxx_,
  partial_xx,
  partial__x_,
  partialxx___,
  SyntaxAranError,
} from "../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeImportLink,
  makeAggregateLink,
  makeExportLink,
  makeReturnStatement,
} from "../../ast/index.mjs";

import {
  sortBody,
  inferCompletionNodeArray,
  hoistBodyDeep,
  getDeclarationKind,
  getDeclarationVariable,
  getDeclarationExportSpecifierArray,
} from "../../query/index.mjs";

import {
  declareBase,
  declareMeta,
  makeMetaInitializeEffect,
  makeMetaReadExpression,
  makeScopeScriptProgram,
  makeScopeModuleProgram,
  makeScopeGlobalEvalProgram,
  makeScopeExternalLocalEvalProgram,
  makeScopeInternalLocalEvalProgram,
} from "../scope/index.mjs";

import {getContextScoping, setContextScope} from "./context.mjs";

import {applyVisitor} from "./visit.mjs";

import {visitExpression} from "./expression.mjs";

import {visitStatement} from "./statement.mjs";

const {Error} = globalThis;

export const SCRIPT = "script";
export const MODULE = "module";
export const GLOBAL_EVAL = "global-eval";
export const EXTERNAL_LOCAL_EVAL = "internal-local-eval";
export const INTERNAL_LOCAL_EVAL = "internal-local-eval";

const visitLinkImportSpecifier = (node) => {
  if (node.type === "ImportNamespaceSpecifier") {
    return null;
  } else if (node.type === "ImportDefaultSpecifier") {
    return "default";
  } else if (node.type === "ImportSpecifier") {
    return node.imported.name;
  } else {
    throw new SyntaxAranError("Invalid ImportSpecifier type");
  }
};

const visitLinkExportSpecifier = (node) => {
  if (node.type === "ExportSpecifier") {
    return node.exported.name;
  } else {
    throw new SyntaxAranError("Invalid ExportSpecifier type");
  }
};

const visitLinkStatement = (node) => {
  if (node.type === "ImportDeclaration") {
    return map(
      map(node.specifiers, visitLinkImportSpecifier),
      partialx_(makeImportLink, node.source.value),
    );
  } else if (node.type === "ExportAllDeclaration") {
    return [makeAggregateLink()];
  } else if (node.type === "ExportNamedDeclaration") {
    if (node.declaration !== null) {
      return [makeExportLink(node.declaration.id.name)];
    } else {
      return map(
        map(node.specifiers, visitLinkExportSpecifier),
        node.source === null
          ? makeExportLink
          : partialx_(makeAggregateLink, node.source.value),
      );
    }
  } else {
    return [];
  }
};

const declare = (scoping, declaration) =>
  declareBase(
    scoping,
    getDeclarationKind(declaration),
    getDeclarationVariable(declaration),
    getDeclarationExportSpecifierArray(declaration),
  );

const visitBody = (type, nodes, context) => {
  forEach(hoistBodyDeep(nodes), partialx_(declare, getContextScoping(context)));
  if (type === "module") {
    return concat(flatMap(nodes, partial_xx(visitStatement, context, null)), [
      makeReturnStatement(makeLiteralExpression({undefined: null})),
    ]);
  } else if (type === "script") {
    if (nodes.length === 0) {
      return [makeReturnStatement(makeLiteralExpression({undefined: null}))];
    } else if (nodes[nodes.length - 1].type === "ExpressionStatement") {
      return concat(
        flatMap(
          slice(nodes, 0, nodes.length - 1),
          partial_xx(visitStatement, context, null),
        ),
        [
          makeReturnStatement(
            visitExpression(nodes[nodes.length - 1], context, null),
          ),
        ],
      );
    } else {
      const scoping = getContextScoping(context);
      const meta = declareMeta(scoping, "completion");
      return concat(
        [
          makeEffectStatement(
            makeMetaInitializeEffect(
              scoping,
              meta,
              makeLiteralExpression({undefined: null}),
            ),
          ),
        ],
        flatMap(
          nodes,
          partial_xx(visitStatement, context, {
            completion: {meta, nodes: inferCompletionNodeArray(nodes)},
          }),
        ),
        [makeReturnStatement(makeMetaReadExpression(scoping, meta))],
      );
    }
  } else {
    throw new Error("invalid Program.sourceType");
  }
};

const generateMakeScopeProgram = (specific, node) => {
  if (specific.type === SCRIPT) {
    return makeScopeScriptProgram;
  } else if (specific.type === MODULE) {
    return partial__x_(
      makeScopeModuleProgram,
      flatMap(visitLinkStatement, node.body),
    );
  } else if (specific.type === GLOBAL_EVAL) {
    return makeScopeGlobalEvalProgram;
  } else if (specific.type === EXTERNAL_LOCAL_EVAL) {
    return partial__x_(makeScopeExternalLocalEvalProgram, specific.specials);
  } else if (specific.type === INTERNAL_LOCAL_EVAL) {
    return makeScopeInternalLocalEvalProgram;
  } else {
    throw new Error("invalid program type");
  }
};

export const visitProgram = partialxx___(
  applyVisitor,
  {
    Program: (node, context, specific) => {
      assert(
        ((node.sourceType === "module") === specific.type) === MODULE,
        "Program.sourceType mismatch",
      );
      const makeScopeProgram = generateMakeScopeProgram(specific, node);
      return makeScopeProgram(
        getContextScoping(context),
        specific.enclave,
        bind_(
          partialxx_(visitBody, node.source.type, sortBody(node.body)),
          partialx_(setContextScope, context),
        ),
      );
    },
  },
  {type: MODULE, enclave: false, specials: []},
);
