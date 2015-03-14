


module.exports = function (aran) {

    if (!aran.eval) { aran.eval = sandbox ? ((aran.traps&&aran.traps.get) ? aran.traps.get(sandbox, "eval") : sandbox.eval) : aran.global.eval }
    if (!aran.defineproperty) {}
    if (!aran.apply) {}

}
