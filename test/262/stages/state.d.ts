export type StackValue = { __brand: "StackValue" };

export type ScopeValue = { __brand: "ScopeValue" };

export type OtherValue = { __brand: "OtherValue" };

export type State = {
  Stack: StackValue[];
  Scope: { []: ScopeValue };
};
