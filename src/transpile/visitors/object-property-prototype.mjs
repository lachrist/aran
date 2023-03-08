import { assert, deadcode___ } from "../../util/index.mjs";
import { isPrototypeProperty } from "../../query/index.mjs";
import { annotate } from "../annotate.mjs";
import { OBJECT_PROTOTYPE } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotate,
  Property: (node, context, _site) => {
    assert(isPrototypeProperty(node), "expected proto property");
    return visit(node.value, context, OBJECT_PROTOTYPE);
  },
  SpreadElement: deadcode___("unexpected spread property"),
};
