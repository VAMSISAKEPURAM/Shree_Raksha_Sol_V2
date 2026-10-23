/**
 * ZOHO INVOICE - FINANCIAL & MASTERDATA COMPREHENSIVE REPORTS SUITE
 * Complete masterdata reporting with summary & detailed versions, items breakdown,
 * GST taxation (CGST, SGST, IGST), Excel export, and print formatting.
 */

(function (window) {
  'use strict';

  const ReportsView = {
    activeTab: 'invoices_notes', // 'invoices_notes', 'quotations', 'payments', 'aging', 'expenses'
    viewMode: 'summary',         // 'summary', 'detailed', or 'tax'
    searchQuery: '',

    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      container.innerHTML = `
        <div class="reports-page animate-fadeIn">
          
          <!-- TOP HEADER WITH TITLE & ACTION BUTTONS -->
          <div class="flex items-center justify-between mb-4 flex-wrap gap-4 no-print">
            <div>
              <h2 class="text-2xl font-bold" style="color: var(--text-main);">Masterdata Financial Reports</h2>
              <p class="text-sm text-secondary">Complete masterdata analytics with item-level GST breakdowns, Excel export & printable views.</p>
            </div>
            
            <div class="glass-capsule-dock">
              <button class="btn btn-secondary btn-sm btn-icon-gap" onclick="window.ReportsView.exportToExcel()" title="Export complete masterdata table to Excel (.xlsx)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Export to Excel (.xlsx)</span>
              </button>
              <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.ReportsView.printReport()" title="Print complete report table">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <!-- PRIMARY REPORT TABS -->
          <div class="table-card no-print" style="margin-bottom: 1.25rem;">
            <div class="reports-tab-bar" style="padding: 0.65rem 1rem; display: flex; gap: 0.5rem; overflow-x: auto; background-color: var(--surface);">
              <button class="btn btn-sm reports-tab-btn ${this.isInvoiceNotesTab() ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchTab('invoices_notes')">
                Invoices, Debit & Credit Notes
              </button>
              <button class="btn btn-sm reports-tab-btn ${this.activeTab === 'quotations' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchTab('quotations')">
                Quotations Masterdata
              </button>
              <button class="btn btn-sm reports-tab-btn ${this.activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchTab('payments')">
                Payments Received
              </button>
              <button class="btn btn-sm reports-tab-btn ${this.activeTab === 'aging' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchTab('aging')">
                Receivables Ageing
              </button>
              <button class="btn btn-sm reports-tab-btn ${this.activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchTab('expenses')">
                Expenses Summary
              </button>
            </div>
          </div>

          <!-- SECONDARY SUB-CONTROLS (SUMMARY vs DETAILED vs TAX VIEW TOGGLE & SEARCH) -->
          <div class="flex items-center justify-between mb-3 flex-wrap gap-3 no-print">
            <div class="flex items-center gap-2">
              ${this.hasDetailedOption() ? `
                <div class="glass-capsule-dock" style="padding: 3px 6px;">
                  <button class="btn btn-xs reports-tab-btn ${this.viewMode === 'summary' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchViewMode('summary')">
                    Summary View
                  </button>
                  <button class="btn btn-xs reports-tab-btn ${this.viewMode === 'detailed' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchViewMode('detailed')">
                    Detailed Items View
                  </button>
                  ${this.isInvoiceNotesTab() ? `
                    <button class="btn btn-xs reports-tab-btn ${this.viewMode === 'tax' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ReportsView.switchViewMode('tax')">
                      Tax Data View
                    </button>
                  ` : ''}
                </div>
              ` : `
                <span class="text-xs text-secondary font-medium uppercase tracking-wider">Masterdata Ledger</span>
              `}
            </div>

            <div class="flex items-center gap-2">
              <input 
                type="text" 
                id="reports-search-input" 
                class="table-search-input" 
                style="min-width: 260px;"
                placeholder="Search masterdata records..." 
                value="${this.searchQuery}"
              >
            </div>
          </div>

          <!-- ACTIVE REPORT CONTENT -->
          <div id="report-content-container">
            ${this.renderActiveTable()}
          </div>

        </div>
      `;

      const searchInput = document.getElementById('reports-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          const containerEl = document.getElementById('report-content-container');
          if (containerEl) {
            containerEl.innerHTML = this.renderActiveTable();
          }
        });
      }
    },

    isInvoiceNotesTab() {
      return this.activeTab === 'invoices_notes' || this.activeTab === 'invoices' || this.activeTab === 'billing_notes';
    },

    hasDetailedOption() {
      return ['invoices_notes', 'invoices', 'billing_notes', 'quotations'].includes(this.activeTab);
    },

    switchTab(tabKey) {
      if (tabKey === 'invoices' || tabKey === 'billing_notes') {
        tabKey = 'invoices_notes';
      }
      this.activeTab = tabKey;
      if (this.viewMode === 'tax' && !this.isInvoiceNotesTab()) {
        this.viewMode = 'summary';
      }
      this.searchQuery = '';
      this.render();
    },

    switchViewMode(mode) {
      this.viewMode = mode;
      this.render();
    },

    renderActiveTable() {
      if (this.isInvoiceNotesTab()) {
        if (this.viewMode === 'tax') return this.renderTaxDataView();
        if (this.viewMode === 'detailed') return this.renderInvoicesAndNotesDetailed();
        return this.renderInvoicesAndNotesSummary();
      }

      switch (this.activeTab) {
        case 'quotations':
          return this.viewMode === 'detailed' ? this.renderQuotationsDetailed() : this.renderQuotationsSummary();
        case 'payments':
          return this.renderPaymentsMasterdata();
        case 'aging':
          return this.renderReceivablesAgeing();
        case 'expenses':
          return this.renderExpensesMasterdata();
        default:
          return '<p>Select a report tab above.</p>';
      }
    },

    /* ==========================================================================
       1. QUOTATIONS MASTERDATA
       ========================================================================== */
    renderQuotationsSummary() {
      const estimates = window.AppStore.getAll('estimates') || [];
      const q = this.searchQuery.toLowerCase();

      const filtered = estimates.filter(e => {
        if (!q) return true;
        const cust = window.AppStore.getById('customers', e.customerId);
        return (
          (e.number && e.number.toLowerCase().includes(q)) ||
          (cust && cust.name && cust.name.toLowerCase().includes(q)) ||
          (e.placeOfSupply && e.placeOfSupply.toLowerCase().includes(q)) ||
          (e.status && e.status.toLowerCase().includes(q))
        );
      });

      let sumGross = 0, sumDisc = 0, sumTaxable = 0, sumCGST = 0, sumSGST = 0, sumIGST = 0, sumRounding = 0, sumTotal = 0;

      const rows = filtered.map((e, idx) => {
        const cust = window.AppStore.getById('customers', e.customerId) || {};
        const isInter = window.Calculator.isInterState(e.placeOfSupply);
        const calc = window.Calculator.computeGSTDocumentTotals(e.items, isInter, e.adjustment);

        sumGross += calc.subTotalGross;
        sumDisc += calc.totalDiscount;
        sumTaxable += calc.totalTaxable;
        sumCGST += calc.totalCGST;
        sumSGST += calc.totalSGST;
        sumIGST += calc.totalIGST;
        sumRounding += calc.rounding;
        sumTotal += calc.roundedTotal;

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td class="cell-primary font-medium"><a href="#quotes?id=${e.id}" class="customer-name-link">${e.number}</a></td>
            <td>${window.Calculator.formatDate(e.date)}</td>
            <td>${window.Calculator.formatDate(e.expiryDate)}</td>
            <td>${cust.name || 'Valued Client'}</td>
            <td>${e.placeOfSupply || 'Karnataka (29)'}</td>
            <td><code>${cust.taxId || cust.gstin || '29FEAPS4448D1ZA'}</code></td>
            <td>${e.paymentTerms || '30 Days net'}</td>
            <td><span class="badge badge-${e.status || 'draft'}">${(e.status || 'draft').toUpperCase()}</span></td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(calc.subTotalGross)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(calc.totalDiscount)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(calc.totalTaxable)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(calc.totalCGST)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(calc.totalSGST)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(calc.totalIGST)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(calc.rounding)}</td>
            <td class="text-right font-bold" style="color:var(--text-main);">₹ ${window.Calculator.formatNumber(calc.roundedTotal)}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Quotations Masterdata - Summary View</h3>
            <span class="table-count-badge">${filtered.length} Quotations &bull; Total Value: ₹ ${window.Calculator.formatNumber(sumTotal)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Quote #</th>
                  <th>Date</th>
                  <th>Expiry Date</th>
                  <th>Customer Name</th>
                  <th>Place of Supply</th>
                  <th>GSTIN</th>
                  <th>Payment Terms</th>
                  <th>Status</th>
                  <th class="text-right">Gross Amt (₹)</th>
                  <th class="text-right">Discount (₹)</th>
                  <th class="text-right">Taxable Amt (₹)</th>
                  <th class="text-right">CGST (₹)</th>
                  <th class="text-right">SGST (₹)</th>
                  <th class="text-right">IGST (₹)</th>
                  <th class="text-right">Rounding (₹)</th>
                  <th class="text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `<tr><td colspan="17" class="text-center py-4 text-muted">No quotation masterdata found.</td></tr>` : rows}
                ${filtered.length > 0 ? `
                  <tr style="background:var(--surface-muted); font-weight:700;">
                    <td colspan="9" class="text-right">Summary Grand Totals</td>
                    <td class="text-right">₹ ${window.Calculator.formatNumber(sumGross)}</td>
                    <td class="text-right">₹ ${window.Calculator.formatNumber(sumDisc)}</td>
                    <td class="text-right">₹ ${window.Calculator.formatNumber(sumTaxable)}</td>
                    <td class="text-right">₹ ${window.Calculator.formatNumber(sumCGST)}</td>
                    <td class="text-right">₹ ${window.Calculator.formatNumber(sumSGST)}</td>
                    <td class="text-right">₹ ${window.Calculator.formatNumber(sumIGST)}</td>
                    <td class="text-right">₹ ${window.Calculator.formatNumber(sumRounding)}</td>
                    <td class="text-right font-bold text-success">₹ ${window.Calculator.formatNumber(sumTotal)}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    renderQuotationsDetailed() {
      const estimates = window.AppStore.getAll('estimates') || [];
      const q = this.searchQuery.toLowerCase();

      let rowCounter = 0;
      let totalLinesValue = 0;

      const rows = estimates.flatMap(e => {
        const cust = window.AppStore.getById('customers', e.customerId) || {};
        const isInter = window.Calculator.isInterState(e.placeOfSupply);
        const calc = window.Calculator.computeGSTDocumentTotals(e.items, isInter, e.adjustment);

        return calc.items.filter(item => {
          if (!q) return true;
          return (
            (e.number && e.number.toLowerCase().includes(q)) ||
            (cust.name && cust.name.toLowerCase().includes(q)) ||
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.hsnCode && item.hsnCode.toLowerCase().includes(q)) ||
            (item.sacCode && item.sacCode.toLowerCase().includes(q))
          );
        }).map(item => {
          rowCounter++;
          totalLinesValue += item.totalLineAmount;
          const hsnSac = item.hsnCode || item.sacCode || item.hsn || '90279090';

          return `
            <tr>
              <td class="text-center">${rowCounter}</td>
              <td class="cell-primary font-medium"><a href="#quotes?id=${e.id}" class="customer-name-link">${e.number}</a></td>
              <td>${window.Calculator.formatDate(e.date)}</td>
              <td>${cust.name || 'Client'}</td>
              <td>${e.placeOfSupply || 'Karnataka (29)'}</td>
              <td>${item.name}</td>
              <td>${item.description || '—'}</td>
              <td><span class="badge badge-draft">${(item.itemType || 'product').toUpperCase()}</span></td>
              <td><code>${hsnSac}</code></td>
              <td class="text-right font-medium">${(parseFloat(item.quantity) || 0).toFixed(2)}</td>
              <td class="text-right">₹ ${window.Calculator.formatNumber(item.rate)}</td>
              <td class="text-right">₹ ${window.Calculator.formatNumber(item.grossAmount)}</td>
              <td class="text-center">${item.discountType === 'amount' ? `₹ ${item.discountVal}` : `${item.discountVal}%`}</td>
              <td class="text-right">₹ ${window.Calculator.formatNumber(item.discountAmount)}</td>
              <td class="text-right">₹ ${window.Calculator.formatNumber(item.taxableAmount)}</td>
              <td class="text-center">${isInter ? '—' : `${item.cgstRate}%`}</td>
              <td class="text-right">${isInter ? '—' : `₹ ${window.Calculator.formatNumber(item.cgstAmount)}`}</td>
              <td class="text-center">${isInter ? '—' : `${item.sgstRate}%`}</td>
              <td class="text-right">${isInter ? '—' : `₹ ${window.Calculator.formatNumber(item.sgstAmount)}`}</td>
              <td class="text-center">${isInter ? `${item.igstRate}%` : '—'}</td>
              <td class="text-right">${isInter ? `₹ ${window.Calculator.formatNumber(item.igstAmount)}` : '—'}</td>
              <td class="text-right font-bold" style="color:var(--text-main);">₹ ${window.Calculator.formatNumber(item.totalLineAmount)}</td>
            </tr>
          `;
        });
      }).join('');

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Quotations Masterdata - Detailed Items & GST View</h3>
            <span class="table-count-badge">${rowCounter} Item Entries &bull; Cumulative: ₹ ${window.Calculator.formatNumber(totalLinesValue)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Quote #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Place of Supply</th>
                  <th>Item / Service</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>HSN/SAC</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Rate (₹)</th>
                  <th class="text-right">Gross (₹)</th>
                  <th class="text-center">Disc Mode</th>
                  <th class="text-right">Disc (₹)</th>
                  <th class="text-right">Taxable (₹)</th>
                  <th class="text-center">CGST %</th>
                  <th class="text-right">CGST (₹)</th>
                  <th class="text-center">SGST %</th>
                  <th class="text-right">SGST (₹)</th>
                  <th class="text-center">IGST %</th>
                  <th class="text-right">IGST (₹)</th>
                  <th class="text-right">Line Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${rowCounter === 0 ? `<tr><td colspan="22" class="text-center py-4 text-muted">No detailed item entries found.</td></tr>` : rows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    /* ==========================================================================
       2. COMBINED INVOICES & NOTES MASTERDATA (SUMMARY, DETAILED & TAX DATA)
       ========================================================================== */

    // 2A. COMBINED SUMMARY VIEW
    renderInvoicesAndNotesSummary() {
      const invoices = window.AppStore.getAll('invoices') || [];
      const notes = window.AppStore.getAll('debitCreditNotes') || [];
      const q = this.searchQuery.toLowerCase();

      // Normalize invoices
      const invoiceDocs = invoices.map(i => {
        const cust = window.AppStore.getById('customers', i.customerId) || {};
        const isInter = window.Calculator.isInterState(i.placeOfSupply);
        const calc = window.Calculator.computeGSTDocumentTotals(i.items, isInter, i.adjustment);
        const paid = parseFloat(i.amountPaid) || 0;
        const balance = i.balanceDue != null ? i.balanceDue : Math.max(0, calc.roundedTotal - paid);
        return {
          id: i.id,
          number: i.number || 'INV-DRAFT',
          docType: 'INVOICE',
          docSource: 'invoice',
          badgeClass: 'badge-sent',
          date: i.date || '',
          dueDate: i.dueDate || '—',
          partyName: cust.name || 'Valued Client',
          placeOfSupply: i.placeOfSupply || 'Karnataka (29)',
          partyGstin: cust.taxId || cust.gstin || '29AATCM4200G1ZD',
          paymentTerms: i.paymentTerms || '30 Days net',
          status: i.status || 'sent',
          gross: calc.subTotalGross,
          discount: calc.totalDiscount,
          taxable: calc.totalTaxable,
          cgst: calc.totalCGST,
          sgst: calc.totalSGST,
          igst: calc.totalIGST,
          rounding: calc.rounding,
          total: calc.roundedTotal,
          paid: paid,
          balance: balance,
          link: `#invoices?id=${i.id}`
        };
      });

      // Normalize notes
      const noteDocs = notes.map(n => {
        const party = window.AppStore.getById('customers', n.customerId || n.partyId) ||
                      window.AppStore.getById('vendors', n.vendorId || n.partyId) || {};
        const isInter = window.Calculator.isInterState(n.placeOfSupply);
        const calc = window.Calculator.computeGSTDocumentTotals(n.items, isInter, 0);
        const isCredit = (n.docType || '').includes('CREDIT');
        return {
          id: n.id,
          number: n.number || 'NOTE-DRAFT',
          docType: n.docType || (isCredit ? 'CREDIT NOTE' : 'DEBIT NOTE'),
          docSource: 'note',
          badgeClass: isCredit ? 'badge-credit' : 'badge-draft',
          date: n.date || '',
          dueDate: '—',
          partyName: party.name || party.company || 'Entity',
          placeOfSupply: n.placeOfSupply || 'Karnataka (29)',
          partyGstin: party.taxId || party.gstin || '29AATCM4200G1ZD',
          paymentTerms: n.reason || 'Price adjustment',
          status: n.status || 'approved',
          gross: calc.subTotalGross,
          discount: calc.totalDiscount,
          taxable: calc.totalTaxable,
          cgst: calc.totalCGST,
          sgst: calc.totalSGST,
          igst: calc.totalIGST,
          rounding: calc.rounding,
          total: calc.roundedTotal,
          paid: 0,
          balance: 0,
          link: `#debit-credit-notes?id=${n.id}`
        };
      });

      // Merge and sort by date descending
      const allDocs = [...invoiceDocs, ...noteDocs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      const filtered = allDocs.filter(d => {
        if (!q) return true;
        return (
          d.number.toLowerCase().includes(q) ||
          d.partyName.toLowerCase().includes(q) ||
          d.docType.toLowerCase().includes(q) ||
          d.status.toLowerCase().includes(q) ||
          d.partyGstin.toLowerCase().includes(q) ||
          d.placeOfSupply.toLowerCase().includes(q)
        );
      });

      let sumGross = 0, sumDisc = 0, sumTaxable = 0, sumCGST = 0, sumSGST = 0, sumIGST = 0, sumTotal = 0, sumPaid = 0, sumDue = 0;

      const rows = filtered.map((d, idx) => {
        sumGross += d.gross;
        sumDisc += d.discount;
        sumTaxable += d.taxable;
        sumCGST += d.cgst;
        sumSGST += d.sgst;
        sumIGST += d.igst;
        sumTotal += d.total;
        sumPaid += d.paid;
        sumDue += d.balance;

        return `
          <tr>
            <td class="text-center" data-type="text" data-value="${idx + 1}">${idx + 1}</td>
            <td class="cell-primary font-medium" data-type="text" data-value="${d.number}"><a href="${d.link}" class="customer-name-link">${d.number}</a></td>
            <td data-type="text" data-value="${d.docType}"><span class="badge ${d.badgeClass}">${d.docType}</span></td>
            <td data-type="date" data-value="${d.date}">${window.Calculator.formatDate(d.date)}</td>
            <td data-type="text" data-value="${d.dueDate}">${d.dueDate !== '—' ? window.Calculator.formatDate(d.dueDate) : '—'}</td>
            <td data-type="text" data-value="${d.partyName}">${d.partyName}</td>
            <td data-type="text" data-value="${d.placeOfSupply}">${d.placeOfSupply}</td>
            <td data-type="text" data-value="${d.partyGstin}"><code>${d.partyGstin}</code></td>
            <td data-type="text" data-value="${d.status}"><span class="badge badge-${d.status}">${d.status.toUpperCase()}</span></td>
            <td class="text-right" data-type="number" data-value="${d.gross.toFixed(2)}">₹ ${window.Calculator.formatNumber(d.gross)}</td>
            <td class="text-right" data-type="number" data-value="${d.discount.toFixed(2)}">₹ ${window.Calculator.formatNumber(d.discount)}</td>
            <td class="text-right" data-type="number" data-value="${d.taxable.toFixed(2)}">₹ ${window.Calculator.formatNumber(d.taxable)}</td>
            <td class="text-right" data-type="number" data-value="${d.cgst.toFixed(2)}">₹ ${window.Calculator.formatNumber(d.cgst)}</td>
            <td class="text-right" data-type="number" data-value="${d.sgst.toFixed(2)}">₹ ${window.Calculator.formatNumber(d.sgst)}</td>
            <td class="text-right" data-type="number" data-value="${d.igst.toFixed(2)}">₹ ${window.Calculator.formatNumber(d.igst)}</td>
            <td class="text-right font-bold" data-type="number" data-value="${d.total.toFixed(2)}" style="color:var(--text-main);">₹ ${window.Calculator.formatNumber(d.total)}</td>
            <td class="text-right text-success font-semibold" data-type="number" data-value="${d.paid.toFixed(2)}">₹ ${window.Calculator.formatNumber(d.paid)}</td>
            <td class="text-right font-bold" data-type="number" data-value="${d.balance.toFixed(2)}" style="color: ${d.balance > 0 ? 'var(--color-overdue)' : 'var(--text-muted)'};">
              ₹ ${window.Calculator.formatNumber(d.balance)}
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Invoices, Debit &amp; Credit Notes Masterdata - Summary View</h3>
            <span class="table-count-badge">${filtered.length} Documents &bull; Total Value: ₹ ${window.Calculator.formatNumber(sumTotal)} &bull; Balance Due: ₹ ${window.Calculator.formatNumber(sumDue)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Billing #</th>
                  <th>Doc Type</th>
                  <th>Billing Date</th>
                  <th>Due Date</th>
                  <th>Customer / Party Name</th>
                  <th>Place of Supply</th>
                  <th>GSTIN</th>
                  <th>Status</th>
                  <th class="text-right">Gross (₹)</th>
                  <th class="text-right">Discount (₹)</th>
                  <th class="text-right">Taxable (₹)</th>
                  <th class="text-right">CGST (₹)</th>
                  <th class="text-right">SGST (₹)</th>
                  <th class="text-right">IGST (₹)</th>
                  <th class="text-right">Total Value (₹)</th>
                  <th class="text-right">Paid (₹)</th>
                  <th class="text-right">Balance Due (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `<tr><td colspan="18" class="text-center py-4 text-muted">No invoices or billing notes masterdata found.</td></tr>` : rows}
                ${filtered.length > 0 ? `
                  <tr style="background:var(--surface-muted); font-weight:700;">
                    <td colspan="9" class="text-right" data-type="text" data-value="Grand Totals">Grand Totals</td>
                    <td class="text-right" data-type="number" data-value="${sumGross.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumGross)}</td>
                    <td class="text-right" data-type="number" data-value="${sumDisc.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumDisc)}</td>
                    <td class="text-right" data-type="number" data-value="${sumTaxable.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumTaxable)}</td>
                    <td class="text-right" data-type="number" data-value="${sumCGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumCGST)}</td>
                    <td class="text-right" data-type="number" data-value="${sumSGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumSGST)}</td>
                    <td class="text-right" data-type="number" data-value="${sumIGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumIGST)}</td>
                    <td class="text-right font-bold text-success" data-type="number" data-value="${sumTotal.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumTotal)}</td>
                    <td class="text-right text-success" data-type="number" data-value="${sumPaid.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumPaid)}</td>
                    <td class="text-right text-danger" data-type="number" data-value="${sumDue.toFixed(2)}">₹ ${window.Calculator.formatNumber(sumDue)}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // 2B. COMBINED DETAILED ITEMS VIEW
    renderInvoicesAndNotesDetailed() {
      const invoices = window.AppStore.getAll('invoices') || [];
      const notes = window.AppStore.getAll('debitCreditNotes') || [];
      const q = this.searchQuery.toLowerCase();

      const allDocs = [
        ...invoices.map(i => ({ ...i, docSource: 'invoice' })),
        ...notes.map(n => ({ ...n, docSource: 'note' }))
      ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      let rowCounter = 0;
      let totalAmount = 0;
      let totalTaxable = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;

      const rows = allDocs.flatMap(doc => {
        const party = window.AppStore.getById('customers', doc.customerId || doc.partyId) ||
                      window.AppStore.getById('vendors', doc.vendorId || doc.partyId) || {};
        const isInter = window.Calculator.isInterState(doc.placeOfSupply);
        const calc = window.Calculator.computeGSTDocumentTotals(doc.items, isInter, doc.adjustment || 0);
        const isCredit = (doc.docType || '').includes('CREDIT');
        const docTypeLabel = doc.docSource === 'invoice' ? 'INVOICE' : (doc.docType || (isCredit ? 'CREDIT NOTE' : 'DEBIT NOTE'));
        const docBadgeClass = doc.docSource === 'invoice' ? 'badge-sent' : (isCredit ? 'badge-credit' : 'badge-draft');
        const docLink = doc.docSource === 'invoice' ? `#invoices?id=${doc.id}` : `#debit-credit-notes?id=${doc.id}`;

        return (calc.items || []).filter(item => {
          if (!q) return true;
          return (
            (doc.number && doc.number.toLowerCase().includes(q)) ||
            (party.name && party.name.toLowerCase().includes(q)) ||
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.hsnCode && item.hsnCode.toLowerCase().includes(q)) ||
            (item.sacCode && item.sacCode.toLowerCase().includes(q))
          );
        }).map(item => {
          rowCounter++;
          totalAmount += item.totalLineAmount;
          totalTaxable += item.taxableAmount;
          const hsnSac = item.hsnCode || item.sacCode || item.hsn || '90279090';
          const cgstAmt = isInter ? 0 : item.cgstAmount;
          const sgstAmt = isInter ? 0 : item.sgstAmount;
          const igstAmt = isInter ? item.igstAmount : 0;
          const cgstPct = isInter ? 0 : item.cgstRate;
          const sgstPct = isInter ? 0 : item.sgstRate;
          const igstPct = isInter ? item.igstRate : 0;

          totalCGST += cgstAmt;
          totalSGST += sgstAmt;
          totalIGST += igstAmt;

          return `
            <tr>
              <td class="text-center" data-type="text" data-value="${rowCounter}">${rowCounter}</td>
              <td class="cell-primary font-medium" data-type="text" data-value="${doc.number}"><a href="${docLink}" class="customer-name-link">${doc.number}</a></td>
              <td data-type="text" data-value="${docTypeLabel}"><span class="badge ${docBadgeClass}">${docTypeLabel}</span></td>
              <td data-type="date" data-value="${doc.date}">${window.Calculator.formatDate(doc.date)}</td>
              <td data-type="text" data-value="${party.name || party.company || 'Client'}">${party.name || party.company || 'Client'}</td>
              <td data-type="text" data-value="${doc.status || 'approved'}"><span class="badge badge-${doc.status || 'draft'}">${(doc.status || 'draft').toUpperCase()}</span></td>
              <td data-type="text" data-value="${item.name}">${item.name}</td>
              <td data-type="text" data-value="${item.description || '—'}">${item.description || '—'}</td>
              <td data-type="text" data-value="${item.itemType || 'product'}"><span class="badge badge-draft">${(item.itemType || 'product').toUpperCase()}</span></td>
              <td data-type="text" data-value="${hsnSac}"><code>${hsnSac}</code></td>
              <td class="text-right font-medium" data-type="number" data-value="${(parseFloat(item.quantity) || 0).toFixed(2)}">${(parseFloat(item.quantity) || 0).toFixed(2)}</td>
              <td class="text-right" data-type="number" data-value="${item.rate.toFixed(2)}">₹ ${window.Calculator.formatNumber(item.rate)}</td>
              <td class="text-right" data-type="number" data-value="${item.grossAmount.toFixed(2)}">₹ ${window.Calculator.formatNumber(item.grossAmount)}</td>
              <td class="text-right" data-type="number" data-value="${item.discountAmount.toFixed(2)}">₹ ${window.Calculator.formatNumber(item.discountAmount)}</td>
              <td class="text-right" data-type="number" data-value="${item.taxableAmount.toFixed(2)}">₹ ${window.Calculator.formatNumber(item.taxableAmount)}</td>
              <td class="text-center" data-type="percent" data-value="${(cgstPct / 100).toFixed(4)}">${cgstPct > 0 ? `${cgstPct}%` : '0.00%'}</td>
              <td class="text-right" data-type="number" data-value="${cgstAmt.toFixed(2)}">₹ ${window.Calculator.formatNumber(cgstAmt)}</td>
              <td class="text-center" data-type="percent" data-value="${(sgstPct / 100).toFixed(4)}">${sgstPct > 0 ? `${sgstPct}%` : '0.00%'}</td>
              <td class="text-right" data-type="number" data-value="${sgstAmt.toFixed(2)}">₹ ${window.Calculator.formatNumber(sgstAmt)}</td>
              <td class="text-center" data-type="percent" data-value="${(igstPct / 100).toFixed(4)}">${igstPct > 0 ? `${igstPct}%` : '0.00%'}</td>
              <td class="text-right" data-type="number" data-value="${igstAmt.toFixed(2)}">₹ ${window.Calculator.formatNumber(igstAmt)}</td>
              <td class="text-right font-bold" data-type="number" data-value="${item.totalLineAmount.toFixed(2)}" style="color:var(--text-main);">₹ ${window.Calculator.formatNumber(item.totalLineAmount)}</td>
            </tr>
          `;
        });
      }).join('');

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Invoices, Debit &amp; Credit Notes - Detailed Items View</h3>
            <span class="table-count-badge">${rowCounter} Item Lines &bull; Total Value: ₹ ${window.Calculator.formatNumber(totalAmount)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Billing #</th>
                  <th>Doc Type</th>
                  <th>Date</th>
                  <th>Customer / Party</th>
                  <th>Status</th>
                  <th>Item / Service</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>HSN/SAC</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Rate (₹)</th>
                  <th class="text-right">Gross (₹)</th>
                  <th class="text-right">Discount (₹)</th>
                  <th class="text-right">Taxable (₹)</th>
                  <th class="text-center">CGST %</th>
                  <th class="text-right">CGST (₹)</th>
                  <th class="text-center">SGST %</th>
                  <th class="text-right">SGST (₹)</th>
                  <th class="text-center">IGST %</th>
                  <th class="text-right">IGST (₹)</th>
                  <th class="text-right">Line Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${rowCounter === 0 ? `<tr><td colspan="22" class="text-center py-4 text-muted">No item lines found.</td></tr>` : rows}
                ${rowCounter > 0 ? `
                  <tr style="background:var(--surface-muted); font-weight:700;">
                    <td colspan="14" class="text-right" data-type="text" data-value="Grand Totals">Grand Totals</td>
                    <td class="text-right" data-type="number" data-value="${totalTaxable.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalTaxable)}</td>
                    <td class="text-center" data-type="text" data-value="">—</td>
                    <td class="text-right" data-type="number" data-value="${totalCGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalCGST)}</td>
                    <td class="text-center" data-type="text" data-value="">—</td>
                    <td class="text-right" data-type="number" data-value="${totalSGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalSGST)}</td>
                    <td class="text-center" data-type="text" data-value="">—</td>
                    <td class="text-right" data-type="number" data-value="${totalIGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalIGST)}</td>
                    <td class="text-right font-bold text-success" data-type="number" data-value="${totalAmount.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalAmount)}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // 2C. TAX DATA VIEW (DEDICATED GST TAX REGISTER)
    renderTaxDataView() {
      const invoices = window.AppStore.getAll('invoices') || [];
      const notes = window.AppStore.getAll('debitCreditNotes') || [];
      const q = this.searchQuery.toLowerCase();

      let totalTaxable = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let totalValue = 0;
      let lineCount = 0;

      const allDocs = [
        ...invoices.map(i => ({ ...i, docSource: 'invoice' })),
        ...notes.map(n => ({ ...n, docSource: 'note' }))
      ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      const rows = [];

      allDocs.forEach(doc => {
        const isInter = window.Calculator.isInterState(doc.placeOfSupply);
        const calc = window.Calculator.computeGSTDocumentTotals(doc.items, isInter, doc.adjustment || 0);

        const party = window.AppStore.getById('customers', doc.customerId || doc.partyId) ||
                      window.AppStore.getById('vendors', doc.vendorId || doc.partyId) || {};
        const customerName = party.name || party.company || 'Valued Client';
        const gstn = party.taxId || party.gstin || '29AATCM4200G1ZD';
        const docLink = doc.docSource === 'invoice' ? `#invoices?id=${doc.id}` : `#debit-credit-notes?id=${doc.id}`;

        (calc.items || []).forEach(item => {
          const billingNumber = doc.number || '—';
          const billingDate = doc.date || '—';
          const hsn = item.hsnCode || item.sacCode || item.hsn || '90279090';

          if (q) {
            const match =
              billingNumber.toLowerCase().includes(q) ||
              billingDate.toLowerCase().includes(q) ||
              customerName.toLowerCase().includes(q) ||
              gstn.toLowerCase().includes(q) ||
              hsn.toLowerCase().includes(q) ||
              (item.name && item.name.toLowerCase().includes(q));
            if (!match) return;
          }

          lineCount++;
          const taxableValue = item.taxableAmount || 0;
          const cgstRate = isInter ? 0 : (item.cgstRate || 0);
          const cgstAmount = isInter ? 0 : (item.cgstAmount || 0);
          const sgstRate = isInter ? 0 : (item.sgstRate || 0);
          const sgstAmount = isInter ? 0 : (item.sgstAmount || 0);
          const igstRate = isInter ? (item.igstRate || 0) : 0;
          const igstAmount = isInter ? (item.igstAmount || 0) : 0;
          const lineTotal = item.totalLineAmount || 0;

          totalTaxable += taxableValue;
          totalCGST += cgstAmount;
          totalSGST += sgstAmount;
          totalIGST += igstAmount;
          totalValue += lineTotal;

          rows.push(`
            <tr>
              <td data-type="text" data-value="${billingNumber}"><a href="${docLink}" class="customer-name-link font-medium">${billingNumber}</a></td>
              <td data-type="date" data-value="${billingDate}">${window.Calculator.formatDate(billingDate)}</td>
              <td data-type="text" data-value="${customerName}">${customerName}</td>
              <td data-type="text" data-value="${gstn}"><code>${gstn}</code></td>
              <td data-type="text" data-value="${hsn}"><code>${hsn}</code></td>
              <td class="text-right font-medium" data-type="number" data-value="${taxableValue.toFixed(2)}">₹ ${window.Calculator.formatNumber(taxableValue)}</td>
              <td class="text-center" data-type="percent" data-value="${(cgstRate / 100).toFixed(4)}">${cgstRate > 0 ? `${cgstRate.toFixed(2)}%` : '0.00%'}</td>
              <td class="text-right" data-type="number" data-value="${cgstAmount.toFixed(2)}">₹ ${window.Calculator.formatNumber(cgstAmount)}</td>
              <td class="text-center" data-type="percent" data-value="${(sgstRate / 100).toFixed(4)}">${sgstRate > 0 ? `${sgstRate.toFixed(2)}%` : '0.00%'}</td>
              <td class="text-right" data-type="number" data-value="${sgstAmount.toFixed(2)}">₹ ${window.Calculator.formatNumber(sgstAmount)}</td>
              <td class="text-center" data-type="percent" data-value="${(igstRate / 100).toFixed(4)}">${igstRate > 0 ? `${igstRate.toFixed(2)}%` : '0.00%'}</td>
              <td class="text-right" data-type="number" data-value="${igstAmount.toFixed(2)}">₹ ${window.Calculator.formatNumber(igstAmount)}</td>
              <td class="text-right font-bold" data-type="number" data-value="${lineTotal.toFixed(2)}" style="color:var(--text-main);">₹ ${window.Calculator.formatNumber(lineTotal)}</td>
            </tr>
          `);
        });
      });

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Tax Data Register (Invoices, Debit &amp; Credit Notes)</h3>
            <span class="table-count-badge">${lineCount} Tax Line Entries &bull; Taxable: ₹ ${window.Calculator.formatNumber(totalTaxable)} &bull; Total Value: ₹ ${window.Calculator.formatNumber(totalValue)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Billing Number</th>
                  <th>Billing date</th>
                  <th>Customer Name</th>
                  <th>GSTN</th>
                  <th>HSN</th>
                  <th class="text-right">Taxable value</th>
                  <th class="text-center">CGST %</th>
                  <th class="text-right">CGST Amount</th>
                  <th class="text-center">SGST %</th>
                  <th class="text-right">SGST Amount</th>
                  <th class="text-center">IGST %</th>
                  <th class="text-right">IGST amount</th>
                  <th class="text-right">Total value</th>
                </tr>
              </thead>
              <tbody>
                ${lineCount === 0 ? `<tr><td colspan="13" class="text-center py-4 text-muted">No tax data records found.</td></tr>` : rows.join('')}
                ${lineCount > 0 ? `
                  <tr style="background:var(--surface-muted); font-weight:700;">
                    <td colspan="5" class="text-right" data-type="text" data-value="Grand Totals">Grand Totals</td>
                    <td class="text-right font-bold" data-type="number" data-value="${totalTaxable.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalTaxable)}</td>
                    <td class="text-center" data-type="text" data-value="">—</td>
                    <td class="text-right font-bold" data-type="number" data-value="${totalCGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalCGST)}</td>
                    <td class="text-center" data-type="text" data-value="">—</td>
                    <td class="text-right font-bold" data-type="number" data-value="${totalSGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalSGST)}</td>
                    <td class="text-center" data-type="text" data-value="">—</td>
                    <td class="text-right font-bold" data-type="number" data-value="${totalIGST.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalIGST)}</td>
                    <td class="text-right font-bold text-success" data-type="number" data-value="${totalValue.toFixed(2)}">₹ ${window.Calculator.formatNumber(totalValue)}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // Legacy Aliases for backwards compatibility
    renderInvoicesSummary() { return this.renderInvoicesAndNotesSummary(); },
    renderInvoicesDetailed() { return this.renderInvoicesAndNotesDetailed(); },
    renderBillingNotesSummary() { return this.renderInvoicesAndNotesSummary(); },
    renderBillingNotesDetailed() { return this.renderInvoicesAndNotesDetailed(); },

    /* ==========================================================================
       4. PAYMENTS RECEIVED TAB
       ========================================================================== */
    renderPaymentsMasterdata() {
      const payments = window.AppStore.getAll('payments') || [];
      const q = this.searchQuery.toLowerCase();

      const filtered = payments.filter(p => {
        if (!q) return true;
        const cust = window.AppStore.getById('customers', p.customerId);
        return (
          (p.paymentNumber && p.paymentNumber.toLowerCase().includes(q)) ||
          (p.reference && p.reference.toLowerCase().includes(q)) ||
          (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
          (cust && cust.name && cust.name.toLowerCase().includes(q))
        );
      });

      const totalReceived = filtered.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

      const rows = filtered.map((p, idx) => {
        const cust = window.AppStore.getById('customers', p.customerId) || {};
        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td class="cell-primary font-medium">${p.paymentNumber}</td>
            <td>${window.Calculator.formatDate(p.date)}</td>
            <td>${cust.name || 'Unknown'}</td>
            <td><code>${p.invoiceNumber || 'On Account'}</code></td>
            <td><span class="badge badge-draft">${(p.mode || 'bank').toUpperCase()}</span></td>
            <td><code>${p.reference || '—'}</code></td>
            <td class="text-right font-bold text-success">₹ ${window.Calculator.formatNumber(p.amount)}</td>
            <td>${p.notes || '—'}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Payments Received Masterdata Ledger</h3>
            <span class="table-count-badge">${filtered.length} Payments &bull; Cumulative Received: ₹ ${window.Calculator.formatNumber(totalReceived)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Receipt #</th>
                  <th>Payment Date</th>
                  <th>Customer Name</th>
                  <th>Invoice Settled</th>
                  <th>Payment Mode</th>
                  <th>Transaction Ref / UTR #</th>
                  <th class="text-right">Amount Received (₹)</th>
                  <th>Notes / Narration</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `<tr><td colspan="9" class="text-center py-4 text-muted">No payments found.</td></tr>` : rows}
                ${filtered.length > 0 ? `
                  <tr style="background:var(--surface-muted); font-weight:700;">
                    <td colspan="7" class="text-right">Total Payments Received</td>
                    <td class="text-right font-bold text-success">₹ ${window.Calculator.formatNumber(totalReceived)}</td>
                    <td></td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    /* ==========================================================================
       5. RECEIVABLES AGEING TAB
       ========================================================================== */
    renderReceivablesAgeing() {
      const customers = window.AppStore.getAll('customers') || [];
      const invoices = window.AppStore.getAll('invoices') || [];
      const q = this.searchQuery.toLowerCase();

      let sumCurr = 0, sum15 = 0, sum30 = 0, sum45 = 0, sum60 = 0, sumTotal = 0;

      const customerRows = customers.filter(c => {
        if (!q) return true;
        return (c.name && c.name.toLowerCase().includes(q)) || (c.company && c.company.toLowerCase().includes(q));
      }).map((c, idx) => {
        const clientInvoices = invoices.filter(i => i.customerId === c.id && i.status !== 'void');
        const aging = window.Calculator.computeAging(clientInvoices);

        sumCurr += aging.buckets.current;
        sum15 += aging.buckets.days1_15;
        sum30 += aging.buckets.days16_30;
        sum45 += aging.buckets.days31_45;
        sum60 += aging.buckets.daysAbove45;
        sumTotal += aging.totalReceivables;

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td class="cell-primary font-medium">${c.name}</td>
            <td><code>${c.taxId || c.gstin || '—'}</code></td>
            <td>${c.phone || c.email || '—'}</td>
            <td class="text-center font-medium">${clientInvoices.length}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(aging.buckets.current)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(aging.buckets.days1_15)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(aging.buckets.days16_30)}</td>
            <td class="text-right">₹ ${window.Calculator.formatNumber(aging.buckets.days31_45)}</td>
            <td class="text-right text-danger font-semibold">₹ ${window.Calculator.formatNumber(aging.buckets.daysAbove45)}</td>
            <td class="text-right font-bold" style="color: ${aging.totalReceivables > 0 ? 'var(--color-overdue)' : 'var(--text-muted)'};">
              ₹ ${window.Calculator.formatNumber(aging.totalReceivables)}
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Accounts Receivable Ageing Masterdata</h3>
            <span class="table-count-badge">Total Outstanding: ₹ ${window.Calculator.formatNumber(sumTotal)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Customer Name</th>
                  <th>GSTIN</th>
                  <th>Contact Info</th>
                  <th class="text-center">Invoices</th>
                  <th class="text-right">Current (0-15 D)</th>
                  <th class="text-right">16 - 30 Days</th>
                  <th class="text-right">31 - 45 Days</th>
                  <th class="text-right">46 - 60 Days</th>
                  <th class="text-right">60+ Days Overdue</th>
                  <th class="text-right">Total Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${customerRows}
                <tr style="background:var(--surface-muted); font-weight:700;">
                  <td colspan="5" class="text-right">Portfolio Total Outstanding</td>
                  <td class="text-right">₹ ${window.Calculator.formatNumber(sumCurr)}</td>
                  <td class="text-right">₹ ${window.Calculator.formatNumber(sum15)}</td>
                  <td class="text-right">₹ ${window.Calculator.formatNumber(sum30)}</td>
                  <td class="text-right">₹ ${window.Calculator.formatNumber(sum45)}</td>
                  <td class="text-right text-danger">₹ ${window.Calculator.formatNumber(sum60)}</td>
                  <td class="text-right font-bold text-danger">₹ ${window.Calculator.formatNumber(sumTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    /* ==========================================================================
       6. EXPENSES SUMMARY TAB
       ========================================================================== */
    renderExpensesMasterdata() {
      const expenses = window.AppStore.getAll('expenses') || [];
      const q = this.searchQuery.toLowerCase();

      const filtered = expenses.filter(e => {
        if (!q) return true;
        return (
          (e.category && e.category.toLowerCase().includes(q)) ||
          (e.vendor && e.vendor.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q))
        );
      });

      const totalSpent = filtered.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

      const rows = filtered.map((e, idx) => {
        const cust = e.customerId ? window.AppStore.getById('customers', e.customerId) : null;
        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td>${window.Calculator.formatDate(e.date)}</td>
            <td class="cell-primary font-medium">${e.id}</td>
            <td><span class="badge badge-draft">${e.category}</span></td>
            <td>${e.vendor || '—'}</td>
            <td>${e.paidThrough || 'Petty Cash / Bank'}</td>
            <td><code>${e.reference || '—'}</code></td>
            <td class="text-right">₹ ${(parseFloat(e.taxAmount) || 0).toFixed(2)}</td>
            <td class="text-right font-bold" style="color:var(--text-main);">₹ ${window.Calculator.formatNumber(e.amount)}</td>
            <td class="text-center">${e.billable ? '<span class="badge badge-paid">YES</span>' : '<span class="badge badge-draft">NO</span>'}</td>
            <td>${cust ? cust.name : '—'}</td>
            <td>${e.notes || '—'}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="table-card">
          <div class="table-header-toolbar">
            <h3 class="table-title">Expenses Masterdata Summary</h3>
            <span class="table-count-badge">${filtered.length} Entries &bull; Total Expenses: ₹ ${window.Calculator.formatNumber(totalSpent)}</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Date</th>
                  <th>Expense ID</th>
                  <th>Category</th>
                  <th>Vendor / Payee</th>
                  <th>Paid Through</th>
                  <th>Ref #</th>
                  <th class="text-right">Tax (₹)</th>
                  <th class="text-right">Amount (₹)</th>
                  <th class="text-center">Billable</th>
                  <th>Client Name</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `<tr><td colspan="12" class="text-center py-4 text-muted">No expense records found.</td></tr>` : rows}
                ${filtered.length > 0 ? `
                  <tr style="background:var(--surface-muted); font-weight:700;">
                    <td colspan="8" class="text-right">Total Overhead Spent</td>
                    <td class="text-right font-bold">₹ ${window.Calculator.formatNumber(totalSpent)}</td>
                    <td colspan="3"></td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    /* ==========================================================================
       EXPORT TO EXCEL (.XLSX FORMAT) WITH STRICT CELL DATA TYPES
       ========================================================================== */
    exportToExcel() {
      const table = document.querySelector('#report-content-container table');
      if (!table) {
        window.Toast.show('No table data to export.', 'error');
        return;
      }

      const filename = `Masterdata_Report_${this.activeTab}_${this.viewMode}_${Date.now()}.xlsx`;
      const tabTitleMap = {
        'invoices_notes': this.viewMode === 'tax' ? 'Tax Data Register' : (this.viewMode === 'detailed' ? 'Invoices & Notes Detailed' : 'Invoices & Notes Summary'),
        'quotations': 'Quotations Master',
        'invoices': 'Invoices Master',
        'billing_notes': 'Credit & Debit Notes',
        'payments': 'Payments Received',
        'aging': 'Receivables Ageing',
        'expenses': 'Expenses Summary'
      };
      const sheetName = (tabTitleMap[this.activeTab] || 'Masterdata Report').substring(0, 31);

      // Helper to parse cell element to SheetJS cell object
      const parseCell = (cellEl) => {
        const type = cellEl.getAttribute('data-type');
        const rawVal = cellEl.getAttribute('data-value');
        const text = cellEl.innerText.replace(/\s+/g, ' ').trim();

        if (type === 'text') {
          return { t: 's', v: rawVal != null ? String(rawVal) : text };
        }

        if (type === 'date') {
          const dStr = rawVal || text;
          if (dStr) {
            let y, m, d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
              const parts = dStr.split('-');
              y = parseInt(parts[0], 10);
              m = parseInt(parts[1], 10) - 1;
              d = parseInt(parts[2], 10);
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
              const parts = dStr.split('-');
              d = parseInt(parts[0], 10);
              m = parseInt(parts[1], 10) - 1;
              y = parseInt(parts[2], 10);
            }
            if (y && m != null && d) {
              const dt = new Date(y, m, d, 12, 0, 0);
              return { t: 'd', v: dt, z: 'yyyy-mm-dd' };
            }
          }
          return { t: 's', v: dStr };
        }

        if (type === 'percent') {
          const pVal = rawVal != null ? parseFloat(rawVal) : (parseFloat(text.replace(/%/g, '')) / 100);
          if (!isNaN(pVal)) {
            return { t: 'n', v: pVal, z: '0.00%' };
          }
          return { t: 's', v: text };
        }

        if (type === 'number' || type === 'currency') {
          const nVal = rawVal != null ? parseFloat(rawVal) : parseFloat(text.replace(/[₹,\s]/g, ''));
          if (!isNaN(nVal)) {
            return { t: 'n', v: nVal, z: '#,##0.00' };
          }
          return { t: 's', v: text };
        }

        // Heuristics if data-type was omitted
        if (text === '—' || text === '-' || text === '') {
          return { t: 's', v: text };
        }

        // Currency values like "₹ 12,500.00"
        if (text.includes('₹')) {
          const num = parseFloat(text.replace(/[₹,\s]/g, ''));
          if (!isNaN(num)) {
            return { t: 'n', v: num, z: '#,##0.00' };
          }
        }

        // Percentage values like "18%" or "9.00%"
        if (text.endsWith('%')) {
          const pct = parseFloat(text.replace(/%/g, ''));
          if (!isNaN(pct)) {
            return { t: 'n', v: pct / 100, z: '0.00%' };
          }
        }

        // ISO dates like "2026-10-18" or "18-10-2026"
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          const parts = text.split('-');
          return { t: 'd', v: new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0), z: 'yyyy-mm-dd' };
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
          const parts = text.split('-');
          return { t: 'd', v: new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 12, 0, 0), z: 'yyyy-mm-dd' };
        }

        return { t: 's', v: text };
      };

      // Header row(s)
      const rows = [];
      table.querySelectorAll('thead tr').forEach(tr => {
        const headerRow = [];
        tr.querySelectorAll('th').forEach(th => {
          const colSpan = parseInt(th.getAttribute('colspan') || '1', 10);
          const text = th.innerText.replace(/\s+/g, ' ').trim();
          headerRow.push({ t: 's', v: text });
          for (let c = 1; c < colSpan; c++) {
            headerRow.push({ t: 's', v: '' });
          }
        });
        if (headerRow.length > 0) rows.push(headerRow);
      });

      // Body and footer rows
      table.querySelectorAll('tbody tr, tfoot tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('td, th').forEach(cellEl => {
          const colSpan = parseInt(cellEl.getAttribute('colspan') || '1', 10);
          const cellObj = parseCell(cellEl);
          row.push(cellObj);
          for (let c = 1; c < colSpan; c++) {
            row.push({ t: 's', v: '' });
          }
        });
        if (row.length > 0) rows.push(row);
      });

      if (window.XLSX) {
        const ws = window.XLSX.utils.aoa_to_sheet(rows, { cellDates: true });

        // Auto-calculate column widths
        if (rows.length > 0) {
          ws['!cols'] = rows[0].map((_, colIdx) => {
            let maxLen = 12;
            rows.forEach(r => {
              if (r && r[colIdx]) {
                const cell = r[colIdx];
                let str = '';
                if (cell.t === 'd' && cell.v instanceof Date) {
                  str = '2026-00-00';
                } else if (cell.t === 'n' && cell.z === '0.00%') {
                  str = `${(cell.v * 100).toFixed(2)}%`;
                } else if (cell.t === 'n') {
                  str = cell.v.toFixed(2);
                } else {
                  str = String(cell.v != null ? cell.v : '');
                }
                if (str.length > maxLen) maxLen = str.length;
              }
            });
            return { wch: Math.min(60, maxLen + 3) };
          });
        }

        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, sheetName);
        window.XLSX.writeFile(wb, filename);
        window.Toast.show(`Masterdata successfully exported to Excel (.xlsx): ${filename}`, 'success');
      } else {
        // Fallback: Excel XML SpreadsheetML with native data types
        let xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${sheetName}"><Table>`;
        rows.forEach(r => {
          xml += '<Row>';
          r.forEach(cell => {
            if (cell.t === 'n') {
              xml += `<Cell><Data ss:Type="Number">${cell.v}</Data></Cell>`;
            } else if (cell.t === 'd' && cell.v instanceof Date) {
              const iso = cell.v.toISOString().split('T')[0];
              xml += `<Cell><Data ss:Type="String">${iso}</Data></Cell>`;
            } else {
              const escaped = String(cell.v != null ? cell.v : '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              xml += `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`;
            }
          });
          xml += '</Row>';
        });
        xml += '</Table></Worksheet></Workbook>';
        const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.Toast.show(`Masterdata successfully exported to Excel (.xlsx): ${filename}`, 'success');
      }
    },

    /* ==========================================================================
       PRINT REPORT
       ========================================================================== */
    printReport() {
      document.body.classList.add('printing-report');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-report');
      }, 1000);
    }
  };

  window.ReportsView = ReportsView;

})(window);
