# Raktkosh — Blood Bank Management System

> **A centralized, professional database management platform for blood donors, blood inventory, donations, and hospital requisitions.**

---

## 1. Project Overview

**Raktkosh** is a full-featured, database-driven blood bank management application designed for healthcare facilities, blood transfusion centers, and hospital networks. Built as a pair-programmed academic engineering project, it emphasizes reliability, data integrity, and complete CRUD (Create, Read, Update, Delete) database workflows across all operational modules.

The visual interface is crafted using modern dark clinical aesthetics, frosted glassmorphism, and a blood-bank-specific palette:
* **Primary Blood Red:** `#E50914`
* **Deep Crimson:** `#B81D24`
* **Dark Obsidian:** `#221F1F` & `#141212`
* **Crisp Light Off-White:** `#F5F5F1`

---

## 2. Core Functional Modules & CRUD Operations

### A. Dashboard
* **Real-time Live Metrics:** Total donors, active donors, available blood units, pending hospital orders, critical requisitions, and completed donations computed directly from MongoDB aggregations.
* **Blood Group Availability Matrix:** Instant stock overview across all 8 major groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) with status meters (Adequate, Low, Depleted).
* **Recent Activity Feed:** Direct views of active requisitions and recent donor sessions.
* **Sensible Empty State & 1-Click Demo Reset:** Clear explanations when the database is empty, plus a quick "Reset Demo Data" action.

### B. Donor Management (`/donors`)
* **Create:** Register donors with validation (Full Name, Blood Group, Age 18–65, Contact Number, Email, City/Location, Status).
* **Read:** Server-side search by name/ID/contact/city, filter by blood group and registration status, plus pagination.
* **Update:** In-place modal editing of donor demographics and registration status.
* **Delete / Referential Safety:** Destructive operations are protected. Deletion is blocked if historical donation records exist for that donor to preserve medical audit trails.
* **Donor Profile:** Deep-dive file view showing personal information and all linked donation sessions.

### C. Blood Inventory Management (`/inventory`)
* **Create:** Log blood inventory batches with collection date, expiry date (standard 42-day whole-blood window), units, cold storage rack/vault, and status.
* **Read:** Real-time stock counts by blood group. Quick filters for "Available", "Expiring Soon (< 7 Days)", and "Expired Batches".
* **Update:** Modify unit counts, cold vault locations, or status.
* **Delete:** Remove damaged, discarded, or obsolete batches with confirmation.

### D. Blood Request Management (`/requests`)
* **Create:** Register urgent hospital or emergency patient requisitions with required-by deadlines and urgency tags (Normal, Urgent, Critical).
* **Read:** Filter by blood group, urgency level, and requisition status (Pending, Approved, Partially Fulfilled, Fulfilled, Rejected, Cancelled).
* **Stock-Verified Fulfillment (FIFO):** Fulfills requests by validating cold vault inventory in real time and safely decrementing stock from the oldest valid batches first to prevent negative inventory.
* **Update & Delete:** Modify requisition details or cancel erroneous orders.

### E. Donation Records (`/donations`)
* **Create:** Record completed blood donation sessions linked directly to a verified voluntary donor in MongoDB.
* **Read:** Audit log of all collections, units, and collection centers.
* **Update:** Update collection center notes or screening outcomes.
* **Delete:** Clean up testing or incorrect entries.

---

## 3. Technology Stack

* **Frontend Framework:** Next.js 16 (App Router, Turbopack)
* **Language:** TypeScript 5
* **UI & Styling:** Tailwind CSS v4, Lucide React icons
* **Database (Strict Requirement):** MongoDB v8+ with Mongoose ODM
* **State & Data Fetching:** React 19 Client Components, Next.js Server Route Handlers

---

## 4. Project Directory Structure

