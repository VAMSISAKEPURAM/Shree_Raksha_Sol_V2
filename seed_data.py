"""
Seed script to populate MySQL database 'shreeraksha_db' with Shreeraksha Solutions default data.
"""
import pymysql
import json
import os

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'Vamsi@232',
    'database': 'shreeraksha_db',
    'charset': 'utf8mb4',
    'autocommit': True,
    'cursorclass': pymysql.cursors.DictCursor
}

def seed():
    conn = pymysql.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("Connected to MySQL. Starting seed insertion...")

    # 1. Organization Settings
    cur.execute("""
    INSERT INTO organization_settings (
        id, name, legal_name, tax_id, msme_reg_no, email, phone, website,
        address, state, currency, currency_symbol, logo, theme_color,
        invoice_prefix, estimate_prefix, po_prefix, credit_note_prefix, debit_note_prefix,
        default_payment_terms, bank_name, account_name, account_number, ifsc_code, branch, micr_code,
        default_notes, default_terms
    ) VALUES (
        'default',
        'SHREERAKSHA SOLUTIONS',
        'Shreeraksha Solutions',
        '29FEAPS4448D1ZA',
        'UDYAM-KR-11-0087041',
        'connect@shreeraksha.in',
        '+91 9880 54 99 55 / +91 96636 91509',
        'www.shreeraksha.in',
        '5-68, Mulliya Mata House, Ajjavara Post, Sulya\\nDakshina Kannada - 574 239, Karnataka, India',
        'Karnataka (29)',
        'INR',
        '₹',
        'assets/shreeraksha-logo.svg',
        'zoho',
        'SHRKS/Inv/26-27/',
        'SHRKS/Qtn/26-27/',
        'SHRKS/PO/26-27/',
        'SHRKS/CN/26-27/',
        'SHRKS/DN/26-27/',
        '30 Days net',
        'State Bank of India',
        'SHREERAKSHA SOLUTIONS',
        '45666081503',
        'SBIN0016869',
        'PARKALA - Bhoodara Tower Main Road, Parkala, Dist: Udupi',
        '576002012',
        'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
        '• Above prices are FOR Destination.\\n• Please mention our Estimate number on all future correspondence.\\n• Please share your valid GSTIN in your Purchase Order.\\n• Payment Terms: As agreed (30 Days net).\\n• In case of Refurbished requirement\\n  * The defective part need to be returned - against delivery.\\n• Delivery will be within 3-4 weeks from date of PO.\\n  * Goods indicated above in stock are accurate as of the quote date.\\n  * If goods are out of stock at the time of release of PO, standard lead time would apply.\\n• Payment will be 50% advance and balance against delivery.'
    ) ON DUPLICATE KEY UPDATE name=VALUES(name), bank_name=VALUES(bank_name), account_name=VALUES(account_name), account_number=VALUES(account_number), ifsc_code=VALUES(ifsc_code), branch=VALUES(branch), micr_code=VALUES(micr_code);
    """)

    # 2. Taxes
    taxes = [
        ('tax-18', 'GST 18%', 18.0),
        ('tax-12', 'GST 12%', 12.0),
        ('tax-5',  'GST 5%',  5.0),
        ('tax-28', 'GST 28%', 28.0),
        ('tax-0',  'Zero Tax 0%', 0.0)
    ]
    for tid, tname, trate in taxes:
        cur.execute("INSERT INTO taxes (id, name, rate) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE rate=VALUES(rate)", (tid, tname, trate))

    # 3. Items
    items = [
        ('item-1', 'ZODIAC C18', 'product', '90279090', '', 'ZOD-C18-250', 39286.00, 'nos', 18.0, 'tax-18', '250mmx4.6mm, 5µm'),
        ('item-2', 'ZODIAC C18', 'product', '90279090', '', 'ZOD-C18-150', 39286.00, 'nos', 18.0, 'tax-18', '150mmx4.6mm, 3.5µm'),
        ('item-3', 'Hypersil BDS C18', 'product', '90279090', '', 'HYP-BDS-250', 67778.00, 'nos', 18.0, 'tax-18', '250mm x 4.6mm, 5µm'),
        ('item-4', 'Chromatography Column Annual Calibration & Validation', 'service', '', '998313', 'SRV-CALIB-01', 25000.00, 'service', 18.0, 'tax-18', 'Onsite HPLC system calibration, resolution verification, and certificate issuance.'),
        ('item-5', 'HPLC Method Development & Resolution Optimization', 'service', '', '998319', 'SRV-METH-02', 45000.00, 'service', 18.0, 'tax-18', 'Custom mobile phase formulation, retention factor analysis, and peak purity report.')
    ]
    for it in items:
        cur.execute("""
            INSERT INTO items (id, name, item_type, hsn_code, sac_code, sku, rate, unit, tax_rate, tax_rate_id, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE rate=VALUES(rate), name=VALUES(name)
        """, it)

    # 4. Parties & Contacts
    parties = [
        (
            'cust-1', 'customer', 'Manipal Speciality Chemicals Pvt Ltd', 'Manipal Speciality Chemicals Pvt Ltd',
            'Mr. Sreekar Nayak', 0, 'sreekar.nayak@manipalspeciality.com', '+91 820 257 1200',
            '29AATCM4200G1ZD', 'Karnataka (29)', 'INR',
            '52/1A, Udayavani Building,Tile Factory Road, Manipal\nUdupi, Karnataka, India 576104',
            '52/1A, Udayavani Building,Tile Factory Road, Manipal\nUdupi, Karnataka, India 576104',
            '30 Days net', 'Kind Attention: Mr. Sreekar Nayak. Priority pharmaceutical delivery.'
        ),
        (
            'cust-2', 'customer', 'Sun Pharma Advanced Research Ltd', 'Sun Pharma Advanced Research Ltd',
            'Dr. Ananya Sharma', 0, 'procurement@sunpharma.res.in', '+91 22 6645 5600',
            '27AAACS1234D1Z2', 'Maharashtra (27)', 'INR',
            'Plot No 14, MIDC Industrial Area, Taloja\nNavi Mumbai, Maharashtra, India 410208',
            'Plot No 14, MIDC Industrial Area, Taloja\nNavi Mumbai, Maharashtra, India 410208',
            '30 Days net', 'Inter-state client. IGST applies automatically.'
        ),
        (
            'vend-1', 'vendor', 'Thermo Fisher Scientific India Pvt Ltd', 'Thermo Fisher Scientific India Pvt Ltd',
            'Mr. Rajesh Pillai', 1, 'orders.india@thermofisher.com', '+91 20 6626 7000',
            '27AAACT9921B1Z9', 'Maharashtra (27)', 'INR',
            'Godrej Millennium, 9 Koregaon Park Road\nPune, Maharashtra, India 411001',
            'Godrej Millennium, 9 Koregaon Park Road\nPune, Maharashtra, India 411001',
            'Net 30', 'Primary chromatography consumables vendor.'
        )
    ]
    for p in parties:
        cur.execute("""
            INSERT INTO parties (
                id, category, name, company, attention, is_vendor, email, phone,
                tax_id, place_of_supply, currency, billing_address, shipping_address,
                payment_terms, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE name=VALUES(name)
        """, p)

    # Contacts for Parties
    contacts = [
        ('cust-1', 'Mr. Sreekar Nayak', 'Procurement Manager', 'sreekar.nayak@manipalspeciality.com', '+91 820 257 1200', 1),
        ('cust-2', 'Dr. Ananya Sharma', 'R&D Director', 'procurement@sunpharma.res.in', '+91 22 6645 5600', 1),
        ('vend-1', 'Mr. Rajesh Pillai', 'Key Account Executive', 'orders.india@thermofisher.com', '+91 20 6626 7000', 1)
    ]
    for c in contacts:
        cur.execute("""
            INSERT INTO party_contacts (party_id, name, designation, email, phone, is_primary)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, c)

    # 5. Estimates & Items
    estimates = [
        (
            'est-019', 'SHRKS/Qtn/26-27/019', 'cust-1', 'Mr. Sreekar Nayak', '2026-10-03', '2026-12-31',
            'Karnataka (29)', 'accepted', '', '30 Days net',
            421074.00, 21053.70, 400020.30, 36001.83, 36001.83, 0.00, 72003.65, 0.05, 472024.00,
            'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
            '• Above prices are FOR Destination.\n• Please mention our Estimate number on all future correspondence.'
        ),
        (
            'est-020', 'SHRKS/Qtn/26-27/020', 'cust-2', 'Dr. Ananya Sharma', '2026-10-10', '2026-11-30',
            'Maharashtra (27)', 'sent', 'SUN-RFQ-9921', '30 Days net',
            185556.00, 8777.80, 176778.20, 0.00, 0.00, 31820.08, 31820.08, -0.28, 208598.00,
            'Inter-State supply to Maharashtra. Full 18% IGST is applicable as per GST regulations.',
            'Payment 30 Days Net from date of installation.'
        ),
        (
            'est-024', 'SHRKS/Qtn/26-27/024', 'cust-1', 'Mr. Sreekar Nayak', '2026-10-15', '2026-12-31',
            'Karnataka (29)', 'draft', 'PUR-RFQ-8840', '30 Days net',
            610000.00, 30500.00, 579500.00, 52155.00, 52155.00, 0.00, 104310.00, 0.00, 683810.00,
            'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
            '• Above prices are FOR Destination.\n• Payment Terms: As agreed (30 Days net).'
        )
    ]
    for e in estimates:
        cur.execute("""
            INSERT INTO estimates (
                id, number, customer_id, attention, date, expiry_date,
                place_of_supply, status, reference, payment_terms,
                subtotal, discount_total, taxable_amount, cgst_amount, sgst_amount, igst_amount,
                tax_total, round_off, total, notes, terms
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status=VALUES(status)
        """, e)

    estimate_items = [
        ('est-019', 'item-1', 'ZODIAC C18', '250mmx4.6mm, 5µm', 'product', '90279090', '', 6.00, "No's", 39286.00, 'percent', 5.00, 18.0, 223930.20, 40307.44, 264237.64, 1),
        ('est-019', 'item-2', 'ZODIAC C18', '150mmx4.6mm, 3.5µm', 'product', '90279090', '', 3.00, "No's", 39286.00, 'percent', 5.00, 18.0, 111965.10, 20153.72, 132118.82, 2),
        ('est-019', 'item-3', 'Hypersil BDS C18', '250mm x 4.6mm, 5µm', 'product', '90279090', '', 1.00, "No's", 67778.00, 'percent', 5.00, 18.0, 64389.10, 11590.04, 75979.14, 3),

        ('est-020', 'item-4', 'Chromatography Column Annual Calibration & Validation', 'Validation of 4 Waters Alliance HPLC Systems', 'service', '', '998313', 2.00, 'Service', 25000.00, 'amount', 2000.00, 18.0, 48000.00, 8640.00, 56640.00, 1),
        ('est-020', 'item-3', 'Hypersil BDS C18', '250mm x 4.6mm, 5µm', 'product', '90279090', '', 2.00, "No's", 67778.00, 'percent', 5.00, 18.0, 128778.20, 23180.08, 151958.28, 2),

        ('est-024', 'item-1', 'ZODIAC C18 Analytical Column', '250mm x 4.6mm, 5µm particle size', 'product', '90279090', '', 6.00, "No's", 39286.00, 'percent', 5.00, 18.0, 223930.20, 40307.44, 264237.64, 1),
        ('est-024', 'item-2', 'ZODIAC C18 Fast LC Column', '150mm x 4.6mm, 3.5µm', 'product', '90279090', '', 3.00, "No's", 39286.00, 'percent', 5.00, 18.0, 111965.10, 20153.72, 132118.82, 2)
    ]
    for ei in estimate_items:
        cur.execute("""
            INSERT INTO estimate_items (
                estimate_id, item_id, name, description, item_type, hsn_code, sac_code,
                quantity, unit, rate, discount_type, discount, tax_rate,
                taxable_amount, tax_amount, total, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, ei)

    # 6. Invoices & Items
    invoices = [
        (
            'inv-019', 'SHRKS/Inv/26-27/019', 'cust-1', 'Mr. Sreekar Nayak', '2026-10-04', '2026-11-03',
            'Karnataka (29)', '30 Days net', 'sent',
            421074.00, 21053.70, 400020.30, 36001.83, 36001.83, 0.00, 72003.65, 0.05, 472336.00,
            200000.00, 272336.00,
            'Order to be placed on "Shreeraksha Solutions" & Below Address mentioned',
            'Payment due within 30 days.'
        )
    ]
    for inv in invoices:
        cur.execute("""
            INSERT INTO invoices (
                id, number, customer_id, attention, date, due_date,
                place_of_supply, payment_terms, status,
                subtotal, discount_total, taxable_amount, cgst_amount, sgst_amount, igst_amount,
                tax_total, round_off, total, amount_paid, balance_due, notes, terms
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status=VALUES(status)
        """, inv)

    invoice_items = [
        ('inv-019', 'item-1', 'ZODIAC C18', '250mmx4.6mm, 5µm', 'product', '90279090', '', 6.00, "No's", 39286.00, 'percent', 5.00, 18.0, 223930.20, 40307.44, 264237.64, 1),
        ('inv-019', 'item-2', 'ZODIAC C18', '150mmx4.6mm, 3.5µm', 'product', '90279090', '', 3.00, "No's", 39286.00, 'percent', 5.00, 18.0, 111965.10, 20153.72, 132118.82, 2),
        ('inv-019', 'item-3', 'Hypersil BDS C18', '250mm x 4.6mm, 5µm', 'product', '90279090', '', 1.00, "No's", 67778.00, 'percent', 5.00, 18.0, 64389.10, 11590.04, 75979.14, 3)
    ]
    for ii in invoice_items:
        cur.execute("""
            INSERT INTO invoice_items (
                invoice_id, item_id, name, description, item_type, hsn_code, sac_code,
                quantity, unit, rate, discount_type, discount, tax_rate,
                taxable_amount, tax_amount, total, sort_order
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, ii)

    # 7. Payments
    cur.execute("""
        INSERT INTO payments (id, payment_number, date, customer_id, invoice_id, invoice_number, amount, mode, reference, notes)
        VALUES ('pay-001', 'PAY-000001', '2026-10-05', 'cust-1', 'inv-019', 'SHRKS/Inv/26-27/019', 200000.00, 'bank', 'SBI-NEFT-992104', 'Advance part payment received.')
        ON DUPLICATE KEY UPDATE amount=VALUES(amount)
    """)

    # 8. Purchase Orders & Items
    cur.execute("""
        INSERT INTO purchase_orders (
            id, number, vendor_id, attention, date, due_date, place_of_supply, status, reference, payment_terms,
            subtotal, discount_total, taxable_amount, cgst_amount, sgst_amount, igst_amount, tax_total, round_off, total, notes, terms
        ) VALUES (
            'po-005', 'SHRKS/PO/26-27/005', 'vend-1', 'Mr. Rajesh Pillai', '2026-10-02', '2026-10-25', 'Karnataka (29)', 'issued', 'INDENT-OCT-44', 'Net 30',
            185000.00, 18500.00, 166500.00, 0.00, 0.00, 29970.00, 29970.00, 0.00, 196470.00,
            'Please dispatch via Blue Dart Express to our Sulya address.',
            'Material subject to QC inspection upon delivery.'
        ) ON DUPLICATE KEY UPDATE status=VALUES(status)
    """)
    cur.execute("""
        INSERT INTO purchase_order_items (
            po_id, item_id, name, description, item_type, hsn_code, sac_code, quantity, unit, rate, discount_type, discount, tax_rate, taxable_amount, tax_amount, total
        ) VALUES (
            'po-005', 'item-1', 'ZODIAC C18 Raw Assemblies', 'Unpacked analytical column blanks (250mm)', 'product', '90279090', '', 10.00, "No's", 18500.00, 'percent', 10.00, 18.0, 166500.00, 29970.00, 196470.00
        )
    """)

    # 9. Debit / Credit Notes & Items
    notes = [
        (
            'note-001', 'SHRKS/CN/26-27/001', 'CREDIT NOTE', 'customer', 'cust-1', 'Mr. Sreekar Nayak', '2026-10-06', 'SHRKS/Inv/26-27/019', 'Karnataka (29)', 'approved',
            'Post-sales volume rebate and calibration discount',
            10000.00, 0.00, 10000.00, 900.00, 900.00, 0.00, 1800.00, 0.00, 11800.00,
            'Credit note value will be adjusted against Invoice SHRKS/Inv/26-27/019.'
        ),
        (
            'note-002', 'SHRKS/DN/26-27/002', 'DEBIT NOTE', 'vendor', 'vend-1', 'Mr. Rajesh Pillai', '2026-10-08', 'TH-INV-8910', 'Maharashtra (27)', 'approved',
            'Transit damage / defective return against PO SHRKS/PO/26-27/005',
            37000.00, 3700.00, 33300.00, 0.00, 0.00, 5994.00, 5994.00, 0.00, 39294.00,
            'Debit Note issued towards damaged goods rejected during incoming QC.'
        )
    ]
    for n in notes:
        cur.execute("""
            INSERT INTO debit_credit_notes (
                id, number, doc_type, party_type, party_id, attention, date, original_invoice_number, place_of_supply, status,
                reason, subtotal, discount_total, taxable_amount, cgst_amount, sgst_amount, igst_amount, tax_total, round_off, total, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status=VALUES(status)
        """, n)

    cur.execute("""
        INSERT INTO note_items (note_id, item_id, name, description, item_type, sac_code, quantity, unit, rate, discount_type, discount, tax_rate, taxable_amount, tax_amount, total)
        VALUES ('note-001', 'item-1', 'Volume Rebate on ZODIAC C18 Columns', 'Credit adjusted for Purchase Order bulk commitment', 'service', '998313', 1.00, 'Nos', 10000.00, 'amount', 0, 18.0, 10000.00, 1800.00, 11800.00)
    """)
    cur.execute("""
        INSERT INTO note_items (note_id, item_id, name, description, item_type, hsn_code, quantity, unit, rate, discount_type, discount, tax_rate, taxable_amount, tax_amount, total)
        VALUES ('note-002', 'item-1', 'Transit Damaged Column Blank Rejection', 'Damaged fittings returned via courier airway bill 882910', 'product', '90279090', 2.00, 'Nos', 18500.00, 'percent', 10.00, 18.0, 33300.00, 5994.00, 39294.00)
    """)

    # 10. Expenses
    cur.execute("""
        INSERT INTO expenses (id, date, category, amount, vendor, customer_id, billable, status, notes)
        VALUES ('exp-1', '2026-10-02', 'Travel', 4500.00, 'KSRTC Airavat & Local Taxi', 'cust-1', 1, 'unbilled', 'Technician travel for Manipal Speciality Chemicals onsite installation')
        ON DUPLICATE KEY UPDATE amount=VALUES(amount)
    """)

    # 11. Projects & Tasks
    cur.execute("""
        INSERT INTO projects (id, name, customer_id, billing_method, rate_per_hour, status)
        VALUES ('proj-1', 'Manipal Lab HPLC Method Development', 'cust-1', 'hourly', 3500.00, 'active')
        ON DUPLICATE KEY UPDATE name=VALUES(name)
    """)
    cur.execute("""
        INSERT INTO project_tasks (id, project_id, name, budget_hours)
        VALUES ('task-1', 'proj-1', 'Column Validation', 20.00)
        ON DUPLICATE KEY UPDATE name=VALUES(name)
    """)

    # 12. Activities
    activities = [
        ('act-1', 'Quotation SHRKS/Qtn/26-27/019 issued to Manipal Speciality Chemicals Pvt Ltd', '2026-10-03 10:30'),
        ('act-2', 'Credit Note SHRKS/CN/26-27/001 approved for ₹ 11,800.00', '2026-10-06 14:15'),
        ('act-3', 'Vendor PO SHRKS/PO/26-27/005 issued to Thermo Fisher Scientific', '2026-10-02 11:00')
    ]
    for a in activities:
        cur.execute("INSERT INTO activities (id, text, time) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE text=VALUES(text)", a)

    print("SUCCESS: All initial business records seeded into MySQL database successfully!")
    cur.close()
    conn.close()

if __name__ == '__main__':
    seed()
