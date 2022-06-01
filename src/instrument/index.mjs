import {createCounter} from "../util/index.mjs";
import {createRootScope} from "./scope.mjs";
import {visitProgram} from "./visit.mjs";

export const instrumentProgram = (
  pointcut,
  program,
  {traps, scope},
  {unmangleVariable, unmangleLabel},
) =>
  visitProgram(
    {

      unmangleVariable,
      unmangleLabel,
      counter: createCounter(0),
      scope: createRootScope(),
      script: scope,
      trap: {
        namespace: traps,
        pointcut,
      },
      kind: null,
      header: null,
    },
    program,
  );
