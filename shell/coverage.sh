npx c8 --reporter html --include "$1.mjs" -- node "$1.test.mjs" ; open coverage/index.html