const { setupProvenance } = await import("../provenance.mjs");
setupProvenance();
// @ts-ignore
const { setupAnalysis } = await import("../analysis.inst.mjs");
// @ts-ignore
setupAnalysis("void");
