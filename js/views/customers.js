/**
 * ZOHO INVOICE - CUSTOMERS & VENDORS MODULE (SPATIAL GLASSMORPHIC)
 * Unified directory for Customers and Vendors with category filtering,
 * up to 10 contact persons per entity, expanded double-sized creation modal,
 * and comprehensive 360 transaction ledger.
 */

(function (window) {
  'use strict';

  const CustomersView = {
    searchQuery: '',
    currentCategoryFilter: 'all', // 'all', 'customer', 'vendor'

    render(idParam = null, categoryParam = null) {
      const container = document.getElementById('app-view');
      if (!container) return;

      if (categoryParam) {
        this.currentCategoryFilter = categoryParam;
      }

      const allParties = window.AppStore.getAll('customers') || [];
      const invoices = window.AppStore.getAll('invoices') || [];
      const purchaseOrders = window.AppStore.getAll('purchaseOrders') || [];

      // Counters
      const custCount = allParties.filter(p => p.category !== 'vendor').length;
      const vendorCount = allParties.filter(p => p.category === 'vendor').length;

      // Update sidebar counters
      const sidebarAll = document.getElementById('nav-count-customers');
      if (sidebarAll) sidebarAll.textContent = allParties.length;
      const sidebarCust = document.getElementById('nav-count-only-customers');
      if (sidebarCust) sidebarCust.textContent = custCount;
      const sidebarVen = document.getElementById('nav-count-only-vendors');
      if (sidebarVen) sidebarVen.textContent = vendorCount;

      // Filter by category
      let filtered = allParties;
      if (this.currentCategoryFilter === 'customer') {
        filtered = allParties.filter(p => p.category !== 'vendor');
      } else if (this.currentCategoryFilter === 'vendor') {
        filtered = allParties.filter(p => p.category === 'vendor');
      }

      // Filter by search query
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.taxId && c.taxId.toLowerCase().includes(q)) ||
          (c.contactPersons && c.contactPersons.some(cp => 
            (cp.name && cp.name.toLowerCase().includes(q)) ||
            (cp.email && cp.email.toLowerCase().includes(q)) ||
            (cp.phone && cp.phone.toLowerCase().includes(q)) ||
            (cp.designation && cp.designation.toLowerCase().includes(q))
          ))
        );
      }

      const titleMap = {
        'all': 'Customers & Vendors Directory',
        'customer': 'Customer Directory',
        'vendor': 'Vendor Directory'
      };

      container.innerHTML = `
        <div class="customers-page animate-fadeIn">
          
          <div class="table-card glass-panel" style="margin-bottom: 2rem;">
            <div class="table-header-toolbar" style="padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <h2 class="table-title" style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-main);">
                    ${titleMap[this.currentCategoryFilter] || 'Contacts Directory'}
                  </h2>
                  <span class="badge badge-draft" style="font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-full);">
                    ${filtered.length} Entities
                  </span>
                </div>
                
                <!-- FILTER TABS -->
                <div style="display: flex; gap: 0.4rem; margin-top: 0.75rem;">
                  <button class="filter-tab-pill ${this.currentCategoryFilter === 'all' ? 'active' : ''}" onclick="window.CustomersView.setFilter('all')">
                    All Contacts (${allParties.length})
                  </button>
                  <button class="filter-tab-pill ${this.currentCategoryFilter === 'customer' ? 'active' : ''}" onclick="window.CustomersView.setFilter('customer')">
                    🏢 Customers (${custCount})
                  </button>
                  <button class="filter-tab-pill ${this.currentCategoryFilter === 'vendor' ? 'active' : ''}" onclick="window.CustomersView.setFilter('vendor')">
                    🏭 Vendors (${vendorCount})
                  </button>
                </div>
              </div>

              <div class="table-actions-area" style="display: flex; align-items: center; gap: 0.75rem;">
                <input 
                  type="text" 
                  id="customer-search-input" 
                  class="table-search-input" 
                  placeholder="Search name, GSTIN, contact person, email..." 
                  value="${this.searchQuery}"
                  style="min-width: 280px; padding: 0.55rem 1rem; border-radius: var(--radius-md); background: var(--surface-muted); border: 1px solid var(--border-light); color: var(--text-main);"
                >
                <button class="btn btn-primary btn-icon-gap" onclick="window.CustomersView.promptCustomerModal()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New Customer / Vendor</span>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 10%;">Category</th>
                    <th style="width: 24%;">Entity / Company Name</th>
                    <th style="width: 14%;">GSTIN / Tax ID</th>
                    <th style="width: 18%;">Contact Persons</th>
                    <th style="width: 12%;">Payment Terms</th>
                    <th style="width: 12%;">Place of Supply</th>
                    <th class="text-right" style="width: 10%;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="7" class="text-center" style="padding: 3rem 1rem; color: var(--text-muted);">
                        <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem;">No parties found matching criteria.</div>
                        <div class="text-xs">Click "+ New Customer / Vendor" to register a client or supplier.</div>
                      </td>
                    </tr>
                  ` : filtered.map(c => {
                    const isVendor = c.category === 'vendor';
                    const contactsList = c.contactPersons || [];
                    const primaryContact = contactsList[0] || { name: c.name, email: c.email, phone: c.phone, designation: 'Primary' };

                    return `
                      <tr>
                        <td>
                          <span class="badge ${isVendor ? 'badge-sent' : 'badge-paid'}" style="font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.04em;">
                            ${isVendor ? '🏭 Vendor' : '🏢 Customer'}
                          </span>
                        </td>
                        <td>
                          <div class="font-medium text-main" style="font-size: 0.95rem;">
                            <a href="javascript:void(0)" onclick="window.CustomersView.view360('${c.id}')" class="customer-name-link">
                              ${c.company || c.name}
                            </a>
                          </div>
                          ${c.company && c.name && c.company !== c.name ? `<div class="text-xs text-muted">Contact: ${c.name}</div>` : ''}
                          <div class="text-xs text-muted" style="display: flex; gap: 0.5rem; margin-top: 2px;">
                            <span>✉️ ${c.email || 'No email'}</span>
                            <span>📞 ${c.phone || 'No phone'}</span>
                          </div>
                        </td>
                        <td>
                          ${c.taxId ? `
                            <span class="font-mono text-xs font-medium" style="background: var(--surface-muted); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-light); color: var(--text-main);">
                              ${c.taxId}
                            </span>
                          ` : `<span class="text-muted text-xs">—</span>`}
                        </td>
                        <td>
                          ${contactsList.length > 0 ? `
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                              <div class="font-medium text-xs text-main">
                                👤 ${primaryContact.name} ${primaryContact.designation ? `(${primaryContact.designation})` : ''}
                              </div>
                              ${contactsList.length > 1 ? `
                                <div class="text-xs text-secondary font-medium" style="cursor: pointer;" onclick="window.CustomersView.view360('${c.id}')">
                                  +${contactsList.length - 1} more contact person(s)
                                </div>
                              ` : ''}
                            </div>
                          ` : `
                            <span class="text-muted text-xs">Single Contact</span>
                          `}
                        </td>
                        <td>
                          <span class="badge badge-draft" style="font-weight: 400;">
                            ${c.paymentTerms || '30 days net'}
                          </span>
                        </td>
                        <td>
                          <span class="text-xs font-medium text-secondary">
                            ${c.placeOfSupply || 'Karnataka (29)'}
                          </span>
                        </td>
                        <td class="cell-actions text-right">
                          <button class="btn btn-secondary btn-sm" onclick="window.CustomersView.view360('${c.id}')" title="View 360 Statement">View 360</button>
                          <button class="btn btn-secondary btn-sm" onclick="window.CustomersView.promptCustomerModal('${c.id}')" title="Edit Master Record">Edit</button>
                          <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.CustomersView.deleteCustomer('${c.id}')" title="Delete Record">✕</button>
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

      const searchInput = document.getElementById('customer-search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(this.searchQuery.length, this.searchQuery.length);
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.render();
        });
      }

      if (idParam) {
        this.view360(idParam);
      }
    },

    setFilter(category) {
      this.currentCategoryFilter = category;
      window.location.hash = `#customers?type=${category}`;
      this.render();
    },

    // DOUBLE-SIZED MASTER CREATION MODAL WITH UP TO 10 CONTACT PERSONS
    promptCustomerModal(customerId = null) {
      const existing = customerId ? window.AppStore.getById('customers', customerId) : null;
      const isEdit = !!existing;

      // Existing contact persons or seeded initial row
      let contactPersons = existing && Array.isArray(existing.contactPersons) && existing.contactPersons.length > 0
        ? JSON.parse(JSON.stringify(existing.contactPersons))
        : [{ name: existing ? existing.name || '' : '', designation: 'Manager / Purchase Head', email: existing ? existing.email || '' : '', phone: existing ? existing.phone || '' : '' }];

      const initialCategory = existing ? (existing.category || 'customer') : (this.currentCategoryFilter === 'vendor' ? 'vendor' : 'customer');
      const initialTerms = existing ? (existing.paymentTerms || '30 days net') : '30 days net';

      const contentHtml = `
        <form id="party-master-form" class="party-expanded-form">
          
          <!-- SECTION 1: CATEGORY & GENERAL IDENTITY -->
          <div style="background: var(--surface-muted); padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <h3 style="font-size: 1.05rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-main);">
                1. Entity Identity & Category
              </h3>
              <span class="badge badge-paid" id="pmf-category-badge" style="font-weight: 700; text-transform: uppercase;">
                ${initialCategory === 'vendor' ? '🏭 Vendor / Supplier' : '🏢 Customer / Client'}
              </span>
            </div>

            <div class="form-grid" style="grid-template-columns: 240px 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label required">Category (1st Dropdown)</label>
                <select id="pmf-category" class="input-select font-bold" required>
                  <option value="customer" ${initialCategory === 'customer' ? 'selected' : ''}>🏢 Customer (Client / Buyer)</option>
                  <option value="vendor" ${initialCategory === 'vendor' ? 'selected' : ''}>🏭 Vendor (Supplier / Service Provider)</option>
                </select>
                <span class="input-help">Select whether this record is a Customer or Vendor</span>
              </div>

              <div class="form-group">
                <label class="form-label required">Name of Customer / Vendor (Entity Name)</label>
                <input type="text" id="pmf-name" class="form-control font-bold" value="${existing ? existing.name : ''}" required placeholder="e.g. Manipal Speciality Chemicals Pvt Ltd">
                <span class="input-help">Company name or legal business entity name</span>
              </div>

              <div class="form-group">
                <label class="form-label">Trade / Display Name</label>
                <input type="text" id="pmf-company" class="form-control" value="${existing ? (existing.company || existing.name) : ''}" placeholder="e.g. Manipal Speciality Chemicals">
                <span class="input-help">Short business name for invoices & correspondence</span>
              </div>
            </div>
          </div>

          <!-- SECTION 2: GST & PAYMENT TERMS -->
          <div style="background: var(--surface-muted); padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.05rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-main); margin-bottom: 1rem;">
              2. Taxation & Commercial Payment Terms
            </h3>

            <div class="form-grid" style="grid-template-columns: 1fr 1.2fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label required">Payment Terms</label>
                <select id="pmf-terms" class="input-select font-semibold" required>
                  <option value="100% advance" ${initialTerms === '100% advance' ? 'selected' : ''}>100% advance</option>
                  <option value="Due on receipt" ${initialTerms === 'Due on receipt' ? 'selected' : ''}>Due on receipt</option>
                  <option value="15 days net" ${initialTerms === '15 days net' ? 'selected' : ''}>15 days net</option>
                  <option value="30 days net" ${initialTerms === '30 days net' ? 'selected' : ''}>30 days net (Standard)</option>
                  <option value="45 days net" ${initialTerms === '45 days net' ? 'selected' : ''}>45 days net</option>
                  <option value="60 days net" ${initialTerms === '60 days net' ? 'selected' : ''}>60 days net</option>
                </select>
                <span class="input-help">Credit period agreed for settlement</span>
              </div>

              <div class="form-group">
                <label class="form-label">GSTIN / Tax ID</label>
                <input type="text" id="pmf-tax-id" class="form-control font-mono font-bold" value="${existing ? existing.taxId || '' : ''}" placeholder="e.g. 29AATCM4200G1ZD" maxlength="15">
                <span class="input-help">15-digit GST identification number</span>
              </div>

              <div class="form-group">
                <label class="form-label required">Place of Supply (GST)</label>
                <select id="pmf-pos" class="input-select font-semibold" required>
                  <option value="Karnataka (29)" ${!existing || existing.placeOfSupply === 'Karnataka (29)' ? 'selected' : ''}>Karnataka (29) [Intra-State: CGST+SGST]</option>
                  <option value="Maharashtra (27)" ${existing && existing.placeOfSupply === 'Maharashtra (27)' ? 'selected' : ''}>Maharashtra (27) [Inter-State: IGST]</option>
                  <option value="Tamil Nadu (33)" ${existing && existing.placeOfSupply === 'Tamil Nadu (33)' ? 'selected' : ''}>Tamil Nadu (33) [Inter-State: IGST]</option>
                  <option value="Kerala (32)" ${existing && existing.placeOfSupply === 'Kerala (32)' ? 'selected' : ''}>Kerala (32) [Inter-State: IGST]</option>
                  <option value="Andhra Pradesh (37)" ${existing && existing.placeOfSupply === 'Andhra Pradesh (37)' ? 'selected' : ''}>Andhra Pradesh (37) [Inter-State: IGST]</option>
                  <option value="Telangana (36)" ${existing && existing.placeOfSupply === 'Telangana (36)' ? 'selected' : ''}>Telangana (36) [Inter-State: IGST]</option>
                  <option value="Delhi (07)" ${existing && existing.placeOfSupply === 'Delhi (07)' ? 'selected' : ''}>Delhi (07) [Inter-State: IGST]</option>
                  <option value="Gujarat (24)" ${existing && existing.placeOfSupply === 'Gujarat (24)' ? 'selected' : ''}>Gujarat (24) [Inter-State: IGST]</option>
                </select>
                <span class="input-help">State governing tax calculation</span>
              </div>
            </div>
          </div>

          <!-- SECTION 3: BILLING & SHIPPING ADDRESS -->
          <div style="background: var(--surface-muted); padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h3 style="font-size: 1.05rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-main);">
                3. Billing & Shipping Address
              </h3>
              <button type="button" class="btn btn-secondary btn-sm" id="pmf-copy-address-btn" style="font-size: 0.75rem;">
                📋 Copy Billing to Shipping Address
              </button>
            </div>

            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group">
                <label class="form-label required">Billing Address</label>
                <textarea id="pmf-billing" class="form-control" rows="3" placeholder="52/1A, Udayavani Building, Tile Factory Road, Manipal, Udupi, Karnataka, India 576104" required>${existing ? (existing.billingAddress || existing.address || '') : ''}</textarea>
                <span class="input-help">Printed on official Quotations, Invoices, and Credit Notes</span>
              </div>

              <div class="form-group">
                <label class="form-label">Shipping / Delivery Address</label>
                <textarea id="pmf-shipping" class="form-control" rows="3" placeholder="Same as billing or destination warehouse / facility address">${existing ? existing.shippingAddress || '' : ''}</textarea>
                <span class="input-help">Delivery location for materials and goods</span>
              </div>
            </div>
          </div>

          <!-- SECTION 4: CONTACT PERSONS DIRECTORY (UP TO 10 PERSONS) -->
          <div style="background: var(--surface-muted); padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-main);">
                  4. Contact Persons Directory
                </h3>
                <span class="text-xs text-muted" id="pmf-contact-count-badge">
                  ${contactPersons.length} / 10 Contact Persons configured
                </span>
              </div>
              <button type="button" class="btn btn-primary btn-sm btn-icon-gap" id="pmf-add-contact-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Add Contact Person</span>
              </button>
            </div>

            <div id="pmf-contacts-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <!-- Contact Person rows injected here -->
            </div>
          </div>

          <!-- SECTION 5: INTERNAL NOTES -->
          <div class="form-group">
            <label class="form-label">Internal Client / Vendor Notes</label>
            <textarea id="pmf-notes" class="form-control" rows="2" placeholder="Internal remarks, specific delivery instructions, banking conditions, etc.">${existing ? existing.notes || '' : ''}</textarea>
          </div>

        </form>
      `;

      let workingContacts = contactPersons;

      window.Modal.open({
        title: isEdit ? `Edit ${initialCategory === 'vendor' ? 'Vendor' : 'Customer'}: ${existing.name}` : 'New Customer / Vendor Master Registration',
        contentHtml,
        size: '2xl', // Expands to double size (1360px wide)
        confirmText: isEdit ? 'Save Master Changes' : 'Save Customer / Vendor',
        onRender: (dialog) => {
          const categorySelect = dialog.querySelector('#pmf-category');
          const categoryBadge = dialog.querySelector('#pmf-category-badge');
          const contactsContainer = dialog.querySelector('#pmf-contacts-container');
          const addContactBtn = dialog.querySelector('#pmf-add-contact-btn');
          const countBadge = dialog.querySelector('#pmf-contact-count-badge');
          const copyAddressBtn = dialog.querySelector('#pmf-copy-address-btn');

          categorySelect.addEventListener('change', () => {
            if (categorySelect.value === 'vendor') {
              categoryBadge.className = 'badge badge-sent';
              categoryBadge.textContent = '🏭 Vendor / Supplier';
            } else {
              categoryBadge.className = 'badge badge-paid';
              categoryBadge.textContent = '🏢 Customer / Client';
            }
          });

          copyAddressBtn.addEventListener('click', () => {
            const billingVal = dialog.querySelector('#pmf-billing').value;
            dialog.querySelector('#pmf-shipping').value = billingVal;
            window.Toast.show('Billing address copied to Shipping address.', 'info');
          });

          const renderContacts = () => {
            countBadge.textContent = `${workingContacts.length} / 10 Contact Persons configured`;
            if (workingContacts.length >= 10) {
              addContactBtn.style.display = 'none';
            } else {
              addContactBtn.style.display = 'inline-flex';
            }

            contactsContainer.innerHTML = workingContacts.map((cp, idx) => `
              <div class="contact-person-row glass-card" style="padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); background: var(--surface); display: grid; grid-template-columns: 28px 1.2fr 1fr 1.2fr 1fr 36px; gap: 0.75rem; align-items: center;">
                <div class="font-bold text-muted text-xs text-center">${idx + 1}</div>
                <div>
                  <input type="text" class="form-control form-control-sm cp-name" data-index="${idx}" value="${cp.name || ''}" placeholder="Contact Person Name *" required>
                </div>
                <div>
                  <input type="text" class="form-control form-control-sm cp-designation" data-index="${idx}" value="${cp.designation || ''}" placeholder="Designation / Dept">
                </div>
                <div>
                  <input type="email" class="form-control form-control-sm cp-email" data-index="${idx}" value="${cp.email || ''}" placeholder="Email Address">
                </div>
                <div>
                  <input type="tel" class="form-control form-control-sm cp-phone" data-index="${idx}" value="${cp.phone || ''}" placeholder="Phone / Mobile No">
                </div>
                <div class="text-center">
                  ${workingContacts.length > 1 ? `
                    <button type="button" class="icon-btn-ghost btn-sm cp-remove" data-index="${idx}" style="color: var(--color-overdue);" title="Remove this contact">
                      &times;
                    </button>
                  ` : `
                    <span class="text-xs text-muted" title="Primary Contact">★</span>
                  `}
                </div>
              </div>
            `).join('');

            attachContactEvents();
          };

          const attachContactEvents = () => {
            dialog.querySelectorAll('.cp-name').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingContacts[e.target.dataset.index].name = e.target.value;
              });
            });
            dialog.querySelectorAll('.cp-designation').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingContacts[e.target.dataset.index].designation = e.target.value;
              });
            });
            dialog.querySelectorAll('.cp-email').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingContacts[e.target.dataset.index].email = e.target.value;
              });
            });
            dialog.querySelectorAll('.cp-phone').forEach(inp => {
              inp.addEventListener('input', (e) => {
                workingContacts[e.target.dataset.index].phone = e.target.value;
              });
            });
            dialog.querySelectorAll('.cp-remove').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                workingContacts.splice(idx, 1);
                renderContacts();
              });
            });
          };

          addContactBtn.addEventListener('click', () => {
            if (workingContacts.length < 10) {
              workingContacts.push({ name: '', designation: '', email: '', phone: '' });
              renderContacts();
            } else {
              window.Toast.show('Maximum 10 contact persons can be added per party.', 'warning');
            }
          });

          renderContacts();
        },
        onConfirm: () => {
          const category = document.getElementById('pmf-category').value;
          const name = document.getElementById('pmf-name').value.trim();
          const company = document.getElementById('pmf-company').value.trim() || name;
          const billingAddress = document.getElementById('pmf-billing').value.trim();
          const shippingAddress = document.getElementById('pmf-shipping').value.trim() || billingAddress;
          const paymentTerms = document.getElementById('pmf-terms').value;
          const taxId = document.getElementById('pmf-tax-id').value.trim();
          const placeOfSupply = document.getElementById('pmf-pos').value;
          const notes = document.getElementById('pmf-notes').value.trim();

          if (!name || !billingAddress) {
            window.Toast.show('Entity Name and Billing Address are required.', 'error');
            return false;
          }

          // Clean valid contact persons
          const validContacts = workingContacts.filter(c => c.name && c.name.trim().length > 0);
          if (validContacts.length === 0) {
            validContacts.push({ name, designation: 'Primary', email: '', phone: '' });
          }

          const primary = validContacts[0];

          const partyData = {
            category,
            name,
            company,
            billingAddress,
            address: billingAddress,
            shippingAddress,
            paymentTerms,
            taxId,
            gstin: taxId,
            placeOfSupply,
            notes,
            email: primary.email || '',
            phone: primary.phone || '',
            contactPersons: validContacts
          };

          if (isEdit) {
            window.AppStore.update('customers', customerId, partyData);
            window.Toast.show(`${category === 'vendor' ? 'Vendor' : 'Customer'} updated successfully!`, 'success');
          } else {
            window.AppStore.add('customers', partyData);
            window.Toast.show(`New ${category === 'vendor' ? 'Vendor' : 'Customer'} created successfully!`, 'success');
          }

          this.render();
          return true;
        }
      });
    },

    deleteCustomer(customerId) {
      const c = window.AppStore.getById('customers', customerId);
      if (!c) return;

      const invoices = window.AppStore.getAll('invoices');
      const pos = window.AppStore.getAll('purchaseOrders');
      const linkedInv = invoices.filter(i => i.customerId === customerId);
      const linkedPO = pos.filter(p => p.vendorId === customerId);

      if (linkedInv.length > 0 || linkedPO.length > 0) {
        window.Toast.show(`Cannot delete record with ${linkedInv.length} linked invoices and ${linkedPO.length} linked POs.`, 'error');
        return;
      }

      window.Modal.confirm({
        title: `Delete ${c.category === 'vendor' ? 'Vendor' : 'Customer'}`,
        message: `Are you sure you want to delete ${c.name}? All master records will be removed.`,
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('customers', customerId);
          window.Toast.show('Record deleted from master directory.', 'info');
          this.render();
        }
      });
    },

    // 360 STATEMENT & CONTACT DIRECTORY MODAL
    view360(customerId) {
      const c = window.AppStore.getById('customers', customerId);
      if (!c) return;

      const invoices = (window.AppStore.getAll('invoices') || []).filter(i => i.customerId === customerId);
      const quotes = (window.AppStore.getAll('estimates') || []).filter(e => e.customerId === customerId);
      const pos = (window.AppStore.getAll('purchaseOrders') || []).filter(p => p.vendorId === customerId);
      const notes = (window.AppStore.getAll('debitCreditNotes') || []).filter(n => n.partyId === customerId);

      const totalInvoiced = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
      const totalBalance = invoices.reduce((acc, i) => acc + (i.balanceDue != null ? i.balanceDue : (i.total - (i.amountPaid || 0))), 0);
      const totalPO = pos.reduce((acc, p) => acc + (p.total || 0), 0);

      const contacts = c.contactPersons || [{ name: c.name, designation: 'Primary', email: c.email, phone: c.phone }];

      const contentHtml = `
        <div class="customer-360-view">
          
          <!-- TOP PROFILE CARD -->
          <div style="background: var(--surface-muted); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid var(--border-light);">
            <div class="flex justify-between items-start mb-3">
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span class="badge ${c.category === 'vendor' ? 'badge-sent' : 'badge-paid'}" style="font-weight: 700; text-transform: uppercase;">
                    ${c.category === 'vendor' ? '🏭 Vendor' : '🏢 Customer'}
                  </span>
                  <h3 class="text-2xl font-bold text-main">${c.company || c.name}</h3>
                </div>
                <p class="text-sm text-secondary" style="margin-top: 4px;">
                  <strong>GSTIN:</strong> ${c.taxId || 'Unregistered'} &bull; 
                  <strong>Place of Supply:</strong> ${c.placeOfSupply || 'Karnataka (29)'} &bull; 
                  <strong>Payment Terms:</strong> ${c.paymentTerms || '30 days net'}
                </p>
                <div class="text-xs text-muted" style="margin-top: 4px; white-space: pre-line;">
                  <strong>Billing Address:</strong> ${c.billingAddress || c.address || 'Not provided'}
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="window.CustomersView.promptCustomerModal('${c.id}'); window.Modal.close();">
                Edit Master
              </button>
            </div>

            <!-- FINANCIAL METRICS -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; border-top: 1px solid var(--border-light); padding-top: 1rem; margin-top: 1rem;">
              <div>
                <span class="text-xs text-muted font-semibold uppercase">Total Invoiced</span>
                <div class="text-lg font-bold text-main">${window.Calculator.formatCurrency(totalInvoiced)}</div>
              </div>
              <div>
                <span class="text-xs text-muted font-semibold uppercase">Outstanding Due</span>
                <div class="text-lg font-bold ${totalBalance > 0 ? 'text-danger' : 'text-success'}">${window.Calculator.formatCurrency(totalBalance)}</div>
              </div>
              <div>
                <span class="text-xs text-muted font-medium uppercase">Purchase Orders</span>
                <div class="text-lg font-medium text-main">${window.Calculator.formatCurrency(totalPO)}</div>
              </div>
              <div>
                <span class="text-xs text-muted font-medium uppercase">Debit/Credit Notes</span>
                <div class="text-lg font-medium text-secondary">${notes.length} Active Notes</div>
              </div>
            </div>
          </div>

          <!-- CONTACT PERSONS (UP TO 10) -->
          <div style="margin-bottom: 1.5rem;">
            <h4 class="font-medium text-base mb-2" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
              <span>👥 Registered Contact Persons (${contacts.length})</span>
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem;">
              ${contacts.map((cp, idx) => `
                <div class="glass-card" style="padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); background: var(--surface);">
                  <div class="font-medium text-main" style="display: flex; justify-content: space-between;">
                    <span>${cp.name}</span>
                    <span class="badge badge-sm badge-draft">${idx === 0 ? 'Primary' : 'Contact'}</span>
                  </div>
                  <div class="text-xs text-secondary font-medium" style="margin-top: 2px;">${cp.designation || 'Staff / Representative'}</div>
                  <div class="text-xs text-muted" style="margin-top: 4px;">
                    <div>✉️ ${cp.email || '—'}</div>
                    <div>📞 ${cp.phone || '—'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- RECENT TRANSACTIONS TABLE -->
          <h4 class="font-bold text-base mb-2">Linked Invoices & Documents (${invoices.length + quotes.length + pos.length})</h4>
          <div class="table-responsive mb-4" style="border: 1px solid var(--border-light); border-radius: var(--radius-md); max-height: 220px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Doc Type</th>
                  <th>Number</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map(i => `
                  <tr>
                    <td><span class="badge badge-paid">Invoice</span></td>
                    <td class="cell-primary">${i.number}</td>
                    <td>${window.Calculator.formatDate(i.date)}</td>
                    <td class="font-bold">${window.Calculator.formatCurrency(i.total)}</td>
                    <td><span class="badge badge-${i.status}">${i.status}</span></td>
                  </tr>
                `).join('')}
                ${quotes.map(q => `
                  <tr>
                    <td><span class="badge badge-sent">Quotation</span></td>
                    <td class="cell-primary">${q.number}</td>
                    <td>${window.Calculator.formatDate(q.date)}</td>
                    <td class="font-bold">${window.Calculator.formatCurrency(q.total)}</td>
                    <td><span class="badge badge-${q.status}">${q.status}</span></td>
                  </tr>
                `).join('')}
                ${pos.map(p => `
                  <tr>
                    <td><span class="badge badge-draft">Vendor PO</span></td>
                    <td class="cell-primary">${p.number}</td>
                    <td>${window.Calculator.formatDate(p.date)}</td>
                    <td class="font-bold">${window.Calculator.formatCurrency(p.total)}</td>
                    <td><span class="badge badge-${p.status}">${p.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="flex justify-between items-center">
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-primary btn-sm" onclick="window.QuotesView.promptQuoteModal({ customerId: '${c.id}' }); window.Modal.close();">
                + New Quotation
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.InvoicesView.promptNewModal({ customerId: '${c.id}' }); window.Modal.close();">
                + New Invoice
              </button>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.Modal.close();">Close</button>
          </div>
        </div>
      `;

      window.Modal.open({
        title: `360 Entity Ledger & Contacts: ${c.name}`,
        contentHtml,
        size: '2xl',
        showFooter: false
      });
    }
  };

  window.CustomersView = CustomersView;

})(window);
