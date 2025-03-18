// IpaSearch.js
import {ipaDatabase} from "../ipa-database/IpaDatabase.js"
await ipaDatabase.load()

class IpaSearch extends HTMLElement {
  constructor() {
    super()

    // State
    this._searchResults = []
    this._isLoading = true
    this._searchTokens = []

    // Initialize
    this.render()
    this.loadData()
    this.setupEventListeners()
  }

  connectedCallback() {
    // Component is now in the DOM
  }

  async loadData() {
    try {
      this.showLoading()
      await ipaDatabase.load()
      this.hideLoading()

      // Notify that data is loaded
      this.dispatchEvent(new CustomEvent("data-loaded"))
    } catch (error) {
      this.showError(error.message)
    }
  }

  // UI Rendering
  render() {
    const html = `
      <div class="ipa-search-container">
        <h3>Search IPA Characters</h3>
        
        <div class="search-input-container">
          <input type="text" class="search-input" placeholder="Type aliases, features, or character names...">
          <div class="search-help-tooltip">
            <button class="help-button">?</button>
            <div class="tooltip-content">
              <h4>Search Examples:</h4>
              <ul>
                <li>"schwa" - Find schwa character</li>
                <li>"unrounded" - Find all unrounded vowels</li>
                <li>"velar nasal" - Find by feature + alias</li>
                <li>"close front" - Find by multiple features</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="token-display">
          <!-- Tokens will appear here -->
        </div>
        
        <div class="status">
          <span class="result-count"></span>
        </div>
        
        <div class="search-results">
          <div class="no-results">Type to search for IPA characters</div>
        </div>
      </div>
    `

    this.innerHTML = html
  }

