// IPADatabase.js
export class IpaDatabase {
  constructor() {
    this._data = null;
    this._searchIndex = null;
    this._isLoaded = false;
    this._loadPromise = null;
  }

  async load(filePath = './unified_ipa.json') {
    // Only load once, but allow multiple components to await the same loading
    if (!this._loadPromise) {
      this._loadPromise = this._doLoad(filePath);
    }
    return this._loadPromise;
  }

  async _doLoad(filePath) {
    try {
      const url = new URL(filePath, import.meta.url);
      if (!url) {
        throw new Error('Invalid file path');
      }
      const response = await fetch(url);
      this._data = await response.json();
      this._buildSearchIndex();
      this._isLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading IPA data:', error);
      throw new Error('Failed to load IPA data. Please check your connection.');
    }
  }

  _buildSearchIndex() {
    if (!this._data) return;
    
    this._searchIndex = [];
    
    // Process phones
    if (this._data.phones) {
      this._data.phones.forEach(phone => {
        // Add main entry
        this._searchIndex.push({
          letter: phone.letter,
          searchText: phone.name.toLowerCase(),
          type: phone.type,
          name: phone.name,
          features: phone.features
        });
        
        // Add entries for each alias
        if (phone.aliases && phone.aliases.length > 0) {
          phone.aliases.forEach(alias => {
            this._searchIndex.push({
              letter: phone.letter,
              searchText: alias.toLowerCase(),
              type: phone.type,
              name: alias,
              features: phone.features
            });
          });
        }
      });
    }
    
    // Process combiners/diacritics
    if (this._data.combiners) {
      this._data.combiners.forEach(combiner => {
        // Add main entry
        this._searchIndex.push({
          letter: combiner.letter,
          searchText: combiner.name.toLowerCase(),
          type: 'combiner',
          name: combiner.name
        });
        
        // Add entries for each alias
        if (combiner.aliases && combiner.aliases.length > 0) {
          combiner.aliases.forEach(alias => {
            this._searchIndex.push({
              letter: combiner.letter,
              searchText: alias.toLowerCase(),
              type: 'combiner',
              name: alias
            });
          });
        }
      });
    }
  }

  // Get the raw data
  getData() {
    return this._data;
  }

  // Get feature lists
  getFeatures() {
    if (!this._data || !this._data.features) return {};
    return this._data.features;
  }

  // Search methods
  searchByAlias(query) {
    if (!this._searchIndex || !query) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return this._searchIndex.filter(item => 
      item.searchText.includes(normalizedQuery)
    );
  }

  searchByFeatures(criteria) {
    if (!this._data) return [];
    
    const results = [];
    
    // Search through phones
    this._data.phones.forEach(phone => {
      let matches = true;
      
      // Check each criterion
      for (const [feature, value] of Object.entries(criteria)) {
        if (value && (!phone.features || phone.features[feature] !== value)) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        results.push({
          letter: pIpaDatabasehone.letter,
          name: phone.name,
          type: phone.type,
          features: phone.features
        });
      }
    });
    
    return results;
  }

  // Get specific phone by letter
  getPhoneByLetter(letter) {
    if (!this._data) return null;
    
    // Search phones
    const phone = this._data.phones.find(p => p.letter === letter);
    if (phone) return phone;
    
    // Search combiners
    const combiner = this._data.combiners.find(c => c.letter === letter);
    if (combiner) return combiner;
    
    return null;
  }

  isLoaded() {
    return this._isLoaded;
  }
}

// Create a singleton instance
const ipaDatabase = new IpaDatabase()
export default ipaDatabase