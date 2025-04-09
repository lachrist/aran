import type { Result } from "./result.d.ts";
import type { TestCase, TestIndex } from "./test-case.d.ts";

export type TestReport = {
  index: TestIndex;
  test: TestCase;
  result: Result;
};
