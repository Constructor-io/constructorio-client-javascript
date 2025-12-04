---
description: Review the changes in the current branch (or specified branch) and provide feedback.
---

# /review

Perform a comprehensive code review of all changes in the current branch (or specified branch) against master (or main).

## Process

1. **Branch Diff Analysis**

   - Determine the name of the current branch to review
   - Run `git merge-base origin/master [branch]` to find the common ancestor commit
   - Run `git diff [common ancestor commit]..[branch]` to capture all changes in the branch
   - Run `git log [common ancestor commit]..[branch] --oneline --no-merges` to understand the commit progression
     - Use `--no-merges` flag to ignore merge commits
   - Identify all modified, added, and deleted files for comprehensive analysis

2. **File-by-File Code Review**

   - Read each modified file completely to understand context and changes
   - Focus on the specific diff sections but maintain awareness of surrounding code

3. **Quality Validation**

   - Verify the changes are covered with tests
   - Ensure critical code paths have unit tests and edge cases are covered
   - Check that new components have corresponding test files

4. **Security and Performance Audit**

   - Scan for potential security vulnerabilities following OWASP Top 10
     - **A01: Broken Access Control** - Authorization bypass, privilege escalation
     - **A02: Cryptographic Failures** - Weak encryption, exposed secrets, insecure data transmission
     - **A03: Injection** - SQL injection, XSS in components, unsafe database queries
     - **A04: Insecure Design** - Missing security controls, inadequate threat modeling
     - **A05: Security Misconfiguration** - Default configs, exposed debug info, missing security headers
     - **A06: Vulnerable Components** - Outdated npm packages, insecure gem versions
     - **A07: Authentication Failures** - Weak passwords, session management flaws
     - **A08: Data Integrity Failures** - Unsigned software updates, insecure deserialization
     - **A09: Logging/Monitoring Failures** - Missing audit logs, inadequate error tracking
     - **A10: Server-Side Request Forgery** - Unvalidated server-side requests
     - CSRF protection in forms and API endpoints
     - Proper sanitization of user inputs
   - Identify performance bottlenecks:
     - Unnecessary re-renders and missing memoization
     - Memory leaks
     - Inefficient database indexes
   - Check for proper error handling and logging practices

## Review Standards

### Guidelines

- Be concise and specific
- Provide **only** actionable feedback for all sections except "strengths"
  - Actionable feedback identifies specific issues that require code changes or improvements
  - Non-actionable feedback acknowledges good practices without suggesting changes
  - Example: "Missing error handling in submitForm() function" (actionable) vs "Good use of TypeScript types" (non-actionable)
  - Do not note what was changed in the actionable sections
  - Do not acknowledge good practices in the actionable sections
- Focus on reviewing the code
  - Do not run tests or linters
  - Do not make changes

### Code Quality

- Includes appropriate tests (happy-path for new features, failing test for bugs)
- **New `TODO`s**: include explanation for future work
- **README impact**: update for new env vars, setup instructions, or dependencies
- **`package-lock.json` changes**: correspond to `package.json` changes

### Coding Standards

#### Security & Environment Configuration

- **Don't expose environment details client-side**: Read configuration from server-side instead of hardcoding environment-specific paths
- **Environment-based credentials**: Never hardcode database credentials; always use environment variables
- **API endpoint whitelisting**: Implement whitelists of allowed endpoints in proxy controllers to prevent unintended exposure
- **Use correct HTTP status codes**: Return 403 Forbidden instead of 401 Unauthorized for permission-related access denials

#### File Organization & Architecture

- **Use proper shared component placement**: Place shared components in appropriate folders
- **Extract constants for magic numbers**: Define hardcoded limits as named constants (e.g., `const DISPLAY_LIMIT = 4`)

#### Code Quality

- **`any` usage**: Validate type safety and eliminate `any` usage
- **Use type guards over type assertions**: Prefer `Type.is(value) ? value.prop : undefined` over unsafe casting
- **Avoid unnecessary optional chaining**: Only use when nullability is actually possible
- **Provide unique ESLint disable comments**: Each disable should explain the specific violation
- **Use descriptive variable names**: Avoid abbreviations; use full descriptive names (`index` not `idx`)
- **Use `@ts-expect-error` over `@ts-ignore`**: Make type ignores explicit and catchable when no longer needed
- **Remove redundant type suffixes**: Avoid adding "Cube" or similar redundant suffixes to type names

#### Function Design & Immutability

- **Avoid direct object mutation in utilities**: Functions should return new objects instead of modifying parameters
- **Extract repeated inline logic**: Convert repeated patterns into reusable helper functions

#### Error Handling & Loading States

- **Independent loading states**: Loading states for unrelated features should not block each other
- **Complete error and loading state handling**: Always implement error and loading states for hooks and API calls
- **Prevent race conditions**: Disable interactions during loading states
- **Handle division by zero explicitly**: Check for zero denominators before performing division operations
- **Provide actionable error messages**: Include specific guidance on how to resolve issues

#### Testing Requirements

- **Mandatory test coverage**: All code changes must be covered by tests unless explicitly discussed with team
- **Mocking with jest.spyOn**: Ensure proper mocking with `jest.spyOn`
- **Test edge cases explicitly**: Include tests for empty strings, null values, undefined data
- **Use proper testing methodology**: Don't use `renderHook` for non-hook functions
- **Comprehensive test coverage**: When adding new nullable or undefinable props, test both presence and absence
- **Use test factories**: Use existing factories from `__tests__/factories` instead of manually creating test objects
- **Test with realistic data structures**: Update test data to match new data models when extending types

#### Performance & UX Guidelines

- **Implement limits for large datasets**: Add sensible display limits for user-generated content
- **Real-time preview updates**: Interactive elements should provide immediate feedback

### Suggestions Section

Focus on code quality improvements that enhance maintainability:

- Identify opportunities for code deduplication and suggest shared utilities or components
- Suggest performance optimizations that aren't critical issues
- Recommend better naming conventions or code organization

## Output Format

Deliver structured feedback using this format:

```
## Code Review Results

## ✅ Strengths
[Write **one short sentence** highlighting good practices and well-implemented features]

## 🚨 Critical Issues
[Must be fixed before merge - include file_path:line_number references]

## ⚠️ Important Issues
[Should be addressed - include file_path:line_number references]

## 💡 Suggestions
[Improvements that enhance code quality - include file_path:line_number references]

**Overall Assessment:** [✅ Pass/⚠️ Needs Work/❌ Critical Issues]
```

## Output Guidelines

- Always include specific file paths with line numbers for actionable feedback.
- Be direct and specific about required changes.
- Do not include additional commentary outside the specified format.
