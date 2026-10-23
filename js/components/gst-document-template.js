/**
 * SHREERAKSHA SOLUTIONS - GST DOCUMENT TEMPLATE ENGINE
 * Shared by Quotations, Vendor PO, Credit Notes, Debit Notes, and Invoices.
 * 100% exact replica of the official quotation format.
 * Supports multi-page pagination with repeated headers, footers, and dynamic page counts.
 * Page breakdown immediately after subtotal with auto-adjusting rows.
 */

(function (window) {
  'use strict';

  const GSTDocumentTemplate = {
    /**
     * Estimates vertical height in millimeters for a given item row in A4 landscape.
     */
    estimateItemHeight(item) {
      let h = 8.5; // Base height (padding + title + HSN)
      const desc = (item && item.description) ? String(item.description).trim() : '';
      if (desc.length > 90) {
        h += 8.0;
      } else if (desc.length > 40) {
        h += 5.0;
      } else if (desc.length > 0) {
        h += 3.0;
      }
      return h;
    },

    /**
     * Determines whether items should paginate dynamically based on exact height budget.
     */
    shouldPaginate(items) {
      const pages = this.buildPages(items);
      return pages.length > 1;
    },

    /**
     * Builds smart pages with dynamic page breakdown:
     * 1. 1st page is filled 1st before considering breakdown.
     *    If all contents (Items + Sub Total + Total Block + Notes/Terms) fit on Page 1 -> Exactly 1 Page.
     * 2. If Notes & Terms cannot fit on Page 1, but Items + Sub Total + Total Block fit:
     *    Page breakdown is IMMEDIATELY AFTER TOTAL!
     *    Notes is the next starting point on Page 2!
     * 3. If Total Block cannot fit on Page 1, but Items + Sub Total fit:
     *    Page breakdown is IMMEDIATELY AFTER SUBTOTAL!
     *    Page 2 starts with Total Block, followed by Notes & Terms!
     * 4. If items exceed Page 1 capacity:
     *    Page 1 fills with as many items as can fit, remaining items continue on Page 2,
     *    and breakdown occurs immediately after Total (or Subtotal).
     */
    buildPages(items) {
      const itemList = items || [];
      const n = itemList.length;

      // Section heights in millimeters
      const HEADER_P1 = 18.0 + 34.0 + 14.0; // Header + Customer Meta + Footer = 66mm
      const HEADER_P2 = 18.0 + 8.0 + 14.0;  // Header + Continued Meta + Footer = 40mm
      const PRINTABLE_PAGE_H = 194.0;       // A4 height 210mm - 16mm padding

      const SPACE_P1 = PRINTABLE_PAGE_H - HEADER_P1; // 128mm available for content on Page 1
      const SPACE_P2 = PRINTABLE_PAGE_H - HEADER_P2; // 154mm available for content on Page 2+

      const TBL_HDR = 10.0;
      const SUBTOTAL_H = 8.0;
      const TOTAL_BLK_H = 16.0;
      const NOTES_TERMS_H = 46.0;

      const totalItemsH = itemList.reduce((acc, item) => acc + this.estimateItemHeight(item), 0);

      // Permutation 1: Check if EVERYTHING fits on Page 1 (Single Page)
      // 1st page is filled 1st!
      if (totalItemsH + TBL_HDR + SUBTOTAL_H + TOTAL_BLK_H + NOTES_TERMS_H <= SPACE_P1) {
        return [{
          pageIndex: 0,
          items: itemList,
          startIndex: 0,
          showSubTotal: true,
          showTotalBlock: true,
          showNotesTerms: true
        }];
      }

      // Permutation 2: All items + Sub Total + Total Block fit on Page 1.
      // Page breakdown is IMMEDIATELY AFTER TOTAL!
      // Notes will be the next starting point on Page 2!
      if (totalItemsH + TBL_HDR + SUBTOTAL_H + TOTAL_BLK_H <= SPACE_P1) {
        return [
          {
            pageIndex: 0,
            items: itemList,
            startIndex: 0,
            showSubTotal: true,
            showTotalBlock: true,
            showNotesTerms: false // Breakdown immediately after Total!
          },
          {
            pageIndex: 1,
            items: [], // Notes is the next starting point!
            startIndex: n,
            showSubTotal: false,
            showTotalBlock: false,
            showNotesTerms: true
          }
        ];
      }

      // Permutation 3: Items are so many that Total Block cannot fit on Page 1.
      // But all items + Sub Total fit on Page 1.
      // 1st page breakdown will be IMMEDIATELY AFTER SUBTOTAL!
      if (totalItemsH + TBL_HDR + SUBTOTAL_H <= SPACE_P1) {
        return [
          {
            pageIndex: 0,
            items: itemList,
            startIndex: 0,
            showSubTotal: true,
            showTotalBlock: false, // Breakdown immediately after subtotal!
            showNotesTerms: false
          },
          {
            pageIndex: 1,
            items: [],
            startIndex: n,
            showSubTotal: false,
            showTotalBlock: true,
            showNotesTerms: true
          }
        ];
      }

      // Permutation 4: Items alone exceed Page 1. Multi-page dynamic distribution.
      const pages = [];
      let rem = [...itemList];
      let startIdx = 0;
      let pIdx = 0;

      // Fill Page 1 first
      const curP1 = [];
      let curH1 = TBL_HDR;
      while (rem.length > 0 && (curH1 + this.estimateItemHeight(rem[0]) <= SPACE_P1 - 6.0)) {
        curH1 += this.estimateItemHeight(rem[0]);
        curP1.push(rem.shift());
      }

      pages.push({
        pageIndex: pIdx++,
        items: curP1,
        startIndex: startIdx,
        showSubTotal: false,
        showTotalBlock: false,
        showNotesTerms: false
      });
      startIdx += curP1.length;

      // Process continuation pages
      while (rem.length > 0) {
        const remH = rem.reduce((acc, i) => acc + this.estimateItemHeight(i), 0);

        // Check if remaining items + Sub Total + Total Block + Notes/Terms fit on Page 2
        if (remH + TBL_HDR + SUBTOTAL_H + TOTAL_BLK_H + NOTES_TERMS_H <= SPACE_P2) {
          pages.push({
            pageIndex: pIdx++,
            items: rem,
            startIndex: startIdx,
            showSubTotal: true,
            showTotalBlock: true,
            showNotesTerms: true
          });
          startIdx += rem.length;
          rem = [];
          break;
        }

        // Check if remaining items + Sub Total + Total Block fit on Page 2 (Break after Total)
        if (remH + TBL_HDR + SUBTOTAL_H + TOTAL_BLK_H <= SPACE_P2) {
          pages.push({
            pageIndex: pIdx++,
            items: rem,
            startIndex: startIdx,
            showSubTotal: true,
            showTotalBlock: true,
            showNotesTerms: false // Breakdown immediately after Total!
          });
          startIdx += rem.length;
          rem = [];
          // Notes is the next starting point on Page 3
          pages.push({
            pageIndex: pIdx++,
            items: [],
            startIndex: startIdx,
            showSubTotal: false,
            showTotalBlock: false,
            showNotesTerms: true
          });
          break;
        }

        // Check if remaining items + Sub Total fit on Page 2 (Break after Subtotal)
        if (remH + TBL_HDR + SUBTOTAL_H <= SPACE_P2) {
          pages.push({
            pageIndex: pIdx++,
            items: rem,
            startIndex: startIdx,
            showSubTotal: true,
            showTotalBlock: false, // Breakdown immediately after subtotal!
            showNotesTerms: false
          });
          startIdx += rem.length;
          rem = [];
          pages.push({
            pageIndex: pIdx++,
            items: [],
            startIndex: startIdx,
            showSubTotal: false,
            showTotalBlock: true,
            showNotesTerms: true
          });
          break;
        }

        // Chunk remaining items for this continuation page
        const chunk = [];
        let curChunkH = TBL_HDR;
        while (rem.length > 0 && (curChunkH + this.estimateItemHeight(rem[0]) <= SPACE_P2 - 8.0)) {
          curChunkH += this.estimateItemHeight(rem[0]);
          chunk.push(rem.shift());
        }

        pages.push({
          pageIndex: pIdx++,
          items: chunk,
          startIndex: startIdx,
          showSubTotal: false,
          showTotalBlock: false,
          showNotesTerms: false
        });
        startIdx += chunk.length;
      }

      return pages;
    },

    /**
     * Renders table rows for a specific page with continuous SL numbering
     */
    renderItemRows(items, startIndex, isInterState) {
      return items.map((item, localIndex) => {
        const globalIndex = startIndex + localIndex;
        const hsnSacCode = item.hsnCode || item.sacCode || item.hsn || '90279090';
        const discDisplay = item.discountType === 'amount' 
          ? window.Calculator.formatNumber(item.discountVal)
          : `${(parseFloat(item.discountVal) || 0).toFixed(2)}%`;

        // 2-Digit Serial Number: 01, 02, ..., 10, 99
        const slNumber = String(globalIndex + 1).padStart(2, '0');

        // Quantity with Unit of Measurement: e.g. 6 No's, 1 Pcs
        const qtyVal = parseFloat(item.quantity) || 0;
        const qtyNumStr = Number.isInteger(qtyVal) ? String(qtyVal) : qtyVal.toFixed(2);
        let uStr = (item.unit || (item.itemId ? (window.AppStore.getById('items', item.itemId) || {}).unit : '') || "No's").trim();
        const uClean = uStr.toLowerCase().replace(/[^a-z]/g, '');
        if (uClean === 'nos' || uClean === 'no' || uClean === '') {
          uStr = "No's";
        } else if (uClean === 'pcs' || uClean === 'pc' || uClean === 'piece' || uClean === 'pieces') {
          uStr = "Pcs";
        } else if (uClean === 'set' || uClean === 'sets') {
          uStr = "Sets";
        } else if (uClean === 'service' || uClean === 'services') {
          uStr = "Service";
        } else if (uClean === 'box' || uClean === 'boxes') {
          uStr = "Box";
        } else if (uClean === 'mtr' || uClean === 'meter' || uClean === 'meters') {
          uStr = "Mtr";
        }
        const formattedQtyWithUnit = `${qtyNumStr} ${uStr}`;

        return `
          <tr>
            <td class="sr-cell-num">${slNumber}</td>
            <td class="sr-cell-desc">
              <div class="sr-item-title">${item.name}</div>
              ${item.description ? `<div class="sr-item-specs">${item.description}</div>` : ''}
              <div class="sr-item-hsn">HSN/SAC: ${hsnSacCode}</div>
            </td>
            <td class="sr-cell-qty" style="white-space: nowrap;">${formattedQtyWithUnit}</td>
            <td class="sr-cell-rate">${window.Calculator.formatNumber(item.rate)}</td>
            <td class="sr-cell-amount">${window.Calculator.formatNumber(item.grossAmount)}</td>
            <td class="sr-cell-disc">${discDisplay}</td>
            <td class="sr-cell-taxable">${window.Calculator.formatNumber(item.taxableAmount)}</td>
            
            ${isInterState ? `
              <td class="sr-cell-tax-pct">${item.igstRate}%</td>
              <td class="sr-cell-tax-amt">${window.Calculator.formatNumber(item.igstAmount)}</td>
            ` : `
              <td class="sr-cell-tax-pct">${item.cgstRate}%</td>
              <td class="sr-cell-tax-amt">${window.Calculator.formatNumber(item.cgstAmount)}</td>
              <td class="sr-cell-tax-pct">${item.sgstRate}%</td>
              <td class="sr-cell-tax-amt">${window.Calculator.formatNumber(item.sgstAmount)}</td>
            `}

            <td class="sr-cell-total">${window.Calculator.formatNumber(item.totalLineAmount)}</td>
          </tr>
        `;
      }).join('');
    },

    /**
     * Renders Total In Words and Rounding & Grand Total Table
     */
    renderTotalBlock(ctx) {
      return `
        <!-- TOTAL BLOCK (WORDS + ROUNDING/TOTAL) -->
        <div class="sr-total-block">
          <div class="sr-words-col">
            <div class="sr-words-label">Total In Words</div>
            <div class="sr-words-val">${ctx.calc.totalInWords}</div>
          </div>
          <div class="sr-total-col">
            <table class="sr-rounding-table">
              <tbody>
                <tr>
                  <td class="sr-round-label">Rounding</td>
                  <td class="sr-round-val">${ctx.calc.rounding >= 0 ? '+' + ctx.calc.rounding.toFixed(2) : ctx.calc.rounding.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="sr-total-label">Total</td>
                  <td class="sr-total-val">₹ ${window.Calculator.formatNumber(ctx.calc.roundedTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    /**
     * Renders Notes, Terms & Conditions, Bank Details, and Authorized Signature
     */
    renderNotesAndTermsBlock(doc, ctx) {
      return `
        <!-- NOTES & TERMS BLOCK (NOTES/TERMS + BANK/SIGN) -->
        <div class="sr-notes-terms-block">
          <div class="sr-notes-terms-col">
            <div class="sr-notes-label">Notes</div>
            <div class="sr-notes-val">${doc.notes || 'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned'}</div>

            <div class="sr-terms-label">Terms & Conditions</div>
            <ul class="sr-terms-list">
              <li>Above prices are FOR Destination.</li>
              <li>Please mention our Estimate number on all future correspondence.</li>
              <li>Please share your valid GSTIN in your Purchase Order.</li>
              <li>Payment Terms: As agreed (${doc.paymentTerms || '30 Days net'}).</li>
              <li>In case of Refurbished requirement</li>
              <li class="sr-sub-bullet">The defective part need to be returned - against delivery.</li>
              <li>Delivery will be within 3-4 weeks from date of PO.</li>
              <li class="sr-sub-bullet">Goods indicated above in stock are accurate as of the quote date.</li>
              <li class="sr-sub-bullet">If goods are out of stock at the time of release of PO, standard lead time would apply.</li>
              <li>Payment will be 50% advance and balance against delivery.</li>
            </ul>
          </div>

          <div class="sr-bank-sign-col">
            <div class="sr-bank-box">
              <div class="sr-bank-header">COMPANY BANKING DETAILS (FOR RTGS / NEFT)</div>
              <table class="sr-bank-table">
                <tbody>
                  <tr>
                    <td class="sr-bank-k">Bank Name:</td>
                    <td class="sr-bank-v">${ctx.org.bankName || 'State Bank of India'}</td>
                  </tr>
                  <tr>
                    <td class="sr-bank-k">Account Name:</td>
                    <td class="sr-bank-v">${ctx.org.accountName || 'SHREERAKSHA SOLUTIONS'}</td>
                  </tr>
                  <tr>
                    <td class="sr-bank-k">Account No:</td>
                    <td class="sr-bank-v">${ctx.org.accountNumber || '45666081503'}</td>
                  </tr>
                  <tr>
                    <td class="sr-bank-k">IFSC Code:</td>
                    <td class="sr-bank-v">${ctx.org.ifscCode || 'SBIN0016869'}</td>
                  </tr>
                  <tr>
                    <td class="sr-bank-k">Branch:</td>
                    <td class="sr-bank-v">${ctx.org.branch || 'PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi'}</td>
                  </tr>
                  <tr>
                    <td class="sr-bank-k">MICR Code:</td>
                    <td class="sr-bank-v">${ctx.org.micrCode || '576002012'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="sr-sign-box">
              <div class="sr-sign-header">For Sreeraksha Solutions</div>
              <div class="sr-sign-body">
                <div class="sr-sign-line"></div>
                <div class="sr-sign-label">Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Renders a single page with repeated header, items table, and bottom-pinned footer
     */
    renderPage(doc, pageCfg, totalPages, ctx) {
      const isFirstPage = (pageCfg.pageIndex === 0);

      return `
        <div class="shreeraksha-document shreeraksha-document-page">
          
          <!-- TOP HEADER WITH EXACT UPLOADED LOGO (MAINTAINED AS IT IS, REPEATED ON EVERY PAGE) -->
          <div class="sr-header-top">
            <div class="sr-company-title-wrap">
              <img src="assets/shreeraksha-text-exact.png" alt="SHREERAKSHA SOLUTIONS" class="sr-brand-img">
            </div>

            <div class="sr-ornamental-logo">
              <img src="assets/shreeraksha-emblem-exact.png" alt="Shreeraksha Emblem" class="sr-logo-img">
            </div>
          </div>

          <!-- DOCUMENT TITLE (REPEATED ON EVERY PAGE) -->
          <div class="sr-document-title">
            ${ctx.docType}
          </div>

          ${isFirstPage ? `
            <!-- TWO COLUMN META BOX (PAGE 1) -->
            <table class="sr-meta-table">
              <thead>
                <tr>
                  <th style="width: 50%;">${ctx.partyHeaderLabel}</th>
                  <th style="width: 50%;">
                    Place Of Supply &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${ctx.placeOfSupply}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <!-- PARTY DETAILS (WITH KIND ATTENTION INSIDE ABOVE CLIENT NAME) -->
                  <td>
                    ${(ctx.docType === 'QUOTATION' || doc.attention || ctx.party.attention) ? `
                      <div class="sr-kind-attention-block" style="margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #BAC8D9;">
                        <span class="sr-attention-label" style="font-size: 11px; font-weight: 700; color: #193440;">Kind Attention : </span>
                        <span class="sr-attention-name" style="font-size: 11.5px; font-weight: 700; color: #193440;">${doc.attention || ctx.party.attention || 'Mr. Sreekar Nayak'}</span>
                      </div>
                    ` : ''}
                    <div class="sr-customer-name">${ctx.party.company || ctx.party.name}</div>
                    <div style="white-space: pre-line; line-height: 1.35; margin-bottom: 3px;">${ctx.party.billingAddress || ctx.party.address || 'Address not provided'}</div>
                    <div style="font-weight: 700;">GSTIN &nbsp;${ctx.party.taxId || ctx.party.gstin || '29AATCM4200G1ZD'}</div>
                  </td>

                  <!-- DOCUMENT META DETAILS -->
                  <td>
                    <div class="sr-meta-kv-grid">
                      <span class="sr-meta-k">${ctx.numLabel}</span>
                      <span class="sr-meta-v">${doc.number || 'SHRKS/Qtn/26-27/019'}</span>

                      <span class="sr-meta-k">${ctx.dateLabel}</span>
                      <span class="sr-meta-v">${window.Calculator.formatDate(doc.date)}</span>

                      <span class="sr-meta-k">${ctx.expLabel}</span>
                      <span class="sr-meta-v">${window.Calculator.formatDate(doc.expiryDate || doc.dueDate || doc.originalInvoiceNumber)}</span>

                      <span class="sr-meta-k">Reference#</span>
                      <span class="sr-meta-v">${doc.reference || ''}</span>

                      <span class="sr-meta-k">Email</span>
                      <span class="sr-meta-v">${ctx.party.email || ''}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ` : `
            <!-- CONTINUATION COMPACT META REFERENCE BAR (PAGE 2+) -->
            <div class="sr-continued-meta-bar">
              <span><strong>${ctx.numLabel}:</strong> ${doc.number || ''}</span>
              <span><strong>${ctx.dateLabel}:</strong> ${window.Calculator.formatDate(doc.date)}</span>
              <span><strong>${ctx.partyHeaderLabel}:</strong> ${ctx.party.company || ctx.party.name}</span>
              <span><strong>Page:</strong> ${pageCfg.pageIndex + 1} of ${totalPages}</span>
            </div>
          `}

          ${pageCfg.items.length > 0 ? `
            <!-- GST ITEMS GRID TABLE (AUTO-ADJUSTING ROWS & COLUMNS) -->
            <table class="sr-items-table">
              <thead>
                ${ctx.isInterState ? `
                  <!-- INTER-STATE (IGST) HEADER -->
                  <tr>
                    <th rowspan="2" class="sr-th-sl">SL</th>
                    <th rowspan="2" class="sr-th-desc">Item & Description</th>
                    <th rowspan="2" class="sr-th-qty">Qty</th>
                    <th rowspan="2" class="sr-th-rate">Rate</th>
                    <th rowspan="2" class="sr-th-amount">Amount</th>
                    <th rowspan="2" class="sr-th-disc">${ctx.discHeaderLabel}</th>
                    <th rowspan="2" class="sr-th-taxable">Taxable<br>Amount</th>
                    <th colspan="2" class="sr-th-tax">IGST</th>
                    <th rowspan="2" class="sr-th-total">Total</th>
                  </tr>
                  <tr>
                    <th class="sr-th-tax-pct">%</th>
                    <th class="sr-th-tax-amt">Amt</th>
                  </tr>
                ` : `
                  <!-- INTRA-STATE (CGST + SGST) HEADER -->
                  <tr>
                    <th rowspan="2" class="sr-th-sl">SL</th>
                    <th rowspan="2" class="sr-th-desc">Item & Description</th>
                    <th rowspan="2" class="sr-th-qty">Qty</th>
                    <th rowspan="2" class="sr-th-rate">Rate</th>
                    <th rowspan="2" class="sr-th-amount">Amount</th>
                    <th rowspan="2" class="sr-th-disc">${ctx.discHeaderLabel}</th>
                    <th rowspan="2" class="sr-th-taxable">Taxable<br>Amount</th>
                    <th colspan="2" class="sr-th-tax">CGST</th>
                    <th colspan="2" class="sr-th-tax">SGST</th>
                    <th rowspan="2" class="sr-th-total">Total</th>
                  </tr>
                  <tr>
                    <th class="sr-th-tax-pct">%</th>
                    <th class="sr-th-tax-amt">Amt</th>
                    <th class="sr-th-tax-pct">%</th>
                    <th class="sr-th-tax-amt">Amt</th>
                  </tr>
                `}
              </thead>
              <tbody>
                ${this.renderItemRows(pageCfg.items, pageCfg.startIndex, ctx.isInterState)}

                ${pageCfg.showSubTotal ? `
                  <!-- SUB TOTAL ROW - PAGE BREAKDOWN IMMEDIATELY AFTER THIS -->
                  <tr class="sr-subtotal-row">
                    <td colspan="4" class="sr-subtotal-label">Sub Total</td>
                    <td class="sr-cell-amount">₹ ${window.Calculator.formatNumber(ctx.calc.subTotalGross)}</td>
                    <td class="sr-cell-disc">₹ ${window.Calculator.formatNumber(ctx.calc.totalDiscount)}</td>
                    <td class="sr-cell-taxable">₹ ${window.Calculator.formatNumber(ctx.calc.totalTaxable)}</td>
                    
                    ${ctx.isInterState ? `
                      <td colspan="2" class="sr-cell-tax-amt" style="text-align: right;">₹ ${window.Calculator.formatNumber(ctx.calc.totalIGST)}</td>
                    ` : `
                      <td colspan="2" class="sr-cell-tax-amt" style="text-align: right;">₹ ${window.Calculator.formatNumber(ctx.calc.totalCGST)}</td>
                      <td colspan="2" class="sr-cell-tax-amt" style="text-align: right;">₹ ${window.Calculator.formatNumber(ctx.calc.totalSGST)}</td>
                    `}

                    <td class="sr-cell-total">₹ ${window.Calculator.formatNumber(ctx.calc.subTotalFinal)}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          ` : ''}

          ${pageCfg.showTotalBlock ? this.renderTotalBlock(ctx) : ''}

          ${pageCfg.showNotesTerms ? this.renderNotesAndTermsBlock(doc, ctx) : ''}

          <!-- BOTTOM FOOTER LINE SEPARATOR (MAINTAINED AS IT IS, REPEATED ON EVERY PAGE) -->
          <div class="sr-footer-box">
            <div class="sr-footer-left">
              <div><span class="sr-footer-strong">Address :</span> 5-68, Mulliya Mata House, Ajjavara Post, Sulya, Dakshina Kannada - 574 239, Karnataka, India</div>
              <div><span class="sr-footer-strong">Phone :</span> +91 9880 54 99 55 &nbsp;&nbsp;+91 96636 91509</div>
              <div><span class="sr-footer-strong">E-Mail :</span> connect@shreeraksha.in &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="sr-footer-strong">GSTIN :</span> 29FEAPS4448D1ZA</div>
              <div><span class="sr-footer-strong">Website :</span> www.shreeraksha.in &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="sr-footer-strong">MSME Reg. No. :</span> UDYAM-KR-11-0087041</div>
            </div>

            <div class="sr-footer-right">
              <div class="sr-footer-page-pill">Page ${pageCfg.pageIndex + 1} of ${totalPages}</div>
            </div>
          </div>

        </div>
      `;
    },

    /**
     * Main entry point to render document HTML
     */
    render(doc, options = {}) {
      const org = window.AppStore.getOrg();
      const docType = options.docType || doc.docType || 'QUOTATION';
      const partyType = options.partyType || (docType.includes('PURCHASE') || doc.vendorId ? 'vendor' : 'customer');
      
      const party = partyType === 'vendor' 
        ? (window.AppStore.getById('customers', doc.vendorId || doc.customerId) || { name: 'Vendor Name' })
        : (window.AppStore.getById('customers', doc.customerId) || { name: 'Customer Name' });

      const placeOfSupply = doc.placeOfSupply || party.placeOfSupply || 'Karnataka (29)';
      const isInterState = window.Calculator.isInterState(placeOfSupply, org.state || 'Karnataka (29)');

      // Calculate totals using GST calculation engine
      const calc = window.Calculator.computeGSTDocumentTotals(doc.items || [], isInterState, doc.adjustment || 0);

      // Determine labels based on document type
      let numLabel = 'Quote#';
      let dateLabel = 'Quote Date';
      let expLabel = 'Expiry Date';

      if (docType === 'PURCHASE ORDER') {
        numLabel = 'PO#';
        dateLabel = 'PO Date';
        expLabel = 'Delivery Due';
      } else if (docType === 'CREDIT NOTE') {
        numLabel = 'Credit Note#';
        dateLabel = 'CN Date';
        expLabel = 'Original Inv#';
      } else if (docType === 'DEBIT NOTE') {
        numLabel = 'Debit Note#';
        dateLabel = 'DN Date';
        expLabel = 'Original Inv#';
      } else if (docType === 'TAX INVOICE') {
        numLabel = 'Invoice#';
        dateLabel = 'Invoice Date';
        expLabel = 'Due Date';
      }

      const partyHeaderLabel = partyType === 'vendor' ? 'Vendor' : 'Customer';

      // Check if discount column has amount or percentage
      const hasDiscountAmount = (doc.items || []).some(i => i.discountType === 'amount');
      const discHeaderLabel = hasDiscountAmount ? 'Disc Amt' : 'Disc %';

      // Build smart pages (breakdown immediately after subtotal)
      const pages = this.buildPages(calc.items || []);
      const totalPages = pages.length;

      const ctx = {
        docType,
        partyType,
        party,
        org,
        placeOfSupply,
        isInterState,
        calc,
        numLabel,
        dateLabel,
        expLabel,
        partyHeaderLabel,
        discHeaderLabel
      };

      if (totalPages === 1) {
        return this.renderPage(doc, pages[0], 1, ctx);
      }

      return `
        <div class="shreeraksha-document-wrapper">
          ${pages.map((p, idx) => `
            ${this.renderPage(doc, p, totalPages, ctx)}
            ${idx < totalPages - 1 ? '<div class="page-break"></div>' : ''}
          `).join('')}
        </div>
      `;
    }
  };

  window.GSTDocumentTemplate = GSTDocumentTemplate;

})(window);
