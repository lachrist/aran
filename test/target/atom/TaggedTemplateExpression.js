
function f () {
  "use strict";
  if (this !== void 0)
    throw new Error("TaggedTemplateExpression1");
  if (arguments.length !== 2)
    throw new Error("TaggedTemplateExpression2");
  if (!Array.isArray(arguments[0]))
    throw new Error("TaggedTemplateExpression3");
  if (Reflect.isExtensible(arguments[0]))
    throw new Error("TaggedTemplateExpression4");
  if (arguments[0].length !== 2)
    throw new Error("TaggedTemplateExpression5");
  if (arguments[0][0] !== "foo")
    throw new Error("TaggedTemplateExpression6");
  if (arguments[0][1] !== "bar")
    throw new Error("TaggedTemplateExpression7");
  if (!Array.isArray(arguments[0].raw))
    throw new Error("TaggedTemplateExpression8");
  if (Reflect.isExtensible(arguments[0].raw))
    throw new Error("TaggedTemplateExpression9");
  if (arguments[0].raw.length !== 2)
    throw new Error("TaggedTemplateExpression10");
  if (arguments[0].raw[0] !== "foo")
    throw new Error("TaggedTemplateExpression11");
  if (arguments[0].raw[1] !== "bar")
    throw new Error("TaggedTemplateExpression12");
  if (arguments[1] !== 123)
    throw new Error("TaggedTemplateExpression13");
  return "abc";
};

if (f `foo${123}bar` !== "abc")
  throw new Error("TaggedTemplateExpression14");
