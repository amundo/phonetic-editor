class CharacterMap extends HTMLElement {
  constructor() {
    super();
    this.#characters = [];
    this.#searchTerm = '';
    this.#setupElements();
    this.#bindEvents();
  }

  // Private properties
  #characters;
  #searchTerm;
  #container;
  #searchBar;
  #resultsContainer;

  // Lifecycle callbacks
  connectedCallback() {
    this.render();
  }

  // Public methods for data access
  setData(characters) {
    this.#characters = characters;
    this.render();
    return this;
  }

  getData() {
    return this.#characters;
  }

  // Private methods
  #setupElements() {
    // Main container
    this.#container = document.createElement('div');
    this.#container.className = 'character-map-container';
    
    // Search bar
    this.#searchBar = document.createElement('input');
    this.#searchBar.type = 'text';
    this.#searchBar.placeholder = 'Search characters...';
    this.#searchBar.className = 'character-map-search';
    
    // Results container
    this.#resultsContainer = document.createElement('div');
    this.#resultsContainer.className = 'character-map-results';
    
    // Append elements to component
    this.#container.appendChild(this.#searchBar);
    this.#container.appendChild(this.#resultsContainer);
    this.appendChild(this.#container);
  }

  #bindEvents() {
    this.#searchBar.addEventListener('input', (e) => {
      this.#searchTerm = e.target.value.toLowerCase();
      this.render();
    });
  }

  #getFilteredCharacters() {
    if (!this.#searchTerm) {
      return this.#characters;
    }
    
    return this.#characters.filter(char => this.searchCharacter(char, this.#searchTerm));
  }

  // Extracted search function that can be overridden by subclasses
  searchCharacter(char, searchTerm) {
    const term = searchTerm.toLowerCase();
    const name = char.name ? char.name.toLowerCase() : '';
    const value = char.value ? char.value.toLowerCase() : '';
    const description = char.description ? char.description.toLowerCase() : '';
    
    return name.includes(term) || 
           value.includes(term) || 
           description.includes(term);
  }

  render() {
    // Clear previous results
    this.#resultsContainer.innerHTML = '';
    
    const filteredChars = this.#getFilteredCharacters();
    
    if (filteredChars.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'character-map-no-results';
      noResults.textContent = this.#characters.length > 0 
        ? 'No characters match your search' 
        : 'No character data available';
      this.#resultsContainer.appendChild(noResults);
      return;
    }
    
    // Create character grid
    const grid = document.createElement('div');
    grid.className = 'character-map-grid';
    
    filteredChars.forEach(char => {
      const charElement = document.createElement('div');
      charElement.className = 'character-map-item';
      
      const charValue = document.createElement('div');
      charValue.className = 'character-map-value';
      charValue.textContent = char.value || '';
      
      const charInfo = document.createElement('div');
      charInfo.className = 'character-map-info';
      
      if (char.name) {
        const charName = document.createElement('div');
        charName.className = 'character-map-name';
        charName.textContent = char.name;
        charInfo.appendChild(charName);
      }
      
      if (char.description) {
        const charDesc = document.createElement('div');
        charDesc.className = 'character-map-description';
        charDesc.textContent = char.description;
        charInfo.appendChild(charDesc);
      }
      
      // Add click handler to copy character
      charElement.addEventListener('click', () => {
        if (char.value) {
          navigator.clipboard.writeText(char.value)
            .then(() => {
              // Show copied notification
              charElement.classList.add('copied');
              setTimeout(() => {
                charElement.classList.remove('copied');
              }, 1000);
            })
            .catch(err => {
              console.error('Could not copy text: ', err);
            });
        }
      });
      
      charElement.appendChild(charValue);
      charElement.appendChild(charInfo);
      grid.appendChild(charElement);
    });
    
    this.#resultsContainer.appendChild(grid);
    
    // Add some default CSS if not already styled
    if (!document.querySelector('#character-map-styles')) {
      const style = document.createElement('style');
      style.id = 'character-map-styles';
      style.textContent = `
        .character-map-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          max-width: 100%;
        }
        .character-map-search {
          width: 100%;
          padding: 8px;
          margin-bottom: 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }
        .character-map-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }
        .character-map-item {
          display: flex;
          flex-direction: column;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .character-map-item:hover {
          background-color: #f5f5f5;
        }
        .character-map-value {
          font-size: 24px;
          text-align: center;
          margin-bottom: 8px;
        }
        .character-map-info {
          font-size: 12px;
        }
        .character-map-name {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .character-map-description {
          color: #666;
        }
        .character-map-item.copied {
          background-color: #e6f7e6;
        }
        .character-map-no-results {
          padding: 20px;
          text-align: center;
          color: #666;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Register custom element
customElements.define('character-map', CharacterMap);
export {
  CharacterMap
}
