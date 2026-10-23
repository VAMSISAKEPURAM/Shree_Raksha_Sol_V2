/**
 * ZOHO INVOICE - SPA APPLICATION CONTROLLER & ROUTER
 * Hash-based routing, omnisearch engine (Ctrl+K), quick create dropdowns, and notifications.
 */

(function (window) {
  'use strict';

  const App = {
    currentRoute: 'dashboard',

    init() {
      // 1. Initialize core systems
      this.initTheme();
      this.initRouter();
      this.initOmnisearch();
      this.initQuickCreate();
      this.initNotifications();
      this.initSidebar();
      window.Timer.init();
      this.updateSidebarBadges();

      // Listen to store changes and backend MySQL synchronization
      window.AppStore.on('change', () => {
        this.updateSidebarBadges();
      });

      window.AppStore.on('sync:complete', () => {
        this.updateSidebarBadges();
        this.handleRoute();
      });

      console.log('Zoho Invoice Suite initialized successfully.');
    },

    initTheme() {
      const savedTheme = localStorage.getItem('theme_mode') || 'dark';
      document.body.classList.remove('theme-dark', 'theme-light');
      document.body.classList.add(`theme-${savedTheme}`);

      const toggleBtn = document.getElementById('theme-toggle-switch');
      if (toggleBtn) {
        toggleBtn.setAttribute('data-theme', savedTheme);
        toggleBtn.addEventListener('click', () => {
          const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
          const next = current === 'dark' ? 'light' : 'dark';
          document.body.classList.remove('theme-dark', 'theme-light');
          document.body.classList.add(`theme-${next}`);
          localStorage.setItem('theme_mode', next);
          toggleBtn.setAttribute('data-theme', next);
          this.applyGlassTransparency(); // Keep user's custom transparency synced with new theme
          if (window.Toast) {
            window.Toast.show(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Theme`, 'info');
          }
        });
      }

      this.initGlassTransparency();

      const org = window.AppStore.getOrg();
      if (org) {
        const nameEl = document.getElementById('sidebar-company-name');
        if (nameEl) nameEl.textContent = org.name;
        const currEl = document.getElementById('header-currency-code');
        if (currEl) currEl.textContent = `${org.currency} (${org.currencySymbol})`;
      }
    },

    initGlassTransparency() {
      const slider = document.getElementById('ui-opacity-slider');
      const badge = document.getElementById('ui-opacity-badge');
      let savedOpacity = parseInt(localStorage.getItem('ui_glass_opacity'), 10);
      if (isNaN(savedOpacity)) {
        const legacyTrans = parseInt(localStorage.getItem('ui_glass_transparency'), 10);
        savedOpacity = !isNaN(legacyTrans) ? (100 - legacyTrans) : 30;
      }
      savedOpacity = Math.max(5, Math.min(100, savedOpacity));

      if (slider) {
        slider.value = savedOpacity;
        slider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          this.applyGlassTransparency(val);
        });
      }

      if (badge) {
        badge.addEventListener('click', () => {
          if (slider) slider.value = 30;
          this.applyGlassTransparency(30);
          if (window.Toast) {
            window.Toast.show('Reset design opacity to 30% default (70% Glass)', 'info');
          }
        });
      }

      this.applyGlassTransparency(savedOpacity);
    },

    applyGlassTransparency(opacityPercent) {
      if (typeof opacityPercent === 'undefined') {
        opacityPercent = parseInt(localStorage.getItem('ui_glass_opacity'), 10);
        if (isNaN(opacityPercent)) {
          const legacy = parseInt(localStorage.getItem('ui_glass_transparency'), 10);
          opacityPercent = !isNaN(legacy) ? (100 - legacy) : 30;
        }
      }
      const val = Math.max(5, Math.min(100, opacityPercent));
      localStorage.setItem('ui_glass_opacity', val);
      localStorage.setItem('ui_glass_transparency', 100 - val);

      const alpha = (val / 100).toFixed(2);
      const isLight = document.body.classList.contains('theme-light');

      // 1. Inject or update dynamic high-priority style tag
      let styleTag = document.getElementById('dynamic-glass-opacity-style');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-glass-opacity-style';
        document.head.appendChild(styleTag);
      }

      const rgbDark = '20, 44, 55';
      const rgbDarkSurface = '25, 52, 64';
      const rgbLight = '255, 255, 255';
      const blurPx = Math.max(8, Math.min(36, Math.round(12 + val * 0.22)));
      const blurFilter = `blur(${blurPx}px) saturate(190%)`;

      if (isLight) {
        styleTag.textContent = `
          body.theme-light,
          body.theme-light .table-card,
          body.theme-light .kpi-card,
          body.theme-light .modal-dialog,
          body.theme-light .search-modal-card {
            background-color: rgba(${rgbLight}, ${alpha}) !important;
            backdrop-filter: ${blurFilter} !important;
            -webkit-backdrop-filter: ${blurFilter} !important;
          }
          body.theme-light .sidebar {
            background-color: rgba(${rgbLight}, ${alpha}) !important;
            backdrop-filter: ${blurFilter} !important;
            -webkit-backdrop-filter: ${blurFilter} !important;
          }
          body.theme-light .app-header {
            background-color: rgba(${rgbLight}, ${alpha}) !important;
            backdrop-filter: ${blurFilter} !important;
            -webkit-backdrop-filter: ${blurFilter} !important;
          }
          body.theme-light .table-header-toolbar,
          body.theme-light .glass-capsule-dock,
          body.theme-light .glass-transparency-dock,
          body.theme-light .header-right {
            background: rgba(${rgbLight}, ${alpha}) !important;
          }
          body.theme-light .btn-secondary {
            background-color: rgba(${rgbLight}, ${Math.min(1, parseFloat(alpha) + 0.05).toFixed(2)}) !important;
          }
        `;
      } else {
        styleTag.textContent = `
          body.theme-dark,
          body.theme-dark .table-card,
          body.theme-dark .kpi-card,
          body.theme-dark .modal-dialog,
          body.theme-dark .search-modal-card {
            background-color: rgba(${rgbDark}, ${alpha}) !important;
            backdrop-filter: ${blurFilter} !important;
            -webkit-backdrop-filter: ${blurFilter} !important;
          }
          body.theme-dark .sidebar {
            background-color: rgba(${rgbDark}, ${alpha}) !important;
            backdrop-filter: ${blurFilter} !important;
            -webkit-backdrop-filter: ${blurFilter} !important;
          }
          body.theme-dark .app-header {
            background-color: rgba(${rgbDark}, ${alpha}) !important;
            backdrop-filter: ${blurFilter} !important;
            -webkit-backdrop-filter: ${blurFilter} !important;
          }
          body.theme-dark .table-header-toolbar,
          body.theme-dark .glass-capsule-dock,
          body.theme-dark .glass-transparency-dock,
          body.theme-dark .header-right {
            background: rgba(${rgbDarkSurface}, ${alpha}) !important;
          }
          body.theme-dark .btn-secondary {
            background-color: rgba(${rgbDarkSurface}, ${Math.min(1, parseFloat(alpha) + 0.05).toFixed(2)}) !important;
          }
        `;
      }

      // Also set on document.body and documentElement
      document.body.style.setProperty('--glass-opacity', alpha);
      document.documentElement.style.setProperty('--glass-opacity', alpha);

      // 2. Update badge & tooltips
      const badge = document.getElementById('ui-opacity-badge');
      if (badge) {
        badge.textContent = `${val}%`;
        badge.title = `Opacity: ${val}% (Transparency: ${100 - val}%) - Click to reset to default 30%`;
      }

      // 3. Update slider fill track dynamically
      const slider = document.getElementById('ui-opacity-slider');
      if (slider) {
        slider.value = val;
        const fillPercent = ((val - 5) / (100 - 5)) * 100;
        const glowColor = isLight ? '#7ABF5A' : '#9BF272';
        const trackBase = isLight ? 'rgba(186, 200, 217, 0.45)' : 'rgba(186, 200, 217, 0.20)';
        slider.style.background = `linear-gradient(90deg, ${glowColor} 0%, ${glowColor} ${fillPercent}%, ${trackBase} ${fillPercent}%, ${trackBase} 100%)`;
      }
    },

    updateSidebarBadges() {
      const customers = window.AppStore.getAll('customers');
      const estimates = window.AppStore.getAll('estimates');
      const invoices = window.AppStore.getAll('invoices');
      const pos = window.AppStore.getAll('purchaseOrders') || [];
      const notes = window.AppStore.getAll('debitCreditNotes') || [];

      const custCounter = document.getElementById('nav-count-customers');
      if (custCounter) custCounter.textContent = customers.length;

      const quotesCounter = document.getElementById('nav-count-quotes');
      if (quotesCounter) quotesCounter.textContent = estimates.length;

      const posCounter = document.getElementById('nav-count-pos');
      if (posCounter) posCounter.textContent = pos.length;

      const notesCounter = document.getElementById('nav-count-notes');
      if (notesCounter) notesCounter.textContent = notes.length;

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
    },

    // ROUTING
    initRouter() {
      window.addEventListener('hashchange', () => this.handleRoute());
      if (!window.location.hash) {
        window.location.hash = '#dashboard';
      } else {
        this.handleRoute();
      }
    },

    handleRoute() {
      const fullHash = window.location.hash.slice(1) || 'dashboard';
      const [route, queryString] = fullHash.split('?');
      this.currentRoute = route;

      const params = new URLSearchParams(queryString || '');
      const idParam = params.get('id');
      const categoryParam = params.get('type') || null;

      // Update sidebar active link
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        if (item.getAttribute('data-route') === route) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Update contacts submenu active state
      const contactsGroup = document.getElementById('nav-group-contacts');
      if (contactsGroup) {
        if (route === 'customers') {
          contactsGroup.classList.add('open');
          document.querySelectorAll('.nav-submenu .nav-sub-item').forEach(sub => {
            const cat = sub.getAttribute('data-sub');
            if ((categoryParam && cat === categoryParam) || (!categoryParam && cat === 'all')) {
              sub.classList.add('active');
            } else {
              sub.classList.remove('active');
            }
          });
        } else {
          document.querySelectorAll('.nav-submenu .nav-sub-item').forEach(sub => sub.classList.remove('active'));
        }
      }

      // Update header title
      const titleMap = {
        'dashboard': 'Dashboard',
        'customers': categoryParam === 'vendor' ? 'Vendors Directory' : (categoryParam === 'customer' ? 'Customers Directory' : 'Contacts Directory (Customers & Vendors)'),
        'items': 'Items & Price Catalog',
        'quotes': 'Quotations',
        'invoices': 'Tax Invoices',
        'purchase-orders': 'Vendor Purchase Orders (PO)',
        'debit-credit-notes': 'Credit & Debit Notes',
        'recurring': 'Recurring Invoices',
        'payments': 'Payments Received',
        'expenses': 'Expenses Tracking',
        'time-tracking': 'Time Tracking & Projects',
        'reports': 'Financial Reports',
        'settings': 'Settings & Business Profile'
      };
      const headerTitle = document.getElementById('header-view-title');
      if (headerTitle) {
        headerTitle.textContent = titleMap[route] || 'Invoicing';
      }

      // Render corresponding view
      switch (route) {
        case 'dashboard':
          window.DashboardView.render();
          break;
        case 'customers':
          window.CustomersView.render(idParam, categoryParam);
          break;
        case 'items':
          window.ItemsView.render();
          break;
        case 'quotes':
          window.QuotesView.render(idParam);
          break;
        case 'invoices':
          window.InvoicesView.render(idParam);
          break;
        case 'purchase-orders':
          if (window.PurchaseOrdersView) window.PurchaseOrdersView.render(idParam);
          break;
        case 'debit-credit-notes':
          if (window.DebitCreditNotesView) window.DebitCreditNotesView.render(idParam);
          break;
        case 'recurring':
          window.RecurringView.render();
          break;
        case 'payments':
          window.PaymentsView.render();
          break;
        case 'expenses':
          window.ExpensesView.render();
          break;
        case 'time-tracking':
          window.location.hash = '#quotes';
          break;
        case 'reports':
          window.ReportsView.render();
          break;
        case 'settings':
          window.SettingsView.render();
          break;
        default:
          window.DashboardView.render();
      }

      // Close mobile sidebar if open
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
    },

    // OMNISEARCH PALETTE (Ctrl + K)
    initOmnisearch() {
      const modal = document.getElementById('global-search-modal');
      const input = document.getElementById('omnisearch-input');
      const resultsContainer = document.getElementById('omnisearch-results');
      const trigger = document.getElementById('global-search-trigger');
      const closeBtn = document.getElementById('omnisearch-close-btn');

      const openSearch = () => {
        modal.style.display = 'flex';
        input.value = '';
        renderResults('');
        input.focus();
      };

      const closeSearch = () => {
        modal.style.display = 'none';
      };

      if (trigger) trigger.addEventListener('click', openSearch);
      if (closeBtn) closeBtn.addEventListener('click', closeSearch);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSearch();
      });

      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (modal.style.display === 'flex') {
            closeSearch();
          } else {
            openSearch();
          }
        }
      });

      input.addEventListener('input', (e) => {
        renderResults(e.target.value.trim().toLowerCase());
      });

      const renderResults = (query) => {
        if (!query) {
          resultsContainer.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
              Search across quotations, invoices, vendor POs, credit/debit notes, customers, and catalog...
            </div>
          `;
          return;
        }

        const customers = window.AppStore.getAll('customers').filter(c => 
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.company && c.company.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query))
        );

        const invoices = window.AppStore.getAll('invoices').filter(i => 
          (i.number && i.number.toLowerCase().includes(query)) ||
          (i.notes && i.notes.toLowerCase().includes(query))
        );

        const quotes = window.AppStore.getAll('estimates').filter(q => 
          (q.number && q.number.toLowerCase().includes(query)) ||
          (q.customerName && q.customerName.toLowerCase().includes(query))
        );

        const purchaseOrders = window.AppStore.getAll('purchaseOrders').filter(po => 
          (po.number && po.number.toLowerCase().includes(query)) ||
          (po.vendorName && po.vendorName.toLowerCase().includes(query))
        );

        const notes = window.AppStore.getAll('debitCreditNotes').filter(n => 
          (n.number && n.number.toLowerCase().includes(query)) ||
          (n.partyName && n.partyName.toLowerCase().includes(query)) ||
          (n.type && n.type.toLowerCase().includes(query))
        );

        const items = window.AppStore.getAll('items').filter(it => 
          (it.name && it.name.toLowerCase().includes(query)) ||
          (it.sku && it.sku.toLowerCase().includes(query)) ||
          (it.hsnSac && it.hsnSac.toLowerCase().includes(query))
        );

        if (customers.length === 0 && invoices.length === 0 && quotes.length === 0 && purchaseOrders.length === 0 && notes.length === 0 && items.length === 0) {
          resultsContainer.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
              No results found for "${query}"
            </div>
          `;
          return;
        }

        let html = '';

        if (quotes.length > 0) {
          html += `<div class="search-result-group"><div class="search-group-title">Quotations (${quotes.length})</div>`;
          quotes.forEach(q => {
            html += `
              <div class="search-result-item" onclick="window.App.navigateTo('#quotes?id=${q.id}')">
                <div>
                  <div class="font-bold text-sm">${q.number} &bull; ${q.customerName || ''}</div>
                  <div class="text-xs text-muted">Date: ${q.date} &bull; Status: ${q.status}</div>
                </div>
                <div class="font-bold text-sm text-primary">${window.Calculator.formatCurrency(q.total)}</div>
              </div>
            `;
          });
          html += `</div>`;
        }

        if (invoices.length > 0) {
          html += `<div class="search-result-group"><div class="search-group-title">Tax Invoices (${invoices.length})</div>`;
          invoices.forEach(inv => {
            const cust = window.AppStore.getById('customers', inv.customerId);
            html += `
              <div class="search-result-item" onclick="window.App.navigateTo('#invoices?id=${inv.id}')">
                <div>
                  <div class="font-bold text-sm">${inv.number} &bull; ${cust ? cust.name : ''}</div>
                  <div class="text-xs text-muted">Date: ${inv.date} &bull; Status: ${inv.status}</div>
                </div>
                <div class="font-bold text-sm text-primary">${window.Calculator.formatCurrency(inv.total)}</div>
              </div>
            `;
          });
          html += `</div>`;
        }

        if (purchaseOrders.length > 0) {
          html += `<div class="search-result-group"><div class="search-group-title">Vendor Purchase Orders (${purchaseOrders.length})</div>`;
          purchaseOrders.forEach(po => {
            html += `
              <div class="search-result-item" onclick="window.App.navigateTo('#purchase-orders?id=${po.id}')">
                <div>
                  <div class="font-bold text-sm">${po.number} &bull; ${po.vendorName || ''}</div>
                  <div class="text-xs text-muted">Date: ${po.date} &bull; Status: ${po.status}</div>
                </div>
                <div class="font-bold text-sm text-primary">${window.Calculator.formatCurrency(po.total)}</div>
              </div>
            `;
          });
          html += `</div>`;
        }

        if (notes.length > 0) {
          html += `<div class="search-result-group"><div class="search-group-title">Debit / Credit Notes (${notes.length})</div>`;
          notes.forEach(n => {
            html += `
              <div class="search-result-item" onclick="window.App.navigateTo('#debit-credit-notes?id=${n.id}')">
                <div>
                  <div class="font-bold text-sm">${n.number} &bull; ${n.partyName || ''} (${n.type})</div>
                  <div class="text-xs text-muted">Party: ${n.partyType} &bull; Date: ${n.date}</div>
                </div>
                <div class="font-bold text-sm text-primary">${window.Calculator.formatCurrency(n.total)}</div>
              </div>
            `;
          });
          html += `</div>`;
        }

        if (customers.length > 0) {
          html += `<div class="search-result-group"><div class="search-group-title">Customers & Vendors (${customers.length})</div>`;
          customers.forEach(cust => {
            html += `
              <div class="search-result-item" onclick="window.App.navigateTo('#customers'); window.CustomersView.view360('${cust.id}');">
                <div>
                  <div class="font-bold text-sm">${cust.name}</div>
                  <div class="text-xs text-muted">${cust.company || ''} &bull; ${cust.email}</div>
                </div>
                <span class="badge badge-draft">${cust.paymentTerms || 'Net 30'}</span>
              </div>
            `;
          });
          html += `</div>`;
        }

        if (items.length > 0) {
          html += `<div class="search-result-group"><div class="search-group-title">Catalog Items (Products & Services) (${items.length})</div>`;
          items.forEach(it => {
            html += `
              <div class="search-result-item" onclick="window.App.navigateTo('#items')">
                <div>
                  <div class="font-bold text-sm">${it.name} <span class="badge badge-sm">${it.type || 'Product'}</span></div>
                  <div class="text-xs text-muted">HSN/SAC: ${it.hsnSac || 'N/A'} &bull; GST: ${it.taxRate}%</div>
                </div>
                <div class="font-bold text-sm">${window.Calculator.formatCurrency(it.rate)}</div>
              </div>
            `;
          });
          html += `</div>`;
        }

        resultsContainer.innerHTML = html;
      };
    },

    navigateTo(hash) {
      const searchModal = document.getElementById('global-search-modal');
      if (searchModal) searchModal.style.display = 'none';
      window.location.hash = hash;
    },

    // QUICK CREATE DROPDOWN
    initQuickCreate() {
      const btn = document.getElementById('quick-create-btn');
      const menu = document.getElementById('quick-create-menu');
      if (!btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });

      menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          menu.classList.remove('show');
          const action = item.getAttribute('data-action');
          if (action === 'quick-new-invoice') {
            window.location.hash = '#invoices';
            window.InvoicesView.promptNewModal();
          } else if (action === 'quick-new-quote') {
            window.location.hash = '#quotes';
            window.QuotesView.promptQuoteModal();
          } else if (action === 'quick-new-po') {
            window.location.hash = '#purchase-orders';
            if (window.PurchaseOrdersView) window.PurchaseOrdersView.promptPOModal();
          } else if (action === 'quick-new-note') {
            window.location.hash = '#debit-credit-notes';
            if (window.DebitCreditNotesView) window.DebitCreditNotesView.promptNoteModal();
          } else if (action === 'quick-new-customer') {
            window.location.hash = '#customers';
            window.CustomersView.promptCustomerModal();
          } else if (action === 'quick-new-item') {
            window.location.hash = '#items';
            window.ItemsView.promptItemModal();
          } else if (action === 'quick-new-expense') {
            window.location.hash = '#expenses';
            window.ExpensesView.promptModal();
          } else if (action === 'quick-log-time') {
            window.Timer.promptStartModal();
          }
        });
      });
    },

    // NOTIFICATIONS
    initNotifications() {
      const btn = document.getElementById('notifications-btn');
      const menu = document.getElementById('notifications-menu');
      const list = document.getElementById('notifications-list');
      if (!btn || !menu || !list) return;

      const renderActivities = () => {
        const activities = window.AppStore.getActivities();
        list.innerHTML = activities.length === 0 ? `
          <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.775rem;">
            No recent activity logged.
          </div>
        ` : activities.map(a => `
          <div class="notification-row">
            <span class="notification-action">${a.text}</span>
            <span class="notification-time">${a.time}</span>
          </div>
        `).join('');
      };

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        renderActivities();
        menu.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });
    },

    // SIDEBAR COLLAPSE & MOBILE
    initSidebar() {
      const sidebar = document.getElementById('app-sidebar');
      const collapseBtn = document.getElementById('sidebar-collapse-btn');
      const mobileToggle = document.getElementById('mobile-toggle-btn');
      const contactsToggle = document.getElementById('nav-contacts-toggle');
      const contactsGroup = document.getElementById('nav-group-contacts');

      if (contactsToggle && contactsGroup) {
        contactsToggle.addEventListener('click', (e) => {
          e.preventDefault();
          contactsGroup.classList.toggle('open');
        });
      }

      if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
          sidebar.classList.toggle('collapsed');
        });
      }

      if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          sidebar.classList.toggle('mobile-open');
        });
      }
    }
  };

  window.App = App;

  // Boot on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
  });

})(window);
