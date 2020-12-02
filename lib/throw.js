"use strict";

const global_Error = global.Error;

exports.MissingFeatureAranError = class MissingFeatureAranError extends global_Error {
  constructor (message, feature) {
    super(message);
    this.feature = feature;
  }
}

exports.InvalidArgumentAranError = class InvalidArgumentAranError extends global_Error {
  constructor (message) {
    super(message);
  }
};

exports.abort = (constructor, message, optional) => { throw new (constructor || global_Error)(message, optional) }

exports.assert = (check, constructor, message, optional) => check || exports.abort(constructor, message, optional);
