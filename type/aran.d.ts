import { type } from "os";
import { Situ } from "../lib/situ";
import { Header } from "../lib/header";

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

export type GlobalVariableKind = "var" | "let";

export type AranIntrinsic =
  | "aran.global"
  | "aran.record"
  | "aran.templates"
  | "aran.unary"
  | "aran.binary"
  | "aran.throw"
  | "aran.createObject"
  | "aran.get"
  | "aran.deadzone"
  // https://262.ecma-international.org/14.0#sec-topropertykey
  | "aran.toPropertyKey"
  | "aran.listForInKey"
  | "aran.listRest"
  | "aran.AsyncGeneratorFunction.prototype.prototype"
  | "aran.GeneratorFunction.prototype.prototype";

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
  | "Object.hasOwn"
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
  | "Function.prototype"
  | "Function.prototype.arguments@get"
  | "Function.prototype.arguments@set"
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
  | "read.strict"
  | "write.strict"
  | "typeof.strict"
  | "discard.strict"
  | "read.sloppy"
  | "write.sloppy"
  | "typeof.sloppy"
  | "discard.sloppy";

// ////////////
// // Module //
// ////////////

// export type ModuleProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": true;
//     "import": true;
//     "import.meta": true;
//     "new.target": false;
//     "super.get": false;
//     "super.set": false;
//     "super.call": false;
//     "private": null;
//     "let.strict": null;
//     "let.sloppy": null;
//     "var.strict": null;
//     "var.sloppy": null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": null;
//   };
//   body: ClosureBlock<A>;
// };

// ////////////
// // Script //
// ////////////

// export type StrictScriptProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": true;
//     "import": true;
//     "import.meta": false;
//     "new.target": false;
//     "super.get": false;
//     "super.set": false;
//     "super.call": false;
//     "private": null;
//     "let.strict": estree.Variable[] | null;
//     "let.sloppy": null;
//     "var.strict": estree.Variable[] | null;
//     "var.sloppy": null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": null;
//   };
//   body: ClosureBlock<A>;
// };

// export type SloppyScriptProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": true;
//     "import": true;
//     "import.meta": false;
//     "new.target": false;
//     "super.get": false;
//     "super.set": false;
//     "super.call": false;
//     "private": null;
//     "let.strict": null;
//     "let.sloppy": estree.Variable[] | null;
//     "var.strict": null;
//     "var.sloppy": estree.Variable[] | null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": estree.Variable[] | null;
//   };
//   body: ClosureBlock<A>;
// };

// /////////////////
// // Global Eval //
// /////////////////

// export type StrictGlobalEvalProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": true;
//     "import": true;
//     "import.meta": false;
//     "new.target": false;
//     "super.get": false;
//     "super.set": false;
//     "super.call": false;
//     "private": null;
//     "let.strict": null;
//     "let.sloppy": null;
//     "var.strict": null;
//     "var.sloppy": null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": null;
//   };
//   body: ClosureBlock<A>;
// };

// export type SloppyGlobalEvalProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": true;
//     "import": true;
//     "import.meta": false;
//     "new.target": false;
//     "super.get": false;
//     "super.set": false;
//     "super.call": false;
//     "private": null;
//     "let.strict": null;
//     "let.sloppy": null;
//     "var.strict": null;
//     "var.sloppy": estree.Variable[] | null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": estree.Variable[] | null;
//   };
//   body: ClosureBlock<A>;
// };

// /////////////////////////
// // Internal Local Eval //
// /////////////////////////

// export type StrictInternalLocalEvalProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": false;
//     "import": false;
//     "import.meta": false;
//     "new.target": false;
//     "super.get": false;
//     "super.set": false;
//     "super.call": false;
//     "private": estree.PrivateKey[] | null;
//     "let.strict": null;
//     "let.sloppy": null;
//     "var.strict": null;
//     "var.sloppy": null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": null;
//   };
//   body: ClosureBlock<A>;
// };

// /////////////////////////
// // External Local Eval //
// /////////////////////////

// type ProgramClosure = {
//   "new.target": false;
//   "super.get": false;
//   "super.set": false;
//   "super.call": false;
// };

// type FunctionClosure = {
//   "new.target": true;
//   "super.get": false;
//   "super.set": false;
//   "super.call": false;
// };

// type MethodClosure = {
//   "new.target": true;
//   "super.get": true;
//   "super.set": true;
//   "super.call": false;
// };

// type ConstructorClosure = {
//   "new.target": true;
//   "super.get": true;
//   "super.set": true;
//   "super.call": true;
// };

// export type StrictExternalLocalEvalProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": true;
//     "import": true;
//     "import.meta": boolean;
//     "private": estree.PrivateKey[] | null;
//     "let.strict": null;
//     "let.sloppy": null;
//     "var.strict": null;
//     "var.sloppy": null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": null;
//   } & (ProgramClosure | FunctionClosure | MethodClosure | ConstructorClosure);
//   body: ClosureBlock<A>;
// };

