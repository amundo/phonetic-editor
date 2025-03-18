// rule-editor.js
import ipaDatabase  from '../ipa-database/ipaDatabase.js'; // Importing your existing database

class RuleEditor extends HTMLElement {
  // Private fields
  #rules = [];
  #searchOpen = false;
  #ipaDatabase = null;

  constructor() {
    super();
    
    // Initialize the IPA database
    this.#ipaDatabase = ipaDatabase
    
    // Render initial structure
    this.innerHTML = this.#generateHTML();
    
    // Apply styles
    this.#applyStyles();
    
    // Set up event listeners once the database is ready
    this.#ipaDatabase.initialize().then(() => {
      this.#setupEventListeners();
      // Load any saved rules
      this.#loadRules();
    });
  }
  
  // Connected callback - when component is added to the DOM
  connectedCallback() {
    // Anything that might need to happen when connected
  }
  
  // Generate the component's HTML structure
  #generateHTML() {
    return `
      <div class="rule-editor">
        <div class="rule-actions">
          <button class="button load-rules">Load Rules</button>
          <button class="button export-rules">Export Rules</button>
        </div>
        
        <div class="rule-form">
          <input type="text" class="rule-input from-input" placeholder="From (e.g., {sh})">
          <span class="rule-arrow">→</span>
          <input type="text" class="rule-input to-input" placeholder="To (e.g., ʃ)">
          <button class="button add-rule">Add Rule</button>
          <button class="search-toggle">🔍</button>
        </div>
        
        <div class="search-panel">
          <input type="text" class="search-input" placeholder="Search for characters...">
          <div class="search-results">
            <!-- Search results will appear here -->
          </div>
        </div>
        
        <table class="rules-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="rules-body">
            <!-- Rules will be rendered here -->
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Apply CSS styles
  #applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .rule-editor {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #333;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        padding: 1rem;
        background-color: #ffffff;
      }
      
      .rule-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .button {
        padding: 0.5rem 1rem;
        background-color: #3182ce;
        color: white;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
      }
      
      .button:hover {
        opacity: 0.9;
      }
      
      .rule-form {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        align-items: center;
      }
      
      .rule-input {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        flex-grow: 1;
      }
      
      .rule-arrow {
        font-size: 1.5rem;
      }
      
      .search-toggle {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.5rem;
        color: #3182ce;
      }
      
      .search-panel {
        display: none;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      
      .search-panel.open {
        display: block;
      }
      
      .search-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        margin-bottom: 0.5rem;
      }
      
      .search-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        gap: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
        padding: 0.5rem;
      }
      
      .char-button {
        font-family: 'Gentium Plus', serif;
        font-size: 1.25rem;
        height: 40px;
        border: 1px solid #e2e8f0;
        background-color: #f7fafc;
        border-radius: 0.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .char-button:hover {
        background-color: #e2e8f0;
      }
      
      .rules-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .rules-table th, .rules-table td {
        padding: 0.5rem;
        text-align: left;
        border: 1px solid #e2e8f0;
      }
      
      .rules-table th {
        background-color: #f7fafc;
      }
      
      .delete-rule {
        background: none;
        border: none;
        cursor: pointer;
        color: #e53e3e;
        font-weight: bold;
      }
      
      .char-name {
        font-size: 0.75rem;
        color: #718096;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `;
    
    this.prepend(style);
  }
  
  // Set up event listeners for all interactive elements
  #setupEventListeners() {
    // Search toggle
    const searchToggle = this.querySelector('.search-toggle');
    const searchPanel = this.querySelector('.search-panel');
    
    searchToggle.addEventListener('click', () => {
      this.#searchOpen = !this.#searchOpen;
      searchPanel.classList.toggle('open', this.#searchOpen);
      
      // If opening the search, focus the search input
      if (this.#searchOpen) {
        this.querySelector('.search-input').focus();
      }
    });
    
    // Add rule button
    const addRuleButton = this.querySelector('.add-rule');
    const fromInput = this.querySelector('.from-input');
    const toInput = this.querySelector('.to-input');
    
    addRuleButton.addEventListener('click', () => {
      const from = fromInput.value.trim();
      const to = toInput.value.trim();
      
      if (from && to) {
        this.#addRule(from, to);
        fromInput.value = '';
        toInput.value = '';
        fromInput.focus();
      }
    });
    
    // Allow pressing Enter in the to-input field to add a rule
    toInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const from = fromInput.value.trim();
        const to = toInput.value.trim();
        
        if (from && to) {
          this.#addRule(from, to);
          fromInput.value = '';
          toInput.value = '';
          fromInput.focus();
        }
      }
    });
    
    // Load and export rule buttons
    const loadRulesButton = this.querySelector('.load-rules');
    const exportRulesButton = this.querySelector('.export-rules');
    
    loadRulesButton.addEventListener('click', () => {
      this.#importRules();
    });
    
    exportRulesButton.addEventListener('click', () => {
      this.#exportRules();
    });
    
    // Search input
    const searchInput = this.querySelector('.search-input');
    searchInput.addEventListener('input', () => {
      this.#performSearch(searchInput.value);
    });
    
    // Delete rules (using event delegation)
    const rulesBody = this.querySelector('.rules-body');
    rulesBody.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-rule')) {
        const index = parseInt(event.target.dataset.index);
        if (!isNaN(index)) {
          this.#removeRule(index);
        }
      }
    });
  }
  
  // Add a rule to the list
  #addRule(from, to) {
    this.#rules.push([from, to]);
    this.#sortRules();
    this.#renderRules();
    this.#saveRules();
    
    // Dispatch an event to notify parent components
    this.dispatchEvent(new CustomEvent('rules-changed', {
      detail: { rules: this.#rules },
      bubbles: true
    }));
  }
  
  // Remove a rule by index
  #removeRule(index) {
    this.#rules.splice(index, 1);
    this.#renderRules();
    this.#saveRules();
    
    // Dispatch an event to notify parent components
    this.dispatchEvent(new CustomEvent('rules-changed', {
      detail: { rules: this.#rules },
      bubbles: true
    }));
  }
  
  // Sort rules by pattern length (longest first to avoid overlap issues)
  #sortRules() {
    this.#rules.sort((a, b) => b[0].length - a[0].length);
  }
  
  // Render the current rules to the table
  #renderRules() {
    const rulesBody = this.querySelector('.rules-body');
    rulesBody.innerHTML = '';
    
    this.#rules.forEach(([from, to], index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${from}</td>
        <td>${to}</td>
        <td>
          <button class="delete-rule" data-index="${index}" title="Delete rule">×</button>
        </td>
      `;
      rulesBody.appendChild(row);
    });
  }
  
  // Save rules to localStorage
  #saveRules() {
    localStorage.setItem('phoneticSubstitutionRules', JSON.stringify(this.#rules));
  }
  
  // Load rules from localStorage
  #loadRules() {
    const savedRules = localStorage.getItem('phoneticSubstitutionRules');
    if (savedRules) {
      try {
        this.#rules = JSON.parse(savedRules);
        this.#renderRules();
      } catch (error) {
        console.error('Error loading saved rules:', error);
      }
    }
  }
  
  // Import rules from a JSON file
  #importRules() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rules = JSON.parse(e.target.result);
          if (Array.isArray(rules)) {
            this.#rules = rules;
            this.#sortRules();
            this.#renderRules();
            this.#saveRules();
            
            // Notify of rules change
            this.dispatchEvent(new CustomEvent('rules-changed', {
              detail: { rules: this.#rules },
              bubbles: true
            }));
          }
        } catch (error) {
          console.error('Error parsing rules file:', error);
          alert('Invalid rules file format.');
        }
      };
      reader.readAsText(file);
    });
    
    input.click();
  }
  
  // Export rules to a JSON file
  #exportRules() {
    const dataStr = JSON.stringify(this.#rules, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'phonetic-rules.json');
    link.click();
  }
  
  // Perform a search using the IPA database
  #performSearch(query) {
    if (!query.trim()) {
      this.querySelector('.search-results').innerHTML = '<p>Type to search for characters...</p>';
      return;
    }
    
    // Use the existing IPA database search methods
    let results = [];
    
    // Try to match by alias (if the database has that method)
    if (this.#ipaDatabase.searchByAlias) {
      results = this.#ipaDatabase.searchByAlias(query);
    }
    
    // If no results from alias, try other search methods depending on the structure
    if (results.length === 0 && this.#ipaDatabase.searchByName) {
      results = this.#ipaDatabase.searchByName(query);
    }
    
    // Combine other search methods as needed
    this.#renderSearchResults(results);
  }
  
  // Render search results
  #renderSearchResults(results) {
    const resultsContainer = this.querySelector('.search-results');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p>No matching characters found.</p>';
      return;
    }
    
    results.forEach(result => {
      // Adapt to the result structure from your database
      const char = result.letter || result.char || result[1];
      const name = result.name || '';
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'char-container';
      
      const button = document.createElement('button');
      button.className = 'char-button';
      button.textContent = char;
      button.title = name;
      
      button.addEventListener('click', () => {
        // Insert into the "to" input field
        this.querySelector('.to-input').value = char;
      });
      
      buttonContainer.appendChild(button);
      
      // Add a small name label if available
      if (name) {
        const nameElement = document.createElement('div');
        nameElement.className = 'char-name';
        nameElement.textContent = name.split(' ')[0]; // Just show first word to save space
        buttonContainer.appendChild(nameElement);
      }
      
      resultsContainer.appendChild(buttonContainer);
    });
  }
  
  // Public getter/setter for rules
  get rules() {
    return [...this.#rules]; // Return copy to prevent direct mutation
  }
  
  set rules(newRules) {
    if (Array.isArray(newRules)) {
      this.#rules = newRules;
      this.#sortRules();
      this.#renderRules();
      this.#saveRules();
    }
  }
}

// Define the custom element
customElements.define('rule-editor', RuleEditor);

export {
  RuleEditor
}