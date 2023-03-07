import {
  makeLiteralExpression,
  makeApplyExpression,
} from "../../ast/index.mjs";
import {
  makeArrayFromExpression,
  makeGetExpression,
} from "../../intrinsic.mjs";
import { annotateArray } from "./annotate.mjs";
import { PATTERN } from "./site.mjs";
import { visit } from "./context.mjs";

export default {
  __ANNOTATE__: annotateArray,
  RestElement: (node, context, site) =>
    visit(node.argument, context, {
      ...PATTERN,
      kind: site.kind,
      right: makeArrayFromExpression(site.iterator),
    }),
  __DEFAULT__: (node, context, site) =>
    visit(node, context, {
      ...PATTERN,
      kind: site.kind,
      right: makeApplyExpression(
        makeGetExpression(site.iterator, makeLiteralExpression("next")),
        site.iterator,
        [],
      ),
    }),
};
