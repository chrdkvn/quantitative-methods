function escapeHTML(value) {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value).replace(/[&<>"']/g, character => entities[character]);
}

function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(number);
    if (Math.abs(number) < 1e-9) return "0";
    const sign = number < 0 ? "−" : "";
    const target = Math.abs(number);
    // Continued-fraction approximation keeps all displayed values fractional.
    let h1 = 1, h0 = 0, k1 = 0, k0 = 1, x = target;
    for (let i = 0; i < 40; i++) {
        const a = Math.floor(x);
        const h2 = a * h1 + h0, k2 = a * k1 + k0;
        if (k2 > 1000000 || !Number.isFinite(h2)) break;
        h0 = h1; h1 = h2; k0 = k1; k1 = k2;
        if (Math.abs(h1 / k1 - target) < 1e-9) break;
        const remainder = x - a;
        if (remainder < 1e-12) break;
        x = 1 / remainder;
    }
    const numerator = h1, denominator = k1 || 1;
    return sign + (denominator === 1 ? String(numerator) : numerator + "/" + denominator);
}

function formatExpression(coefficients) {
    let rendered = "";

    coefficients.forEach((value, index) => {
        const number = Number(value);
        if (Math.abs(number) < 1e-8) return;

        const variable = "x" + (index + 1);
        const magnitude = formatNumber(Math.abs(number));
        const sign = number < 0 ? (rendered ? " − " : "− ") : (rendered ? " + " : "");
        rendered += sign + magnitude + variable;
    });

    return rendered || "0";
}

function renderSolverResult(result, problem) {
    const box = document.getElementById("results");
    const state = document.getElementById("resultState");

    if (result.status !== "optimal") {
        state.textContent = result.status.toUpperCase();
        state.className = "result-state error";
        const messages = {
            unbounded: "The objective can improve without bound. Check the constraint directions and model.",
            infeasible: "No feasible solution satisfies all constraints. Check the model.",
            limit: "The solver reached its iteration limit.",
            "numerical-error": "The solver could not verify the solution numerically. Check the coefficient sizes and model."
        };
        box.innerHTML = '<div class="error-box">' +
            (messages[result.status] || "The solver could not find an optimal solution.") +
            "</div>" + renderHistory(result.history, result.columns, problem);
        return;
    }

    state.textContent = "OPTIMAL SOLUTION";
    state.className = "result-state success";

    box.innerHTML =
        '<section class="solution-section" id="lp-model-section"><h3>LP Model</h3>' +
            renderOriginalModel(problem) +
        '</section>' +
        '<section class="solution-section"><h3>Solution Steps</h3>' +
            renderStandardForm(problem) +
        '</section>' +
        renderHistory(result.history, result.columns, problem) +
        '<section class="solution-section verification-section">' +
            '<h3>Solution Verification</h3>' +
            '<div class="verification-grid">' +
                '<div class="verification-card"><h4>Variables</h4>' +
                    result.solution.map((value, index) =>
                        '<div class="verification-row"><b>' +
                        ("x" + (index + 1)) +
                        "</b><strong>" + formatNumber(value) + "</strong></div>"
                    ).join("") +
                '</div>' +
                '<div class="optimal-card"><span>Optimal ' +
                    ("Maximum") +
                    ' Z</span><strong>' + formatNumber(result.objective) + '</strong></div>' +
            '</div>' +
            '<div class="verification-card"><h4>Constraint Checks</h4>' +
                renderChecks(result, problem) +
            '</div>' +
            '<div class="verification-status">✓ Feasible solution and optimality condition satisfied</div>' +
        '</section>' +
        '<section class="solution-section graph-section">' +
            '<h3>Graphing</h3>' +
            renderGraph(problem, result) +
        '</section>';
}

