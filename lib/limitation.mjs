const {
  Reflect: { apply },
  console,
  console: { warn },
} = globalThis;

/** @type {(message: string) => void} */
export const reportLimitation = (message) => {
  apply(warn, console, [`Aran Limitation: ${message}`]);
};
