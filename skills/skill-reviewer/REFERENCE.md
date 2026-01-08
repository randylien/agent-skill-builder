# Skill Review Reference Guide

Comprehensive evaluation criteria and patterns for reviewing skill effectiveness.

---

## Evaluation Framework

### 1. Output Quality Scoring

#### Score 5: Excellent

- Output exceeds expectations
- No corrections needed
- Edge cases handled proactively
- Clear, well-structured results
- User expressed strong satisfaction

**Indicators:**
- Task completed on first attempt
- No follow-up questions needed
- Output used directly without modification

#### Score 4: Good

- Output meets requirements
- Minor refinements possible
- Most edge cases handled
- Results usable as-is

**Indicators:**
- Task completed with minimal iteration
- Small adjustments made
- Generally positive user feedback

#### Score 3: Adequate

- Task completed with issues
- Some corrections needed
- Common edge cases missed
- Results require review before use

**Indicators:**
- Multiple iterations required
- User made corrections
- Partial satisfaction expressed

#### Score 2: Poor

- Task partially completed
- Significant corrections needed
- Many edge cases unhandled
- Results require substantial editing

**Indicators:**
- Skill output largely modified
- Different approach eventually used
- User frustration evident

#### Score 1: Failed

- Task not accomplished
- Output unusable or incorrect
- Fundamental misunderstanding
- Complete redo required

**Indicators:**
- Output discarded entirely
- Manual completion instead
- Skill not used again for similar tasks

---

### 2. Task Completion Criteria

#### Fully Accomplished

- All stated objectives met
- Output matches expected format
- No follow-up corrections needed
- User expressed satisfaction

**Evidence:**
- Task marked complete
- No retry attempts
- Output accepted as-is

#### Partially Accomplished

- Some objectives met
- Output requires modification
- Follow-up tasks needed
- Mixed user feedback

**Evidence:**
- Additional prompts to complete
- Manual intervention required
- Some output retained, some modified

#### Not Accomplished

- Primary objective failed
- Output rejected or discarded
- Retry with different approach needed
- User expressed dissatisfaction

**Evidence:**
- Skill abandoned mid-task
- Alternative method used
- Explicit failure acknowledgment

#### Not Applicable

- Skill invoked but task not skill-related
- Exploratory or informational use
- Context prevented completion
- External blockers (permissions, etc.)

---

### 3. Edge Case Checklist

#### Input Validation

- [ ] Empty input handling
- [ ] Invalid format detection
- [ ] Boundary values (min/max)
- [ ] Special characters
- [ ] Unicode/encoding issues
- [ ] Very large inputs
- [ ] Nested or complex structures

#### Error Scenarios

- [ ] File not found
- [ ] Permission denied
- [ ] Network failures
- [ ] Timeout handling
- [ ] Partial failures
- [ ] Corrupted data
- [ ] Rate limiting

#### Environmental Factors

- [ ] Different OS behaviors (Windows/Mac/Linux)
- [ ] Path format variations
- [ ] Missing dependencies
- [ ] Version incompatibilities
- [ ] Locale/timezone differences

#### User Context

- [ ] Ambiguous requests
- [ ] Missing information
- [ ] Conflicting requirements
- [ ] Unstated assumptions
- [ ] Domain-specific terminology

---

## Skill Detection Patterns

### Explicit Invocation Patterns

```
# Slash command format
/skill-name
/humanize-text
/check-sensitive

# Use skill syntax
use skill: skill-name
activate skill-name

# Direct requests
run the humanize-text skill
apply check-sensitive to this file
```

### Implicit Activation Indicators

#### Tool Combination Signatures

| Tools Observed | Likely Skill Type |
|----------------|-------------------|
| Read + Edit + Write | File modification |
| Bash + Grep | Search/diagnostic |
| Read + WebFetch | Research/lookup |
| Glob + Read (batch) | Batch processing |
| Bash + git commands | Version control |
| Read + Grep + Report | Analysis skills |

#### Task Pattern Matching

