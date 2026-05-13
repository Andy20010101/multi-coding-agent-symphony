# Contributing

This project is created and evolved through BDD plus TDD.

BDD = Behavior-Driven Development: define expected user-visible behavior as scenarios before implementation.

TDD = Test-Driven Development: write a failing automated test before production code, then implement the smallest change that makes it pass, then refactor.

## Required Loop

Every implementation change follows this loop:

1. Write or update a behavior scenario.
2. Write or update a failing test for that behavior.
3. Run the test and confirm the failure is meaningful.
4. Implement the smallest production change.
5. Run the test and confirm it passes.
6. Refactor without changing behavior.
7. Run the relevant test set again.
8. Record evidence in the task result.

## Definition of Ready

A task is ready for implementation when it has:

- Objective.
- Behavior scenario or acceptance criteria.
- Target module boundary.
- Verification command or expected test location.
- Policy constraints such as workspace ownership, permissions, and no-touch files.

## Definition of Done

A task is done when:

- Behavior scenario is represented in `features/` or the task artifact.
- Test proving the behavior exists and passes.
- Relevant lint/type/test checks have run or are explicitly marked not available.
- Evidence includes changed files, commands run, outputs, and known risks.
- The change respects single-writer workspace ownership.

## Test-First Exceptions

Skipping a failing test first is allowed only for:

- Documentation-only changes.
- Mechanical repository setup.
- Exploration spikes with no production code.

When an exception is used, the final evidence must state why no test was added.

