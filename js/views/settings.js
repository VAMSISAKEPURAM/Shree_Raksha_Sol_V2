/**
 * ZOHO INVOICE - SETTINGS & CUSTOMIZATION MODULE
 * Organization profile, branding, currency, tax rates manager, theme colors, and JSON backup/restore.
 */

(function (window) {
  'use strict';

  const SettingsView = {
    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      const org = window.AppStore.getOrg();
      const taxes = window.AppStore.getAll('taxes');

      container.innerHTML = `
        <div class="settings-page animate-fadeIn" style="max-width: 900px; margin: 0 auto;">
          
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold" style="color: var(--text-main);">Business Profile & Preferences</h2>
              <p class="text-sm text-secondary">Manage company branding, currency, tax codes, and data management.</p>
            </div>
          </div>

          <!-- 1. ORGANIZATION PROFILE CARD -->
          <div class="table-card" style="padding: 1.75rem; margin-bottom: 2rem;">
            <h3 class="font-bold text-lg mb-4" style="color: var(--text-main);">Organization & Branding</h3>
            
            <form id="org-settings-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label required">Business Display Name</label>
                  <input type="text" id="set-name" class="form-control" value="${org.name}" required>
                </div>
                <div class="form-group">
                  <label class="form-label required">Legal Entity Name</label>
                  <input type="text" id="set-legal" class="form-control" value="${org.legalName}" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label required">Tax ID / GSTIN / EIN</label>
                  <input type="text" id="set-tax-id" class="form-control" value="${org.taxId}" required>
                </div>
                <div class="form-group">
                  <label class="form-label required">Official Billing Email</label>
                  <input type="email" id="set-email" class="form-control" value="${org.email}" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" id="set-phone" class="form-control" value="${org.phone}">
                </div>
                <div class="form-group">
                  <label class="form-label">Website</label>
                  <input type="url" id="set-web" class="form-control" value="${org.website}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">Physical / Billing Address</label>
                <textarea id="set-address" class="form-control" rows="3" required>${org.address}</textarea>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label required">Base Currency</label>
                  <select id="set-currency" class="input-select">
                    <option value="USD" ${org.currency === 'USD' ? 'selected' : ''}>USD - US Dollar ($)</option>
                    <option value="EUR" ${org.currency === 'EUR' ? 'selected' : ''}>EUR - Euro (€)</option>
                    <option value="GBP" ${org.currency === 'GBP' ? 'selected' : ''}>GBP - British Pound (£)</option>
                    <option value="INR" ${org.currency === 'INR' ? 'selected' : ''}>INR - Indian Rupee (₹)</option>
                    <option value="CAD" ${org.currency === 'CAD' ? 'selected' : ''}>CAD - Canadian Dollar ($)</option>
                    <option value="AUD" ${org.currency === 'AUD' ? 'selected' : ''}>AUD - Australian Dollar ($)</option>
                    <option value="JPY" ${org.currency === 'JPY' ? 'selected' : ''}>JPY - Japanese Yen (¥)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label required">Theme Mode</label>
                  <select id="set-theme" class="input-select">
                    <option value="dark" ${(localStorage.getItem('theme_mode') || 'dark') === 'dark' ? 'selected' : ''}>🌌 Dark Theme (Dark Slate #193440, Soft Slate #BAC8D9, Lime #9BF272 & Sage #7ABF5A)</option>
                    <option value="light" ${(localStorage.getItem('theme_mode') || 'dark') === 'light' ? 'selected' : ''}>✨ Light Theme (Pure White, Dark Text, Soft Slate #BAC8D9 & Sage #7ABF5A)</option>
                  </select>
                </div>
              </div>

              <div style="border-top: 1px solid var(--border-light); margin: 1.5rem 0 1rem; padding-top: 1.25rem;">
                <h4 style="font-weight: 700; font-size: 1rem; color: var(--text-main); margin-bottom: 0.75rem;">Company Banking Details (for GST Invoices & Estimates)</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label required">Bank Name</label>
                    <input type="text" id="set-bank-name" class="form-control" value="${org.bankName || 'State Bank of India'}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label required">Account Name</label>
                    <input type="text" id="set-account-name" class="form-control" value="${org.accountName || 'SHREERAKSHA SOLUTIONS'}" required>
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label required">Account Number</label>
                    <input type="text" id="set-account-number" class="form-control font-mono" value="${org.accountNumber || '45666081503'}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label required">Branch IFSC Code</label>
                    <input type="text" id="set-ifsc" class="form-control font-mono" value="${org.ifscCode || 'SBIN0016869'}" required>
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Branch & Address</label>
                    <input type="text" id="set-branch" class="form-control" value="${org.branch || 'PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi'}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">MICR Code</label>
                    <input type="text" id="set-micr" class="form-control font-mono" value="${org.micrCode || '576002012'}">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Default Wire & Bank Payment Notes</label>
                  <textarea id="set-bank" class="form-control" rows="3">${org.bankDetails || ''}</textarea>
                </div>
              </div>

              <div class="flex justify-end" style="margin-top: 1rem;">
                <button type="button" class="btn btn-primary" onclick="window.SettingsView.saveOrgProfile()">
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          <!-- 2. TAX RATES MANAGEMENT CARD -->
          <div class="table-card" style="margin-bottom: 2rem;">
            <div class="table-header-toolbar">
              <h3 class="table-title">Tax Rates</h3>
              <button class="btn btn-secondary btn-sm" onclick="window.SettingsView.promptTaxModal()">
                + Add Tax Rate
              </button>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tax Name</th>
                    <th>Rate %</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${taxes.map(t => `
                    <tr>
                      <td class="cell-primary">${t.name}</td>
                      <td class="font-bold">${t.rate}%</td>
                      <td class="cell-actions">
                        <button class="btn btn-secondary btn-sm" onclick="window.SettingsView.promptTaxModal('${t.id}')">Edit</button>
                        ${taxes.length > 1 ? `
                          <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.SettingsView.deleteTax('${t.id}')">Delete</button>
                        ` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- 3. BACKUP & RESTORE CARD -->
          <div class="table-card" style="padding: 1.75rem;">
            <h3 class="font-bold text-lg mb-2" style="color: var(--text-main);">Data Management & Portability</h3>
            <p class="text-sm text-secondary mb-4">Export all invoices, customer records, and ledger data to JSON, or restore from a backup.</p>

            <div class="flex items-center gap-3 flex-wrap">
              <button class="btn btn-secondary btn-icon-gap" onclick="window.SettingsView.exportDatabase()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Export Full Backup (JSON)</span>
              </button>

              <label class="btn btn-secondary btn-icon-gap" style="cursor: pointer;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Restore Backup File</span>
                <input type="file" id="import-json-file" accept=".json" style="display: none;" onchange="window.SettingsView.importDatabase(event)">
              </label>

              <button class="btn btn-outline btn-icon-gap" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.SettingsView.resetDemo()">
                <span>Reset to Seed Demo Data</span>
              </button>
            </div>
          </div>

        </div>
      `;
    },

    saveOrgProfile() {
      const currencyMap = {
        USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: '$', AUD: '$', JPY: '¥'
      };

      const selectedCurrency = document.getElementById('set-currency').value;
      const themeColor = document.getElementById('set-theme').value;

      const updates = {
        name: document.getElementById('set-name').value.trim(),
        legalName: document.getElementById('set-legal').value.trim(),
        taxId: document.getElementById('set-tax-id').value.trim(),
        email: document.getElementById('set-email').value.trim(),
        phone: document.getElementById('set-phone').value.trim(),
        website: document.getElementById('set-web').value.trim(),
        address: document.getElementById('set-address').value.trim(),
        currency: selectedCurrency,
        currencySymbol: currencyMap[selectedCurrency] || '$',
        themeColor: themeColor,
        bankName: document.getElementById('set-bank-name') ? document.getElementById('set-bank-name').value.trim() : (org.bankName || 'State Bank of India'),
        accountName: document.getElementById('set-account-name') ? document.getElementById('set-account-name').value.trim() : (org.accountName || 'SHREERAKSHA SOLUTIONS'),
        accountNumber: document.getElementById('set-account-number') ? document.getElementById('set-account-number').value.trim() : (org.accountNumber || '45666081503'),
        ifscCode: document.getElementById('set-ifsc') ? document.getElementById('set-ifsc').value.trim() : (org.ifscCode || 'SBIN0016869'),
        branch: document.getElementById('set-branch') ? document.getElementById('set-branch').value.trim() : (org.branch || 'PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi'),
        micrCode: document.getElementById('set-micr') ? document.getElementById('set-micr').value.trim() : (org.micrCode || '576002012'),
        bankDetails: document.getElementById('set-bank').value.trim()
      };

      window.AppStore.updateOrg(updates);

      // Apply theme class to body
      const selectedTheme = themeColor || 'dark';
      localStorage.setItem('theme_mode', selectedTheme);
      document.body.classList.remove('theme-dark', 'theme-light');
      document.body.classList.add(`theme-${selectedTheme}`);

      const themeToggle = document.getElementById('theme-toggle-switch');
      if (themeToggle) themeToggle.setAttribute('data-theme', selectedTheme);
      if (window.App && window.App.applyGlassTransparency) window.App.applyGlassTransparency();

      const headerCurr = document.getElementById('header-currency-code');
      if (headerCurr) headerCurr.textContent = `${updates.currency} (${updates.currencySymbol})`;

      window.Toast.show('Company profile and preferences saved!', 'success');
      this.render();
    },

    promptTaxModal(taxId = null) {
      const taxes = window.AppStore.getAll('taxes');
      const existing = taxId ? taxes.find(t => t.id === taxId) : null;
      const isEdit = !!existing;

      const contentHtml = `
        <div class="form-group">
          <label class="form-label required">Tax Name</label>
          <input type="text" id="tax-name" class="form-control" value="${existing ? existing.name : ''}" required placeholder="e.g. VAT, GST, Sales Tax">
        </div>
        <div class="form-group">
          <label class="form-label required">Rate Percentage (%)</label>
          <input type="number" step="0.01" id="tax-rate" class="form-control" value="${existing ? existing.rate : '10.0'}" required>
        </div>
      `;

      window.Modal.open({
        title: isEdit ? 'Edit Tax Rate' : 'Add New Tax Rate',
        contentHtml,
        size: 'sm',
        confirmText: isEdit ? 'Save Changes' : 'Add Tax',
        onConfirm: () => {
          const name = document.getElementById('tax-name').value.trim();
          const rate = parseFloat(document.getElementById('tax-rate').value);

          if (!name || isNaN(rate)) {
            window.Toast.show('Tax name and a valid rate are required.', 'error');
            return false;
          }

          if (isEdit) {
            window.AppStore.update('taxes', taxId, { name, rate });
            window.Toast.show('Tax rate updated.', 'success');
          } else {
            window.AppStore.add('taxes', { name, rate });
            window.Toast.show('Tax rate added.', 'success');
          }

          this.render();
          return true;
        }
      });
    },

    deleteTax(taxId) {
      window.Modal.confirm({
        title: 'Delete Tax Rate',
        message: 'Are you sure you want to delete this tax rate?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('taxes', taxId);
          window.Toast.show('Tax rate deleted.', 'info');
          this.render();
        }
      });
    },

    exportDatabase() {
      const json = window.AppStore.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zoho_invoice_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      window.Toast.show('Database backup exported to JSON!', 'success');
    },

    importDatabase(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const success = window.AppStore.importJSON(e.target.result);
        if (success) {
          window.Toast.show('Database successfully restored from JSON!', 'success');
          window.location.hash = '#dashboard';
          window.location.reload();
        } else {
          window.Toast.show('Invalid backup file format.', 'error');
        }
      };
      reader.readAsText(file);
    },

    resetDemo() {
      window.Modal.confirm({
        title: 'Reset to Demo Data',
        message: 'This will replace all current data with the initial Zoho sample dataset. Are you sure?',
        danger: true,
        onConfirm: () => {
          window.AppStore.resetToDemo();
          window.Toast.show('Database reset to fresh demo data.', 'info');
          window.location.hash = '#dashboard';
          window.location.reload();
        }
      });
    }
  };

  window.SettingsView = SettingsView;

})(window);
