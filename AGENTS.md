# Repository Guidelines

## Project Structure & Module Organization
This repository is intentionally minimal at the moment:
- `README.md`: project entry point.
- `LICENSE`: licensing terms.

As features are added, keep a predictable layout:
- `src/` for application code.
- `tests/` for automated tests.
- `assets/` for static files (fixtures, images, sample data).

Prefer small, focused modules and mirror test paths to source paths (for example, `src/foo/bar.py` and `tests/foo/test_bar.py`).

## Build, Test, and Development Commands
There is no build system configured yet. Use these baseline commands while developing:
- `git status` to verify local changes.
- `git diff` to review edits before committing.
- `rg "pattern" .` to search quickly across the repo.

When adding tooling, document project-specific commands in `README.md` and keep this file in sync (for example: `make test`, `pytest`, or `npm test`).

## Coding Style & Naming Conventions
Use consistent, readable code and keep files focused on a single responsibility.
- Indentation: 4 spaces for Python, 2 spaces for JSON/YAML/Markdown nesting.
- Naming: `snake_case` for files and functions, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants.
- Keep functions short and prefer explicit names over abbreviations.

If you add formatters or linters (for example, `ruff`, `black`, or `eslint`), run them before opening a PR and document usage in `README.md`.

## Testing Guidelines
No test framework is configured yet. When introducing one:
- Place tests under `tests/`.
- Name test files `test_*.py` (or framework-equivalent patterns).
- Cover both success paths and failure/edge cases.

Aim for meaningful coverage on new or changed code rather than broad but shallow tests.

## Commit & Pull Request Guidelines
Current history contains a single initial commit, so conventions are lightweight:
- Write commit subjects in imperative mood, concise, and under ~72 characters.
- Keep commits scoped to one logical change.

For pull requests:
- Describe what changed and why.
- Link related issues (if any).
- Include test evidence (command + result) and screenshots only when UI output is affected.
