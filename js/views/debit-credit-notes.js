/**
 * ZOHO INVOICE - DEBIT & CREDIT NOTES MODULE (CUSTOMER & VENDOR)
 * Exact replica of Shreeraksha GST document format for Debit/Credit Notes.
 */

(function (window) {
  'use strict';

  const DebitCreditNotesView = {
    activeNoteId: null,
    filterDocType: 'all', // 'all', 'CREDIT NOTE', 'DEBIT NOTE', 'customer', 'vendor'
    searchQuery: '',

    render(noteIdToOpen = null) {
      const container = document.getElementById('app-view');
      if (!container) return;

      const notes = window.AppStore.getAll('debitCreditNotes');

      let filtered = notes.filter(n => {
        if (this.filterDocType === 'CREDIT NOTE' && n.docType !== 'CREDIT NOTE') return false;
        if (this.filterDocType === 'DEBIT NOTE' && n.docType !== 'DEBIT NOTE') return false;
        if (this.filterDocType === 'customer' && n.partyType !== 'customer') return false;
        if (this.filterDocType === 'vendor' && n.partyType !== 'vendor') return false;

        if (!this.searchQuery) return true;
        const q = this.searchQuery.toLowerCase();
        const party = window.AppStore.getById('customers', n.customerId || n.vendorId || n.partyId);
        return (
          (n.number && n.number.toLowerCase().includes(q)) ||
          (n.originalInvoiceNumber && n.originalInvoiceNumber.toLowerCase().includes(q)) ||
          (party && party.name && party.name.toLowerCase().includes(q))
        );
      });

      if (noteIdToOpen) {
        this.activeNoteId = noteIdToOpen;
      } else if (!this.activeNoteId && filtered.length > 0) {
        this.activeNoteId = filtered[0].id;
      } else if (filtered.length > 0 && !filtered.some(n => n.id === this.activeNoteId)) {
        this.activeNoteId = filtered[0].id;
      }

      const activeNote = this.activeNoteId ? window.AppStore.getById('debitCreditNotes', this.activeNoteId) : null;

      container.innerHTML = `
        <div class="split-view-container animate-fadeIn">
          
          <!-- MASTER LEFT PANE -->
          <div class="split-master-pane">
            <div class="master-header">
              <div class="master-header-top">
                <h2 class="master-title-dropdown">Credit & Debit Notes</h2>
                <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.DebitCreditNotesView.promptNoteModal()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New Note</span>
                </button>
              </div>

              <div class="master-search-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="note-search-input" placeholder="Search note #, inv ref, party..." value="${this.searchQuery}">
              </div>

              <div class="master-filter-tabs">
                <button class="filter-tab-pill ${this.filterDocType === 'all' ? 'active' : ''}" onclick="window.DebitCreditNotesView.setFilter('all')">All</button>
                <button class="filter-tab-pill ${this.filterDocType === 'CREDIT NOTE' ? 'active' : ''}" onclick="window.DebitCreditNotesView.setFilter('CREDIT NOTE')">Credit Notes</button>
                <button class="filter-tab-pill ${this.filterDocType === 'DEBIT NOTE' ? 'active' : ''}" onclick="window.DebitCreditNotesView.setFilter('DEBIT NOTE')">Debit Notes</button>
                <button class="filter-tab-pill ${this.filterDocType === 'customer' ? 'active' : ''}" onclick="window.DebitCreditNotesView.setFilter('customer')">Customer</button>
                <button class="filter-tab-pill ${this.filterDocType === 'vendor' ? 'active' : ''}" onclick="window.DebitCreditNotesView.setFilter('vendor')">Vendor</button>
              </div>
            </div>

            <div class="master-items-list">
              ${filtered.length === 0 ? `
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                  No credit/debit notes found.
                </div>
              ` : filtered.map(note => {
                const party = window.AppStore.getById('customers', note.customerId || note.vendorId || note.partyId);
                const isActive = note.id === this.activeNoteId;
                const isInter = window.Calculator.isInterState(note.placeOfSupply);
                const calc = window.Calculator.computeGSTDocumentTotals(note.items || [], isInter, 0);

                return `
                  <div class="master-item-row ${isActive ? 'active' : ''}" onclick="window.DebitCreditNotesView.selectNote('${note.id}')">
                    <div class="master-item-row-top">
                      <span class="item-row-name">${party ? (party.company || party.name) : 'Party'}</span>
                      <span class="item-row-amount">${window.Calculator.formatCurrency(calc.roundedTotal)}</span>
                    </div>
                    <div class="master-item-row-bottom">
                      <span class="item-row-number">${note.number}</span>
                      <div class="flex items-center gap-1">
                        <span class="badge ${note.docType === 'CREDIT NOTE' ? 'badge-paid' : 'badge-overdue'}" style="font-size: 0.65rem;">
                          ${note.docType}
                        </span>
                        <span class="badge badge-draft" style="font-size: 0.65rem;">
                          ${note.partyType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- DETAIL RIGHT PANE -->
          <div class="split-detail-pane">
            ${activeNote ? this.renderDetailPane(activeNote) : `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                Select a Note to view.
              </div>
            `}
          </div>

        </div>
      `;

      const searchInput = document.getElementById('note-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.render();
        });
      }
    },

    setFilter(filter) {
      this.filterDocType = filter;
      this.render();
    },

    selectNote(id) {
      this.activeNoteId = id;
      this.render();
    },

    renderDetailPane(note) {
      return `
        <div class="detail-toolbar">
          <div class="detail-toolbar-left">
            <button class="btn btn-secondary btn-sm btn-icon-gap" title="Toggle List for Full View" onclick="document.querySelector('.split-master-pane').classList.toggle('pane-collapsed');">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              <span>Toggle List</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.DebitCreditNotesView.promptNoteModal('${note.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit Note</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.Toast.show('Document emailed to party!', 'success')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>Email</span>
            </button>
          </div>

          <div class="detail-toolbar-right">
            <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.print()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print / Download PDF</span>
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.DebitCreditNotesView.deleteNote('${note.id}')">
              Delete
            </button>
          </div>
        </div>

        <div class="detail-content-scroll">
          <div class="invoice-paper-wrapper">
            ${window.GSTDocumentTemplate.render(note, { docType: note.docType, partyType: note.partyType })}
          </div>
        </div>
      `;
    },

    deleteNote(noteId) {
      window.Modal.confirm({
        title: 'Delete Note',
        message: 'Are you sure you want to delete this credit/debit note?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('debitCreditNotes', noteId);
          window.Toast.show('Note deleted.', 'info');
          this.activeNoteId = null;
          this.render();
        }
      });
    },

    promptNoteModal(noteId = null) {
      const existing = noteId ? window.AppStore.getById('debitCreditNotes', noteId) : null;
      const parties = window.AppStore.getAll('customers');
      const catalogItems = window.AppStore.getAll('items');
      const isEdit = !!existing;

      const currentDocType = existing ? existing.docType : 'CREDIT NOTE';
      const currentPartyType = existing ? existing.partyType : 'customer';

      const defaultNum = existing ? existing.number : window.AppStore.getNextNumber(currentDocType === 'CREDIT NOTE' ? 'creditNote' : 'debitNote');
      const today = new Date().toISOString().substring(0, 10);
      const currentPOS = existing ? (existing.placeOfSupply || 'Karnataka (29)') : 'Karnataka (29)';

      let initialItems = existing && existing.items && existing.items.length > 0
        ? JSON.parse(JSON.stringify(existing.items))
        : [{
            itemId: catalogItems[0] ? catalogItems[0].id : '',
            name: catalogItems[0] ? catalogItems[0].name : 'Price Adjustment',
            description: catalogItems[0] ? catalogItems[0].description : '',
            itemType: catalogItems[0] ? catalogItems[0].itemType : 'service',
            hsnCode: '',
            sacCode: '998313',
            quantity: 1,
            rate: 10000.00,
            discountType: 'amount',
            discount: 0,
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
        'Haryana (06)'
      ];

      const partyOptions = parties.map(p => `
        <option value="${p.id}" ${existing && (existing.partyId === p.id || existing.customerId === p.id || existing.vendorId === p.id) ? 'selected' : ''} data-pos="${p.placeOfSupply || 'Karnataka (29)'}" data-attn="${p.attention || ''}">
          ${p.company || p.name} (${p.placeOfSupply || 'Karnataka'})
        </option>
      `).join('');

      const posOptions = indianStates.map(st => `
        <option value="${st}" ${currentPOS === st ? 'selected' : ''}>${st}</option>
      `).join('');

      const contentHtml = `
        <form id="note-editor-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Document Type</label>
              <select id="not-doc-type" class="input-select font-bold" required>
                <option value="CREDIT NOTE" ${currentDocType === 'CREDIT NOTE' ? 'selected' : ''}>CREDIT NOTE</option>
                <option value="DEBIT NOTE" ${currentDocType === 'DEBIT NOTE' ? 'selected' : ''}>DEBIT NOTE</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Party Direction</label>
              <select id="not-party-type" class="input-select font-bold" required>
                <option value="customer" ${currentPartyType === 'customer' ? 'selected' : ''}>Customer Note</option>
                <option value="vendor" ${currentPartyType === 'vendor' ? 'selected' : ''}>Vendor Note</option>
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required" id="not-party-label">${currentPartyType === 'customer' ? 'Customer' : 'Vendor'}</label>
              <select id="not-party" class="input-select" required>
                ${partyOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Place Of Supply (GST)</label>
              <select id="not-pos" class="input-select font-bold">
                ${posOptions}
              </select>
              <span class="input-help" id="not-gst-type-help" style="color: var(--primary); font-weight: 600;">
                Intra-State: CGST + SGST applicable
              </span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Note #</label>
              <input type="text" id="not-number" class="form-control font-mono" value="${defaultNum}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Note Date</label>
              <input type="date" id="not-date" class="form-control" value="${existing ? existing.date : today}" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Original Invoice Reference #</label>
            <input type="text" id="not-orig-inv" class="form-control font-mono" value="${existing ? (existing.originalInvoiceNumber || '') : 'SHRKS/Inv/26-27/019'}" placeholder="e.g. SHRKS/Inv/26-27/019" required>
          </div>

          <div class="form-group">
            <label class="form-label required">Reason for Credit / Debit Note</label>
            <input type="text" id="not-reason" class="form-control" value="${existing ? (existing.reason || '') : 'Sales Volume Rebate / Price Adjustment'}" placeholder="e.g. Rate adjustment, transit defect return" required>
          </div>

          <!-- LINE ITEMS TABLE -->
          <div style="margin: 1.5rem 0;">
            <div class="flex justify-between items-center mb-2">
              <div>
                <h4 class="font-bold text-sm">Adjustment Line Items</h4>
                <p class="text-xs text-muted">Material type, HSN/SAC, and dynamic discount</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="not-add-row-btn">+ Add Item</button>
            </div>

            <div class="table-responsive" style="border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table class="data-table" id="not-items-table">
                <thead>
                  <tr>
                    <th style="width: 32%;">Item / Material & Code</th>
                    <th style="width: 8%; text-align: center;">Qty</th>
                    <th style="width: 14%; text-align: right;">Rate (₹)</th>
                    <th style="width: 16%; text-align: center;">Discount</th>
                    <th style="width: 14%; text-align: right;">Taxable Amt</th>
                    <th style="width: 12%; text-align: right;" id="not-table-gst-header">GST Tax</th>
                    <th style="width: 4%; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody id="not-items-body"></tbody>
              </table>
            </div>
          </div>

          <!-- TOTALS -->
          <div class="paper-totals-wrapper" style="margin-bottom: 1.5rem;">
            <div class="paper-totals-box" style="width: 340px;">
              <div class="paper-total-row">
                <span>Gross Amount:</span>
                <span id="not-gross-disp" class="font-semibold">₹ 0.00</span>
              </div>
              <div class="paper-total-row text-success">
                <span>Total Discount:</span>
                <span id="not-disc-disp">-₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Taxable Amount:</span>
                <span id="not-taxable-disp" class="font-bold">₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span id="not-tax-label">CGST + SGST:</span>
                <span id="not-tax-disp">₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Rounding:</span>
                <span id="not-round-disp">0.00</span>
              </div>
              <div class="paper-total-row grand-total">
                <span>Total Note Amount:</span>
                <span id="not-total-disp" class="text-primary font-bold">₹ 0.00</span>
              </div>
              <div class="text-xs text-muted" id="not-words-disp" style="font-style: italic; line-height: 1.3; padding-top: 4px;">
                Total In Words
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea id="not-notes" class="form-control" rows="2">${existing ? existing.notes : 'Credit/Debit adjustment will be reconciled against referenced invoice account.'}</textarea>
          </div>
        </form>
      `;

      let workingItems = initialItems;

      window.Modal.open({
        title: isEdit ? `Edit Note ${existing.number}` : 'Create Credit / Debit Note (Shreeraksha Format)',
        contentHtml,
        size: '2xl',
        confirmText: isEdit ? 'Save Changes' : 'Issue Note',
        onRender: (dialog) => {
          const tbody = dialog.querySelector('#not-items-body');
          const addBtn = dialog.querySelector('#not-add-row-btn');
          const posSelect = dialog.querySelector('#not-pos');
          const partySelect = dialog.querySelector('#not-party');
          const partyTypeSelect = dialog.querySelector('#not-party-type');
          const partyLabel = dialog.querySelector('#not-party-label');
          const gstHelp = dialog.querySelector('#not-gst-type-help');
          const gstHeader = dialog.querySelector('#not-table-gst-header');

          partyTypeSelect.addEventListener('change', () => {
            partyLabel.textContent = partyTypeSelect.value === 'customer' ? 'Customer' : 'Vendor';
          });

          partySelect.addEventListener('change', () => {
            const opt = partySelect.options[partySelect.selectedIndex];
            if (opt) {
              const defaultPos = opt.getAttribute('data-pos');
              if (defaultPos) posSelect.value = defaultPos;
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
                    <select class="input-select not-item-select" data-index="${idx}" style="width: 100%; margin-bottom: 0.35rem; font-size: 0.775rem;">
                      <option value="">-- Choose from Catalog --</option>
                      ${catalogItems.map(c => `<option value="${c.id}" ${item.itemId === c.id ? 'selected' : ''}>${c.name} (${c.itemType === 'service' ? 'Service/SAC' : 'Product/HSN'})</option>`).join('')}
                    </select>

                    <input type="text" class="form-control not-item-name" data-index="${idx}" value="${item.name}" placeholder="Item name" required style="margin-bottom: 0.25rem;">
                    
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <select class="input-select not-item-type" data-index="${idx}" style="width: 110px; font-size: 0.75rem;">
                        <option value="product" ${itemType === 'product' ? 'selected' : ''}>Product</option>
                        <option value="service" ${itemType === 'service' ? 'selected' : ''}>Service</option>
                      </select>
                      <input type="text" class="form-control font-mono not-item-code" data-index="${idx}" value="${codeVal}" placeholder="${isService ? 'SAC Code' : 'HSN Code'}" style="flex: 1; font-size: 0.75rem;">
                    </div>

                    <input type="text" class="form-control not-item-desc" data-index="${idx}" placeholder="Description / Reason" value="${item.description || ''}" style="font-size: 0.75rem;">
                  </td>
                  <td>
                    <input type="number" step="0.5" min="0.1" class="form-control not-item-qty" data-index="${idx}" value="${item.quantity}" required>
                  </td>
                  <td>
                    <input type="number" step="0.01" class="form-control not-item-rate" data-index="${idx}" value="${item.rate}" required>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.25rem;">
                      <input type="number" step="0.01" min="0" class="form-control not-item-disc-val" data-index="${idx}" value="${item.discount || 0}" style="flex: 1;">
                      <select class="input-select not-item-disc-type" data-index="${idx}" style="width: 50px; padding: 0.3rem 0.2rem; font-weight: bold;">
                        <option value="percent" ${item.discountType !== 'amount' ? 'selected' : ''}>%</option>
                        <option value="amount" ${item.discountType === 'amount' ? 'selected' : ''}>₹</option>
                      </select>
                    </div>
                  </td>
                  <td class="font-bold text-right not-item-taxable" data-index="${idx}">
                    ₹ 0.00
                  </td>
                  <td class="text-right not-item-gst-tax" data-index="${idx}">
                    <div class="text-xs font-bold not-tax-breakdown">18% GST</div>
                  </td>
                  <td class="text-center">
                    <button type="button" class="icon-btn-ghost btn-sm not-remove-row" data-index="${idx}" style="color: var(--color-overdue);">
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
              dialog.querySelector('#not-tax-label').textContent = 'IGST Amount:';
            } else {
              gstHelp.textContent = 'Intra-State Supply (Karnataka): CGST 9% + SGST 9% applies';
              gstHelp.style.color = '#059669';
              gstHeader.textContent = 'CGST+SGST';
              dialog.querySelector('#not-tax-label').textContent = 'CGST + SGST (9%+9%):';
            }

            const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);

            dialog.querySelector('#not-gross-disp').textContent = window.Calculator.formatCurrency(calc.subTotalGross);
            dialog.querySelector('#not-disc-disp').textContent = `- ${window.Calculator.formatCurrency(calc.totalDiscount)}`;
            dialog.querySelector('#not-taxable-disp').textContent = window.Calculator.formatCurrency(calc.totalTaxable);

            const taxSum = isInter ? calc.totalIGST : (calc.totalCGST + calc.totalSGST);
            dialog.querySelector('#not-tax-disp').textContent = window.Calculator.formatCurrency(taxSum);
            dialog.querySelector('#not-round-disp').textContent = calc.rounding.toFixed(2);
            dialog.querySelector('#not-total-disp').textContent = window.Calculator.formatCurrency(calc.roundedTotal);
            dialog.querySelector('#not-words-disp').textContent = calc.totalInWords;

            calc.items.forEach((item, idx) => {
              const taxCell = dialog.querySelector(`.not-item-taxable[data-index="${idx}"]`);
              if (taxCell) taxCell.textContent = window.Calculator.formatCurrency(item.taxableAmount);

              const gstCell = dialog.querySelector(`.not-item-gst-tax[data-index="${idx}"] .not-tax-breakdown`);
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
            dialog.querySelectorAll('.not-item-select').forEach(sel => {
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

            dialog.querySelectorAll('.not-item-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const isServ = sel.value === 'service';
                workingItems[idx].itemType = sel.value;
                const codeInp = dialog.querySelector(`.not-item-code[data-index="${idx}"]`);
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

            dialog.querySelectorAll('.not-item-code').forEach(inp => {
              inp.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems[idx].itemType === 'service') workingItems[idx].sacCode = e.target.value;
                else workingItems[idx].hsnCode = e.target.value;
              });
            });

            dialog.querySelectorAll('.not-item-name').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].name = e.target.value;
              });
            });

            dialog.querySelectorAll('.not-item-desc').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].description = e.target.value;
              });
            });

            dialog.querySelectorAll('.not-item-qty').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].quantity = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.not-item-rate').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].rate = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.not-item-disc-val').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].discount = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.not-item-disc-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                workingItems[e.target.dataset.index].discountType = sel.value;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.not-remove-row').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems.length > 1) {
                  workingItems.splice(idx, 1);
                  renderItemRows();
                } else {
                  window.Toast.show('Note must have at least one line item.', 'warning');
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
              discountType: 'amount',
              discount: 0,
              taxRate: 18.0
            });
            renderItemRows();
          });

          renderItemRows();
        },
        onConfirm: () => {
          const docType = document.getElementById('not-doc-type').value;
          const partyType = document.getElementById('not-party-type').value;
          const partyId = document.getElementById('not-party').value;
          const number = document.getElementById('not-number').value.trim();
          const placeOfSupply = document.getElementById('not-pos').value;
          const date = document.getElementById('not-date').value;
          const originalInvoiceNumber = document.getElementById('not-orig-inv').value.trim();
          const reason = document.getElementById('not-reason').value.trim();

          if (!number || !partyId || !date || !originalInvoiceNumber) {
            window.Toast.show('Note #, Party, Date, and Original Invoice # are required.', 'error');
            return false;
          }

          // Auto-save any newly typed or modified materials into Material Master Catalog (Task 5)
          if (window.AppStore && window.AppStore.syncLineMaterials) {
            window.AppStore.syncLineMaterials(workingItems);
          }

          const isInter = window.Calculator.isInterState(placeOfSupply);
          const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);

          const noteData = {
            docType,
            partyType,
            partyId,
            customerId: partyType === 'customer' ? partyId : '',
            vendorId: partyType === 'vendor' ? partyId : '',
            number,
            attention: '',
            placeOfSupply,
            date,
            originalInvoiceNumber,
            reason,
            status: 'approved',
            items: workingItems,
            subtotal: calc.subTotalGross,
            discountTotal: calc.totalDiscount,
            taxTotal: calc.totalCGST + calc.totalSGST + calc.totalIGST,
            rounding: calc.rounding,
            total: calc.roundedTotal,
            notes: document.getElementById('not-notes').value.trim()
          };

          if (isEdit) {
            window.AppStore.update('debitCreditNotes', noteId, noteData);
            window.Toast.show(`${docType} updated successfully!`, 'success');
          } else {
            const created = window.AppStore.add('debitCreditNotes', noteData);
            this.activeNoteId = created.id;
            window.Toast.show(`${docType} ${number} issued successfully!`, 'success');
          }

          this.render();
          return true;
        }
      });
    }
  };

  window.DebitCreditNotesView = DebitCreditNotesView;

})(window);
