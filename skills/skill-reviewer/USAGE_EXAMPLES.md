# Skill Review Usage Examples

Real-world examples demonstrating skill review analysis and improvement workflows.

---

## Example 1: Post-Feature Development Review

### Context

Developer completed a new API documentation feature over 2 hours.

### Analysis Request

```
Review the skills I used while building the API documentation feature
```

### Analysis Output

```markdown
## Skill Review Report

**Session:** API Documentation Feature
**Duration:** ~2 hours
**Skills Identified:** 3
**Overall Score:** 4.2/5

---

### 1. humanize-text

**Invocations:** 4
**Quality Score:** 4/5
**Tasks Completed:** 4/4

#### What Worked Well
- Successfully converted AI-generated explanations to natural language
- Maintained technical accuracy while improving readability
- Consistent tone across all processed files

#### Issues Identified
- One instance required manual adjustment for technical accuracy
- API method names were incorrectly simplified
- Code examples within prose were altered

#### Edge Cases Not Handled
- Technical abbreviations (API, REST, HTTP) expanded unnecessarily
- Inline code references not preserved
- Table formatting slightly altered

#### Recommendations
- P1: Add "preserve technical terms" option for API docs
- P2: Improve code block detection in mixed content
- P3: Use batch processing for multiple files

---

### 2. check-sensitive (Pre-commit Hook)

**Invocations:** 1
**Quality Score:** 5/5
**Tasks Completed:** 1/1

#### What Worked Well
- Correctly flagged example API key in documentation
- No false positives on test credentials
- Clear, actionable error message

#### No Improvements Needed
- Working as expected for this use case

---

### 3. Manual Pattern Detected

**Type:** Repeated manual work
**Instances:** 8 code example formatting edits

#### Observation
Developer manually formatted 8 code examples with:
- Consistent syntax highlighting hints
- Standard comment style
- Language-specific formatting

#### Missed Opportunity
No skill exists for code example formatting.

#### Recommendation
- P2: Create `code-example-formatter` skill
- Estimated time savings: 15-20 minutes per session

---

### Session Summary

| Metric | Value |
|--------|-------|
| Efficiency Score | 4.2/5 |
| Time Saved by Skills | ~25 minutes |
| Potential Additional Savings | ~20 minutes |

**Priority Actions:**
1. Add technical document mode to humanize-text
2. Create code-example-formatter skill
3. Document batch processing workflow
```

### Resulting Improvements

Based on this analysis:

1. **Updated humanize-text SKILL.md:**
   - Added "Technical Documents" section with API docs guidance
   - Included examples showing how to preserve technical terms

2. **Created backlog item:**
   - code-example-formatter skill concept documented
   - Added to skill development roadmap

---

## Example 2: Debugging Session Analysis

### Context

30-minute debugging session for a failing test.

### Analysis Request

```
What skills helped or could have helped with my debugging?
```

### Analysis Output

```markdown
## Skill Review Report

**Session:** Test Debugging
**Duration:** ~30 minutes
**Skills Identified:** 1
**Missed Opportunities:** 2

---

### Skills Used

#### 1. check-sensitive

**Context:** Pre-commit check before pushing fix
**Quality Score:** 5/5
**Result:** Passed with no issues

**Notes:**
- Correctly validated fix didn't introduce secrets
- Quick execution, minimal friction

---

### Missed Opportunities

#### Opportunity 1: Stack Trace Analysis

**Pattern Detected:**
- 3 stack traces manually copied and parsed
- Manual identification of relevant file:line references
- Time spent: ~8 minutes

**Potential Skill:**
```
stack-trace-analyzer
- Parse and format stack traces
- Highlight relevant source files
- Link to referenced code locations
- Identify common error patterns
```

**Recommendation:** P2 - Create stack-trace-analyzer skill

#### Opportunity 2: Test Isolation

**Pattern Detected:**
- 4 test runs with different filters
- Manual identification of related tests
- Time spent: ~7 minutes

**Potential Skill:**
```
test-helper
- Find related tests by file/function
- Suggest minimal test subset
- Track test execution history
- Identify flaky tests
```

**Recommendation:** P3 - Create test-helper skill

---

### Session Time Breakdown

| Activity | Time | Skill Assisted |
|----------|------|----------------|
| Understanding error | 10 min | No |
| Locating cause | 12 min | No |
| Implementing fix | 5 min | No |
| Verification | 3 min | Yes (check-sensitive) |

**Analysis:**
- 73% of time spent without skill assistance
- Debugging workflow has skill gaps
- Two potential new skills identified

---

### Recommendations

**Immediate:**
- None required for existing skills

**Short-term:**
- P2: Create stack-trace-analyzer skill
- P3: Create test-helper skill

**Long-term:**
- P3: Create integrated debugging workflow skill
```

