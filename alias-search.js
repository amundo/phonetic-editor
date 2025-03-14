// IPAAliasSearch.js - A specialized component for searching IPA by alias/name
export class IPAAliasSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Data store
    this._aliases = null;
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
      const response = await fetch('aliases.json');
      this._aliases = await response.json();
      
      // Notify that data is loaded
      this.dispatchEvent(new CustomEvent('data-loaded'));
    } catch (error) {
      console.error('Error loading aliases data:', error);
      this.showError('Failed to load aliases data. Please check your connection.');
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
      
      .search-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        margin-bottom: 1rem;
      }
      
      .status {
        color: var(--secondary-color);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      
      .alias-results {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        padding: 0.5rem;
      }
      
      .result-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
      }
      
      .result-item:last-child {
        border-bottom: none;
      }
      
      .result-item:hover {
        background-color: var(--hover-color);
      }
      
      .result-char {
        font-size: 1.5rem;
        margin-right: 1rem;
        width: 40px;
        text-align: center;
      }
      
      .result-name {
        color: var(--secondary-color);
      }
      
      .no-results {
        text-align: center;
        color: var(--secondary-color);
        padding: 1rem;
      }
    `;
    
    const html = `
      <div class="container">
        <h3>Search IPA by Name</h3>
        
        <input type="text" class="search-input" placeholder="Type to search (e.g., 'schwa', 'velar')">
        
        <div class="status">
          <span class="result-count"></span>
        </div>
        
        <div class="alias-results">
          <div class="no-results">Start typing to search characters</div>
        </div>
      </div>
    `;
    
    this.shadowRoot.innerHTML = `<style>${style}</style>${html}`;
  }
  
  renderSearchResults(results) {
    const resultsContainer = this.shadowRoot.querySelector('.alias-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No matching characters found</div>';
      return;
    }
    
    results.forEach(([alias, char]) => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.dataset.alias = alias;
      item.dataset.char = char;
      
      const charEl = document.createElement('div');
      charEl.className = 'result-char';
      charEl.textContent = char;
      
      const nameEl = document.createElement('div');
      nameEl.className = 'result-name';
      nameEl.textContent = alias;
      
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
  searchByAlias(query) {
    if (!this._aliases || !query) return [];
    
    return this._aliases.filter(([alias, char]) => 
      alias.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Event handling
  setupEventListeners() {
    // Search input
    const searchInput = this.shadowRoot.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        
        if (query.length === 0) {
          this.renderSearchResults([]);
          return;
        }
        
        const results = this.searchByAlias(query);
        this._searchResults = results;
        this.renderSearchResults(results);
      });
    }
    
    // Click on search result
    this.shadowRoot.addEventListener('click', (event) => {
      const resultItem = event.target.closest('.result-item');
      if (resultItem && resultItem.dataset.char) {
        this.dispatchEvent(new CustomEvent('character-selected', {
          detail: { 
            character: resultItem.dataset.char,
            alias: resultItem.dataset.alias
          }
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
customElements.define('ipa-alias-search', IPAAliasSearch);
