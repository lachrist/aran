import type { GetDefault, KeyOfUnion } from "../util/util";
import type { DeclareHeader, ModuleHeader } from "./header";

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

export type ResolvePartialAtom<atom extends Partial<Atom>> = {
  Label: GetDefault<atom, "Label", string>;
  Variable: GetDefault<atom, "Variable", string>;
  Source: GetDefault<atom, "Source", string>;
  Specifier: GetDefault<atom, "Specifier", string>;
  Tag: GetDefault<atom, "Tag", string>;
};

///////////////
// Component //
///////////////

export type SyntaxPrimitive =
  | null
  | boolean
  | number
  | string
  | { bigint: string };

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

export type ExtraIntrinsicRecord = {
  "aran.global": typeof globalThis;
  "aran.transpileEval": (
    code: string,
    situ: string,
    hash: string | number,
  ) => Program<Atom>;
  "aran.retropileEval": (aran: Program<Atom>) => string;
  "aran.declareGlobalVariable": (name: string) => void;
  "aran.readGlobalVariable": (name: string) => unknown;
  "aran.typeofGlobalVariable": (name: string) => string;
  "aran.discardGlobalVariable": (name: string) => boolean;
  "aran.writeGlobalVariableStrict": (name: string, value: unknown) => boolean;
  "aran.writeGlobalVariableSloppy": (name: string, value: unknown) => boolean;
  "aran.record": Record<string, unknown>;
  "aran.performUnaryOperation": (
    operator: string,
    argument: unknown,
  ) => unknown;
  "aran.performBinaryOperation": (
    operator: string,
    left: unknown,
    right: unknown,
  ) => unknown;
  "aran.throwException": (value: unknown) => never;
  "aran.get": (object: unknown, key: unknown) => unknown;
  "aran.deadzone": symbol;
  // https://262.ecma-international.org/14.0#sec-topropertykey
  "aran.toPropertyKey": (value: unknown) => string | symbol;
  "aran.isConstructor": (value: unknown) => boolean;
  "aran.toArgumentList": (
    array: unknown[],
    callee: Function | null,
  ) => ArrayLike<unknown>;
  "aran.sliceObject": (
    object: object,
    exclusion: { [key in PropertyKey]: null },
  ) => object;
  "aran.listForInKey": (object: unknown) => string[];
  "aran.listIteratorRest": <X>(
    iterator: Iterator<X>,
    next: (result: unknown) => IteratorResult<X>,
  ) => X[];
  "aran.createObject": (prototype: object, ...entries: unknown[]) => unknown;
  "aran.AsyncGeneratorFunction.prototype.prototype": AsyncGeneratorFunction["prototype"];
  "aran.GeneratorFunction.prototype.prototype": GeneratorFunction["prototype"];
};

export type HeadlessClosureKind = "arrow" | "function" | "method";

export type HeadfulClosureKind = "generator";

export type ClosureKind = HeadlessClosureKind | HeadfulClosureKind;

export type AranIntrinsic = keyof ExtraIntrinsicRecord;

export type Intrinsic = RegularIntrinsic | AccessorIntrinsic | AranIntrinsic;

export type IntrinsicRecord = RegularIntrinsicRcord &
  AccessorIntrinsicRecord &
  ExtraIntrinsicRecord;

export type Parameter =
  | "import"
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
  | "private.check"
  | "private.get"
  | "private.has"
  | "private.set"
  | "scope.read"
  | "scope.writeStrict"
  | "scope.writeSloppy"
  | "scope.typeof"
  | "scope.discard";

//////////
// Node //
//////////

export type Program<atom extends Atom = Atom> =
  | {
      type: "Program";
      kind: "module";
      situ: "global";
      head: ModuleHeader[];
      body: HeadlessRoutineBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "Program";
      kind: "script";
      situ: "global";
      head: DeclareHeader[];
      body: HeadlessRoutineBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "Program";
      kind: "eval";
      situ: "global";
      head: DeclareHeader[];
      body: HeadlessRoutineBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "Program";
      kind: "eval";
      situ: "local.root";
      head: DeclareHeader[];
      body: HeadlessRoutineBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "Program";
      kind: "eval";
      situ: "local.deep";
      head: [];
      body: HeadlessRoutineBlock<atom>;
      tag: atom["Tag"];
    };

