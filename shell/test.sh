npx eslint --rulesdir eslint-rules "$1.mjs" "$1.test.mjs" &&
npx prettier -w "$1.mjs" "$1.test.mjs" &&
node "$1.mjs"