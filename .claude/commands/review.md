---
description: Review the changes in the current branch (or specified branch) and provide feedback.
---

# /review

Review the changes in the current branch (or specified branch) and provide detailed feedback across multiple quality dimensions.

## Arguments

- `$ARGUMENTS` - Optional: branch name or PR number to review. Defaults to current branch vs main/master.

---

## SECTION 1: PROCESS

### Step 1: Identify Changes

Determine what to review based on arguments:

```bash
# If PR number provided
gh pr view $ARGUMENTS --json headRefName,baseRefName

# If branch name provided or current branch
git fetch origin
BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
MERGE_BASE=$(git merge-base origin/$BASE_BRANCH HEAD)
```

### Step 2: Gather Context

```bash
# Get list of changed files
git diff --name-only $MERGE_BASE...HEAD

# Get full diff with context
git diff $MERGE_BASE...HEAD

# Get commit history for this branch
git log --oneline $MERGE_BASE...HEAD

# Check for any PR description context
gh pr view --json body,title 2>/dev/null || echo "No PR found"
```

### Step 3: Review Each File

For each changed file:

1. Read the full file for context
2. Examine the diff hunks
3. Apply all review domain checklists below
4. Note issues with severity and file:line references

---

## SECTION 2: REVIEW DOMAINS

### 2.1 Error Handling & Silent Failures

**Logging Quality:**

- [ ] Errors logged with sufficient context (what failed, relevant IDs)
- [ ] Log levels appropriate (error vs warn vs info)
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Async errors properly caught and logged

**User Feedback:**

- [ ] Errors produce meaningful user-facing messages
- [ ] No silent failures that leave users confused
- [ ] Loading/error states handled in UI code
- [ ] Network failures gracefully degraded

**Catch Block Analysis:**

- [ ] Catch blocks don't swallow errors silently
- [ ] Caught exceptions are specific, not generic `catch(e)`
- [ ] Re-thrown errors preserve stack traces
- [ ] Finally blocks don't mask exceptions

**Fallback Behavior:**

- [ ] Fallback values are intentional, not accidental defaults
- [ ] `|| defaultValue` patterns checked for falsy edge cases (0, '')
- [ ] Optional chaining `?.` doesn't hide bugs
- [ ] Nullish coalescing `??` used appropriately vs `||`

**Hidden Failure Patterns:**

- [ ] Empty catch blocks flagged
- [ ] `console.log` only error handling flagged
- [ ] Missing error boundaries in React code
- [ ] Promises without .catch() or try/catch

---

### 2.2 Test Coverage Analysis

**Coverage Focus:**

- [ ] New code paths have corresponding tests
- [ ] Edge cases and boundary conditions tested
- [ ] Error paths tested, not just happy path
- [ ] Integration points tested appropriately

**Test Quality:**

- [ ] Tests verify behavior, not implementation details
- [ ] Test names describe the scenario being tested
- [ ] Assertions are specific and meaningful
- [ ] No flaky patterns (timing, order-dependent)

**Criticality Rating:**

- **HIGH**: Auth, payments, data mutations, security boundaries
- **MEDIUM**: Core business logic, API contracts
- **LOW**: UI presentation, formatting, logging

---

### 2.3 Security Audit (OWASP Top 10)

**A01:2021 - Broken Access Control:**

- [ ] Authorization checked on all protected endpoints
- [ ] User can only access their own resources
- [ ] Role/permission checks present and correct
- [ ] No IDOR vulnerabilities (direct object references)

**A02:2021 - Cryptographic Failures:**

- [ ] Sensitive data encrypted at rest and in transit
- [ ] No hardcoded secrets, keys, or passwords
- [ ] Secure algorithms used (no MD5, SHA1 for security)
- [ ] TLS enforced for external communications

**A03:2021 - Injection:**

- [ ] SQL queries parameterized (no string concatenation)
- [ ] NoSQL queries use proper escaping
- [ ] OS command inputs sanitized
- [ ] LDAP/XPath queries properly escaped

