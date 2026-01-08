---
name: humanize-text
description: Proactively optimize AI-generated text in documents, transforming it into more natural, less AI-flavored expressions. Automatically identify and directly edit files, removing overly formal or mechanical language while adding human characteristics. Supports single file or batch processing.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Text Humanization Tool

**Proactively optimize documents you're working on**, converting AI-generated text into more natural, human-sounding expressions. This skill automatically identifies AI writing patterns and directly edits files for optimization.

## How It Works

When you activate this skill, it will:

1. **Read Target Files** - Analyze specified file content
2. **Evaluate AI Flavor** - Automatically calculate AI writing pattern score (1-10)
3. **Identify Problem Areas** - Mark paragraphs needing rewriting
4. **Direct Edit Optimization** - Write rewritten content back to files
5. **Provide Rewrite Explanation** - Explain adjustments made and rationale

## Usage

### Optimize Single File

```markdown
Please optimize the AI flavor in README.md
```

```markdown
Help me rewrite docs/api.md, maintaining technical accuracy
```

### Specify File and Style

```markdown
Convert blog-post.md to:
- Casual conversational style
- Suitable for technical blog
- Preserve code examples
```

### Batch Processing

```markdown
Optimize all Markdown files in the docs/ directory
```

### Evaluate Without Modifying

```markdown
Check the AI flavor level of product-description.md, don't modify yet
```

### Integrated Workflow

**Scenario 1: Just Finished Technical Documentation**
```markdown
I just completed API documentation, please optimize docs/api-reference.md
```

**Scenario 2: Received AI-Generated Content**
```markdown
I used AI to generate a blog draft at blog/react-hooks.md, make it more natural
```

**Scenario 3: Optimize Entire Documentation Directory**
```markdown
All files in docs/ are AI-generated, please batch optimize them
```

**Scenario 4: Review Before Modifying**
```markdown
Check the AI flavor in README.md and CONTRIBUTING.md,
tell me the scores, then I'll decide if I want changes
```

## Common Transformation Patterns

### 1. Remove Excessive Politeness

**Typical AI Writing:**
> Thank you very much for your question. I would be delighted to assist you. Here is a detailed answer...

**After Humanization:**
> Good question. Here are the key points...

### 2. Simplify Verbose Sentences

**Typical AI Writing:**
> To ensure the best user experience, we recommend you follow these steps to optimize your workflow...

**After Humanization:**
> Doing it this way will be smoother...

### 3. Reduce "Let me" Patterns

**Typical AI Writing:**
> Let me explain... Let's look at... Let me summarize...

**After Humanization:**
> Simply put... The point is... In summary...

### 4. Avoid Overuse of Formal Address

**Typical AI Writing:**
> You can achieve your goals through the following methods. First, you need to...

**After Humanization:**
> You can do it this way: First...

### 5. Increase Variation

**Typical AI Writing:**
> First... Second... Third... Finally...
> Additionally... Additionally... Additionally...

**After Humanization:**
> First... Also... Another key point... Finally, note that...

## Best Practices

### ✅ Recommended Approaches

- **Preserve Technical Terms** - Don't sacrifice accuracy for colloquialism
- **Adjust Based on Context** - Technical docs and marketing copy need different tones
- **Moderate Conversion** - Not all formal expressions are "AI flavor"
- **Maintain Consistency** - Keep tone unified within the same document

### ❌ Things to Avoid

- Over-colloquialization leading to unprofessionalism
- Removing necessary polite language (especially in customer service)
- Sacrificing clarity to pursue "natural"
- Adding inappropriate slang or internet language

## Tone Guide

### Appropriate Scenarios

| Scenario | Conversion Intensity | Example Adjustment |
|----------|---------------------|-------------------|
| Blog Articles | High | Friendly, conversational |
| Technical Docs | Medium | Clear, direct but not stiff |
| Social Media | High | Casual, with personality |
| Business Email | Low-Medium | Professional but friendly |
| Customer Service | Medium | Genuine, empathetic |

## Advanced Techniques

### 1. Add Specific Details

**Original:** This method is very effective.
**Rewritten:** This method makes loading 3x faster.

### 2. Use Active Voice

**Original:** This problem has been solved.
**Rewritten:** We fixed this problem.

