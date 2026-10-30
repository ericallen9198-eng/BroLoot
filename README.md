# BroLoot

Easier to use UTL editor, with a local Windows x64 app and a browser edition.

**[Download BroLoot 1.3 for Windows](https://github.com/ericallen9198-eng/BroLoot/raw/refs/heads/main/dist/downloads/BroLoot-Windows-x64.zip)**

Extract the entire ZIP and run **BroLoot.exe**. Send the ZIP to other players. No account, sign-in, activation, or BroLoot website is needed to run the desktop app.

## Editing and saving

Edits save automatically on the current PC. **Save settings** is an optional JSON backup. **Export UTL** writes the profile used by the game; it also includes the BroLoot editor settings. Open an exported UTL or a JSON backup to restore or transfer your settings.

## Ratings

| Category | Main rating choices | Tier 8 reference maximum |
| --- | --- | --- |
| Armor | Critical Damage (CD), Critical Damage Resist (CDR) | 2 |
| Underclothes | Damage (D), Damage Resist (DR) | 3 |
| Cloaks | Damage (D), Damage Resist (DR) | 3 |
| Jewelry | Max Health / Vitality (V), Healing Boost (H) | 3 |
| Trinkets | Max Health / Vitality (V), Healing Boost (H) | 3 |

Each selected rating is an alternative minimum. Higher rolls qualify; these reference maxima do not impose an upper loot limit. **Extra server ratings** makes all six rating types available in each category and retains existing DreamWeave clothing CD/CDR settings. Set the minimum cantrip count to **0** to match ratings without requiring cantrips.

Jewelry, trinkets, cloaks, and underclothes have separate equipment-slot checks. Older files that treated jewelry broadly retain matching targets for trinkets when migrated.

## Cloaks

Cloaks have a dedicated category with:

- **Set:** Any set or one of 41 cloak mastery sets, including War Magic, Void Magic, Summoning, combat, defense, crafting, and legacy weapon sets.
- **Proc:** Any proc, damage reduction (standard -200), any spell proc, Cloaked in Skill, Shroud of Darkness (any defense), or a specific ring spell.
- **Minimum level potential:** Any, or level 1–5 and higher. This checks the level the cloak can reach, rather than its current trained level, using the same icon overlays as the supplied profiles.
- **Ratings:** Damage or Damage Resist minimums; higher rolls qualify.

Set, proc, and level requirements must all match; selected ratings remain alternatives. Cloak proc matching does not require selecting ordinary cantrip tiers.

Older imported cloak rules remain active until explicitly moved or disabled. Use **Move supported cloaks into controls** under Imported rules or from the Cloaks category. The converter preserves supported name filters and stricter pack-space requirements; unsupported conditions remain intact under Imported rules. Broad old rules may otherwise keep cloaks outside a new narrower target.

## Current capabilities

- Equipment targets with positive cantrip-count minimums; unselected additional cantrips are allowed.
- Alternative minimums for D, DR, CD, CDR, Vitality, and Healing Boost; armor sets and separate trinket targets.
- Damage thresholds compiled from the supplied DreamWeave weapon rules, retaining their original buffed-value requirements and wield conditions.
- Material/workmanship salvage controls and separate combination ranges.
- DreamWeave custom-item toggles and Keep / Keep # quantities.
- UTL v1 import/export, editor settings backups, original-file download, opaque imported rules, and explicit conversion of supported salvage rules.

## Compatibility evidence

The UTL framing and requirement field order were inspected in the supplied VTClassic.dll without executing it. Relevant methods: cLootRules.Read/Write/Classify, cLootItemRule.Read/Write/Match, SpellMatch.Read/Write/Match, CharacterMainPackEmptySlotsGE.Read/Write, and UTLFileExtraBlockManager.Read/Write.

The reader/writer reproduces all four supplied UTL files exactly (1,927 rules). Unknown requirements and extensions remain opaque. The runtime selects the first matching rule; imported rules retain their relative order. The NoobLootSettings extension restores editor state; the original library skips unknown extension blocks by their stored character counts.

Exported strings use CRLF. Lengths count UTF-16 code units, including CRLF, as in the original .NET writer. The free-slot guard requires at least reserve + 1 slots before taking another item and retains stricter imported guards.

Standard property IDs were cross-checked against ACE's PropertyInt enum: Damage 370, Damage Resist 371, CD 374, CDR 375, Healing Boost 376, Vitality/GearMaxHealth 379, MaterialType 131, ItemWorkmanship 105, EquipmentSetId 265, and ArmorLevel 28. Clothing-class armor is included with ArmorLevel >= 1; underclothes use ArmorLevel <= 0. These classifications need confirmation on DreamWeave.

Reference: https://github.com/ACEmulator/ACE/blob/master/Source/ACE.Entity/Enum/Properties/PropertyInt.cs

Cloak references:

- Original samples: `(CL) Cloak (all)` and `(CL) Cloak (5)` use Clothing class and, for level 5, IconOverlay >= 27704.
- [ACE EquipmentSet](https://github.com/ACEmulator/ACE/blob/master/Source/ACE.Entity/Enum/EquipmentSet.cs): cloak mastery set IDs.
- [ACE cloak generation tables](https://github.com/ACEmulator/ACE/blob/master/Source/ACE.Server/Factories/Tables/CloakChance.cs): named proc spells.
- [ACE appraisal](https://github.com/ACEmulator/ACE/blob/master/Source/ACE.Server/Network/Structure/AppraiseInfo.cs): proc spells are included in the appraised spellbook, permitting native VTClassic SpellMatch requirements.
- [Decal value-key reference](https://github.com/mrvoorhe/redox-extensions/blob/master/RedoxLib/GameValues/IntValueKey.cs): EquipableSlots 218103822, IconOverlay 218103849, ArmorSetID 265, and CloakChanceType 352.

Named procs use case-insensitive spell-name patterns. Shroud of Darkness intentionally groups all defense variants. Damage-reduction procs use CloakChanceType == 2; spell procs use == 1. The server determines the actual damage-reduction amount.

## Limits

Generated profiles from the previous version were confirmed working in-game. The new rating variants have passed format and behavior tests but have not yet been independently tested inside Virindi Tank. Browser flows were checked in Chromium, including the current 363-entry profile. Arbitrary legacy rules are displayed separately rather than guessed into equipment targets. Upper buffed-damage caps are not supported by the original requirement types and block export until removed. The Windows desktop app has been cross-compiled and package-checked here; its native GUI has not been launched in this Linux environment.

No application server receives imported profile contents. Browser storage retains editor settings; BroLoot's own UTL export also includes an editor-state extension.

## Windows distribution

The downloadable portable ZIP is at `dist/downloads/BroLoot-Windows-x64.zip`. Extract the entire ZIP and run `BroLoot.exe`. Share the ZIP itself with other players; no ChatGPT account, Microsoft account, website access, license key, or activation is used by the desktop app.

The host uses Windows Forms with a local WebView2 virtual-host mapping. All editor assets ship inside the ZIP; no local HTTP server is started. Settings are stored locally under `%LOCALAPPDATA%\BroLoot`. Users may restore their browser-edition settings by opening an exported BroLoot UTL or JSON backup.

Requirements: Windows 10/11 x64, .NET Framework 4.8, and Microsoft Edge WebView2 Runtime. A missing WebView2 runtime offers the official free installer. The app runs offline after prerequisites are present. The executable is unsigned.

`desktop/build.py` builds the host and package using the .NET 8.0.408 compiler, .NET Framework 4.8 reference assemblies 1.0.3, and Microsoft.Web.WebView2 1.0.4314.35. The build SDK is not included in the distribution.

Exports use a native Save As dialog. The UI waits for the host to confirm a completed write; cancellation and I/O errors are reported separately. File writes use a temporary sibling and atomic replacement, retaining existing profiles if a save fails. Native save requests are accepted only from the bundled editor origin.

## Tests and build

Run `python tests/run.py` (Python 3 and Node.js required). The suite covers exact UTL round trips, imported-rule ordering, all six rating IDs, category separation, legacy settings migration, native-save acknowledgments, and cancellation/error handling.

To rebuild the Windows package, obtain the pinned reference packages from NuGet, extract them into a dependency directory, and run:

```text
python desktop/build.py --sdk /path/to/dotnet/sdk/8.0.408 --deps /path/to/dependencies --output /path/to/build
```

The dependency directory must contain extracted `microsoft.netframework.referenceassemblies.net48` version `1.0.3` and `microsoft.web.webview2` version `1.0.4314.35` packages. The builder emits `BroLoot-Windows-x64.zip` with the editor files and required SDK redistribution DLLs. Microsoft runtime licenses are included in the ZIP. The .NET build SDK and personal profiles/settings are excluded.

## Existing rules and new DreamWeave items (1.3)

Open your UTL, then select **All rules**. Existing rules retain their conditions and order. Enable or disable individual loot rules, selected rules, or a category. Disabled rules let later rules try the item; they do not exclude an item globally. Headings and editor metadata remain separate.

Choose **Edit** to change existing values, actions, quantities, sets, materials, spell patterns/counts, essence thresholds, Aetheria level potential, or advanced parameters. Unfamiliar conditions retain their type and parameter order. The editor flags recognizable earlier broad rules; this is not a complete overlap analysis of generated targets or arbitrary server logic. The global pack reserve still applies and preserves stricter imported requirements.

Use **+ Add DreamWeave item** or duplicate a similar rule. New items start disabled. Set an exact item name (special characters are escaped automatically), or use Advanced conditions for a name pattern, item template ID, and additional requirements. DreamWeave items use Keep all or Keep quantity and respect the DreamWeave master switch.

**Undo rule change** retains up to 30 rule-edit snapshots during the session. **Reset to imported values** preserves the original entry across settings/UTL saves. Opening or starting a profile first saves one recovery snapshot locally; **Restore previous profile** swaps it with the current profile. Save settings remains the portable backup. Numeric ranges and recognizable malformed patterns are checked before export; .NET-only regular expressions retain their original syntax and require in-game verification.
