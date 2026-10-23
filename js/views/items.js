/**
 * ZOHO INVOICE - ITEMS & SERVICES CATALOG (HSN / SAC COMPLIANT)
 * Full support for Material type (Product vs Service) and corresponding HSN/SAC codes.
 */

(function (window) {
  'use strict';

  const ItemsView = {
    searchQuery: '',

    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      const items = window.AppStore.getAll('items');
      const taxes = window.AppStore.getAll('taxes');

      const filtered = items.filter(i => {
        if (!this.searchQuery) return true;
        const q = this.searchQuery.toLowerCase();
        return (
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.sku && i.sku.toLowerCase().includes(q)) ||
          (i.hsnCode && i.hsnCode.toLowerCase().includes(q)) ||
          (i.sacCode && i.sacCode.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q))
        );
      });

      container.innerHTML = `
        <div class="items-page animate-fadeIn">
          
          <div class="table-card">
            <div class="table-header-toolbar">
              <div class="table-title-area">
                <h2 class="table-title">Items & Services Catalog</h2>
                <span class="table-count-badge">${items.length} Materials</span>
              </div>
              <div class="table-actions-area">
                <input 
                  type="text" 
                  id="item-search-input" 
                  class="table-search-input" 
                  placeholder="Search item, HSN/SAC code, SKU..." 
                  value="${this.searchQuery}"
                >
                <button class="btn btn-primary btn-icon-gap" onclick="window.ItemsView.promptItemModal()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New Item</span>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Item & Description</th>
                    <th>HSN / SAC Code</th>
                    <th>SKU / Model</th>
                    <th>Selling Price</th>
                    <th>Unit</th>
                    <th>GST Rate</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">
                        No items found matching criteria.
                      </td>
                    </tr>
                  ` : filtered.map(item => {
                    const isService = item.itemType === 'service';
                    const code = isService ? (item.sacCode || '—') : (item.hsnCode || '—');
                    const codeType = isService ? 'SAC' : 'HSN';

                    return `
                      <tr>
                        <td>
                          <span class="badge ${isService ? 'badge-sent' : 'badge-paid'}">
                            ${isService ? 'Service' : 'Product'}
                          </span>
                        </td>
                        <td>
                          <div class="font-semibold text-main">${item.name}</div>
                          <div class="text-xs text-muted" style="max-width: 380px;">${item.description || ''}</div>
                        </td>
                        <td>
                          <span class="font-mono text-xs font-bold" style="background: var(--surface-muted); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-light);">
                            ${codeType}: ${code}
                          </span>
                        </td>
                        <td><code>${item.sku || '—'}</code></td>
                        <td class="font-bold">${window.Calculator.formatCurrency(item.rate)}</td>
                        <td>${item.unit || 'nos'}</td>
                        <td><strong>${item.taxRate || 18}%</strong></td>
                        <td class="cell-actions">
                          <button class="btn btn-secondary btn-sm" onclick="window.ItemsView.promptItemModal('${item.id}')">Edit</button>
                          <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.ItemsView.deleteItem('${item.id}')">Delete</button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;

      const searchInput = document.getElementById('item-search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(this.searchQuery.length, this.searchQuery.length);
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.render();
        });
      }
    },

    promptItemModal(itemId = null) {
      const existing = itemId ? window.AppStore.getById('items', itemId) : null;
      const isEdit = !!existing;
      const currentType = existing ? (existing.itemType || existing.type || 'product') : 'product';

      const contentHtml = `
        <form id="item-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Material Type</label>
              <select id="item-material-type" class="input-select" required>
                <option value="product" ${currentType === 'product' ? 'selected' : ''}>Product (Physical Goods)</option>
                <option value="service" ${currentType === 'service' ? 'selected' : ''}>Service (Professional / Labour)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required" id="item-code-label">${currentType === 'product' ? 'HSN Code' : 'SAC Code'}</label>
              <input 
                type="text" 
                id="item-hsn-sac-code" 
                class="form-control font-mono" 
                value="${currentType === 'product' ? (existing ? existing.hsnCode || '' : '90279090') : (existing ? existing.sacCode || '' : '998313')}" 
                placeholder="${currentType === 'product' ? 'e.g. 90279090' : 'e.g. 998313'}" 
                required
              >
              <span class="input-help" id="item-code-help">
                ${currentType === 'product' ? 'Harmonized System of Nomenclature code for products' : 'Services Accounting Code for services'}
              </span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Item / Service Name</label>
              <input type="text" id="item-name" class="form-control" value="${existing ? existing.name : ''}" required placeholder="e.g. ZODIAC C18">
            </div>
            <div class="form-group">
              <label class="form-label">SKU / Model Number</label>
              <input type="text" id="item-sku" class="form-control" value="${existing ? existing.sku || '' : ''}" placeholder="e.g. ZOD-C18-250">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Selling Rate (₹)</label>
              <input type="number" step="0.01" id="item-rate" class="form-control" value="${existing ? existing.rate : '39286.00'}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Usage Unit</label>
              <input type="text" id="item-unit" class="form-control" value="${existing ? existing.unit || 'nos' : 'nos'}" placeholder="nos, pcs, units, hrs, service">
            </div>
            <div class="form-group">
              <label class="form-label required">GST Rate (%)</label>
              <select id="item-tax-rate" class="input-select">
                <option value="18" ${!existing || existing.taxRate === 18 ? 'selected' : ''}>18% (Standard Analytical/Chemicals)</option>
                <option value="12" ${existing && existing.taxRate === 12 ? 'selected' : ''}>12%</option>
                <option value="5" ${existing && existing.taxRate === 5 ? 'selected' : ''}>5%</option>
                <option value="28" ${existing && existing.taxRate === 28 ? 'selected' : ''}>28%</option>
                <option value="0" ${existing && existing.taxRate === 0 ? 'selected' : ''}>0% (Exempt)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Technical Description & Specifications</label>
            <textarea id="item-desc" class="form-control" rows="2" placeholder="e.g. 250mmx4.6mm, 5µm">${existing ? existing.description || '' : ''}</textarea>
          </div>
        </form>
      `;

      window.Modal.open({
        title: isEdit ? 'Edit Material / Service' : 'New Material (Product / Service)',
        contentHtml,
        size: 'md',
        confirmText: isEdit ? 'Save Changes' : 'Add to Catalog',
        onRender: (dialog) => {
          const typeSelect = dialog.querySelector('#item-material-type');
          const codeLabel = dialog.querySelector('#item-code-label');
          const codeInput = dialog.querySelector('#item-hsn-sac-code');
          const codeHelp = dialog.querySelector('#item-code-help');

          typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'product') {
              codeLabel.textContent = 'HSN Code';
              codeInput.placeholder = 'e.g. 90279090';
              codeHelp.textContent = 'Harmonized System of Nomenclature code for products';
              if (codeInput.value === '998313' || !codeInput.value) codeInput.value = '90279090';
            } else {
              codeLabel.textContent = 'SAC Code';
              codeInput.placeholder = 'e.g. 998313';
              codeHelp.textContent = 'Services Accounting Code for services';
              if (codeInput.value === '90279090' || !codeInput.value) codeInput.value = '998313';
            }
          });
        },
        onConfirm: () => {
          const materialType = document.getElementById('item-material-type').value;
          const name = document.getElementById('item-name').value.trim();
          const code = document.getElementById('item-hsn-sac-code').value.trim();
          const rate = parseFloat(document.getElementById('item-rate').value);

          if (!name || isNaN(rate) || !code) {
            window.Toast.show('Item name, valid rate, and HSN/SAC code are required.', 'error');
            return false;
          }

          const itemData = {
            name,
            itemType: materialType,
            type: materialType,
            hsnCode: materialType === 'product' ? code : '',
            sacCode: materialType === 'service' ? code : '',
            hsnSac: code,
            sku: document.getElementById('item-sku').value.trim(),
            rate,
            unit: document.getElementById('item-unit').value.trim() || 'nos',
            taxRate: parseFloat(document.getElementById('item-tax-rate').value) || 18,
            description: document.getElementById('item-desc').value.trim()
          };

          if (isEdit) {
            window.AppStore.update('items', itemId, itemData);
            window.Toast.show('Item updated successfully!', 'success');
          } else {
            window.AppStore.add('items', itemData);
            window.Toast.show('Item added to catalog!', 'success');
          }

          this.render();
          return true;
        }
      });
    },

    deleteItem(itemId) {
      window.Modal.confirm({
        title: 'Delete Item',
        message: 'Are you sure you want to delete this catalog item?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('items', itemId);
          window.Toast.show('Item deleted from catalog.', 'info');
          this.render();
        }
      });
    }
  };

  window.ItemsView = ItemsView;

})(window);
