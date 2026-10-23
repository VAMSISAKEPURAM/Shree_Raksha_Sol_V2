/**
 * ZOHO INVOICE - FINANCIAL & GST CALCULATION ENGINE
 * Comprehensive GST compliance (CGST/SGST vs IGST), dynamic discounts (% and amount),
 * Indian currency Lakhs/Crores formatting, and Indian Rupee words generator.
 */

(function (window) {
  'use strict';

  const Calculator = {
    /**
     * Format numbers into formatted currency strings with Indian number grouping (Lakhs/Crores)
     */
    formatCurrency(amount, currencyCode = null) {
      if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
      }
      const org = window.AppStore ? window.AppStore.getOrg() : null;
      const code = currencyCode || (org ? org.currency : 'INR');
      const symbol = (org && org.currencySymbol) ? org.currencySymbol : '₹';

      try {
        if (code === 'INR' || symbol === '₹') {
          return `${symbol} ${amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
        }
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      } catch (e) {
        return `${symbol} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },

    /**
     * Format raw number without currency symbol with 2 decimals
     */
    formatNumber(amount) {
      if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
      }
      return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    /**
     * Format ISO date string into DD-MM-YYYY format matching Shreeraksha Quotation
     */
    formatDate(dateStr) {
      if (!dateStr) return '—';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          // DD-MM-YYYY
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
      } catch (e) {
        return dateStr;
      }
    },

    /**
     * Add days to an ISO date string
     */
    addDays(dateStr, days) {
      if (!dateStr) {
        dateStr = new Date().toISOString().substring(0, 10);
      }
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + parseInt(days, 10));
      return d.toISOString().substring(0, 10);
    },

    /**
     * Determines whether transaction is Inter-State (IGST) or Intra-State (CGST + SGST)
     * Default home state is Karnataka (29).
     */
    isInterState(placeOfSupply, homeState = 'Karnataka (29)') {
      if (!placeOfSupply) return false;
      const pos = String(placeOfSupply).toLowerCase().trim();
      const home = String(homeState).toLowerCase().trim();

      // If place of supply contains karnataka or code 29
      if (pos.includes('karnataka') || pos.includes('29')) {
        return false;
      }
      return true;
    },

    /**
     * Compute single line item values according to GST standards
     */
    computeGSTLineItem(item, isInterState = false) {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const grossAmount = Math.round(qty * rate * 100) / 100;

      // Dynamic Discount: either 'percent' or 'amount'
      const discountType = item.discountType || 'percent'; // 'percent' or 'amount'
      const discountVal = parseFloat(item.discount) || 0;
      let discountAmount = 0;

      if (discountType === 'amount') {
        discountAmount = Math.min(grossAmount, discountVal);
      } else {
        discountAmount = Math.round(grossAmount * (discountVal / 100) * 100) / 100;
      }

      const taxableAmount = Math.max(0, Math.round((grossAmount - discountAmount) * 100) / 100);
      const taxRate = parseFloat(item.taxRate) || 18.0;

      let cgstRate = 0, cgstAmount = 0;
      let sgstRate = 0, sgstAmount = 0;
      let igstRate = 0, igstAmount = 0;

      if (isInterState) {
        igstRate = taxRate;
        igstAmount = Math.round(taxableAmount * (igstRate / 100) * 100) / 100;
      } else {
        cgstRate = taxRate / 2;
        cgstAmount = Math.round(taxableAmount * (cgstRate / 100) * 100) / 100;
        sgstRate = taxRate / 2;
        sgstAmount = Math.round(taxableAmount * (sgstRate / 100) * 100) / 100;
      }

      const totalLineAmount = Math.round((taxableAmount + cgstAmount + sgstAmount + igstAmount) * 100) / 100;

      return {
        grossAmount,
        discountType,
        discountVal,
        discountAmount,
        taxableAmount,
        taxRate,
        isInterState,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalLineAmount
      };
    },

    /**
     * Compute full GST document totals
     */
    computeGSTDocumentTotals(items = [], isInterState = false, adjustment = 0) {
      let subTotalGross = 0;
      let totalDiscount = 0;
      let totalTaxable = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let subTotalFinal = 0;

      const calculatedItems = items.map(item => {
        const calc = this.computeGSTLineItem(item, isInterState);
        subTotalGross += calc.grossAmount;
        totalDiscount += calc.discountAmount;
        totalTaxable += calc.taxableAmount;
        totalCGST += calc.cgstAmount;
        totalSGST += calc.sgstAmount;
        totalIGST += calc.igstAmount;
        subTotalFinal += calc.totalLineAmount;
        return { ...item, ...calc };
      });

      const adj = parseFloat(adjustment) || 0;
      const rawGrandTotal = subTotalFinal + adj;
      const roundedTotal = Math.round(rawGrandTotal);
      const rounding = Math.round((roundedTotal - rawGrandTotal) * 100) / 100;

      return {
        items: calculatedItems,
        isInterState,
        subTotalGross: Math.round(subTotalGross * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalCGST: Math.round(totalCGST * 100) / 100,
        totalSGST: Math.round(totalSGST * 100) / 100,
        totalIGST: Math.round(totalIGST * 100) / 100,
        subTotalFinal: Math.round(subTotalFinal * 100) / 100,
        rounding,
        roundedTotal,
        totalInWords: this.numberToIndianWords(roundedTotal)
      };
    },

    /**
     * Convert Number to Indian Rupee Words (Lakhs, Crores, Thousands)
     * e.g. 472336 -> "Indian Rupee Four Lakh Seventy-Two Thousand Three Hundred Thirty-Six Only"
     */
    numberToIndianWords(num) {
      if (typeof num !== 'number') num = parseFloat(num) || 0;
      if (num === 0) return 'Indian Rupee Zero Only';

      const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
      ];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

      function inWords(n) {
        if (n < 20) return a[n];
        const digit = n % 10;
        return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
      }

      function convertChunk(n) {
        let str = '';
        if (n >= 100) {
          str += a[Math.floor(n / 100)] + ' Hundred ';
          n %= 100;
        }
        if (n > 0) {
          str += inWords(n) + ' ';
        }
        return str;
      }

      const parts = num.toFixed(2).split('.');
      let integerPart = parseInt(parts[0], 10);
      const decimalPart = parseInt(parts[1], 10);

      let words = '';

      // Crores (>= 1,00,00,000)
      if (integerPart >= 10000000) {
        words += convertChunk(Math.floor(integerPart / 10000000)) + 'Crore ';
        integerPart %= 10000000;
      }

      // Lakhs (>= 1,00,000)
      if (integerPart >= 100000) {
        words += convertChunk(Math.floor(integerPart / 100000)) + 'Lakh ';
        integerPart %= 100000;
      }

      // Thousands (>= 1,000)
      if (integerPart >= 1000) {
        words += convertChunk(Math.floor(integerPart / 1000)) + 'Thousand ';
        integerPart %= 1000;
      }

      // Hundreds and below
      if (integerPart > 0) {
        words += convertChunk(integerPart);
      }

      words = words.trim();
      let result = 'Indian Rupee ' + words;

      if (decimalPart > 0) {
        result += ' and ' + convertChunk(decimalPart).trim() + ' Paise';
      }

      return result + ' Only';
    },

    /**
     * Compute Receivables & Aging Buckets for Invoices
     */
    computeAging(invoices = []) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalReceivables = 0;
      let currentReceivables = 0;
      let overdueReceivables = 0;
      let totalReceived = 0;

      const buckets = {
        current: 0,
        days1_15: 0,
        days16_30: 0,
        days31_45: 0,
        daysAbove45: 0
      };

      invoices.forEach(inv => {
        totalReceived += (inv.amountPaid || 0);

        if (inv.status === 'void' || inv.status === 'draft') return;

        const balance = inv.balanceDue != null ? inv.balanceDue : (inv.total - (inv.amountPaid || 0));
        if (balance <= 0) return;

        totalReceivables += balance;

        const dueDateParts = inv.dueDate ? inv.dueDate.split('-') : null;
        if (!dueDateParts) {
          currentReceivables += balance;
          buckets.current += balance;
          return;
        }

        const due = new Date(dueDateParts[0], dueDateParts[1] - 1, dueDateParts[2]);
        const diffMs = today.getTime() - due.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          currentReceivables += balance;
          buckets.current += balance;
        } else {
          overdueReceivables += balance;
          if (diffDays <= 15) {
            buckets.days1_15 += balance;
          } else if (diffDays <= 30) {
            buckets.days16_30 += balance;
          } else if (diffDays <= 45) {
            buckets.days31_45 += balance;
          } else {
            buckets.daysAbove45 += balance;
          }
        }
      });

      return {
        totalReceivables,
        currentReceivables,
        overdueReceivables,
        totalReceived,
        buckets
      };
    }
  };

  window.Calculator = Calculator;

})(window);
