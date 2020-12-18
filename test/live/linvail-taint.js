
const Acorn = require("acorn");
const Aran = require("aran");
const Linvail = require("linvail");

const advice = {};
const pointcut = (name, node) => name in advice;
const aran = Aran({format:"script"});
const internals = new WeakSet();
const callstack = [];
const push = (tag, name, serial) => {
  callstack.push({tag, name, inputs:[], serial});
  // console.log(Array(callstack.length + 1).join("."), tag, name, serial);
};
const peek = () => callstack[callstack.length - 1];
const pop = () => {
  const {tag, name, inputs, serial} = callstack.pop();
  // console.log(Array(callstack.length + 2).join("."), "pop", tag, name, serial);
};
global[aran.namespace] = advice;
global.eval(aran.setup());
const istainted = ($$value) => $$value.meta;
const membrane = {
  taint: (value, reason) => {
    // console.log(Array(callstack.length + 1).join("."), "taint", print(value), reason);
    let meta = null;
    if (peek().tag !== "internal" && peek().inputs.filter(istainted).length) {
      meta = Object.assign({}, peek());
      meta.inputs = meta.inputs.slice();
    }
    return {base:value, meta};
  },
  clean: ({base, meta}, reason) => {
    // console.log(Array(callstack.length + 1).join("."), "clean", print(base), meta, reason);
    peek().inputs.push({base, meta, reason});
    return base;
  }
};
const {capture, release} = Linvail(membrane, {check:true});
module.exports = (script) => {
  return aran.weave(Acorn.parse(script, {locations:true}), pointcut, null);
};
const print = (value) => {
  if (typeof value === "function")
    return "[function]";
  if (typeof value === "object" && value !== null)
    return Object.prototype.toString.call(value);
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
};
const log = ({base, meta:{tag, name, serial, inputs}, reason}, depth) => {
  const {line, column} = aran.nodes[serial].loc.start;
  console.log(Array(depth + 1).join("  ") + (reason || "") + " " + print(base) + " << " + tag + " " + name + " @" + line + ":" + column);
  for (const $$value of inputs) {
    if ($$value.meta) {
      log($$value, depth + 1);
      break;
    } else {
      // console.log(Array(depth + 1).join("  ") + (reason || "") + " " + print(base));
    }
  }
};

// Policy //
advice.write = ($$value, name, serial) => {
  if (typeof name === "string" && name.startsWith("_ARAN_SOURCE_")) {
    $$value.meta = {tag:"initial", name, serial, inputs:[]};
  } else if (typeof name === "string" && name.startsWith("_ARAN_SINK_") && $$value.meta) {
    log($$value, 0);
    throw membrane.taint(capture(new Error("Taint policy violation")));
  }
  return $$value;
};

// Program //
advice.program = (global, serial) => {
  push("internal", "program", serial);
};
advice.success = ($$value, serial) => {
  const value = release(membrane.clean($$value, "success"));
  pop();
  return value;
};
advice.failure = ($$value, serial) => {
  const value = release(membrane.clean($$value, "failure"));
  pop();
  return value;
};

// Closure //
advice.arrival = (callee, $newtarget, $$context, $$arguments, serial) => {
  push("internal", callee.name, serial);
};
advice.return = ($$value, serial) => {
  pop();
  return $$value;
};
advice.abrupt = ($$value, serial) => {
  pop();
  return $$value;
};

// Consumers //
advice.test = ($$value, serial) => membrane.clean($$value, "test");
advice.eval = ($$value, serial) => {
  const script = release(membrane.clean($$value, "eval"));
  return aran.weave(Acorn.parse(script, {locations:true}), pointcut, serial);
};

// Producers //
advice.argument = (_value, name) => {
  if (name === "length" || name === "new.target")
    return membrane.taint(_value);
  return _value;
};
advice.primitive = (primitive, serial) => membrane.taint(primitive, "primitive");
advice.intrinsic = (value, name, serial) => membrane.taint(capture(value), "intrinsic");
advice.closure = ($closure, serial) => {
  Reflect.setPrototypeOf($closure, capture(Function.prototype));
  internals.add($closure);
  return membrane.taint($closure, "closure");
};

// Combiners //
advice.apply = ($$value1, $$value2, $$values, serial) => {
  const $value1 = membrane.clean($$value1, "apply");
  if (internals.has($value1))
    return Reflect.apply($value1, $$value2, $$values);
  push("apply", release($value1).name, serial);
  try {
    return Reflect.apply($value1, $$value2, $$values);
  } finally {
    pop();
  }
};
advice.construct = ($$value, $$values, serial) => {
  const $value = membrane.clean($$value, "construct");
  if (internals.has($value))
    return Reflect.construct($value, $$values);
  push("construct", release($value).name, serial);
  try {
    return Reflect.construct($value, $$values);
  } finally {
    pop();
  }
};
advice.unary = (operator, $$value, serial) => {
  push("unary", operator, serial);
  const value = release(membrane.clean($$value, "unary-argument"));
  try {
    return membrane.taint(aran.unary(operator, value), "unary-result");
  } catch (error) {
    throw membrane.taint(capture(error), "unary-error");
  } finally {
    pop();
  }
  pop();
};
advice.binary = (operator, $$value1, $$value2, serial) => {
  push("binary", operator, serial);
  const value1 = release(membrane.clean($$value1), "binary-left");
  const value2 = release(membrane.clean($$value2), "binary-right");
  let primitive;
  try {
    return membrane.taint(aran.binary(operator, value1, value2), "binary-result")
  } catch (error) {
    throw membrane.taint(capture(error), "binary-error");
  } finally {
    pop();
  }
};
