# Code Style & Design Principles

## Braces
Always use braces for `if`/`else`/`for`/`while`/`do`, even single-line bodies. No exceptions.

// Bad
if (!user) return null;

// Good
if (!user) {
  return null;
}

## SOLID
- Single Responsibility — a class/service does one thing; if you're describing it with "and", split it
- Open/Closed — extend via new classes/strategies, avoid editing stable code to add a case
- Liskov Substitution — subtypes must be usable anywhere the base type is expected, no surprise behavior
- Interface Segregation — prefer several small, focused interfaces over one broad one
- Dependency Inversion — depend on abstractions (interfaces/tokens), not concrete implementations; use NestJS DI rather than `new`-ing dependencies

## General principles
- DRY, but don't abstract prematurely — duplication twice is fine, three times is a signal
- YAGNI — don't build for hypothetical future requirements
- Composition over inheritance
- Guard clauses / early returns over deep nesting
- Pure functions where possible; isolate side effects at the edges (controllers, repositories)
- Small functions — if it needs a comment to explain a section, that section is probably a function

## Naming
- Intention-revealing names; no abbreviations that need decoding
- Booleans read as predicates: `isActive`, `hasStock`, `canDelete`
- Avoid Hungarian notation / type suffixes — TypeScript's type system already tells you the type

## NestJS / backend specifics
- Fat services, thin controllers — controllers only orchestrate, no business logic
- One responsibility per Nest provider; inject via constructor, never instantiate directly
- DTOs for all inputs, validated with class-validator — never trust raw request bodies
- Repository/Prisma access stays behind a service, never called directly from a controller

## Angular / frontend specifics
- Smart (container) vs dumb (presentational) components — presentational components take inputs/emit outputs only
- Business logic lives in services, not components
- Keep components small and single-purpose (also required by apps/web/best-practices.md)