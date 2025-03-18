class CharacterPalette extends HTMLElement {
  #characters = []
  constructor() {
    super();
  }
  
  connectedCallback() {
    this.render();
    this.addEventListener('click', this._handleClick);
  }
  
  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
  }
  
  set data(characters){
    if (characters) {
      this.#characters = characters;
      this.render();
    }
    else {
      this.#characters = [];
      this.render();
    }
  }

  get data() {
    return this.#characters;
  }
  
  /**
   * Handle click events on character buttons
   * @param {Event} event - Click event
   * @private
   */
  _handleClick(event) {
    const target = event.target;
    
    // Only process clicks on buttons
    if (target.tagName === 'BUTTON') {
      const character = target.textContent;
      
      // Dispatch custom event with selected character
      const selectEvent = new CustomEvent('character-select', {
        bubbles: true,
        detail: { character }
      });
      
      this.dispatchEvent(selectEvent);
    }
  }
  
  /**
   * Render the character palette
   */
  render() {
    // Clear existing content
    this.innerHTML = '<main class=character-palette-main></main>'
    this.main = document.querySelector('main.character-palette-main')
    
    // Create buttons for each character
    this.#characters.forEach(char => {
      const button = document.createElement('button');
      button.textContent = char;
      this.main.appendChild(button);
    });
    
  }
}

// Register the custom element
customElements.define('character-palette', CharacterPalette);


export {
  CharacterPalette
}