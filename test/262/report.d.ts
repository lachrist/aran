import { Result } from "./result";
import { TestCase, TestIndex } from "./test-case";

export type TestReport = {
  index: TestIndex;
  test: TestCase;
  result: Result;
};
