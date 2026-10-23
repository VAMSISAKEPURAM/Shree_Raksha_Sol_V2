/**
 * ZOHO INVOICE - TAX INVOICES MODULE (SHREERAKSHA EXACT PRINT REPLICA)
 * Dynamic Discount (% and Amount), Place of Supply GST auto-switch (CGST+SGST vs IGST),
 * HSN/SAC codes, and Payment Recording engine.
 */

(function (window) {
  'use strict';

  const InvoicesView = {
    activeInvoiceId: null,
    filterStatus: 'all',
    searchQuery: '',

    render(invoiceIdToOpen = null) {
      const container = document.getElementById('app-view');
      if (!container) return;

      const invoices = window.AppStore.getAll('invoices');

      let filtered = invoices.filter(inv => {
        if (this.filterStatus !== 'all' && inv.status !== this.filterStatus) return false;
        if (!this.searchQuery) return true;
        const q = this.searchQuery.toLowerCase();
        const cust = window.AppStore.getById('customers', inv.customerId);
        return (
          (inv.number && inv.number.toLowerCase().includes(q)) ||
          (cust && cust.name && cust.name.toLowerCase().includes(q)) ||
          (inv.placeOfSupply && inv.placeOfSupply.toLowerCase().includes(q))
        );
      });

      if (invoiceIdToOpen) {
        this.activeInvoiceId = invoiceIdToOpen;
      } else if (!this.activeInvoiceId && filtered.length > 0) {
        this.activeInvoiceId = filtered[0].id;
      } else if (filtered.length > 0 && !filtered.some(i => i.id === this.activeInvoiceId)) {
        this.activeInvoiceId = filtered[0].id;
      }

      const activeInvoice = this.activeInvoiceId ? window.AppStore.getById('invoices', this.activeInvoiceId) : null;

      container.innerHTML = `
        <div class="split-view-container animate-fadeIn">
          
          <!-- MASTER (LEFT LIST) PANE -->
          <div class="split-master-pane">
            <div class="master-header">
              <div class="master-header-top">
                <h2 class="master-title-dropdown">All Invoices</h2>
                <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.InvoicesView.promptNewModal()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New Invoice</span>
                </button>
              </div>

              <div class="master-search-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="invoice-search-input" placeholder="Search invoice #, customer, state..." value="${this.searchQuery}">
              </div>

              <div class="master-filter-tabs">
                <button class="filter-tab-pill ${this.filterStatus === 'all' ? 'active' : ''}" onclick="window.InvoicesView.setFilter('all')">All</button>
                <button class="filter-tab-pill ${this.filterStatus === 'draft' ? 'active' : ''}" onclick="window.InvoicesView.setFilter('draft')">Draft</button>
                <button class="filter-tab-pill ${this.filterStatus === 'sent' ? 'active' : ''}" onclick="window.InvoicesView.setFilter('sent')">Sent</button>
                <button class="filter-tab-pill ${this.filterStatus === 'partially_paid' ? 'active' : ''}" onclick="window.InvoicesView.setFilter('partially_paid')">Partial</button>
                <button class="filter-tab-pill ${this.filterStatus === 'paid' ? 'active' : ''}" onclick="window.InvoicesView.setFilter('paid')">Paid</button>
                <button class="filter-tab-pill ${this.filterStatus === 'overdue' ? 'active' : ''}" onclick="window.InvoicesView.setFilter('overdue')">Overdue</button>
              </div>
            </div>

            <div class="master-items-list">
              ${filtered.length === 0 ? `
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                  No invoices found matching criteria.
                </div>
              ` : filtered.map(inv => {
                const cust = window.AppStore.getById('customers', inv.customerId);
                const isActive = inv.id === this.activeInvoiceId;
                const balance = inv.balanceDue != null ? inv.balanceDue : (inv.total - (inv.amountPaid || 0));
                const isInter = window.Calculator.isInterState(inv.placeOfSupply);

                return `
                  <div class="master-item-row ${isActive ? 'active' : ''}" onclick="window.InvoicesView.selectInvoice('${inv.id}')">
                    <div class="master-item-row-top">
                      <span class="item-row-name">${cust ? (cust.company || cust.name) : 'Unknown Customer'}</span>
                      <span class="item-row-amount">${window.Calculator.formatCurrency(inv.total)}</span>
                    </div>
                    <div class="master-item-row-bottom">
                      <span class="item-row-number">${inv.number}</span>
                      <div class="flex items-center gap-1">
                        <span class="badge ${isInter ? 'badge-sent' : 'badge-paid'}" style="font-size: 0.65rem;">
                          ${isInter ? 'IGST' : 'CGST+SGST'}
                        </span>
                        ${balance > 0 ? `<span class="text-xs font-semibold" style="color: var(--color-overdue);">Due: ${window.Calculator.formatCurrency(balance)}</span>` : ''}
                        <span class="badge badge-${inv.status}">${inv.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- DETAIL (RIGHT PREVIEW) PANE -->
          <div class="split-detail-pane">
            ${activeInvoice ? this.renderDetailPane(activeInvoice) : `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                Select an invoice from the left list to view.
              </div>
            `}
          </div>

        </div>
      `;

      // Search input handler
      const searchInput = document.getElementById('invoice-search-input');
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

    selectInvoice(id) {
      this.activeInvoiceId = id;
      this.render();
    },

    openDetail(id) {
      this.activeInvoiceId = id;
      window.location.hash = `#invoices?id=${id}`;
      this.render(id);
    },

    renderDetailPane(inv) {
      const balance = inv.balanceDue != null ? inv.balanceDue : (inv.total - (inv.amountPaid || 0));
      const payments = window.AppStore.getAll('payments').filter(p => p.invoiceId === inv.id);

      return `
        <!-- TOP TOOLBAR -->
        <div class="detail-toolbar">
          <div class="detail-toolbar-left">
            <button class="btn btn-secondary btn-sm btn-icon-gap" title="Toggle List for Full View" onclick="document.querySelector('.split-master-pane').classList.toggle('pane-collapsed');">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              <span>Toggle List</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.InvoicesView.promptNewModal('${inv.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            ${balance > 0 ? `
              <button class="btn btn-success btn-sm btn-icon-gap" onclick="window.InvoicesView.promptPaymentModal('${inv.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <span>Record Payment</span>
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.InvoicesView.simulateEmail('${inv.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>Send Email</span>
            </button>
          </div>

          <div class="detail-toolbar-right">
            <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.print()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print / Download PDF</span>
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.InvoicesView.deleteInvoice('${inv.id}')">
              Delete
            </button>
          </div>
        </div>

        <!-- DOCUMENT CANVAS (SHREERAKSHA EXACT TEMPLATE - ALIGNED & CONSTRAINED) -->
        <div class="detail-content-scroll">
          <div class="invoice-paper-wrapper">
            ${window.GSTDocumentTemplate.render(inv, { docType: 'TAX INVOICE' })}
          </div>
        </div>

        <!-- BOTTOM AUDIT & PAYMENTS -->
        <div class="detail-bottom-tabs">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-sm">Invoice Audit Trail & Payments (${payments.length})</h4>
          </div>
          <div class="timeline-feed">
            ${(inv.history || []).map(h => `
              <div class="timeline-item">
                <div class="timeline-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="timeline-body">
                  <span class="timeline-action">${h.action} &bull; <span class="text-muted font-normal">${h.user || 'User'}</span></span>
                  <span class="timeline-time">${h.date}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    promptPaymentModal(invoiceId) {
      const inv = window.AppStore.getById('invoices', invoiceId);
      if (!inv) return;

      const balance = inv.balanceDue != null ? inv.balanceDue : (inv.total - (inv.amountPaid || 0));
      const today = new Date().toISOString().substring(0, 10);

      const contentHtml = `
        <form id="record-payment-form">
          <div style="background: var(--surface-muted); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border: 1px solid var(--border-light);">
            <div class="flex justify-between items-center text-sm">
              <span class="text-secondary font-medium">Invoice Total:</span>
              <span class="font-bold">${window.Calculator.formatCurrency(inv.total)}</span>
            </div>
            <div class="flex justify-between items-center text-sm" style="margin-top: 0.35rem;">
              <span class="text-secondary font-medium">Current Balance Due:</span>
              <span class="font-bold text-danger text-base">${window.Calculator.formatCurrency(balance)}</span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Amount Received (₹)</label>
              <input type="number" step="0.01" max="${balance}" id="pay-amount" class="form-control" value="${balance.toFixed(2)}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Payment Date</label>
              <input type="date" id="pay-date" class="form-control" value="${today}" required>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Payment Mode</label>
              <select id="pay-mode" class="input-select">
                <option value="bank">NEFT / RTGS / IMPS</option>
                <option value="upi">UPI / QR Payment</option>
                <option value="cheque">Cheque / Demand Draft</option>
                <option value="card">Corporate Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Reference / UTR Number</label>
              <input type="text" id="pay-ref" class="form-control font-mono" placeholder="e.g. SBI-NEFT-992104">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Internal Receipt Notes</label>
            <input type="text" id="pay-notes" class="form-control" placeholder="Payment remarks">
          </div>
        </form>
      `;

      window.Modal.open({
        title: `Record Payment for ${inv.number}`,
        contentHtml,
        size: 'md',
        confirmText: 'Save Payment',
        onConfirm: () => {
          const amount = parseFloat(document.getElementById('pay-amount').value);
          const date = document.getElementById('pay-date').value;
          const mode = document.getElementById('pay-mode').value;
          const ref = document.getElementById('pay-ref').value.trim();
          const notes = document.getElementById('pay-notes').value.trim();

          if (isNaN(amount) || amount <= 0) {
            window.Toast.show('Please enter a valid payment amount.', 'error');
            return false;
          }

          const payNumber = window.AppStore.getNextNumber('payment');
          const newPayment = {
            id: 'pay-' + Date.now(),
            paymentNumber: payNumber,
            date,
            customerId: inv.customerId,
            invoiceId: inv.id,
            invoiceNumber: inv.number,
            amount,
            mode,
            reference: ref,
            notes
          };
          window.AppStore.add('payments', newPayment);

          const newPaid = (inv.amountPaid || 0) + amount;
          const newBalance = Math.max(0, inv.total - newPaid);
          const newStatus = newBalance <= 0.01 ? 'paid' : 'partially_paid';

          const history = inv.history || [];
          history.push({
            date: date + ' ' + new Date().toTimeString().substring(0, 5),
            action: `Payment of ${window.Calculator.formatCurrency(amount)} recorded (${mode.toUpperCase()}${ref ? ` UTR: ${ref}` : ''})`,
            user: 'Admin'
          });

          window.AppStore.update('invoices', inv.id, {
            amountPaid: newPaid,
            balanceDue: newBalance,
            status: newStatus,
            history
          });

          window.Toast.show(`Payment of ${window.Calculator.formatCurrency(amount)} recorded!`, 'success');
          this.render();
          return true;
        }
      });
    },

    simulateEmail(invoiceId) {
      const inv = window.AppStore.getById('invoices', invoiceId);
      if (!inv) return;
      const cust = window.AppStore.getById('customers', inv.customerId);
      const email = cust ? cust.email : 'connect@shreeraksha.in';

      window.Modal.open({
        title: `Email Tax Invoice ${inv.number}`,
        contentHtml: `
          <div class="form-group">
            <label class="form-label required">Recipient Email</label>
            <input type="email" class="form-control" value="${email}" id="send-inv-email">
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-control" value="Tax Invoice ${inv.number} from Shreeraksha Solutions" id="send-inv-subject">
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea class="form-control" rows="4">Dear ${inv.attention || (cust ? cust.name : 'Client')},&#10;&#10;Please find attached Tax Invoice ${inv.number} for ${window.Calculator.formatCurrency(inv.total)}.&#10;&#10;Due Date: ${window.Calculator.formatDate(inv.dueDate)}&#10;&#10;Regards,&#10;Shreeraksha Solutions</textarea>
          </div>
        `,
        confirmText: 'Send Invoice',
        onConfirm: () => {
          window.Toast.show(`Invoice ${inv.number} dispatched to ${email}!`, 'success');
          return true;
        }
      });
    },

    deleteInvoice(invoiceId) {
      window.Modal.confirm({
        title: 'Delete Tax Invoice',
        message: 'Are you sure you want to delete this invoice record?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('invoices', invoiceId);
          window.Toast.show('Invoice deleted.', 'info');
          this.activeInvoiceId = null;
          this.render();
        }
      });
    },

    promptNewModal(opts = {}) {
      const invoiceId = typeof opts === 'string' ? opts : opts.invoiceId;
      const existing = invoiceId ? window.AppStore.getById('invoices', invoiceId) : null;
      const customers = window.AppStore.getAll('customers');
      const catalogItems = window.AppStore.getAll('items');
      const org = window.AppStore.getOrg();
      const isEdit = !!existing;

      if (customers.length === 0) {
        window.Toast.show('Please create a customer first.', 'warning');
        window.location.hash = '#customers';
        return;
      }

      const invNumber = existing ? existing.number : window.AppStore.getNextNumber('invoice');
      const today = new Date().toISOString().substring(0, 10);
      const defaultDue = window.Calculator.addDays(today, 30);
      const currentPOS = existing ? (existing.placeOfSupply || 'Karnataka (29)') : 'Karnataka (29)';

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
            discountType: 'percent',
            discount: 5.0,
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
        'Goa (30)'
      ];

      const customerOptions = customers.map(c => `
        <option value="${c.id}" ${existing && existing.customerId === c.id ? 'selected' : ''} data-pos="${c.placeOfSupply || 'Karnataka (29)'}" data-attn="${c.attention || ''}">
          ${c.company || c.name} (${c.placeOfSupply || 'Karnataka'})
        </option>
      `).join('');

      const posOptions = indianStates.map(st => `
        <option value="${st}" ${currentPOS === st ? 'selected' : ''}>${st}</option>
      `).join('');

      const contentHtml = `
        <form id="invoice-editor-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Customer</label>
              <select id="ied-customer" class="input-select" required>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Place Of Supply (GST)</label>
              <select id="ied-pos" class="input-select font-bold">
                ${posOptions}
              </select>
              <span class="input-help" id="ied-gst-type-help" style="color: var(--primary); font-weight: 600;">
                Intra-State: CGST + SGST applicable
              </span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Invoice #</label>
              <input type="text" id="ied-number" class="form-control font-mono" value="${invNumber}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Invoice Date</label>
              <input type="date" id="ied-date" class="form-control" value="${existing ? existing.date : today}" required>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select id="ied-terms-select" class="input-select">
                <option value="100% Advance">100% Advance</option>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="15 Days net">15 Days net</option>
                <option value="30 Days net" selected>30 Days net</option>
                <option value="45 Days net">45 Days net</option>
                <option value="60 Days net">60 Days net</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" id="ied-due-date" class="form-control" value="${existing ? existing.dueDate : defaultDue}">
            </div>
          </div>

          <!-- ITEMS EDITOR TABLE -->
          <div style="margin: 1.5rem 0;">
            <div class="flex justify-between items-center mb-2">
              <div>
                <h4 class="font-bold text-sm">Line Items & GST Breakdown</h4>
                <p class="text-xs text-muted">Material type (Product HSN / Service SAC) & Dynamic Discount (% or ₹)</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="ied-add-row-btn">+ Add Row</button>
            </div>

            <div class="table-responsive" style="border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <table class="data-table" id="ied-items-table">
                <thead>
                  <tr>
                    <th style="width: 32%;">Material & Code</th>
                    <th style="width: 8%; text-align: center;">Qty</th>
                    <th style="width: 14%; text-align: right;">Rate (₹)</th>
                    <th style="width: 16%; text-align: center;">Discount</th>
                    <th style="width: 14%; text-align: right;">Taxable Amt</th>
                    <th style="width: 12%; text-align: right;" id="ied-table-gst-header">GST Tax</th>
                    <th style="width: 4%; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody id="ied-items-body">
                  <!-- Row items rendered dynamically -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- TOTALS -->
          <div class="paper-totals-wrapper" style="margin-bottom: 1.5rem;">
            <div class="paper-totals-box" style="width: 340px;">
              <div class="paper-total-row">
                <span>Gross Amount:</span>
                <span id="ied-gross-disp" class="font-semibold">₹ 0.00</span>
              </div>
              <div class="paper-total-row text-success">
                <span>Total Discount:</span>
                <span id="ied-disc-disp">-₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Taxable Amount:</span>
                <span id="ied-taxable-disp" class="font-bold">₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span id="ied-tax-label">CGST + SGST:</span>
                <span id="ied-tax-disp">₹ 0.00</span>
              </div>
              <div class="paper-total-row">
                <span>Rounding:</span>
                <span id="ied-round-disp">0.00</span>
              </div>
              <div class="paper-total-row grand-total">
                <span>Total Amount:</span>
                <span id="ied-total-disp" class="text-primary font-bold">₹ 0.00</span>
              </div>
              <div class="text-xs text-muted" id="ied-words-disp" style="font-style: italic; line-height: 1.3; padding-top: 4px;">
                Total In Words
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Customer Notes</label>
              <textarea id="ied-notes" class="form-control" rows="2">${existing ? existing.notes : org.defaultNotes}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Terms & Conditions</label>
              <textarea id="ied-terms" class="form-control" rows="2">${existing ? existing.terms : org.defaultTerms}</textarea>
            </div>
          </div>
        </form>
      `;

      let workingItems = initialItems;

      window.Modal.open({
        title: isEdit ? `Edit Tax Invoice ${existing.number}` : 'Create Tax Invoice (Shreeraksha Format)',
        contentHtml,
        size: '2xl',
        confirmText: isEdit ? 'Save Changes' : 'Issue Tax Invoice',
        onRender: (dialog) => {
          const tbody = dialog.querySelector('#ied-items-body');
          const addBtn = dialog.querySelector('#ied-add-row-btn');
          const posSelect = dialog.querySelector('#ied-pos');
          const custSelect = dialog.querySelector('#ied-customer');
          const gstHelp = dialog.querySelector('#ied-gst-type-help');
          const gstHeader = dialog.querySelector('#ied-table-gst-header');

          custSelect.addEventListener('change', () => {
            const opt = custSelect.options[custSelect.selectedIndex];
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
                    <select class="input-select ied-item-select" data-index="${idx}" style="width: 100%; margin-bottom: 0.35rem; font-size: 0.775rem;">
                      <option value="">-- Autofill from Catalog --</option>
                      ${catalogItems.map(c => `<option value="${c.id}" ${item.itemId === c.id ? 'selected' : ''}>${c.name} (${c.itemType === 'service' ? 'Service/SAC' : 'Product/HSN'})</option>`).join('')}
                    </select>

                    <input type="text" class="form-control ied-item-name" data-index="${idx}" value="${item.name}" placeholder="Item name" required style="margin-bottom: 0.25rem;">
                    
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <select class="input-select ied-item-type" data-index="${idx}" style="width: 110px; font-size: 0.75rem;">
                        <option value="product" ${itemType === 'product' ? 'selected' : ''}>Product</option>
                        <option value="service" ${itemType === 'service' ? 'selected' : ''}>Service</option>
                      </select>
                      <input type="text" class="form-control font-mono ied-item-code" data-index="${idx}" value="${codeVal}" placeholder="${isService ? 'SAC Code' : 'HSN Code'}" style="flex: 1; font-size: 0.75rem;">
                    </div>

                    <input type="text" class="form-control ied-item-desc" data-index="${idx}" placeholder="Specifications" value="${item.description || ''}" style="font-size: 0.75rem;">
                  </td>
                  <td>
                    <input type="number" step="0.5" min="0.1" class="form-control ied-item-qty" data-index="${idx}" value="${item.quantity}" required>
                  </td>
                  <td>
                    <input type="number" step="0.01" class="form-control ied-item-rate" data-index="${idx}" value="${item.rate}" required>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.25rem;">
                      <input type="number" step="0.01" min="0" class="form-control ied-item-disc-val" data-index="${idx}" value="${item.discount || 0}" style="flex: 1;">
                      <select class="input-select ied-item-disc-type" data-index="${idx}" style="width: 50px; padding: 0.3rem 0.2rem; font-weight: bold;">
                        <option value="percent" ${item.discountType !== 'amount' ? 'selected' : ''}>%</option>
                        <option value="amount" ${item.discountType === 'amount' ? 'selected' : ''}>₹</option>
                      </select>
                    </div>
                  </td>
                  <td class="font-bold text-right ied-item-taxable" data-index="${idx}">
                    ₹ 0.00
                  </td>
                  <td class="text-right ied-item-gst-tax" data-index="${idx}">
                    <div class="text-xs font-bold ied-tax-breakdown">18% GST</div>
                  </td>
                  <td class="text-center">
                    <button type="button" class="icon-btn-ghost btn-sm ied-remove-row" data-index="${idx}" style="color: var(--color-overdue);">
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
              dialog.querySelector('#ied-tax-label').textContent = 'IGST Amount:';
            } else {
              gstHelp.textContent = 'Intra-State Supply (Karnataka): CGST 9% + SGST 9% applies';
              gstHelp.style.color = '#059669';
              gstHeader.textContent = 'CGST+SGST';
              dialog.querySelector('#ied-tax-label').textContent = 'CGST + SGST (9%+9%):';
            }

            const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);

            dialog.querySelector('#ied-gross-disp').textContent = window.Calculator.formatCurrency(calc.subTotalGross);
            dialog.querySelector('#ied-disc-disp').textContent = `- ${window.Calculator.formatCurrency(calc.totalDiscount)}`;
            dialog.querySelector('#ied-taxable-disp').textContent = window.Calculator.formatCurrency(calc.totalTaxable);

            const taxSum = isInter ? calc.totalIGST : (calc.totalCGST + calc.totalSGST);
            dialog.querySelector('#ied-tax-disp').textContent = window.Calculator.formatCurrency(taxSum);
            dialog.querySelector('#ied-round-disp').textContent = calc.rounding.toFixed(2);
            dialog.querySelector('#ied-total-disp').textContent = window.Calculator.formatCurrency(calc.roundedTotal);
            dialog.querySelector('#ied-words-disp').textContent = calc.totalInWords;

            calc.items.forEach((item, idx) => {
              const taxCell = dialog.querySelector(`.ied-item-taxable[data-index="${idx}"]`);
              if (taxCell) taxCell.textContent = window.Calculator.formatCurrency(item.taxableAmount);

              const gstCell = dialog.querySelector(`.ied-item-gst-tax[data-index="${idx}"] .ied-tax-breakdown`);
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
            dialog.querySelectorAll('.ied-item-select').forEach(sel => {
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

            dialog.querySelectorAll('.ied-item-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const isServ = sel.value === 'service';
                workingItems[idx].itemType = sel.value;
                const codeInp = dialog.querySelector(`.ied-item-code[data-index="${idx}"]`);
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

            dialog.querySelectorAll('.ied-item-code').forEach(inp => {
              inp.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems[idx].itemType === 'service') {
                  workingItems[idx].sacCode = e.target.value;
                } else {
                  workingItems[idx].hsnCode = e.target.value;
                }
              });
            });

            dialog.querySelectorAll('.ied-item-name').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].name = e.target.value;
              });
            });

            dialog.querySelectorAll('.ied-item-desc').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].description = e.target.value;
              });
            });

            dialog.querySelectorAll('.ied-item-qty').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].quantity = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.ied-item-rate').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].rate = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.ied-item-disc-val').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingItems[e.target.dataset.index].discount = parseFloat(e.target.value) || 0;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.ied-item-disc-type').forEach(sel => {
              sel.addEventListener('change', (e) => {
                workingItems[e.target.dataset.index].discountType = sel.value;
                recalcTotals();
              });
            });

            dialog.querySelectorAll('.ied-remove-row').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (workingItems.length > 1) {
                  workingItems.splice(idx, 1);
                  renderItemRows();
                } else {
                  window.Toast.show('An invoice must have at least one line item.', 'warning');
                }
              });
            });
          };

          addBtn.addEventListener('click', () => {
            const first = catalogItems[0] || { name: 'ZODIAC C18', rate: 39286.00, hsnCode: '90279090', itemType: 'product' };
            workingItems.push({
              itemId: first.id || '',
              name: first.name,
              description: first.description || '',
              itemType: first.itemType || 'product',
              hsnCode: first.hsnCode || '90279090',
              sacCode: first.sacCode || '',
              quantity: 1,
              rate: first.rate || 39286.00,
              discountType: 'percent',
              discount: 5.0,
              taxRate: 18.0
            });
            renderItemRows();
          });

          renderItemRows();
        },
        onConfirm: () => {
          const number = document.getElementById('ied-number').value.trim();
          const customerId = document.getElementById('ied-customer').value;
          const placeOfSupply = document.getElementById('ied-pos').value;
          const date = document.getElementById('ied-date').value;
          const dueDate = document.getElementById('ied-due-date').value;
          const paymentTerms = document.getElementById('ied-terms-select').value;

          if (!number || !customerId || !date) {
            window.Toast.show('Invoice #, customer, and date are required.', 'error');
            return false;
          }

          // Auto-save any newly typed or modified materials into Material Master Catalog (Task 5)
          if (window.AppStore && window.AppStore.syncLineMaterials) {
            window.AppStore.syncLineMaterials(workingItems);
          }

          const isInter = window.Calculator.isInterState(placeOfSupply);
          const calc = window.Calculator.computeGSTDocumentTotals(workingItems, isInter, 0);
          const currentPaid = existing ? (existing.amountPaid || 0) : 0;
          const balanceDue = Math.max(0, calc.roundedTotal - currentPaid);

          let status = existing ? existing.status : 'sent';
          if (balanceDue <= 0.01) {
            status = 'paid';
          } else if (currentPaid > 0) {
            status = 'partially_paid';
          }

          const invoiceData = {
            number,
            customerId,
            attention: '',
            placeOfSupply,
            date,
            dueDate,
            paymentTerms,
            status,
            items: workingItems,
            subtotal: calc.subTotalGross,
            discountTotal: calc.totalDiscount,
            taxTotal: calc.totalCGST + calc.totalSGST + calc.totalIGST,
            rounding: calc.rounding,
            total: calc.roundedTotal,
            amountPaid: currentPaid,
            balanceDue,
            notes: document.getElementById('ied-notes').value.trim(),
            terms: document.getElementById('ied-terms').value.trim(),
            history: existing ? (existing.history || []) : [
              { date: date + ' 10:00', action: `Tax Invoice ${number} generated`, user: 'Admin' }
            ]
          };

          if (isEdit) {
            window.AppStore.update('invoices', invoiceId, invoiceData);
            window.Toast.show('Tax invoice updated successfully!', 'success');
          } else {
            const created = window.AppStore.add('invoices', invoiceData);
            this.activeInvoiceId = created.id;
            window.Toast.show(`Tax invoice ${number} generated successfully!`, 'success');
          }

          this.render();
          return true;
        }
      });
    }
  };

  window.InvoicesView = InvoicesView;

})(window);
