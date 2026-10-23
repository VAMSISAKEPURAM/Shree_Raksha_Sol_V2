"""
SHREERAKSHA SOLUTIONS - AUTOMATED DATABASE INITIALIZER & SETUP
Run this script on any new PC to automatically:
1. Connect to MySQL server
2. Create 'shreeraksha_db' database
3. Execute schema.sql to build all tables
4. Seed default company profile, taxes, products & SBI bank details
5. Save database credentials to .env file for app.py
"""

import os
import sys
import getpass
import pymysql

# Load existing .env if present
env_file = os.path.join(os.path.dirname(__file__), '.env')
env_vars = {}
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip()

def get_input(prompt, default=''):
    val = input(f"{prompt} [{default}]: ").strip()
    return val if val else default

def main():
    print("=" * 65)
    print("   SHREERAKSHA SOLUTIONS - DATABASE INITIALIZATION UTILITY")
    print("=" * 65)
    print("This utility will configure MySQL for your application on this PC.\n")

    # Determine default connection parameters
    host = os.environ.get('DB_HOST') or env_vars.get('DB_HOST', '127.0.0.1')
    port = int(os.environ.get('DB_PORT') or env_vars.get('DB_PORT', 3306))
    user = os.environ.get('DB_USER') or env_vars.get('DB_USER', 'root')
    has_saved_env = bool(env_vars.get('DB_PASSWORD') or os.environ.get('DB_PASSWORD'))
    db_name = os.environ.get('DB_NAME') or env_vars.get('DB_NAME', 'shreeraksha_db')

    # Display connection target
    print(f"Target Database Host : {host}:{port}")
    print(f"Target Database User : {user}")
    print(f"Target Database Name : {db_name}")

    if has_saved_env:
        use_saved = input(f"Connect with saved credentials from .env (user '{user}')? [Y/n]: ").strip().lower()
        if use_saved != 'n':
            password = os.environ.get('DB_PASSWORD') or env_vars.get('DB_PASSWORD', '')
        else:
            host = get_input("MySQL Host", host)
            port = int(get_input("MySQL Port", str(port)))
            user = get_input("MySQL Username", user)
            password = getpass.getpass(f"MySQL Password for '{user}': ")
    else:
        print(f"\n[*] Setting up database on a new PC.")
        host = get_input("MySQL Host", host)
        port = int(get_input("MySQL Port", str(port)))
        user = get_input("MySQL Username", user)
        password = getpass.getpass(f"Enter MySQL Password for '{user}': ")

    # Connect with retry loop in case of bad password
    conn = None
    cur = None
    for attempt in range(3):
        print(f"\n[*] Connecting to MySQL at {host}:{port} as user '{user}'...")
        try:
            conn = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                charset='utf8mb4',
                autocommit=True
            )
            cur = conn.cursor()
            print(" [✓] Connected to MySQL server successfully!")
            break
        except pymysql.err.OperationalError as e:
            if len(e.args) > 0 and e.args[0] == 1045:
                print(f" [!] Access denied: The password entered is incorrect for user '{user}' on this machine.")
                if attempt < 2:
                    password = getpass.getpass(f"Please re-enter the MySQL password for '{user}': ")
                    continue
            print(f"\n[ERROR] Could not connect to MySQL server:\n{e}\n")
            print("Troubleshooting Tips:")
            print(" 1. Ensure the MySQL service is running (Windows: 'net start MYSQL80' or Services app).")
            print(" 2. Verify that your username and password are correct.")
            sys.exit(1)
        except Exception as e:
            print(f"\n[ERROR] Could not connect to MySQL server:\n{e}\n")
            print("Troubleshooting Tips:")
            print(" 1. Ensure the MySQL service is running (Windows: 'net start MYSQL80' or Services app).")
            print(" 2. Verify that your username and password are correct.")
            sys.exit(1)

    # 1. Create database if it does not exist
    print(f"[*] Creating database '{db_name}' if not exists...")
    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    cur.execute(f"USE `{db_name}`;")
    print(f" [✓] Database '{db_name}' is ready.")

    # 2. Execute schema.sql
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if not os.path.exists(schema_path):
        print(f"[ERROR] schema.sql not found at {schema_path}!")
        sys.exit(1)

    print("[*] Applying schema.sql tables...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    # Split and execute individual SQL statements
    statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
    cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for stmt in statements:
        # Ignore comments or empty statements
        clean_stmt = "\n".join([line for line in stmt.splitlines() if not line.strip().startswith('--')])
        if clean_stmt.strip():
            try:
                cur.execute(clean_stmt)
            except Exception as e:
                # Ignore non-fatal warnings
                pass
    cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print(" [✓] All tables created successfully!")

    # 3. Seed initial data
    print("[*] Seeding default company profile, taxes, products, and SBI bank details...")
    try:
        # Set environment variables for seed_data
        os.environ['DB_HOST'] = host
        os.environ['DB_PORT'] = str(port)
        os.environ['DB_USER'] = user
        os.environ['DB_PASSWORD'] = password
        os.environ['DB_NAME'] = db_name

        import seed_data
        seed_data.seed()
        print(" [✓] Seed data applied successfully!")
    except Exception as e:
        print(f" [!] Seeding error: {e}")

    # 4. Save/Update .env file
    print(f"[*] Saving credentials to .env file...")
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write(f"# Shreeraksha Solutions Local Environment Configuration\n")
        f.write(f"DB_HOST={host}\n")
        f.write(f"DB_PORT={port}\n")
        f.write(f"DB_USER={user}\n")
        f.write(f"DB_PASSWORD={password}\n")
        f.write(f"DB_NAME={db_name}\n")
        f.write(f"PORT=8080\n")
    print(" [✓] .env file saved.")

    cur.close()
    conn.close()

    print("\n" + "=" * 65)
    print(" [SUCCESS] SETUP COMPLETE!")
    print(" You can now start the application anytime by:")
    print("   • Double-clicking 'run.bat', OR")
    print("   • Running 'python app.py' in your terminal")
    print("=" * 65 + "\n")

if __name__ == '__main__':
    main()
