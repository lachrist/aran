import {
  DeclareHeader,
  LookupHeader,
  ModuleHeader,
  PrivateHeader,
} from "../header";
import { Label, ResVariable } from "./atom";

export type Mode = "strict" | "sloppy";

type ScopeParameterFrame = {
  "scope.read": (mode: Mode, variable: ResVariable) => unknown;
  "scope.write": (mode: Mode, variable: ResVariable, value: unknown) => void;
  "scope.typeof": (mode: Mode, variable: ResVariable) => string;
  "scope.discard": (mode: Mode, variable: ResVariable) => void;
};

type VariableFrame = {
  [key in ResVariable]: unknown;
};

export type ProgramFrame =
  | {
      type: "program";
      kind: "module";
      situ: "global";
      head: (ModuleHeader | LookupHeader)[];
      record: VariableFrame &
        ScopeParameterFrame & {
          "this": undefined;
          "import.dynamic": (source: unknown) => Promise<unknown>;
          "import.meta": string;
        };
    }
  | {
      type: "program";
      kind: "script";
      situ: "global";
      head: (DeclareHeader | LookupHeader)[];
      record: VariableFrame &
        ScopeParameterFrame & {
          "this": typeof globalThis;
          "import.dynamic": (source: unknown) => Promise<unknown>;
        };
    }
  | {
      type: "program";
      kind: "eval";
      situ: "global";
      head: (DeclareHeader | LookupHeader)[];
      record: VariableFrame &
        ScopeParameterFrame & {
          "this": typeof globalThis;
          "import.dynamic": (source: unknown) => Promise<unknown>;
        };
    }
  | {
      type: "program";
      kind: "eval";
      situ: "local.root";
      head: (DeclareHeader | LookupHeader | PrivateHeader)[];
      record: VariableFrame &
        ScopeParameterFrame & {
          "this": unknown;
          "new.target": unknown;
          "import.meta": unknown;
          "import.dynamic": (source: unknown) => Promise<unknown>;
          "private.get": (obj: unknown, key: string) => unknown;
          "private.has": (obj: unknown, key: string) => boolean;
          "private.set": (obj: unknown, key: string, value: unknown) => void;
          "super.get": (key: string) => unknown;
          "super.set": (key: string, value: unknown) => void;
          "super.call": (key: string, args: unknown[]) => unknown;
        };
    }
  | {
      type: "program";
      kind: "eval";
      situ: "local.deep";
      head: (LookupHeader | PrivateHeader)[];
      record: VariableFrame;
    };

export type ClosureFrame =
  | {
      type: "closure";
      kind: "arrow";
      asynchronous: boolean;
      generator: false;
      record: VariableFrame & {
        "function.callee": Function;
        "function.arguments": unknown[];
      };
    }
  | {
      type: "closure";
      kind: "function";
      asynchronous: boolean;
      generator: boolean;
      record: VariableFrame & {
        "function.callee": Function;
        "new.target": Function | undefined;
        "this": unknown;
        "function.arguments": unknown[];
      };
    };

export type ControlFrame =
  | {
      type: "control";
      kind: "catch";
      labels: Label[];
      record: VariableFrame & {
        "catch.error": unknown;
      };
    }
  | {
      type: "control";
      kind: "try" | "finally" | "then" | "else" | "loop" | "naked";
      labels: Label[];
      record: VariableFrame;
    };

export type Frame = ProgramFrame | ClosureFrame | ControlFrame;