---

## Example 3: Multi-Skill Interaction Analysis

### Context

Document migration project using multiple skills over 90 minutes.

### Analysis Request

```
Analyze how the skills worked together during my document migration
```

### Analysis Output

```markdown
## Skill Review Report

**Session:** Document Migration
**Duration:** ~90 minutes
**Skills Identified:** 3
**Interaction Issues:** 2

---

### Skills Used

#### 1. humanize-text

**Invocations:** 12
**Quality Score:** 4/5
**Completion Rate:** 100%

#### 2. check-sensitive

**Invocations:** 12
**Quality Score:** 5/5
**Completion Rate:** 100%

#### 3. manage-jira-confluence

**Pattern Match:** Confluence mentions in conversation
**Actual Usage:** Not invoked
**Root Cause:** User unaware of capability

---

### Interaction Analysis

#### Issue 1: Sequential Processing Overhead

**Observed Pattern:**
```
For each of 12 files:
  1. Run humanize-text
  2. Run check-sensitive
  3. Manual review
```

**Impact:**
- 24 separate skill invocations
- Context re-established each time
- Estimated overhead: 20+ minutes

**Recommendation:**
```markdown
Create composed workflow: document-review
1. Batch humanize-text on directory
2. Batch check-sensitive on same directory
3. Generate combined report
```

**Priority:** P2 - Significant time savings potential

#### Issue 2: Missed Automation

**Observed Pattern:**
- "Copy to Confluence" mentioned 4 times
- manage-jira-confluence available but unused
- Manual copy-paste workflow used

**Root Cause Analysis:**
- Skill description doesn't mention document upload
- User unaware of Confluence write capabilities
- No "migration" trigger words in description

**Recommendation:**
- P1: Update manage-jira-confluence description
- Add trigger words: "upload to confluence", "publish to confluence"
- Document page creation capability in README

---

### Workflow Comparison

**Current Flow:**
```
For each document (12 total):
  humanize-text → check-sensitive → manual upload
Total time: ~90 minutes
```

**Optimized Flow:**
```
1. humanize-text batch on docs/
2. check-sensitive batch on docs/
3. manage-jira-confluence bulk upload
Estimated time: ~35-45 minutes
```

**Potential Savings:** 45-55 minutes (50-60%)

---

### Action Items

| Priority | Action | Impact |
|----------|--------|--------|
| P1 | Update manage-jira-confluence triggers | Enable existing capability |
| P2 | Document batch workflows | Reduce manual coordination |
| P2 | Create document-pipeline skill | Major efficiency gain |
| P3 | Add cross-skill workflow examples | User education |
```

---

## Example 4: New User Skill Discovery

### Context

New team member's first day using Claude Code skills.

### Analysis Request

```
What skills did I use today and what else is available?
```

### Analysis Output

```markdown
## Skill Review Report

**Session:** First Day Onboarding
**Duration:** ~4 hours
**Skills Used:** 1
**Skills Available:** 4

---

### Skills You Used

#### 1. check-sensitive

**How Discovered:** Pre-commit hook (automatic)
**Invocations:** 3
**Quality Score:** 5/5

**Your Usage:**
- Ran automatically before commits
- Correctly identified test API key
- Guided you to fix before pushing

**Tip:** You can also run manually:
```
Check this file for sensitive information: config.ts
```

---

### Skills You Didn't Use (But Might Help)

#### humanize-text

**Purpose:** Optimize AI-generated text to sound natural

**You Would Benefit Because:**
- You wrote 3 documentation sections
- AI-generated content patterns detected in commits
- README updates could be more natural

**How to Use:**
```
Make the README more natural and less AI-sounding
```

```
Optimize docs/api.md to remove AI tone
```

#### manage-jira-confluence

**Purpose:** Interact with Jira and Confluence

**You Would Benefit Because:**
- You mentioned ticket PROJ-123 twice
- Manual Jira lookup observed in browser
- Could streamline ticket references

**How to Use:**
```
Get details for PROJ-123
```

```
Find my assigned Jira tickets
```

#### skill-reviewer (This Skill)

**Purpose:** Review skill effectiveness

**Best Used:**
- End of coding sessions
- After completing features
- When workflows feel inefficient

---

### Learning Path Suggestion

**Week 1:**
1. Continue using check-sensitive (automatic)
2. Try humanize-text on your next docs update
3. Use skill-reviewer at end of day

**Week 2:**
1. Explore manage-jira-confluence for tickets
2. Learn batch processing patterns
3. Identify workflow improvements

---

### Resources for Each Skill

Every skill has documentation:
```
skills/[skill-name]/
├── README.md        # Quick start (2 min)
├── SKILL.md         # Full guide (10 min)
├── REFERENCE.md     # Deep reference
└── USAGE_EXAMPLES.md # Real examples
```

**Recommended Reading Order:**
1. README.md - Get started quickly
2. SKILL.md - Understand capabilities
3. USAGE_EXAMPLES.md - Learn from examples
```

