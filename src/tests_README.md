# Test Suite for Agent Skill Builder

This directory contains comprehensive unit tests for the Agent Skill Builder.

## Test Coverage

The test suite covers the following modules:

1. **validator.test.ts** - Tests for SKILL.md validation logic
   - Metadata validation (name, description, optional fields)
   - YAML frontmatter parsing
   - Skill file and directory validation

2. **utils.test.ts** - Tests for utility functions
   - Path expansion (`expandHome`)
   - YAML frontmatter parsing
   - File system operations (exists, ensureDir, copyDir)
   - Skill discovery and listing

3. **converter.test.ts** - Tests for format conversion
   - Cursor rules conversion
   - Rule extraction from markdown
   - Content optimization

4. **deployer.test.ts** - Tests for deployment logic
   - Single skill deployment to multiple targets
   - Batch deployment of multiple skills
   - Dry run mode
   - Force overwrite mode
   - Skill removal

## Test Fixtures

Test fixtures are located in `src/test_fixtures/` and include:

- **valid-skill/** - A valid skill with all optional fields
- **valid-skill-minimal/** - A minimal valid skill with only required fields
- **invalid-no-name/** - Invalid skill missing the name field
- **invalid-no-description/** - Invalid skill missing the description field
- **invalid-name-format/** - Invalid skill with incorrect name format
- **invalid-name-too-long/** - Invalid skill with name exceeding character limit
- **invalid-description-too-long/** - Invalid skill with description exceeding character limit
- **invalid-no-frontmatter/** - Invalid skill without YAML frontmatter
- **cursor-rules-skill/** - Skill for testing Cursor conversion

## Running Tests

### Prerequisites

- [Deno](https://deno.land/) 0.224.0 or later

### Run All Tests

```bash
deno task test
```

Or directly:

```bash
deno test --allow-read --allow-write
```

### Run Specific Test File

```bash
deno test --allow-read --allow-write src/validator.test.ts
deno test --allow-read --allow-write src/utils.test.ts
deno test --allow-read --allow-write src/converter.test.ts
deno test --allow-read --allow-write src/deployer.test.ts
```

### Run Tests with Coverage

```bash
deno test --allow-read --allow-write --coverage=coverage
deno coverage coverage
```

### Watch Mode (Re-run on Changes)

```bash
deno test --allow-read --allow-write --watch
```

## Test Utilities

The test suite includes helper functions in `test_utils.ts`:

- `createTempDir()` - Create temporary test directories
- `cleanupTempDir()` - Clean up temporary directories
- `copyFixture()` - Copy test fixtures to temporary locations
- `createTestSkill()` - Create custom test skills
- `getFixturePath()` - Get path to test fixtures
- `assertFileExists()` - Assert that a file exists
- `assertFileNotExists()` - Assert that a file does not exist
- `readTestSkill()` - Read and parse test SKILL.md files

## Test Statistics

Total test files: 4
Total test cases: 100+

### Breakdown by Module

- **validator.test.ts**: ~45 test cases
- **utils.test.ts**: ~30 test cases
- **converter.test.ts**: ~20 test cases
- **deployer.test.ts**: ~25 test cases

## Continuous Integration

Tests are automatically run on every push and pull request via GitHub Actions.
See `.github/workflows/test.yml` for CI configuration.

## Writing New Tests

When adding new functionality, please:

1. Add corresponding test cases
2. Use the test utilities for common operations
3. Clean up temporary files and directories
4. Follow the existing test structure and naming conventions
5. Ensure tests are isolated and don't depend on external state

Example test structure:

```typescript
Deno.test("module - test description", async () => {
  const tempDir = await createTempDir();

  try {
    // Test setup
    // Test execution
    // Assertions
    assertEquals(actual, expected);
  } finally {
    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
  }
});
```
