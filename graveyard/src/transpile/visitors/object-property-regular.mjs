import { assert, deadcode___ } from "../../util/index.mjs";
import { isPrototypeProperty } from "../../query/index.mjs";
import { annotateProperty } from "../annotate.mjs";
import { OBJECT_VALUE } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateProperty,
  Property: (node, context, site) => {
    assert(node.kind === "init", "unexpected accessor property");
    assert(!isPrototypeProperty(node), "unexpected prototype property");
    return visit(node.value, context, {
      ...OBJECT_VALUE,
      self: site.self,
      method: node.method,
      computed: node.computed,
      key: node.key,
    });
  },
  SpreadElement: deadcode___("unexpected spread property"),
};
