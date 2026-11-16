const fs = require("node:fs");
const path = require("node:path");
const { seedState } = require("./seed");

const dataPath = path.join(__dirname, "..", "data.json");

function readState() {
  if (!fs.existsSync(dataPath)) return seedState();
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(dataPath, JSON.stringify(state, null, 2), "utf8");
}

module.exports = { readState, writeState };
