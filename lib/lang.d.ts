import {
  DeclareHeader,
  ImportDynamicParameterHeader,
  ImportMetaParameterHeader,
  ModuleProgramHeader,
  ParameterHeader,
  ScopeParameterHeader,
  ThisParameterHeader,
} from "./header";

//////////
// Atom //
//////////

export type Atom = {
  Label: string;
  Variable: string;
  Source: string;
  Specifier: string;
  Tag: unknown;
};

///////////////
// Component //
///////////////

export type Primitive = null | boolean | number | string | { bigint: string };

export type RuntimePrimitive = null | boolean | number | string | bigint;

export type RegularIntrinsicRcord = {
  // Symbol //
  "Symbol": typeof Symbol;
  "Symbol.unscopables": typeof Symbol.unscopables;
  "Symbol.asyncIterator": typeof Symbol.asyncIterator;
  "Symbol.iterator": typeof Symbol.iterator;
  "Symbol.isConcatSpreadable": typeof Symbol.isConcatSpreadable;
  "Symbol.toStringTag": typeof Symbol.toStringTag;
  // String //
  "String.prototype.concat": typeof String.prototype.concat;
  // Object //
  "Object": typeof Object;
  "Object.hasOwn": typeof Object.prototype.hasOwnProperty;
  "Object.create": typeof Object.create;
  "Object.prototype": typeof Object.prototype;
  "Object.assign": typeof Object.assign;
  "Object.keys": typeof Object.keys;
  "Object.freeze": typeof Object.freeze;
  "Object.defineProperty": typeof Object.defineProperty;
  "Object.setPrototypeOf": typeof Object.setPrototypeOf;
  "Object.preventExtensions": typeof Object.preventExtensions;
  // Array //
  "Array.from": typeof Array.from;
  "Array.of": typeof Array.of;
  "Array.prototype.flat": typeof Array.prototype.flat;
  "Array.prototype.values": typeof Array.prototype.values;
  "Array.prototype.concat": typeof Array.prototype.concat;
  "Array.prototype.includes": typeof Array.prototype.includes;
  "Array.prototype.slice": typeof Array.prototype.slice;
  "Array.prototype.fill": typeof Array.prototype.fill;
  "Array.prototype.push": typeof Array.prototype.push;
  // Function //
  "Function.prototype": typeof Function.prototype;
  // WeakMap //
  "WeakMap": typeof WeakMap;
  "WeakMap.prototype.has": typeof WeakMap.prototype.has;
  "WeakMap.prototype.get": typeof WeakMap.prototype.get;
  "WeakMap.prototype.set": typeof WeakMap.prototype.set;
  // Map //
  "Map": typeof Map;
  "Map.prototype.has": typeof Map.prototype.has;
  "Map.prototype.get": typeof Map.prototype.get;
  "Map.prototype.set": typeof Map.prototype.set;
  // WeakSet //
  "WeakSet": typeof WeakSet;
  "WeakSet.prototype.has": typeof WeakSet.prototype.has;
  "WeakSet.prototype.add": typeof WeakSet.prototype.add;
  // Reflect //
  "Reflect.get": typeof Reflect.get;
  "Reflect.has": typeof Reflect.has;
  "Reflect.construct": typeof Reflect.construct;
  "Reflect.apply": typeof Reflect.apply;
  "Reflect.setProtoypeOf": typeof Reflect.setPrototypeOf;
  "Reflect.getPrototypeOf": typeof Reflect.getPrototypeOf;
  "Reflect.ownKeys": typeof Reflect.ownKeys;
  "Reflect.isExtensible": typeof Reflect.isExtensible;
  "Reflect.set": typeof Reflect.set;
  "Reflect.deleteProperty": typeof Reflect.deleteProperty;
  "Reflect.setPrototypeOf": typeof Reflect.setPrototypeOf;
  "Reflect.getOwnPropertyDescriptor": typeof Reflect.getOwnPropertyDescriptor;
  "Reflect.preventExtensions": typeof Reflect.preventExtensions;
  "Reflect.defineProperty": typeof Reflect.defineProperty;
  // Number //
  "Number": typeof Number;
  "Number.NEGATIVE_INFINITY": typeof Number.NEGATIVE_INFINITY;
  "Number.POSITIVE_INFINITY": typeof Number.POSITIVE_INFINITY;
  // Others //
  "Function": typeof Function;
  "undefined": typeof undefined;
  "globalThis": typeof globalThis;
  "eval": typeof eval;
  "Proxy": typeof Proxy;
  "String": typeof String;
  "RegExp": typeof RegExp;
  "TypeError": typeof TypeError;
  "ReferenceError": typeof ReferenceError;
  "SyntaxError": typeof SyntaxError;
};

