export const getErrorLeft = ({annotation1, value1}) => ({
  annotation: annotation1,
  value: value1,
});

export const getErrorRight = ({annotation2, value2}) => ({
  annotation: annotation2,
  value: value2,
});

export const getErrorMessage = ({message, path}) => `${message} at ${path}`;

export const makeRootError = () => ({
  message: null,
  path: "",
  annotation1: null,
  value1: null,
  annotation2: null,
  value2: null,
});

export const appendErrorPath = (error, segment) => ({
  ...error,
  path: `${error.path}${segment}`,
});

export const setErrorMessage = (error, message) => ({
  ...error,
  message,
});

export const setErrorAnnotationPair = (error, annotation1, annotation2) => ({
  ...error,
  annotation1,
  annotation2,
});

export const setErrorValuePair = (error, value1, value2) => ({
  ...error,
  value1,
  value2,
});