function renderOriginalModel(problem) {
    const objective = "Z = " + formatExpression(problem.objective);
    const constraints = problem.constraints.map((constraint, index) =>
        '<div class="model-line"><span>Constraint ' + (index + 1) + '</span><b>' +
        formatExpression(constraint.coeffs) + " " +
        (constraint.relation === "<=" ? "≤" : constraint.relation === ">=" ? "≥" : "=") +
        " " + formatNumber(constraint.rhs) + "</b></div>"
    ).join("");
    return '<div class="model-card"><h4>Original Linear Programming Model</h4>' +
        '<div class="model-line"><span>' +
        ("Maximize") +
        '</span><b>' + objective + '</b></div>' + constraints +
        '<div class="model-line"><span>Non-negativity restrictions</span><b>' + Array.from({length: problem.objective.length}, (_, i) => "x" + (i + 1) + " ≥ 0").join(", ") + '</b></div>' +
        '</div>';
}

function renderStandardForm(problem) {
    const objective = "Z " + formatExpression(problem.objective.map(value => -value)) + " = 0";
    const constraints = problem.constraints.map((constraint, index) => {
        const lhs = formatExpression(constraint.coeffs);
        const relation = escapeHTML(constraint.relation);
        let auxiliaryTerms;

        if (constraint.relation === "<=") {
            auxiliaryTerms = " + s" + (index + 1);
        } else if (constraint.relation === ">=") {
            auxiliaryTerms = " − s" + (index + 1) + " + a" + (index + 1);
        } else {
            auxiliaryTerms = " + a" + (index + 1);
        }

        return '<div class="model-line"><span>' + lhs + " " + relation + " " +
            formatNumber(constraint.rhs) + "</span><b>" + lhs + auxiliaryTerms + " = " +
            formatNumber(constraint.rhs) + "</b></div>";
    }).join("");
    const nonNegativity = Array.from(
        { length: problem.objective.length },
        (_, index) => ("x" + (index + 1)) + " ≥ 0"
    ).join(", ");

    return '<div class="model-card"><h4>Standard-Form Equations</h4>' +
        '<div class="model-line"><span>Original objective function</span><b>' +
        objective + "</b></div>" + constraints +
        '<div class="model-line"><span>Non-negativity</span><b>' +
        nonNegativity + "</b></div></div>";
}

function renderHistory(history, columns, problem) {
    if (!Array.isArray(history) || history.length === 0) return "";

    let html = '<section class="solution-section"><h3>Simplex Tableau Iterations</h3>';
    let tableauNumber = 1;

    history.forEach((step, index) => {
        // The two-phase solver may record a Phase I tableau and then a Phase II
        // starting tableau. Keep both when artificial variables are required.
        if (step.pivot) {
            html += renderPivotInfo(step.pivot, tableauNumber - 1, columns);
        }
        const phaseLabel = step.label && step.label.toLowerCase().includes("phase")
            ? '<span class="tableau-phase">' + escapeHTML(step.label) + '</span>' : "";
        html += '<article class="iteration-card"><h4>Tableau ' + tableauNumber +
            ' ' + phaseLabel + '</h4>' +
            makeTableauHTML(step.tableau, columns, step.basis, step.pivot) +
            '</article>';
        tableauNumber++;
    });

    return html + '</section>';
}

