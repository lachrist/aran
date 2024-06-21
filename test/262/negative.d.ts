export type Flaky = boolean;

export type Status = "positive" | "negative" | "flaky";

export type Negative = {
  exact: Map<
    string,
    {
      flaky: boolean;
      causes: string[];
    }
  >;
  group: [
    RegExp,
    {
      flaky: boolean;
      cause: string;
    },
  ][];
};
