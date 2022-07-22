
import {
  concat,
  flatMap,
} from "array-lite";

import {
  bind_,
  partial_x,
  partial_xx,
  partial__x_,
  partialx__xx_x_x_,
} from "../../util/index.mjs";

import {
  makeReturnStatement,
  makeLiteralExpression,
} from "../../ast/index.mjs";

import {
  sortStatementArray,
  hoistBodyDeep,
  hoistBodyShallow,
  getDeclarationKind,
  getDeclarationVariable,
  getDeclarationExportSpecifierArray,
} from "../../query/index.mjs";

import {
  declareBase,
  makeScopeRegularStaticBlock,
  makeScopeWithDynamicBlock,
  makeScopeClosureStaticBlock,
  makeScopeClosureDynamicBlock,
} from "../scope/index.mjs";

import {
  getContextScoping,
} from "./context.mjs";

import {
  applyVisitor,
} from "./visit.mjs";

import {
  visitStatement,
} from "./statement.mjs";

const declare = (scoping, declaration) =>
  declareBase(
    scoping,
    getDeclarationKind(declaration),
    getDeclarationVariable(declaration),
    getDeclarationExportSpecifierArray(declaration),
  );

const visitBlockBody = (nodes, context, completion) => {
  forEach(
    completion === null ? hoistBodyDeep(nodes) : hoistBodyShallow(nodes),
    partialx_(declare, getContextScoping(context)),
  );
  return concat(
    flatMap(
      sortStatementArray(nodes),
      partial_xx(
        visitStatement,
        context,
        {completion},
      ),
    ),
    completion === null
      ? [
        makeReturnStatement(makeLiteralExpression({undefined:null})),
      ]
      : [],
  );
};

const blocking = { makeStaticBlock: makeScopeRegularStaticBlock, makeDynamicBlock:makeScopeWithDynamicBlock};

const closuring = { makeStaticBlock: makeScopeClosureStaticBlock, makeDynamicBlock:makeScopeClosureDynamicBlock}

const injectDynamic = (dynamic, {makeStaticBlock, makeDynamicBlock}) => dynamic === null
  ? makeStaticBlock
  : partial__x_(makeDynamicBlock, dynamic);

export const visitBlock = partialxx___(
  applyVisitor,
  {
    BlockStatement: (node, serial, context, {labels, dynamic, completion}) => {
      const makeScopeBlock = injectDynamic(
        dynamic,
        completion === null ? closuring : blocking,
      );
      return annotateNode(
        makeScopeBlock(
          getContextScoping(context),
          labels,
          bind_(
            partialx_x(visitBlockBody, node.body, completion),
            partialx_(setContextScope, context),
          ),
        ),
        serial,
      );
    },
  },
  {
    labels: [],
    dynamic: null,
    completion: null,
  },
);
