// IPA Chart Web Component
class IpaChart extends HTMLElement {
  constructor() {
    super();
    this.ipaData = null;
    this.selectedSymbol = null;
  }

  async connectedCallback() {
    try {
      // Load IPA data from external JSON file
      const response = await fetch('ipa.json');
      if (!response.ok) {
        throw new Error('Failed to load IPA data');
      }
      
      const data = await response.json();
      this.ipaData = data;
      
      // Now render the component once data is loaded
      this.render();
      this.addEventListeners();
    } catch (error) {
      console.error('Error loading IPA data:', error);
      this.innerHTML = '<div class="error">Error loading IPA chart data.</div>';
    }
  }

  render() {
    // Create main container
    this.innerHTML = `
      <div class="ipa-chart">
        <div class="sections">
          ${this.renderSections()}
        </div>
        <div class="details" id="symbol-details">
          <h3>Symbol Details</h3>
          <div id="details-content">
            <p>Click on a symbol to see its phonetic features</p>
          </div>
        </div>
      </div>
    `;
  }

  renderSections() {
    if (!this.ipaData) return '<div>Loading...</div>';
    
    let html = '';
    
    // Render each section based on category type
    for (const category of this.ipaData.categories) {
      html += `
        <section class="${category.name.toLowerCase().replaceAll(' ', '-')}-section">
          <h3>${category.name}</h3>
          <div class="table-container">
            ${this.renderCategory(category)}
          </div>
        </section>
      `;
    }
    
    return html;
  }

  renderCategory(category) {
    // Check if category has axes (for table layout)
    if (category.axes) {
      return this.renderAxisBasedTable(category);
    } 
    // Check if category has groups
    else if (category.groups) {
      return this.renderGroupedList(category);
    } 
    // Simple list of symbols
    else if (category.symbols) {
      return this.renderSimpleList(category);
    }
    
    return '<div>No data available for this category</div>';
  }

  renderAxisBasedTable(category) {
    // Get the axis information
    const rowAxis = category.axes[0];
    const columnAxis = category.axes[1];
    
    let html = '<table>';
    
    // Header row with column values
    html += '<tr><th></th>';
    for (const value of columnAxis.values) {
      html += `<th>${this.capitalizeFirstLetter(value)}</th>`;
    }
    html += '</tr>';
    
    // Data rows
    for (const rowValue of rowAxis.values) {
      html += `<tr><th class="row-label">${this.capitalizeFirstLetter(rowValue)}</th>`;
      
      // Cells for each column
      for (const columnValue of columnAxis.values) {
        html += '<td>';
        
        // Find symbols that match this cell (have both rowValue and columnValue in features)
        const cellSymbols = this.getSymbolsForCell(rowValue, columnValue, rowAxis.name, columnAxis.name);
        
        if (cellSymbols.length > 0) {
          cellSymbols.forEach(symbol => {
            html += `<span class="symbol" data-symbol="${symbol}">${symbol}</span>`;
          });
        }
        
        html += '</td>';
      }
      
      html += '</tr>';
    }
    
    html += '</table>';
    return html;
  }

  renderGroupedList(category) {
    let html = '<div class="grouped-list">';
    
    for (const group of category.groups) {
      html += `<div class="group"><strong>${group.name}</strong>: `;
      
      for (const symbol of group.symbols) {
        html += `<span class="symbol" data-symbol="${symbol}">${symbol}</span>`;
      }
      
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }

  renderSimpleList(category) {
    let html = '<div class="simple-list">';
    
    for (const symbol of category.symbols) {
      html += `<span class="symbol" data-symbol="${symbol}">${symbol}</span>`;
    }
    
    html += '</div>';
    return html;
  }

  getSymbolsForCell(rowValue, columnValue, rowAxisName, columnAxisName) {
    const result = [];
    
    // Iterate through all symbols
    for (const [symbol, data] of Object.entries(this.ipaData.symbols)) {
      const features = data.features;
      
      // Check if the symbol's features match both the row and column values
      if (features[rowAxisName] === rowValue && features[columnAxisName] === columnValue) {
        result.push(symbol);
      }
    }
    
    return result;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  addEventListeners() {
    // Add click event listeners to all symbol elements
    const symbols = this.querySelectorAll('.symbol');
    symbols.forEach(symbolElement => {
      symbolElement.addEventListener('click', (e) => {
        const symbol = e.target.dataset.symbol;
        this.selectSymbol(symbol, e.target);
      });
    });
  }

  selectSymbol(symbol, element) {
    // Remove selected class from previously selected symbol
    const previousSelected = this.querySelector('.symbol.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }
    
    // Add selected class to the new selected symbol
    element.classList.add('selected');
    this.selectedSymbol = symbol;
    
    // Update details panel
    this.updateSymbolDetails(symbol);
  }
  
  updateSymbolDetails(symbol) {
    const detailsContent = this.querySelector('#details-content');
    const symbolData = this.ipaData.symbols[symbol];
    
    if (!symbolData) {
      detailsContent.innerHTML = '<p>No data available for this symbol.</p>';
      return;
    }
    
    const { features } = symbolData;
    let html = `
      <h4>${symbol}</h4>
      <div class="features">
    `;
    
    // Display all features for the symbol
    for (const [key, value] of Object.entries(features)) {
      html += `
        <div class="feature-item">
          <span class="feature-name">${this.capitalizeFirstLetter(key)}:</span> ${value}
        </div>
      `;
    }
    
    html += '</div>';
    detailsContent.innerHTML = html;
  }
}

// Register the web component
customElements.define('ipa-chart', IpaChart);