import { applySubstitutions } from "./apply-substitutions.js"

class SubstitutionInput extends HTMLElement {
  constructor() {
    super()
    this.rules = []
    this.active = true
    this.input = document.createElement("input")
    this.appendChild(this.input)

    this.input.addEventListener("input", () => this.processInput())
    this.input.addEventListener("keydown", (e) => this.handleKeydown(e))
  }

  static get observedAttributes() {
    return ["value", "placeholder", "active"]
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "value") {
      this.input.value = newValue
    } else if (name === "placeholder") {
      this.input.placeholder = newValue
    } else if (name === "active") {
      this.active = newValue !== "false"
    }
  }

  set rulesList(newRules) {
    this.rules = newRules
  }

  set value(value) {
    this.input.value = value
    this.setAttribute("value", value)
  }

  get value() {
    return this.input.value
  }

  processInput() {
    if (!this.active || this.rules.length === 0) return

    const { value, selectionStart } = this.input
    const { word, start, end } = this.getCurrentWord(value, selectionStart)

    if (word) {
      let newWord = applySubstitutions(word, this.rules)
      newWord = newWord.normalize("NFKC")

      if (newWord !== word) {
        this.input.value = value.slice(0, start) + newWord + value.slice(end)
        this.input.setSelectionRange(
          start + newWord.length,
          start + newWord.length,
        )
        this.setAttribute("value", this.input.value)
      }
    }
  }

  /**
   * Extracts the word surrounding the caret using Unicode-aware regex
   * @param {string} text - Full text in the input
   * @param {number} pos - Caret position
   * @returns {{word: string, start: number, end: number}}
   */
  getCurrentWord(text, pos) {
    const unicodeWordRegex = /\p{L}+\p{M}*\p{N}*/gu
    let match
    let start = 0, end = 0

    while ((match = unicodeWordRegex.exec(text)) !== null) {
      const wordStart = match.index
      const wordEnd = wordStart + match[0].length

      if (pos >= wordStart && pos <= wordEnd) {
        start = wordStart
        end = wordEnd
        return { word: match[0], start, end }
      }
    }
    return { word: "", start: pos, end: pos }
  }

  handleKeydown(e) {
    if (e.key === "Enter") {
      this.processInput()
    }
  }
}

customElements.define("substitution-input", SubstitutionInput)
export { SubstitutionInput }