///////////
// Block //
///////////

export type SegmentBlock<atom extends Atom = Atom> = {
  type: "SegmentBlock";
  labels: atom["Label"][];
  bindings: [atom["Variable"], Intrinsic][];
  body: Statement<atom>[];
  tag: atom["Tag"];
};

export type RoutineBlock<A extends Atom = Atom> = {
  type: "RoutineBlock";
  bindings: [A["Variable"], Intrinsic][];
  head: Effect<A>[] | null;
  body: Statement<A>[];
  tail: Expression<A>;
  tag: A["Tag"];
};

export type HeadlessRoutineBlock<atom extends Atom = Atom> =
  RoutineBlock<atom> & {
    head: null;
  };

export type HeadfulRoutineBlock<atom extends Atom = Atom> =
  RoutineBlock<atom> & {
    head: Effect<atom>[];
  };

export type Statement<atom extends Atom = Atom> =
  | {
      type: "EffectStatement";
      inner: Effect<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "BreakStatement";
      label: atom["Label"];
      tag: atom["Tag"];
    }
  | {
      type: "DebuggerStatement";
      tag: atom["Tag"];
    }
  | {
      type: "BlockStatement";
      body: SegmentBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "IfStatement";
      test: Expression<atom>;
      then: SegmentBlock<atom>;
      else: SegmentBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "WhileStatement";
      test: Expression<atom>;
      body: SegmentBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "TryStatement";
      try: SegmentBlock<atom>;
      catch: SegmentBlock<atom>;
      finally: SegmentBlock<atom>;
      tag: atom["Tag"];
    };

export type Effect<atom extends Atom = Atom> =
  | {
      type: "ExpressionEffect";
      discard: Expression<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "ConditionalEffect";
      test: Expression<atom>;
      positive: Effect<atom>[];
      negative: Effect<atom>[];
      tag: atom["Tag"];
    }
  | {
      type: "WriteEffect";
      variable: Parameter | atom["Variable"];
      value: Expression<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "ExportEffect";
      export: atom["Specifier"];
      value: Expression<atom>;
      tag: atom["Tag"];
    };

export type Expression<atom extends Atom = Atom> =
  // Produce //
  | {
      type: "PrimitiveExpression";
      primitive: SyntaxPrimitive;
      tag: atom["Tag"];
    }
  | {
      type: "IntrinsicExpression";
      intrinsic: Intrinsic;
      tag: atom["Tag"];
    }
  | {
      type: "ImportExpression";
      source: atom["Source"];
      import: atom["Specifier"] | null;
      tag: atom["Tag"];
    }
  | {
      type: "ReadExpression";
      variable: Parameter | atom["Variable"];
      tag: atom["Tag"];
    }
  | {
      type: "ClosureExpression";
      kind: HeadlessClosureKind;
      asynchronous: boolean;
      body: HeadlessRoutineBlock<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "ClosureExpression";
      kind: HeadfulClosureKind;
      asynchronous: boolean;
      body: HeadfulRoutineBlock<atom>;
      tag: atom["Tag"];
    }
  // Control //
  | {
      type: "AwaitExpression";
      promise: Expression<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "YieldExpression";
      delegate: boolean;
      item: Expression<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "SequenceExpression";
      head: Effect<atom>[];
      tail: Expression<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "ConditionalExpression";
      test: Expression<atom>;
      consequent: Expression<atom>;
      alternate: Expression<atom>;
      tag: atom["Tag"];
    }
  // Combine //
  | {
      type: "EvalExpression";
      code: Expression<atom>;
      tag: atom["Tag"];
    }
  | {
      type: "ApplyExpression";
      callee: Expression<atom>;
      this: Expression<atom>;
      arguments: Expression<atom>[];
      tag: atom["Tag"];
    }
  | {
      type: "ConstructExpression";
      callee: Expression<atom>;
      arguments: Expression<atom>[];
      tag: atom["Tag"];
    };

export type Node<A extends Atom = Atom> =
  | Program<A>
  | SegmentBlock<A>
  | RoutineBlock<A>
  | Statement<A>
  | Effect<A>
  | Expression<A>;

export type NodeKey = KeyOfUnion<Node<Atom>>;
