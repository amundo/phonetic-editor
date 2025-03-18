// PhoneticEditor.js - A comprehensive phonetic transcription editor
export class PhoneticEditor extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })

    // Data stores
    this._ipaData = null
    this._aliases = null
    this._substitutionRules = []

    // UI state
    this._searchMode = "alias" // 'alias', 'feature', 'regex'
    this._searchResults = []
    this._selectedTabIndex = 0

    // Initialization
    this.render()
    this.loadData()
    this.setupEventListeners()
  }

  connectedCallback() {
    // Component is now in the DOM
  }

  static get observedAttributes() {
    return ["value", "placeholder"]
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "value" && this.inputField) {
      this.inputField.value = newValue
    } else if (name === "placeholder" && this.inputField) {
      this.inputField.placeholder = newValue
    }
  }

  // Getters and setters
  get value() {
    return this.inputField ? this.inputField.value : ""
  }

  set value(newValue) {
    if (this.inputField) {
      this.inputField.value = newValue
    }
  }

  get inputField() {
    return this.shadowRoot.querySelector(".phonetic-input")
  }

  get substitutionRules() {
    return this._substitutionRules
  }

  set substitutionRules(rules) {
    this._substitutionRules = rules
    this.sortRules()
    this.renderRules()
  }

  // Data loading methods
  async loadData() {
    try {
      // Load IPA data
      const url = new URL("ipa.json", import.meta.url)
      const ipaResponse = await fetch(url)
      this._ipaData = await ipaResponse.json()

      // Load alias data
      const aliasResponse = await fetch("aliases.json")
      this._aliases = await aliasResponse.json()

      // Load saved substitution rules if any
      this.loadStoredRules()

      // Initialize UI based on loaded data
      this.renderDatalist()
      this.updateFeatureFilters()

      // Notify that data is loaded
      this.dispatchEvent(new CustomEvent("data-loaded"))
    } catch (error) {
      console.error("Error loading phonetic data:", error)
      this.showError(
        "Failed to load phonetic data. Please check your connection.",
      )
    }
  }

  loadStoredRules() {
    const storedRules = localStorage.getItem("phoneticEditorRules")
    if (storedRules) {
      try {
        this._substitutionRules = JSON.parse(storedRules)
        this.renderRules()
      } catch (e) {
        console.error("Error parsing stored rules:", e)
      }
    }
  }

  saveRulesToStorage() {
    localStorage.setItem(
      "phoneticEditorRules",
      JSON.stringify(this._substitutionRules),
    )
  }

  // Core functionality
  applySubstitutions() {
    let text = this.inputField.value
    this._substitutionRules.forEach(([pattern, replacement]) => {
      text = text.replace(
        new RegExp(this.escapeRegExp(pattern), "g"),
        replacement,
      )
    })
    this.inputField.value = text.normalize("NFKC")

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent("input", {
        detail: { value: this.inputField.value },
      }),
    )
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  addSubstitutionRule(pattern, replacement) {
    this._substitutionRules.push([pattern, replacement])
    this.sortRules()
    this.renderRules()
    this.saveRulesToStorage()
  }

  removeSubstitutionRule(index) {
    this._substitutionRules.splice(index, 1)
    this.renderRules()
    this.saveRulesToStorage()
  }

  sortRules() {
    // Sort rules by pattern length (longest first)
    this._substitutionRules.sort((a, b) => b[0].length - a[0].length)
  }

  // Feature-based searching
  searchByFeatures(criteria) {
    if (!this._ipaData) return []

    const results = []
    const types = ["vowels", "consonants"]

    types.forEach((type) => {
      const phones = this._ipaData.phones[type] || []

      phones.forEach((phone) => {
        let matches = true

        // Check each criterion
        for (const [feature, value] of Object.entries(criteria)) {
          if (value && phone[feature] !== value) {
            matches = false
            break
          }
        }

        if (matches) {
          results.push(phone)
        }
      })
    })

    return results
  }

  searchByAlias(query) {
    if (!this._aliases || !query) return []

    return this._aliases.filter(([alias, char]) =>
      alias.toLowerCase().includes(query.toLowerCase())
    )
  }

  searchByRegex(pattern) {
    if (!this._ipaData || !pattern) return []

    try {
      const regex = new RegExp(pattern, "i")
      const results = []
      const types = ["vowels", "consonants"]

      types.forEach((type) => {
        const phones = this._ipaData.phones[type] || []

        phones.forEach((phone) => {
          if (regex.test(phone.letter) || regex.test(phone.name)) {
            results.push(phone)
          }
        })
      })

      return results
    } catch (e) {
      console.error("Invalid regex:", e)
      return []
    }
  }

  // UI Rendering methods
  render() {
    const style = `
      :host {
        display: block;
        font-family: 'Gentium Plus', sans-serif;
        width: 100%;
        --primary-color: #4a5568;
        --secondary-color: #2d3748;
        --accent-color: #3182ce;
        --background-color: #ffffff;
        --border-color: #e2e8f0;
        --hover-color: #edf2f7;
      }
      
      .phonetic-editor {
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        overflow: hidden;
      }
      
      .editor-toolbar {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--background-color);
      }
      
      .toolbar-button {
        padding: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--primary-color);
        font-size: 1rem;
      }
      
      .toolbar-button:hover {
        background-color: var(--hover-color);
      }
      
      .toolbar-button.active {
        border-bottom: 2px solid var(--accent-color);
        color: var(--accent-color);
      }
      
      .editor-content {
        padding: 0.5rem;
      }
      
      .phonetic-input {
        width: 100%;
        min-height: 100px;
        padding: 0.5rem;
        font-size: 1.25rem;
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        font-family: 'Gentium Plus', sans-serif;
        resize: vertical;
      }
      
      .tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-top: 1rem;
      }
      
      .tab {
        padding: 0.5rem 1rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      
      .tab.active {
        border-bottom: 2px solid var(--accent-color);
        font-weight: bold;
      }
      
      .tab-panel {
        display: none;
        padding: 1rem 0;
      }
      
      .tab-panel.active {
        display: block;
      }
      
      .rules-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .rules-table th, .rules-table td {
        padding: 0.5rem;
        text-align: left;
        border: 1px solid var(--border-color);
      }
      
      .rules-table th {
        background-color: var(--hover-color);
      }
      
      .rule-row-input {
        width: 100%;
        padding: 0.25rem;
        font-family: 'Gentium Plus', sans-serif;
      }
      
      .button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        background-color: var(--accent-color);
        color: white;
        cursor: pointer;
      }
      
      .button:hover {
        opacity: 0.9;
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
      }
      
      .search-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 0.5rem;
        margin-top: 1rem;
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
      
      .alias-search {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .alias-results {
        height: 200px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        padding: 0.5rem;
      }
      
      .hidden {
        display: none;
      }
    `

    const html = `
      <div class="phonetic-editor">
        <div class="editor-toolbar">
          <button class="toolbar-button toggle-rules">⚙ Rules</button>
          <button class="toolbar-button apply-subs">↻ Apply</button>
          <button class="toolbar-button export-text">↓ Export</button>
        </div>
        
        <div class="editor-content">
          <textarea class="phonetic-input" placeholder="Enter phonetic text..."></textarea>
          
          <div class="tabs">
            <div class="tab active" data-tab-index="0">Substitution Rules</div>
            <div class="tab" data-tab-index="1">IPA by Feature</div>
            <div class="tab" data-tab-index="2">IPA by Alias</div>
          </div>
          
          <div class="tab-panel active" data-panel-index="0">
            <table class="rules-table">
              <thead>
                <tr>
                  <th>Pattern</th>
                  <th>Replacement</th>
                  <th>Actions</th>
                </tr>
                <tr class="add-rule-row">
                  <td><input type="text" class="rule-row-input pattern-input" placeholder="Pattern"></td>
                  <td><input type="text" class="rule-row-input replacement-input" placeholder="Replacement"></td>
                  <td><button class="button add-rule-button">Add</button></td>
                </tr>
              </thead>
              <tbody class="rules-body">
                <!-- Rules will be rendered here -->
              </tbody>
            </table>
            <div class="rule-actions">
              <button class="button import-rules">Import Rules</button>
              <button class="button export-rules">Export Rules</button>
            </div>
          </div>
          
          <div class="tab-panel" data-panel-index="1">
            <div class="feature-filters">
              <!-- Feature selects will be rendered here -->
            </div>
            <button class="button search-features-button">Search</button>
            <div class="search-results features-results">
              <!-- Search results will be rendered here -->
            </div>
          </div>
          
          <div class="tab-panel" data-panel-index="2">
            <input type="text" class="alias-search" placeholder="Search for character by name...">
            <div class="alias-results">
              <!-- Alias results will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `

    this.shadowRoot.innerHTML = `<style>${style}</style>${html}`
  }

  renderRules() {
    const rulesBody = this.shadowRoot.querySelector(".rules-body")
    if (!rulesBody) return

    rulesBody.innerHTML = ""

    this._substitutionRules.forEach(([pattern, replacement], index) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${pattern}</td>
        <td>${replacement}</td>
        <td>
          <button class="button remove-rule" data-index="${index}">Remove</button>
        </td>
      `
      rulesBody.appendChild(row)
    })
  }

  renderDatalist() {
    if (!this._aliases) return

    const aliasResults = this.shadowRoot.querySelector(".alias-results")
    if (!aliasResults) return

    // Create a list of alias items
    const itemsHtml = this._aliases.map(([alias, char]) => `
      <div class="result-item alias-item" data-alias="${alias}" data-char="${char}">
        <div class="result-char">${char}</div>
        <div class="result-name">${alias}</div>
      </div>
    `).join("")

    aliasResults.innerHTML = itemsHtml
  }

  updateFeatureFilters() {
    if (!this._ipaData) return

    const featureFilters = this.shadowRoot.querySelector(".feature-filters")
    if (!featureFilters) return

    // Clear existing filters
    featureFilters.innerHTML = ""

    // Create select elements for each feature type
    const featureTypes = [
      { name: "height", options: this._ipaData.heights, label: "Vowel Height" },
      {
        name: "backness",
        options: this._ipaData.backness,
        label: "Vowel Backness",
      },
      {
        name: "rounding",
        options: this._ipaData.rounding,
        label: "Vowel Rounding",
      },
      {
        name: "place",
        options: this._ipaData.places,
        label: "Place of Articulation",
      },
      {
        name: "manner",
        options: this._ipaData.manners,
        label: "Manner of Articulation",
      },
      { name: "voicing", options: this._ipaData.voicings, label: "Voicing" },
    ]

    featureTypes.forEach((featureType) => {
      const container = document.createElement("div")

      const select = document.createElement("select")
      select.className = "feature-select"
      select.dataset.feature = featureType.name

      const defaultOption = document.createElement("option")
      defaultOption.value = ""
      defaultOption.textContent = featureType.label
      select.appendChild(defaultOption)

      featureType.options.forEach((option) => {
        const optionEl = document.createElement("option")
        optionEl.value = option
        optionEl.textContent = option
        select.appendChild(optionEl)
      })

      container.appendChild(select)
      featureFilters.appendChild(container)
    })
  }

  renderSearchResults(results) {
    const resultsContainer = this.shadowRoot.querySelector(".features-results")
    if (!resultsContainer) return

    resultsContainer.innerHTML = ""

    if (results.length === 0) {
      resultsContainer.innerHTML = "<p>No results found.</p>"
      return
    }

    results.forEach((result) => {
      const item = document.createElement("div")
      item.className = "result-item"
      item.dataset.char = result.letter

      const charEl = document.createElement("div")
      charEl.className = "result-char"
      charEl.textContent = result.letter

      const nameEl = document.createElement("div")
      nameEl.className = "result-name"
      nameEl.textContent = result.name || ""

      item.appendChild(charEl)
      item.appendChild(nameEl)
      resultsContainer.appendChild(item)
    })
  }

  // Event handling
  setupEventListeners() {
    // Tab switching
    this.shadowRoot.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabIndex = parseInt(tab.dataset.tabIndex)
        this.selectTab(tabIndex)
      })
    })

    // Add rule button
    const addRuleButton = this.shadowRoot.querySelector(".add-rule-button")
    if (addRuleButton) {
      addRuleButton.addEventListener("click", () => {
        const patternInput = this.shadowRoot.querySelector(".pattern-input")
        const replacementInput = this.shadowRoot.querySelector(
          ".replacement-input",
        )

        if (
          patternInput && replacementInput && patternInput.value &&
          replacementInput.value
        ) {
          this.addSubstitutionRule(patternInput.value, replacementInput.value)
          patternInput.value = ""
          replacementInput.value = ""
          patternInput.focus()
        }
      })
    }

    // Remove rule buttons
    this.shadowRoot.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove-rule")) {
        const index = parseInt(event.target.dataset.index)
        if (!isNaN(index)) {
          this.removeSubstitutionRule(index)
        }
      }
    })

    // Apply substitutions button
    const applyButton = this.shadowRoot.querySelector(".apply-subs")
    if (applyButton) {
      applyButton.addEventListener("click", () => {
        this.applySubstitutions()
      })
    }

    // Search by features button
    const searchFeaturesButton = this.shadowRoot.querySelector(
      ".search-features-button",
    )
    if (searchFeaturesButton) {
      searchFeaturesButton.addEventListener("click", () => {
        const criteria = {}

        this.shadowRoot.querySelectorAll(".feature-select").forEach(
          (select) => {
            if (select.value) {
              criteria[select.dataset.feature] = select.value
            }
          },
        )

        const results = this.searchByFeatures(criteria)
        this.renderSearchResults(results)
      })
    }

    // Alias search input
    const aliasSearch = this.shadowRoot.querySelector(".alias-search")
    if (aliasSearch) {
      aliasSearch.addEventListener("input", () => {
        const query = aliasSearch.value
        const results = this.searchByAlias(query)

        const aliasResults = this.shadowRoot.querySelector(".alias-results")
        if (aliasResults) {
          aliasResults.innerHTML = ""

          results.forEach(([alias, char]) => {
            const item = document.createElement("div")
            item.className = "result-item alias-item"
            item.dataset.alias = alias
            item.dataset.char = char

            const charEl = document.createElement("div")
            charEl.className = "result-char"
            charEl.textContent = char

            const nameEl = document.createElement("div")
            nameEl.className = "result-name"
            nameEl.textContent = alias

            item.appendChild(charEl)
            item.appendChild(nameEl)
            aliasResults.appendChild(item)
          })
        }
      })
    }

    // Click on search result to insert
    this.shadowRoot.addEventListener("click", (event) => {
      const resultItem = event.target.closest(".result-item")
      if (resultItem && resultItem.dataset.char) {
        this.insertAtCursor(resultItem.dataset.char)
      }
    })

    // Export/Import buttons
    const exportRulesButton = this.shadowRoot.querySelector(".export-rules")
    if (exportRulesButton) {
      exportRulesButton.addEventListener("click", () => {
        this.exportRules()
      })
    }

    const importRulesButton = this.shadowRoot.querySelector(".import-rules")
    if (importRulesButton) {
      importRulesButton.addEventListener("click", () => {
        this.importRules()
      })
    }

    // Export text button
    const exportTextButton = this.shadowRoot.querySelector(".export-text")
    if (exportTextButton) {
      exportTextButton.addEventListener("click", () => {
        this.exportText()
      })
    }

    // Input field for automatic substitution (optional)
    const inputField = this.shadowRoot.querySelector(".phonetic-input")
    if (inputField) {
      inputField.addEventListener("input", () => {
        // Auto-apply substitutions on input (can be toggled or made optional)
        // this.applySubstitutions();
      })
    }

    // Toggle rules visibility
    const toggleRulesButton = this.shadowRoot.querySelector(".toggle-rules")
    if (toggleRulesButton) {
      toggleRulesButton.addEventListener("click", () => {
        const tabs = this.shadowRoot.querySelector(".tabs")
        const panels = this.shadowRoot.querySelectorAll(".tab-panel")

        tabs.classList.toggle("hidden")
        panels.forEach((panel) => panel.classList.toggle("hidden"))
      })
    }
  }

  selectTab(index) {
    this._selectedTabIndex = index

    // Update active tab
    this.shadowRoot.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", parseInt(tab.dataset.tabIndex) === index)
    })

    // Update active panel
    this.shadowRoot.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle(
        "active",
        parseInt(panel.dataset.panelIndex) === index,
      )
    })
  }

  // Utility methods
  insertAtCursor(text) {
    const inputField = this.shadowRoot.querySelector(".phonetic-input")
    if (!inputField) return

    const startPos = inputField.selectionStart
    const endPos = inputField.selectionEnd

    const before = inputField.value.substring(0, startPos)
    const after = inputField.value.substring(endPos)

    inputField.value = before + text + after

    // Set selection after inserted text
    const newPos = startPos + text.length
    inputField.setSelectionRange(newPos, newPos)
    inputField.focus()

    // Dispatch input event
    const event = new Event("input", { bubbles: true })
    inputField.dispatchEvent(event)
  }

  exportRules() {
    const dataStr = JSON.stringify(this._substitutionRules, null, 2)
    const dataUri = "data:application/json;charset=utf-8," +
      encodeURIComponent(dataStr)

    const link = document.createElement("a")
    link.setAttribute("href", dataUri)
    link.setAttribute("download", "phonetic-rules.json")
    link.click()
  }

  importRules() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,application/json"

    input.addEventListener("change", (event) => {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const rules = JSON.parse(e.target.result)
          if (Array.isArray(rules)) {
            this._substitutionRules = rules
            this.sortRules()
            this.renderRules()
            this.saveRulesToStorage()
          }
        } catch (error) {
          console.error("Error parsing rules file:", error)
          this.showError("Invalid rules file format.")
        }
      }
      reader.readAsText(file)
    })

    input.click()
  }

  exportText() {
    const text = this.inputField.value
    if (!text) return

    const dataUri = "data:text/plain;charset=utf-8," + encodeURIComponent(text)

    const link = document.createElement("a")
    link.setAttribute("href", dataUri)
    link.setAttribute("download", "phonetic-text.txt")
    link.click()
  }

  showError(message) {
    console.error(message)
    // In a real implementation, you might want to show a toast or other UI element
  }
}

// Define the custom element
customElements.define("phonetic-editor", PhoneticEditor)
