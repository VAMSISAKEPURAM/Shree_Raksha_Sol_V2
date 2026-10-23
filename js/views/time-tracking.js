/**
 * ZOHO INVOICE - TIME TRACKING & PROJECTS
 * Projects, tasks, billable hour timesheets, and "Invoice from Hours" generator.
 */

(function (window) {
  'use strict';

  const TimeTrackingView = {
    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      const projects = window.AppStore.getAll('projects');
      const timesheets = window.AppStore.getAll('timesheets');
      const customers = window.AppStore.getAll('customers');

      const totalHours = timesheets.reduce((acc, t) => acc + (parseFloat(t.hours) || 0), 0);
      const unbilledTimesheets = timesheets.filter(t => t.billable && !t.invoiced);
      const unbilledHours = unbilledTimesheets.reduce((acc, t) => acc + (parseFloat(t.hours) || 0), 0);
      const unbilledValue = unbilledTimesheets.reduce((acc, t) => acc + ((parseFloat(t.hours) || 0) * (parseFloat(t.rate) || 0)), 0);

      container.innerHTML = `
        <div class="time-tracking-page animate-fadeIn">
          
          <!-- KPI METRICS -->
          <div class="kpi-grid">
            <div class="kpi-card accent-projects">
              <div class="kpi-header">
                <span class="kpi-title">Active Projects</span>
              </div>
              <div class="kpi-value">${projects.length}</div>
              <div class="kpi-subtext">Client engagements</div>
            </div>
            <div class="kpi-card accent-receivables">
              <div class="kpi-header">
                <span class="kpi-title">Total Logged Hours</span>
              </div>
              <div class="kpi-value">${totalHours.toFixed(1)} hrs</div>
              <div class="kpi-subtext">Across all tasks</div>
            </div>
            <div class="kpi-card accent-received">
              <div class="kpi-header">
                <span class="kpi-title">Unbilled Value</span>
              </div>
              <div class="kpi-value text-success">${window.Calculator.formatCurrency(unbilledValue)}</div>
              <div class="kpi-subtext">${unbilledHours.toFixed(1)} billable hrs ready to invoice</div>
            </div>
          </div>

          <!-- ACTIONS BAR -->
          <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <button class="btn btn-primary btn-icon-gap" onclick="window.Timer.promptStartModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Start Live Timer</span>
              </button>
              <button class="btn btn-secondary btn-icon-gap" onclick="window.TimeTrackingView.promptManualLog()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Log Time Manually</span>
              </button>
              <button class="btn btn-secondary" onclick="window.TimeTrackingView.promptNewProject()">
                + New Project
              </button>
            </div>

            ${unbilledTimesheets.length > 0 ? `
              <button class="btn btn-success btn-icon-gap" onclick="window.TimeTrackingView.invoiceHours()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                <span>Invoice Billable Hours (${window.Calculator.formatCurrency(unbilledValue)})</span>
              </button>
            ` : ''}
          </div>

          <!-- TIMESHEET LOG TABLE -->
          <div class="table-card">
            <div class="table-header-toolbar">
              <div class="table-title-area">
                <h3 class="table-title">Logged Timesheets</h3>
                <span class="table-count-badge">${timesheets.length} Entries</span>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Task</th>
                    <th>Notes / Work Summary</th>
                    <th>Hours</th>
                    <th>Hourly Rate</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${timesheets.length === 0 ? `
                    <tr>
                      <td colspan="9" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">
                        No time logged yet. Start the stopwatch timer or log manual hours.
                      </td>
                    </tr>
                  ` : timesheets.map(t => {
                    const proj = window.AppStore.getById('projects', t.projectId);
                    const task = proj && proj.tasks ? proj.tasks.find(tsk => tsk.id === t.taskId) : null;
                    const val = (parseFloat(t.hours) || 0) * (parseFloat(t.rate) || 0);

                    return `
                      <tr>
                        <td>${window.Calculator.formatDate(t.date)}</td>
                        <td class="cell-primary">${proj ? proj.name : 'Unknown Project'}</td>
                        <td>${task ? task.name : 'General Task'}</td>
                        <td class="text-xs text-muted" style="max-width: 240px;">${t.notes || '—'}</td>
                        <td class="font-bold">${t.hours} hrs</td>
                        <td>${window.Calculator.formatCurrency(t.rate)}/hr</td>
                        <td class="font-bold text-success">${window.Calculator.formatCurrency(val)}</td>
                        <td>
                          <span class="badge ${t.invoiced ? 'badge-paid' : 'badge-draft'}">
                            ${t.invoiced ? 'Invoiced' : (t.billable ? 'Unbilled' : 'Non-billable')}
                          </span>
                        </td>
                        <td class="cell-actions">
                          <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.TimeTrackingView.deleteTime('${t.id}')">
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

    promptNewProject() {
      const customers = window.AppStore.getAll('customers');
      if (customers.length === 0) {
        window.Toast.show('Please create a customer first.', 'warning');
        return;
      }

      const custOptions = customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

      const contentHtml = `
        <form id="new-proj-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Project Name</label>
              <input type="text" id="np-name" class="form-control" required placeholder="e.g. Mobile App Redesign">
            </div>
            <div class="form-group">
              <label class="form-label required">Customer</label>
              <select id="np-customer" class="input-select">
                ${custOptions}
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Hourly Rate ($)</label>
              <input type="number" step="0.01" id="np-rate" class="form-control" value="125.00" required>
            </div>
            <div class="form-group">
              <label class="form-label">Initial Task Name</label>
              <input type="text" id="np-task" class="form-control" value="Development & Architecture" placeholder="e.g. Planning">
            </div>
          </div>
        </form>
      `;

      window.Modal.open({
        title: 'Create New Project',
        contentHtml,
        size: 'md',
        confirmText: 'Create Project',
        onConfirm: () => {
          const name = document.getElementById('np-name').value.trim();
          const customerId = document.getElementById('np-customer').value;
          const rate = parseFloat(document.getElementById('np-rate').value) || 100;
          const taskName = document.getElementById('np-task').value.trim() || 'General Development';

          if (!name) {
            window.Toast.show('Project name is required.', 'error');
            return false;
          }

          const newProj = {
            name,
            customerId,
            billingMethod: 'hourly',
            ratePerHour: rate,
            status: 'active',
            tasks: [
              { id: 'task-' + Date.now(), name: taskName, budgetHours: 40 }
            ]
          };

          window.AppStore.add('projects', newProj);
          window.Toast.show('Project created successfully!', 'success');
          this.render();
          return true;
        }
      });
    },

    promptManualLog() {
      const projects = window.AppStore.getAll('projects');
      if (projects.length === 0) {
        window.Toast.show('Please create a project first.', 'warning');
        return;
      }

      const today = new Date().toISOString().substring(0, 10);
      const projOptions = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      const firstProj = projects[0];
      const taskOptions = (firstProj.tasks || []).map(t => `<option value="${t.id}">${t.name}</option>`).join('');

      const contentHtml = `
        <form id="manual-time-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Select Project</label>
              <select id="ml-proj" class="input-select">
                ${projOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Select Task</label>
              <select id="ml-task" class="input-select">
                ${taskOptions}
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Date</label>
              <input type="date" id="ml-date" class="form-control" value="${today}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Hours Spent</label>
              <input type="number" step="0.25" min="0.25" id="ml-hours" class="form-control" value="2.0" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes / Task Summary</label>
            <input type="text" id="ml-notes" class="form-control" placeholder="What did you work on?">
          </div>
        </form>
      `;

      window.Modal.open({
        title: 'Log Billable Hours Manually',
        contentHtml,
        size: 'md',
        confirmText: 'Save Log',
        onRender: (dialog) => {
          const projSelect = dialog.querySelector('#ml-proj');
          const taskSelect = dialog.querySelector('#ml-task');

          projSelect.addEventListener('change', () => {
            const p = window.AppStore.getById('projects', projSelect.value);
            if (p && p.tasks) {
              taskSelect.innerHTML = p.tasks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }
          });
        },
        onConfirm: () => {
          const projectId = document.getElementById('ml-proj').value;
          const taskId = document.getElementById('ml-task').value;
          const date = document.getElementById('ml-date').value;
          const hours = parseFloat(document.getElementById('ml-hours').value);
          const notes = document.getElementById('ml-notes').value.trim();

          if (!projectId || !date || isNaN(hours) || hours <= 0) {
            window.Toast.show('Valid project, date, and hours are required.', 'error');
            return false;
          }

          const project = window.AppStore.getById('projects', projectId);
          const rate = project ? (project.ratePerHour || 100) : 100;

          const newTimesheet = {
            projectId,
            taskId,
            date,
            hours,
            rate,
            billable: true,
            invoiced: false,
            notes
          };

          window.AppStore.add('timesheets', newTimesheet);
          window.Toast.show(`${hours} hours logged successfully!`, 'success');
          this.render();
          return true;
        }
      });
    },

    invoiceHours() {
      const unbilled = window.AppStore.getAll('timesheets').filter(t => t.billable && !t.invoiced);
      if (unbilled.length === 0) {
        window.Toast.show('No unbilled hours available.', 'info');
        return;
      }

      // Group unbilled hours by customer
      const custHoursMap = {};
      unbilled.forEach(t => {
        const proj = window.AppStore.getById('projects', t.projectId);
        if (proj && proj.customerId) {
          if (!custHoursMap[proj.customerId]) custHoursMap[proj.customerId] = [];
          custHoursMap[proj.customerId].push(t);
        }
      });

      const custIds = Object.keys(custHoursMap);
      if (custIds.length === 0) {
        window.Toast.show('No linked customers found for unbilled projects.', 'warning');
        return;
      }

      const custOptions = custIds.map(cId => {
        const c = window.AppStore.getById('customers', cId);
        const totalH = custHoursMap[cId].reduce((a, b) => a + (parseFloat(b.hours) || 0), 0);
        return `<option value="${cId}">${c ? c.name : 'Client'} (${totalH.toFixed(1)} unbilled hours)</option>`;
      }).join('');

      const contentHtml = `
        <div class="form-group">
          <label class="form-label required">Select Customer to Invoice</label>
          <select id="inv-hours-cust" class="input-select w-full">
            ${custOptions}
          </select>
        </div>
      `;

      window.Modal.open({
        title: 'Generate Invoice from Unbilled Hours',
        contentHtml,
        size: 'sm',
        confirmText: 'Generate Invoice',
        onConfirm: () => {
          const customerId = document.getElementById('inv-hours-cust').value;
          const timesheetEntries = custHoursMap[customerId];
          if (!timesheetEntries) return true;

          const taxes = window.AppStore.getAll('taxes');
          const taxObj = taxes[1] || taxes[0]; // standard sales tax or zero tax

          // Convert each timesheet entry to an invoice line item
          const lineItems = timesheetEntries.map(t => {
            const proj = window.AppStore.getById('projects', t.projectId);
            const task = proj && proj.tasks ? proj.tasks.find(tsk => tsk.id === t.taskId) : null;
            const amount = window.Calculator.computeLineAmount(t.hours, t.rate, 0);

            return {
              itemId: '',
              name: `${proj ? proj.name : 'Project'} - ${task ? task.name : 'Development'}`,
              description: `Date: ${t.date} &bull; ${t.notes || 'Logged consulting hours'}`,
              quantity: t.hours,
              rate: t.rate,
              discount: 0,
              taxRateId: taxObj ? taxObj.id : '',
              amount
            };
          });

          const totals = window.Calculator.computeDocumentTotals(lineItems, taxes, 0);
          const invNumber = window.AppStore.getNextNumber('invoice');
          const today = new Date().toISOString().substring(0, 10);
          const dueDate = window.Calculator.addDays(today, 30);

          const newInvoice = {
            id: 'inv-' + Date.now(),
            number: invNumber,
            customerId: customerId,
            date: today,
            dueDate: dueDate,
            paymentTerms: 'Net 30',
            status: 'sent',
            items: lineItems,
            subtotal: totals.subtotal,
            discountTotal: 0,
            taxTotal: totals.taxTotal,
            adjustment: 0,
            total: totals.total,
            amountPaid: 0,
            balanceDue: totals.total,
            notes: 'Generated from billable project timesheets.',
            terms: window.AppStore.getOrg().defaultTerms,
            history: [
              { date: today + ' 09:00', action: `Invoice created from ${timesheetEntries.length} logged timesheets`, user: 'Time Tracker' }
            ]
          };

          window.AppStore.add('invoices', newInvoice);

          // Mark timesheets as invoiced
          timesheetEntries.forEach(t => {
            window.AppStore.update('timesheets', t.id, { invoiced: true });
          });

          window.Toast.show(`Created Invoice ${invNumber} from ${timesheetEntries.length} timesheets!`, 'success');
          window.location.hash = `#invoices?id=${newInvoice.id}`;
          return true;
        }
      });
    },

    deleteTime(id) {
      window.Modal.confirm({
        title: 'Delete Timesheet',
        message: 'Are you sure you want to delete this logged timesheet entry?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('timesheets', id);
          window.Toast.show('Timesheet entry deleted.', 'info');
          this.render();
        }
      });
    }
  };

  window.TimeTrackingView = TimeTrackingView;

})(window);
