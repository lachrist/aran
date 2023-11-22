export type Atom = {
  Label: string;
  Variable: string;
  GlobalVariable: string;
  Source: string;
  Specifier: string;
  Tag: unknown;
};

export type Primitive =
  | { undefined: null }
  | null
  | boolean
  | number
  | { nan: null }
  | { zero: "+" | "-" }
  | { infinity: "+" | "-" }
  | { bigint: string }
  | string;

export type VariableKind = "var" | "let" | "const";

export type AranIntrinsic =
  | "aran.global"
  | "aran.cache"
  | "aran.record.variables"
  | "aran.record.values"
  | "aran.unary"
  | "aran.binary"
  | "aran.throw"
  | "aran.createObject"
  | "aran.get"
  | "aran.set.strict"
  | "aran.set.sloppy"
  | "aran.delete.strict"
  | "aran.delete.sloppy"
  | "aran.deadzone"
  | "aran.hidden.weave"
  | "aran.hidden.rebuild"
  | "aran.toPropertyKey";

export type Intrinsic =
  // Aran //
  | AranIntrinsic
  // Symbol //
  | "Symbol"
  | "Symbol.prototype.description@get"
  | "Symbol.unscopables"
  | "Symbol.asyncIterator"
  | "Symbol.iterator"
  | "Symbol.isConcatSpreadable"
  | "Symbol.toStringTag"
  // String //
  | "String.prototype.concat"
  // Object //
  | "Object"
  | "Object.create"
  | "Object.prototype"
  | "Object.fromEntries"
  | "Object.entries"
  | "Object.assign"
  | "Object.keys"
  | "Object.freeze"
  | "Object.defineProperty"
  | "Object.setPrototypeOf"
  | "Object.preventExtensions"
  // Array //
  | "Array.from"
  | "Array.of"
  | "Array.prototype.flat"
  | "Array.prototype.values"
  | "Array.prototype.concat"
  | "Array.prototype.includes"
  | "Array.prototype.slice"
  | "Array.prototype.fill"
  | "Array.prototype.push"
  // Function //
  | "Function.prototype.arguments@get"
  | "Function.prototype.arguments@set"
  // WeakMap //
  | "WeakMap"
  | "WeakMap.prototype.has"
  | "WeakMap.prototype.get"
  | "WeakMap.prototype.set"
  // WeakSet //
  | "WeakSet"
  | "WeakSet.prototype.has"
  | "WeakSet.prototype.add"
  // Reflect //
  | "Reflect.get"
  | "Reflect.has"
  | "Reflect.construct"
  | "Reflect.apply"
  | "Reflect.setProtoypeOf"
  | "Reflect.getPrototypeOf"
  | "Reflect.ownKeys"
  | "Reflect.isExtensible"
  | "Reflect.set"
  | "Reflect.deleteProperty"
  | "Reflect.setPrototypeOf"
  | "Reflect.getOwnPropertyDescriptor"
  | "Reflect.preventExtensions"
  | "Reflect.defineProperty"
  // Others //
  | "Number"
  | "globalThis"
  | "eval"
  | "Proxy"
  | "String"
  | "RegExp"
  | "TypeError"
  | "ReferenceError"
  | "SyntaxError";

export type Parameter =
  | "this"
  | "import"
  | "catch.error"
  // https://github.com/allenwb/ESideas/blob/HEAD/ES7MetaProps.md
  | "function.arguments"
  | "import.meta"
  | "new.target"
  | "super.get"
  | "super.set"
  | "super.call"
  | "private.get"
  | "private.has"
  | "private.set"
  | "scope.read"
  | "scope.write"
  | "scope.typeof";

export type Program<A extends Atom> =
  | {
      type: "ScriptProgram";
      body: PseudoBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "ModuleProgram";
      links: Link<A>[];
      body: ClosureBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "EvalProgram";
      body: ClosureBlock<A>;
      tag: A["Tag"];
    };

export type Link<A extends Atom> =
  | {
      type: "ImportLink";
      source: A["Source"];
      import: A["Specifier"] | null;
      tag: A["Tag"];
    }
  | { type: "ExportLink"; export: A["Specifier"]; tag: A["Tag"] }
  | {
      type: "AggregateLink";
      source: A["Source"];
      import: null | A["Specifier"];
      export: A["Specifier"];
      tag: A["Tag"];
    }
  | {
      type: "AggregateLink";
      source: A["Source"];
      import: null;
      export: null;
      tag: A["Tag"];
    };