function makeTableauHTML(tableau, headers, basis, pivot) {
    let html = '<div class="table-wrap"><table><thead><tr><th>Basic</th>' +
        headers.map((header, index) => "<th class=\"" + (pivot && index === pivot.column ? "pivot-column" : "") + "\">" + escapeHTML(header) + "</th>").join("") +
        "<th>RHS</th><th>Ratio</th></tr></thead><tbody>";

    tableau.forEach((row, rowIndex) => {
        const isObjectiveRow = rowIndex === tableau.length - 1;
        const cells = row.slice(0, -1).map((value, columnIndex) => {
            let classes = "";
            if (pivot && columnIndex === pivot.column) classes += "pivot-column ";
            if (pivot && rowIndex === pivot.row) classes += "pivot-row ";
            if (pivot && rowIndex === pivot.row && columnIndex === pivot.column) {
                classes += "pivot-element";
            }
            return '<td class="' + classes + '">' + formatNumber(value) + "</td>";
        }).join("");

        const ratio = pivot && !isObjectiveRow ? pivot.ratios[rowIndex] : null;
        html += "<tr class=\"" + (pivot && rowIndex === pivot.row ? "pivot-row" : "") + "\"><td class=\"" + (pivot && rowIndex === pivot.row ? "pivot-row" : "") + "\">" + (isObjectiveRow ? "Z" : escapeHTML(basis[rowIndex])) +
            "</td>" + cells + "<td>" + formatNumber(row[row.length - 1]) + "</td><td>" +
            (isObjectiveRow || ratio === null || ratio === undefined ? "—" : formatNumber(ratio)) + "</td></tr>";
    });

    return html + "</tbody></table></div>";
}

function renderPivotInfo(pivot, iterationNumber, columns) {
    const ratios = (Array.isArray(pivot.ratios) ? pivot.ratios : []).map((ratio, index) =>
        '<div class="pivot-detail"><span>Row ' + (index + 1) + " ratio</span><b>" +
        (ratio === null ? "—" : formatNumber(ratio)) + "</b></div>"
    ).join("");

    const formatRow = row => "[" + row.map(formatNumber).join(", ") + "]";
    const eliminationSteps = (Array.isArray(pivot.operations) ? pivot.operations : []).map(operation => {
        const details = operation.before.map((beforeValue, columnIndex) => {
            const normalizedValue = pivot.normalizedRow[columnIndex];
            const afterValue = operation.after[columnIndex];
            const label = columnIndex === operation.before.length - 1 ? "RHS" : (columns[columnIndex] || "Column " + (columnIndex + 1));
            return '<div class="elimination-cell"><span>' + label + '</span><b>' +
                formatNumber(beforeValue) + ' − (' + formatNumber(operation.factor) + ' × ' +
                formatNumber(normalizedValue) + ') = ' + formatNumber(afterValue) + '</b></div>';
        }).join("");
        return '<div class="elimination-row-detail"><h5>' + escapeHTML(operation.row) +
            ' row operation: Rnew = Rold − (' + formatNumber(operation.factor) + ' × pivot row)</h5>' +
            '<p>' + formatRow(operation.before) + ' − (' + formatNumber(operation.factor) +
            ' × ' + formatRow(pivot.normalizedRow) + ') = ' + formatRow(operation.after) + '</p>' +
            '<div class="elimination-grid">' + details + '</div></div>';
    }).join("");

    return '<div class="pivot-info"><h4>Pivot Information</h4>' +
        "<p><b>Pivot column:</b> " + escapeHTML(pivot.entering) + "</p>" +
        "<p><b>Pivot row:</b> " + escapeHTML(pivot.leaving) + "</p>" +
        "<p><b>Pivot element:</b> " + formatNumber(pivot.element) + "</p>" +
        '<p><b>Entering variable:</b> ' + escapeHTML(pivot.entering) + ' (most negative eligible coefficient in the Z row).</p>' +
        '<p><b>Leaving variable:</b> ' + escapeHTML(pivot.leaving) + ' (smallest non-negative RHS-to-positive-pivot-column ratio).</p>' +
        "<p><b>Pivot operation:</b> Normalize the pivot row by dividing each entry by " +
        formatNumber(pivot.element) + ", then eliminate the entering variable from all other rows.</p>" +
        ratios + '</div><div class="elimination-card"><h4>Pivot Elimination Steps</h4>' +
        "<p><b>" + escapeHTML(pivot.entering) + " row:</b> " +
        formatRow(pivot.before[pivot.row]) + " ÷ " + formatNumber(pivot.element) +
        " = " + formatRow(pivot.normalizedRow) + "</p>" +
        eliminationSteps +
        '<p class="result-message">These row operations produce the tableau below.</p>' +
        "</div>";
}

