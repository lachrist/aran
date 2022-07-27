import {assertEqual} from "../__fixture__.mjs";
import {getSyntax, isSyntaxType} from "./syntax.mjs";
getSyntax();

// Enumeration //
assertEqual(isSyntaxType("arrow", "ClosureType"), true);
assertEqual(isSyntaxType("foo", "ClosureType"), false);

// Type //
assertEqual(isSyntaxType("'foo'", "Source"), true);
assertEqual(isSyntaxType(123, "Source"), false);

// Specifier //
assertEqual(isSyntaxType(null, "Specifier"), false);
assertEqual(isSyntaxType("this", "Specifier"), true);
assertEqual(isSyntaxType("new.target", "Specifier"), false);

// NullableSpecifier //
assertEqual(isSyntaxType(null, "NullableSpecifier"), true);
assertEqual(isSyntaxType("this", "NullableSpecifier"), true);
assertEqual(isSyntaxType("new.target", "NullableSpecifier"), false);

// Label //
assertEqual(isSyntaxType("foo", "Label"), true);
assertEqual(isSyntaxType("this", "Label"), true);

// Variable //
assertEqual(isSyntaxType("foo", "Variable"), true);
assertEqual(isSyntaxType("this", "Variable"), true);
