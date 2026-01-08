# Skill Reviewer

> Review your Claude Code session to evaluate skill effectiveness and discover improvement opportunities

## Quick Start

### After a Coding Session

```
Review the skills used in this conversation
```

### For Specific Skills

```
How well did the humanize-text skill perform?
```

### Find Missed Opportunities

```
What skills could have helped but weren't used?
```

## What You'll Get

1. **Skills Identified** - Which skills were triggered during the session
2. **Performance Scores** - Quality ratings (1-5) for each skill
3. **Gap Analysis** - Edge cases and scenarios not handled
4. **Recommendations** - Actionable improvements to make

## Example Output

```
Skill Review Report
===================
Skills Identified: 2
Overall Effectiveness: 4/5

1. humanize-text (4 invocations)
   Quality: 4/5
   Tasks Completed: 4/4
   Suggestion: Add batch processing for docs/

2. check-sensitive (1 invocation)
   Quality: 5/5
   Tasks Completed: 1/1
   Note: Working well, no changes needed

Missed Opportunity:
- 8 manual format edits detected
- Consider: code-formatter skill
```

## Common Use Cases

| Scenario | Prompt |
|----------|--------|
| End of session | "Review skills used today" |
| After errors | "What went wrong with the skills?" |
| Skill development | "How can I improve this skill?" |
| Team onboarding | "What skills are available?" |

## File Structure

```
skills/skill-reviewer/
├── README.md           # This file - quick start
├── SKILL.md            # Full documentation
├── REFERENCE.md        # Evaluation criteria details
└── USAGE_EXAMPLES.md   # Real-world examples
```

## Learning Path

1. **Quick Start** - Read this README (2 min)
2. **Full Guide** - Read [SKILL.md](./SKILL.md) (10 min)
3. **Deep Dive** - Study [REFERENCE.md](./REFERENCE.md)
4. **Learn by Example** - Review [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)

## FAQ

**Q: When should I run this analysis?**
A: At the end of coding sessions, after completing features, or when skills seem ineffective.

**Q: Does this modify my skills?**
A: No. This skill only analyzes and reports. You implement the improvements.

**Q: Can it analyze past conversations?**
A: Only the current conversation context is available for analysis.

**Q: What if no skills were used?**
A: The review will identify opportunities where skills could have helped.

---

**Tip:** Make skill review a habit at the end of each session to continuously improve your workflow.