function renderChecks(result, problem) {
    const constraintChecks = problem.constraints.map((constraint, index) => {
        const lhs = constraint.coeffs.reduce(
            (sum, coefficient, variableIndex) => sum + coefficient * result.solution[variableIndex],
            0
        );
        const isSatisfied = constraint.relation === "<="
            ? lhs <= constraint.rhs + 1e-6
            : constraint.relation === ">="
                ? lhs >= constraint.rhs - 1e-6
                : Math.abs(lhs - constraint.rhs) < 1e-6;
        const displayRelation = constraint.relation === "<="
            ? "≤"
            : constraint.relation === ">=" ? "≥" : "=";

        return '<div class="check-card"><div><b>Check ' + (index + 1) +
            '</b><span class="check-status ' + (isSatisfied ? "true" : "false") + '">' +
            (isSatisfied ? "✓ True" : "✕ False") + "</span></div><p>" +
            formatExpression(constraint.coeffs) + " " + escapeHTML(constraint.relation) + " " +
            formatNumber(constraint.rhs) + "</p><strong>" + formatNumber(lhs) + " " +
            displayRelation + " " + formatNumber(constraint.rhs) + "</strong></div>";
    }).join("");

    return constraintChecks +
        '<div class="check-card"><div><b>Objective function</b>' +
        '<span class="check-status true">✓ Verified</span></div><strong>Z = ' +
        formatNumber(result.objective) + "</strong></div>";
}