// export type SloppyExternalLocalEvalProgram<A extends Atom> = {
//   links: null;
//   head: {
//     "this": true;
//     "import": true;
//     "import.meta": boolean;
//     "private": estree.PrivateKey[] | null;
//     "let.strict": null;
//     "let.sloppy": null;
//     "var.strict": null;
//     "var.sloppy": estree.Variable[] | null;
//     "lookup.strict": estree.Variable[] | null;
//     "lookup.sloppy": estree.Variable[] | null;
//   } & (ProgramClosure | FunctionClosure | MethodClosure | ConstructorClosure);
//   body: ClosureBlock<A>;
// };

// export type ScriptProgram<A extends Atom> =
//   | StrictScriptProgram<A>
//   | SloppyScriptProgram<A>;

// export type GlobalEvalProgram<A extends Atom> =
//   | StrictGlobalEvalProgram<A>
//   | SloppyGlobalEvalProgram<A>;

// export type ExternalLocalEvalProgram<A extends Atom> =
//   | StrictExternalLocalEvalProgram<A>
//   | SloppyExternalLocalEvalProgram<A>;

// export type InternalLocalEvalProgram<A extends Atom> =
//   StrictInternalLocalEvalProgram<A>;

// export type LocalEvalProgram<A extends Atom> =
//   | ExternalLocalEvalProgram<A>
//   | InternalLocalEvalProgram<A>;

// export type EvalProgram<A extends Atom> =
//   | GlobalEvalProgram<A>
//   | LocalEvalProgram<A>;

// export type ValidProgram<A extends Atom> =
//   | ModuleProgram<A>
//   | ScriptProgram<A>
//   | EvalProgram<A>;

// export type Header =
//   | {
//       type: "regular";
//       name:
//         | "this"
//         | "import"
//         | "import.meta"
//         | "new.target"
//         | "super.get"
//         | "super.set"
//         | "super.call";
//     }
//   | {
//       type: "private";
//       name: estree.PrivateKey;
//     }
//   | {
//       type: "declare";
//       kind: "let" | "var";
//       mode: "strict" | "sloppy";
//       name: estree.Variable;
//     }
//   | {
//       type: "lookup";
//       mode: "strict" | "sloppy";
//       name: estree.Variable;
//     };

// export type Header =
//   | {
//       type: "regular";
//       name:
//         | "this"
//         | "import"
//         | "import.meta"
//         | "new.target"
//         | "super.get"
//         | "super.set"
//         | "super.call";
//     }
//   | {
//       type: "private";
//       name: estree.PrivateKey;
//     }
//   | {
//       type: "declare";
//       kind: "let" | "var";
//       mode: "strict" | "sloppy";
//       name: estree.Variable;
//     }
//   | {
//       type: "lookup";
//       mode: "strict" | "sloppy";
//       name: estree.Variable;
//     };

// export type ProgramHead = {
//   "this": boolean;
//   "import": boolean;
//   "import.meta": boolean;
//   "new.target": boolean;
//   "super.get": boolean;
//   "super.set": boolean;
//   "super.call": boolean;
//   "private": estree.PrivateKey[] | null;
//   "let.strict": estree.Variable[] | null;
//   "let.sloppy": estree.Variable[] | null;
//   "var.strict": estree.Variable[] | null;
//   "var.sloppy": estree.Variable[] | null;
//   "lookup.strict": estree.Variable[] | null;
//   "lookup.sloppy": estree.Variable[] | null;
// };

export type Program<A extends Atom> = {
  type: "Program";
  // source: "module" | "script";
  head: Header[];
  // links: Link<A>[] | null;
  // private: estree.PrivateKey[] | null;
  // scope: Scope[];
  // head: ProgramHead;
  body: ClosureBlock<A>;
  tag: A["Tag"];
};

// export type Link<A extends Atom> =
//   | {
//       type: "ImportLink";
//       source: A["Source"];
//       import: A["Specifier"] | null;
//       tag: A["Tag"];
//     }
//   | { type: "ExportLink"; export: A["Specifier"]; tag: A["Tag"] }
//   | {
//       type: "AggregateLink";
//       source: A["Source"];
//       import: null | A["Specifier"];
//       export: A["Specifier"];
//       tag: A["Tag"];
//     }
//   | {
//       type: "AggregateLink";
//       source: A["Source"];
//       import: null;
//       export: null;
//       tag: A["Tag"];
//     };

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

export type Statement<A extends Atom> =
  | { type: "EffectStatement"; inner: Effect<A>; tag: A["Tag"] }
  | { type: "ReturnStatement"; result: Expression<A>; tag: A["Tag"] }
  | { type: "BreakStatement"; label: A["Label"]; tag: A["Tag"] }
  | { type: "DebuggerStatement"; tag: A["Tag"] }
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
      head: Effect<A>[];
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
  | ControlBlock<A>
  | ClosureBlock<A>
  | Statement<A>
  | Effect<A>
  | Expression<A>;

export as namespace aran;