```text
Raktkosh/
├── .env.example              # Environment variables template
├── .env.local                # Local environment secrets (git-ignored)
├── README.md                 # Project documentation
├── package.json              # Project scripts and dependencies
├── tsconfig.json             # TypeScript configuration
├── eslint.config.mjs         # ESLint configuration
├── public/                   # Static assets & icons
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── dashboard/    # Live dashboard metrics route
    │   │   ├── donors/       # Donor CRUD API routes
    │   │   ├── inventory/    # Blood inventory CRUD API routes
    │   │   ├── requests/     # Blood request & fulfillment API routes
    │   │   ├── donations/    # Donation records API routes
    │   │   └── seed/         # On-demand demonstration seeding endpoint
    │   ├── donors/           # Donor management UI
    │   ├── inventory/        # Blood inventory management UI
    │   ├── requests/         # Requisition management UI
    │   ├── donations/        # Donation records UI
    │   ├── globals.css       # Design tokens & dark glassmorphic styling
    │   ├── layout.tsx        # Base layout with responsive navigation
    │   └── page.tsx          # Main dashboard overview
    ├── components/
    │   ├── Navigation.tsx    # Responsive header, sidebar, and demo reset
    │   ├── Modal.tsx         # Accessible glassmorphic dialog component
    │   ├── BloodGroupBadge.tsx # Semantic blood group pill badge
    │   └── StatusBadge.tsx   # Semantic status and urgency indicator
    ├── lib/
    │   └── mongodb.ts        # Cached Mongoose connection for Next.js hot-reload
    ├── models/
    │   ├── Donor.ts          # Mongoose schema for donors collection
    │   ├── BloodInventory.ts # Mongoose schema for blood_inventory collection
    │   ├── BloodRequest.ts   # Mongoose schema for blood_requests collection
    │   └── DonationRecord.ts # Mongoose schema for donation_records collection
    ├── types/
    │   └── index.ts          # Shared client-safe constants and TypeScript types
    └── scripts/
        ├── seed.ts           # Realistic database seeding script
        └── verify-crud.ts    # Automated end-to-end CRUD verification suite
```

---

## 5. Prerequisites

Before running the application locally, ensure you have:
* **Node.js:** v18.18+ or v20+ (tested on Node v26)
* **npm:** v9+
* **MongoDB:** A running local instance of MongoDB (`mongod` on port 27017) or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string.

---

## 6. Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/krrishronghe/Raktkosh.git
   cd Raktkosh
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   By default, `.env.example` points to:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/raktkosh
   PORT=3000
   ```
   If using MongoDB Atlas, replace `MONGODB_URI` with your connection URI.

4. **Seed Initial Demonstration Data:**
   Populate MongoDB with realistic donors, stock batches, hospital requisitions, and donation records:
   ```bash
   npm run seed
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack on port 3000 |
| `npm run build` | Compiles and builds the production bundle with static optimization |
| `npm run start` | Starts the built production application server |
| `npm run lint` | Runs ESLint checks across the codebase |
| `npm run seed` | Resets and seeds the MongoDB database with realistic test records |
| `npm run test:crud` | Runs the automated CRUD verification and referential safety test suite |

---

## 8. Verification & Testing

To execute the automated database test suite:
```bash
npm run test:crud
```
This script exercises:
* Donor registration, querying, updating, and referential protection against orphan deletions.
* Inventory batch creation, quantity updating, and expiration calculations.
* Hospital requisition creation and stock-verified FIFO unit allocation.
* Donation records creation referencing verified donors.

To verify type safety and code quality:
```bash
npx tsc --noEmit
npm run lint
```

---

## 9. Academic Project Compliance

* **Academic Team Context:** Developed as an academic mini-project demonstrating practical database systems engineering.
* **Database Exclusivity:** MongoDB is strictly the sole persistent database. No SQLite, mock files, or local storage substitutes are used.
* **Clinical Disclaimer:** This application is an educational prototype and is not certified for clinical diagnostic or real-world transfusion operation.
