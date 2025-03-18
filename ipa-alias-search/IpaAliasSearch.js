// IPAAliasSearch.js
import {ipaDatabase} from "../ipa-database/IpaDatabase.js"

class IpaAliasSearch extends HTMLElement {
  constructor() {
    super()

    // State
    this._searchResults = []
    this._isLoading = true

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
      <div class="ipa-alias-search-container">
        <h3>Search IPA by Name</h3>
        
        <input type="text" class="search-input" placeholder="Type to search (e.g., 'schwa', 'velar')">
        
        <div class="status">
          <span class="result-count"></span>
        </div>
        
        <div class="search-results">
          <div class="no-results">Start typing to search characters</div>
        </div>
      </div>
    `

    this.innerHTML = html
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

    // Group results by letter to avoid duplicates
    const groupedResults = {}
    results.forEach((result) => {
      if (!groupedResults[result.letter]) {
        groupedResults[result.letter] = result
      }
    })

    Object.values(groupedResults).forEach((result) => {
      const item = document.createElement("div")
      item.className = "result-item"
      item.dataset.letter = result.letter
      item.dataset.type = result.type

      const charEl = document.createElement("div")
      charEl.className = "result-char"
      charEl.textContent = result.letter

      const detailsEl = document.createElement("div")
      detailsEl.className = "result-details"

      const nameEl = document.createElement("div")
      nameEl.className = "result-name"
      nameEl.textContent = result.name

      const typeEl = document.createElement("div")
      typeEl.className = "result-type"

      // Create type badge
      const badgeEl = document.createElement("span")
      badgeEl.className = `badge ${result.type}`
      badgeEl.textContent = result.type

      typeEl.appendChild(badgeEl)
      detailsEl.appendChild(nameEl)
      detailsEl.appendChild(typeEl)

      item.appendChild(charEl)
      item.appendChild(detailsEl)
      resultsContainer.appendChild(item)
    })

    // Update result count
    const resultCount = this.querySelector(".result-count")
    if (resultCount) {
      const uniqueCount = Object.keys(groupedResults).length
      resultCount.textContent = `Found ${uniqueCount} unique character${
        uniqueCount !== 1 ? "s" : ""
      }`
    }
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
        '<div class="no-results">Start typing to search characters</div>'
    }
  }

  // Event handling
  setupEventListeners() {
    // Search input
    const searchInput = this.querySelector(".search-input")
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim()

        if (query.length === 0) {
          this.renderSearchResults([])
          return
        }

        const results = ipaDatabase.searchByAlias(query)
        this._searchResults = results
        this.renderSearchResults(results)
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
customElements.define("ipa-alias-search", IpaAliasSearch)

export { IpaAliasSearch }