export type RegularIntrinsic = keyof RegularIntrinsicRcord;

export type AccessorIntrinsicRecord = {
  "Symbol.prototype.description@get": (this: symbol) => string | undefined;
  "Function.prototype.arguments@get": (this: Function) => void;
  "Function.prototype.arguments@set": (this: Function, value: unknown) => void;
};

export type AccessorIntrinsic = keyof AccessorIntrinsicRecord;

export type AranIntrinsicRecord = {
  "aran.global": typeof globalThis;
  "aran.record": Record<string, unknown>;
  "aran.unary": (operator: string, argument: unknown) => unknown;
  "aran.binary": (operator: string, left: unknown, right: unknown) => unknown;
  "aran.throw": (value: unknown) => never;
  "aran.get": (object: unknown, key: unknown) => unknown;
  "aran.deadzone": symbol;
  // https://262.ecma-international.org/14.0#sec-topropertykey
  "aran.toPropertyKey": (value: unknown) => string | symbol;
  "aran.listForInKey": (object: unknown) => string[];
  "aran.listRest": <X>(iterator: Iterator<X>, result: IteratorResult<X>) => X[];
  "aran.createObject": (prototype: object, ...entries: unknown[]) => unknown;
  "aran.AsyncGeneratorFunction.prototype.prototype": AsyncGeneratorFunction["prototype"];
  "aran.GeneratorFunction.prototype.prototype": GeneratorFunction["prototype"];
};

export type AranIntrinsic = keyof AranIntrinsicRecord;

export type Intrinsic = RegularIntrinsic | AccessorIntrinsic | AranIntrinsic;

export type IntrinsicRecord = RegularIntrinsicRcord &
  AccessorIntrinsicRecord &
  AranIntrinsicRecord;

export type Parameter =
  | "import.dynamic"
  | "import.meta"
  | "this"
  | "new.target"
  // https://github.com/allenwb/ESideas/blob/HEAD/ES7MetaProps.md
  | "function.arguments"
  | "function.callee"
  | "catch.error"
  | "super.get"
  | "super.set"
  | "super.call"
  | "private.get"
  | "private.has"
  | "private.set"
  | "scope.read"
  | "scope.write"
  | "scope.typeof"
  | "scope.discard";

//////////
// Node //
//////////

export type Program<A extends Atom> =
  | {
      type: "Program";
      kind: "module";
      situ: "global";
      head: (
        | ModuleProgramHeader
        | ScopeParameterHeader
        | ThisParameterHeader
        | ImportDynamicParameterHeader
        | ImportMetaParameterHeader
      )[];
      body: RoutineBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "Program";
      kind: "script";
      situ: "global";
      head: (
        | DeclareHeader
        | ScopeParameterHeader
        | ThisParameterHeader
        | ImportDynamicParameterHeader
      )[];
      body: RoutineBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "Program";
      kind: "eval";
      situ: "global";
      head: (
        | DeclareHeader
        | ScopeParameterHeader
        | ThisParameterHeader
        | ImportDynamicParameterHeader
      )[];
      body: RoutineBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "Program";
      kind: "eval";
      situ: "local.root";
      head: (DeclareHeader | ParameterHeader)[];
      body: RoutineBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "Program";
      kind: "eval";
      situ: "local.deep";
      head: ParameterHeader[];
      body: RoutineBlock<A>;
      tag: A["Tag"];
    };

export type RoutineBlock<A extends Atom> = {
  type: "RoutineBlock";
  frame: [A["Variable"], Intrinsic][];
  body: Statement<A>[];
  completion: Expression<A>;
  tag: A["Tag"];
};

export type ControlBlock<A extends Atom> = {
  type: "ControlBlock";
  labels: A["Label"][];
  frame: [A["Variable"], Intrinsic][];
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
      primitive: Primitive;
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
      type: "ClosureExpression";
      kind: "function";
      asynchronous: boolean;
      generator: boolean;
      body: RoutineBlock<A>;
      tag: A["Tag"];
    }
  | {
      type: "ClosureExpression";
      kind: "arrow";
      asynchronous: boolean;
      generator: false;
      body: RoutineBlock<A>;
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
  | RoutineBlock<A>
  | Statement<A>
  | Effect<A>
  | Expression<A>;

type KeyOfUnion<T> = T extends T ? keyof T : never;

export type NodeKey = KeyOfUnion<Node<Atom>>;
