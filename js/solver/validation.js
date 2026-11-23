function parseNumericValue(value, label) {
	const text = String(value).trim().replace(/\s+/g, "");
	if (!text) throw new Error(label + " is required.");
	let number;
	if (/^[+-]?\d+(?:\.\d+)?\/[+-]?\d+(?:\.\d+)?$/.test(text)) {
		const [numerator, denominator] = text.split("/").map(Number);
		if (denominator === 0) throw new Error(label + " cannot have a zero denominator.");
		number = numerator / denominator;
	} else {
		number = Number(text);
	}
	if (!Number.isFinite(number)) throw new Error(label + " contains an invalid number; enter an integer, decimal, or fraction (for example 3/4).");
	return number;
}

function parseCoefficients(value, label) {
	const parts = String(value).split(",").map((part) => part.trim());
	if (!parts.length || parts.some((part) => part === "")) {
		throw new Error(label + " must contain comma-separated coefficients (fractions such as 1/2 are allowed).");
	}
	return parts.map((part, index) => parseNumericValue(part, label + " coefficient " + (index + 1)));
}

function validateProblem(objective, rows) {
	if (!objective.length) throw new Error("Enter at least one objective coefficient.");
	if (objective.some((value) => !Number.isFinite(value))) throw new Error("Objective function contains an invalid number.");
	if (!rows.length) throw new Error("Add at least one constraint.");
	rows.forEach((row, index) => {
		const constraintNumber = index + 1;
		if (row.coeffs.length !== objective.length) {
			throw new Error("Constraint " + constraintNumber + " must have " + objective.length + " coefficients, in x1, x2, x3... order.");
		}
		if (row.coeffs.some((value) => !Number.isFinite(value))) throw new Error("Constraint " + constraintNumber + " contains an invalid coefficient.");
		if (!["<=", ">=", "="].includes(row.relation)) throw new Error("Constraint " + constraintNumber + " has an invalid relation.");
		if (!Number.isFinite(row.rhs)) throw new Error("Constraint " + constraintNumber + " has an invalid right-hand side.");
	});
}
