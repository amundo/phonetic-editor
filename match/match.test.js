// Legacy array syntax backward compatibility
// Testing matchAny for searching anywhere in the object
Deno.test("matchAny with primitive values", () => {
  const data = {
    name: "John",
    age: 30,
    address: {
      street: "123 Main St",
      city: "Springfield",
      zipCode: "12345"
    },
    contacts: [
      { type: "email", value: "john@example.com" },
      { type: "phone", value: "555-1234" }
    ],
    tags: ["developer", "javascript", "web"]
  };
  
  // Matching a string that exists
  assert(matchAny("Springfield", data), "Should find string value anywhere in the object");
  
  // Matching a number that exists
  assert(matchAny(30, data), "Should find number value anywhere in the object");
  
  // Matching a string that doesn't exist
  assert(!matchAny("Chicago", data), "Should not find a non-existent value");
  
  // Matching with regex
  assert(matchAny(/^Spring/, data), "Should find values matching regex pattern");
  assert(matchAny(/^\d{3}-\d{4}$/, data), "Should find phone number format");
  
  // Not matching with regex
  assert(!matchAny(/^New York/, data), "Should not find non-matching regex pattern");
});

Deno.test("matchAny with objects and arrays", () => {
  const data = {
    user: {
      details: {
        name: "Alice",
        role: "admin"
      },
      preferences: {
        theme: "dark",
        notifications: true
      }
    },
    features: ["search", "filter", "sort"],
    items: [
      { id: 1, name: "Item 1", tags: ["important", "new"] },
      { id: 2, name: "Item 2", tags: ["archived"] }
    ]
  };
  
  // Matching an array value
  assert(matchAny("search", data), "Should find a value in an array");
  
  // Matching a nested object property
  assert(matchAny("admin", data), "Should find a value in a nested object");
  
  // Matching with an object query
  assert(matchAny({ value: "dark" }, data), "Should match object-style query anywhere");
  
  // Matching array element with arrayMatch
  assert(matchAny({ value: "important", arrayMatch: "includes" }, data), 
         "Should match array includes anywhere in the object");
         
  // Type matching
  assert(matchAny({ value: Boolean }, data), 
         "Should find boolean values anywhere in the object");
         
  // More complex query
  assert(matchAny({ value: /^Item/ }, data), 
         "Should match regex against any string value");
});

Deno.test("matchAny with linguistic data", () => {
  const phonologicalData = {
    consonants: [
      { 
        symbol: "p", 
        features: { 
          place: "bilabial", 
          manner: "plosive", 
          voicing: "voiceless" 
        },
        allophones: [
          { symbol: "pʰ", context: "syllable-initial" }
        ]
      },
      { 
        symbol: "t", 
        features: { 
          place: "alveolar", 
          manner: "plosive", 
          voicing: "voiceless" 
        }
      }
    ],
    vowels: [
      {
        symbol: "i",
        features: {
          height: "high",
          backness: "front",
          roundedness: "unrounded"
        }
      }
    ]
  };
  
  // Find a specific feature anywhere
  assert(matchAny("bilabial", phonologicalData), 
         "Should find a phonological feature");
         
  // Find all plosives
  assert(matchAny("plosive", phonologicalData), 
         "Should find manner of articulation");
         
  // Find a specific sound
  assert(matchAny("pʰ", phonologicalData), 
         "Should find an allophone");
         
  // More complex query for high vowels
  assert(matchAny({ value: { height: "high" } }, phonologicalData), 
         "Should find objects matching a feature specification");
});

import { match, matchAny, getNestedValue, hasNestedValue } from "./match.js"
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.95.0/testing/asserts.ts"

// Original tests
Deno.test("identical objects", () =>
  assert(match(
    { "form": "gato" },
    { "form": "gato" },
  )))

Deno.test("identical objects as array query", () =>
  assert(match(
    [
      ["form", "gato"],
    ],
    { "form": "gato" },
  )))

// New tests for nested path matching
Deno.test("match with dot notation path", () => {
  const comparand = {
    metadata: {
      type: "uniliteral",
      usage: "common"
    }
  };
  
  assert(match(
    [["metadata.type", "uniliteral"]],
    comparand
  ));
});

Deno.test("match with array path", () => {
  const comparand = {
    metadata: {
      type: "uniliteral",
      usage: "common"
    }
  };
  
  assert(match(
    [[["metadata", "type"], "uniliteral"]],
    comparand
  ));
});

Deno.test("nested path match fails with wrong value", () => {
  const comparand = {
    metadata: {
      type: "uniliteral",
      usage: "common"
    }
  };
  
  assert(!match(
    [["metadata.type", "biliteral"]],
    comparand
  ));
});

// Tests for array matching
Deno.test("array matching with 'some' strategy", () => {
  const comparand = {
    tags: ["noun", "animate", "singular"]
  };
  
  // Test with string value
  assert(match(
    [["tags", "animate", { arrayMatch: "some" }]],
    comparand
  ), "Failed to match string value using 'some' strategy");
  
  // Test with object value
  assert(match(
    [["tags", { path: "value", value: "animate" }, { arrayMatch: "some" }]],
    { tags: [{ value: "animate" }, { value: "noun" }] }
  ), "Failed to match object value using 'some' strategy");
});

