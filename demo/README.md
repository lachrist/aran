```sh
node node_modules/sandbox-scenario/bin.js --basedir . > bundle-apply.js \
  --spawn-type  raw        --spawn-path spawn.js                        \
  --parent-type browserify --parent-path analysis/apply.js              \
  --child-type raw         --child-path target/delta.js                 \
  --child-type raw         --child-path target/fac.js                   \
  --child-type raw         --child-path target/fibo.js
```