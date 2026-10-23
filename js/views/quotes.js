/**
 * ZOHO INVOICE - QUOTATIONS MODULE (SHREERAKSHA EXACT PRINT REPLICA)
 * Dynamic Discount (% and Amount), Place of Supply GST auto-switch (CGST+SGST vs IGST),
 * HSN/SAC codes, and One-Click "Convert to Invoice".
 */

(function (window) {
  'use strict';

  const QuotesView = {
    activeQuoteId: null,
    filterStatus: 'all',
    searchQuery: '',

    render(quoteIdToOpen = null) {
      const container = document.getElementById('app-view');
      if (!container) return;

      const estimates = window.AppStore.getAll('estimates');
      const counterEl = document.getElementById('nav-count-quotes');
      if (counterEl) counterEl.textContent = estimates.length;

      // Filter estimates
      let filtered = estimates.filter(e => {
        if (this.filterStatus !== 'all' && e.status !== this.filterStatus) return false;
        if (!this.searchQuery) return true;
        const q = this.searchQuery.toLowerCase();
        const cust = window.AppStore.getById('customers', e.customerId);
        return (
          (e.number && e.number.toLowerCase().includes(q)) ||
          (cust && cust.name && cust.name.toLowerCase().includes(q)) ||
          (e.placeOfSupply && e.placeOfSupply.toLowerCase().includes(q))
        );
      });

      if (quoteIdToOpen) {
        this.activeQuoteId = quoteIdToOpen;
      } else if (!this.activeQuoteId && filtered.length > 0) {
        this.activeQuoteId = filtered[0].id;
      } else if (filtered.length > 0 && !filtered.some(e => e.id === this.activeQuoteId)) {
        this.activeQuoteId = filtered[0].id;
      }

      const activeQuote = this.activeQuoteId ? window.AppStore.getById('estimates', this.activeQuoteId) : null;

      container.innerHTML = `
        <div class="split-view-container animate-fadeIn">
          
          <!-- MASTER LEFT PANE -->
          <div class="split-master-pane">
            <div class="master-header">
              <div class="master-header-top">
                <h2 class="master-title-dropdown">All Quotations</h2>
                <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.QuotesView.promptQuoteModal()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New Quote</span>
                </button>
              </div>

              <div class="master-search-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="quote-search-input" placeholder="Search quote #, customer, state..." value="${this.searchQuery}">
              </div>

              <div class="master-filter-tabs">
                <button class="filter-tab-pill ${this.filterStatus === 'all' ? 'active' : ''}" onclick="window.QuotesView.setFilter('all')">All</button>
                <button class="filter-tab-pill ${this.filterStatus === 'draft' ? 'active' : ''}" onclick="window.QuotesView.setFilter('draft')">Draft</button>
                <button class="filter-tab-pill ${this.filterStatus === 'sent' ? 'active' : ''}" onclick="window.QuotesView.setFilter('sent')">Sent</button>
                <button class="filter-tab-pill ${this.filterStatus === 'accepted' ? 'active' : ''}" onclick="window.QuotesView.setFilter('accepted')">Accepted</button>
                <button class="filter-tab-pill ${this.filterStatus === 'invoiced' ? 'active' : ''}" onclick="window.QuotesView.setFilter('invoiced')">Invoiced</button>
              </div>
            </div>

            <div class="master-items-list">
              ${filtered.length === 0 ? `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                  No quotations found matching criteria.
                </div>
              ` : filtered.map(quote => {
                const cust = window.AppStore.getById('customers', quote.customerId);
                const isActive = quote.id === this.activeQuoteId;
                const isInter = window.Calculator.isInterState(quote.placeOfSupply);
                const calc = window.Calculator.computeGSTDocumentTotals(quote.items || [], isInter, 0);

                return `
                  <div class="master-item-row ${isActive ? 'active' : ''}" onclick="window.QuotesView.selectQuote('${quote.id}')">
                    <div class="master-item-row-top">
                      <span class="item-row-name">${cust ? (cust.company || cust.name) : 'Unknown'}</span>
                      <span class="item-row-amount">${window.Calculator.formatCurrency(calc.roundedTotal)}</span>
                    </div>
                    <div class="master-item-row-bottom">
                      <span class="item-row-number">${quote.number}</span>
                      <div class="flex items-center gap-1">
                        <span class="badge ${isInter ? 'badge-sent' : 'badge-paid'}" style="font-size: 0.65rem;">
                          ${isInter ? 'IGST' : 'CGST+SGST'}
                        </span>
                        <span class="badge badge-${quote.status}">${quote.status}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- DETAIL RIGHT PANE -->
          <div class="split-detail-pane">
            ${activeQuote ? this.renderDetailPane(activeQuote) : `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                Select a quotation from the left to view.
              </div>
            `}
          </div>

        </div>
      `;

      // Search input handler
      const searchInput = document.getElementById('quote-search-input');
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

    selectQuote(id) {
      this.activeQuoteId = id;
      this.render();
    },

    renderDetailPane(quote) {
      return `
        <!-- TOOLBAR -->
        <!-- TOOLBAR -->
        <div class="detail-toolbar">
          <div class="detail-toolbar-left">
            <button class="btn btn-secondary btn-sm btn-icon-gap" title="Toggle List for Full View" onclick="document.querySelector('.split-master-pane').classList.toggle('pane-collapsed');">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              <span>Toggle List</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.QuotesView.promptQuoteModal('${quote.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.QuotesView.convertToInvoice('${quote.id}')" title="Generate Tax Invoice from this Quotation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>Convert to Invoice</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.QuotesView.simulateSend('${quote.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>Send Email</span>
            </button>
          </div>

          <div class="detail-toolbar-right">
            <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.print()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print / Download PDF</span>
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.QuotesView.deleteQuote('${quote.id}')">
              Delete
            </button>
          </div>
        </div>

        <!-- DOCUMENT CANVAS (SHREERAKSHA EXACT TEMPLATE - ALIGNED & CONSTRAINED) -->
        <div class="detail-content-scroll">
          <div class="invoice-paper-wrapper">
            ${window.GSTDocumentTemplate.render(quote, { docType: 'QUOTATION' })}
          </div>
        </div>
      `;
    },

    convertToInvoice(quoteId) {
      const quote = window.AppStore.getById('estimates', quoteId);
      if (!quote) return;

      window.Modal.confirm({
        title: 'Convert Quotation to Tax Invoice',
        message: `Would you like to generate an official Tax Invoice for Quotation ${quote.number}? All HSN/SAC codes, dynamic discounts, and GST columns will be replicated.`,
        confirmText: 'Generate Tax Invoice',
        onConfirm: () => {
          const invNumber = window.AppStore.getNextNumber('invoice');
          const today = new Date().toISOString().substring(0, 10);
          const dueDate = window.Calculator.addDays(today, 30);
          const isInter = window.Calculator.isInterState(quote.placeOfSupply);
          const calc = window.Calculator.computeGSTDocumentTotals(quote.items || [], isInter, 0);

          const newInvoice = {
            id: 'inv-' + Date.now(),
            number: invNumber,
            customerId: quote.customerId,
            attention: quote.attention,
            date: today,
            dueDate: dueDate,
            placeOfSupply: quote.placeOfSupply,
            paymentTerms: quote.paymentTerms || '30 Days net',
            status: 'sent',
            items: JSON.parse(JSON.stringify(quote.items || [])),
            subtotal: calc.subTotalGross,
            discountTotal: calc.totalDiscount,
            taxTotal: calc.totalCGST + calc.totalSGST + calc.totalIGST,
            rounding: calc.rounding,
            total: calc.roundedTotal,
            amountPaid: 0,
            balanceDue: calc.roundedTotal,
            notes: quote.notes,
            terms: quote.terms,
            history: [
              { date: today + ' 10:00', action: `Converted from Quotation ${quote.number}`, user: 'Admin' }
            ]
          };

          window.AppStore.add('invoices', newInvoice);
          window.AppStore.update('estimates', quote.id, { status: 'invoiced' });
          window.Toast.show(`Created Tax Invoice ${invNumber} from Quotation!`, 'success');

          // Route to invoices
          window.location.hash = `#invoices?id=${newInvoice.id}`;
        }
      });
    },

    simulateSend(quoteId) {
      const quote = window.AppStore.getById('estimates', quoteId);
      if (!quote) return;
      const cust = window.AppStore.getById('customers', quote.customerId);
      const email = cust ? cust.email : 'connect@shreeraksha.in';

      window.Modal.open({
        title: `Email Quotation ${quote.number}`,
        contentHtml: `
          <div class="form-group">
            <label class="form-label required">Recipient Email</label>
            <input type="email" class="form-control" value="${email}" id="send-quote-email">
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-control" value="Quotation ${quote.number} from Shreeraksha Solutions" id="send-quote-subject">
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea class="form-control" rows="4">Dear ${quote.attention || (cust ? cust.name : 'Sir/Madam')},&#10;&#10;Please find attached our official GST quotation ${quote.number}.&#10;&#10;Kind Attention: ${quote.attention || 'Purchase Department'}&#10;&#10;Best regards,&#10;Shreeraksha Solutions</textarea>
          </div>
        `,
        confirmText: 'Send Email',
        onConfirm: () => {
          window.AppStore.update('estimates', quoteId, { status: 'sent' });
          window.Toast.show(`Quotation ${quote.number} dispatched to ${email}!`, 'success');
          this.render();
          return true;
        }
      });
    },

    deleteQuote(quoteId) {
      window.Modal.confirm({
        title: 'Delete Quotation',
        message: 'Are you sure you want to delete this quotation?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('estimates', quoteId);
          window.Toast.show('Quotation deleted.', 'info');
          this.activeQuoteId = null;
          this.render();
        }
      });
    },

    promptQuoteModal(quoteId = null) {
      let existing = null;
      let preselectedCustomerId = null;
      if (typeof quoteId === 'string') {
        existing = window.AppStore.getById('estimates', quoteId);
      } else if (typeof quoteId === 'object' && quoteId !== null) {
        if (quoteId.customerId) {
          preselectedCustomerId = quoteId.customerId;
        }
        if (quoteId.id) {
          existing = quoteId;
        }
      }

      const customers = window.AppStore.getAll('customers');
      const catalogItems = window.AppStore.getAll('items');
      const org = window.AppStore.getOrg();
      const isEdit = !!existing;

      if (customers.length === 0) {
        window.Toast.show('Please create at least one customer first.', 'warning');
        window.location.hash = '#customers';
        return;
      }

      // Locked Prefix and Editable 3-Digit Suffix Logic (SHRKS/Qtn/26-27/024)
      const lockedPrefix = 'SHRKS/Qtn/26-27/';
      const rawQuoteNum = existing ? existing.number : window.AppStore.getNextNumber('estimate');
      let suffixDigits = '024';

      if (rawQuoteNum) {
        const numMatch = String(rawQuoteNum).match(/^(.*\/)?(\d{1,4})$/);
        if (numMatch && numMatch[2]) {
          suffixDigits = numMatch[2].padStart(3, '0').slice(-3);
        } else {
          const digitsOnly = String(rawQuoteNum).replace(/\D/g, '');
          suffixDigits = digitsOnly ? digitsOnly.slice(-3).padStart(3, '0') : '024';
        }
      }

      const today = new Date().toISOString().substring(0, 10);
      const defaultExpiry = window.Calculator.addDays(today, 60);

      let initialItems = existing && existing.items && existing.items.length > 0
        ? JSON.parse(JSON.stringify(existing.items))
        : [{
            itemId: catalogItems[0] ? catalogItems[0].id : '',
            name: catalogItems[0] ? catalogItems[0].name : 'ZODIAC C18',
            description: catalogItems[0] ? catalogItems[0].description : '250mmx4.6mm, 5µm',
            itemType: catalogItems[0] ? catalogItems[0].itemType : 'product',
            hsnCode: catalogItems[0] ? catalogItems[0].hsnCode : '90279090',
            sacCode: catalogItems[0] ? catalogItems[0].sacCode : '',
            quantity: 1,
            rate: catalogItems[0] ? catalogItems[0].rate : 39286.00,
            discountType: 'percent', // 'percent' or 'amount'
            discount: 5.00,
            taxRate: 18.0
          }];

      const indianStates = [
        'Karnataka (29)',
        'Maharashtra (27)',
        'Tamil Nadu (33)',
        'Kerala (32)',
        'Telangana (36)',
        'Andhra Pradesh (37)',
        'Gujarat (24)',
        'Delhi (07)',
        'Uttar Pradesh (09)',
        'Haryana (06)',
        'West Bengal (19)',
        'Rajasthan (08)',
        'Madhya Pradesh (23)',
        'Goa (30)'
      ];

      const currentPOS = existing ? (existing.placeOfSupply || 'Karnataka (29)') : 'Karnataka (29)';
      const targetCustId = existing ? existing.customerId : (preselectedCustomerId || (customers[0] ? customers[0].id : ''));

      const customerOptions = customers.map(c => `
        <option value="${c.id}" ${targetCustId === c.id ? 'selected' : ''} data-pos="${c.placeOfSupply || 'Karnataka (29)'}" data-attn="${c.attention || ''}">
          ${c.company || c.name} (${c.placeOfSupply || 'Karnataka'})
        </option>
      `).join('');

      const posOptions = indianStates.map(st => `
        <option value="${st}" ${currentPOS === st ? 'selected' : ''}>${st}</option>
      `).join('');

      const contentHtml = `
        <form id="quote-editor-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Customer</label>
              <select id="qed-customer" class="input-select" required>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Kind Attention</label>
              <input type="text" id="qed-attention" class="form-control" value="${existing ? (existing.attention || '') : 'Mr. Sreekar Nayak'}" placeholder="e.g. Mr. Sreekar Nayak">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required" for="qed-number-suffix">Quote#</label>
              <div class="quote-number-input-group" title="Quotation number: only the last 3 digits can be edited">
                <span class="quote-number-prefix" id="qed-number-prefix">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.75;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>${lockedPrefix}</span>
                </span>
                <input type="text" 
                       id="qed-number-suffix" 
                       class="form-control quote-number-suffix font-mono" 
                       value="${suffixDigits}" 
                       maxlength="3" 
                       pattern="[0-9]{3}" 
                       inputmode="numeric" 
                       placeholder="024" 
                       autocomplete="off" 
                       required 
                       title="Only the last 3 digits can be edited">
              </div>
              <input type="hidden" id="qed-number" value="${lockedPrefix}${suffixDigits}">
              <span class="input-help" style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
                <span style="opacity: 0.85;">Prefix locked: <code>${lockedPrefix}</code></span>
                <span style="color: var(--primary); font-weight: 500;">Only last 3 digits editable</span>
              </span>
            </div>
            <div class="form-group">
              <label class="form-label required">Place Of Supply (GST)</label>
              <select id="qed-pos" class="input-select font-bold">
                ${posOptions}
              </select>
              <span class="input-help" id="qed-gst-type-help" style="color: var(--primary); font-weight: 600;">
                Intra-State: CGST + SGST applicable
              </span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Quote Date</label>
              <input type="date" id="qed-date" class="form-control" value="${existing ? existing.date : today}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Expiry Date</label>
              <input type="date" id="qed-expiry" class="form-control" value="${existing ? existing.expiryDate : defaultExpiry}">
            </div>
          </div>

          <!-- LINE ITEMS TABLE -->
          <div style="margin: 1.5rem 0;">
            <div class="flex justify-between items-center mb-2">
              <div>
                <h4 class="font-bold text-sm">Line Items & GST Breakdown</h4>
                <p class="text-xs text-muted">Select Product (HSN) or Service (SAC) & toggle discount between % and ₹ amount</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="qed-add-item-btn">+ Add Line Item</button>
            </div>

            <div class="table-responsive" style="border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table class="data-table" id="qed-items-table">
                <thead>
                  <tr>
                    <th style="width: 32%;">Item / Material & Code</th>
                    <th style="width: 8%; text-align: center;">Qty</th>
                    <th style="width: 14%; text-align: right;">Rate (₹)</th>
                    <th style="width: 16%; text-align: center;">Discount</th>
                    <th style="width: 14%; text-align: right;">Taxable Amt</th>
                    <th style="width: 12%; text-align: right;" id="qed-table-gst-header">GST Tax</th>
                    <th style="width: 4%; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody id="qed-items-body">
                  <!-- Injected dynamically -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- TOTALS SUMMARY -->
          <div class="paper-totals-wrapper" style="margin-bottom: 1.5rem;">
            <div class="paper-totals-box" style="width: 340px;">
              <div class="paper-total-row">
                <span>Gross Amount:</span>
                <span id="qed-gross-disp" class="font-semibold">₹ 0.00</span>
              </div>
              <div class="paper-total-row text-success">
                <span>Total Discount:</span>
                <span id="qed-disc-disp">-₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Taxable Amount:</span>
                <span id="qed-taxable-disp" class="font-bold">₹ 0.00</span>
              </div>
              <div class="paper-total-row" id="qed-cgst-sgst-row">
                <span id="qed-cgst-label">CGST + SGST:</span>
                <span id="qed-tax-disp">₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Rounding:</span>
                <span id="qed-round-disp">0.00</span>
              </div>
              <div class="paper-total-row grand-total">
                <span>Total Amount:</span>
                <span id="qed-total-disp" class="text-primary font-bold">₹ 0.00</span>
              </div>
              <div class="text-xs text-muted" id="qed-words-disp" style="font-style: italic; line-height: 1.3; padding-top: 4px;">
                Total In Words
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea id="qed-notes" class="form-control" rows="2">${existing ? existing.notes : org.defaultNotes}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Terms & Conditions</label>
              <textarea id="qed-terms" class="form-control" rows="2">${existing ? existing.terms : org.defaultTerms}</textarea>
            </div>
          </div>
        </form>
      `;

      let workingItems = initialItems;

      window.Modal.open({
        title: isEdit ? `Edit Quotation ${existing.number}` : 'New GST Quotation (Shreeraksha Format)',
        contentHtml,
        size: '2xl', // Doubled modal size
        confirmText: isEdit ? 'Save Changes' : 'Generate Quotation',
        onRender: (dialog) => {
          const tbody = dialog.querySelector('#qed-items-body');
          const addBtn = dialog.querySelector('#qed-add-item-btn');
          const posSelect = dialog.querySelector('#qed-pos');
          const custSelect = dialog.querySelector('#qed-customer');
          const attnInput = dialog.querySelector('#qed-attention');
          const gstHelp = dialog.querySelector('#qed-gst-type-help');
          const gstHeader = dialog.querySelector('#qed-table-gst-header');
          const suffixInput = dialog.querySelector('#qed-number-suffix');
          const hiddenNumber = dialog.querySelector('#qed-number');
          const prefixSpan = dialog.querySelector('#qed-number-prefix span:last-child');
          const prefixText = prefixSpan ? prefixSpan.textContent.trim() : 'SHRKS/Qtn/26-27/';

          // Auto-sync and sanitize 3-digit suffix for Quotation number
          if (suffixInput && hiddenNumber) {
            suffixInput.addEventListener('input', () => {
              const clean = suffixInput.value.replace(/\D/g, '').slice(0, 3);
              if (suffixInput.value !== clean) {
                suffixInput.value = clean;
              }
              hiddenNumber.value = `${prefixText}${clean}`;
            });

            suffixInput.addEventListener('blur', () => {
              let clean = suffixInput.value.replace(/\D/g, '').slice(0, 3);
              if (clean.length > 0) {
                clean = clean.padStart(3, '0');
                suffixInput.value = clean;
              }
              hiddenNumber.value = `${prefixText}${clean}`;
            });
          }

          // Auto-update Attention and POS on customer change
          custSelect.addEventListener('change', () => {
            const opt = custSelect.options[custSelect.selectedIndex];
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
            const isInter = window.Calculator.isInterState(posSelect.value);

            tbody.innerHTML = workingItems.map((item, idx) => {
              const itemType = item.itemType || 'product';
              const isService = itemType === 'service';
              const codeVal = isService ? (item.sacCode || '') : (item.hsnCode || '90279090');

              return `
                <tr>
                  <td>
                    <!-- CATALOG AUTOFILL -->
                    <select class="input-select qed-item-select" data-index="${idx}" style="width: 100%; margin-bottom: 0.35rem; font-size: 0.775rem;">
                      <option value="">-- Autofill from Catalog --</option>
                      ${catalogItems.map(c => `<option value="${c.id}" ${item.itemId === c.id ? 'selected' : ''}>${c.name} (${c.itemType === 'service' ? 'Service/SAC' : 'Product/HSN'})</option>`).join('')}
                    </select>

                    <input type="text" class="form-control qed-item-name" data-index="${idx}" value="${item.name}" placeholder="Item name" required style="margin-bottom: 0.25rem;">
                    
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <select class="input-select qed-item-type" data-index="${idx}" style="width: 110px; font-size: 0.75rem;">
                        <option value="product" ${itemType === 'product' ? 'selected' : ''}>Product</option>
                        <option value="service" ${itemType === 'service' ? 'selected' : ''}>Service</option>
                      </select>
                      <input type="text" class="form-control font-mono qed-item-code" data-index="${idx}" value="${codeVal}" placeholder="${isService ? 'SAC Code' : 'HSN Code'}" style="flex: 1; font-size: 0.75rem;">
                    </div>

                    <input type="text" class="form-control qed-item-desc" data-index="${idx}" placeholder="Specifications (e.g. 250mmx4.6mm, 5µm)" value="${item.description || ''}" style="font-size: 0.75rem;">
                  </td>
                  <td>
                    <input type="number" step="0.5" min="0.1" class="form-control qed-item-qty" data-index="${idx}" value="${item.quantity}" required>
                  </td>
                  <td>
                    <input type="number" step="0.01" class="form-control qed-item-rate" data-index="${idx}" value="${item.rate}" required>
                  </td>
                  <td>
                    <!-- DYNAMIC DISCOUNT (AMOUNT OR %) -->
                    <div style="display: flex; gap: 0.25rem;">
                      <input type="number" step="0.01" min="0" class="form-control qed-item-disc-val" data-index="${idx}" value="${item.discount || 0}" style="flex: 1;">
                      <select class="input-select qed-item-disc-type" data-index="${idx}" style="width: 50px; padding: 0.3rem 0.2rem; font-weight: bold;">
                        <option value="percent" ${item.discountType !== 'amount' ? 'selected' : ''}>%</option>
                        <option value="amount" ${item.discountType === 'amount' ? 'selected' : ''}>₹</option>
                      </select>
                    </div>
                  </td>
                  <td class="font-bold text-right qed-item-taxable" data-index="${idx}">
                    ₹ 0.00
                  </td>
                  <td class="text-right qed-item-gst-tax" data-index="${idx}">
                    <div class="text-xs font-bold qed-tax-breakdown">18% GST</div>
                  </td>
                  <td class="text-center">
                    <button type="button" class="icon-btn-ghost btn-sm qed-remove-row" data-index="${idx}" style="color: var(--color-overdue);">
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
              dialog.querySelector('#qed-cgst-label').textContent = 'IGST Amount:';
            } else {
              gstHelp.textContent = 'Intra-State Supply (Karnataka): CGST 9% + SGST 9% applies';
              gstHelp.style.color = '#059669';
              gstHeader.textContent = 'CGST+SGST';
              dialog.querySelector('#qed-cgst-label').textContent = 'CGST + SGST (9%+9%):';
            }

            const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);

            dialog.querySelector('#qed-gross-disp').textContent = window.Calculator.formatCurrency(calc.subTotalGross);
            dialog.querySelector('#qed-disc-disp').textContent = `- ${window.Calculator.formatCurrency(calc.totalDiscount)}`;
            dialog.querySelector('#qed-taxable-disp').textContent = window.Calculator.formatCurrency(calc.totalTaxable);

            const taxSum = isInter ? calc.totalIGST : (calc.totalCGST + calc.totalSGST);
            dialog.querySelector('#qed-tax-disp').textContent = window.Calculator.formatCurrency(taxSum);
            dialog.querySelector('#qed-round-disp').textContent = calc.rounding.toFixed(2);
            dialog.querySelector('#qed-total-disp').textContent = window.Calculator.formatCurrency(calc.roundedTotal);
            dialog.querySelector('#qed-words-disp').textContent = calc.totalInWords;

            // Update row taxable and tax text
            calc.items.forEach((item, idx) => {
              const taxCell = dialog.querySelector(`.qed-item-taxable[data-index="${idx}"]`);
              if (taxCell) taxCell.textContent = window.Calculator.formatCurrency(item.taxableAmount);

              const gstCell = dialog.querySelector(`.qed-item-gst-tax[data-index="${idx}"] .qed-tax-breakdown`);
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
            dialog.querySelectorAll('.qed-item-select').forEach(sel => {
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

            dialog.querySelectorAll('.qed-item-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const isServ = sel.value === 'service';
                workingItems[idx].itemType = sel.value;
                const codeInp = dialog.querySelector(`.qed-item-code[data-index="${idx}"]`);
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

            dialog.querySelectorAll('.qed-item-code').forEach(inp => {
              inp.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems[idx].itemType === 'service') {
                  workingItems[idx].sacCode = e.target.value;
                } else {
                  workingItems[idx].hsnCode = e.target.value;
                }
              });
            });

            dialog.querySelectorAll('.qed-item-name').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].name = e.target.value;
              });
            });

            dialog.querySelectorAll('.qed-item-desc').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].description = e.target.value;
              });
            });

            dialog.querySelectorAll('.qed-item-qty').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].quantity = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.qed-item-rate').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].rate = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.qed-item-disc-val').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].discount = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.qed-item-disc-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                workingItems[e.target.dataset.index].discountType = sel.value;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.qed-remove-row').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems.length > 1) {
                  workingItems.splice(idx, 1);
                  renderItemRows();
                } else {
                  window.Toast.show('Quotation requires at least one item.', 'warning');
                }
              });
            });
          };

          addBtn.addEventListener('click', () => {
            const first = catalogItems[0] || { name: 'New Item', rate: 1000, hsnCode: '90279090', itemType: 'product' };
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
              discount: 5.0,
              taxRate: 18.0
            });
            renderItemRows();
          });

          renderItemRows();
        },
        onConfirm: () => {
          const suffixInput = document.getElementById('qed-number-suffix');
          let suffixVal = suffixInput ? suffixInput.value.replace(/\D/g, '').slice(0, 3) : '';
          const prefixSpan = document.getElementById('qed-number-prefix');
          const prefixText = prefixSpan ? (prefixSpan.querySelector('span:last-child') || prefixSpan).textContent.trim() : 'SHRKS/Qtn/26-27/';

          if (!suffixVal) {
            window.Toast.show('Please enter a 3-digit quotation number.', 'error');
            if (suffixInput) suffixInput.focus();
            return false;
          }

          // Auto-pad to 3 digits (e.g., '24' -> '024')
          suffixVal = suffixVal.padStart(3, '0');
          if (suffixInput) suffixInput.value = suffixVal;

          const number = `${prefixText}${suffixVal}`;
          const hiddenNumber = document.getElementById('qed-number');
          if (hiddenNumber) hiddenNumber.value = number;

          const customerId = document.getElementById('qed-customer').value;
          const attention = document.getElementById('qed-attention').value.trim();
          const placeOfSupply = document.getElementById('qed-pos').value;
          const date = document.getElementById('qed-date').value;
          const expiryDate = document.getElementById('qed-expiry').value;

          if (!number || !customerId || !date) {
            window.Toast.show('Quotation #, Customer, and Date are required.', 'error');
            return false;
          }

          const isInter = window.Calculator.isInterState(placeOfSupply);
          const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);

          // Auto-save all materials to Material Master Data
          window.AppStore.syncLineMaterials(workingItems);

          const quoteData = {
            number,
            customerId,
            attention,
            placeOfSupply,
            date,
            expiryDate,
            status: existing ? existing.status : 'draft',
            items: workingItems,
            subtotal: calc.subTotalGross,
            discountTotal: calc.totalDiscount,
            taxTotal: calc.totalCGST + calc.totalSGST + calc.totalIGST,
            rounding: calc.rounding,
            total: calc.roundedTotal,
            notes: document.getElementById('qed-notes').value.trim(),
            terms: document.getElementById('qed-terms').value.trim()
          };

          if (isEdit) {
            window.AppStore.update('estimates', quoteId, quoteData);
            window.Toast.show('Quotation updated successfully!', 'success');
          } else {
            const created = window.AppStore.add('estimates', quoteData);
            this.activeQuoteId = created.id;
            window.Toast.show('Quotation created successfully!', 'success');
          }

          this.render();
          return true;
        }
      });
    },

    promptNewModal() {
      this.promptQuoteModal();
    }
  };

  window.QuotesView = QuotesView;

})(window);
