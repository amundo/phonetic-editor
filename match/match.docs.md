---
title: Advanced Object Matching in JavaScript
author: Patrick Hall
description: Discover how to perform advanced pattern matching on JavaScript objects using the `match` library. Ideal for complex data structures in linguistics, knowledge bases, and document databases.
---

This tutorial introduces a powerful pattern matching library for JavaScript objects, ideal for complex data structures in linguistics, knowledge bases, and document databases.

## Introduction

The `match` library provides flexible pattern matching capabilities for JavaScript objects, allowing you to:

- Match objects by exact property values
- Search within nested object structures using dot notation
- Match arrays using different strategies (some, every, includes)
- Use regular expressions for string pattern matching
- Check value types with constructor matching
- Find values anywhere in an object structure with `matchAny`

## Installation

The library has no dependencies.

## Basic Matching

The simplest way to match is by providing key-value pairs:

```javascript
import { match } from './match.js'

// Simple object matching
match(
  { form: "gato" },
  { form: "gato", gloss: "cat" }
); // true

// Matching fails if values don't match
match(
  { form: "gato" },
  { form: "perro" }
); // false
```

## Labeled Query Format

For more complex queries, use the labeled object format:

```javascript
// Single query
match(
  { path: "form", value: "gato" },
  { form: "gato", gloss: "cat" }
); // true

// Multiple queries (all must match)
match(
  [
    { path: "form", value: "gato" },
    { path: "pos", value: "noun" }
  ],
  { form: "gato", pos: "noun", gloss: "cat" }
); // true
```

## Nested Path Matching

Access nested properties using dot notation:

```javascript
const data = {
  metadata: {
    type: "uniliteral",
    properties: {
      sound: "a"
    }
  }
};

// Match a nested property using dot notation
match(
  { path: "metadata.type", value: "uniliteral" },
  data
); // true

// Match deeply nested property
match(
  { path: "metadata.properties.sound", value: "a" },
  data
); // true
```

You can also use an array of keys as a path to match nested properties. The following query is equivalent to the preceding one:

```javascript
match(
  { path: ["metadata", "properties", "sound"], value: "a" },
  data
); // true
```

## Regular Expression Matching

Use regular expressions to match string patterns:

```javascript
// Match string pattern with regex
match(
  { path: "form", value: /^g/ },
  { form: "gato" }
); // true (starts with 'g')

// Match nested property with regex
match(
  { path: "metadata.properties.sound", value: /^[aeiou]$/ },
  { metadata: { properties: { sound: "a" } } }
); // true (is a vowel)
```

## Array Matching Strategies

Match arrays with different strategies:

### Includes Strategy

Check if an array includes a specific value:

```javascript
// Check if array includes a value
match(
  { path: "tags", value: "noun", arrayMatch: "includes" },
  { tags: ["noun", "singular", "animate"] }
); // true
```

### `some` Array Strategy

Check if at least one element matches a condition:

```javascript
// Check if any array element matches a condition
match(
  { 
    path: "features", 
    value: { place: "bilabial" }, 
    arrayMatch: "some" 
  },
  { 
    features: [
      { place: "alveolar", voicing: "voiced" },
      { place: "bilabial", voicing: "voiceless" }
    ]
  }
); // true (at least one feature is bilabial)
```

### `every` Array Strategy

Check if all elements match a condition:

```javascript
// Check if all elements match a condition
match(
  { path: "numbers", value: Number, arrayMatch: "every" },
  { numbers: [1, 2, 3, 4] }
); // true (all are numbers)

// This will fail as not all elements match
match(
  { path: "mixed", value: String, arrayMatch: "every" },
  { mixed: ["a", "b", 3, "d"] }
); // false (one element is a number)
```

## Type Checking

Check the type of values using JavaScript constructors:

```javascript
// Check if a value is a string
match(
  { path: "name", value: String },
  { name: "John" }
); // true

// Check if all array elements are numbers
match(
  { path: "ages", value: Number, arrayMatch: "every" },
  { ages: [25, 30, 35] }
); // true
```

## Multiple Conditions

