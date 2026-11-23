const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const context = {};
for (const file of ["validation.js", "simplex.js", "maximization.js", "results.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js", "solver", file), "utf8"), context, { filename: file });
}

test("accepts fraction inputs for objective and constraints", () => {
  assert.deepEqual(Array.from(context.parseCoefficients("1/2, 3/4, 2", "Objective")), [0.5, 0.75, 2]);
  assert.equal(context.parseNumericValue("7/3", "RHS"), 7 / 3);
});

test("solves a three-variable maximization model using x1, x2, x3", () => {
  const result = context.solveMax({
    objective: [3, 2, 1],
    constraints: [
      { coeffs: [1, 1, 1], relation: "<=", rhs: 4 },
      { coeffs: [2, 1, 0], relation: "<=", rhs: 5 },
      { coeffs: [0, 1, 2], relation: "<=", rhs: 4 }
    ]
  });
  assert.equal(result.status, "optimal");
  assert.equal(result.solution.length, 3);
  assert.deepEqual(Array.from(result.columns.slice(0, 3)), ["x1", "x2", "x3"]);
});

test("stores pivot highlighting metadata on the tableau before elimination", () => {
  const result = context.solveMax({
    objective: [3, 2],
    constraints: [{ coeffs: [1, 1], relation: "<=", rhs: 4 }]
  });
  assert.equal(result.status, "optimal");
  assert.ok(result.history[0].pivot);
  assert.equal(result.history[0].tableau[result.history[0].pivot.row][result.history[0].pivot.column], result.history[0].pivot.element);
});

test("formats repeating and terminating decimals as fractions", () => {
  assert.equal(context.formatNumber(0.5), "1/2");
  assert.equal(context.formatNumber(1.2), "6/5");
  assert.equal(context.formatNumber(13.8), "69/5");
  assert.equal(context.formatNumber(0.3333333333333), "1/3");
});