export type ClosureBlock<A extends Atom> = {
  type: "ClosureBlock";
  variables: A["Variable"][];
  statements: Statement<A>[];
  completion: Expression<A>;
  tag: A["Tag"];
};

export type ControlBlock<A extends Atom> = {
  type: "ControlBlock";
  labels: A["Label"][];
  variables: A["Variable"][];
  statements: Statement<A>[];
  tag: A["Tag"];
};

export type PseudoBlock<A extends Atom> = {
  type: "PseudoBlock";
  statements: Statement<A>[];
  completion: Expression<A>;
  tag: A["Tag"];
};

export type Statement<A extends Atom> =
  | { type: "EffectStatement"; inner: Effect<A>; tag: A["Tag"] }
  | { type: "ReturnStatement"; result: Expression<A>; tag: A["Tag"] }
  | { type: "BreakStatement"; label: A["Label"]; tag: A["Tag"] }
  | { type: "DebuggerStatement"; tag: A["Tag"] }
  | {
      type: "DeclareGlobalStatement";
      kind: VariableKind;
      variable: A["GlobalVariable"];
      right: Expression<A>;
      tag: A["Tag"];
    }
  | { type: "BlockStatement"; do: ControlBlock<A>; tag: A["Tag"] }
  | {
      type: "IfStatement";
      if: Expression<A>;
      then: ControlBlock<A>;
      else: ControlBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "WhileStatement";
      while: Expression<A>;
      do: ControlBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "TryStatement";
      try: ControlBlock<A>;
      catch: ControlBlock<A>;
      finally: ControlBlock<A>;
      tag: A["Tag"];
    };

export type Effect<A extends Atom> =
  | { type: "ExpressionEffect"; discard: Expression<A>; tag: A["Tag"] }
  | {
      type: "ConditionalEffect";
      condition: Expression<A>;
      positive: Effect<A>[];
      negative: Effect<A>[];
      tag: A["Tag"];
    }
  | {
      type: "WriteEffect";
      variable: Parameter | A["Variable"];
      right: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "WriteGlobalEffect";
      variable: A["GlobalVariable"];
      right: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "ExportEffect";
      export: A["Specifier"];
      right: Expression<A>;
      tag: A["Tag"];
    };

export type Expression<A extends Atom> =
  // Produce //
  | {
      type: "PrimitiveExpression";
      primitive: aran.Primitive;
      tag: A["Tag"];
    }
  | { type: "IntrinsicExpression"; intrinsic: Intrinsic; tag: A["Tag"] }
  | {
      type: "ImportExpression";
      source: A["Source"];
      import: A["Specifier"] | null;
      tag: A["Tag"];
    }
  | {
      type: "ReadExpression";
      variable: Parameter | A["Variable"];
      tag: A["Tag"];
    }
  | {
      type: "ReadGlobalExpression";
      variable: A["GlobalVariable"];
      tag: A["Tag"];
    }
  | {
      type: "TypeofGlobalExpression";
      variable: A["GlobalVariable"];
      tag: A["Tag"];
    }
  | {
      type: "FunctionExpression";
      asynchronous: boolean;
      generator: boolean;
      body: ClosureBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "ArrowExpression";
      asynchronous: boolean;
      body: ClosureBlock<A>;
      tag: A["Tag"];
    }
  // Control //
  | { type: "AwaitExpression"; promise: Expression<A>; tag: A["Tag"] }
  | {
      type: "YieldExpression";
      delegate: boolean;
      item: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "SequenceExpression";
      head: Effect<A>;
      tail: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "ConditionalExpression";
      condition: Expression<A>;
      consequent: Expression<A>;
      alternate: Expression<A>;
      tag: A["Tag"];
    }
  // Combine //
  | {
      type: "EvalExpression";
      code: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "ApplyExpression";
      callee: Expression<A>;
      this: Expression<A>;
      arguments: Expression<A>[];
      tag: A["Tag"];
    }
  | {
      type: "ConstructExpression";
      callee: Expression<A>;
      arguments: Expression<A>[];
      tag: A["Tag"];
    };

export type Node<A extends Atom> =
  | Program<A>
  | Link<A>
  | ControlBlock<A>
  | ClosureBlock<A>
  | PseudoBlock<A>
  | Statement<A>
  | Effect<A>
  | Expression<A>;

export as namespace aran;