---

## Example 5: Skill Improvement Validation

### Context

After updating humanize-text based on previous review analysis.

### Analysis Request

```
Did the humanize-text improvements work? Compare to last week.
```

### Analysis Output

```markdown
## Skill Improvement Validation

**Skill:** humanize-text
**Comparison Period:** This session vs. Previous week

---

### Metrics Comparison

| Metric | Last Week | This Session | Change |
|--------|-----------|--------------|--------|
| Invocations | 4 | 6 | +50% |
| Quality Score | 4.0/5 | 4.5/5 | +0.5 |
| Manual Corrections | 3 | 1 | -67% |
| Batch Usage | 0% | 50% | +50% |
| Technical Term Errors | 4 | 1 | -75% |

---

### Change 1: Batch Processing Guidance

**Status:** Effective

**Evidence:**
- 3 of 6 invocations used batch mode
- No file-by-file processing observed
- "Batch process docs/" prompt used successfully

**Before:**
```
Humanize README.md
Humanize api.md
Humanize setup.md
(repeat 12 times)
```

**After:**
```
Humanize all files in docs/ directory
```

**Impact:** ~40% time reduction per session

---

### Change 2: Technical Document Context

**Status:** Partially Effective

**Evidence:**
- Technical terms mostly preserved
- 1 correction still needed for API method name
- Code references handled better

**Remaining Issue:**
- Method signatures like `getUserById()` still occasionally humanized
- Inline backtick code not always recognized

**Further Action Required:**
- P2: Add explicit method signature preservation
- P3: Improve inline code detection

---

### Change 3: Code Block Preservation

**Status:** Needs More Work

**Evidence:**
- Standalone code blocks preserved
- Code within lists sometimes altered
- Table code examples affected

**Example Problem:**
```
Before: `const API_KEY = process.env.KEY;`
After: `const apiKey = process.env.KEY;`
(Variable name was "humanized")
```

**Action Required:**
- P1: Never modify content inside backticks

---

### Summary

| Change | Status | Score |
|--------|--------|-------|
| Batch Processing | Effective | 5/5 |
| Technical Context | Partial | 3/5 |
| Code Preservation | Needs Work | 2/5 |

**Overall Improvement:** +12.5% quality increase

**Next Iteration Focus:**
1. Code preservation (P1)
2. Method signature handling (P2)

---

### Validation Recommendation

Re-run this validation after next improvements.

**Success Criteria for Next Review:**
- Manual Corrections: < 1 per session
- Code Block Errors: 0
- Quality Score: > 4.7/5
```

---

## Quick Reference: Review Prompts

### General Session Review
```
Review the skills used in this conversation
```

### Specific Skill Analysis
```
How effective was [skill-name] in this session?
```

### Gap Discovery
```
What skills could have helped but weren't used?
```

### Improvement Validation
```
Compare skill effectiveness to previous sessions
```

### Workflow Optimization
```
How can I use skills more efficiently together?
```

### New User Discovery
```
What skills are available for my work?
```

### Edge Case Focus
```
What edge cases did the skills miss today?
```

---

## Tips for Effective Reviews

1. **Review Regularly** - End of each significant session
2. **Be Specific** - Ask about particular skills or tasks
3. **Track Changes** - Document improvements made
4. **Validate** - Re-review after implementing changes
5. **Share Learnings** - Help team members benefit

---

**Note:** These examples are illustrative. Actual analysis results depend on your conversation content and available skills.
