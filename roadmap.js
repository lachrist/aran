const global_declare_cache = {__proto__:null};
const global_read_cache = {__proto__:null};
const global_write_cache = {__proto__:null};

aran.object = (prototype, ... properties) => {
  const object = {__proto__:null};
  if (properties.length % 2 !== 0) {
    throw new Error("Properties length mismatch");
  }
  const length = properties.length / 2;
  for (const index = 0; index < length; index += 1) {
    object[properties[2 * index]] = properties[2 * index + 1];
  }
  setPrototypeOf(object, prototype);
  return object;
};
aran.throw = (error) => { throw error; };
aran.unary = (operator, argument) => {};
aran.binary = (operator, left, right) => {};
aran.declareGlobal = (kind, variable, value) => {
  global.__HIDDEN__ = value;
  global.eval(`${kind} ${variable} = __HIDDEN__;`);
};
aran.readGlobal = (variable) => {
  if (variable in global_typeof_cache) {
    return global_typeof_cache[variable]();
  } else {
    assert(variable !== "arguments");
    const typeofVariable = new global.Function(`return ${variable};`);
    global_typeof_cache[variable] = typeofVariable;
    return typeofVariable();
  }
};
aran.typeofGlobal = (variable) => {
  if (variable in global_typeof_cache) {
    return global_typeof_cache[variable]();
  } else {
    assert(variable !== "arguments");
    const typeofVariable = new Function(`return typeof ${variable};`);
    global_typeof_cache[variable] = typeofVariable;
    return typeofVariable();
  }
};
aran.writeGlobal = (variable, value) => {
  if (variable in global_write_cache) {
    global_write_cache[variable](value);
  } else {
    assert(variable !== "__HIDDEN__");
    assert(variable !== "arguments");
    const writeVariable = new Function("__HIDDEN__", `${variable} = __HIDDEN__;`);
    global_write_cache[variable] = writeVariable;
    writeVariable(value)
  }
};
aran.get = (object, key) => object[key];
aran.setSloppy = (object, key, value) => {
  Reflect.set(Object(object), key, value);
  return value;
};
aran.setStrict = (object, key, value) => object[key] = value;

// Global Code //

ScriptDeclareStatement = ["kind", "variable", "expression"];

// Module //
input = {
  __proto__: null,
  "this": this,
  "import": (source) => import(source),
  "import.meta": import.meta,
};

// Script
input = {
  __proto__: null,
  "this": this,
  "import": (source) => import("source"),
};

// LocalEval [Identifier]
input = {__proto__:null};

// LocalEval //
const input = {__proto__:null};

// GlobalEval //
const input = {
  __proto__: null,
  this: this,
  import: (source) => import(source),
};

// EnclaveEval //
const cache_write = {__proto__:null};
const input = {
  __proto__: null,
  "this": this,
  "import": (source) => import(source),
  "new.target": [enclaves.includes("new.target") ? "new.target" : "null"],
  "super.set": [enclaves.includes("super.set")
    ? "(key, value) => { super[key] = value; }"
    : "() => { throw new SyntaxError('Cannot access super property'); }"
  ],
  "super.get": [enclaves.includes("super.get")
    ? "(key) => super[key]"
    : "() => { throw new SyntaxError('Cannot access super property'); }"
  ],
  "super.call": [enclaves.includes("super.get")
    ? "(values) => super(... values)"
    : "() => { throw new SyntaxError('Cannot call super'); }"
  ],
  "scope.typeof": (variable) => eval(`(typeof ${variable});`),
  "scope.read": (variable) => eval(`(${variable});`),
  "scope.write": (variable, value) => {
    if (variable in cache_write) {
      return cache_write[variable](value);
    } else {
      assert(isIdentifier(variable));
      assert(variable !== "__HIDDEN__");
      const writeVariable = eval(`((__HIDDEN__) => ${variable} = __HIDDEN__);`);
      cache_write[variable] = writeVariable;
      return writeVariable(value);
    }
  },
};

// Local Eval //

const input = {__proto__: null};

// Invoke //

InvokeExpression: (context, expression1, expression2, expressions, serial) => {
  if (
    cut(context.trap.pointcut, "apply", null, null, repeat(null, expressions.length), serial)
  ) {
    const this_variable = makeMetaVariable(`this_${String(incrementCounter(context.counter))}`);
    declareScopeVariable(context.scope, {
      variable: makeOldVariable(this_variable),
      value: null,
      duplicable: false,
      initialized: true,
    });
    return visitExpression(
      context,
      makeSequenceExpression(
        makeWriteEffect(
          this_variable,
          expression1,
        ),
        makeApplyExpression(
          makeApplyExpression(
            makeInstrinsicExpression("aran.get"),
            makeLiteralExpression({undefined:null}),
            [makeReadExpression(this_variable), expression2],
          ),
          makeReadExpression(this_variable),
          expressions,
        ),
      ),
    );
  } else {
    return makeInvokeExpression(
      visitExpression(context, expression1),
      visitExpression(context, expression2),
      map(expressions, (expression) => visitExpression(context, expression)),
    );
  }
}
