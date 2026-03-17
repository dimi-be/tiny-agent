# AGENT DEVELOPMENT GUIDELINES

## Build, Lint, and Test Commands

### Running Tests
- Run all tests: `npm test`
- Run a single test file: `node --test test/security.test.js`
- Run specific test function: `node --test --test-name-pattern="securePath blocks paths outside CWD" test/security.test.js`

### Code Style Guidelines

#### Imports
- Use ES6 module syntax with `require()` for CommonJS modules
- Group imports by type (built-ins, external dependencies, internal modules)
- Sort alphabetically within each group
- Import specific functions rather than entire modules when possible

#### Formatting
- 2-space indentation
- Unix line endings (\n)
- No trailing whitespace
- Single blank line between top-level code blocks
- Use single quotes for strings unless template literals are needed

#### Types and Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for constructors/class names
- Use UPPER_CASE for constants
- Prefix private/internal functions with underscore (_)
- Use descriptive variable names (e.g., `securePath` instead of `sp`)
- Function names should be verbs indicating action (readFile, writeData)

#### Error Handling
- Always validate inputs before processing
- Use specific error messages that help debugging
- Implement try/catch blocks for async operations
- Throw custom errors with clear descriptions when security violations occur
- Handle file system errors gracefully

#### Security Considerations
- All filesystem operations must use `securePath()` to prevent path traversal attacks
- Read-before-write policy: files must be read before they can be written to
- YOLO mode bypasses user confirmation but still enforces security checks
- npm commands are allowed without restrictions (as per current implementation)
- Directory listings respect .gitignore and hide node_modules/hidden files

#### Testing
- All new functionality should include unit tests
- Security-related functions must be thoroughly tested
- Test both positive and negative cases for all functions
- Mock external dependencies where appropriate