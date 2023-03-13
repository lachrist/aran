import { map, includes, concat } from "array-lite";
import {
  partial_xx,
  partialx_x,
  constant_,
  incrementCounter,
} from "../../util/index.mjs";
import {
  makeBreakStatement,
  makeBlockStatement,
  makeDebuggerStatement,
  makeEffectStatement,
  makeIfStatement,
} from "../../ast/index.mjs";
import { hasEmptyBreak } from "../../query/index.mjs";
import {
  makeEmptyBreakLabel,
  makeFullBreakLabel,
  makeEmptyContinueLabel,
  makeFullContinueLabel,
} from "../label.mjs";
import {
  makeScopeMetaWriteEffectArray,
  makeScopeNormalStaticBlock,
} from "../scope/index.mjs";
import { annotateArray } from "../annotate.mjs";
import { expectSyntax, makeSyntaxError } from "../report.mjs";
import { STATEMENT, BLOCK, LOOP, EFFECT, EXPRESSION } from "../site.mjs";
import { visit } from "../context.mjs";

const { String } = globalThis;

const makeEmptyBlock = partial_xx(
  makeScopeNormalStaticBlock,
  [],
  constant_([]),
);

const LOOP_TYPE_ARRAY = [
  "WhileStatement",
  "DoWhileStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "SwitchStatement",
];

export default {
  __ANNOTATE__: annotateArray,
  DebuggerStatement: (_node, _context, _site) => [makeDebuggerStatement()],
  EmptyStatement: (_node, _context, _site) => [],
  LabeledStatement: (node, context, { type: _type, labels, ...rest }) =>
    visit(node.body, context, {
      ...STATEMENT,
      ...rest,
      labels: concat(labels, [node.label.name]),
    }),
  ExpressionStatement: (node, context, { completion }) => {
    if (completion !== null && includes(completion.nodes, node)) {
      return map(
        makeScopeMetaWriteEffectArray(
          context,
          completion.meta,
          visit(node.expression, context, EXPRESSION),
        ),
        makeEffectStatement,
      );
    } else {
      return map(visit(node.expression, context, EFFECT), makeEffectStatement);
    }
  },
  ContinueStatement: (node, _context, site) => {
    if (node.label === null) {
      expectSyntax(site.continue !== null, node);
      return [makeBreakStatement(makeEmptyContinueLabel(site.continue))];
    } else {
      expectSyntax(!includes(site.labels, node.label.name), node);
      return [makeBreakStatement(makeFullContinueLabel(node.label.name))];
    }
  },
  BreakStatement: (node, _context, site) => {
    if (node.label === null) {
      expectSyntax(site.break !== null, node);
      return [makeBreakStatement(makeEmptyBreakLabel(site.break))];
    } else if (includes(site.labels, node.label.name)) {
      return [];
    } else {
      return [makeBreakStatement(makeFullBreakLabel(node.label.name))];
    }
  },
  BlockStatement: (node, context, { type: _type, ...rest }) => [
    makeBlockStatement(visit(node, context, { ...BLOCK, ...rest })),
  ],
  IfStatement: (node, context, { type: _type, ...rest }) => [
    makeIfStatement(
      visit(node.test, context, EXPRESSION),
      visit(node.consequent, context, { ...BLOCK, ...rest }),
      node.alternate === null
        ? makeEmptyBlock(context)
        : visit(node.alternate, context, { ...BLOCK, ...rest }),
    ),
  ],
  __DEFAULT__: (node, context, site) => {
    if (includes(LOOP_TYPE_ARRAY, node.type)) {
      if (hasEmptyBreak(node.body)) {
        const name = String(incrementCounter(context.counter));
        return [
          makeBlockStatement(
            makeScopeNormalStaticBlock(
              context,
              concat(map(site.labels, makeFullBreakLabel), [
                makeEmptyBreakLabel(name),
              ]),
              partialx_x(visit, node, {
                ...LOOP,
                labels: site.labels,
                completion: site.completion,
                break: name,
              }),
            ),
          ),
        ];
      } else if (site.labels.length > 0) {
        return [
          makeBlockStatement(
            makeScopeNormalStaticBlock(
              context,
              map(site.labels, makeFullBreakLabel),
              partialx_x(visit, node, {
                ...LOOP,
                labels: site.labels,
                completion: site.completion,
              }),
            ),
          ),
        ];
      } else {
        return visit(node, context, {
          ...LOOP,
          completion: site.completion,
        });
      }
    } /* c8 ignore start */ else {
      throw makeSyntaxError(node);
    } /* c8 ignore stop */
  },
};