**A04:2021 - Insecure Design:**

- [ ] Business logic flaws considered
- [ ] Rate limiting on sensitive operations
- [ ] Proper session management
- [ ] Defense in depth (multiple layers)

**A05:2021 - Security Misconfiguration:**

- [ ] No debug features in production code
- [ ] Error messages don't leak stack traces
- [ ] Default credentials not used
- [ ] Security headers configured

**A06:2021 - Vulnerable Components:**

- [ ] Dependencies up to date
- [ ] No known vulnerable packages
- [ ] Minimal dependency footprint

**A07:2021 - Authentication Failures:**

- [ ] Strong password policies enforced
- [ ] Brute force protection present
- [ ] Session tokens properly managed
- [ ] Multi-factor considerations

**A08:2021 - Data Integrity Failures:**

- [ ] Input validation on all external data
- [ ] Deserialization of untrusted data avoided
- [ ] CI/CD pipeline security considered

**A09:2021 - Logging & Monitoring:**

- [ ] Security events logged appropriately
- [ ] Audit trails for sensitive operations
- [ ] No sensitive data in logs

**A10:2021 - SSRF:**

- [ ] User-provided URLs validated
- [ ] Internal network access restricted
- [ ] Redirect following controlled

**XSS Prevention (Web):**

- [ ] User input escaped in HTML output
- [ ] React dangerouslySetInnerHTML avoided or sanitized
- [ ] URLs validated before use in links
- [ ] Content-Security-Policy considered

---

### 2.4 Performance Review

**Algorithmic Complexity:**

- [ ] No obvious O(n²) or worse in hot paths
- [ ] Loops don't contain hidden expensive operations
- [ ] Recursion has proper termination and depth limits
- [ ] Data structures appropriate for access patterns

**Database Performance:**

- [ ] No N+1 query patterns
- [ ] Queries use appropriate indexes
- [ ] Large result sets paginated
- [ ] Transactions scoped minimally
- [ ] No SELECT \* on large tables

**Memory Management:**

- [ ] No memory leaks (event listeners, timers, closures)
- [ ] Large objects released when done
- [ ] Streams used for large data processing
- [ ] No unbounded caches or queues

**Caching Opportunities:**

- [ ] Expensive computations cached where stable
- [ ] Cache invalidation strategy clear
- [ ] Appropriate TTLs set

**Frontend Performance:**

- [ ] No unnecessary re-renders (React)
- [ ] Large lists virtualized
- [ ] Images optimized and lazy-loaded
- [ ] Bundle size impact considered

---

### 2.5 Architecture & Patterns

**SOLID Principles:**

- [ ] Single Responsibility: Classes/functions do one thing
- [ ] Open/Closed: Extended without modification
- [ ] Liskov Substitution: Subtypes substitutable
- [ ] Interface Segregation: No fat interfaces
- [ ] Dependency Inversion: Depend on abstractions

**Design Pattern Usage:**

- [ ] Patterns used appropriately, not forced
- [ ] Pattern choice documented if non-obvious
- [ ] Consistency with existing codebase patterns

**Anti-Patterns Detected:**