  parseSearchQuery(query) {
    if (!query) return []

    // Split by spaces but preserve quoted phrases
    const tokens = []
    let currentToken = ""
    let inQuotes = false

    for (const char of query) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === " " && !inQuotes) {
        if (currentToken) {
          tokens.push(currentToken)
          currentToken = ""
        }
      } else {
        currentToken += char
      }
    }

    if (currentToken) {
      tokens.push(currentToken)
    }

    return tokens.map((token) => token.toLowerCase())
  }

  performSearch(searchTokens) {
    if (!ipaDatabase.isLoaded() || !searchTokens.length) {
      return []
    }

    // Get all phones and combiners
    const data = ipaDatabase.getData()
    let allCharacters = [...(data.phones || [])]
    if (data.combiners) {
      allCharacters = allCharacters.concat(data.combiners)
    }

    // Filter by search tokens
    return allCharacters.filter((char) => {
      // Check each token against this character
      return searchTokens.every((token) => {
        // Check against name
        if (char.name && char.name.toLowerCase().includes(token)) {
          return true
        }

        // Check against aliases
        if (
          char.aliases &&
          char.aliases.some((alias) => alias.toLowerCase().includes(token))
        ) {
          return true
        }

        // Check against features
        if (char.features) {
          // Check feature values
          for (const [feature, value] of Object.entries(char.features)) {
            if (value && String(value).toLowerCase().includes(token)) {
              return true
            }
          }

          // Special case for feature names in tokens that match feature values
          const features = ipaDatabase.getFeatures()
          for (const featureType in features) {
            const possibleValues = features[featureType]
            if (possibleValues) {
              const matchingValue = possibleValues.find((value) =>
                value.toLowerCase().includes(token)
              )

              if (
                matchingValue && char.features[featureType] === matchingValue
              ) {
                return true
              }
            }
          }
        }

        // Check the letter itself
        if (char.letter && char.letter.toLowerCase() === token) {
          return true
        }

        return false
      })
    })
  }

  renderSearchResults(results) {
    const resultsContainer = this.querySelector(".search-results")
    if (!resultsContainer) return

    resultsContainer.innerHTML = ""

    if (results.length === 0) {
      resultsContainer.innerHTML =
        '<div class="no-results">No matching characters found</div>'
      return
    }

    // Group by type for better organization
    const groupedByType = {}
    results.forEach((result) => {
      const type = result.type || "other"
      if (!groupedByType[type]) {
        groupedByType[type] = []
      }
      groupedByType[type].push(result)
    })

    // Render each group
    Object.entries(groupedByType).forEach(([type, items]) => {
      // Type header
      const typeHeader = document.createElement("div")
      typeHeader.className = "result-type-header"
      typeHeader.textContent = type.charAt(0).toUpperCase() + type.slice(1) +
        "s"
      resultsContainer.appendChild(typeHeader)

      // Results grid for this type
      const resultsGrid = document.createElement("div")
      resultsGrid.className = "results-grid"

      items.forEach((result) => {
        const item = document.createElement("div")
        item.className = "result-item"
        item.dataset.letter = result.letter
        item.dataset.type = result.type

        const charEl = document.createElement("div")
        charEl.className = "result-char"
        charEl.textContent = result.letter

        const nameEl = document.createElement("div")
        nameEl.className = "result-name"
        nameEl.textContent = result.name || ""

        // Create features list if available
        if (result.features) {
          const featuresEl = document.createElement("div")
          featuresEl.className = "result-features"

          const featureTags = Object.entries(result.features)
            .filter(([_, value]) => value) // Filter out null/undefined/false values
            .map(([feature, value]) => {
              return `<span class="feature-tag">${value}</span>`
            }).join("")

          featuresEl.innerHTML = featureTags

          item.appendChild(charEl)
          item.appendChild(nameEl)
          item.appendChild(featuresEl)
        } else {
          item.appendChild(charEl)
          item.appendChild(nameEl)
        }

        resultsGrid.appendChild(item)
      })

      resultsContainer.appendChild(resultsGrid)
    })

    // Update result count
    const resultCount = this.querySelector(".result-count")
    if (resultCount) {
      resultCount.textContent = `Found ${results.length} character${
        results.length !== 1 ? "s" : ""
      }`
    }
  }

  renderTokens(tokens) {
    const tokenDisplay = this.querySelector(".token-display")
    if (!tokenDisplay) return

    tokenDisplay.innerHTML = ""

    if (tokens.length === 0) {
      tokenDisplay.style.display = "none"
      return
    }

    tokenDisplay.style.display = "flex"

    tokens.forEach((token) => {
      const tokenEl = document.createElement("div")
      tokenEl.className = "search-token"
      tokenEl.textContent = token

      // Add remove button
      const removeBtn = document.createElement("button")
      removeBtn.className = "token-remove"
      removeBtn.innerHTML = "&times;"
      removeBtn.addEventListener("click", () => {
        this._searchTokens = this._searchTokens.filter((t) => t !== token)
        this.renderTokens(this._searchTokens)

        // Update search results
        const results = this.performSearch(this._searchTokens)
        this._searchResults = results
        this.renderSearchResults(results)

        // Update input field
        this.querySelector(".search-input").value = this._searchTokens.join(" ")
      })

      tokenEl.appendChild(removeBtn)
      tokenDisplay.appendChild(tokenEl)
    })
  }

  showLoading() {
    this._isLoading = true
    const resultsContainer = this.querySelector(".search-results")
    if (resultsContainer) {
      resultsContainer.innerHTML =
        '<div class="loading">Loading IPA data...</div>'
    }
  }

  hideLoading() {
    this._isLoading = false
    const resultsContainer = this.querySelector(".search-results")
    if (resultsContainer) {
      resultsContainer.innerHTML =
        '<div class="no-results">Type to search for IPA characters</div>'
    }
  }

  // Event handling
  setupEventListeners() {
    // Search input
    const searchInput = this.querySelector(".search-input")
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim()
        this._searchTokens = this.parseSearchQuery(query)

        // Render tokens
        this.renderTokens(this._searchTokens)

        if (this._searchTokens.length === 0) {
          this.renderSearchResults([])
          return
        }

        const results = this.performSearch(this._searchTokens)
        this._searchResults = results
        this.renderSearchResults(results)
      })

      // Handle key events
      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          // Execute search with current tokens
          const results = this.performSearch(this._searchTokens)
          this._searchResults = results
          this.renderSearchResults(results)
        }
      })
    }

    // Help tooltip
    const helpButton = this.querySelector(".help-button")
    if (helpButton) {
      helpButton.addEventListener("click", () => {
        const tooltip = this.querySelector(".tooltip-content")
        if (tooltip) {
          tooltip.classList.toggle("visible")
        }
      })

      // Close tooltip when clicking outside
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".search-help-tooltip")) {
          const tooltip = this.querySelector(".tooltip-content")
          if (tooltip) {
            tooltip.classList.remove("visible")
          }
        }
      })
    }

    // Click on search result
    this.addEventListener("click", (event) => {
      const resultItem = event.target.closest(".result-item")
      if (resultItem && resultItem.dataset.letter) {
        this.dispatchEvent(
          new CustomEvent("character-selected", {
            detail: {
              character: resultItem.dataset.letter,
              type: resultItem.dataset.type || "unknown",
            },
          }),
        )
      }
    })
  }

  // Utility methods
  showError(message) {
    console.error(message)

    // Add error message to UI
    const resultsContainer = this.querySelector(".search-results")
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="no-results error-message">
          ${message}
        </div>
      `
    }
  }
}

// Define the custom element
customElements.define("ipa-search", IpaSearch)
export { IpaSearch }
