"use strict";

// StratifiedStratifiedIdentifier = MetaStratifiedIdentifier / BaseStratifiedIdentifier
// MetaStratifiedIdentifier = $("_" StratifiedIdentifier)
// BaseStratifiedIdentifier = $("$" StratifiedIdentifier)
// StratifiedIdentifier = MetaIdentifier / BaseIdentifier
// BaseIdentifier = "$0newtarget" / $("$" Identifier)
// MetaIdentifier = "_0newtarget" / $("_" Identifier)
// Identifier = "new.target" / $(IdentifierHead IdentifierPart*)
// IdentifierHead = s:(.) & { return /\p{ID_Start}|\$|_/u.test(s) }
// IdentifierPart = s:(.) & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(s) }

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

const ONE = [1];

const map = {
  __proto__: null,
  "new.target": "0newtarget",
  "import.meta": "0importmeta"};

const reverse_map = {
  __proto__: null,
  "$0newtarget": "new.target",
  "_0newtarget": "new.target",
  "$0importmeta": "import.meta",
  "_0importmeta": "import.meta"};

exports.Base = (nullable_identifier) => (
  nullable_identifier === null ?
  "$" :
  (
    nullable_identifier in map ?
    "$" + map[nullable_identifier] :
    "$" + nullable_identifier));

exports.Meta = (nullable_identifier) => (
  nullable_identifier === null ?
  "_" :
  (
    nullable_identifier in map ?
    "_" + map[nullable_identifier] :
    "_" + nullable_identifier));

exports.IsBase = (stratified_identifier) => stratified_identifier[0] === "$";

exports.IsMeta = (stratified_identifier) => stratified_identifier[0] === "_";

exports.GetBody = (stratified_identifier) => (
  stratified_identifier in reverse_map ?
  reverse_map[stratified_identifier] :
  (
    stratified_identifier.length === 1 ?
    null :
    global_Reflect_apply(global_String_prototype_substring, stratified_identifier, ONE)));