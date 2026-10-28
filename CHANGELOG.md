# Changelog

## 1.2.0

- Added Cloaks with set, proc, minimum level-potential, and D/DR rating menus.
- Added 41 cloak set IDs and standard proc choices, including Cloaked in Skill and damage reduction.
- Added explicit conversion of supported legacy cloak rules into editable targets, preserving supported name filters and pack-space guards.
- Corrected wearable slot requirements to the Decal-native EquipableSlots key and separated cloaks from underclothes.
- Retained all original profile framing and opaque imported requirements.

## 1.1.0

- Added Damage, Damage Resist, and Healing Boost rating controls alongside CD, CDR, and Max Health / Vitality.
- Added separate Trinkets targets, identified by their equipment slot.
- Main rating controls follow the Tier 8 reference: Armor CD/CDR up to 2, Underclothes D/DR up to 3, Jewelry and Trinkets Health/Healing up to 3.
- Extra server ratings retain existing DreamWeave clothing CD/CDR settings and allow custom-server choices.
- Rating thresholds are alternative minimums; higher rolls remain eligible.
- A zero minimum cantrip count permits rating-only targets.
- Older jewelry targets migrate to both Jewelry and Trinkets to retain coverage.
- Clarified that Save settings is optional and Export UTL writes the in-game profile.

## 1.0.0

- Local Windows editor with no login, activation, or BroLoot website dependency.
- Editable equipment, spell, set, weapon, salvage, custom-item, and pack-space requirements.
- UTL import/export with preserved imported rules and native Save As dialogs.