| Task Description Pattern | Potential Skill |
|--------------------------|-----------------|
| "optimize AI text" | humanize-text |
| "make it more natural" | humanize-text |
| "check for secrets" | check-sensitive |
| "scan for API keys" | check-sensitive |
| "find my tickets" | manage-jira-confluence |
| "search confluence" | manage-jira-confluence |

---

## Improvement Categories

### Category 1: Documentation Gaps

**Indicators:**
- User asked clarifying questions
- Skill output misunderstood
- Features not discovered/used
- Unexpected behavior reported

**Resolution Actions:**
- Add examples to SKILL.md
- Clarify trigger words in description
- Update README.md quick start
- Add FAQ section

### Category 2: Missing Edge Cases

**Indicators:**
- Errors in specific scenarios
- Manual workarounds needed
- Partial task completion
- Retry with modified input

**Resolution Actions:**
- Add error handling logic
- Document limitations clearly
- Implement fallback behaviors
- Add input validation

### Category 3: Performance Issues

**Indicators:**
- Long execution times
- Resource exhaustion
- Rate limiting encountered
- Timeout errors

**Resolution Actions:**
- Optimize tool usage patterns
- Add caching mechanisms
- Implement pagination/batching
- Add progress indicators

### Category 4: Scope Creep

**Indicators:**
- Skill used for unintended purposes
- Unexpected outputs
- Feature confusion
- Overlap with other skills

**Resolution Actions:**
- Clarify skill boundaries in docs
- Add "not for" section
- Create specialized sub-skills
- Improve description specificity

### Category 5: Integration Problems

**Indicators:**
- Conflicts with other skills
- Tool permission issues
- Context loss between invocations
- State management failures

**Resolution Actions:**
- Review allowed-tools list
- Document skill interactions
- Add state management guidance
- Clarify prerequisites

---

## Improvement Priority Matrix

| Impact | Effort | Priority | Action |
|--------|--------|----------|--------|
| High | Low | P1 | Implement immediately |
| High | High | P2 | Plan and schedule |
| Low | Low | P3 | Quick wins when time allows |
| Low | High | P4 | Defer or reconsider |

### Priority Examples

**P1 - Immediate:**
- Skill fails on common input type
- Critical edge case unhandled
- Documentation causes confusion

**P2 - Plan:**
- Major feature enhancement
- Architecture redesign needed
- Multi-skill coordination fix

**P3 - Quick Wins:**
- Add helpful examples
- Improve error messages
- Minor documentation updates

**P4 - Defer:**
- Rare edge case handling
- Nice-to-have features
- Complex optimizations

---

## Analysis Checklist

### Pre-Analysis

- [ ] Identify conversation scope and duration
- [ ] Note distinct tasks attempted
- [ ] Mark explicit skill invocations
- [ ] List tools used throughout session

### During Analysis

- [ ] Map tasks to skills used
- [ ] Score each skill invocation (1-5)
- [ ] Note user corrections or retries
- [ ] Identify manual workarounds
- [ ] Find skill opportunities missed
- [ ] Check edge case handling

### Post-Analysis

- [ ] Summarize findings clearly
- [ ] Prioritize improvements (P1-P4)
- [ ] Draft specific recommendations
- [ ] Estimate improvement impact
- [ ] Identify patterns across skills

---

## Metrics and Scoring

### Session Effectiveness Score

```
Session Score = (
  Skills Used Score × 0.3 +
  Task Completion Score × 0.4 +
  Edge Case Handling Score × 0.2 +
  User Satisfaction Score × 0.1
)
```

### Individual Skill Score

```
Skill Score = (
  Quality Rating (1-5) +
  Completion Rate × 5 +
  Edge Case Coverage × 5
) / 3
```

### Aggregated Metrics

- **Invocation Success Rate**: Completed / Total attempts
- **First-Try Success Rate**: No-retry / Total attempts
- **Edge Case Coverage**: Handled / Total identified
- **User Override Rate**: Manual corrections / Total outputs

---

## Report Templates

### Executive Summary Template

