/**
 * ZOHO INVOICE - RECURRING INVOICES MODULE
 * Automation schedules, recurring profiles, and one-click manual generation triggers.
 */

(function (window) {
  'use strict';

  const RecurringView = {
    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      const recurring = window.AppStore.getAll('recurring');

      container.innerHTML = `
        <div class="recurring-page animate-fadeIn">
          
          <div class="table-card">
            <div class="table-header-toolbar">
              <div class="table-title-area">
                <h2 class="table-title">Recurring Invoices</h2>
                <span class="table-count-badge">${recurring.length} Schedules</span>
              </div>
              <div class="table-actions-area">
                <button class="btn btn-primary btn-icon-gap" onclick="window.RecurringView.promptModal()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New Recurring Profile</span>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Profile Name</th>
                    <th>Customer</th>
                    <th>Frequency</th>
                    <th>Next Run Date</th>
                    <th>Last Generated</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${recurring.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">
                        No recurring invoice profiles configured.
                      </td>
                    </tr>
                  ` : recurring.map(rec => {
                    const cust = window.AppStore.getById('customers', rec.customerId);
                    return `
                      <tr>
                        <td class="cell-primary">${rec.profileName}</td>
                        <td>${cust ? cust.name : 'Unknown'}</td>
                        <td><span class="badge badge-draft">Every ${rec.repeatEvery}</span></td>
                        <td><strong>${window.Calculator.formatDate(rec.nextRunDate)}</strong></td>
                        <td>${window.Calculator.formatDate(rec.lastGeneratedDate)}</td>
                        <td class="font-bold">${window.Calculator.formatCurrency(rec.total)}</td>
                        <td><span class="badge ${rec.status === 'active' ? 'badge-paid' : 'badge-draft'}">${rec.status}</span></td>
                        <td class="cell-actions">
                          <button class="btn btn-secondary btn-sm" onclick="window.RecurringView.runNow('${rec.id}')" title="Generate an immediate invoice cycle">
                            Run Now
                          </button>
                          <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.RecurringView.deleteProfile('${rec.id}')">
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

    runNow(profileId) {
      const rec = window.AppStore.getById('recurring', profileId);
      if (!rec) return;

      const invNumber = window.AppStore.getNextNumber('invoice');
      const today = new Date().toISOString().substring(0, 10);
      const dueDate = window.Calculator.addDays(today, 30);

      const newInvoice = {
        id: 'inv-' + Date.now(),
        number: invNumber,
        customerId: rec.customerId,
        date: today,
        dueDate: dueDate,
        paymentTerms: 'Net 30',
        status: 'sent',
        items: JSON.parse(JSON.stringify(rec.items || [])),
        subtotal: rec.subtotal,
        discountTotal: 0,
        taxTotal: rec.taxTotal || 0,
        adjustment: 0,
        total: rec.total,
        amountPaid: 0,
        balanceDue: rec.total,
        recurringProfileId: rec.id,
        notes: `Automated cycle generated from profile: ${rec.profileName}`,
        terms: window.AppStore.getOrg().defaultTerms,
        history: [
          { date: today + ' 09:00', action: `Auto-generated via recurring profile: ${rec.profileName}`, user: 'Recurring Scheduler' }
        ]
      };

      window.AppStore.add('invoices', newInvoice);

      // Update next run date based on frequency
      let nextRun = rec.nextRunDate;
      if (rec.repeatEvery === 'month') nextRun = window.Calculator.addDays(today, 30);
      else if (rec.repeatEvery === 'quarter') nextRun = window.Calculator.addDays(today, 90);
      else if (rec.repeatEvery === 'year') nextRun = window.Calculator.addDays(today, 365);
      else nextRun = window.Calculator.addDays(today, 7);

      window.AppStore.update('recurring', rec.id, {
        lastGeneratedDate: today,
        nextRunDate: nextRun
      });

      window.Toast.show(`Cycle executed! Generated Invoice ${invNumber}`, 'success');
      this.render();
    },

    promptModal() {
      const customers = window.AppStore.getAll('customers');
      const catalogItems = window.AppStore.getAll('items');
      const taxes = window.AppStore.getAll('taxes');

      if (customers.length === 0 || catalogItems.length === 0) {
        window.Toast.show('Please create customers and catalog items first.', 'warning');
        return;
      }

      const today = new Date().toISOString().substring(0, 10);
      const nextRunDefault = window.Calculator.addDays(today, 30);

      const customerOptions = customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      const itemOptions = catalogItems.map(i => `<option value="${i.id}">${i.name} ($${i.rate})</option>`).join('');

      const contentHtml = `
        <form id="rec-profile-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Profile Name</label>
              <input type="text" id="rec-name" class="form-control" required placeholder="e.g. Monthly Retainer">
            </div>
            <div class="form-group">
              <label class="form-label required">Customer</label>
              <select id="rec-customer" class="input-select">
                ${customerOptions}
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Repeat Frequency</label>
              <select id="rec-freq" class="input-select">
                <option value="month">Every Month</option>
                <option value="quarter">Every Quarter (3 Months)</option>
                <option value="year">Every Year</option>
                <option value="week">Every Week</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Next Run Date</label>
              <input type="date" id="rec-next-date" class="form-control" value="${nextRunDefault}" required>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Select Item / Service</label>
              <select id="rec-item" class="input-select">
                ${itemOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Quantity</label>
              <input type="number" id="rec-qty" class="form-control" value="1" min="1" step="1">
            </div>
          </div>
        </form>
      `;

      window.Modal.open({
        title: 'New Recurring Invoice Schedule',
        contentHtml,
        size: 'md',
        confirmText: 'Create Profile',
        onConfirm: () => {
          const profileName = document.getElementById('rec-name').value.trim();
          const customerId = document.getElementById('rec-customer').value;
          const repeatEvery = document.getElementById('rec-freq').value;
          const nextRunDate = document.getElementById('rec-next-date').value;
          const itemId = document.getElementById('rec-item').value;
          const qty = parseFloat(document.getElementById('rec-qty').value) || 1;

          if (!profileName || !nextRunDate) {
            window.Toast.show('Profile name and next run date are required.', 'error');
            return false;
          }

          const catItem = window.AppStore.getById('items', itemId);
          const taxObj = taxes.find(t => t.id === catItem.taxRateId) || taxes[0];
          const subtotal = catItem.rate * qty;
          const taxVal = subtotal * ((taxObj ? taxObj.rate : 0) / 100);
          const total = subtotal + taxVal;

          const newProfile = {
            profileName,
            customerId,
            repeatEvery,
            startDate: today,
            nextRunDate,
            status: 'active',
            items: [
              {
                itemId: catItem.id,
                name: catItem.name,
                description: catItem.description,
                quantity: qty,
                rate: catItem.rate,
                discount: 0,
                taxRateId: taxObj ? taxObj.id : '',
                amount: subtotal
              }
            ],
            subtotal,
            taxTotal: taxVal,
            total,
            lastGeneratedDate: ''
          };

          window.AppStore.add('recurring', newProfile);
          window.Toast.show('Recurring profile created successfully!', 'success');
          this.render();
          return true;
        }
      });
    },

    deleteProfile(profileId) {
      window.Modal.confirm({
        title: 'Delete Recurring Profile',
        message: 'Are you sure you want to delete this recurring invoice profile?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('recurring', profileId);
          window.Toast.show('Recurring profile removed.', 'info');
          this.render();
        }
      });
    }
  };

  window.RecurringView = RecurringView;

})(window);
