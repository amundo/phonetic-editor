import {CharacterMap} from '../character-map/CharacterMap.js';

// Example of a subclass with custom search functionality
class PhoneticCharacterMap extends CharacterMap {
  // Override the search function to add phonetic search capabilities
  searchCharacter(char, searchTerm) {
    // Call the parent class search method first
    const basicMatch = super.searchCharacter(char, searchTerm);
    if (basicMatch) return true;
    
    // Add custom phonetic search logic
    const term = searchTerm.toLowerCase();
    
    // Example: Match phonetic properties
    if (char.phonetic && char.phonetic.toLowerCase().includes(term)) {
      return true;
    }
    
    // Example: Match IPA categories
    if (term === 'vowel' && char.category === 'vowel') {
      return true;
    }
    
    if (term === 'consonant' && char.category === 'consonant') {
      return true;
    }
    
    // Example: Match by articulatory features
    if (char.features) {
      return char.features.some(feature => 
        feature.toLowerCase().includes(term)
      );
    }
    
    return false;
  }
}

// Register the subclass
customElements.define('phonetic-character-map', PhoneticCharacterMap);
export {
  PhoneticCharacterMap
}