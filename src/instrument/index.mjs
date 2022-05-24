import {createCounter} from "../util/index.mjs";
import {createRootScope} from "./scope.mjs";
import {visitProgram} from "./visit.mjs";

export const instrumentProgram = (
  scope_enclave_variable,
  trap_enclave_variable,
  pointcut,
  program,
) =>
  visitProgram(
    {
      counter: createCounter(0),
      scope: createRootScope(),
      script: scope_enclave_variable,
      trap: {
        namespace: trap_enclave_variable,
        pointcut,
      },
      kind: null,
      header: null,
    },
    program,
  );
