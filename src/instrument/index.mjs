
import {createCounter} from "../util.mjs";
import {visitProgram} from "./visit.mjs";

export const instrumentProgram = (trap_enclave_variable, pointcut, scope_enclave_variable) => visitProgram({
  counter: createCounter(),
  scope: createRootScope(),
  script: scope_enclave_variable,
  trap: {
    namespace: trap_enclave_variable,
    pointcut,
  },
  kind: null,
  header: null,
});
