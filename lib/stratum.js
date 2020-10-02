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

exports._base = (nullable_identifier) => (
  nullable_identifier === null ?
  "$" :
  (
    nullable_identifier === "new.target" ?
    "$0newtarget" :
    "$" + nullable_identifier));

exports._meta = (nullable_identifier) => (
  nullable_identifier === null ?
  "_" :
  (
    nullable_identifier === "new.target" ?
    "_0newtarget" :
    "_" + nullable_identifier));

exports._is_base = (stratified_identifier) => stratified_identifier[0] === "$";

exports._is_meta = (stratified_identifier) => stratified_identifier[0] === "_";

exports._get_body = (stratified_identifier) => (
  stratified_identifier[1] === "0" ?
  "new.target" :
  (
    stratified_identifier.length === 1 ?
    null :
    global_Reflect_apply(global_String_prototype_substring, stratified_identifier, ONE)));
