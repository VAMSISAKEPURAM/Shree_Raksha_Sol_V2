/**
 * ZOHO INVOICE - DASHBOARD VIEW CONTROLLER
 * Executive summary, receivables aging, cash flow visualization, and recent activities.
 */

(function (window) {
  'use strict';

  const DashboardView = {
    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      const invoices = window.AppStore.getAll('invoices');
      const expenses = window.AppStore.getAll('expenses');
      const customers = window.AppStore.getAll('customers');
      const org = window.AppStore.getOrg();

      // Computations
      const aging = window.Calculator.computeAging(invoices);
      const validInvoices = invoices.filter(i => i.status !== 'void');
      const totalRevenue = validInvoices.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
      const totalExpenses = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const netProfit = totalRevenue - totalExpenses;

      // Overdue badge update in sidebar
      const overdueCount = invoices.filter(i => i.status === 'overdue').length;
      const overdueBadge = document.getElementById('nav-badge-overdue');
      if (overdueBadge) {
        if (overdueCount > 0) {
          overdueBadge.textContent = `${overdueCount} Overdue`;
          overdueBadge.style.display = 'inline-block';
        } else {
          overdueBadge.style.display = 'none';
        }
      }

      // Recent 5 invoices
      const recentInvoices = [...invoices].slice(0, 5);

      container.innerHTML = `
        <div class="dashboard-page animate-fadeIn">
          
          <!-- WELCOME / BANNER -->
          <div class="flex items-center justify-between mb-6 flex-wrap gap-4" style="margin-bottom: 1.5rem;">
            <div>
              <h1 class="text-2xl font-bold" style="color: var(--text-main);">Welcome, ${org.name}</h1>
              <p class="text-sm text-secondary">Here is what's happening with your business financials today.</p>
            </div>
            <div class="flex items-center gap-3">
              <button class="btn btn-primary btn-icon-gap" onclick="window.InvoicesView.promptNewModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Create Invoice</span>
              </button>
              <button class="btn btn-secondary btn-icon-gap" onclick="window.QuotesView.promptNewModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>New Quotation</span>
              </button>
            </div>
          </div>

          <!-- KPI STAT CARDS -->
          <div class="kpi-grid">
            
            <div class="kpi-card accent-receivables">
              <div class="kpi-header">
                <span class="kpi-title">Total Receivables</span>
                <div class="kpi-icon-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
              </div>
              <div class="kpi-value">${window.Calculator.formatCurrency(aging.totalReceivables)}</div>
              <div class="kpi-subtext">
                <span class="text-secondary font-medium">Current: ${window.Calculator.formatCurrency(aging.currentReceivables)}</span>
              </div>
            </div>

            <div class="kpi-card accent-overdue">
              <div class="kpi-header">
                <span class="kpi-title">Total Overdue</span>
                <div class="kpi-icon-wrap" style="color: var(--color-overdue);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
              </div>
              <div class="kpi-value" style="color: var(--color-overdue);">${window.Calculator.formatCurrency(aging.overdueReceivables)}</div>
              <div class="kpi-subtext">
                <span class="kpi-pill negative">${overdueCount} Invoices require follow-up</span>
              </div>
            </div>

            <div class="kpi-card accent-received">
              <div class="kpi-header">
                <span class="kpi-title">Payments Received</span>
                <div class="kpi-icon-wrap" style="color: var(--color-paid);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div class="kpi-value" style="color: var(--color-paid);">${window.Calculator.formatCurrency(aging.totalReceived)}</div>
              <div class="kpi-subtext">
                <span class="kpi-pill positive">Settled across all accounts</span>
              </div>
            </div>

            <div class="kpi-card accent-expenses">
              <div class="kpi-header">
                <span class="kpi-title">Total Expenses</span>
                <div class="kpi-icon-wrap" style="color: #f59e0b;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
              </div>
              <div class="kpi-value">${window.Calculator.formatCurrency(totalExpenses)}</div>
              <div class="kpi-subtext">
                <span class="text-secondary font-medium">${expenses.length} Logged expense receipts</span>
              </div>
            </div>

            <div class="kpi-card accent-profit">
              <div class="kpi-header">
                <span class="kpi-title">Net Profit (Revenue - Expenses)</span>
                <div class="kpi-icon-wrap" style="color: ${netProfit >= 0 ? 'var(--color-paid)' : 'var(--color-overdue)'};">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div class="kpi-value font-bold" style="color: ${netProfit >= 0 ? 'var(--color-paid)' : 'var(--color-overdue)'};">
                ${window.Calculator.formatCurrency(netProfit)}
              </div>
              <div class="kpi-subtext">
                <span class="kpi-pill ${netProfit >= 0 ? 'positive' : 'negative'}">
                  Revenue: ${window.Calculator.formatCurrency(totalRevenue)} &bull; Expenses: ${window.Calculator.formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>

          </div>

          <!-- RECEIVABLES AGING & SALES FLOW CHART ROW -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
            
            <!-- AGING BREAKDOWN CARD -->
            <div class="table-card" style="margin-bottom: 0;">
              <div class="table-header-toolbar">
                <div class="table-title-area">
                  <h3 class="table-title">Receivables Aging</h3>
                </div>
                <span class="text-xs text-muted">Days Overdue</span>
              </div>
              <div style="padding: 1.5rem;">
                <div style="display: flex; height: 16px; border-radius: var(--radius-full); overflow: hidden; background: #e2e8f0; margin-bottom: 1.25rem;">
                  <div style="width: ${aging.totalReceivables > 0 ? (aging.buckets.current / aging.totalReceivables) * 100 : 100}%; background: #10b981;" title="Current: ${window.Calculator.formatCurrency(aging.buckets.current)}"></div>
                  <div style="width: ${aging.totalReceivables > 0 ? (aging.buckets.days1_15 / aging.totalReceivables) * 100 : 0}%; background: #3b82f6;" title="1-15 Days: ${window.Calculator.formatCurrency(aging.buckets.days1_15)}"></div>
                  <div style="width: ${aging.totalReceivables > 0 ? (aging.buckets.days16_30 / aging.totalReceivables) * 100 : 0}%; background: #f59e0b;" title="16-30 Days: ${window.Calculator.formatCurrency(aging.buckets.days16_30)}"></div>
                  <div style="width: ${aging.totalReceivables > 0 ? (aging.buckets.daysAbove45 / aging.totalReceivables) * 100 : 0}%; background: #ef4444;" title="45+ Days: ${window.Calculator.formatCurrency(aging.buckets.daysAbove45)}"></div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                  <div class="flex items-center gap-2">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
                    <span class="text-xs text-secondary font-medium">Current:</span>
                    <span class="text-xs font-bold">${window.Calculator.formatCurrency(aging.buckets.current)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #3b82f6;"></span>
                    <span class="text-xs text-secondary font-medium">1 - 15 Days:</span>
                    <span class="text-xs font-bold">${window.Calculator.formatCurrency(aging.buckets.days1_15)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #f59e0b;"></span>
                    <span class="text-xs text-secondary font-medium">16 - 30 Days:</span>
                    <span class="text-xs font-bold">${window.Calculator.formatCurrency(aging.buckets.days16_30)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444;"></span>
                    <span class="text-xs text-secondary font-medium">45+ Days:</span>
                    <span class="text-xs font-bold">${window.Calculator.formatCurrency(aging.buckets.daysAbove45)}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- SALES FLOW VISUAL CARD -->
            <div class="table-card" style="margin-bottom: 0;">
              <div class="table-header-toolbar">
                <div class="table-title-area">
                  <h3 class="table-title">Revenue & Cash Health</h3>
                </div>
                <span class="badge badge-paid">Healthy</span>
              </div>
              <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-secondary">Total Invoiced Volume</span>
                  <span class="font-bold">${window.Calculator.formatCurrency(invoices.reduce((a, b) => a + (b.total || 0), 0))}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-secondary">Cash In Hand (Collected)</span>
                  <span class="font-bold text-success">${window.Calculator.formatCurrency(aging.totalReceived)}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-secondary">Operating Expenses</span>
                  <span class="font-bold text-danger">${window.Calculator.formatCurrency(totalExpenses)}</span>
                </div>
                <div class="flex justify-between items-center text-sm" style="border-top: 1px solid var(--border-light); padding-top: 0.75rem;">
                  <span class="font-semibold text-main">Estimated Net Margin</span>
                  <span class="font-bold text-primary text-base">${window.Calculator.formatCurrency(aging.totalReceived - totalExpenses)}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- RECENT INVOICES DATA TABLE -->
          <div class="table-card">
            <div class="table-header-toolbar">
              <div class="table-title-area">
                <h3 class="table-title">Recent Invoices</h3>
                <span class="table-count-badge">${invoices.length} Total</span>
              </div>
              <div class="table-actions-area">
                <a href="#invoices" class="btn btn-secondary btn-sm">View All Invoices</a>
              </div>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentInvoices.map(inv => {
                    const cust = window.AppStore.getById('customers', inv.customerId);
                    return `
                      <tr>
                        <td>${window.Calculator.formatDate(inv.date)}</td>
                        <td class="cell-primary">
                          <a href="#invoices?id=${inv.id}" class="customer-name-link">
                            ${inv.number}
                          </a>
                        </td>
                        <td>${cust ? cust.name : 'Unknown Customer'}</td>
                        <td>${window.Calculator.formatDate(inv.dueDate)}</td>
                        <td class="font-semibold">${window.Calculator.formatCurrency(inv.total)}</td>
                        <td class="font-bold" style="color: ${inv.balanceDue > 0 ? 'var(--color-overdue)' : 'var(--color-paid)'};">
                          ${window.Calculator.formatCurrency(inv.balanceDue || 0)}
                        </td>
                        <td>
                          <span class="badge badge-${inv.status}">${inv.status.replace('_', ' ')}</span>
                        </td>
                        <td class="cell-actions">
                          <button class="btn btn-secondary btn-sm" onclick="window.InvoicesView.openDetail('${inv.id}')">View</button>
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
    }
  };

  window.DashboardView = DashboardView;

})(window);
