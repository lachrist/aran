import { Header } from "../lib/header";
import { Sort } from "../lib/sort";

export type ProgramKind =
  | "script"
  | "module"
  | "global-eval"
  | "local-eval"
  | "aran-eval";

export type Atom = {
  Label: string;
  Variable: string;
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

export type GlobalVariableKind = "var" | "let";

export type RegularIntrinsic =
  // Symbol //
  | "Symbol"
  | "Symbol.unscopables"
  | "Symbol.asyncIterator"
  | "Symbol.iterator"
  | "Symbol.isConcatSpreadable"
  | "Symbol.toStringTag"
  // String //
  | "String.prototype.concat"
  // Object //
  | "Object"
  | "Object.hasOwn"
  | "Object.create"
  | "Object.prototype"
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
  | "Function.prototype"
  // WeakMap //
  | "WeakMap"
  | "WeakMap.prototype.has"
  | "WeakMap.prototype.get"
  | "WeakMap.prototype.set"
  // Map //
  | "Map"
  | "Map.prototype.has"
  | "Map.prototype.get"
  | "Map.prototype.set"
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
  | "Function"
  | "undefined"
  | "Number"
  | "globalThis"
  | "eval"
  | "Proxy"
  | "String"
  | "RegExp"
  | "TypeError"
  | "ReferenceError"
  | "SyntaxError";

export type AccessorIntrinsic =
  | "Symbol.prototype.description@get"
  | "Function.prototype.arguments@get"
  | "Function.prototype.arguments@set";

export type AranIntrinsic =
  | "aran.global"
  | "aran.record"
  | "aran.templates"
  | "aran.unary"
  | "aran.binary"
  | "aran.throw"
  | "aran.get"
  | "aran.deadzone"
  // https://262.ecma-international.org/14.0#sec-topropertykey
  | "aran.toPropertyKey"
  | "aran.listForInKey"
  | "aran.listRest"
  | "aran.createObject"
  | "aran.AsyncGeneratorFunction.prototype.prototype"
  | "aran.GeneratorFunction.prototype.prototype";

export type Intrinsic = RegularIntrinsic | AccessorIntrinsic | AranIntrinsic;

export type Parameter =
  | "import.dynamic"
  | "import.meta"
  | "this"
  | "new.target"
  // https://github.com/allenwb/ESideas/blob/HEAD/ES7MetaProps.md
  | "function.arguments"
  | "catch.error"
  | "super.get"
  | "super.set"
  | "super.call"
  | "private.get"
  | "private.has"
  | "private.set"
  | "read.strict"
  | "write.strict"
  | "typeof.strict"
  | "read.sloppy"
  | "write.sloppy"
  | "typeof.sloppy"
  | "discard.sloppy";

export type Isolate =
  | {
      type: "primitive";
      primitive: Primitive;
    }
  | {
      type: "intrinsic";
      intrinsic: Intrinsic;
    }
  | {
      type: "json";
      json: Json;
    };

export type Program<A extends Atom> = {
  type: "Program";
  sort: Sort;
  head: Header[];
  body: ClosureBlock<A>;
  tag: A["Tag"];
};

export type ClosureBlock<A extends Atom> = {
  type: "ClosureBlock";
  frame: [A["Variable"], Isolate][];
  body: Statement<A>[];
  completion: Expression<A>;
  tag: A["Tag"];
};

export type ControlBlock<A extends Atom> = {
  type: "ControlBlock";
  labels: A["Label"][];
  frame: [A["Variable"], Isolate][];
  body: Statement<A>[];
  tag: A["Tag"];
};

export type Statement<A extends Atom> =
  | {
      type: "EffectStatement";
      inner: Effect<A>;
      tag: A["Tag"];
    }
  | {
      type: "ReturnStatement";
      result: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "BreakStatement";
      label: A["Label"];
      tag: A["Tag"];
    }
  | {
      type: "DebuggerStatement";
      tag: A["Tag"];
    }
  | {
      type: "BlockStatement";
      body: ControlBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "IfStatement";
      test: Expression<A>;
      then: ControlBlock<A>;
      else: ControlBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "WhileStatement";
      test: Expression<A>;
      body: ControlBlock<A>;
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
  | {
      type: "ExpressionEffect";
      discard: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "ConditionalEffect";
      test: Expression<A>;
      positive: Effect<A>[];
      negative: Effect<A>[];
      tag: A["Tag"];
    }
  | {
      type: "WriteEffect";
      variable: Parameter | A["Variable"];
      value: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "ExportEffect";
      export: A["Specifier"];
      value: Expression<A>;
      tag: A["Tag"];
    };

export type Expression<A extends Atom> =
  // Produce //
  | {
      type: "PrimitiveExpression";
      primitive: aran.Primitive;
      tag: A["Tag"];
    }
  | {
      type: "IntrinsicExpression";
      intrinsic: Intrinsic;
      tag: A["Tag"];
    }
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
  | {
      type: "AwaitExpression";
      promise: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "YieldExpression";
      delegate: boolean;
      item: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "SequenceExpression";
      head: Effect<A>[];
      tail: Expression<A>;
      tag: A["Tag"];
    }
  | {
      type: "ConditionalExpression";
      test: Expression<A>;
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
  | ControlBlock<A>
  | ClosureBlock<A>
  | Statement<A>
  | Effect<A>
  | Expression<A>;

type KeyOfUnion<T> = T extends T ? keyof T : never;

export type NodeKey = KeyOfUnion<Node<Atom>>;

export as namespace aran;
