/** @type {(node: estree.PrivateIdentifier) => estree.PrivateKey} */
export const getPrivateKey = ({ name }) =>
  /** @type {estree.PrivateKey} */ (name);
