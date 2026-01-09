# Microfinance Panel: Feature & Flow Blueprint

This document provides a comprehensive overview of the system's capabilities and the operational workflows to help you understand, navigate, and test the application effectively.

---

## 🏗️ Core Entities

| Entity | Description | Key Data |
| :--- | :--- | :--- |
| **Member (KYC)** | The central customer record. | CIF ID, Name, Phone, Aadhaar, Group, Associated Employee. |
| **Group** | Collection of members for Group Lending. | Group ID, Group Name, Center Name. |
| **Advisor/Agent** | External referrers who bring in business. | Advisor Code, Name, Commission Structure. |
| **Employee** | Internal staff members. | UID, Name, Access Level, Associated Members. |
| **GL Code** | General Ledger codes for accounting purposes. | Code (e.g., 23315), Head (e.g., Personal Loan). |

---

## 📈 Major Modules & Features

### 1. Member Management
- **KYC Registration**: Create new members with full documentation.
- **Member Search**: Filter by CIF, Name, or Group.
- **Group Assignment**: Organize members into centers for collection.

### 2. Loan Processing
- **Loan Plans**: Configure interest rates, EMI modes (Daily, Weekly, Monthly), and deductions.
- **Loan Opening**: Apply for a loan for a specific member.
- **Disbursement**: Handle the payout (requires Authorization).
- **Repayments**: Process single or bulk (Group) installment payments.

### 3. Savings & Deposits
- **Savings Accounts**: Standard savings with interest.
- **Fixed & Recurring**: FD and RD plans with maturity calculations.
- **Renewals**: Process bulk renewals for recurring accounts.

### 4. Accounting (General Ledger)
- **Vouchers**: Record Cash/Bank transactions.
- **Journals**: Transfer money between GL accounts or personal accounts.
- **Day Book**: Daily snapshot of all financial movements.

---

## 🔄 Operational Workflows (How to Test)

### Flow A: The Loan Lifecycle (Standard Flow)
1.  **Step 1: Onboarding**
    - Go to **Member Management** > **New KYC**.
    - Create a member and note the **CIF ID**.
2.  **Step 2: Application**
    - Go to **Loan** > **Plan Creation** (Ensure a plan exists).
    - Go to **Loan** > **Loan Opening**. Select a plan and the CIF.
3.  **Step 3: Authorization (PI)**
    - Financial actions do not happen immediately. They go to the **Authorization** menu.
    - Go to **Authorization** > **Loan Disbursement**. Find your loan and click **Authorize**.
4.  **Step 4: Repayment**
    - Go to **Loan Transaction** > **Repayment**.
    - Submit a repayment request.
    - Go back to **Authorization** > **Loan Repayment** to finalize it.

### Flow B: Savings Deposit
1.  Go to **Savings** > **Account Opening**. Create an account for a CIF.
2.  Go to **Transaction** > **Cash Voucher**. Add credit to the savings account.
3.  Go to **Authorization** > **Voucher** to approve the deposit.

### Flow C: Viewing Reports
1.  After authorizing transactions, go to **Reports** > **General** > **Cash Account**.
2.  Select the date range. You should see the totals updated based on your GL codes.

---

## 🛡️ Authorization Logic (The "PI" System)
Most critical actions in this system follow a **Two-Factor Workflow**:
- **Initiator**: A staff member submits a request (e.g., a repayment). This creates a **Payment Instruction (PI)**.
- **Authorizer**: An Admin or Root user reviews the PI under the **Authorization** menu. The transaction is only persistent in the ledger *after* authorization.

---

## 📁 Database Structure (Firestore)
- `{bankId}/admin/service-plan`: Stores Loan and Deposit plans.
- `{bankId}/kyc/member-kyc`: Stores all member details.
- `{bankId}/accounts/loan`: Stores active loan accounts.
- `{bankId}/pi/`: Stores pending instructions waiting for approval.
- `{bankId}/transaction/{date}/`: Stores authorized daily ledger entries.

---
*Created by Antigravity*
