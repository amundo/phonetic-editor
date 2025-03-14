// IPAFeatureSearch.js - A specialized component for searching IPA by phonetic features
export class IPAFeatureSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Data store
    this._ipaData = null;
    this._searchResults = [];
    
    // Initialize
    this.render();
    this.loadData();
    this.setupEventListeners();
  }
  
  connectedCallback() {
    // Component is now in the DOM
  }
  
  // Data loading
  async loadData() {
    try {
      const response = await fetch('ipa.json');
      this._ipaData = await response.json();
      this.updateFeatureFilters();
      
      // Notify that data is loaded
      this.dispatchEvent(new CustomEvent('data-loaded'));
    } catch (error) {
      console.error('Error loading IPA data:', error);
      this.showError('Failed to load IPA data. Please check your connection.');
    }
  }
  
  // UI Rendering
  render() {
    const style = `
      :host {
        display: block;
        font-family: 'Gentium Plus', sans-serif;
        --primary-color: #4a5568;
        --secondary-color: #2d3748;
        --accent-color: #3182ce;
        --background-color: #ffffff;
        --border-color: #e2e8f0;
        --hover-color: #edf2f7;
      }
      
      .container {
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        padding: 1rem;
        background-color: var(--background-color);
      }
      
      h3 {
        margin-top: 0;
        color: var(--secondary-color);
      }
      
      .feature-filters {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .feature-select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
      }
      
      .button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        background-color: var(--accent-color);
        color: white;
        cursor: pointer;
        margin-bottom: 1rem;
      }
      
      .button:hover {
        opacity: 0.9;
      }
      
      .search-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 0.5rem;
        margin-top: 1rem;
        max-height: 300px;
        overflow-y: auto;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
      }
      
      .result-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        cursor: pointer;
      }
      
      .result-item:hover {
        background-color: var(--hover-color);
      }
      
      .result-char {
        font-size: 1.5rem;
        margin-bottom: 0.25rem;
      }
      
      .result-name {
        font-size: 0.75rem;
        text-align: center;
        color: var(--secondary-color);
      }
      
      .no-results {
        text-align: center;
        color: var(--secondary-color);
        padding: 1rem;
      }
      
      .status {
        color: var(--secondary-color);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
    `;
    
    const html = `
      <div class="container">
        <h3>Search IPA by Features</h3>
        
        <div class="feature-filters">
          <!-- Feature filters will be rendered here -->
        </div>
        
        <button class="button search-button">Search</button>
        
        <div class="status">
          <span class="result-count"></span>
        </div>
        
        <div class="search-results">
          <div class="no-results">Select features and click "Search" to find characters</div>
        </div>
      </div>
    `;
    
    this.shadowRoot.innerHTML = `<style>${style}</style>${html}`;
  }
  
  updateFeatureFilters() {
    if (!this._ipaData) return;
    
    const featureFilters = this.shadowRoot.querySelector('.feature-filters');
    if (!featureFilters) return;
    
    // Clear existing filters
    featureFilters.innerHTML = '';
    
    // Create select elements for each feature type
    const featureTypes = [
      { name: 'height', options: this._ipaData.heights, label: 'Vowel Height' },
      { name: 'backness', options: this._ipaData.backness, label: 'Vowel Backness' },
      { name: 'rounding', options: this._ipaData.rounding, label: 'Vowel Rounding' },
      { name: 'place', options: this._ipaData.places, label: 'Place of Articulation' },
      { name: 'manner', options: this._ipaData.manners, label: 'Manner of Articulation' },
      { name: 'voicing', options: this._ipaData.voicings, label: 'Voicing' }
    ];
    
    featureTypes.forEach(featureType => {
      const container = document.createElement('div');
      
      const select = document.createElement('select');
      select.className = 'feature-select';
      select.dataset.feature = featureType.name;
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = featureType.label;
      select.appendChild(defaultOption);
      
      featureType.options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        select.appendChild(optionEl);
      });
      
      container.appendChild(select);
      featureFilters.appendChild(container);
    });
  }
  
  renderSearchResults(results) {
    const resultsContainer = this.shadowRoot.querySelector('.search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No matching characters found</div>';
      return;
    }
    
    results.forEach(result => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.dataset.char = result.letter;
      
      const charEl = document.createElement('div');
      charEl.className = 'result-char';
      charEl.textContent = result.letter;
      
      const nameEl = document.createElement('div');
      nameEl.className = 'result-name';
      nameEl.textContent = result.name || '';
      
      item.appendChild(charEl);
      item.appendChild(nameEl);
      resultsContainer.appendChild(item);
    });
    
    // Update result count
    const resultCount = this.shadowRoot.querySelector('.result-count');
    if (resultCount) {
      resultCount.textContent = `Found ${results.length} character${results.length !== 1 ? 's' : ''}`;
    }
  }
  
  // Search functionality
  searchByFeatures(criteria) {
    if (!this._ipaData) return [];
    
    const results = [];
    const types = ['vowels', 'consonants'];
    
    types.forEach(type => {
      const phones = this._ipaData.phones[type] || [];
      
      phones.forEach(phone => {
        let matches = true;
        
        // Check each criterion
        for (const [feature, value] of Object.entries(criteria)) {
          if (value && phone[feature] !== value) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          results.push(phone);
        }
      });
    });
    
    return results;
  }
  
  // Event handling
  setupEventListeners() {
    // Search button
    const searchButton = this.shadowRoot.querySelector('.search-button');
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        const criteria = {};
        
        this.shadowRoot.querySelectorAll('.feature-select').forEach(select => {
          if (select.value) {
            criteria[select.dataset.feature] = select.value;
          }
        });
        
        const results = this.searchByFeatures(criteria);
        this._searchResults = results;
        this.renderSearchResults(results);
      });
    }
    
    // Click on search result
    this.shadowRoot.addEventListener('click', (event) => {
      const resultItem = event.target.closest('.result-item');
      if (resultItem && resultItem.dataset.char) {
        this.dispatchEvent(new CustomEvent('character-selected', {
          detail: { character: resultItem.dataset.char }
        }));
      }
    });
  }
  
  // Utility methods
  showError(message) {
    console.error(message);
    // In a real implementation, you might want to show a toast or other UI element
  }
}

// Define the custom element
customElements.define('ipa-feature-search', IPAFeatureSearch);
