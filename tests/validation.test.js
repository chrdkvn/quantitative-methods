const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const context = {};
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "solver", "validation.js"), "utf8"),
  context,
  { filename: "validation.js" }
);

 test("parses comma-separated coefficients", () => {
  assert.deepEqual(Array.from(context.parseCoefficients("3, 5", "Objective")), [3, 5]);
});

test("rejects invalid coefficients", () => {
  assert.throws(() => context.parseCoefficients("3, nope", "Objective"), /invalid number/i);
  assert.throws(() => context.parseCoefficients("3, ", "Objective"), /comma-separated/i);
});

test("validates a two-variable model", () => {
  assert.doesNotThrow(() => context.validateProblem([3, 5], [
    { coeffs: [2, 1], relation: "<=", rhs: 8 }
  ]));
});

test("rejects a constraint with a mismatched coefficient count", () => {
  assert.throws(() => context.validateProblem([3, 5], [
    { coeffs: [2], relation: "<=", rhs: 8 }
  ]), /must have 2 coefficients/i);
});