- [ ] God classes/functions (too many responsibilities)
- [ ] Shotgun surgery (one change = many files)
- [ ] Feature envy (method uses other class's data)
- [ ] Primitive obsession (primitives vs value objects)
- [ ] Speculative generality (YAGNI violations)

**Naming Conventions:**

- [ ] Names are descriptive and consistent
- [ ] Follows codebase conventions (camelCase, snake_case)
- [ ] Boolean variables prefixed appropriately (is, has, should)
- [ ] Functions named as verbs, classes as nouns

**Code Duplication:**

- [ ] No copy-paste code that should be extracted
- [ ] Similar code patterns unified or intentionally different
- [ ] Magic numbers/strings extracted to constants

---

### 2.6 Code Quality

**Type Safety:**

- [ ] TypeScript `any` usage justified or eliminated
- [ ] Type assertions (`as`) minimized and documented
- [ ] Generic types used where appropriate
- [ ] Null/undefined handling explicit

**File Organization:**

- [ ] Files in appropriate directories
- [ ] Imports organized and minimal
- [ ] No circular dependencies introduced
- [ ] Module boundaries respected

**Function Design:**

- [ ] Functions are small and focused
- [ ] Side effects minimized and documented
- [ ] Pure functions preferred where possible
- [ ] Parameters count reasonable (≤4)

**Immutability:**

- [ ] State mutations intentional and localized
- [ ] Const preferred over let
- [ ] Arrays/objects not mutated unexpectedly
- [ ] React state updated immutably

**Code Clarity:**

- [ ] Complex logic has explanatory comments
- [ ] No clever one-liners that sacrifice readability
- [ ] Control flow is straightforward
- [ ] Early returns used to reduce nesting

---

## SECTION 3: SEVERITY SYSTEM

### P1 CRITICAL - Must Fix Before Merge

- Security vulnerabilities
- Data corruption risks
- Breaking changes to public API
- Crashes or complete feature failures
- Hardcoded secrets or credentials

### P2 IMPORTANT - Should Fix

- Performance regressions
- Missing error handling on important paths
- Architectural concerns
- Test coverage gaps on critical code
- Potential reliability issues

### P3 SUGGESTION - Nice to Have

- Style/formatting improvements
- Minor refactoring opportunities
- Documentation additions
- Non-critical test additions
- Code organization tweaks

---

## SECTION 4: OUTPUT FORMAT

Structure your review as follows:

```markdown
## Code Review: [Branch/PR Name]

**Files Reviewed:** X files, +Y/-Z lines

### P1 Critical Issues (X found)

#### [Issue Title]

- **File:** `path/to/file.ts:123`
- **Issue:** [Clear description of the problem]
- **Risk:** [What could go wrong]
- **Fix:** [Specific recommendation]

### P2 Important Issues (X found)

#### [Issue Title]

- **File:** `path/to/file.ts:456`
- **Issue:** [Description]
- **Recommendation:** [What to do]

### P3 Suggestions (X found)

- `file.ts:78` - Consider extracting this to a constant
- `other.ts:92` - Could benefit from a descriptive comment

### Strengths

[One short paragraph highlighting good practices observed]

---

**Overall Assessment:** [APPROVED / NEEDS WORK / CRITICAL ISSUES]

- **APPROVED**: No P1s, minimal P2s, good to merge
- **NEEDS WORK**: P2s should be addressed, or P1s with clear path to fix
- **CRITICAL ISSUES**: P1s must be resolved before merge
```

---

## SECTION 5: REVIEW GUIDELINES

### Do

- Reference specific file:line locations
- Explain WHY something is an issue
- Provide actionable fix suggestions
- Acknowledge good patterns when seen
- Consider the full context of changes

### Don't

- Run tests or linters (review only)
- Make changes to the code
- Be vague ("this looks wrong")
- Nitpick formatting that linters catch
- Review files not in the diff

### Prioritization

1. Review security-sensitive files first
2. Focus on new code over modified code
3. Pay extra attention to public API changes
4. Check test files for coverage gaps
5. Review configuration changes carefully

### Confidence Indicators

When uncertain about an issue, indicate confidence:

- **HIGH**: Definitely a problem, clear evidence
- **MEDIUM**: Likely an issue, worth investigating
- **LOW**: Might be intentional, asking for clarification

---

## Quick Reference Checklist

For rapid reviews, ensure these critical items are checked:

**Security (P1)**

- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Authorization checks exist
- [ ] No SQL/XSS injection vectors

**Reliability (P1-P2)**

- [ ] Error handling present
- [ ] No silent failures
- [ ] Edge cases considered

**Performance (P2)**

- [ ] No N+1 queries
- [ ] No O(n²) in hot paths
- [ ] No memory leaks

**Quality (P2-P3)**

- [ ] Types are safe
- [ ] Names are clear
- [ ] Logic is readable
