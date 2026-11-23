document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("[data-year]").forEach((element) => element.textContent = new Date().getFullYear());
	if (typeof renderTeam === "function") renderTeam();
	if (typeof renderLessons === "function") renderLessons();
	if (typeof renderQuiz === "function") renderQuiz();
	if (typeof setupSolver === "function") setupSolver();
});

function setupSolver() {
	const form = document.getElementById("solverForm");
	if (!form) return;
	const list = document.getElementById("constraintsList");

	function addConstraint(coefficients = "2, 3", relation = "<=", rhs = "24") {
		const row = document.createElement("div");
		row.className = "constraint-row";
		row.innerHTML = `
			<input class="constraint-coeffs" aria-label="Constraint coefficients in x1, x2, x3 order" type="text" value="${coefficients}" placeholder="2, 3, 4">
			<select class="constraint-relation" aria-label="Constraint relation">
				<option value="<=" ${relation === "<=" ? "selected" : ""}>≤</option>
				<option value=">=" ${relation === ">=" ? "selected" : ""}>≥</option>
				<option value="=" ${relation === "=" ? "selected" : ""}>=</option>
			</select>
			<input class="constraint-rhs" aria-label="Right hand side" type="text" value="${rhs}" placeholder="RHS">
			<button type="button" class="remove-row" aria-label="Remove constraint">×</button>`;
		row.querySelector(".remove-row").onclick = () => {
			if (list.children.length > 1) row.remove();
			else { row.querySelector(".constraint-coeffs").value = ""; row.querySelector(".constraint-rhs").value = ""; }
		};
		list.appendChild(row);
	}

	function loadExample() {
		document.getElementById("objectiveCoefficients").value = "3/2, 6/5";
		list.innerHTML = "";
		addConstraint("2, 3", "<=", "24");
		addConstraint("6, 3", "<=", "48");
	}

	function resetResults() {
		list.innerHTML = "";
		addConstraint("", "<=", "");
		document.getElementById("results").innerHTML = `<div class="empty-state"><div class="empty-icon">∑</div><h3>Your solution will appear here</h3><p>Enter your maximization model and select <b>Solve problem</b>.</p></div>`;
		const status = document.getElementById("resultState");
		status.textContent = "Awaiting input";
		status.className = "result-state";
	}

	function readConstraints() {
		return [...list.querySelectorAll(".constraint-row")].map((row, index) => ({
			coeffs: parseCoefficients(row.querySelector(".constraint-coeffs").value, "Constraint " + (index + 1)),
			relation: row.querySelector(".constraint-relation").value,
			rhs: parseNumericValue(row.querySelector(".constraint-rhs").value, "Constraint " + (index + 1) + " RHS")
		}));
	}

	function solveProblem(event) {
		event.preventDefault();
		try {
			const objective = parseCoefficients(document.getElementById("objectiveCoefficients").value, "Objective function");
			const constraints = readConstraints();
			validateProblem(objective, constraints);
			const problem = { mode: "max", objective, constraints };
			const result = solveMax(problem);
			renderSolverResult(result, problem);
		} catch (error) {
			const status = document.getElementById("resultState");
			status.textContent = "INPUT ERROR";
			status.className = "result-state error";
			document.getElementById("results").innerHTML = '<div class="error-box">' + escapeHTML(error.message) + "</div>";
		}
	}

	addConstraint();
	document.getElementById("addConstraint").onclick = () => addConstraint();
	document.getElementById("loadExample").onclick = loadExample;
	form.addEventListener("reset", () => setTimeout(resetResults, 0));
	form.addEventListener("submit", solveProblem);
}
