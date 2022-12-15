import { createRootScope } from "./scope.mjs";
import { visitProgram } from "./visit.mjs";

export const instrumentProgram = (
  program,
  pointcut,
  { counter, secret, advice },
  { unmangleVariable, unmangleLabel },
) =>
  visitProgram(
    {
      unmangleVariable,
      unmangleLabel,
      counter,
      scope: createRootScope(secret),
      pointcut,
      advice,
      kind: null,
      arrival: null,
      namespace: null,
    },
    program,
  );
