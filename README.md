# Quantitative Methods Decision Lab

A phone-first, browser-based learning workspace for Quantitative Methods. The current calculator module focuses on two-variable linear programming using the Simplex Method.

This project helps students visualize each step of simplex solving, including tableau construction, pivot selection, elimination, and final optimization results. It is designed as a classroom-friendly educational app rather than a large-scale production solver.

## Current calculator scope

The application can model and solve small two-variable linear programming problems commonly found in production planning, product-mix decisions, resource allocation, and blending/diet examples. It supports maximization and minimization, `<=`, `>=`, and equality constraints, nonnegative decision variables, step-by-step tableau output, verification, and a two-dimensional graph.

It does **not yet** calculate transportation, assignment, forecasting, inventory, decision-theory, or PERT/CPM problems. Those are additional Quantitative Methods modules that would need their own algorithms and interfaces.

## Features

- Solve linear programs with maximization and minimization objectives
- Show the LP model, standard-form conversion, tableau history, pivot details, and row operations step by step
- Verify the final decision-variable values and every entered constraint
- Generate a two-variable graph with constraint lines, a shaded feasible region, corner points, and the optimal solution
- Display intermediate elimination steps before each tableau
- Support basic LP inputs with `x` and `y` variables
- Include a reviewer section with lessons, examples, and quiz-style learning content
- Offer a responsive layout with dark mode support

## Why this project exists

The solver presents results in an eight-part learning sequence: (1) LP Model, (2) Solution Steps, (3) Initial Tableau, (4) Pivot Information, (5) Pivotal Elimination Steps, (6) Subsequent Tableaux, (7) Solution Verification, and (8) Graphing. The graph is generated from the submitted two-variable model and marks the calculated optimum.

The solver turns abstract optimization concepts into a visual, interactive experience. Students can see how constraints shape the feasible region, how pivot positions are chosen, and how each iteration moves toward the optimum.

## Supported problem format

The solver is intended for small educational problems with nonnegative decision variables. The graphing view currently supports exactly two decision variables (x and y); the simplex tableau solver itself can handle the coefficient arrays supported by the solver.

- Objective coefficients can be entered for `x` and `y`
- Objective operators support addition and subtraction
- Constraint coefficients are entered in `x, y` order
- Constraints can use `<=`, `>=`, or `=`
- RHS values may be negative and are normalized internally
- Variables are assumed to satisfy `x >= 0` and `y >= 0`

## Run locally

1. Open the project folder in Visual Studio Code.
2. Open `index.html` in a browser, or run it with the VS Code Live Server extension.
3. No installation or build step is required.

## Project structure

- `index.html` — landing page
- `solving.html` — simplex solver interface
- `reviewer.html` — learning material, examples, and quiz content
- `about.html` — project and team information
- `css/` — styling and layout files
- `js/` — solver logic and UI behavior
- `assets/` — images and supporting files
- `tests/` — JavaScript test cases for solver behavior

## Sample problem

The built-in example solves:

- Maximize `Z = 1.5x1 + 1.2x2`
- `2x1 + 3x2 <= 24`
- `6x1 + 3x2 <= 48`

Expected optimum:

- `x1 = 6`
- `x2 = 4`
- `Z = 13.8`

## Important limitation

This application uses a simplex tableau approach for small classroom examples. It is intended for learning and instruction, not as a production-grade solver for very large or numerically sensitive optimization problems. Floating-point precision and degeneracy may affect some cases; results should still be checked independently when needed.

## Customization

- Update team information in `js/team/members.js`
- Add logo or images in `assets/`
- Adjust styles in `css/`

## License

This project does not currently include a license file. If you plan to reuse or distribute it publicly, you may want to add an appropriate open-source license.

## Quantitative Methods visual theme

The interface uses an academic navy/teal palette with a restrained amber accent. The landing page distinguishes the currently implemented linear-programming use cases from other topics in the broader Quantitative Methods subject.

## Phone-first layout

This version uses a mobile-only presentation with a centered phone-width canvas (maximum 520px), compact navigation, touch-friendly controls, and horizontally scrollable simplex tableaus and graph areas. Team and instructor portraits are served as optimized WebP images and use consistent portrait crops. Original JPG portraits are retained in `assets/images` as source files.
