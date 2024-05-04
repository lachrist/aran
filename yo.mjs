let getSuperInner = null;

let getSuper = (key) => {
  if (getSuperInner === null) {
    throw new Error("getSuperInner is null");
  } else {
    return getSuperInner(key);
  }
};
getSuperInner = getSuperInner ?? ((key) => super[key]);

// const newTarget = (key) => {};

// function readStrict(variable) {}
