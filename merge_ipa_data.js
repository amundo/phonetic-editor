// merge_ipa_data.js
// Run with: deno run --allow-read --allow-write merge_ipa_data.js

async function main() {
  console.log("Starting to merge IPA data and aliases...")

  try {
    // Read the input files
    const ipaText = await Deno.readTextFile("./ipa.json")
    const aliasesText = await Deno.readTextFile("./aliases.json")

    // Parse JSON
    const ipaData = JSON.parse(ipaText)
    const aliasesData = JSON.parse(aliasesText)

    // Create the new unified structure
    const unifiedData = {
      metadata: ipaData.metadata || {
        title: "International Phonetic Alphabet - Unified",
        source: "Merged from ipa.json and aliases.json",
        created: new Date().toISOString(),
      },
      features: {
        rounding: ipaData.rounding || [],
        heights: ipaData.heights || [],
        backness: ipaData.backness || [],
        places: ipaData.places || [],
        manners: ipaData.manners || [],
        voicings: ipaData.voicings || [],
      },
      phones: [],
    }

    // Create a map of aliases for quick lookup
    const aliasesMap = new Map()
    aliasesData.forEach(([alias, char]) => {
      if (!aliasesMap.has(char)) {
        aliasesMap.set(char, [])
      }
      // Remove curly braces from alias if present
      const cleanedAlias = alias.replace(/^\{|\}$/g, "")
      aliasesMap.get(char).push(cleanedAlias)
    })

    // Process vowels
    if (ipaData.phones && ipaData.phones.vowels) {
      ipaData.phones.vowels.forEach((vowel) => {
        const unifiedVowel = {
          letter: vowel.letter,
          type: "vowel",
          features: {
            height: vowel.height || null,
            backness: vowel.backness || null,
            rounding: vowel.rounding || null,
            nasal: vowel.nasal || false,
          },
          name: vowel.name || "",
          aliases: aliasesMap.get(vowel.letter) || [],
        }
        unifiedData.phones.push(unifiedVowel)
      })
    }

    // Process consonants
    if (ipaData.phones && ipaData.phones.consonants) {
      ipaData.phones.consonants.forEach((consonant) => {
        const unifiedConsonant = {
          letter: consonant.letter,
          type: "consonant",
          features: {
            place: consonant.place || null,
            manner: consonant.manner || null,
            voicing: consonant.voicing || null,
          },
          name: consonant.name || "",
          aliases: aliasesMap.get(consonant.letter) || [],
        }
        unifiedData.phones.push(unifiedConsonant)
      })
    }

    // Process combiners/diacritics
    // Find all characters in aliases that aren't already in phones
    const phonesLetters = new Set(unifiedData.phones.map((p) => p.letter))
    const combiners = []

    aliasesMap.forEach((aliases, char) => {
      if (!phonesLetters.has(char)) {
        combiners.push({
          letter: char,
          type: "combiner",
          name: aliases[0] || "", // Use the first alias as name
          aliases: aliases,
        })
      }
    })

    unifiedData.combiners = combiners

    // Write the output file
    await Deno.writeTextFile(
      "./unified_ipa.json",
      JSON.stringify(unifiedData, null, 2),
    )

    console.log("Successfully merged data into unified_ipa.json")
    console.log(`Total phones: ${unifiedData.phones.length}`)
    console.log(`Total combiners: ${unifiedData.combiners.length}`)
  } catch (error) {
    console.error("Error merging IPA data:", error)
  }
}

main()
