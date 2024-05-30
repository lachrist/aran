/** @type {(node: import("../../estree").PrivateIdentifier) => import("../../estree").PrivateKey} */
export const getPrivateKey = ({ name }) =>
  /** @type {import("../../estree").PrivateKey} */ (name);
