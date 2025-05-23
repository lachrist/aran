// Target //

const { log, Linvail } = globalThis;

const num = 123;

log(Linvail.is(num, num)); // ✅ true
log(Linvail.is(num, 123)); // ✅ false
log(Linvail.is([num].map((x) => x)[0], num)); // ✅ true
