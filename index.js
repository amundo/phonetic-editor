// index.js - Main application entry point for the integrated phonetic editor
import { PhoneticEditor } from './PhoneticEditor.js';
import { IPAFeatureSearch } from './IPAFeatureSearch.js';
import { IPAAliasSearch } from './IPAAliasSearch.js';

document.addEventListener('DOMContentLoaded', () => {
  // Application state
  const state = {
    currentText: '',
    substitutionRules: [],
    recentCharacters: []
  };
  
  // Initialize components
  initializeApp();
  
  function initializeApp() {
    // Setup main components
    setupMainEditor();
    setupFeatureSearch();
    setupAliasSearch();
    setupRecentCharacters();
    setupImportExport();
    
    // Load sample data
    setupSampleData();
    
    // Load initial state from localStorage if available
    loadInitialState();
  }
  
  function setupMainEditor() {
    const editor = document.querySelector('phonetic-editor');
    if (!editor) return;
    
    // Handle editor events
    editor.addEventListener('input', (event) => {
      state.currentText = event.detail.value;
      saveState();
    });
    
    editor.addEventListener('rules-changed', (event) => {
      state.substitutionRules = event.detail.rules;
      saveState();
    });
  }
  
  function setupFeatureSearch() {
    const featureSearch = document.querySelector('ipa-feature-search');
    if (!featureSearch) return;
    
    featureSearch.addEventListener('character-selected', (event) => {
      const editor = document.querySelector('phonetic-editor');
      if (editor) {
        editor.insertAtCursor(event.detail.character);
        addToRecentCharacters(event.detail.character);
      }
    });
  }
  
  function setupAliasSearch() {
    const aliasSearch = document.querySelector('ipa-alias-search');
    if (!aliasSearch) return;
    
    aliasSearch.addEventListener('character-selected', (event) => {
      const editor = document.querySelector('phonetic-editor');
      if (editor) {
        editor.insertAtCursor(event.detail.character);
        addToRecentCharacters(event.detail.character);
      }
    });
  }
  
  function setupRecentCharacters() {
    const recentCharsContainer = document.querySelector('.recent-characters');
    if (!recentCharsContainer) return;
    
    // Initial render
    renderRecentCharacters();
    
    // Handle clicks on recent characters
    recentCharsContainer.addEventListener('click', (event) => {
      const charButton = event.target.closest('.char-button');
      if (charButton) {
        const editor = document.querySelector('phonetic-editor');
        if (editor) {
          editor.insertAtCursor(charButton.dataset.char);
        }
      }
    });
  }
  
  function setupImportExport() {
    const importTextBtn = document.getElementById('import-text');
    const exportTextBtn = document.getElementById('export-text');
    const importRulesBtn = document.getElementById('import-rules');
    const exportRulesBtn = document.getElementById('export-rules');
    
    if (importTextBtn) {
      importTextBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        
        input.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const editor = document.querySelector('phonetic-editor');
            if (editor) {
              editor.value = e.target.result;
              state.currentText = e.target.result;
              saveState();
            }
          };
          reader.readAsText(file);
        });
        
        input.click();
      });
    }
    
    if (exportTextBtn) {
      exportTextBtn.addEventListener('click', () => {
        const editor = document.querySelector('phonetic-editor');
        if (!editor) return;
        
        const text = editor.value;
        if (!text) return;
        
        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', 'phonetic-text.txt');
        link.click();
      });
    }
    
    if (importRulesBtn) {
      importRulesBtn.addEventListener('click', () => {
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
              const editor = document.querySelector('phonetic-editor');
              if (editor) {
                editor.substitutionRules = rules;
                state.substitutionRules = rules;
                saveState();
              }
            } catch (error) {
              console.error('Error parsing rules file:', error);
              alert('Invalid rules file format.');
            }
          };
          reader.readAsText(file);
        });
        
        input.click();
      });
    }
    
    if (exportRulesBtn) {
      exportRulesBtn.addEventListener('click', () => {
        const editor = document.querySelector('phonetic-editor');
        if (!editor) return;
        
        const rules = editor.substitutionRules;
        const dataStr = JSON.stringify(rules, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', 'phonetic-rules.json');
        link.click();
      });
    }
  }
  
  function setupSampleData() {
    document.querySelectorAll('.sample-item').forEach(item => {
      item.addEventListener('click', () => {
        const editor = document.querySelector('phonetic-editor');
        if (editor) {
          const text = item.querySelector('pre').textContent;
          editor.value = text;
          state.currentText = text;
          saveState();
        }
      });
    });
    
    document.querySelectorAll('.ruleset-item').forEach(item => {
      item.addEventListener('click', () => {
        const editor = document.querySelector('phonetic-editor');
        if (editor) {
          const rulesetName = item.dataset.ruleset;
          loadRuleset(rulesetName, editor);
        }
      });
    });
  }
  
  function loadRuleset(name, editor) {
    const commonRules = {
      'ipa-basic': [
        ["{sh}", "ʃ"],
        ["{ch}", "t͡ʃ"],
        ["{ng}", "ŋ"],
        ["{th}", "θ"],
        ["{dh}", "ð"],
        ["{zh}", "ʒ"],
        ["{eng}", "ŋ"],
        ["{glottal}", "ʔ"],
        ["{schwa}", "ə"],
        ["{openo}", "ɔ"],
        ["{opene}", "ɛ"],
        ["{ash}", "æ"]
      ],
      'tone-marks': [
        ["^0", "⁰"],
        ["^1", "¹"],
        ["^2", "²"],
        ["^3", "³"],
        ["^4", "⁴"],
        ["^5", "⁵"],
        ["^6", "⁶"],
        ["^7", "⁷"],
        ["^8", "⁸"],
        ["^9", "⁹"]
      ],
      'diacritics': [
        ["_n", "̃"], // nasal
        ["_l", "ː"], // long
        ["_h", "ʰ"], // aspirated
        ["_r", "˞"], // rhoticity
        ["_^", "̂"], // falling tone
        ["_v", "̌"], // rising tone
        ["_'", "́"], // high tone
        ["_\"", "̋"], // extra-high tone
        ["_`", "̀"], // low tone
        ["__", "̏"]  // extra-low tone
      ]
    };
    
    if (name in commonRules) {
      editor.substitutionRules = commonRules[name];
      state.substitutionRules = commonRules[name];
      saveState();
    }
  }
  
  function addToRecentCharacters(character) {
    // Add to recent characters, avoid duplicates
    const index = state.recentCharacters.indexOf(character);
    if (index >= 0) {
      state.recentCharacters.splice(index, 1);
    }
    
    state.recentCharacters.unshift(character);
    
    // Limit to 20 recent characters
    if (state.recentCharacters.length > 20) {
      state.recentCharacters.pop();
    }
    
    renderRecentCharacters();
    saveState();
  }
  
  function renderRecentCharacters() {
    const container = document.querySelector('.recent-characters');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (state.recentCharacters.length === 0) {
      container.innerHTML = '<p>No recent characters</p>';
      return;
    }
    
    state.recentCharacters.forEach(char => {
      const button = document.createElement('button');
      button.className = 'char-button';
      button.dataset.char = char;
      button.textContent = char;
      button.title = `Insert ${char}`;
      container.appendChild(button);
    });
  }
  
  function saveState() {
    localStorage.setItem('phoneticEditorState', JSON.stringify(state));
  }
  
  function loadInitialState() {
    const savedState = localStorage.getItem('phoneticEditorState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        
        // Merge with current state
        Object.assign(state, parsedState);
        
        // Apply to UI
        const editor = document.querySelector('phonetic-editor');
        if (editor) {
          if (state.currentText) {
            editor.value = state.currentText;
          }
          
          if (state.substitutionRules && state.substitutionRules.length > 0) {
            editor.substitutionRules = state.substitutionRules;
          }
        }
        
        renderRecentCharacters();
      } catch (error) {
        console.error('Error loading saved state:', error);
        // Continue with default state
      }
    }
  }
});
