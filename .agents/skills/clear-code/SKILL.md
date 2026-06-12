---
name: clear-code
description: >
  Write clean, unambiguous, self-documenting TypeScript code. Use this skill whenever you are generating,
  reviewing, refactoring, or editing code. Triggers: writing new code, refactoring,
  code review, fixing bugs, adding features, translating pseudocode to code, explaining code,
  cleaning up messy code, or when the user asks for "readable", "clean", "maintainable", "clear",
  or "well-written" code. Also use proactively whenever you write code—even if the user didn't
  explicitly ask for clarity—because every line should be intuitive and free of ambiguity.
---

# Clear & Unambiguous TypeScript Code

Every line of code you write should communicate its intent so clearly that a developer reading it
for the first time never has to guess what something does or why it exists. This is not about
following arbitrary style rules—it is about eliminating the cognitive load that comes from vague
naming, hidden intent, and misleading structure. Ambiguity in code is a bug: it slows down
readers, introduces mistakes, and makes future changes risky.

## Core Principle: The Reader Comes First

You are not writing code for the compiler. You are writing it for the next human who reads it—including
future you. Every naming choice, every function boundary, every variable declaration should answer
the question: *"Will someone seeing this for the first time immediately understand what it does?"*

If the answer is no, rewrite it until the answer is yes.

## 1. Naming: Say What You Mean, Mean What You Say

### Variables & Constants

A variable name must reveal its purpose without requiring context. If a reader has to look
upstream to understand what `d` or `temp` or `data` holds, the name has failed.

**Bad:**
```typescript
const d = fetchUser(u)
const t = calculate(d)
const r = t / 12
```

**Good:**
```typescript
const user = fetchUser(userId)
const monthlyRevenue = calculateRevenue(user)
const averageMonthlyRevenue = monthlyRevenue / 12
```

Rules:
- **No abbreviations** unless they are universally understood in the domain (e.g., `id`, `url`, `http`).
  `usr` is not universally understood. `user` is.
- **No single-letter names** except loop counters in trivial scopes (`i`, `j` in a short `for` loop).
  Even then, prefer meaningful names when the loop body is more than 2-3 lines.
- **Boolean variables** must read as a true/false question. Prefix with `is`, `has`, `can`, `should`,
  `was`, `did`, or similar.
  - `isActive` not `active`
  - `hasChildren` not `childrenCount` (unless it truly holds a count)
  - `shouldRetry` not `retry`
- **Collections** must be plural: `users`, `errorMessages`, `availablePayments`.
- **Constants** use `UPPER_SNAKE_CASE` for true constants, `camelCase` for module-level const objects.
- **Avoid misleading names.** A variable called `userList` should not hold a single user.
  A variable called `count` should not hold a array.

### Functions

A function name is a contract. It tells the reader what the function does before they read a single
line of its body. Follow a consistent verb-noun pattern:

**Bad:**
```typescript
function process(d: any) {
  // 50 lines of unclear logic
}

function handleData(data: unknown, flag: boolean) {
  // ...
}
```

**Good:**
```typescript
function calculateMonthlyRevenue(monthlyTransactions: Transaction[]): number {
  /** Sum all completed transaction amounts for the given month. */
  // ...
}

function sendWelcomeEmail(user: User): boolean {
  /** Send a welcome email to a newly registered user. Returns true on success. */
  // ...
}

function validateInvoiceBeforeSubmission(invoice: Invoice): string[] {
  /** Check business rules. Returns a list of error messages (empty if valid). */
  // ...
}
```

Rules:
- **Start with a verb.** Functions do things: `calculate`, `send`, `validate`, `fetch`, `build`, `convert`, `check`, `find`.
- **Include the subject.** `sendWelcomeEmail`, not just `sendEmail` (which email?).
- **Boolean-returning functions** should read as a question: `isEligibleForDiscount`, `hasUnpaidInvoices`, `canUserAccessResource`.
- **Avoid generic verbs** like `handle`, `process`, `manage`, `do`, `run`, `execute` unless they
  are paired with a very specific noun that disambiguates.
- **Mutating functions** should say so: `updateUserProfile`, `deleteExpiredSessions`, `addItemToCart`.

### Types & Interfaces

