const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
module.exports = buildModule("Digify", (m) => {
  const Digify = m.contract("Digify");
  return { Digify };
});