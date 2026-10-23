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
    items: [
      {
        id: 'item-1',
        name: 'ZODIAC C18',
        itemType: 'product',
        hsnCode: '90279090',
        sacCode: '',
        sku: 'ZOD-C18-250',
        rate: 39286.00,
        unit: 'nos',
        taxRate: 18.0,
        taxRateId: 'tax-18',
        description: '250mmx4.6mm, 5µm'
      },
      {
        id: 'item-2',
        name: 'ZODIAC C18',
        itemType: 'product',
        hsnCode: '90279090',
        sacCode: '',
        sku: 'ZOD-C18-150',
        rate: 39286.00,
        unit: 'nos',
        taxRate: 18.0,
        taxRateId: 'tax-18',
        description: '150mmx4.6mm, 3.5µm'
      },
      {
        id: 'item-3',
        name: 'Hypersil BDS C18',
        itemType: 'product',
        hsnCode: '90279090',
        sacCode: '',
        sku: 'HYP-BDS-250',
        rate: 67778.00,
        unit: 'nos',
        taxRate: 18.0,
        taxRateId: 'tax-18',
        description: '250mm x 4.6mm, 5µm'
      },
      {
        id: 'item-4',
        name: 'Chromatography Column Annual Calibration & Validation',
        itemType: 'service',
        hsnCode: '',
        sacCode: '998313',
        sku: 'SRV-CALIB-01',
        rate: 25000.00,
        unit: 'service',
        taxRate: 18.0,
        taxRateId: 'tax-18',
        description: 'Onsite HPLC system calibration, resolution verification, and certificate issuance.'
      },
      {
        id: 'item-5',
        name: 'HPLC Method Development & Resolution Optimization',
        itemType: 'service',
        hsnCode: '',
        sacCode: '998319',
        sku: 'SRV-METH-02',
        rate: 45000.00,
        unit: 'service',
        taxRate: 18.0,
        taxRateId: 'tax-18',
        description: 'Custom mobile phase formulation, retention factor analysis, and peak purity report.'
      }
    ],
    customers: [
      {
        id: 'cust-1',
        name: 'Manipal Speciality Chemicals Pvt Ltd',
        company: 'Manipal Speciality Chemicals Pvt Ltd',
        attention: 'Mr. Sreekar Nayak',
        email: 'sreekar.nayak@manipalspeciality.com',
        phone: '+91 820 257 1200',
        taxId: '29AATCM4200G1ZD',
        placeOfSupply: 'Karnataka (29)',
        currency: 'INR',
        billingAddress: '52/1A, Udayavani Building,Tile Factory Road, Manipal\nUdupi, Karnataka, India 576104',
        shippingAddress: '52/1A, Udayavani Building,Tile Factory Road, Manipal\nUdupi, Karnataka, India 576104',
        paymentTerms: '30 Days net',
        notes: 'Kind Attention: Mr. Sreekar Nayak. Priority pharmaceutical delivery.'
      },
      {
        id: 'cust-2',
        name: 'Sun Pharma Advanced Research Ltd',
        company: 'Sun Pharma Advanced Research Ltd',
        attention: 'Dr. Ananya Sharma',
        email: 'procurement@sunpharma.res.in',
        phone: '+91 22 6645 5600',
        taxId: '27AAACS1234D1Z2',
        placeOfSupply: 'Maharashtra (27)', // Inter-state testing!
        currency: 'INR',
        billingAddress: 'Plot No 14, MIDC Industrial Area, Taloja\nNavi Mumbai, Maharashtra, India 410208',
        shippingAddress: 'Plot No 14, MIDC Industrial Area, Taloja\nNavi Mumbai, Maharashtra, India 410208',
        paymentTerms: '30 Days net',
        notes: 'Inter-state client. IGST applies automatically.'
      },
      {
        id: 'vend-1',
        name: 'Thermo Fisher Scientific India Pvt Ltd',
        company: 'Thermo Fisher Scientific India Pvt Ltd',
        attention: 'Mr. Rajesh Pillai',
        isVendor: true,
        email: 'orders.india@thermofisher.com',
        phone: '+91 20 6626 7000',
        taxId: '27AAACT9921B1Z9',
        placeOfSupply: 'Maharashtra (27)',
        currency: 'INR',
        billingAddress: 'Godrej Millennium, 9 Koregaon Park Road\nPune, Maharashtra, India 411001',
        shippingAddress: 'Godrej Millennium, 9 Koregaon Park Road\nPune, Maharashtra, India 411001',
        paymentTerms: 'Net 30',
        notes: 'Primary chromatography consumables vendor.'
      }
    ],
    estimates: [
      {
        id: 'est-019',
        number: 'SHRKS/Qtn/26-27/019',
        customerId: 'cust-1',
        attention: 'Mr. Sreekar Nayak',
        date: '2026-10-03',
        expiryDate: '2026-12-31',
        placeOfSupply: 'Karnataka (29)',
        status: 'accepted',
        reference: '',
        paymentTerms: '30 Days net',
        items: [
          {
            itemId: 'item-1',
            name: 'ZODIAC C18',
            description: '250mmx4.6mm, 5µm',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 6.00,
            rate: 39286.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-2',
            name: 'ZODIAC C18',
            description: '150mmx4.6mm, 3.5µm',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 3.00,
            rate: 39286.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-3',
            name: 'Hypersil BDS C18',
            description: '250mm x 4.6mm, 5µm',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 1.00,
            rate: 67778.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          }
        ],
        notes: 'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
        terms: '• Above prices are FOR Destination.\n• Please mention our Estimate number on all future correspondence.\n• Please share your valid GSTIN in your Purchase Order.\n• Payment Terms: As agreed (30 Days net).\n• In case of Refurbished requirement\n  * The defective part need to be returned - against delivery.\n• Delivery will be within 3-4 weeks from date of PO.\n  * Goods indicated above in stock are accurate as of the quote date.\n  * If goods are out of stock at the time of release of PO, standard lead time would apply.\n• Payment will be 50% advance and balance against delivery.'
      },
      {
        id: 'est-020',
        number: 'SHRKS/Qtn/26-27/020',
        customerId: 'cust-2',
        attention: 'Dr. Ananya Sharma',
        date: '2026-10-10',
        expiryDate: '2026-11-30',
        placeOfSupply: 'Maharashtra (27)', // Inter-state demonstration
        status: 'sent',
        reference: 'SUN-RFQ-9921',
        paymentTerms: '30 Days net',
        items: [
          {
            itemId: 'item-4',
            name: 'Chromatography Column Annual Calibration & Validation',
            description: 'Validation of 4 Waters Alliance HPLC Systems',
            itemType: 'service',
            hsnCode: '',
            sacCode: '998313',
            quantity: 2.00,
            rate: 25000.00,
            discountType: 'amount', // Testing flat amount discount
            discount: 2000.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-3',
            name: 'Hypersil BDS C18',
            description: '250mm x 4.6mm, 5µm',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 2.00,
            rate: 67778.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          }
        ],
        notes: 'Inter-State supply to Maharashtra. Full 18% IGST is applicable as per GST regulations.',
        terms: 'Payment 30 Days Net from date of installation.'
      },
      {
        id: 'est-024',
        number: 'SHRKS/Qtn/26-27/024',
        customerId: 'cust-1',
        attention: 'Mr. Sreekar Nayak',
        date: '2026-10-15',
        expiryDate: '2026-12-31',
        placeOfSupply: 'Karnataka (29)',
        status: 'draft',
        reference: 'PUR-RFQ-8840',
        paymentTerms: '30 Days net',
        items: [
          {
            itemId: 'item-1',
            name: 'ZODIAC C18 Analytical Column',
            description: '250mm x 4.6mm, 5µm particle size, 120Å pore size',
            itemType: 'product',
            hsnCode: '90279090',
            quantity: 6.00,
            unit: "No's",
            rate: 39286.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-2',
            name: 'ZODIAC C18 Fast LC Column',
            description: '150mm x 4.6mm, 3.5µm high-resolution',
            itemType: 'product',
            hsnCode: '90279090',
            quantity: 3.00,
            unit: "No's",
            rate: 39286.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-3',
            name: 'Hypersil BDS C18 Premium Column',
            description: '250mm x 4.6mm, 5µm base-deactivated silica',
            itemType: 'product',
            hsnCode: '90279090',
            quantity: 1.00,
            unit: 'Pcs',
            rate: 67778.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-1',
            name: 'Waters Symmetry C8 Column',
            description: '150mm x 3.9mm, 5µm pharmaceutical grade',
            itemType: 'product',
            hsnCode: '90279090',
            quantity: 2.00,
            unit: "No's",
            rate: 45000.00,
            discountType: 'percent',
            discount: 10.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-2',
            name: 'Kromasil 100-5-C18 Column',
            description: '250mm x 4.6mm, 5µm analytical chemistry column',
            itemType: 'product',
            hsnCode: '90279090',
            quantity: 2.00,
            unit: "No's",
            rate: 42500.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-4',
            name: 'HPLC Column Protection Guard Cartridges',
            description: 'Pack of 5 universal 10mm cartridge guards',
            itemType: 'product',
            hsnCode: '90279090',
            quantity: 1.00,
            unit: 'Sets',
            rate: 18500.00,
            discountType: 'amount',
            discount: 500.00,
            taxRate: 18.0
          }
        ],
        notes: 'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
        terms: '• Above prices are FOR Destination.\n• Please mention our Estimate number on all future correspondence.\n• Please share your valid GSTIN in your Purchase Order.\n• Payment Terms: As agreed (30 Days net).\n• Delivery will be within 3-4 weeks from date of PO.\n• Payment will be 50% advance and balance against delivery.'
      }
    ],
    invoices: [
      {
        id: 'inv-019',
        number: 'SHRKS/Inv/26-27/019',
        customerId: 'cust-1',
        attention: 'Mr. Sreekar Nayak',
        date: '2026-10-04',
        dueDate: '2026-11-03',
        placeOfSupply: 'Karnataka (29)',
        paymentTerms: '30 Days net',
        status: 'sent',
        items: [
          {
            itemId: 'item-1',
            name: 'ZODIAC C18',
            description: '250mmx4.6mm, 5µm',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 6.00,
            rate: 39286.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-2',
            name: 'ZODIAC C18',
            description: '150mmx4.6mm, 3.5µm',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 3.00,
            rate: 39286.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          },
          {
            itemId: 'item-3',
            name: 'Hypersil BDS C18',
            description: '250mm x 4.6mm, 5µm',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 1.00,
            rate: 67778.00,
            discountType: 'percent',
            discount: 5.00,
            taxRate: 18.0
          }
        ],
        total: 472336.00,
        amountPaid: 0,
        balanceDue: 472336.00,
        notes: 'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
        terms: 'Payment due within 30 days.'
      }
    ],
    purchaseOrders: [
      {
        id: 'po-005',
        number: 'SHRKS/PO/26-27/005',
        vendorId: 'vend-1',
        attention: 'Mr. Rajesh Pillai',
        date: '2026-10-02',
        dueDate: '2026-10-25',
        placeOfSupply: 'Karnataka (29)',
        status: 'issued',
        reference: 'INDENT-OCT-44',
        paymentTerms: 'Net 30',
        items: [
          {
            itemId: 'item-1',
            name: 'ZODIAC C18 Raw Assemblies',
            description: 'Unpacked analytical column blanks (250mm)',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 10.00,
            rate: 18500.00,
            discountType: 'percent',
            discount: 10.00,
            taxRate: 18.0
          }
        ],
        notes: 'Please dispatch via Blue Dart Express to our Sulya address.',
        terms: 'Material subject to QC inspection upon delivery.'
      }
    ],
    debitCreditNotes: [
      {
        id: 'note-001',
        number: 'SHRKS/CN/26-27/001',
        docType: 'CREDIT NOTE',
        partyType: 'customer',
        partyId: 'cust-1',
        customerId: 'cust-1',
        attention: 'Mr. Sreekar Nayak',
        date: '2026-10-06',
        originalInvoiceNumber: 'SHRKS/Inv/26-27/019',
        placeOfSupply: 'Karnataka (29)',
        status: 'approved',
        reason: 'Post-sales volume rebate and calibration discount',
        items: [
          {
            itemId: 'item-1',
            name: 'Volume Rebate on ZODIAC C18 Columns',
            description: 'Credit adjusted for Purchase Order bulk commitment',
            itemType: 'service',
            hsnCode: '',
            sacCode: '998313',
            quantity: 1.00,
            rate: 10000.00,
            discountType: 'amount',
            discount: 0,
            taxRate: 18.0
          }
        ],
        notes: 'Credit note value will be adjusted against Invoice SHRKS/Inv/26-27/019.'
      },
      {
        id: 'note-002',
        number: 'SHRKS/DN/26-27/002',
        docType: 'DEBIT NOTE',
        partyType: 'vendor',
        partyId: 'vend-1',
        vendorId: 'vend-1',
        attention: 'Mr. Rajesh Pillai',
        date: '2026-10-08',
        originalInvoiceNumber: 'TH-INV-8910',
        placeOfSupply: 'Maharashtra (27)',
        status: 'approved',
        reason: 'Transit damage / defective return against PO SHRKS/PO/26-27/005',
        items: [
          {
            itemId: 'item-1',
            name: 'Transit Damaged Column Blank Rejection',
            description: 'Damaged fittings returned via courier airway bill 882910',
            itemType: 'product',
            hsnCode: '90279090',
            sacCode: '',
            quantity: 2.00,
            rate: 18500.00,
            discountType: 'percent',
            discount: 10.00,
            taxRate: 18.0
          }
        ],
        notes: 'Debit Note issued towards damaged goods rejected during incoming QC.'
      }
    ],
    recurring: [],
    payments: [
      {
        id: 'pay-001',
        paymentNumber: 'PAY-000001',
        date: '2026-10-05',
        customerId: 'cust-1',
        invoiceId: 'inv-019',
        invoiceNumber: 'SHRKS/Inv/26-27/019',
        amount: 200000.00,
        mode: 'bank',
        reference: 'SBI-NEFT-992104',
        notes: 'Advance part payment received.'
      }
    ],
    expenses: [
      {
        id: 'exp-1',
        date: '2026-10-02',
        category: 'Travel',
        amount: 4500.00,
        vendor: 'KSRTC Airavat & Local Taxi',
        notes: 'Technician travel for Manipal Speciality Chemicals onsite installation',
        billable: true,
        customerId: 'cust-1',
        status: 'unbilled'
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Manipal Lab HPLC Method Development',
        customerId: 'cust-1',
        billingMethod: 'hourly',
        ratePerHour: 3500.00,
        status: 'active',
        tasks: [
          { id: 'task-1', name: 'Column Validation', budgetHours: 20 }
        ]
      }
    ],
    timesheets: [],
    activities: [
      { id: 'act-1', text: 'Quotation SHRKS/Qtn/26-27/019 issued to Manipal Speciality Chemicals Pvt Ltd', time: '2026-10-03 10:30' },
      { id: 'act-2', text: 'Credit Note SHRKS/CN/26-27/001 approved for ₹ 11,800.00', time: '2026-10-06 14:15' },
      { id: 'act-3', text: 'Vendor PO SHRKS/PO/26-27/005 issued to Thermo Fisher Scientific', time: '2026-10-02 11:00' }
    ]
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
        const count = this.getAll('invoices').length + 20;
        return `${org.invoicePrefix || 'SHRKS/Inv/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'estimate') {
        const count = this.getAll('estimates').length + 21;
        return `${org.estimatePrefix || 'SHRKS/Qtn/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'po') {
        const count = this.getAll('purchaseOrders').length + 6;
        return `${org.poPrefix || 'SHRKS/PO/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'creditNote') {
        const count = this.getAll('debitCreditNotes').filter(n => n.docType === 'CREDIT NOTE').length + 2;
        return `${org.creditNotePrefix || 'SHRKS/CN/26-27/'}${String(count).padStart(3, '0')}`;
      } else if (type === 'debitNote') {
        const count = this.getAll('debitCreditNotes').filter(n => n.docType === 'DEBIT NOTE').length + 3;
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
