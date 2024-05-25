import {
  DeclareHeader,
  Header,
  ScopeParameterHeader,
  ModuleProgramHeader,
  PrivateParameterHeader,
  ParameterHeader,
  ThisParameterHeader,
  ImportMetaParameterHeader,
  ImportDynamicParameterHeader,
} from "../header";
import { Label, ResVariable } from "./atom";
import { ControlKind } from "./point";

export type Mode = "strict" | "sloppy";

type VariableFrame<V> = {
  [key in ResVariable]: V;
};

export type ProgramFrame<V> =
  | {
      type: "program";
      kind: "module";
      situ: "global";
      head: (
        | ModuleProgramHeader
        | ScopeParameterHeader
        | ThisParameterHeader
        | ImportMetaParameterHeader
        | ImportDynamicParameterHeader
      )[];
      record: VariableFrame<V> & {
        "this": V;
        "import.dynamic": V;
        "import.meta": V;
        "scope.read": V;
        "scope.write": V;
        "scope.typeof": V;
        "scope.discard": V;
      };
    }
  | {
      type: "program";
      kind: "script";
      situ: "global";
      head: (
        | DeclareHeader
        | ScopeParameterHeader
        | ThisParameterHeader
        | ImportDynamicParameterHeader
      )[];
      record: VariableFrame<V> & {
        "this": V;
        "import.dynamic": V;
        "scope.read": V;
        "scope.write": V;
        "scope.typeof": V;
        "scope.discard": V;
      };
    }
  | {
      type: "program";
      kind: "eval";
      situ: "global";
      head: (
        | DeclareHeader
        | ScopeParameterHeader
        | ThisParameterHeader
        | ImportDynamicParameterHeader
      )[];
      record: VariableFrame<V> & {
        "this": V;
        "import.dynamic": V;
        "scope.read": V;
        "scope.write": V;
        "scope.typeof": V;
        "scope.discard": V;
      };
    }
  | {
      type: "program";
      kind: "eval";
      situ: "local.root";
      head: (DeclareHeader | ParameterHeader)[];
      record: VariableFrame<V> & {
        "this": V;
        "new.target": V;
        "import.meta": V;
        "import.dynamic": V;
        "scope.read": V;
        "scope.write": V;
        "scope.typeof": V;
        "scope.discard": V;
        "private.get": V;
        "private.has": V;
        "private.set": V;
        "super.get": V;
        "super.set": V;
        "super.call": V;
      };
    }
  | {
      type: "program";
      kind: "eval";
      situ: "local.deep";
      head: ParameterHeader[];
      record: VariableFrame<V>;
    };

export type ClosureFrame<V> =
  | {
      type: "closure";
      kind: "arrow";
      asynchronous: boolean;
      generator: false;
      record: VariableFrame<V> & {
        "function.callee": V;
        "function.arguments": V;
      };
    }
  | {
      type: "closure";
      kind: "function";
      asynchronous: boolean;
      generator: boolean;
      record: VariableFrame<V> & {
        "function.callee": V;
        "new.target": V;
        "this": V;
        "function.arguments": V;
      };
    };

export type ControlFrame<V> =
  | {
      type: "control";
      kind: "catch";
      labels: Label[];
      record: VariableFrame<V> & {
        "catch.error": V;
      };
    }
  | {
      type: "control";
      kind: Exclude<ControlKind, "catch">;
      labels: Label[];
      record: VariableFrame<V>;
    };

export type Frame<V> = ProgramFrame<V> | ClosureFrame<V> | ControlFrame<V>;
