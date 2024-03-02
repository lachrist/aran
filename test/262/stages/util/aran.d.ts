export type Value = unknown;

export type Location = Brand<string, "Location">;

export type Base = Brand<string, "Base">;

export type Advice = import("../../../../type/advice").Advice<Value, Location>;