```markdown
## Skill Review Summary

**Session:** [Description or Date]
**Duration:** [X hours/minutes]
**Skills Used:** [N]
**Overall Score:** [X.X/5]

### Highlights
- [Top performing skill and why]
- [Most improved area]
- [Key learning]

### Action Items
1. [P1 - High priority improvement]
2. [P2 - Medium priority improvement]
3. [P3 - Quick win]
```

### Detailed Skill Template

```markdown
### [Skill Name]

**Invocations:** X
**Quality Score:** X/5
**Completion Rate:** X%

#### What Worked Well
- [Positive observation 1]
- [Positive observation 2]

#### Issues Identified
- [Problem 1]
- [Problem 2]

#### Edge Cases Not Handled
- [Scenario 1]
- [Scenario 2]

#### Recommendations
- [Specific action 1]
- [Specific action 2]
```

### Missed Opportunity Template

```markdown
### Missed Opportunity: [Description]

**Pattern Detected:**
- [Manual task repeated X times]
- [Specific tool usage pattern]

**Available Skill:** [skill-name or "none"]

**Recommendation:**
- [If skill exists: How to use it]
- [If no skill: Suggest creating one]

**Estimated Impact:**
- Time savings: [X minutes]
- Error reduction: [potential]
```

---

## Common Patterns Library

### Pattern: Skill Underutilization

**Detection:**
- Manual task completion when skill available
- Repeated tool sequences matching skill purpose
- Skill mentioned but not invoked

**Analysis Questions:**
- Was the user aware of the skill?
- Is the trigger description clear?
- Are usage examples visible?

**Example Report:**
```
Detected: 5 instances of manual text editing
Available: humanize-text skill not invoked
Root Cause: Skill description doesn't mention "editing"
Recommendation: Add "edit AI text" to trigger words
```

### Pattern: Skill Overload

**Detection:**
- Single skill used for disparate purposes
- Frequent corrections after skill output
- Skill output significantly modified

**Analysis Questions:**
- Is the skill scope too broad?
- Should it be split into sub-skills?
- Are there unmet specialized needs?

**Example Report:**
```
Detected: humanize-text used for code comments
Observation: Skill designed for prose, not code
Impact: Technical accuracy reduced
Recommendation: Create code-comment-optimizer skill
```

### Pattern: Edge Case Failure

**Detection:**
- Skill failed on specific input
- Error message displayed
- User had to work around issue

**Analysis Questions:**
- Is this a common scenario?
- Should the skill handle this?
- Is clear documentation needed?

**Example Report:**
```
Detected: check-sensitive failed on binary file
Expected: Skip binary files gracefully
Actual: Error thrown, process stopped
Recommendation: Add binary file detection and skip
```

### Pattern: Workflow Inefficiency

**Detection:**
- Multiple skills used sequentially when could be combined
- Repeated context setup between skill calls
- Manual steps between skill invocations

**Analysis Questions:**
- Can skills be chained automatically?
- Is a composed workflow needed?
- Should skills share context?

**Example Report:**
```
Detected: humanize-text then check-sensitive on each file
Pattern: Sequential processing of 12 files
Recommendation: Create document-review pipeline skill
Estimated Savings: 40% reduction in manual coordination
```

---

## Version History Tracking

When updating skills based on analysis, track:

```markdown
## Change Log

### [Date] - Version X.Y

**Based on Review:** [Session description]

**Changes Made:**
- [Change 1 and rationale]
- [Change 2 and rationale]

**Metrics Impact:**
- Quality Score: Before → After
- Success Rate: Before → After

**Validation:**
- [How improvement was verified]
```

---

## Continuous Improvement Cycle

1. **Review** - Run skill-reviewer after sessions
2. **Identify** - Find patterns and issues
3. **Prioritize** - Use P1-P4 matrix
4. **Implement** - Make targeted improvements
5. **Validate** - Re-review in next session
6. **Document** - Update skill change logs
7. **Repeat** - Continuous improvement

---

**Note:** This reference guide should evolve as new patterns emerge and evaluation criteria are refined based on real usage.