Combine multiple conditions that must all match:

```javascript
// All conditions must match
match(
  [
    { path: "metadata.type", value: "uniliteral" },
    { path: "tags", value: "egyptian", arrayMatch: "includes" },
    { path: "symbol", value: /^[𓀀-𓐯]/ }
  ],
  {
    metadata: { type: "uniliteral" },
    tags: ["egyptian", "ancient"],
    symbol: "𓄿"
  }
); // true
```

## Array Element Queries

Match specific arrays using the `queryType: "conditions"` parameter:

```javascript
// Match if array contains exact elements
match(
  { 
    path: "tags", 
    value: ["noun", "animate", "singular"], 
    arrayMatch: "every", 
    queryType: "conditions" 
  },
  { tags: ["noun", "animate", "singular"] }
); // true
```

## Finding Values Anywhere: matchAny

Sometimes you need to find values without knowing their exact path. The `matchAny` function searches anywhere in an object:

```javascript
import { matchAny } from 'object-matcher';

const phonologicalData = {
  consonants: [
    { 
      symbol: "p", 
      features: { 
        place: "bilabial", 
        manner: "plosive", 
        voicing: "voiceless" 
      }
    },
    // ...more consonants
  ],
  vowels: [
    {
      symbol: "i",
      features: {
        height: "high",
        backness: "front"
      }
    }
    // ...more vowels
  ]
};

// Find a value anywhere in the object
matchAny("bilabial", phonologicalData); // true

// Find a pattern anywhere
matchAny(/^p/, phonologicalData); // true (matches "p" symbol)

// Find an object pattern anywhere
matchAny(
  { value: { place: "bilabial", voicing: "voiceless" } },
  phonologicalData
); // true
```

## Advanced Features

### Getting Nested Values

Extract values from nested paths:

```javascript
import { getNestedValue } from 'object-matcher';

const data = {
  user: {
    profile: {
      name: "John",
      age: 30
    }
  }
};

const name = getNestedValue("user.profile.name", data);
console.log(name); // "John"
```

### Checking for Nested Path Existence

Check if a nested path exists:

```javascript
import { hasNestedValue } from 'object-matcher';

const data = {
  user: {
    profile: {
      name: "John"
    }
  }
};

hasNestedValue("user.profile.name", data); // true
hasNestedValue("user.profile.email", data); // false
```

## Real-World Examples

### Linguistic Data Matching

Match specific phonological features:

```javascript
// Find voiceless bilabial plosives
match(
  {
    path: "features",
    value: {
      place: "bilabial",
      manner: "plosive",
      voicing: "voiceless"
    }
  },
  {
    symbol: "p",
    features: {
      place: "bilabial",
      manner: "plosive",
      voicing: "voiceless"
    }
  }
); // true
```

### Document Database Queries

Search for documents with specific criteria:

```javascript
const documents = [
  {
    id: "doc1",
    metadata: {
      type: "article",
      tags: ["javascript", "tutorial"]
    },
    content: {
      title: "JavaScript Patterns",
      author: "John Doe"
    }
  },
  // ...more documents
];

// Find documents by criteria
const jsArticles = documents.filter(doc => 
  match(
    [
      { path: "metadata.type", value: "article" },
      { path: "metadata.tags", value: "javascript", arrayMatch: "includes" }
    ],
    doc
  )
);
```

### Find Feature Anywhere

Search for specific features anywhere in a phonological database:

```javascript
// Find all entries with bilabial features anywhere
const bilabialsounds = allSounds.filter(sound => 
  matchAny("bilabial", sound)
);
```

## Performance Considerations

- For large datasets, specify exact paths rather than using `matchAny` when possible
- Consider indexing frequently searched fields in your application logic
- Use array matching strategies carefully on large arrays

## Conclusion

The `match` and `matchAny` functions provide powerful pattern matching for JavaScript objects. They're especially useful for:

- Linguistics data processing
- Knowledge base queries
- Document database filtering
- Complex data structure navigation

With its flexible query syntax and powerful matching strategies, this library makes working with complex nested data structures much more manageable.≈