- Name types after what they represent: `EncounterDetailResponse`, `PaymentSubject`, `UserSession`.
- Prefer `interface` over `type` for object shapes (better error messages, extendable).
- Use `type` for unions, intersections, mapped types, and computed types.
- Avoid suffixes like `Manager`, `Helper`, `Util` unless they genuinely describe the role.
  Prefer action-oriented names: `TokenRefresher` over `TokenManager`, `PriceCalculator` over `PriceUtil`.
- Use domain vocabulary. In a healthcare app, `Encounter` is better than `Record`. In an e-commerce
  app, `Order` is better than `Transaction` (unless it is literally a financial transaction).

## 2. Function Design: Small, Focused, One Purpose

Every function should do exactly one thing. If you need the word "and" to describe what a function
does, it is doing too many things.

**Bad:**
```typescript
async function validateAndSaveUser(data: unknown) {
  // validates...
  // saves...
  // sends email...
  // logs...
}
```

**Good:**
```typescript
function validateUserData(data: unknown): string[] {
  /** Return validation errors, or empty array if valid. */
  // ...
}

async function saveUser(user: User): Promise<User> {
  /** Persist user to database. Throws DatabaseError on failure. */
  // ...
}

function sendWelcomeEmail(user: User): void {
  /** Send welcome email after registration. */
  // ...
}

async function registerNewUser(data: unknown): Promise<User> {
  /** Full registration flow: validate, save, notify. */
  const errors = validateUserData(data)
  if (errors.length > 0) {
    throw new ValidationError(errors)
  }
  const user = await saveUser(User.fromData(data))
  sendWelcomeEmail(user)
  return user
}
```

The top-level orchestrator (`registerNewUser`) reads like a recipe. The details are hidden
in well-named functions. A reader can understand the flow at a glance without reading implementation.

### Parameters

- **Maximum 3-4 parameters.** If you need more, group them into an options object.
- **Avoid boolean parameters** that change function behavior—they hide branching logic at the call site.
  Instead, split into two functions or use a discriminated union.
  - Bad: `fetchData({ includeHeaders: true })`
  - Good: `fetchDataWithHeaders()` or `fetchDataWithoutHeaders()` or `fetchData({ headers: HeadersOption.INCLUDE })`
- **Use destructuring** for options objects when the function has many optional fields.
- **Prefer `readonly`** for function parameters that should not be mutated.

## 3. Comments: Explain Why, Not What

Good code explains *what* it does through naming. Comments should explain *why* it does it that way.

**Bad:**
```typescript
// increment i by 1
i += 1

// loop through users
for (const user of users) {
  // ...
}
```

**Good:**
```typescript
// The API returns a 1-indexed page number, but our pagination is 0-indexed
const pageNumber = apiResponse.page - 1

// Skip suspended users — they cannot access billing features
const activeUsers = users.filter((u) => u.isActive)
```

Rules:
- **Never write a comment that restates the code.** If the comment says exactly what the next line does, delete it.
- **Write comments for non-obvious decisions.** Why this algorithm? Why this workaround? Why this magic number?
- **Use JSDoc** for function-level documentation: what it does, what it takes, what it returns, and any side effects.
- **Document assumptions.** "Assumes date is in UTC" is valuable. "Sets the date" is not.

## 4. Code Structure: Organize for Readability

### Grouping and Order

- **Public interface first.** In a class, put public methods before private helpers.
- **Related code stays together.** Group related functions, related constants, related types.
- **Top-to-bottom reading.** Structure code so a reader can follow it linearly without jumping
  around. Put helper functions *after* the code that calls them (or in a separate module).
- **Export types first, then constants, then functions.** This follows the "types are cheap" principle.

### Early Returns

Prefer early returns to reduce nesting. Deep nesting is harder to read because the reader
must hold multiple conditions in their head simultaneously.

**Bad:**
```typescript
function processOrder(order: Order | null): OrderResult {
  if (order != null) {
    if (order.isValid) {
      if (order.hasStock) {
        // actual logic buried 3 levels deep
        // ...
      } else {
        return OrderResult.error("Out of stock")
      }
    } else {
      return OrderResult.error("Invalid order")
    }
  } else {
    return OrderResult.error("No order provided")
  }
}
```

