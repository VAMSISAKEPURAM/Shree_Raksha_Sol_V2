/**
 * ZOHO INVOICE - VENDOR PURCHASE ORDERS (PO) MODULE
 * Shreeraksha Exact Print Replica for Vendor Purchase Orders with HSN/SAC,
 * Dynamic Discounts (% and Amount), and Place of Supply GST taxes.
 */

(function (window) {
  'use strict';

  const PurchaseOrdersView = {
    activePOId: null,
    filterStatus: 'all',
    searchQuery: '',

    render(poIdToOpen = null) {
      const container = document.getElementById('app-view');
      if (!container) return;

      const pos = window.AppStore.getAll('purchaseOrders');

      let filtered = pos.filter(p => {
        if (this.filterStatus !== 'all' && p.status !== this.filterStatus) return false;
        if (!this.searchQuery) return true;
        const q = this.searchQuery.toLowerCase();
        const vendor = window.AppStore.getById('customers', p.vendorId);
        return (
          (p.number && p.number.toLowerCase().includes(q)) ||
          (vendor && vendor.name && vendor.name.toLowerCase().includes(q))
        );
      });

      if (poIdToOpen) {
        this.activePOId = poIdToOpen;
      } else if (!this.activePOId && filtered.length > 0) {
        this.activePOId = filtered[0].id;
      } else if (filtered.length > 0 && !filtered.some(p => p.id === this.activePOId)) {
        this.activePOId = filtered[0].id;
      }

      const activePO = this.activePOId ? window.AppStore.getById('purchaseOrders', this.activePOId) : null;

      container.innerHTML = `
        <div class="split-view-container animate-fadeIn">
          
          <!-- MASTER LEFT PANE -->
          <div class="split-master-pane">
            <div class="master-header">
              <div class="master-header-top">
                <h2 class="master-title-dropdown">Vendor Purchase Orders</h2>
                <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.PurchaseOrdersView.promptPOModal()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New PO</span>
                </button>
              </div>

              <div class="master-search-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="po-search-input" placeholder="Search PO #, vendor..." value="${this.searchQuery}">
              </div>

              <div class="master-filter-tabs">
                <button class="filter-tab-pill ${this.filterStatus === 'all' ? 'active' : ''}" onclick="window.PurchaseOrdersView.setFilter('all')">All</button>
                <button class="filter-tab-pill ${this.filterStatus === 'draft' ? 'active' : ''}" onclick="window.PurchaseOrdersView.setFilter('draft')">Draft</button>
                <button class="filter-tab-pill ${this.filterStatus === 'issued' ? 'active' : ''}" onclick="window.PurchaseOrdersView.setFilter('issued')">Issued</button>
                <button class="filter-tab-pill ${this.filterStatus === 'received' ? 'active' : ''}" onclick="window.PurchaseOrdersView.setFilter('received')">Received</button>
              </div>
            </div>

            <div class="master-items-list">
              ${filtered.length === 0 ? `
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                  No purchase orders found.
                </div>
              ` : filtered.map(po => {
                const vendor = window.AppStore.getById('customers', po.vendorId);
                const isActive = po.id === this.activePOId;
                const isInter = window.Calculator.isInterState(po.placeOfSupply);
                const calc = window.Calculator.computeGSTDocumentTotals(po.items || [], isInter, 0);

                return `
                  <div class="master-item-row ${isActive ? 'active' : ''}" onclick="window.PurchaseOrdersView.selectPO('${po.id}')">
                    <div class="master-item-row-top">
                      <span class="item-row-name">${vendor ? (vendor.company || vendor.name) : 'Vendor'}</span>
                      <span class="item-row-amount">${window.Calculator.formatCurrency(calc.roundedTotal)}</span>
                    </div>
                    <div class="master-item-row-bottom">
                      <span class="item-row-number">${po.number}</span>
                      <div class="flex items-center gap-1">
                        <span class="badge ${isInter ? 'badge-sent' : 'badge-paid'}" style="font-size: 0.65rem;">
                          ${isInter ? 'IGST' : 'CGST+SGST'}
                        </span>
                        <span class="badge badge-${po.status}">${po.status}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- DETAIL RIGHT PANE -->
          <div class="split-detail-pane">
            ${activePO ? this.renderDetailPane(activePO) : `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                Select a Purchase Order to view.
              </div>
            `}
          </div>

        </div>
      `;

      const searchInput = document.getElementById('po-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.render();
        });
      }
    },

    setFilter(status) {
      this.filterStatus = status;
      this.render();
    },

    selectPO(id) {
      this.activePOId = id;
      this.render();
    },

    renderDetailPane(po) {
      return `
        <div class="detail-toolbar">
          <div class="detail-toolbar-left">
            <button class="btn btn-secondary btn-sm btn-icon-gap" title="Toggle List for Full View" onclick="document.querySelector('.split-master-pane').classList.toggle('pane-collapsed');">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              <span>Toggle List</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.PurchaseOrdersView.promptPOModal('${po.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit PO</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.Toast.show('Purchase Order emailed to Vendor!', 'success')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>Email Vendor</span>
            </button>
          </div>

          <div class="detail-toolbar-right">
            <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.print()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print / Download PDF</span>
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.PurchaseOrdersView.deletePO('${po.id}')">
              Delete
            </button>
          </div>
        </div>

        <div class="detail-content-scroll">
          <div class="invoice-paper-wrapper">
            ${window.GSTDocumentTemplate.render(po, { docType: 'PURCHASE ORDER', partyType: 'vendor' })}
          </div>
        </div>
      `;
    },

    deletePO(poId) {
      window.Modal.confirm({
        title: 'Delete Purchase Order',
        message: 'Are you sure you want to delete this purchase order?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('purchaseOrders', poId);
          window.Toast.show('Purchase Order deleted.', 'info');
          this.activePOId = null;
          this.render();
        }
      });
    },

    promptPOModal(poId = null) {
      const existing = poId ? window.AppStore.getById('purchaseOrders', poId) : null;
      const vendors = window.AppStore.getAll('customers');
      const catalogItems = window.AppStore.getAll('items');
      const isEdit = !!existing;

      const poNum = existing ? existing.number : window.AppStore.getNextNumber('po');
      const today = new Date().toISOString().substring(0, 10);
      const defaultDue = window.Calculator.addDays(today, 21);
      const currentPOS = existing ? (existing.placeOfSupply || 'Karnataka (29)') : 'Karnataka (29)';

      let initialItems = existing && existing.items && existing.items.length > 0
        ? JSON.parse(JSON.stringify(existing.items))
        : [{
            itemId: catalogItems[0] ? catalogItems[0].id : '',
            name: catalogItems[0] ? catalogItems[0].name : 'Raw Material Assembly',
            description: catalogItems[0] ? catalogItems[0].description : '',
            itemType: catalogItems[0] ? catalogItems[0].itemType : 'product',
            hsnCode: catalogItems[0] ? catalogItems[0].hsnCode : '90279090',
            sacCode: catalogItems[0] ? catalogItems[0].sacCode : '',
            quantity: 10,
            rate: 18500.00,
            discountType: 'percent',
            discount: 10.0,
            taxRate: 18.0
          }];

      const indianStates = [
        'Karnataka (29)',
        'Maharashtra (27)',
        'Tamil Nadu (33)',
        'Kerala (32)',
        'Telangana (36)',
        'Gujarat (24)',
        'Delhi (07)',
        'Haryana (06)',
        'West Bengal (19)'
      ];

      const vendorOptions = vendors.map(v => `
        <option value="${v.id}" ${existing && existing.vendorId === v.id ? 'selected' : ''} data-pos="${v.placeOfSupply || 'Karnataka (29)'}" data-attn="${v.attention || ''}">
          ${v.company || v.name} (${v.placeOfSupply || 'Karnataka'})
        </option>
      `).join('');

      const posOptions = indianStates.map(st => `
        <option value="${st}" ${currentPOS === st ? 'selected' : ''}>${st}</option>
      `).join('');

      const contentHtml = `
        <form id="po-editor-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Vendor / Supplier</label>
              <select id="po-vendor" class="input-select" required>
                ${vendorOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Kind Attention (Vendor Contact)</label>
              <input type="text" id="po-attention" class="form-control" value="${existing ? (existing.attention || '') : 'Mr. Rajesh Pillai'}">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Purchase Order #</label>
              <input type="text" id="po-number" class="form-control font-mono" value="${poNum}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Place Of Supply (GST)</label>
              <select id="po-pos" class="input-select font-bold">
                ${posOptions}
              </select>
              <span class="input-help" id="po-gst-type-help" style="color: var(--primary); font-weight: 600;">
                Intra-State: CGST + SGST applicable
              </span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">PO Date</label>
              <input type="date" id="po-date" class="form-control" value="${existing ? existing.date : today}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Delivery Due Date</label>
              <input type="date" id="po-expiry" class="form-control" value="${existing ? existing.dueDate : defaultDue}">
            </div>
          </div>

          <!-- ITEMS EDITOR TABLE -->
          <div style="margin: 1.5rem 0;">
            <div class="flex justify-between items-center mb-2">
              <div>
                <h4 class="font-bold text-sm">Purchase Line Items</h4>
                <p class="text-xs text-muted">Material type, HSN/SAC, and dynamic discount</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="po-add-row-btn">+ Add Item</button>
            </div>

            <div class="table-responsive" style="border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table class="data-table" id="po-items-table">
                <thead>
                  <tr>
                    <th style="width: 32%;">Item / Material & Code</th>
                    <th style="width: 8%; text-align: center;">Qty</th>
                    <th style="width: 14%; text-align: right;">Rate (₹)</th>
                    <th style="width: 16%; text-align: center;">Discount</th>
                    <th style="width: 14%; text-align: right;">Taxable Amt</th>
                    <th style="width: 12%; text-align: right;" id="po-table-gst-header">GST Tax</th>
                    <th style="width: 4%; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody id="po-items-body"></tbody>
              </table>
            </div>
          </div>

          <!-- TOTALS -->
          <div class="paper-totals-wrapper" style="margin-bottom: 1.5rem;">
            <div class="paper-totals-box" style="width: 340px;">
              <div class="paper-total-row">
                <span>Gross Amount:</span>
                <span id="po-gross-disp" class="font-semibold">₹ 0.00</span>
              </div>
              <div class="paper-total-row text-success">
                <span>Total Discount:</span>
                <span id="po-disc-disp">-₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Taxable Amount:</span>
                <span id="po-taxable-disp" class="font-bold">₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span id="po-tax-label">CGST + SGST:</span>
                <span id="po-tax-disp">₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Rounding:</span>
                <span id="po-round-disp">0.00</span>
              </div>
              <div class="paper-total-row grand-total">
                <span>Total PO Amount:</span>
                <span id="po-total-disp" class="text-primary font-bold">₹ 0.00</span>
              </div>
              <div class="text-xs text-muted" id="po-words-disp" style="font-style: italic; line-height: 1.3; padding-top: 4px;">
                Total In Words
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Delivery Notes</label>
              <textarea id="po-notes" class="form-control" rows="2">${existing ? existing.notes : 'Please dispatch via Blue Dart Express to our Sulya address.'}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Terms & Conditions</label>
              <textarea id="po-terms" class="form-control" rows="2">${existing ? existing.terms : 'Material subject to QC inspection upon delivery.'}</textarea>
            </div>
          </div>
        </form>
      `;

      let workingItems = initialItems;

      window.Modal.open({
        title: isEdit ? `Edit Purchase Order ${existing.number}` : 'New Vendor Purchase Order (Shreeraksha Format)',
        contentHtml,
        size: '2xl',
        confirmText: isEdit ? 'Save Changes' : 'Issue Purchase Order',
        onRender: (dialog) => {
          const tbody = dialog.querySelector('#po-items-body');
          const addBtn = dialog.querySelector('#po-add-row-btn');
          const posSelect = dialog.querySelector('#po-pos');
          const vendSelect = dialog.querySelector('#po-vendor');
          const attnInput = dialog.querySelector('#po-attention');
          const gstHelp = dialog.querySelector('#po-gst-type-help');
          const gstHeader = dialog.querySelector('#po-table-gst-header');

          vendSelect.addEventListener('change', () => {
            const opt = vendSelect.options[vendSelect.selectedIndex];
            if (opt) {
              const defaultPos = opt.getAttribute('data-pos');
              if (defaultPos) posSelect.value = defaultPos;
              const defaultAttn = opt.getAttribute('data-attn');
              if (defaultAttn) attnInput.value = defaultAttn;
              recalcTotals();
            }
          });

          posSelect.addEventListener('change', () => recalcTotals());

          const renderItemRows = () => {
            tbody.innerHTML = workingItems.map((item, idx) => {
              const itemType = item.itemType || 'product';
              const isService = itemType === 'service';
              const codeVal = isService ? (item.sacCode || '') : (item.hsnCode || '90279090');

              return `
                <tr>
                  <td>
                    <select class="input-select po-item-select" data-index="${idx}" style="width: 100%; margin-bottom: 0.35rem; font-size: 0.775rem;">
                      <option value="">-- Choose from Catalog --</option>
                      ${catalogItems.map(c => `<option value="${c.id}" ${item.itemId === c.id ? 'selected' : ''}>${c.name} (${c.itemType === 'service' ? 'Service/SAC' : 'Product/HSN'})</option>`).join('')}
                    </select>

                    <input type="text" class="form-control po-item-name" data-index="${idx}" value="${item.name}" placeholder="Item name" required style="margin-bottom: 0.25rem;">
                    
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <select class="input-select po-item-type" data-index="${idx}" style="width: 110px; font-size: 0.75rem;">
                        <option value="product" ${itemType === 'product' ? 'selected' : ''}>Product</option>
                        <option value="service" ${itemType === 'service' ? 'selected' : ''}>Service</option>
                      </select>
                      <input type="text" class="form-control font-mono po-item-code" data-index="${idx}" value="${codeVal}" placeholder="${isService ? 'SAC Code' : 'HSN Code'}" style="flex: 1; font-size: 0.75rem;">
                    </div>

                    <input type="text" class="form-control po-item-desc" data-index="${idx}" placeholder="Specifications" value="${item.description || ''}" style="font-size: 0.75rem;">
                  </td>
                  <td>
                    <input type="number" step="0.5" min="0.1" class="form-control po-item-qty" data-index="${idx}" value="${item.quantity}" required>
                  </td>
                  <td>
                    <input type="number" step="0.01" class="form-control po-item-rate" data-index="${idx}" value="${item.rate}" required>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.25rem;">
                      <input type="number" step="0.01" min="0" class="form-control po-item-disc-val" data-index="${idx}" value="${item.discount || 0}" style="flex: 1;">
                      <select class="input-select po-item-disc-type" data-index="${idx}" style="width: 50px; padding: 0.3rem 0.2rem; font-weight: bold;">
                        <option value="percent" ${item.discountType !== 'amount' ? 'selected' : ''}>%</option>
                        <option value="amount" ${item.discountType === 'amount' ? 'selected' : ''}>₹</option>
                      </select>
                    </div>
                  </td>
                  <td class="font-bold text-right po-item-taxable" data-index="${idx}">
                    ₹ 0.00
                  </td>
                  <td class="text-right po-item-gst-tax" data-index="${idx}">
                    <div class="text-xs font-bold po-tax-breakdown">18% GST</div>
                  </td>
                  <td class="text-center">
                    <button type="button" class="icon-btn-ghost btn-sm po-remove-row" data-index="${idx}" style="color: var(--color-overdue);">
                      &times;
                    </button>
                  </td>
                </tr>
              `;
            }).join('');

            recalcTotals();
            attachRowEvents();
          };

          const recalcTotals = () => {
            const isInter = window.Calculator.isInterState(posSelect.value);

            if (isInter) {
              gstHelp.textContent = 'Inter-State Supply: 18% IGST applies';
              gstHelp.style.color = '#2563eb';
              gstHeader.textContent = 'IGST (18%)';
              dialog.querySelector('#po-tax-label').textContent = 'IGST Amount:';
            } else {
              gstHelp.textContent = 'Intra-State Supply (Karnataka): CGST 9% + SGST 9% applies';
              gstHelp.style.color = '#059669';
              gstHeader.textContent = 'CGST+SGST';
              dialog.querySelector('#po-tax-label').textContent = 'CGST + SGST (9%+9%):';
            }

            const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);

            dialog.querySelector('#po-gross-disp').textContent = window.Calculator.formatCurrency(calc.subTotalGross);
            dialog.querySelector('#po-disc-disp').textContent = `- ${window.Calculator.formatCurrency(calc.totalDiscount)}`;
            dialog.querySelector('#po-taxable-disp').textContent = window.Calculator.formatCurrency(calc.totalTaxable);

            const taxSum = isInter ? calc.totalIGST : (calc.totalCGST + calc.totalSGST);
            dialog.querySelector('#po-tax-disp').textContent = window.Calculator.formatCurrency(taxSum);
            dialog.querySelector('#po-round-disp').textContent = calc.rounding.toFixed(2);
            dialog.querySelector('#po-total-disp').textContent = window.Calculator.formatCurrency(calc.roundedTotal);
            dialog.querySelector('#po-words-disp').textContent = calc.totalInWords;

            calc.items.forEach((item, idx) => {
              const taxCell = dialog.querySelector(`.po-item-taxable[data-index="${idx}"]`);
              if (taxCell) taxCell.textContent = window.Calculator.formatCurrency(item.taxableAmount);

              const gstCell = dialog.querySelector(`.po-item-gst-tax[data-index="${idx}"] .po-tax-breakdown`);
              if (gstCell) {
                if (isInter) {
                  gstCell.textContent = `₹ ${window.Calculator.formatNumber(item.igstAmount)} (18%)`;
                } else {
                  gstCell.textContent = `₹ ${window.Calculator.formatNumber(item.cgstAmount + item.sgstAmount)} (9%+9%)`;
                }
              }
            });
          };

          const attachRowEvents = () => {
            dialog.querySelectorAll('.po-item-select').forEach(sel => {
              sel.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const cat = catalogItems.find(c => c.id === e.target.value);
                if (cat) {
                  workingItems[idx].itemId = cat.id;
                  workingItems[idx].name = cat.name;
                  workingItems[idx].description = cat.description;
                  workingItems[idx].itemType = cat.itemType;
                  workingItems[idx].hsnCode = cat.hsnCode;
                  workingItems[idx].sacCode = cat.sacCode;
                  workingItems[idx].rate = cat.rate;
                  renderItemRows();
                }
              });
            });

            dialog.querySelectorAll('.po-item-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const isServ = sel.value === 'service';
                workingItems[idx].itemType = sel.value;
                const codeInp = dialog.querySelector(`.po-item-code[data-index="${idx}"]`);
                if (codeInp) {
                  codeInp.placeholder = isServ ? 'SAC Code' : 'HSN Code';
                  if (!codeInp.value || codeInp.value === '90279090' || codeInp.value === '998313') {
                    codeInp.value = isServ ? '998313' : '90279090';
                    if (isServ) workingItems[idx].sacCode = codeInp.value;
                    else workingItems[idx].hsnCode = codeInp.value;
                  }
                }
              });
            });

            dialog.querySelectorAll('.po-item-code').forEach(inp => {
              inp.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems[idx].itemType === 'service') workingItems[idx].sacCode = e.target.value;
                else workingItems[idx].hsnCode = e.target.value;
              });
            });

            dialog.querySelectorAll('.po-item-name').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].name = e.target.value;
              });
            });

            dialog.querySelectorAll('.po-item-desc').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].description = e.target.value;
              });
            });

            dialog.querySelectorAll('.po-item-qty').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].quantity = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.po-item-rate').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].rate = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.po-item-disc-val').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].discount = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.po-item-disc-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                workingItems[e.target.dataset.index].discountType = sel.value;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.po-remove-row').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems.length > 1) {
                  workingItems.splice(idx, 1);
                  renderItemRows();
                } else {
                  window.Toast.show('PO must have at least one line item.', 'warning');
                }
              });
            });
          };

          addBtn.addEventListener('click', () => {
            const first = catalogItems[0] || { name: 'Item', rate: 1000, hsnCode: '90279090', itemType: 'product' };
            workingItems.push({
              itemId: first.id || '',
              name: first.name,
              description: first.description || '',
              itemType: first.itemType || 'product',
              hsnCode: first.hsnCode || '90279090',
              sacCode: first.sacCode || '',
              quantity: 1,
              rate: first.rate || 1000,
              discountType: 'percent',
              discount: 0,
              taxRate: 18.0
            });
            renderItemRows();
          });

          renderItemRows();
        },
        onConfirm: () => {
          const number = document.getElementById('po-number').value.trim();
          const vendorId = document.getElementById('po-vendor').value;
          const attention = document.getElementById('po-attention').value.trim();
          const placeOfSupply = document.getElementById('po-pos').value;
          const date = document.getElementById('po-date').value;
          const dueDate = document.getElementById('po-expiry').value;

          if (!number || !vendorId || !date) {
            window.Toast.show('PO #, Vendor, and Date are required.', 'error');
            return false;
          }

          // Auto-save any newly typed or modified materials into Material Master Catalog (Task 5)
          if (window.AppStore && window.AppStore.syncLineMaterials) {
            window.AppStore.syncLineMaterials(workingItems);
          }

          const isInter = window.Calculator.isInterState(placeOfSupply);
          const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);

          const poData = {
            number,
            vendorId,
            customerId: vendorId,
            attention,
            placeOfSupply,
            date,
            dueDate,
            status: existing ? existing.status : 'issued',
            items: workingItems,
            subtotal: calc.subTotalGross,
            discountTotal: calc.totalDiscount,
            taxTotal: calc.totalCGST + calc.totalSGST + calc.totalIGST,
            rounding: calc.rounding,
            total: calc.roundedTotal,
            notes: document.getElementById('po-notes').value.trim(),
            terms: document.getElementById('po-terms').value.trim()
          };

          if (isEdit) {
            window.AppStore.update('purchaseOrders', poId, poData);
            window.Toast.show('Purchase Order updated successfully!', 'success');
          } else {
            const created = window.AppStore.add('purchaseOrders', poData);
            this.activePOId = created.id;
            window.Toast.show(`Purchase Order ${number} issued successfully!`, 'success');
          }

          this.render();
          return true;
        }
      });
    }
  };

  window.PurchaseOrdersView = PurchaseOrdersView;

})(window);
