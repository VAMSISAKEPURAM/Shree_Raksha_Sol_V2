"""
SHREERAKSHA SOLUTIONS - FLASK BACKEND API & SERVER
Directly connects Web Application to MySQL Database (shreeraksha_db)
Provides real-time CRUD and dashboard financial calculations.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymysql
import pymysql.cursors
import decimal
import datetime
import os
import json

# Load optional .env file if present
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', '127.0.0.1'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'Vamsi@232'),
    'database': os.environ.get('DB_NAME', 'shreeraksha_db'),
    'charset': 'utf8mb4',
    'autocommit': True,
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

def clean_record(row):
    """Convert dates, decimals, and byte types into JSON-serializable primitives."""
    if not row:
        return row
    cleaned = {}
    for k, v in row.items():
        if isinstance(v, (datetime.date, datetime.datetime)):
            cleaned[k] = v.isoformat()
        elif isinstance(v, decimal.Decimal):
            cleaned[k] = float(v)
        elif isinstance(v, bytes):
            cleaned[k] = v.decode('utf-8', errors='ignore')
        else:
            cleaned[k] = v
    return cleaned

def clean_records(rows):
    return [clean_record(r) for r in rows]

# ==========================================
# STATIC FRONTEND ROUTES
# ==========================================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

# ==========================================
# HEALTH & METRICS
# ==========================================

@app.route('/api/status', methods=['GET'])
def api_status():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT VERSION() AS version, DATABASE() AS db;")
        info = cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({
            'status': 'connected',
            'database': info['db'],
            'mysql_version': info['version']
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==========================================
# FULL REHYDRATION STORE: /api/data
# ==========================================

@app.route('/api/data', methods=['GET'])
def get_full_data():
    """Returns complete business data structure from MySQL matching window.AppStore format."""
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # 1. Organization
        cur.execute("SELECT * FROM organization_settings WHERE id = 'default' LIMIT 1")
        org_row = cur.fetchone()
        org = clean_record(org_row) if org_row else {}
        if org:
            # Format camelCase mappings expected by frontend
            org['legalName'] = org.get('legal_name', '')
            org['taxId'] = org.get('tax_id', '')
            org['msmeRegNo'] = org.get('msme_reg_no', '')
            org['currencySymbol'] = org.get('currency_symbol', '₹')
            org['themeColor'] = org.get('theme_color', 'zoho')
            org['invoicePrefix'] = org.get('invoice_prefix', 'SHRKS/Inv/26-27/')
            org['estimatePrefix'] = org.get('estimate_prefix', 'SHRKS/Qtn/26-27/')
            org['poPrefix'] = org.get('po_prefix', 'SHRKS/PO/26-27/')
            org['creditNotePrefix'] = org.get('credit_note_prefix', 'SHRKS/CN/26-27/')
            org['debitNotePrefix'] = org.get('debit_note_prefix', 'SHRKS/DN/26-27/')
            org['defaultPaymentTerms'] = org.get('default_payment_terms', '30 Days net')
            org['bankName'] = org.get('bank_name') or 'State Bank of India'
            org['accountName'] = org.get('account_name') or 'SHREERAKSHA SOLUTIONS'
            org['accountNumber'] = org.get('account_number') or '45666081503'
            org['ifscCode'] = org.get('ifsc_code') or 'SBIN0016869'
            org['branch'] = org.get('branch') or 'PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi'
            org['micrCode'] = org.get('micr_code') or '576002012'
            org['defaultNotes'] = org.get('default_notes', '')
            org['defaultTerms'] = org.get('default_terms', '')
            org['bankDetails'] = org.get('bank_details') or f"{org['bankName']}\nA/C: {org['accountNumber']}\nIFSC: {org['ifscCode']}\nBranch: {org['branch']}\nMICR: {org['micrCode']}"

        # 2. Taxes
        cur.execute("SELECT id, name, rate FROM taxes ORDER BY rate ASC")
        taxes = clean_records(cur.fetchall())

        # 3. Items
        cur.execute("SELECT id, name, item_type AS itemType, hsn_code AS hsnCode, sac_code AS sacCode, sku, rate, unit, tax_rate AS taxRate, tax_rate_id AS taxRateId, description FROM items ORDER BY name ASC")
        items = clean_records(cur.fetchall())

        # 4. Parties (Customers & Vendors) with Contacts
        cur.execute("SELECT id, category, name, company, attention, is_vendor AS isVendor, email, phone, tax_id AS taxId, place_of_supply AS placeOfSupply, currency, billing_address AS billingAddress, shipping_address AS shippingAddress, payment_terms AS paymentTerms, notes FROM parties ORDER BY name ASC")
        parties = clean_records(cur.fetchall())
        for p in parties:
            cur.execute("SELECT name, designation, email, phone, is_primary AS isPrimary FROM party_contacts WHERE party_id = %s ORDER BY sort_order ASC, id ASC", (p['id'],))
            p['contactPersons'] = clean_records(cur.fetchall())
            p['isVendor'] = bool(p.get('isVendor') or p.get('category') == 'vendor')

        # 5. Estimates (Quotations)
        cur.execute("SELECT id, number, customer_id AS customerId, attention, date, expiry_date AS expiryDate, place_of_supply AS placeOfSupply, status, reference, payment_terms AS paymentTerms, subtotal, discount_total AS discountTotal, taxable_amount AS taxableAmount, cgst_amount AS cgstAmount, sgst_amount AS sgstAmount, igst_amount AS igstAmount, tax_total AS taxTotal, round_off AS roundOff, total, notes, terms FROM estimates ORDER BY date DESC, id DESC")
        estimates = clean_records(cur.fetchall())
        for e in estimates:
            cur.execute("SELECT item_id AS itemId, name, description, item_type AS itemType, hsn_code AS hsnCode, sac_code AS sacCode, quantity, unit, rate, discount_type AS discountType, discount, tax_rate AS taxRate, taxable_amount AS taxableAmount, tax_amount AS taxAmount, total FROM estimate_items WHERE estimate_id = %s ORDER BY sort_order ASC, id ASC", (e['id'],))
            e['items'] = clean_records(cur.fetchall())

        # 6. Invoices
        cur.execute("SELECT id, number, customer_id AS customerId, attention, date, due_date AS dueDate, place_of_supply AS placeOfSupply, payment_terms AS paymentTerms, status, subtotal, discount_total AS discountTotal, taxable_amount AS taxableAmount, cgst_amount AS cgstAmount, sgst_amount AS sgstAmount, igst_amount AS igstAmount, tax_total AS taxTotal, round_off AS roundOff, total, amount_paid AS amountPaid, balance_due AS balanceDue, notes, terms FROM invoices ORDER BY date DESC, id DESC")
        invoices = clean_records(cur.fetchall())
        for inv in invoices:
            cur.execute("SELECT item_id AS itemId, name, description, item_type AS itemType, hsn_code AS hsnCode, sac_code AS sacCode, quantity, unit, rate, discount_type AS discountType, discount, tax_rate AS taxRate, taxable_amount AS taxableAmount, tax_amount AS taxAmount, total FROM invoice_items WHERE invoice_id = %s ORDER BY sort_order ASC, id ASC", (inv['id'],))
            inv['items'] = clean_records(cur.fetchall())

        # 7. Payments
        cur.execute("SELECT id, payment_number AS paymentNumber, date, customer_id AS customerId, invoice_id AS invoiceId, invoice_number AS invoiceNumber, amount, mode, reference, notes FROM payments ORDER BY date DESC, id DESC")
        payments = clean_records(cur.fetchall())

        # 8. Purchase Orders
        cur.execute("SELECT id, number, vendor_id AS vendorId, attention, date, due_date AS dueDate, place_of_supply AS placeOfSupply, status, reference, payment_terms AS paymentTerms, subtotal, discount_total AS discountTotal, taxable_amount AS taxableAmount, cgst_amount AS cgstAmount, sgst_amount AS sgstAmount, igst_amount AS igstAmount, tax_total AS taxTotal, round_off AS roundOff, total, notes, terms FROM purchase_orders ORDER BY date DESC, id DESC")
        pos = clean_records(cur.fetchall())
        for po in pos:
            cur.execute("SELECT item_id AS itemId, name, description, item_type AS itemType, hsn_code AS hsnCode, sac_code AS sacCode, quantity, unit, rate, discount_type AS discountType, discount, tax_rate AS taxRate, taxable_amount AS taxableAmount, tax_amount AS taxAmount, total FROM purchase_order_items WHERE po_id = %s ORDER BY sort_order ASC, id ASC", (po['id'],))
            po['items'] = clean_records(cur.fetchall())

        # 9. Debit & Credit Notes
        cur.execute("SELECT id, number, doc_type AS docType, party_type AS partyType, party_id AS partyId, attention, date, original_invoice_number AS originalInvoiceNumber, place_of_supply AS placeOfSupply, status, reason, subtotal, discount_total AS discountTotal, taxable_amount AS taxableAmount, cgst_amount AS cgstAmount, sgst_amount AS sgstAmount, igst_amount AS igstAmount, tax_total AS taxTotal, round_off AS roundOff, total, notes FROM debit_credit_notes ORDER BY date DESC, id DESC")
        notes = clean_records(cur.fetchall())
        for n in notes:
            cur.execute("SELECT item_id AS itemId, name, description, item_type AS itemType, hsn_code AS hsnCode, sac_code AS sacCode, quantity, unit, rate, discount_type AS discountType, discount, tax_rate AS taxRate, taxable_amount AS taxableAmount, tax_amount AS taxAmount, total FROM note_items WHERE note_id = %s ORDER BY sort_order ASC, id ASC", (n['id'],))
            n['items'] = clean_records(cur.fetchall())
            if n.get('partyType') == 'customer':
                n['customerId'] = n.get('partyId')
            else:
                n['vendorId'] = n.get('partyId')

        # 10. Expenses
        cur.execute("SELECT id, date, category, amount, vendor, customer_id AS customerId, billable, status, notes FROM expenses ORDER BY date DESC, id DESC")
        expenses = clean_records(cur.fetchall())
        for exp in expenses:
            exp['billable'] = bool(exp.get('billable'))

        # 11. Recurring Profiles
        cur.execute("SELECT id, profile_name AS profileName, customer_id AS customerId, repeat_every AS repeatEvery, start_date AS startDate, next_run_date AS nextRunDate, status, subtotal, total FROM recurring_profiles ORDER BY next_run_date ASC")
        recurring = clean_records(cur.fetchall())
        for r in recurring:
            cur.execute("SELECT item_id AS itemId, name, description, quantity, rate, discount, tax_rate_id AS taxRateId, amount FROM recurring_profile_items WHERE profile_id = %s", (r['id'],))
            r['items'] = clean_records(cur.fetchall())

        # 12. Projects & Timesheets
        cur.execute("SELECT id, name, customer_id AS customerId, billing_method AS billingMethod, rate_per_hour AS ratePerHour, status FROM projects ORDER BY name ASC")
        projects = clean_records(cur.fetchall())
        for pr in projects:
            cur.execute("SELECT id, name, budget_hours AS budgetHours FROM project_tasks WHERE project_id = %s", (pr['id'],))
            pr['tasks'] = clean_records(cur.fetchall())

        cur.execute("SELECT id, project_id AS projectId, task_id AS taskId, date, hours, notes FROM timesheets ORDER BY date DESC")
        timesheets = clean_records(cur.fetchall())

        # 13. Activities
        cur.execute("SELECT id, text, time FROM activities ORDER BY created_at DESC LIMIT 50")
        activities = clean_records(cur.fetchall())

        cur.close()
        conn.close()

        return jsonify({
            'organization': org,
            'taxes': taxes,
            'items': items,
            'customers': parties,
            'estimates': estimates,
            'invoices': invoices,
            'purchaseOrders': pos,
            'debitCreditNotes': notes,
            'recurring': recurring,
            'payments': payments,
            'expenses': expenses,
            'projects': projects,
            'timesheets': timesheets,
            'activities': activities
        })
    except Exception as e:
        if conn: conn.close()
        return jsonify({
            'offline': True,
            'status': 'offline',
            'message': f'MySQL database not connected: {e}'
        }), 200

# ==========================================
# DASHBOARD REAL-TIME METRICS: /api/dashboard
# ==========================================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_metrics():
    """Calculates all financial aggregates directly using SQL queries."""
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Revenue from non-void invoices
        cur.execute("SELECT COALESCE(SUM(total), 0) AS total_revenue FROM invoices WHERE status != 'void'")
        total_revenue = float(cur.fetchone()['total_revenue'])

        # Total expenses
        cur.execute("SELECT COALESCE(SUM(amount), 0) AS total_expenses, COUNT(*) AS count FROM expenses")
        exp_res = cur.fetchone()
        total_expenses = float(exp_res['total_expenses'])
        expenses_count = int(exp_res['count'])

        # Net Profit
        net_profit = total_revenue - total_expenses

        # Receivables & Overdue
        cur.execute("""
            SELECT 
                COALESCE(SUM(balance_due), 0) AS total_receivables,
                COALESCE(SUM(amount_paid), 0) AS total_received,
                COALESCE(SUM(CASE WHEN due_date < CURDATE() AND balance_due > 0 THEN balance_due ELSE 0 END), 0) AS overdue_receivables,
                COALESCE(SUM(CASE WHEN due_date >= CURDATE() AND balance_due > 0 THEN balance_due ELSE 0 END), 0) AS current_receivables,
                COUNT(CASE WHEN due_date < CURDATE() AND balance_due > 0 THEN 1 END) AS overdue_count
            FROM invoices
            WHERE status != 'void'
        """)
        rec_metrics = cur.fetchone()

        # Aging breakdown buckets
        cur.execute("""
            SELECT
                COALESCE(SUM(CASE WHEN due_date >= CURDATE() THEN balance_due ELSE 0 END), 0) AS bucket_current,
                COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 1 AND 15 THEN balance_due ELSE 0 END), 0) AS bucket_1_15,
                COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 16 AND 30 THEN balance_due ELSE 0 END), 0) AS bucket_16_30,
                COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 45 THEN balance_due ELSE 0 END), 0) AS bucket_31_45,
                COALESCE(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 45 THEN balance_due ELSE 0 END), 0) AS bucket_over_45
            FROM invoices
            WHERE status != 'void' AND balance_due > 0
        """)
        buckets = cur.fetchone()

        # Recent 5 invoices
        cur.execute("""
            SELECT i.id, i.number, i.date, i.due_date AS dueDate, i.total, i.balance_due AS balanceDue, i.status, p.name AS customerName
            FROM invoices i
            LEFT JOIN parties p ON i.customer_id = p.id
            ORDER BY i.date DESC, i.id DESC
            LIMIT 5
        """)
        recent_invoices = clean_records(cur.fetchall())

        # Recent activities
        cur.execute("SELECT id, text, time FROM activities ORDER BY created_at DESC LIMIT 5")
        recent_activities = clean_records(cur.fetchall())

        cur.close()
        conn.close()

        return jsonify({
            'totalRevenue': total_revenue,
            'totalExpenses': total_expenses,
            'expensesCount': expenses_count,
            'netProfit': net_profit,
            'totalReceivables': float(rec_metrics['total_receivables']),
            'totalReceived': float(rec_metrics['total_received']),
            'overdueReceivables': float(rec_metrics['overdue_receivables']),
            'currentReceivables': float(rec_metrics['current_receivables']),
            'overdueCount': int(rec_metrics['overdue_count']),
            'agingBuckets': {
                'current': float(buckets['bucket_current']),
                'days1_15': float(buckets['bucket_1_15']),
                'days16_30': float(buckets['bucket_16_30']),
                'days31_45': float(buckets['bucket_31_45']),
                'daysOver45': float(buckets['bucket_over_45'])
            },
            'recentInvoices': recent_invoices,
            'recentActivities': recent_activities
        })
    except Exception as e:
        if conn: conn.close()
        return jsonify({'error': str(e)}), 500

# ==========================================
# CRUD OPERATIONS: CUSTOMERS & VENDORS (PARTIES)
# ==========================================

@app.route('/api/customers', methods=['POST'])
def save_party():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    party_id = data.get('id') or f"party-{int(datetime.datetime.now().timestamp()*1000)}"
    is_vendor = 1 if data.get('category') == 'vendor' or data.get('isVendor') else 0

    cur.execute("""
        INSERT INTO parties (
            id, category, name, company, attention, is_vendor, email, phone,
            tax_id, place_of_supply, currency, billing_address, shipping_address,
            payment_terms, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            category=VALUES(category), name=VALUES(name), company=VALUES(company),
            attention=VALUES(attention), is_vendor=VALUES(is_vendor), email=VALUES(email),
            phone=VALUES(phone), tax_id=VALUES(tax_id), place_of_supply=VALUES(place_of_supply),
            currency=VALUES(currency), billing_address=VALUES(billing_address),
            shipping_address=VALUES(shipping_address), payment_terms=VALUES(payment_terms),
            notes=VALUES(notes)
    """, (
        party_id, data.get('category', 'customer'), data.get('name'), data.get('company', data.get('name')),
        data.get('attention', ''), is_vendor, data.get('email', ''), data.get('phone', ''),
        data.get('taxId', data.get('gstin', '')), data.get('placeOfSupply', 'Karnataka (29)'),
        data.get('currency', 'INR'), data.get('billingAddress', data.get('address', '')),
        data.get('shippingAddress', ''), data.get('paymentTerms', '30 Days net'), data.get('notes', '')
    ))

    # Replace Contacts
    if 'contactPersons' in data and isinstance(data['contactPersons'], list):
        cur.execute("DELETE FROM party_contacts WHERE party_id = %s", (party_id,))
        for idx, cp in enumerate(data['contactPersons']):
            if cp.get('name'):
                cur.execute("""
                    INSERT INTO party_contacts (party_id, name, designation, email, phone, is_primary, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (party_id, cp.get('name'), cp.get('designation', ''), cp.get('email', ''), cp.get('phone', ''), 1 if idx==0 else 0, idx))

    # Log Activity
    action = 'Created' if not data.get('id') else 'Updated'
    party_type = 'Vendor' if is_vendor else 'Customer'
    cur.execute("INSERT INTO activities (id, text, time) VALUES (%s, %s, %s)", (
        f"act-{int(datetime.datetime.now().timestamp()*1000)}",
        f"{action} {party_type}: {data.get('name')}",
        datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    ))

    cur.close()
    conn.close()
    data['id'] = party_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/customers/<party_id>', methods=['DELETE'])
def delete_party(party_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM parties WHERE id = %s", (party_id,))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: ITEMS CATALOG
# ==========================================

@app.route('/api/items', methods=['POST'])
def save_item():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    item_id = data.get('id') or f"item-{int(datetime.datetime.now().timestamp()*1000)}"

    cur.execute("""
        INSERT INTO items (
            id, name, item_type, hsn_code, sac_code, sku, rate, unit, tax_rate, tax_rate_id, description
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name=VALUES(name), item_type=VALUES(item_type), hsn_code=VALUES(hsn_code),
            sac_code=VALUES(sac_code), sku=VALUES(sku), rate=VALUES(rate), unit=VALUES(unit),
            tax_rate=VALUES(tax_rate), tax_rate_id=VALUES(tax_rate_id), description=VALUES(description)
    """, (
        item_id, data.get('name'), data.get('itemType', 'product'), data.get('hsnCode', ''),
        data.get('sacCode', ''), data.get('sku', ''), float(data.get('rate') or 0),
        data.get('unit', 'nos'), float(data.get('taxRate') or 18.0), data.get('taxRateId', ''),
        data.get('description', '')
    ))

    cur.close()
    conn.close()
    data['id'] = item_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/items/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM items WHERE id = %s", (item_id,))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: ESTIMATES / QUOTATIONS
# ==========================================

@app.route('/api/estimates', methods=['POST'])
def save_estimate():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    est_id = data.get('id') or f"est-{int(datetime.datetime.now().timestamp()*1000)}"

    cur.execute("""
        INSERT INTO estimates (
            id, number, customer_id, attention, date, expiry_date, place_of_supply,
            status, reference, payment_terms, subtotal, discount_total, taxable_amount,
            cgst_amount, sgst_amount, igst_amount, tax_total, round_off, total, notes, terms
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            number=VALUES(number), customer_id=VALUES(customer_id), attention=VALUES(attention),
            date=VALUES(date), expiry_date=VALUES(expiry_date), place_of_supply=VALUES(place_of_supply),
            status=VALUES(status), reference=VALUES(reference), payment_terms=VALUES(payment_terms),
            subtotal=VALUES(subtotal), discount_total=VALUES(discount_total), taxable_amount=VALUES(taxable_amount),
            cgst_amount=VALUES(cgst_amount), sgst_amount=VALUES(sgst_amount), igst_amount=VALUES(igst_amount),
            tax_total=VALUES(tax_total), round_off=VALUES(round_off), total=VALUES(total),
            notes=VALUES(notes), terms=VALUES(terms)
    """, (
        est_id, data.get('number'), data.get('customerId'), data.get('attention', ''),
        data.get('date'), data.get('expiryDate'), data.get('placeOfSupply', 'Karnataka (29)'),
        data.get('status', 'draft'), data.get('reference', ''), data.get('paymentTerms', '30 Days net'),
        float(data.get('subtotal') or 0), float(data.get('discountTotal') or 0),
        float(data.get('taxableAmount') or 0), float(data.get('cgstAmount') or 0),
        float(data.get('sgstAmount') or 0), float(data.get('igstAmount') or 0),
        float(data.get('taxTotal') or 0), float(data.get('roundOff') or 0),
        float(data.get('total') or 0), data.get('notes', ''), data.get('terms', '')
    ))

    # Line Items
    cur.execute("DELETE FROM estimate_items WHERE estimate_id = %s", (est_id,))
    for idx, it in enumerate(data.get('items', [])):
        cur.execute("""
            INSERT INTO estimate_items (
                estimate_id, item_id, name, description, item_type, hsn_code, sac_code,
                quantity, unit, rate, discount_type, discount, tax_rate, taxable_amount, tax_amount, total, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            est_id, it.get('itemId', ''), it.get('name'), it.get('description', ''),
            it.get('itemType', 'product'), it.get('hsnCode', ''), it.get('sacCode', ''),
            float(it.get('quantity') or 1), it.get('unit', 'nos'), float(it.get('rate') or 0),
            it.get('discountType', 'percent'), float(it.get('discount') or 0), float(it.get('taxRate') or 18),
            float(it.get('taxableAmount') or 0), float(it.get('taxAmount') or 0), float(it.get('total') or 0), idx
        ))

    # Activity log
    cur.execute("INSERT INTO activities (id, text, time) VALUES (%s, %s, %s)", (
        f"act-{int(datetime.datetime.now().timestamp()*1000)}",
        f"Saved Quotation: {data.get('number')} (₹ {float(data.get('total') or 0):,.2f})",
        datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    ))

    cur.close()
    conn.close()
    data['id'] = est_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/estimates/<est_id>', methods=['DELETE'])
def delete_estimate(est_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM estimates WHERE id = %s", (est_id,))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: INVOICES
# ==========================================

@app.route('/api/invoices', methods=['POST'])
def save_invoice():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    inv_id = data.get('id') or f"inv-{int(datetime.datetime.now().timestamp()*1000)}"

    total = float(data.get('total') or 0)
    amount_paid = float(data.get('amountPaid') or 0)
    balance_due = float(data.get('balanceDue') if data.get('balanceDue') is not None else (total - amount_paid))

    cur.execute("""
        INSERT INTO invoices (
            id, number, customer_id, attention, date, due_date, place_of_supply,
            payment_terms, status, subtotal, discount_total, taxable_amount,
            cgst_amount, sgst_amount, igst_amount, tax_total, round_off, total,
            amount_paid, balance_due, notes, terms
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            number=VALUES(number), customer_id=VALUES(customer_id), attention=VALUES(attention),
            date=VALUES(date), due_date=VALUES(due_date), place_of_supply=VALUES(place_of_supply),
            payment_terms=VALUES(payment_terms), status=VALUES(status), subtotal=VALUES(subtotal),
            discount_total=VALUES(discount_total), taxable_amount=VALUES(taxable_amount),
            cgst_amount=VALUES(cgst_amount), sgst_amount=VALUES(sgst_amount), igst_amount=VALUES(igst_amount),
            tax_total=VALUES(tax_total), round_off=VALUES(round_off), total=VALUES(total),
            amount_paid=VALUES(amount_paid), balance_due=VALUES(balance_due),
            notes=VALUES(notes), terms=VALUES(terms)
    """, (
        inv_id, data.get('number'), data.get('customerId'), data.get('attention', ''),
        data.get('date'), data.get('dueDate'), data.get('placeOfSupply', 'Karnataka (29)'),
        data.get('paymentTerms', '30 Days net'), data.get('status', 'draft'),
        float(data.get('subtotal') or 0), float(data.get('discountTotal') or 0),
        float(data.get('taxableAmount') or 0), float(data.get('cgstAmount') or 0),
        float(data.get('sgstAmount') or 0), float(data.get('igstAmount') or 0),
        float(data.get('taxTotal') or 0), float(data.get('roundOff') or 0),
        total, amount_paid, balance_due, data.get('notes', ''), data.get('terms', '')
    ))

    # Line Items
    cur.execute("DELETE FROM invoice_items WHERE invoice_id = %s", (inv_id,))
    for idx, it in enumerate(data.get('items', [])):
        cur.execute("""
            INSERT INTO invoice_items (
                invoice_id, item_id, name, description, item_type, hsn_code, sac_code,
                quantity, unit, rate, discount_type, discount, tax_rate, taxable_amount, tax_amount, total, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            inv_id, it.get('itemId', ''), it.get('name'), it.get('description', ''),
            it.get('itemType', 'product'), it.get('hsnCode', ''), it.get('sacCode', ''),
            float(it.get('quantity') or 1), it.get('unit', 'nos'), float(it.get('rate') or 0),
            it.get('discountType', 'percent'), float(it.get('discount') or 0), float(it.get('taxRate') or 18),
            float(it.get('taxableAmount') or 0), float(it.get('taxAmount') or 0), float(it.get('total') or 0), idx
        ))

    # Activity log
    cur.execute("INSERT INTO activities (id, text, time) VALUES (%s, %s, %s)", (
        f"act-{int(datetime.datetime.now().timestamp()*1000)}",
        f"Tax Invoice {data.get('number')} created/updated for ₹ {total:,.2f}",
        datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    ))

    cur.close()
    conn.close()
    data['id'] = inv_id
    data['amountPaid'] = amount_paid
    data['balanceDue'] = balance_due
    return jsonify({'success': True, 'item': data})

@app.route('/api/invoices/<inv_id>', methods=['DELETE'])
def delete_invoice(inv_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM invoices WHERE id = %s", (inv_id,))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: PAYMENTS
# ==========================================

@app.route('/api/payments', methods=['POST'])
def save_payment():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    pay_id = data.get('id') or f"pay-{int(datetime.datetime.now().timestamp()*1000)}"
    amount = float(data.get('amount') or 0)

    cur.execute("""
        INSERT INTO payments (
            id, payment_number, date, customer_id, invoice_id, invoice_number,
            amount, mode, reference, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            date=VALUES(date), amount=VALUES(amount), mode=VALUES(mode),
            reference=VALUES(reference), notes=VALUES(notes)
    """, (
        pay_id, data.get('paymentNumber'), data.get('date'), data.get('customerId'),
        data.get('invoiceId'), data.get('invoiceNumber', ''), amount,
        data.get('mode', 'bank'), data.get('reference', ''), data.get('notes', '')
    ))

    # Recalculate invoice amount_paid & balance_due
    inv_id = data.get('invoiceId')
    if inv_id:
        cur.execute("SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE invoice_id = %s", (inv_id,))
        total_paid = float(cur.fetchone()['total_paid'])
        cur.execute("SELECT total FROM invoices WHERE id = %s", (inv_id,))
        inv_row = cur.fetchone()
        if inv_row:
            inv_total = float(inv_row['total'])
            new_bal = max(0.0, inv_total - total_paid)
            new_status = 'paid' if new_bal <= 0.01 else 'partially_paid'
            cur.execute("""
                UPDATE invoices SET amount_paid = %s, balance_due = %s, status = %s WHERE id = %s
            """, (total_paid, new_bal, new_status, inv_id))

    # Log activity
    cur.execute("INSERT INTO activities (id, text, time) VALUES (%s, %s, %s)", (
        f"act-{int(datetime.datetime.now().timestamp()*1000)}",
        f"Payment of ₹ {amount:,.2f} recorded for Invoice {data.get('invoiceNumber', '')}",
        datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    ))

    cur.close()
    conn.close()
    data['id'] = pay_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/payments/<pay_id>', methods=['DELETE'])
def delete_payment(pay_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT invoice_id FROM payments WHERE id = %s", (pay_id,))
    pay_row = cur.fetchone()
    cur.execute("DELETE FROM payments WHERE id = %s", (pay_id,))
    if pay_row and pay_row.get('invoice_id'):
        inv_id = pay_row['invoice_id']
        cur.execute("SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE invoice_id = %s", (inv_id,))
        total_paid = float(cur.fetchone()['total_paid'])
        cur.execute("SELECT total FROM invoices WHERE id = %s", (inv_id,))
        inv_row = cur.fetchone()
        if inv_row:
            inv_total = float(inv_row['total'])
            new_bal = max(0.0, inv_total - total_paid)
            new_status = 'paid' if new_bal <= 0.01 else ('partially_paid' if total_paid > 0 else 'sent')
            cur.execute("UPDATE invoices SET amount_paid = %s, balance_due = %s, status = %s WHERE id = %s", (total_paid, new_bal, new_status, inv_id))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: PURCHASE ORDERS
# ==========================================

@app.route('/api/purchaseOrders', methods=['POST'])
def save_po():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    po_id = data.get('id') or f"po-{int(datetime.datetime.now().timestamp()*1000)}"

    cur.execute("""
        INSERT INTO purchase_orders (
            id, number, vendor_id, attention, date, due_date, place_of_supply,
            status, reference, payment_terms, subtotal, discount_total, taxable_amount,
            cgst_amount, sgst_amount, igst_amount, tax_total, round_off, total, notes, terms
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            number=VALUES(number), vendor_id=VALUES(vendor_id), attention=VALUES(attention),
            date=VALUES(date), due_date=VALUES(due_date), place_of_supply=VALUES(place_of_supply),
            status=VALUES(status), reference=VALUES(reference), payment_terms=VALUES(payment_terms),
            subtotal=VALUES(subtotal), discount_total=VALUES(discount_total), taxable_amount=VALUES(taxable_amount),
            cgst_amount=VALUES(cgst_amount), sgst_amount=VALUES(sgst_amount), igst_amount=VALUES(igst_amount),
            tax_total=VALUES(tax_total), round_off=VALUES(round_off), total=VALUES(total),
            notes=VALUES(notes), terms=VALUES(terms)
    """, (
        po_id, data.get('number'), data.get('vendorId'), data.get('attention', ''),
        data.get('date'), data.get('dueDate'), data.get('placeOfSupply', 'Karnataka (29)'),
        data.get('status', 'draft'), data.get('reference', ''), data.get('paymentTerms', 'Net 30'),
        float(data.get('subtotal') or 0), float(data.get('discountTotal') or 0),
        float(data.get('taxableAmount') or 0), float(data.get('cgstAmount') or 0),
        float(data.get('sgstAmount') or 0), float(data.get('igstAmount') or 0),
        float(data.get('taxTotal') or 0), float(data.get('roundOff') or 0),
        float(data.get('total') or 0), data.get('notes', ''), data.get('terms', '')
    ))

    # PO Items
    cur.execute("DELETE FROM purchase_order_items WHERE po_id = %s", (po_id,))
    for idx, it in enumerate(data.get('items', [])):
        cur.execute("""
            INSERT INTO purchase_order_items (
                po_id, item_id, name, description, item_type, hsn_code, sac_code,
                quantity, unit, rate, discount_type, discount, tax_rate, taxable_amount, tax_amount, total, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            po_id, it.get('itemId', ''), it.get('name'), it.get('description', ''),
            it.get('itemType', 'product'), it.get('hsnCode', ''), it.get('sacCode', ''),
            float(it.get('quantity') or 1), it.get('unit', 'nos'), float(it.get('rate') or 0),
            it.get('discountType', 'percent'), float(it.get('discount') or 0), float(it.get('taxRate') or 18),
            float(it.get('taxableAmount') or 0), float(it.get('taxAmount') or 0), float(it.get('total') or 0), idx
        ))

    cur.close()
    conn.close()
    data['id'] = po_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/purchaseOrders/<po_id>', methods=['DELETE'])
def delete_po(po_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM purchase_orders WHERE id = %s", (po_id,))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: DEBIT & CREDIT NOTES
# ==========================================

@app.route('/api/debitCreditNotes', methods=['POST'])
def save_note():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    note_id = data.get('id') or f"note-{int(datetime.datetime.now().timestamp()*1000)}"
    party_id = data.get('partyId') or data.get('customerId') or data.get('vendorId')

    cur.execute("""
        INSERT INTO debit_credit_notes (
            id, number, doc_type, party_type, party_id, attention, date,
            original_invoice_number, place_of_supply, status, reason,
            subtotal, discount_total, taxable_amount, cgst_amount, sgst_amount,
            igst_amount, tax_total, round_off, total, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            number=VALUES(number), doc_type=VALUES(doc_type), party_type=VALUES(party_type),
            party_id=VALUES(party_id), attention=VALUES(attention), date=VALUES(date),
            original_invoice_number=VALUES(original_invoice_number), place_of_supply=VALUES(place_of_supply),
            status=VALUES(status), reason=VALUES(reason), subtotal=VALUES(subtotal),
            discount_total=VALUES(discount_total), taxable_amount=VALUES(taxable_amount),
            cgst_amount=VALUES(cgst_amount), sgst_amount=VALUES(sgst_amount), igst_amount=VALUES(igst_amount),
            tax_total=VALUES(tax_total), round_off=VALUES(round_off), total=VALUES(total), notes=VALUES(notes)
    """, (
        note_id, data.get('number'), data.get('docType', 'CREDIT NOTE'), data.get('partyType', 'customer'),
        party_id, data.get('attention', ''), data.get('date'),
        data.get('originalInvoiceNumber', ''), data.get('placeOfSupply', 'Karnataka (29)'),
        data.get('status', 'draft'), data.get('reason', ''),
        float(data.get('subtotal') or 0), float(data.get('discountTotal') or 0),
        float(data.get('taxableAmount') or 0), float(data.get('cgstAmount') or 0),
        float(data.get('sgstAmount') or 0), float(data.get('igstAmount') or 0),
        float(data.get('taxTotal') or 0), float(data.get('roundOff') or 0),
        float(data.get('total') or 0), data.get('notes', '')
    ))

    # Note Items
    cur.execute("DELETE FROM note_items WHERE note_id = %s", (note_id,))
    for idx, it in enumerate(data.get('items', [])):
        cur.execute("""
            INSERT INTO note_items (
                note_id, item_id, name, description, item_type, hsn_code, sac_code,
                quantity, unit, rate, discount_type, discount, tax_rate, taxable_amount, tax_amount, total, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            note_id, it.get('itemId', ''), it.get('name'), it.get('description', ''),
            it.get('itemType', 'product'), it.get('hsnCode', ''), it.get('sacCode', ''),
            float(it.get('quantity') or 1), it.get('unit', 'nos'), float(it.get('rate') or 0),
            it.get('discountType', 'percent'), float(it.get('discount') or 0), float(it.get('taxRate') or 18),
            float(it.get('taxableAmount') or 0), float(it.get('taxAmount') or 0), float(it.get('total') or 0), idx
        ))

    cur.close()
    conn.close()
    data['id'] = note_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/debitCreditNotes/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM debit_credit_notes WHERE id = %s", (note_id,))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: EXPENSES
# ==========================================

@app.route('/api/expenses', methods=['POST'])
def save_expense():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    exp_id = data.get('id') or f"exp-{int(datetime.datetime.now().timestamp()*1000)}"
    amount = float(data.get('amount') or 0)

    cur.execute("""
        INSERT INTO expenses (
            id, date, category, amount, vendor, customer_id, billable, status, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            date=VALUES(date), category=VALUES(category), amount=VALUES(amount),
            vendor=VALUES(vendor), customer_id=VALUES(customer_id),
            billable=VALUES(billable), status=VALUES(status), notes=VALUES(notes)
    """, (
        exp_id, data.get('date'), data.get('category'), amount, data.get('vendor'),
        data.get('customerId') or None, 1 if data.get('billable') else 0,
        data.get('status', 'unbilled'), data.get('notes', '')
    ))

    # Activity log
    cur.execute("INSERT INTO activities (id, text, time) VALUES (%s, %s, %s)", (
        f"act-{int(datetime.datetime.now().timestamp()*1000)}",
        f"Recorded {data.get('category')} Expense: ₹ {amount:,.2f} ({data.get('vendor')})",
        datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    ))

    cur.close()
    conn.close()
    data['id'] = exp_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/expenses/<exp_id>', methods=['DELETE'])
def delete_expense(exp_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM expenses WHERE id = %s", (exp_id,))
    cur.close()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# CRUD OPERATIONS: PROJECTS & TIMESHEETS
# ==========================================

@app.route('/api/projects', methods=['POST'])
def save_project():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    proj_id = data.get('id') or f"proj-{int(datetime.datetime.now().timestamp()*1000)}"

    cur.execute("""
        INSERT INTO projects (
            id, name, customer_id, billing_method, rate_per_hour, status
        ) VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name=VALUES(name), customer_id=VALUES(customer_id),
            billing_method=VALUES(billing_method), rate_per_hour=VALUES(rate_per_hour),
            status=VALUES(status)
    """, (
        proj_id, data.get('name'), data.get('customerId'),
        data.get('billingMethod', 'hourly'), float(data.get('ratePerHour') or 0),
        data.get('status', 'active')
    ))

    # Tasks
    if 'tasks' in data and isinstance(data['tasks'], list):
        cur.execute("DELETE FROM project_tasks WHERE project_id = %s", (proj_id,))
        for t in data['tasks']:
            tid = t.get('id') or f"task-{int(datetime.datetime.now().timestamp()*1000)}"
            cur.execute("""
                INSERT INTO project_tasks (id, project_id, name, budget_hours)
                VALUES (%s, %s, %s, %s)
            """, (tid, proj_id, t.get('name'), float(t.get('budgetHours') or 0)))

    cur.close()
    conn.close()
    data['id'] = proj_id
    return jsonify({'success': True, 'item': data})

@app.route('/api/timesheets', methods=['POST'])
def save_timesheet():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    time_id = data.get('id') or f"time-{int(datetime.datetime.now().timestamp()*1000)}"

    cur.execute("""
        INSERT INTO timesheets (id, project_id, task_id, date, hours, notes)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            project_id=VALUES(project_id), task_id=VALUES(task_id),
            date=VALUES(date), hours=VALUES(hours), notes=VALUES(notes)
    """, (
        time_id, data.get('projectId'), data.get('taskId'), data.get('date'),
        float(data.get('hours') or 0), data.get('notes', '')
    ))

    cur.close()
    conn.close()
    data['id'] = time_id
    return jsonify({'success': True, 'item': data})

# ==========================================
# CRUD OPERATIONS: RECURRING PROFILES
# ==========================================

@app.route('/api/recurring', methods=['POST'])
def save_recurring():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    rec_id = data.get('id') or f"rec-{int(datetime.datetime.now().timestamp()*1000)}"

    cur.execute("""
        INSERT INTO recurring_profiles (
            id, profile_name, customer_id, repeat_every, start_date, next_run_date, status, subtotal, total
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            profile_name=VALUES(profile_name), customer_id=VALUES(customer_id),
            repeat_every=VALUES(repeat_every), start_date=VALUES(start_date),
            next_run_date=VALUES(next_run_date), status=VALUES(status),
            subtotal=VALUES(subtotal), total=VALUES(total)
    """, (
        rec_id, data.get('profileName'), data.get('customerId'), data.get('repeatEvery', 'month'),
        data.get('startDate'), data.get('nextRunDate'), data.get('status', 'active'),
        float(data.get('subtotal') or 0), float(data.get('total') or 0)
    ))

    # Items
    cur.execute("DELETE FROM recurring_profile_items WHERE profile_id = %s", (rec_id,))
    for it in data.get('items', []):
        cur.execute("""
            INSERT INTO recurring_profile_items (profile_id, item_id, name, description, quantity, rate, discount, tax_rate_id, amount)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            rec_id, it.get('itemId', ''), it.get('name', ''), it.get('description', ''),
            float(it.get('quantity') or 1), float(it.get('rate') or 0), float(it.get('discount') or 0),
            it.get('taxRateId', ''), float(it.get('amount') or 0)
        ))

    cur.close()
    conn.close()
    data['id'] = rec_id
    return jsonify({'success': True, 'item': data})

# ==========================================
# SETTINGS & TAXES
# ==========================================

@app.route('/api/settings', methods=['POST'])
def update_settings():
    data = request.json
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE organization_settings SET
            name = COALESCE(%s, name),
            legal_name = COALESCE(%s, legal_name),
            tax_id = COALESCE(%s, tax_id),
            email = COALESCE(%s, email),
            phone = COALESCE(%s, phone),
            website = COALESCE(%s, website),
            address = COALESCE(%s, address),
            currency = COALESCE(%s, currency),
            currency_symbol = COALESCE(%s, currency_symbol),
            theme_color = COALESCE(%s, theme_color),
            bank_name = COALESCE(%s, bank_name),
            account_name = COALESCE(%s, account_name),
            account_number = COALESCE(%s, account_number),
            ifsc_code = COALESCE(%s, ifsc_code),
            branch = COALESCE(%s, branch),
            micr_code = COALESCE(%s, micr_code),
            bank_details = COALESCE(%s, bank_details)
        WHERE id = 'default'
    """, (
        data.get('name'), data.get('legalName'), data.get('taxId'), data.get('email'),
        data.get('phone'), data.get('website'), data.get('address'), data.get('currency'),
        data.get('currencySymbol'), data.get('themeColor'), data.get('bankName'),
        data.get('accountName'), data.get('accountNumber'), data.get('ifscCode'),
        data.get('branch'), data.get('micrCode'), data.get('bankDetails')
    ))

    cur.close()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/taxes', methods=['POST'])
def save_tax():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    tid = data.get('id') or f"tax-{int(float(data.get('rate') or 0))}"
    cur.execute("""
        INSERT INTO taxes (id, name, rate) VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE name=VALUES(name), rate=VALUES(rate)
    """, (tid, data.get('name'), float(data.get('rate') or 0)))
    cur.close()
    conn.close()
    data['id'] = tid
    return jsonify({'success': True, 'item': data})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print("=" * 65)
    print("      SHREERAKSHA SOLUTIONS - GST BILLING & MANAGEMENT SUITE")
    print(f"      Web Application URL: http://127.0.0.1:{port}")
    print("=" * 65)

    # Pre-check database connection
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT DATABASE() AS db, VERSION() AS ver")
        info = cur.fetchone()
        cur.close()
        conn.close()
        print(f" [*] MySQL Database Connected: '{info.get('db')}' (v{info.get('ver')})")
    except Exception as e:
        print(f" [!] MySQL Notice: Database connection unavailable ({e})")
        print(" [i] Running smoothly in browser standalone mode with local storage.")
        print(" [i] (To sync with MySQL, ensure the Windows MySQL service is started: net start MYSQL80)")

    print("-" * 65)
    print(" Press CTRL+C to quit this server.")
    print("-" * 65)
    app.run(host='127.0.0.1', port=port, debug=False)
