# 🔄 Syncro GST Late Fee Correction Script

This Node.js script automatically checks unpaid SyncroMSP invoices and ensures any **"Late Fee"** line items are set to **taxable (GST enabled)** if overdue.

> ✅ This script is optimized to run on a **Synology NAS** (DSM) and scheduled via **cron** to run twice daily.

---

## 📦 Features

- Fetches all unpaid invoices marked as `open`
- Checks for overdue invoices
- Ensures **"Late Fee"** line items are marked as taxable (GST applied)
- Optional logging for debugging purposes

---

## 🛠️ Setup Instructions

### 1. ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) installed on your Synology NAS
- Script file saved, e.g., `invoiceoverduecheck.js`
- Your **SyncroMSP API Key**

### 2. 🔑 Supplying Environment Data

This script takes **command-line arguments**:
```bash
node late-fee-gst-fix.js <SYNCRO_API_KEY> [log]
<SYNCRO_API_KEY> – Required
```
[log] – Optional flag for verbose logging (true, 1)

### 3. 📁 Install Dependencies
Run this once to install the required package:
```
npm install axios
```
If you're using a shared script directory or want to isolate this, consider running it inside a folder with a package.json.

### 🚀 Running the Script
#### Manual Run
```bash
node late-fee-gst-fix.js your_syncro_api_key true
```
This will:

- Fetch all unpaid invoices

- Check for overdue ones

- Apply GST to "Late Fee" line items if not already set

## 🕒 Setting up Cron on Synology (Twice Daily)
### 1. Open DSM → Control Panel → Task Scheduler
### 2. Create → Scheduled Task → User-defined script
- Task Name: ```Syncro GST Script```

- User: ```root``` (or one with access to the script and Node.js)

### 3. Schedule Tab
Set to run twice a day:
``` 0 6,18 * * *```
(Runs at 6 AM and 6 PM every day)

### 4. Task Settings → Run command:
```bash
cd /volume1/scripts/syncro/ && /usr/local/bin/node invoiceoverduecheck.js your_syncro_api_key
```
Adjust path and Node.js location as needed.
Use ```which node``` on your NAS to confirm the Node path.

## 🧪 Example Output (with Logging Enabled)
Updating Invoice #INV-1234 to apply GST on late fee...

Invoice #INV-1234 updated.

COMPLETE
## 🛠 Technologies Used
``` 
Node.js
Axios
SyncroMSP API
```

## 📄 License
MIT License — free to use and modify.