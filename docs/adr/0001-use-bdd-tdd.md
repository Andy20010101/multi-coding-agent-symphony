# ADR 0001: Use BDD and TDD for Project Creation

## Status

Accepted.

## Context

This project is a modular harness for multiple coding CLIs. The system will change as models, adapters, and orchestration assumptions evolve. Without behavior-first specs and test-first development, module boundaries can drift and regressions become hard to attribute.

## Decision

All production implementation should follow BDD plus TDD:

- Write behavior scenarios before implementation.
- Write failing tests before production code.
- Use tests and evidence as completion gates.
- Treat documentation-only and mechanical setup changes as explicit test-first exceptions.

## Consequences

Positive:

- Module boundaries stay tied to observable behavior.
- Adapter differences are captured by conformance tests instead of assumptions.
- Model and harness changes can be evaluated through replay and regression suites.

Costs:

- Initial delivery is slower than writing code directly.
- Each module needs test fixtures before implementation feels productive.
- Contract changes require synchronized docs and tests.

## First Application

Phase 1 implementation starts with tests for:

- Contract schema validation.
- Append-only session event log behavior.
- Artifact Store write/read behavior.
- Failure Taxonomy serialization and retry metadata.