function renderGraph(problem, result) {
    if (problem.objective.length !== 2 || problem.constraints.some(c => c.coeffs.length !== 2)) {
        return '<div class="error-box">Graphing currently supports two decision variables (x1 and x2). For three or more decision variables, the simplex tableau and solution remain available, but a 2D graph cannot represent the full feasible region. The simplex solution is still available above.</div>';
    }

    const constraints = problem.constraints;
    const candidates = [[0, 0]];
    const lines = constraints.map(c => ({ a: c.coeffs[0], b: c.coeffs[1], rhs: c.rhs }));

    // Candidate corner points are intersections of constraint boundaries and axes.
    const boundaries = [{a:1,b:0,rhs:0},{a:0,b:1,rhs:0}, ...lines];
    for (let i = 0; i < boundaries.length; i++) {
        for (let j = i + 1; j < boundaries.length; j++) {
            const p = intersectLines(boundaries[i], boundaries[j]);
            if (p) candidates.push(p);
        }
    }
    const feasibleVertices = uniquePoints(candidates.filter(point =>
        point[0] >= -1e-7 && point[1] >= -1e-7 &&
        constraints.every(c => {
            const lhs = c.coeffs[0] * point[0] + c.coeffs[1] * point[1];
            if (c.relation === "<=") return lhs <= c.rhs + 1e-6;
            if (c.relation === ">=") return lhs >= c.rhs - 1e-6;
            return Math.abs(lhs - c.rhs) <= 1e-6;
        })
    ));

    const intercepts = [];
    constraints.forEach(c => {
        if (Math.abs(c.coeffs[0]) > 1e-9) intercepts.push(Math.abs(c.rhs / c.coeffs[0]));
        if (Math.abs(c.coeffs[1]) > 1e-9) intercepts.push(Math.abs(c.rhs / c.coeffs[1]));
    });
    const maxX = Math.max(10, ...feasibleVertices.map(p => p[0] * 1.2), ...intercepts.filter(Number.isFinite).map(v => v * 1.15));
    const maxY = Math.max(10, ...feasibleVertices.map(p => p[1] * 1.2), ...intercepts.filter(Number.isFinite).map(v => v * 1.15));
    const clippedRegion = clipFeasibleRegion(constraints, maxX, maxY);

    const W = 760, H = 470, left = 58, right = 24, top = 22, bottom = 52;
    const plotW = W - left - right, plotH = H - top - bottom;
    const sx = x => left + (x / maxX) * plotW;
    const sy = y => top + plotH - (y / maxY) * plotH;
    const tickX = maxX / 5, tickY = maxY / 5;
    let svg = '<svg class="lp-graph" viewBox="0 0 ' + W + ' ' + H +
        '" role="img" aria-label="Linear programming graph showing constraints, feasible region, and optimal solution">';
    for (let i = 0; i <= 5; i++) {
        const x = i * tickX, y = i * tickY;
        svg += '<line class="grid-line" x1="' + sx(x) + '" y1="' + top +
            '" x2="' + sx(x) + '" y2="' + (top + plotH) + '"/>';
        svg += '<line class="grid-line" x1="' + left + '" y1="' + sy(y) +
            '" x2="' + (left + plotW) + '" y2="' + sy(y) + '"/>';
        svg += '<text class="axis-tick" x="' + sx(x) + '" y="' + (top + plotH + 20) +
            '" text-anchor="middle">' + formatNumber(x) + '</text>';
        svg += '<text class="axis-tick" x="' + (left - 12) + '" y="' + (sy(y) + 4) +
            '" text-anchor="end">' + formatNumber(y) + '</text>';
    }
    svg += '<line class="axis-line" x1="' + left + '" y1="' + top +
        '" x2="' + left + '" y2="' + (top + plotH) + '"/>' +
        '<line class="axis-line" x1="' + left + '" y1="' + (top + plotH) +
        '" x2="' + (left + plotW) + '" y2="' + (top + plotH) + '"/>';

    if (clippedRegion.length >= 3) {
        svg += '<polygon class="feasible-region" points="' +
            clippedRegion.map(p => sx(p[0]) + ',' + sy(p[1])).join(' ') + '"/>';
    }

    constraints.forEach((c, index) => {
        const segment = lineInBounds(c.coeffs[0], c.coeffs[1], c.rhs, maxX, maxY);
        if (segment) {
            svg += '<line class="constraint-line line-' + (index % 5) +
                '" x1="' + sx(segment[0][0]) + '" y1="' + sy(segment[0][1]) +
                '" x2="' + sx(segment[1][0]) + '" y2="' + sy(segment[1][1]) + '"/>';
        }
    });

    const objectiveValue = result.objective;
    const objectiveSegment = lineInBounds(problem.objective[0], problem.objective[1], objectiveValue, maxX, maxY);
    if (objectiveSegment) {
        svg += '<line class="objective-line" x1="' + sx(objectiveSegment[0][0]) +
            '" y1="' + sy(objectiveSegment[0][1]) + '" x2="' +
            sx(objectiveSegment[1][0]) + '" y2="' + sy(objectiveSegment[1][1]) + '"/>';
    }

    feasibleVertices.forEach((p, index) => {
        svg += '<circle class="corner-point" cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="4"/>' +
            '<text class="point-label" x="' + (sx(p[0]) + 7) + '" y="' + (sy(p[1]) - 8) +
            '">(' + formatNumber(p[0]) + ', ' + formatNumber(p[1]) + ')</text>';
    });

    const ox = result.solution[0], oy = result.solution[1];
    if (ox >= 0 && oy >= 0 && ox <= maxX && oy <= maxY) {
        svg += '<circle class="optimal-point" cx="' + sx(ox) + '" cy="' + sy(oy) + '" r="7"/>' +
            '<text class="optimal-label" x="' + (sx(ox) + 10) + '" y="' + (sy(oy) - 13) +
            '">Optimal (' + formatNumber(ox) + ', ' + formatNumber(oy) + ')</text>';
    }
    svg += '<text class="axis-title" x="' + (left + plotW / 2) + '" y="' + (H - 8) +
        '" text-anchor="middle">x1</text>' +
        '<text class="axis-title" transform="translate(16 ' + (top + plotH / 2) +
        ') rotate(-90)" text-anchor="middle">x2</text></svg>';

    const legend = constraints.map((c, i) =>
        '<div class="graph-legend-item"><span class="legend-line line-' + (i % 5) +
        '"></span><span>' + escapeHTML(formatExpression(c.coeffs) + " " +
        (c.relation === "<=" ? "≤" : c.relation === ">=" ? "≥" : "=") +
        " " + formatNumber(c.rhs)) + '</span></div>'
    ).join("");
    return '<div class="graph-card"><div class="graph-summary"><b>Optimal point:</b> (' +
        formatNumber(ox) + ', ' + formatNumber(oy) + ') <span><b>' +
        ("Maximum") + ' Z:</b> ' +
        formatNumber(result.objective) + '</span></div>' +
        '<div class="graph-scroll">' + svg + '</div>' +
        '<div class="graph-legend"><div class="graph-legend-item"><span class="legend-region"></span><span>Feasible region</span></div>' +
        legend + '<div class="graph-legend-item"><span class="legend-objective"></span><span>Objective function at optimum</span></div>' +
        '<div class="graph-legend-item"><span class="legend-optimal"></span><span>Optimal solution</span></div></div>' +
        '<p class="graph-note">The graph is generated from the current two-variable LP model (x1 and x2). The plotted window is scaled to show the relevant constraint boundaries and feasible region.</p></div>';
}

