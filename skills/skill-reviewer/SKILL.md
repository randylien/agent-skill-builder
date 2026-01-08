---
name: skill-reviewer
description: Analyze conversation content to review Claude skills used during a session. Evaluate skill output quality, identify edge cases not handled, and provide actionable improvement suggestions. Use after coding sessions to review skill effectiveness.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Skill Reviewer

**Analyze and improve your Claude skill usage** by reviewing conversation patterns, evaluating skill performance, and identifying opportunities for enhancement.

## How It Works

When you activate this skill, it will:

1. **Scan Conversation History** - Analyze the current conversation content
2. **Identify Skills Used** - Detect which skills were triggered (explicit or implicit)
3. **Evaluate Performance** - Assess output quality and task completion
4. **Find Gaps** - Identify edge cases and scenarios not handled
5. **Suggest Improvements** - Provide actionable recommendations

## Skill Detection Methods

### 1. Explicit Invocations

Skills invoked via direct commands:
- `/skill-name` slash command patterns
- "Use skill: skill-name" mentions
- Direct skill activation keywords

### 2. Implicit Activations

Skills triggered by pattern matching:
- Task descriptions matching skill purposes
- Tool combinations typical of specific skills
- Output formats characteristic of particular skills

### 3. Tool Usage Signatures

Identify skills by their tool patterns:

| Tools Used | Likely Skill Type |
|------------|-------------------|
| Read + Write + Edit | File modification skills |
| Bash + Grep | Search/diagnostic skills |
| Read + WebFetch | Research/lookup skills |
| Glob + Read (batch) | Batch processing skills |

## Usage

### Basic Analysis

```
Review the skills used in this conversation
```

```
Analyze what skills helped and what could be improved
```

### Focused Analysis

```
How well did the humanize-text skill perform?
```

```
What edge cases did check-sensitive miss?
```

### Post-Session Review

```
I just finished coding. Review which skills worked well and what went wrong.
```

### Improvement Discovery

```
What skills could have helped but weren't used?
```

## Evaluation Criteria

### Output Quality (1-5 scale)

| Score | Description |
|-------|-------------|
| 5 | Exceeded expectations, comprehensive output, no corrections needed |
| 4 | Met all requirements effectively, minor refinements possible |
| 3 | Completed task with issues, some corrections needed |
| 2 | Partially completed, significant gaps identified |
| 1 | Failed to meet requirements, output unusable |

### Task Completion Categories

- **Fully Accomplished**: All objectives met, no follow-up needed
- **Partially Accomplished**: Some objectives met, requires modification
- **Not Accomplished**: Primary objective failed, retry needed
- **Not Applicable**: Skill invoked but task not skill-related

### Edge Case Assessment

Key areas to evaluate:
- Input validation (empty, invalid, boundary values)
- Error scenarios (file not found, permissions, network)
- Environmental factors (OS differences, dependencies)
- User context (ambiguous requests, missing information)

## Report Format

### Summary Section

```
Skill Review Report
===================
Session Duration: [estimated time]
Skills Identified: [count]
Overall Effectiveness: [score]/5

Skills Used:
1. skill-name (invoked X times)
   - Quality: 4/5
   - Tasks Completed: 3/4
   - Improvement Priority: Medium
```

### Detailed Findings

For each skill:
- Invocation context and trigger
- Output quality assessment
- Missed opportunities or gaps
- Specific recommendations

### Actionable Improvements

Prioritized list including:
- Skill documentation updates
- New edge case handling
- Performance optimizations
- Missing functionality to add

## Analysis Patterns

### Pattern 1: Underutilization

When a skill could have helped but wasn't used:

```
Observation: Manual file editing detected (8 instances)
Available: humanize-text skill could process batch files
Suggestion: Use batch processing for similar tasks
```

### Pattern 2: Misuse

When a skill was used inappropriately:

```
Observation: check-sensitive ran on test fixtures
Impact: Unnecessary warnings, wasted time
Suggestion: Configure .sensitiveignore for test directories
```

### Pattern 3: Incomplete Usage

When skill capabilities weren't fully leveraged:

```
Observation: humanize-text used without context specification
Impact: Generic optimization instead of targeted
Suggestion: Specify document type (technical, blog, etc.)
```

### Pattern 4: Missing Edge Cases

When skill didn't handle specific scenarios:

```
Observation: Skill failed on empty input
Expected: Graceful handling with clear message
Suggestion: Add empty input validation to skill
```

## Best Practices

### When to Run Analysis

- After completing a major feature
- At the end of a coding session
- When encountering repeated issues
- During skill development/refinement

### What to Look For

- Repeated manual tasks that skills could automate
- Error patterns indicating missing edge cases
- User corrections suggesting unclear instructions
- Time spent vs expected duration

## Improvement Workflow

1. **Analyze** - Run skill usage review
2. **Prioritize** - Focus on high-impact improvements
3. **Update** - Modify skill documentation
4. **Test** - Validate improvements in new session
5. **Iterate** - Re-analyze after changes

## Integration with Other Skills

This skill works well after using:
- `humanize-text` - Review text optimization effectiveness
- `check-sensitive` - Evaluate security scanning accuracy
- Any custom skills - Validate new skill performance

## Output Example

```markdown
## Skill Review Report

**Session:** Feature Development
**Skills Identified:** 2

---

### 1. humanize-text

**Invocations:** 4
**Quality Score:** 4/5
**Tasks Completed:** 4/4

#### What Worked Well
- Successfully converted AI-generated docs to natural language
- Batch processing saved significant time

#### Edge Cases Not Handled
- Technical abbreviations were incorrectly expanded
- Code comments within prose weren't preserved

#### Improvement Suggestions
- Add "preserve technical terms" option
- Improve code block detection in mixed content

---

### 2. check-sensitive (Pre-commit Hook)

**Invocations:** 1
**Quality Score:** 5/5
**Tasks Completed:** 1/1

#### What Worked Well
- Correctly flagged API key in config file
- No false positives

#### No Improvements Needed
- Working as expected

---

### Session Summary

**Efficiency Score:** 4/5
**Key Improvement:** Add technical document mode to humanize-text
**Time Saved by Skills:** ~25 minutes estimated
```

## Related Resources

See [`REFERENCE.md`](./REFERENCE.md) for:
- Complete evaluation framework
- Scoring criteria details
- Skill detection pattern library
- Improvement priority matrix

See [`USAGE_EXAMPLES.md`](./USAGE_EXAMPLES.md) for:
- Real analysis session examples
- Before/after improvement cases
- Multi-skill interaction analysis

---

**Tip:** Run this skill at the end of each significant coding session to continuously improve your skill library.
