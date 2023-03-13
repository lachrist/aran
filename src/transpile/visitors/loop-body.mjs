import { map, concat } from "array-lite";
import { incrementCounter } from "../../util/index.mjs";
import { hasEmptyContinue } from "../../query/index.mjs";
import { makeEmptyContinueLabel, makeFullContinueLabel } from "../label.mjs";
import { annotate } from "../annotate.mjs";
import { BLOCK } from "../site.mjs";
import { visit } from "../context.mjs";

const { String } = globalThis;

export default {
  __ANNOTATE__: annotate,
  __DEFAULT__: (node, context, site) => {
    if (hasEmptyContinue(node)) {
      const name = String(incrementCounter(context.counter));
      return visit(node, context, {
        ...BLOCK,
        labels: concat(map(site.labels, makeFullContinueLabel), [
          makeEmptyContinueLabel(name),
        ]),
        break: site.break,
        continue: name,
        completion: site.completion,
      });
    } else {
      return visit(node, context, {
        ...BLOCK,
        labels: map(site.labels, makeFullContinueLabel),
        break: site.break,
        completion: site.completion,
      });
    }
  },
};
