node --max-old-space-size=8192 test/bench/comp.mjs $1 $2
node --max-old-space-size=8192 "test/bench/out/main-$1-$2.mjs"
ls -l "test/bench/out/base-$1-$2-2.cjs"