---
title: Phonetic Transcription Editor
author: Patrick Hall
---

A specialized web-based tool for linguistic fieldwork and phonetic data
transcription, built with Web Components and vanilla JavaScript.

## Overview

This project provides a comprehensive editor for working with phonetic
transcriptions, particularly useful for linguists, language documenters, and
researchers working with the International Phonetic Alphabet (IPA).

The editor offers:

- An enhanced text input with dynamic substitution rules
- IPA character search by phonetic features (place of articulation, manner,
  etc.)
- IPA character search by name/alias
- Recent characters panel for quick access to commonly used symbols
- Import/export functionality for text and substitution rules
- Predefined rule sets for common transcription needs

## Files

- `PhoneticEditor.js` - The core editor component
- `IPAFeatureSearch.js` - Component for searching IPA by phonetic features
- `IPAAliasSearch.js` - Component for searching IPA by name/alias
- `index.js` - Integration logic that connects the components
- `full-example.html` - Complete working example
- `ipa.json` - IPA data with phonetic features
- `aliases.json` - Character aliases and substitution pairs

## Getting Started

1. Clone or download this repository
2. Open `full-example.html` in a web browser
3. Start typing or use the search tools to insert phonetic characters

No build steps or dependencies are required - the application uses native Web
Components.

## Usage

### Text Substitution

Type patterns like `{sh}` and they'll be automatically converted to `ʃ`. You can
define your own substitution rules in the editor.

### Character Search

- **By Feature**: Find characters by selecting phonetic features (e.g., place of
  articulation, manner)
- **By Name**: Find characters by typing their name or description (e.g.,
  "schwa", "velar nasal")

### Predefined Rulesets

Load common substitution patterns for:

- Basic IPA symbols
- Tone marks
- Diacritics

### Saving Your Work

- **Export Text**: Save your transcription to a text file
- **Export Rules**: Save your substitution rules to a JSON file for future use
- **Import**: Load previously saved text or rules

The editor automatically saves your work locally in your browser.

## Customization

### Adding Custom Rule Sets

Create your own rule sets by defining arrays of pattern/replacement pairs:

```javascript
const myRules = [
  ["pattern1", "replacement1"],
  ["pattern2", "replacement2"],
  // ...
]

const editor = document.querySelector("phonetic-editor")
editor.substitutionRules = myRules
```

### Extending the Search Data

The search functionality depends on the `ipa.json` and `aliases.json` files. You
can extend these files with additional characters or aliases.

## Advanced Usage

### Using Individual Components

Each component can be used independently:

```html
<!-- Core editor only -->
<phonetic-editor></phonetic-editor>

<!-- Feature search only -->
<ipa-feature-search></ipa-feature-search>

<!-- Alias search only -->
<ipa-alias-search></ipa-alias-search>
```

### Event Handling

```javascript
// Listen for character selection events
const featureSearch = document.querySelector("ipa-feature-search")
featureSearch.addEventListener("character-selected", (event) => {
  console.log("Selected character:", event.detail.character)
})

// Listen for editor input changes
const editor = document.querySelector("phonetic-editor")
editor.addEventListener("input", (event) => {
  console.log("Editor content:", event.detail.value)
})
```

## Browser Compatibility

This application uses modern Web Component APIs and should work in all major
modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

[MIT License]

## Acknowledgments

- Built for linguistic fieldwork and phonetic transcription
- Uses the International Phonetic Alphabet (IPA)
- Designed for use with the Gentium Plus font for optimal display of phonetic
  characters
