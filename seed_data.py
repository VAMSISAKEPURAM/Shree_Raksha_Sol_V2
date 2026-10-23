"""
Seed script to populate MySQL database 'shreeraksha_db' with Shreeraksha Solutions default data.
In production clean mode, this script clears all demo transactions, customers, and items,
and ensures only the organization settings and GST tax rates are configured.
"""
import pymysql
import json
import os

# Load optional .env file if present
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

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

TABLES_TO_CLEAR = [
    'note_items',
    'debit_credit_notes',
    'purchase_order_items',
    'purchase_orders',
    'invoice_items',
    'invoices',
    'payments',
    'estimate_items',
    'estimates',
    'recurring_invoices',
    'timesheets',
    'project_tasks',
    'projects',
    'expenses',
    'party_contacts',
    'parties',
    'items',
    'activities'
]

def clean_demo_data(cur):
    print("Purging all demo transactions, customers, vendors, and items...")
    cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for tbl in TABLES_TO_CLEAR:
        try:
            cur.execute(f"TRUNCATE TABLE `{tbl}`;")
        except Exception:
            pass
    cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print(" [✓] Demo data successfully cleared.")

def seed():
    conn = pymysql.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("Connected to MySQL. Preparing clean production baseline...")

    # Purge demo data
    clean_demo_data(cur)

    # 1. Organization Settings
    print("Setting up Organization Profile & SBI Bank details...")
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
    ) ON DUPLICATE KEY UPDATE
        name=VALUES(name),
        legal_name=VALUES(legal_name),
        tax_id=VALUES(tax_id),
        msme_reg_no=VALUES(msme_reg_no),
        email=VALUES(email),
        phone=VALUES(phone),
        website=VALUES(website),
        address=VALUES(address),
        state=VALUES(state),
        bank_name=VALUES(bank_name),
        account_name=VALUES(account_name),
        account_number=VALUES(account_number),
        ifsc_code=VALUES(ifsc_code),
        branch=VALUES(branch),
        micr_code=VALUES(micr_code);
    """)

    # 2. Taxes Master
    print("Configuring GST Tax rates...")
    taxes = [
        ('tax-18', 'GST 18%', 18.0),
        ('tax-12', 'GST 12%', 12.0),
        ('tax-5',  'GST 5%',  5.0),
        ('tax-28', 'GST 28%', 28.0),
        ('tax-0',  'Zero Tax 0%', 0.0)
    ]
    for tid, tname, trate in taxes:
        cur.execute("INSERT INTO taxes (id, name, rate) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE rate=VALUES(rate)", (tid, tname, trate))

    print("SUCCESS: Clean production state initialized! Database is ready for live business entries.")
    cur.close()
    conn.close()

if __name__ == '__main__':
    seed()
