# Shreeraksha Solutions — Complete AWS Lightsail Deployment Guide

A step-by-step, production-ready guide to deploying the **Shreeraksha Solutions GST Billing & ERP Suite** on **AWS Lightsail** with a live **MySQL database**, **Gunicorn backend**, **Nginx reverse proxy**, and **free SSL certificate (HTTPS)**.

---

## Architecture Overview

```
                                      Internet
                                         │
                                         ▼
                            [ HTTPS / Port 443 & 80 ]
                                         │
                           ┌─────────────▼─────────────┐
                           │       Nginx Web Server    │
                           │  - SSL Termination        │
                           │  - Static Asset Delivery  │
                           └─────────────┬─────────────┘
                                         │
                                         ▼ (Reverse Proxy to 127.0.0.1:8080)
                           ┌───────────────────────────┐
                           │   Gunicorn + Flask API    │
                           │      (systemd daemon)     │
                           └─────────────┬─────────────┘
                                         │
                                         ▼ (Local Socket / 127.0.0.1:3306)
                           ┌───────────────────────────┐
                           │      MySQL 8.0 Server     │
                           │    (shreeraksha_db)       │
                           └───────────────────────────┘
```

---

## Table of Contents
1. [Phase 1: Creating & Activating Your AWS Account](#phase-1-creating--activating-your-aws-account)
2. [Phase 2: Launching the AWS Lightsail Instance](#phase-2-launching-the-aws-lightsail-instance)
3. [Phase 3: Allocating a Free Static IP & Firewall Configuration](#phase-3-allocating-a-free-static-ip--firewall-configuration)
4. [Phase 4: Connecting to the Server via SSH](#phase-4-connecting-to-the-server-via-ssh)
5. [Phase 5: Installing System Packages & Dependencies](#phase-5-installing-system-packages--dependencies)
6. [Phase 6: Configuring MySQL Database](#phase-6-configuring-mysql-database)
7. [Phase 7: Uploading the Application Code](#phase-7-uploading-the-application-code)
8. [Phase 8: Setting Up Python Environment & Seeding Data](#phase-8-setting-up-python-environment--seeding-data)
9. [Phase 9: Configuring Gunicorn & systemd Service (24/7 Uptime)](#phase-9-configuring-gunicorn--systemd-service-247-uptime)
10. [Phase 10: Configuring Nginx Web Server](#phase-10-configuring-nginx-web-server)
11. [Phase 11: Domain Setup & Free SSL Certificate (HTTPS)](#phase-11-domain-setup--free-ssl-certificate-https)
12. [Phase 12: Full Verification Checklist](#phase-12-full-verification-checklist)
13. [Phase 13: Automated Daily Database Backups](#phase-13-automated-daily-database-backups)

---

## Phase 1: Creating & Activating Your AWS Account

If you don't already have an active Amazon Web Services account:

1. Go to [https://aws.amazon.com](https://aws.amazon.com) and click **Create an AWS Account**.
2. **Account Details**:
   * Enter your Root user email address (e.g. `connect@shreeraksha.in` or business email) and AWS account name.
   * Verify your email address using the confirmation code sent by AWS.
   * Set a strong root password.
3. **Contact Information**:
   * Choose **Professional** (for business) or **Personal**.
   * Enter your business phone number and physical address (Karnataka, India).
4. **Billing Information (Credit/Debit Card)**:
   * Enter an international debit or credit card (Visa, Mastercard, RuPay with international transactions enabled).
   * AWS will make a temporary authorization charge of **₹2.00 INR** to verify your card (this is automatically refunded).
5. **Identity Verification**:
   * Complete the mobile SMS or phone call OTP verification.
6. **Support Plan**:
   * Select the **Basic Support - Free** plan.
7. Click **Complete sign-up**. Account activation usually takes **5–15 minutes**.

---

## Phase 2: Launching the AWS Lightsail Instance

1. Log into the AWS Management Console and search for **Lightsail** in the top search bar, or navigate to:
   [https://lightsail.aws.amazon.com](https://lightsail.aws.amazon.com)
2. In the Lightsail Dashboard, click **Create instance**.
3. **Instance Location (Region & Zone)**:
   * Click **Change Region and zone**.
   * Select **Asia Pacific (Mumbai) `ap-south-1`** (Zone: `ap-south-1a`).
   * *Selecting Mumbai guarantees ultra-fast response times (< 30ms) across Karnataka and India.*
4. **Select Platform & Blueprint**:
   * **Platform**: Select **Linux/Unix**.
   * **Blueprint**: Select **OS Only**.
   * Choose **Ubuntu 24.04 LTS** (or Ubuntu 22.04 LTS).
5. **Choose Instance Plan**:
   * Select the **$3.50 USD/month** plan:
     * **Memory:** 1 GB RAM
     * **Processing:** 1 vCPU
     * **Storage:** 40 GB NVMe SSD
     * **Transfer:** 1 TB Bandwidth
   * *(Note: AWS offers the first 3 months free on this tier for new accounts).*
6. **Identify Your Instance**:
   * Set a name, e.g.: `shreeraksha-billing-server`
7. Click **Create instance**. Your instance will take approximately 1–2 minutes to reach the `Running` state.

---

## Phase 3: Allocating a Free Static IP & Firewall Configuration

By default, an instance's public IP address changes whenever it reboots. Lightsail provides a **Free Static IP** so your address stays permanent.

### 1. Attach a Static IP
1. Inside the Lightsail console, click the **Networking** tab.
2. Click **Create static IP**.
3. Under **Attach to an instance**, choose `shreeraksha-billing-server`.
4. Name it `shreeraksha-static-ip` and click **Create**.
5. **Copy down this Static IP address** (e.g. `13.234.xx.xx`).

### 2. Configure the Firewall
1. Click on your instance name (`shreeraksha-billing-server`) and open the **IPv4 Firewall** tab.
2. Ensure the following rules are present:
   * **SSH** (Port `22`) — Application: SSH
   * **HTTP** (Port `80`) — Application: HTTP
   * **HTTPS** (Port `443`) — Application: HTTPS
   * *(Delete any other unnecessary open ports like 8080 or 3306; only Nginx should be exposed to the public internet).*

---

## Phase 4: Connecting to the Server via SSH

You can connect directly from your web browser without downloading any SSH keys:

1. In the Lightsail console, click on the orange **`>_` (Terminal icon)** next to your instance name.
2. A secure browser-based terminal will open with user `ubuntu`.

Alternatively, if you prefer using your local terminal (Windows PowerShell / macOS):
```bash
ssh -i /path/to/LightsailDefaultKey-ap-south-1.pem ubuntu@YOUR_STATIC_IP
```

---

## Phase 5: Installing System Packages & Dependencies

Run the following commands in the server terminal:

```bash
# 1. Update package lists and upgrade system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Python 3, pip, virtual environment, MySQL Server, Nginx, and Git
sudo apt install -y python3-pip python3-venv mysql-server nginx git curl certbot python3-certbot-nginx

# 3. Create a 2 GB swap file (ensures smooth performance on a 1 GB RAM instance)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Verify swap is active:
```bash
free -h
```

---

## Phase 6: Configuring MySQL Database

### 1. Secure MySQL & Set Root Password
Start MySQL and configure the root password:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql

sudo mysql
```

Inside the MySQL prompt (`mysql>`), execute the following queries:
*(Replace `StrongPassword@2026` with your chosen secure database password)*:

```sql
-- 1. Create the database
CREATE DATABASE IF NOT EXISTS shreeraksha_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create the application database user
CREATE USER IF NOT EXISTS 'shreeraksha_user'@'localhost' IDENTIFIED BY 'StrongPassword@2026';

-- 3. Grant full privileges to the database
GRANT ALL PRIVILEGES ON shreeraksha_db.* TO 'shreeraksha_user'@'localhost';
FLUSH PRIVILEGES;

-- 4. Exit MySQL
EXIT;
```

---

## Phase 7: Uploading the Application Code

Create the destination directory on the server:
```bash
sudo mkdir -p /var/www/shreeraksha
sudo chown -R ubuntu:ubuntu /var/www/shreeraksha
cd /var/www/shreeraksha
```

### Option A: Via Git (Recommended)
If your code is pushed to a private or public GitHub/GitLab repository:
```bash
git clone https://github.com/your-username/Sreeraksha-Solutions.git .
```

### Option B: Via SCP from your local Windows machine
Open PowerShell on your local computer where the project lives and upload the folder:
```powershell
# Run from d:\D_Drive\Agents\sreeraksha\Sreeraksha-Solutions
scp -i "C:\path\to\your-lightsail-key.pem" -r * ubuntu@YOUR_STATIC_IP:/var/www/shreeraksha/
```

Verify the files are in place:
```bash
ls -la /var/www/shreeraksha
```
You should see `app.py`, `index.html`, `schema.sql`, `seed_data.py`, `js/`, `css/`, `assets/`.

---

## Phase 8: Setting Up Python Environment & Seeding Data

Inside the server terminal:

```bash
cd /var/www/shreeraksha

# 1. Create Python virtual environment
python3 -m venv venv

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install required Python packages
pip install --upgrade pip
pip install flask flask-cors pymysql gunicorn

# 4. Import the Database Schema
mysql -u shreeraksha_user -p'StrongPassword@2026' shreeraksha_db < schema.sql

# 5. Update Database Configuration in app.py and seed_data.py
```

Create an environment configuration file:
```bash
cat << 'EOF' > /var/www/shreeraksha/.env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=shreeraksha_user
DB_PASSWORD=StrongPassword@2026
DB_NAME=shreeraksha_db
PORT=8080
EOF
```

Run the database seed script to populate default settings, SBI bank details, tax rates, and products:
```bash
# Run seeder using the virtual environment
python3 -c "
import os
os.environ['DB_USER'] = 'shreeraksha_user'
os.environ['DB_PASSWORD'] = 'StrongPassword@2026'
os.environ['DB_NAME'] = 'shreeraksha_db'
import seed_data
seed_data.seed()
"
```

You should see:
```text
Connected to MySQL. Starting seed insertion...
Seed data insertion complete! All tables initialized.
```

---

## Phase 9: Configuring Gunicorn & systemd Service (24/7 Uptime)

We configure a Linux `systemd` daemon so that Gunicorn runs Flask continuously in the background and restarts automatically if the server reboots.

### 1. Create systemd Service Unit
```bash
sudo nano /etc/systemd/system/shreeraksha.service
```

Paste the following configuration:

```ini
[Unit]
Description=Shreeraksha Solutions Flask Backend
After=network.target mysql.service

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/shreeraksha
EnvironmentFile=/var/www/shreeraksha/.env
ExecStart=/var/www/shreeraksha/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8080 \
    --timeout 60 \
    --access-logfile /var/log/shreeraksha_access.log \
    --error-logfile /var/log/shreeraksha_error.log \
    app:app

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Save and exit (`Ctrl + O`, `Enter`, then `Ctrl + X`).

### 2. Enable and Start the Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable shreeraksha
sudo systemctl start shreeraksha
```

### 3. Verify Service Status
```bash
sudo systemctl status shreeraksha
```
You should see: `Active: active (running)`.

---

## Phase 10: Configuring Nginx Web Server

Nginx will serve your frontend (HTML, CSS, JS, Images) at lightning speed and route API calls to the Gunicorn backend.

### 1. Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/shreeraksha
```

Paste the following configuration *(replace `YOUR_DOMAIN_OR_STATIC_IP` with your domain e.g. `billing.shreeraksha.in` or your Static IP)*:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_STATIC_IP;

    root /var/www/shreeraksha;
    index index.html;

    # Gzip Compression for fast loading
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Serve static frontend files directly
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy all backend API calls to Gunicorn
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

### 2. Enable Site and Test Nginx
```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/shreeraksha /etc/nginx/sites-enabled/

# Remove default Nginx welcome page
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t
```
You should see: `nginx: configuration file /etc/nginx/nginx.conf test is successful`.

Restart Nginx:
```bash
sudo systemctl restart nginx
```

Now, visit your **Static IP** in your browser (`http://YOUR_STATIC_IP`). The Shreeraksha Solutions dashboard will load immediately!

---

## Phase 11: Domain Setup & Free SSL Certificate (HTTPS)

### 1. Add DNS Record at Your Domain Registrar
Log into your domain provider (GoDaddy, BigRock, Namecheap, Cloudflare, etc.):
* Add an **`A` Record**:
  * **Host / Name**: `@` (for `shreeraksha.in`) OR `billing` (for `billing.shreeraksha.in`)
  * **Points to / Value**: `YOUR_STATIC_IP` (e.g. `13.234.xx.xx`)
  * **TTL**: 300 seconds (or Auto)

Wait 2–5 minutes for DNS propagation.

### 2. Issue Free Auto-Renewing SSL with Let's Encrypt
On your Lightsail server terminal, run:

```bash
sudo certbot --nginx -d billing.shreeraksha.in
```
*(Enter your email address and accept the terms).*

Certbot will automatically verify your domain, install the SSL certificate, and configure HTTPS redirection in Nginx.

Verify auto-renewal is enabled:
```bash
sudo certbot renew --dry-run
```

---

## Phase 12: Full Verification Checklist

Run through this checklist to ensure all modules are operating at 100%:

| Test | What to Check | Expected Result |
| :--- | :--- | :--- |
| **1. HTTPS Access** | Open `https://yourdomain.com` | Green padlock icon; loads dashboard instantly. |
| **2. API Health** | Visit `https://yourdomain.com/api/health` | Returns `{"status":"connected","database":"shreeraksha_db"}`. |
| **3. Bank Details** | Go to **Settings** | Displays **State Bank of India**, A/C `45666081503`, IFSC `SBIN0016869`, Branch `PARKALA`. |
| **4. Invoice Creation** | Create a test Tax Invoice | Saves successfully and appears in the invoice table. |
| **5. PDF / Print** | Open any Invoice and click **Print / PDF** | Formats cleanly onto 1 A4 page with SBI company bank details in the footer. |
| **6. Reboot Test** | Run `sudo reboot` on the server | Server restarts and the app comes back online automatically in < 45 seconds. |

---

## Phase 13: Automated Daily Database Backups

To ensure your financial invoices and customer ledgers are always safe:

### 1. Enable Lightsail Automatic Snapshots (Cloud Disk Backup)
1. Go to Lightsail Console → Click your instance.
2. Click the **Snapshots** tab.
3. Toggle ON **Automatic snapshots**.
4. Set the snapshot time to **02:00 UTC** (07:30 AM IST).

### 2. Set Up a Daily Local MySQL Dump Cron Job
Create a backup directory:
```bash
sudo mkdir -p /var/backups/mysql_shreeraksha
sudo chown ubuntu:ubuntu /var/backups/mysql_shreeraksha
```

Add a daily midnight backup script:
```bash
crontab -e
```
Add the following line to the bottom:
```bash
0 2 * * * mysqldump -u shreeraksha_user -p'StrongPassword@2026' shreeraksha_db | gzip > /var/backups/mysql_shreeraksha/backup_$(date +\%Y\%m\%d).sql.gz
```
*(This automatically compresses and archives your database daily at 2:00 AM).*

---

## Helpful Server Management Commands

```bash
# Restart the Flask Application
sudo systemctl restart shreeraksha

# View live application logs
sudo journalctl -u shreeraksha -f

# View Nginx access & error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx

# Access MySQL Console directly
mysql -u shreeraksha_user -p'StrongPassword@2026' shreeraksha_db
```