Deno.test("array matching with 'every' strategy", () => {
  const comparand = {
    tags: ["noun", "animate", "singular"]
  };
  
  assert(!match(
    [["tags", "animate", { arrayMatch: "every" }]],
    comparand
  ));
  
});

Deno.test("array matching with 'includes' strategy", () => {
  const comparand = {
    tags: ["noun", "animate", "singular"]
  };
  
  assert(match(
    [["tags", "animate", { arrayMatch: "includes" }]],
    comparand
  ));
  
  assert(!match(
    [["tags", "inanimate", { arrayMatch: "includes" }]],
    comparand
  ));
});

// Complex nested object matching
Deno.test("complex nested object with multiple paths", () => {
  const comparand = {
    hieroglyph: "𓄿",
    metadata: {
      type: "uniliteral",
      properties: {
        sound: "a",
        period: "middle kingdom"
      }
    },
    tags: ["egyptian", "ancient"]
  };
  
  assert(match(
    [
      ["metadata.type", "uniliteral"],
      ["metadata.properties.sound", "a"],
      ["tags", "egyptian", { arrayMatch: "includes" }]
    ],
    comparand
  ));
});

// Regex with nested paths
Deno.test("regex with nested path", () => {
  const comparand = {
    metadata: {
      type: "uniliteral",
      properties: {
        sound: "aspirated-p"
      }
    }
  };
  
  assert(match(
    [["metadata.properties.sound", /^aspirated/]],
    comparand
  ));
});

// Multiple queries on same nested path
Deno.test("multiple queries on same nested path", () => {
  const comparand = {
    metadata: {
      type: "uniliteral",
      properties: {
        sound: "aspirated-p"
      }
    }
  };
  
  assert(match(
    [
      ["metadata.properties.sound", /^aspirated/],
      ["metadata.properties.sound", /p$/]
    ],
    comparand
  ));
});

// Test getNestedValue helper
Deno.test("getNestedValue with dot notation", () => {
  const obj = {
    a: {
      b: {
        c: "value"
      }
    }
  };
  
  assertEquals(getNestedValue("a.b.c", obj), "value");
});

// Tests for new object-based query format
Deno.test("object-based query format - simple", () => {
  const comparand = {
    form: "gato",
    gloss: "cat"
  };
  
  assert(match(
    {
      path: "form",
      value: "gato"
    },
    comparand
  ));
});

Deno.test("object-based query format - multiple queries", () => {
  const comparand = {
    form: "gato",
    gloss: "cat",
    pos: "noun"
  };
  
  assert(match(
    [
      { path: "form", value: "gato" },
      { path: "pos", value: "noun" }
    ],
    comparand
  ));
});

Deno.test("object-based query format - nested path", () => {
  const comparand = {
    metadata: {
      type: "uniliteral",
      usage: "common"
    }
  };
  
  assert(match(
    { path: "metadata.type", value: "uniliteral" },
    comparand
  ));
});

Deno.test("object-based query format - regex", () => {
  const comparand = {
    form: "gato"
  };
  
  assert(match(
    { path: "form", value: /^g/ },
    comparand
  ));
});

Deno.test("object-based query format - array matching", () => {
  const comparand = {
    tags: ["noun", "animate", "singular"]
  };
  
  assert(match(
    { path: "tags", value: "animate", arrayMatch: "includes" },
    comparand
  ));
});

Deno.test("converting simple object to queries", () => {
  const comparand = {
    form: "gato",
    gloss: "cat"
  };
  
  // Simple object gets converted to array of queries
  assert(match(
    { form: "gato" },
    comparand
  ));
});

// Testing constructor matching with primitives
Deno.test("constructor matching with primitives", () => {
  assert(match(
    { path: "value", value: String },
    { value: "test" }
  ), "String should match string type");
  
  assert(match(
    { path: "value", value: Number },
    { value: 42 }
  ), "Number should match number type");
  
  assert(match(
    { path: "value", value: Boolean },
    { value: true }
  ), "Boolean should match boolean type");
  
  assert(!match(
    { path: "value", value: String },
    { value: 42 }
  ), "String should not match number type");
});

// Testing constructor matching with arrays
Deno.test("constructor matching with arrays", () => {
  // Debug data
  const data = { 
    numbers: [1, 2, 3, 4],
    mixed: ["a", "b", 3, "d"] 
  };
  
  // Test 1: Every number is a Number
  const test1 = match(
    { path: "numbers", value: Number, arrayMatch: "every" },
    data
  );
  assert(test1, "Every item in the array should be Number");
  
  // Test 2: Not every item in mixed is a String
  const test2 = match(
    { path: "mixed", value: String, arrayMatch: "every" },
    data
  );
  assert(!test2, "Not every item in the array is String");
  
  // Test 3: Some items in mixed are Strings
  const test3 = match(
    { path: "mixed", value: String, arrayMatch: "some" },
    data
  );
  assert(test3, "Some items in the array are String");
});

Deno.test("getNestedValue with array path", () => {
  const obj = {
    a: {
      b: {
        c: "value"
      }
    }
  };
  
  assertEquals(getNestedValue(["a", "b", "c"], obj), "value");
});

Deno.test("getNestedValue with nonexistent path", () => {
  const obj = {
    a: {
      b: {
        c: "value"
      }
    }
  };
  
  assertEquals(getNestedValue("a.b.d", obj), undefined);
});