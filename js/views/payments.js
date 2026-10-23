/**
 * ZOHO INVOICE - PAYMENTS RECEIVED LEDGER
 * Complete payment tracking, receipts, and printable official receipt vouchers.
 */

(function (window) {
  'use strict';

  const PaymentsView = {
    searchQuery: '',

    render() {
      const container = document.getElementById('app-view');
      if (!container) return;

      const payments = window.AppStore.getAll('payments');

      const filtered = payments.filter(p => {
        if (!this.searchQuery) return true;
        const q = this.searchQuery.toLowerCase();
        const cust = window.AppStore.getById('customers', p.customerId);
        return (
          (p.paymentNumber && p.paymentNumber.toLowerCase().includes(q)) ||
          (p.reference && p.reference.toLowerCase().includes(q)) ||
          (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
          (cust && cust.name && cust.name.toLowerCase().includes(q))
        );
      });

      const totalReceived = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

      container.innerHTML = `
        <div class="payments-page animate-fadeIn">
          
          <div class="table-card">
            <div class="table-header-toolbar">
              <div class="table-title-area">
                <h2 class="table-title">Payments Received</h2>
                <span class="table-count-badge">${payments.length} Payments &bull; Total: ₹ ${window.Calculator.formatNumber(totalReceived)}</span>
              </div>
              <div class="table-actions-area">
                <input 
                  type="text" 
                  id="payments-search-input" 
                  class="table-search-input" 
                  placeholder="Search receipt #, ref, client..." 
                  value="${this.searchQuery}"
                >
                <button class="btn btn-primary btn-icon-gap" onclick="window.PaymentsView.promptNewPayment()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Record Payment</span>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment / Receipt #</th>
                    <th>Customer Name</th>
                    <th>Invoice Settled</th>
                    <th>Payment Mode</th>
                    <th>Ref / UTR #</th>
                    <th class="text-right">Amount Received</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center" style="padding: 2.5rem; color: var(--text-muted);">
                        No payment records found matching criteria.
                      </td>
                    </tr>
                  ` : filtered.map(pay => {
                    const cust = window.AppStore.getById('customers', pay.customerId);
                    return `
                      <tr>
                        <td>${window.Calculator.formatDate(pay.date)}</td>
                        <td class="cell-primary">
                          <a href="javascript:void(0)" onclick="window.PaymentsView.viewReceipt('${pay.id}')" class="customer-name-link">
                            ${pay.paymentNumber}
                          </a>
                        </td>
                        <td>${cust ? cust.name : 'Unknown Customer'}</td>
                        <td>
                          <a href="#invoices?id=${pay.invoiceId}" style="color: var(--text-secondary); text-decoration: underline;">
                            ${pay.invoiceNumber || 'INV-Linked'}
                          </a>
                        </td>
                        <td><span class="badge badge-draft">${(pay.mode || 'bank').toUpperCase()}</span></td>
                        <td><code>${pay.reference || '—'}</code></td>
                        <td class="font-bold text-success text-right">₹ ${window.Calculator.formatNumber(pay.amount)}</td>
                        <td class="cell-actions text-right">
                          <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.PaymentsView.printReceipt('${pay.id}')" title="Print Official Receipt Slip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            <span>Print Slip</span>
                          </button>
                          <button class="btn btn-secondary btn-sm" onclick="window.PaymentsView.viewReceipt('${pay.id}')">
                            View
                          </button>
                          <button class="btn btn-outline btn-sm" style="color: var(--color-overdue); border-color: var(--border-light);" onclick="window.PaymentsView.deletePayment('${pay.id}')">
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

      const searchInput = document.getElementById('payments-search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(this.searchQuery.length, this.searchQuery.length);
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.render();
        });
      }
    },

    /**
     * Builds the official Shreeraksha Payment Receipt Voucher HTML
     */
    buildPrintableReceiptHtml(pay) {
      const org = window.AppStore.getOrg();
      const customer = window.AppStore.getById('customers', pay.customerId) || {};
      const invoice = pay.invoiceId ? window.AppStore.getById('invoices', pay.invoiceId) : null;
      const invTotal = invoice ? (invoice.total || 0) : pay.amount;
      const invBal = invoice && invoice.balanceDue != null ? invoice.balanceDue : 0;
      const words = window.Calculator.numberToIndianWords(Math.round(pay.amount));

      return `
        <div class="shreeraksha-receipt-slip" style="background:#ffffff; color:#000000; font-family:'Rubik', sans-serif; max-width:820px; margin:0 auto; padding:24px 30px; border:1px solid #111111; box-sizing:border-box;">
          
          <!-- TOP HEADER ROW WITH EXACT LOGOS -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000000; padding-bottom:12px; margin-bottom:14px;">
            <div style="display:flex; align-items:center;">
              <img src="assets/shreeraksha-text-exact.png" alt="Shreeraksha Solutions" style="max-height:50px; width:auto; object-fit:contain; display:block;" onerror="this.onerror=null; this.src='assets/shreeraksha-header-exact.png';">
            </div>
            <div style="text-align:right;">
              <img src="assets/shreeraksha-emblem-exact.png" alt="Shreeraksha Emblem" style="max-height:52px; width:auto; object-fit:contain; display:block;" onerror="this.onerror=null; this.style.display='none';">
            </div>
          </div>

          <!-- DOCUMENT TITLE -->
          <div style="text-align:center; margin:8px 0 16px 0;">
            <h1 style="font-size:22px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; margin:0; color:#000000;">PAYMENT RECEIPT</h1>
            <div style="font-size:11px; font-weight:600; color:#333333; margin-top:2px;">OFFICIAL ACKNOWLEDGEMENT OF PAYMENT RECEIVED</div>
          </div>

          <!-- TWO COLUMN META DETAILS -->
          <div style="display:grid; grid-template-columns:55% 45%; border:1.5px solid #000000; margin-bottom:16px;">
            
            <!-- LEFT: RECEIVED FROM -->
            <div style="padding:10px 12px; border-right:1.5px solid #000000;">
              <div style="background:#000000; color:#ffffff; font-size:11px; font-weight:700; padding:3px 8px; margin:-10px -12px 8px -12px; text-transform:uppercase;">
                Received From (Customer Details)
              </div>
              <div style="font-size:13px; font-weight:800; color:#000000; margin-bottom:4px;">
                ${customer.name || 'Valued Client'}
              </div>
              <div style="font-size:11.5px; line-height:1.4; color:#222222; margin-bottom:4px;">
                ${customer.billingAddress || customer.address || 'Karnataka, India'}
              </div>
              <div style="font-size:11.5px; font-weight:700; color:#000000;">
                GSTIN / Tax ID: <span style="font-weight:600;">${customer.taxId || customer.gstin || '29AATCM4200G1ZD'}</span>
              </div>
              ${customer.contactPerson ? `
                <div style="font-size:11px; color:#333333; margin-top:2px;">
                  Kind Attn: <strong>${customer.contactPerson}</strong> ${customer.phone ? `(${customer.phone})` : ''}
                </div>
              ` : ''}
            </div>

            <!-- RIGHT: PAYMENT VITALS -->
            <div style="padding:10px 12px; font-size:11.5px;">
              <div style="background:#000000; color:#ffffff; font-size:11px; font-weight:700; padding:3px 8px; margin:-10px -12px 8px -12px; text-transform:uppercase;">
                Receipt Vitals
              </div>
              <div style="display:grid; grid-template-columns:120px 1fr; row-gap:4px; line-height:1.35;">
                <div style="font-weight:700;">Receipt Number:</div>
                <div style="font-weight:800;">${pay.paymentNumber}</div>

                <div style="font-weight:700;">Receipt Date:</div>
                <div style="font-weight:600;">${window.Calculator.formatDate(pay.date)}</div>

                <div style="font-weight:700;">Payment Mode:</div>
                <div style="font-weight:700; text-transform:uppercase;">${(pay.mode || 'bank').toUpperCase()}</div>

                <div style="font-weight:700;">Transaction Ref:</div>
                <div style="font-weight:600;">${pay.reference || '—'}</div>

                <div style="font-weight:700;">Deposited Bank:</div>
                <div style="font-weight:600;">${org.bankName || 'State Bank of India'}</div>
              </div>
            </div>

          </div>

          <!-- SETTLED INVOICES BREAKDOWN -->
          <table style="width:100%; border-collapse:collapse; border:1.5px solid #000000; margin-bottom:14px; font-size:11.5px;">
            <thead>
              <tr style="background:#000000; color:#ffffff;">
                <th style="padding:6px 8px; border:1px solid #ffffff; width:5%; text-align:center;">#</th>
                <th style="padding:6px 8px; border:1px solid #ffffff; width:35%; text-align:left;">Invoice Details</th>
                <th style="padding:6px 8px; border:1px solid #ffffff; width:20%; text-align:right;">Invoice Total</th>
                <th style="padding:6px 8px; border:1px solid #ffffff; width:20%; text-align:right;">Payment Applied</th>
                <th style="padding:6px 8px; border:1px solid #ffffff; width:20%; text-align:right;">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:8px; border:1px solid #000000; text-align:center; font-weight:600;">1</td>
                <td style="padding:8px; border:1px solid #000000;">
                  <div style="font-weight:800;">${pay.invoiceNumber || 'Direct Payment On Account'}</div>
                  <div style="font-size:10.5px; color:#333333;">Ref ID: ${pay.invoiceId || 'N/A'}</div>
                </td>
                <td style="padding:8px; border:1px solid #000000; text-align:right; font-weight:600;">₹ ${window.Calculator.formatNumber(invTotal)}</td>
                <td style="padding:8px; border:1px solid #000000; text-align:right; font-weight:800; color:#0b6623;">₹ ${window.Calculator.formatNumber(pay.amount)}</td>
                <td style="padding:8px; border:1px solid #000000; text-align:right; font-weight:600;">₹ ${window.Calculator.formatNumber(invBal)}</td>
              </tr>
            </tbody>
          </table>

          <!-- TOTAL HIGHLIGHT & WORDS -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
            
            <!-- LEFT: AMOUNT IN WORDS & NOTES -->
            <div style="width:58%;">
              <div style="font-size:12px; font-weight:800; margin-bottom:2px;">Amount in Words:</div>
              <div style="font-size:12px; font-weight:800; font-style:italic; line-height:1.4; color:#000000; margin-bottom:10px;">
                ${words}
              </div>

              <div style="font-size:12px; font-weight:800; margin-bottom:2px;">Notes / Narration:</div>
              <div style="font-size:11.5px; color:#222222; line-height:1.35;">
                ${pay.notes || 'Received with thanks. Subject to realization of instrument if paid by cheque.'}
              </div>
            </div>

            <!-- RIGHT: TOTAL RECEIVED BOX -->
            <div style="width:38%; margin-left:auto;">
              <table style="width:100%; border-collapse:collapse; border:1.5px solid #000000;">
                <tbody>
                  <tr style="background:#f4f6f8;">
                    <td style="padding:8px 10px; font-size:12px; font-weight:800; text-align:right; width:50%; border:1px solid #000000;">Amount Received</td>
                    <td style="padding:8px 10px; font-size:14px; font-weight:900; text-align:right; width:50%; border:1px solid #000000; color:#0b6623;">
                      ₹ ${window.Calculator.formatNumber(pay.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- SIGNATORY BOX -->
              <div style="margin-top:12px; border:1.5px solid #000000;">
                <div style="background-color:#0b2545; color:#ffffff; padding:4px 6px; font-size:11px; font-weight:700; text-align:center; letter-spacing:0.04em;">
                  For Shreeraksha Solutions
                </div>
                <div style="height:70px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding-bottom:4px;">
                  <div style="width:90%; border-top:1px solid #000000; margin-bottom:4px;"></div>
                  <div style="font-size:11.5px; font-weight:700; color:#000000;">Authorized Signatory</div>
                </div>
              </div>
            </div>

          </div>

          <!-- FOOTER DETAILS -->
          <div style="border-top:1.5px solid #000000; padding-top:8px; margin-top:12px; display:grid; grid-template-columns:65% 35%; font-size:10.5px; line-height:1.4; color:#333333;">
            <div>
              <div><strong>Address :</strong> 5-68, Mulliya Mata House, Ajjavara Post, Sulya, Dakshina Kannada - 574 239, Karnataka, India</div>
              <div><strong>Phone :</strong> +91 9880 54 99 55 &nbsp;&bull;&nbsp; +91 96636 91509 &nbsp;&bull;&nbsp; <strong>E-Mail :</strong> connect@shreeraksha.in</div>
            </div>
            <div style="text-align:right; font-weight:700;">
              <div>GSTIN : 29FEAPS4448D1ZA</div>
              <div>MSME Reg. No. : UDYAM-KR-11-0087041</div>
            </div>
          </div>

        </div>
      `;
    },

    /**
     * Executes 100% Reliable Printing of the Payment Receipt Slip
     */
    printReceipt(paymentId) {
      const pay = window.AppStore.getById('payments', paymentId);
      if (!pay) {
        window.Toast.show('Payment record not found.', 'error');
        return;
      }

      let printContainer = document.getElementById('print-receipt-container');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-receipt-container';
        document.body.appendChild(printContainer);
      }

      printContainer.innerHTML = this.buildPrintableReceiptHtml(pay);
      document.body.classList.add('printing-receipt');

      // Allow DOM to settle, then invoke window.print()
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-receipt');
          if (printContainer) printContainer.innerHTML = '';
        }, 1200);
      }, 250);
    },

    viewReceipt(paymentId) {
      const pay = window.AppStore.getById('payments', paymentId);
      if (!pay) return;

      const receiptHtml = this.buildPrintableReceiptHtml(pay);

      const contentHtml = `
        <div style="max-height: 80vh; overflow-y: auto; padding: 0.5rem;">
          ${receiptHtml}
          
          <div class="flex justify-end gap-2 no-print" style="margin-top: 1.25rem;">
            <button class="btn btn-primary btn-sm btn-icon-gap" onclick="window.PaymentsView.printReceipt('${pay.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print Receipt Slip</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Close</button>
          </div>
        </div>
      `;

      window.Modal.open({
        title: `Payment Receipt: ${pay.paymentNumber}`,
        contentHtml,
        size: 'lg',
        showFooter: false
      });
    },

    promptNewPayment() {
      const invoices = window.AppStore.getAll('invoices').filter(i => {
        const bal = i.balanceDue != null ? i.balanceDue : (i.total - (i.amountPaid || 0));
        return bal > 0.01 && i.status !== 'void';
      });

      if (invoices.length === 0) {
        window.Toast.show('No unpaid or overdue invoices found.', 'info');
        return;
      }

      const invOptions = invoices.map(i => {
        const cust = window.AppStore.getById('customers', i.customerId);
        const bal = i.balanceDue != null ? i.balanceDue : (i.total - (i.amountPaid || 0));
        return `<option value="${i.id}">${i.number} - ${cust ? cust.name : ''} (Balance: ₹ ${window.Calculator.formatNumber(bal)})</option>`;
      }).join('');

      const contentHtml = `
        <div class="form-group">
          <label class="form-label required">Select Unpaid Invoice</label>
          <select id="direct-pay-inv-select" class="input-select w-full">
            ${invOptions}
          </select>
        </div>
      `;

      window.Modal.open({
        title: 'Record Incoming Payment',
        contentHtml,
        size: 'sm',
        confirmText: 'Continue to Payment Form',
        onConfirm: () => {
          const invId = document.getElementById('direct-pay-inv-select').value;
          window.Modal.close();
          window.InvoicesView.promptPaymentModal(invId);
          return true;
        }
      });
    },

    deletePayment(paymentId) {
      window.Modal.confirm({
        title: 'Delete Payment Record',
        message: 'Are you sure you want to delete this payment record?',
        danger: true,
        onConfirm: () => {
          window.AppStore.delete('payments', paymentId);
          window.Toast.show('Payment record removed.', 'info');
          this.render();
        }
      });
    }
  };

  window.PaymentsView = PaymentsView;

})(window);
