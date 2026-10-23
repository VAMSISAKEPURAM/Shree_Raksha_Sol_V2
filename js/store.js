/**
 * ZOHO INVOICE - REACTIVE LOCAL DATA STORE
 * Handles state management, localStorage persistence, event subscriptions, and seed data.
 * Customized for Shreeraksha Solutions with full Indian GST compliance, Vendor POs, and Credit/Debit Notes.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'zoho_invoice_db_v2_shreeraksha';

  const DEFAULT_DATA = {
    organization: {
      name: 'SHREERAKSHA SOLUTIONS',
      legalName: 'Shreeraksha Solutions',
      taxId: '29FEAPS4448D1ZA', // GSTIN
      msmeRegNo: 'UDYAM-KR-11-0087041',
      email: 'connect@shreeraksha.in',
      phone: '+91 9880 54 99 55 / +91 96636 91509',
      website: 'www.shreeraksha.in',
      address: '5-68, Mulliya Mata House, Ajjavara Post, Sulya\nDakshina Kannada - 574 239, Karnataka, India',
      state: 'Karnataka (29)',
      currency: 'INR',
      currencySymbol: '₹',
      logo: 'assets/shreeraksha-logo.svg',
      themeColor: 'zoho',
      invoicePrefix: 'SHRKS/Inv/26-27/',
      estimatePrefix: 'SHRKS/Qtn/26-27/',
      poPrefix: 'SHRKS/PO/26-27/',
      creditNotePrefix: 'SHRKS/CN/26-27/',
      debitNotePrefix: 'SHRKS/DN/26-27/',
      defaultPaymentTerms: '30 Days net',
      bankName: 'State Bank of India',
      accountName: 'SHREERAKSHA SOLUTIONS',
      accountNumber: '45666081503',
      ifscCode: 'SBIN0016869',
      branch: 'PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi',
      micrCode: '576002012',
      branchAddress: 'BHOODARA TOWER MAIN ROAD PARKALA DISTT: UDUPI',
      bankEmail: 'sbi.16869@sbi.co.in',
      bankPhone: '1800 1234',
      bankDetails: 'State Bank of India\nA/C: 45666081503\nIFSC: SBIN0016869\nBranch: PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi\nMICR: 576002012',
      defaultNotes: 'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
      defaultTerms: '• Above prices are FOR Destination.\n• Please mention our Estimate number on all future correspondence.\n• Please share your valid GSTIN in your Purchase Order.\n• Payment Terms: As agreed (30 Days net).\n• In case of Refurbished requirement\n  * The defective part need to be returned - against delivery.\n• Delivery will be within 3-4 weeks from date of PO.\n  * Goods indicated above in stock are accurate as of the quote date.\n  * If goods are out of stock at the time of release of PO, standard lead time would apply.\n• Payment will be 50% advance and balance against delivery.'
    },
    taxes: [
      { id: 'tax-18', name: 'GST 18%', rate: 18.0 },
      { id: 'tax-12', name: 'GST 12%', rate: 12.0 },
      { id: 'tax-5',  name: 'GST 5%',  rate: 5.0 },
      { id: 'tax-28', name: 'GST 28%', rate: 28.0 },
      { id: 'tax-0',  name: 'Zero Tax 0%', rate: 0.0 }
    ],
    items: [],
    customers: [],
    estimates: [],
    invoices: [],
    purchaseOrders: [],
    debitCreditNotes: [],
    recurring: [],
    payments: [],
    expenses: [],
    projects: [],
    timesheets: [],
    activities: []
  };

  class Store {
    constructor() {
      this.listeners = {};
      this.isSyncing = false;
      this.load();
      this.syncFromBackend();
    }

    async syncFromBackend() {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const live = await res.json();
          if (live && live.organization) {
            this.data = live;
            this.save();
            this.emit('change', { collection: 'all', type: 'sync' });
            this.emit('sync:complete', this.data);
            console.log('AppStore successfully synchronized with MySQL database.');
          }
        }
      } catch (err) {
        console.warn('MySQL Backend API not reachable, running from local store cache:', err);
      }
    }

    apiSync(method, collection, payload) {
      const endpointMap = {
        customers: '/api/customers',
        items: '/api/items',
        estimates: '/api/estimates',
        invoices: '/api/invoices',
        payments: '/api/payments',
        purchaseOrders: '/api/purchaseOrders',
        debitCreditNotes: '/api/debitCreditNotes',
        expenses: '/api/expenses',
        projects: '/api/projects',
        timesheets: '/api/timesheets',
        recurring: '/api/recurring',
        taxes: '/api/taxes'
      };

      const url = endpointMap[collection];
      if (!url) return;

      const targetUrl = method === 'DELETE' ? `${url}/${encodeURIComponent(payload.id)}` : url;
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (method !== 'DELETE') {
        opts.body = JSON.stringify(payload);
      }

      fetch(targetUrl, opts)
        .then(r => r.json())
        .then(data => {
          if (data && data.item) {
            // Re-sync dashboard calculations if needed
            this.emit('db:synced', { collection, item: data.item });
          }
        })
        .catch(err => console.warn(`MySQL sync error for ${collection}:`, err));
    }

    load() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.data = JSON.parse(stored);
          for (const key in DEFAULT_DATA) {
            if (!this.data[key]) {
              this.data[key] = JSON.parse(JSON.stringify(DEFAULT_DATA[key]));
            }
          }
          // Auto-migrate bank details if using old placeholder data
          if (this.data.organization) {
            const org = this.data.organization;
            if (!org.accountNumber || org.accountNumber === '50200088991234' || org.bankName === 'HDFC Bank') {
              org.bankName = 'State Bank of India';
              org.accountName = 'SHREERAKSHA SOLUTIONS';
              org.accountNumber = '45666081503';
              org.ifscCode = 'SBIN0016869';
              org.branch = 'PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi';
              org.micrCode = '576002012';
              org.branchAddress = 'BHOODARA TOWER MAIN ROAD PARKALA DISTT: UDUPI';
              org.bankEmail = 'sbi.16869@sbi.co.in';
              org.bankPhone = '1800 1234';
              org.bankDetails = 'State Bank of India\nA/C: 45666081503\nIFSC: SBIN0016869\nBranch: PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi\nMICR: 576002012';
              this.save();
            }
          }
          // Clean demo data migration: ensure complete clean slate for production
          if (!this.data._clean_production_v2) {
            this.data.items = [];
            this.data.customers = [];
            this.data.estimates = [];
            this.data.invoices = [];
            this.data.purchaseOrders = [];
            this.data.debitCreditNotes = [];
            this.data.recurring = [];
            this.data.payments = [];
            this.data.expenses = [];
            this.data.projects = [];
            this.data.timesheets = [];
            this.data.activities = [];
            this.data._clean_production_v2 = true;
            this.save();
          }
        } else {
          this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
          this.save();
        }
      } catch (err) {
        console.error('Error loading store, falling back to default:', err);
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }

    on(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }

    emit(event, payload) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(fn => fn(payload));
      }
      if (this.listeners['*']) {
        this.listeners['*'].forEach(fn => fn(event, payload));
      }
    }

    getAll(collection) {
      return this.data[collection] || [];
    }

    getById(collection, id) {
      const list = this.getAll(collection);
      return list.find(item => item.id === id) || null;
    }

    add(collection, item) {
      if (!this.data[collection]) this.data[collection] = [];
      if (!item.id) {
        item.id = collection.slice(0, 4) + '-' + Date.now();
      }
      this.data[collection].unshift(item);
      this.save();
      this.logActivity(`Created ${collection.slice(0, -1)}: ${item.number || item.name || item.id}`);
      this.emit(`${collection}:change`, { type: 'add', item });
      this.emit('change', { collection, type: 'add', item });
      this.apiSync('POST', collection, item);
      return item;
    }

    update(collection, id, updates) {
      const list = this.getAll(collection);
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        this.save();
        this.emit(`${collection}:change`, { type: 'update', item: list[index] });
        this.emit('change', { collection, type: 'update', item: list[index] });
        this.apiSync('POST', collection, list[index]);
        return list[index];
      }
      return null;
    }

    delete(collection, id) {
      if (!this.data[collection]) return false;
      const initialLen = this.data[collection].length;
      this.data[collection] = this.data[collection].filter(item => item.id !== id);
      if (this.data[collection].length !== initialLen) {
        this.save();
        this.emit(`${collection}:change`, { type: 'delete', id });
        this.emit('change', { collection, type: 'delete', id });
        this.apiSync('DELETE', collection, { id });
        return true;
      }
      return false;
    }

    getOrg() {
      return this.data.organization;
    }

    updateOrg(updates) {
      this.data.organization = { ...this.data.organization, ...updates };
      this.save();
      this.emit('org:change', this.data.organization);
      this.emit('change', { collection: 'organization', item: this.data.organization });
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(err => console.warn('Org settings sync failed:', err));
      return this.data.organization;
    }

    logActivity(text) {
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').substring(0, 16);
      const act = {
        id: 'act-' + Date.now(),
        text,
        time: timeStr
      };
      if (!this.data.activities) this.data.activities = [];
      this.data.activities.unshift(act);
      if (this.data.activities.length > 50) this.data.activities.pop();
      this.save();
      this.emit('activity:new', act);
    }

    getActivities() {
      return this.data.activities || [];
    }

    exportJSON() {
      return JSON.stringify(this.data, null, 2);
    }

    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.organization) {
          this.data = parsed;
          this.save();
          this.emit('change', { collection: 'all', type: 'import' });
          return true;
        }
        return false;
      } catch (err) {
        console.error('Invalid JSON import:', err);
        return false;
      }
    }

    resetToDemo() {
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.save();
      this.emit('change', { collection: 'all', type: 'reset' });
    }

    getNextNumber(type) {
      const org = this.getOrg();
      if (type === 'invoice') {
        const count = this.getAll('invoices').length + 1;
        return `${org.invoicePrefix || 'SHRKS/Inv/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'estimate') {
        const count = this.getAll('estimates').length + 1;
        return `${org.estimatePrefix || 'SHRKS/Qtn/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'po') {
        const count = this.getAll('purchaseOrders').length + 1;
        return `${org.poPrefix || 'SHRKS/PO/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'creditNote') {
        const count = this.getAll('debitCreditNotes').filter(n => n.docType === 'CREDIT NOTE').length + 1;
        return `${org.creditNotePrefix || 'SHRKS/CN/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'debitNote') {
        const count = this.getAll('debitCreditNotes').filter(n => n.docType === 'DEBIT NOTE').length + 1;
        return `${org.debitNotePrefix || 'SHRKS/DN/26-27/'}${String(count).padStart(3, '0')}`;
      }
      return 'DOC-' + Date.now();
    }

    syncLineMaterials(lineItems) {
      if (!Array.isArray(lineItems)) return;
      const allItems = this.getAll('items') || [];

      lineItems.forEach(item => {
        if (!item.name || !item.name.trim()) return;
        const cleanName = item.name.trim();

        const existing = (item.itemId && this.getById('items', item.itemId)) ||
          allItems.find(it => it.name && it.name.trim().toLowerCase() === cleanName.toLowerCase());

        const itemType = item.itemType || 'product';
        const isService = itemType === 'service';
        const hsnVal = isService ? '' : (item.hsnCode || '90279090');
        const sacVal = isService ? (item.sacCode || '998313') : '';
        const codeVal = isService ? sacVal : hsnVal;

        const payload = {
          name: cleanName,
          itemType: itemType,
          type: itemType,
          hsnCode: hsnVal,
          sacCode: sacVal,
          hsnSac: codeVal,
          rate: parseFloat(item.rate) || 0,
          unit: item.unit || 'nos',
          taxRate: parseFloat(item.taxRate) || 18,
          description: item.description || ''
        };

        if (existing) {
          this.update('items', existing.id, payload);
          item.itemId = existing.id;
        } else {
          const created = this.add('items', payload);
          item.itemId = created.id;
          allItems.push(created);
        }
      });
    }
  }

  window.AppStore = new Store();

})(window);
