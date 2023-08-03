type Email = string & { __emailBrand: never }; // Custom type with a symbol to represent an email string

function isValidEmail(email: string): email is Email {
  return /\S+@\S+\.\S+/.test(email);
}

const userEmail: Email = "john@example.com"; // Valid
const invalidEmail: Email = "invalid-email"; // Error: Type '"invalid-email"' is not assignable to type 'Email'.

if (isValidEmail(userEmail)) {
  // Inside this block, TypeScript recognizes userEmail as a valid email string.
}
