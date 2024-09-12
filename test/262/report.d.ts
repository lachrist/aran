export type ReportName =
  | "AranEvalError"
  | "AranRealmError"
  | "AranHarnessError"
  | "AranAssertionError"
  | "AranUnreachableError"
  | (string & { __brand: "ReportName" });

export type Report = (name: ReportName, message: string) => Error;