### 3. Use Rhetorical Questions Moderately

**Original:** There is a better way.
**Rewritten:** Is there a better way? Actually, yes.

### 4. Break Perfect Sentence Structure

**Original:** This feature provides excellent user experience, outstanding performance, and unparalleled reliability.
**Rewritten:** This feature is easy to use, fast, and stable.

## Checklist

Before conversion, confirm:

- [ ] Understand target audience (technical vs general users)
- [ ] Confirm appropriate tone (formal vs casual)
- [ ] Preserve key information and technical terms
- [ ] Check if excessive modifications changed meaning

After conversion, verify:

- [ ] Does it read more naturally?
- [ ] Is the original meaning preserved?
- [ ] Is the tone appropriate for the scenario?
- [ ] Are there any introduced grammar errors?

## Practical Examples

### Example 1: Technical Explanation

**Original AI Text:**
```
To implement this feature, you need to first install the necessary dependencies. Let me explain the entire process in detail.
First, you should execute the install command. Second, you need to configure the relevant settings. Finally, you can start using it.
```

**After Humanization:**
```
To use this feature, first install the required packages.

The steps are simple:
1. Run the install command
2. Adjust the config file
3. You're ready to go
```

### Example 2: Blog Opening

**Original AI Text:**
```
In today's rapidly evolving technology landscape, we often encounter various challenges.
This article will provide you with an in-depth exploration of this topic and practical solutions.
```

**After Humanization:**
```
Hit a wall while coding? This article shares a few practical tips.
```

## Workflow Example

### Complete Optimization Process

```
User: Please optimize docs/getting-started.md

Skill Execution:
1. Read docs/getting-started.md
2. Analyze content, find AI flavor score: 7/10
3. Identify issues:
   - Overuse of formal address (23 instances)
   - Fixed patterns "First...Second...Finally" (5 places)
   - Verbose openings (3 paragraphs)
4. Execute rewrite and directly edit file
5. Report rewrite results and key adjustments
```

### Output Example

```
✅ Optimized docs/getting-started.md

AI flavor score: 7/10 → 2/10

Main adjustments:
• Removed 15 overly formal instances of formal address
• Simplified opening (from 3 paragraphs → 1 paragraph)
• Restructured 5 "First...Second" patterns
• Added 3 specific examples
• Average sentence length: 28 chars → 16 chars

File updated, please review the rewrite results.
```

## Important Notes

- This skill **will directly modify files**, recommend committing git or backing up first
- Some formal contexts (legal documents, academic papers) don't recommend excessive naturalization
- Decide conversion degree based on brand tone
- Different languages and cultures have different definitions of "natural"
- Can use "evaluation mode" to check AI flavor level before deciding whether to modify

## Practical Instructions

### Usage Instructions for Claude

When using this skill:

1. **Read Target Files** - Use Read tool to read specified files
2. **Evaluate AI Flavor** - Calculate 1-10 score
3. **Identify Specific Issues** - List discovered AI writing patterns and occurrence counts
4. **Direct Edit Optimization** - Use Edit tool to rewrite paragraph by paragraph
5. **Report Rewrite Results** - Provide before/after comparison and key adjustment explanations

### Batch Processing Flow

When processing multiple files:

1. Use Glob to find target files
2. Read and evaluate each one
3. Prioritize files with AI flavor score ≥ 6
4. Provide batch processing summary

### Safety Measures

- Inform user before rewriting that files will be modified
- Provide rewrite scope estimate (X files, Y modifications)
- If file exceeds 500 lines, ask first about segmented processing
- Leave code blocks and technical terms unchanged

## Related Resources

See [`REFERENCE.md`](./REFERENCE.md) for:
- Complete AI writing pattern list
- Conversion examples for different contexts
- Advanced rewriting techniques

See [`USAGE_EXAMPLES.md`](./USAGE_EXAMPLES.md) for:
- 7 complete conversion cases from real scenarios
- Examples for different types: technical docs, blogs, emails, etc.

---

**Usage Recommendations:**
- Commit git or create backup before modification
- Can use "evaluation mode" to check AI flavor level first
- When batch processing, recommend testing effect on single file first
- If unsatisfied, can use git checkout to restore