**Good:**
```typescript
function processOrder(order: Order | null): OrderResult {
  if (order === null) {
    return OrderResult.error("No order provided")
  }

  if (!order.isValid) {
    return OrderResult.error("Invalid order")
  }

  if (!order.hasStock) {
    return OrderResult.error("Out of stock")
  }

  // Logic is now at the top level — no nesting
  // ...
}
```

### Consistency

When a codebase has a pattern, follow it. Do not introduce a new pattern for the same concept.
If the project uses `Result` objects for error handling, use `Result` objects—not exceptions.
If the project names routes as `featureAction`, do not switch to `actionFeature`.

## 5. Ambiguity Red Flags

Watch for these patterns—they almost always signal ambiguity:

| Red Flag | Fix |
|---|---|
| A variable named `data`, `info`, `item`, `result`, or `temp` | Name it after what it actually holds |
| A function called `handle*` or `process*` | Replace with a specific verb: `validate`, `transform`, `send` |
| A boolean parameter that changes behavior | Split into two functions or use a discriminated union |
| A comment explaining what the next line does | Delete the comment, or clarify the code |
| A function with more than 40 lines | Break it into smaller, named functions |
| A function that does two unrelated things | Split into two functions |
| A magic number or string | Extract to a named constant |
| A nested `if` deeper than 2 levels | Refactor with early returns or extract conditions |
| A variable type that doesn't match its name | Rename the variable or change the type |

## 6. TypeScript-Specific Guidance

### Use the Type System

- **Prefer `const` over `let`. Never use `var`.**
- **Use explicit return types on exported functions.** This is documentation and a contract.
- **Prefer `interface` over `type` for object shapes.** Use `type` for unions, intersections, mapped types.
- **Use `readonly`** for arrays and objects that should not be mutated.
- **Use `as const`** for literal tuples and enums-like objects.
- **Avoid `any`.** Use `unknown` when the type is truly unknown, then narrow with type guards.
- **Use branded types** for IDs to prevent mixing: `type UserId = string & { __brand: 'UserId' }`.

### Discriminated Unions over boolean flags

**Bad:**
```typescript
function processPayment(amount: number, isCredit: boolean, isRefund: boolean) {
  if (isCredit) { /* ... */ }
  if (isRefund) { /* ... */ }
}
```

**Good:**
```typescript
type PaymentAction =
  | { kind: 'charge'; amount: number }
  | { kind: 'refund'; amount: number; reason: string }
  | { kind: 'void'; reason: string }

function processPayment(action: PaymentAction) {
  switch (action.kind) {
    case 'charge': // ...
    case 'refund': // ...
    case 'void': // ...
  }
}
```

### Error Handling

- **Use custom error classes** for domain errors: `class ValidationError extends Error`.
- **Prefer `Result<T, E>` patterns** over try/catch for expected failures.
- **Never swallow errors silently.** At minimum, log them.

### Nullability

- **Prefer `undefined` over `null`** unless interoperating with APIs that use `null`.
- **Use optional chaining** (`?.`) and nullish coalescing (`??`) over manual checks.
- **Use `!` (non-null assertion) sparingly**—only when you are certain the value exists.

### Async/Await

- **Always handle Promise rejections.** Unhandled rejections crash Node.js.
- **Use `Promise.all` / `Promise.allSettled`** for concurrent operations.
- **Avoid mixing callbacks and Promises.**

### Imports & Exports

- **Use named exports** over default exports. Default exports make refactoring harder.
- **Group imports**: external packages → internal modules → types → styles.
- **Avoid barrel files** (`index.ts` re-exporting everything) in large projects—they bloat bundle size.

## 7. Quick Checklist Before Submitting Code

- [ ] Would a new reader understand every variable name without looking it up?
- [ ] Would a new reader understand every function name without reading its body?
- [ ] Does every boolean variable read as a true/false question?
- [ ] Does every function do exactly one thing?
- [ ] Are there any comments that just restate the code?
- [ ] Are there any magic numbers or strings that should be named constants?
- [ ] Is the nesting level reasonable (max 2-3 deep)?
- [ ] Does the code follow the existing project's patterns and conventions?
- [ ] Are there any `any` types that could be `unknown` or more specific?
- [ ] Are exported functions missing explicit return types?
