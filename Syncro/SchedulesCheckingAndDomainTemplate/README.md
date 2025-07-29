# Syncro Domain Renewal API

This Node.js project provides a simple web API to manage domain renewals via SyncroMSP. It includes features to:

- Search customers
- Check existing schedules
- Create recurring invoices (with optional ticket creation)

## 🚀 Features

- Built with **Express.js** and **Axios**
- Environment-variable-based configuration
- Easily extendable
- Automatically creates detailed support tickets with helpful action steps

---

## ⚙️ Environment Variables Setup

This app relies on **two environment variables**:

| Variable Name                 | Description                          |
|------------------------------|--------------------------------------|
| `syncro_recurring_domain_key` | Your Syncro API key                  |
| `syncro_domain`               | Your Syncro subdomain (e.g. `businessname`) |

### 🔒 How to Set Them

#### Windows (Command Prompt / Powershell)

```bash
# Temporarily for a session
set syncro_recurring_domain_key=your_syncro_api_key
set syncro_domain=your_syncro_subdomain
```
To make these permanent:
1. Search for "Environment Variables" in the Start Menu.
2. Under **System Properties → Advanced → Environment Variables**, add them as User Variables.

#### Linux / macOS (Bash or Zsh)
```bash
# Temporarily for current shell session
export syncro_recurring_domain_key=your_syncro_api_key
export syncro_domain=your_syncro_subdomain
```
To make these **permanent**, add the above lines to your ~/.bashrc, ~/.zshrc, or ~/.profile.

# 🧪 Installation
Make sure Node.js is installed (v14+ recommended).

1. Clone the repo
```
git clone 'repository'
cd 'repository'
```
2. Install dependencies
```
npm install
```
3. Start the server
```
node server.js
```
The server will start at:
### 📍 http://localhost:3000

# 📡 API Endpoints
### GET /api/customers?business_name=abc

Search for customers based on business name (minimum 3 characters).

### GET /api/checkschedules?domain=mydomain
Check if any schedule exists for a given domain name.

### POST /api/create-schedule
Create a recurring invoice (and optionally, a support ticket).

Example Payload
```json
{
  "customer_id": 12345,
  "domain": "example.com.au",
  "expiry": "2025-09-15",
  "paymentType": "Credit Card",
  "notes": "Check for DNS and DMARC",
  "inSynergy": false,
  "schedule_frequency": "Annually"
}
```
# 📁 Static Files
Place your frontend (e.g., index.html) inside the /public folder — it'll be served automatically.

# 🛠 Built With
```
Express.js

Axios

SyncroMSP API
```
# 🧾 License
MIT License. Feel free to use, fork, or improve this project.

