/**
 * ZOHO INVOICE - EXPENSES TRACKING MODULE
 * Log business operational expenses, track billable costs, client attachments.
 */

(function (window) {
  'use strict';

  const ExpensesView = {
    filterCategory: 'all',

    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      const expenses = window.AppStore.getAll('expenses');
      const customers = window.AppStore.getAll('customers');

      const filtered = expenses.filter(e => {
        if (this.filterCategory !== 'all' && e.category !== this.filterCategory) return false;
        return true;
      });

      const totalExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
      const billableExpenses = expenses.filter(e => e.billable).reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
      const nonBillable = totalExpenses - billableExpenses;

      container.innerHTML = `
        <div class="expenses-page animate-fadeIn">
          
          <!-- KPI ROW -->
          <div class="kpi-grid">
            <div class="kpi-card accent-expenses">
              <div class="kpi-header">
                <span class="kpi-title">Total Expenses</span>
              </div>
              <div class="kpi-value">${window.Calculator.formatCurrency(totalExpenses)}</div>
              <div class="kpi-subtext">Across ${expenses.length} expense entries</div>
            </div>
            <div class="kpi-card accent-receivables">
              <div class="kpi-header">
                <span class="kpi-title">Billable Expenses</span>
              </div>
              <div class="kpi-value text-primary">${window.Calculator.formatCurrency(billableExpenses)}</div>
              <div class="kpi-subtext">Pass-through client reimbursables</div>
            </div>
            <div class="kpi-card accent-received">
              <div class="kpi-header">
                <span class="kpi-title">Non-Billable Overhead</span>
              </div>
              <div class="kpi-value text-secondary">${window.Calculator.formatCurrency(nonBillable)}</div>
              <div class="kpi-subtext">Internal business operations</div>
            </div>
          </div>

          <!-- TABLE CARD -->
          <div class="table-card">
            <div class="table-header-toolbar">
              <div class="table-title-area">
                <h2 class="table-title">Expense Log</h2>
                <div class="master-filter-tabs">
                  <button class="filter-tab-pill ${this.filterCategory === 'all' ? 'active' : ''}" onclick="window.ExpensesView.setFilter('all')">All</button>
                  <button class="filter-tab-pill ${this.filterCategory === 'Software' ? 'active' : ''}" onclick="window.ExpensesView.setFilter('Software')">Software</button>
                  <button class="filter-tab-pill ${this.filterCategory === 'Travel' ? 'active' : ''}" onclick="window.ExpensesView.setFilter('Travel')">Travel</button>
                  <button class="filter-tab-pill ${this.filterCategory === 'Office' ? 'active' : ''}" onclick="window.ExpensesView.setFilter('Office')">Office</button>
                </div>
              </div>
              <div class="table-actions-area">
                <button class="btn btn-primary btn-icon-gap" onclick="window.ExpensesView.promptModal()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Record Expense</span>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Vendor / Merchant</th>
                    <th>Notes</th>
                    <th>Billable</th>
                    <th>Linked Customer</th>
                    <th>Amount</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">
                        No expense records found.
                      </td>
                    </tr>
                  ` : filtered.map(exp => {
                    const cust = exp.customerId ? window.AppStore.getById('customers', exp.customerId) : null;
                    return `
                      <tr>
                        <td>${window.Calculator.formatDate(exp.date)}</td>
                        <td><span class="badge badge-draft font-semibold">${exp.category}</span></td>
                        <td class="cell-primary">${exp.vendor || '—'}</td>
                        <td class="text-xs text-muted" style="max-width: 260px;">${exp.notes || '—'}</td>
                        <td>
                          <span class="badge ${exp.billable ? 'badge-paid' : 'badge-draft'}">
                            ${exp.billable ? 'Billable' : 'Internal'}
                          </span>
                        </td>
                        <td>${cust ? cust.name : '—'}</td>
                        <td class="font-bold">${window.Calculator.formatCurrency(exp.amount)}</td>
                        <td class="cell-actions">
                          <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.ExpensesView.deleteExpense('${exp.id}')">
                            Delete
                          </button>
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
    },

    setFilter(cat) {
      this.filterCategory = cat;
      this.render();
    },

    promptModal() {
      const customers = window.AppStore.getAll('customers');
      const today = new Date().toISOString().substring(0, 10);

      const custOptions = `
        <option value="">-- None (Internal Overhead) --</option>
        ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      `;

      const contentHtml = `
        <form id="expense-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Expense Date</label>
              <input type="date" id="exp-date" class="form-control" value="${today}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Amount ($)</label>
              <input type="number" step="0.01" id="exp-amount" class="form-control" placeholder="0.00" required>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Expense Category</label>
              <select id="exp-cat" class="input-select">
                <option value="Software">Software & Cloud Hosting</option>
                <option value="Travel">Travel & Lodging</option>
                <option value="Office">Office Supplies & Rent</option>
                <option value="Utilities">Internet & Utilities</option>
                <option value="Contractor">Contractor & Freelancer</option>
                <option value="Advertising">Advertising & Marketing</option>
                <option value="Other">Other Operating Cost</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Vendor / Merchant</label>
              <input type="text" id="exp-vendor" class="form-control" placeholder="e.g. AWS, Delta Airlines, Zoom" required>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Client Association</label>
              <select id="exp-cust" class="input-select">
                ${custOptions}
              </select>
            </div>
            <div class="form-group" style="justify-content: center;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-top: 1.25rem;">
                <input type="checkbox" id="exp-billable" style="width: 18px; height: 18px;">
                <span class="font-semibold text-sm">Billable to this Customer</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes & Purpose</label>
            <input type="text" id="exp-notes" class="form-control" placeholder="Context for accounting">
          </div>
        </form>
      `;

      window.Modal.open({
        title: 'Record Business Expense',
        contentHtml,
        size: 'md',
        confirmText: 'Save Expense',
        onConfirm: () => {
          const date = document.getElementById('exp-date').value;
          const amount = parseFloat(document.getElementById('exp-amount').value);
          const category = document.getElementById('exp-cat').value;
          const vendor = document.getElementById('exp-vendor').value.trim();
          const customerId = document.getElementById('exp-cust').value;
          const billable = document.getElementById('exp-billable').checked;
          const notes = document.getElementById('exp-notes').value.trim();

          if (!date || isNaN(amount) || !vendor) {
            window.Toast.show('Date, amount, and vendor are required.', 'error');
            return false;
          }

          const newExpense = {
            date,
            amount,
            category,
            vendor,
            customerId,
            billable,
            status: billable ? 'unbilled' : 'non_billable',
            notes
          };

          window.AppStore.add('expenses', newExpense);
          window.Toast.show('Expense recorded successfully!', 'success');
          this.render();
          return true;
        }
      });
    },

    deleteExpense(id) {
      window.Modal.confirm({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense entry?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('expenses', id);
          window.Toast.show('Expense removed.', 'info');
          this.render();
        }
      });
    }
  };

  window.ExpensesView = ExpensesView;

})(window);
