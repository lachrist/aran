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

exports.getBody = (identifier) => (
  identifier in map2 ?
  map2[identifier] :
  global_Reflect_apply(global_String_prototype_substring, identifier, ONE));

//////////////
// Variable //
//////////////

const BASE = "$";
const META = "_";

const map1 = {
  __proto__: null,
  "new.target": "$0newtarget",
  "import.meta": "$0importmeta"};

const map2 = {
  __proto__: null,
  "$0newtarget": "new.target",
  "$0importmeta": "import.meta"};

exports.makeBase = (identifier) => (
  identifier in map1 ?
  map1[identifier] :
  BASE + identifier);

exports.makeMeta = (identifier) => META + identifier;

exports.isBase = (identifier) => identifier[0] === BASE;

exports.isMeta = (identifier) => identifier[0] === META;

///////////
// Label //
///////////

const FULL_BREAK = "B";
const FULL_CONTINUE = "C";
const EMPTY_BREAK = "b";
const EMPTY_CONTINUE = "c";

exports.makeFullBreak = (identifier) => FULL_BREAK + identifier;

exports.makeFullContinue = (identifier) => FULL_CONTINUE + identifier;

exports.makeEmptyBreak = (identifier) => EMPTY_BREAK + identifier;

exports.makeEmptyContinue = (identifier) => EMPTY_CONTINUE + identifier;

exports.isBreak = (identifier) => identifier[0] === FULL_BREAK || identifier[0] === EMPTY_BREAK;

exports.isContinue = (identifier) => identifier[0] === FULL_CONTINUE || identifier[0] === EMPTY_CONTINUE;

exports.isEmpty = (identifier) => identifier[0] === EMPTY_BREAK || identifier[0] === EMPTY_CONTINUE;

exports.isFull = (identifier) => identifier[0] === FULL_BREAK || identifier[0] === FULL_CONTINUE;
