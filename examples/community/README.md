# Community reference: LootSnob V4

**LootSnob V4 by Immortalbob** is preserved here as BroLoot's long-standing community reference profile. Immortalbob shared LootSnob on his forum in 2014; the thread includes installation instructions, explanations of the rule families, and years of community discussion.

- [Original author’s download and explanation](https://immortalbob.com/phpBB3/viewtopic.php?p=3)
- [Original attachment](https://immortalbob.com/phpBB3/download/file.php?id=60)
- [Pinned GitHub mirror used for this copy](https://github.com/Raajik/ruleforge/blob/64388e9dad8a07a47b693148b9e9ce3740c1cf0e/fixtures/LootSnobV4.utl)
- [Unchanged profile](LootSnobV4.utl) and [source/checksum record](LootSnobV4.source.json)

The mirror bytes, line endings, rule order, and original disabled states are unchanged. This is a historical compatibility example, not a replacement for your configured DreamWeave profile. Its original selection thresholds are intentionally selective, and many rules ship disabled.

## Findings

The profile contains 1,627 rules. 156 distinct rules contain buffed attack or melee-defense conditions: 120 include melee defense and 37 include attack (one rule includes both). All these modifier conditions use **BuffedDoubleValKeyGE (2005)**, rather than raw **DoubleValKeyGE (5)**.

Examples:

| Rule | Native condition | Meaning |
|---|---|---|
| `(H) Axe (MD +8)` | Type 2005; value 1.26; key 29 | Buffed melee defense at least 26% |
| `(H) Axe (AT +3)` | Type 2005; value 1.25; key 167772172 | Buffed attack bonus at least 25% |
| `(W) No Wield (26MD)` | Type 2005; value 1.26; key 29 | Buffed wand melee defense at least 26% |

The two Heavy Axe examples are disabled in the original file; the wand 26MD example is enabled. A correct threshold alone does not enable a rule or satisfy its other conditions.

BroLoot's tests verify the saved checksum, exact UTL parse/write preservation, and these modifier examples. The file remains reference data; none of its expressions or metadata are executed.