function intersectLines(first, second) {
    const determinant = first.a * second.b - second.a * first.b;
    if (Math.abs(determinant) < 1e-10) return null;
    return [
        (first.rhs * second.b - second.rhs * first.b) / determinant,
        (first.a * second.rhs - second.a * first.rhs) / determinant
    ];
}

function uniquePoints(points) {
    const unique = [];
    points.forEach(p => {
        if (!unique.some(q => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6)) unique.push(p);
    });
    return unique.sort((a,b) => Math.atan2(a[1],a[0]) - Math.atan2(b[1],b[0]));
}

function clipFeasibleRegion(constraints, maxX, maxY) {
    let polygon = [[0,0],[maxX,0],[maxX,maxY],[0,maxY]];
    const halfPlanes = [];
    constraints.forEach(c => {
        if (c.relation === "<=" || c.relation === "=") halfPlanes.push({a:c.coeffs[0],b:c.coeffs[1],rhs:c.rhs});
        if (c.relation === ">=" || c.relation === "=") halfPlanes.push({a:-c.coeffs[0],b:-c.coeffs[1],rhs:-c.rhs});
    });
    halfPlanes.forEach(h => {
        const output = [];
        for (let i = 0; i < polygon.length; i++) {
            const current = polygon[i], previous = polygon[(i + polygon.length - 1) % polygon.length];
            const dc = h.a*current[0] + h.b*current[1] - h.rhs;
            const dp = h.a*previous[0] + h.b*previous[1] - h.rhs;
            const currentInside = dc <= 1e-7, previousInside = dp <= 1e-7;
            if (currentInside !== previousInside) {
                const t = dp / (dp - dc);
                output.push([previous[0] + t*(current[0]-previous[0]), previous[1] + t*(current[1]-previous[1])]);
            }
            if (currentInside) output.push(current);
        }
        polygon = output;
    });
    return polygon;
}

function lineInBounds(a, b, rhs, maxX, maxY) {
    const points = [];
    const add = (x,y) => {
        if (x >= -1e-7 && y >= -1e-7 && x <= maxX+1e-7 && y <= maxY+1e-7 &&
            !points.some(p => Math.abs(p[0]-x)<1e-6 && Math.abs(p[1]-y)<1e-6)) points.push([x,y]);
    };
    if (Math.abs(b)>1e-10) { add(0,rhs/b); add(maxX,(rhs-a*maxX)/b); }
    if (Math.abs(a)>1e-10) { add(rhs/a,0); add((rhs-b*maxY)/a,maxY); }
    return points.length >= 2 ? [points[0],points[1]] : null;
}
