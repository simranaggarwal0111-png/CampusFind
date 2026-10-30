# CampusFind - Lost & Found Portal 🎓

CampusFind is a modern MERN-stack web application designed for university campuses to report, locate, claim, and securely complete physical handovers of misplaced property.

---

## 🔄 End-to-End Handover Lifecycle (Item Found ➔ Physical Handover)

CampusFind enforces a verifiable 4-step chain-of-custody for all campus property:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  1. Found &     │ ───► │  2. Ownership   │ ───► │  3. Desk Review │ ───► │  4. Physical    │
│     Logged      │      │     Claim       │      │     & Pass Code │      │     Handover    │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
 Finder reports or        Owner identifies item    Admin verifies proof;    Student presents
 deposits at Station.     & submits private        issues Digital Pass      ID & Pass at Desk;
 Status: Active           proof markers.           with Claim Code.         Admin logs Resolved.
                          Status: Pending          Status: Approved         Status: Resolved
```

1. **Phase 1: Discovery & Safe Custody**:
   - A good samaritan or staff member finds an item and logs it online or drops it off at the Central Security Desk.
   - The item is assigned to the catalog in **Active** status.
2. **Phase 2: Ownership Claim**:
   - The rightful owner discovers the item in the Found catalog and submits a Claim.
   - Private identification details (e.g., lock screen photo, internal scratches, serial numbers, keychain charms) are submitted for desk verification.
3. **Phase 3: Station Desk Verification & Pass Generation**:
   - Campus station admin reviews the claimant's proof against the physical item.
   - Upon approval, the item moves to **Claimed** and a secure **Digital Handover Pass** with a unique tracking code (e.g., `CF-A9B12C`) is generated.
4. **Phase 4: Physical Handover & Audit Log**:
   - The student visits the Campus Central Station (*Building B, Room 102*) with their Student ID Card.
   - The desk officer confirms identity and executes the handover, recording audit notes.
   - The claim and item status transition to **Resolved**.

---

## ✨ Features Added

### 🌓 Theme Toggler (Dark & Light Mode)
- Built-in persistent theme state with `ThemeContext` and `localStorage`.
- Animated Sun/Moon toggle button accessible from the Navbar across both desktop and mobile viewports.
- Curated styling:
  - **Dark Mode**: Sleek emerald & slate dark aesthetic (`#080d1a`, radiant emerald glows, frosted glass cards).
  - **Light Mode**: Crisp, modern campus aesthetic (`#f8fafc`, soft borders, polished typography, emerald accents).

### 🔐 OTP Email Verification Signup Flow
- **Step 1**: Student enters Full Name, Campus Email, and Password, then clicks **"Send Verification Code"**.
- **Step 2**: Backend generates a 6-digit OTP stored in the `Otp` collection with a 10-minute TTL expiry, and sends an official HTML code email via Nodemailer using Gmail SMTP port 587.
- **Step 3**: Student inputs the 6-digit code and clicks **"Verify OTP & Complete Registration"**. The backend verifies the code, creates the student record in MongoDB, sets an active session, and redirects straight to the User Dashboard.
- **Resend & Edit**: Includes an automatic 60-second countdown timer with a "Resend OTP Code" action and a back button to correct email typos.

### 🤝 Weighted Lost-Item Matching
- Lost and found reports are compared by title, description, category, color, brand, location, and date using weighted similarity scoring.
- The top six suggestions above the 30% relevance threshold appear after a lost report is submitted and on an item details page.
- Suggestions show a match percentage, image, report details, and a **View Details** action.
- Owners receive individual Nodemailer alerts for relevant matches. MongoDB stores matched pairs and per-recipient delivery state to avoid duplicate alerts.
- Match suggestions and emails do not include report contact details or account email addresses. Public catalog endpoints hide contact information from non-admin users.
- Optional color and brand fields improve match quality. Matching uses local weighted similarity and does not require an external AI service.
- `POST /api/items` saves the report and returns a `matches` array; `GET /api/items/:id/matches` returns ranked suggestions for a signed-in user.

### 👤 User Portal (`/my-activity`)
- **Digital Handover Passes**: Live status stepper, pickup station details (*Campus Central Security Desk, Building B, Room 102*), station operating hours, and printable Claim Code.
- **My Reported Items**: Overview of all Lost and Found reports filed by the student, with one-click deletion and status tracking.
- **Handover Protocol Guide**: Integrated student instructions for safe custody and property retrieval.

### 🛡️ Admin Handover & Control Center (`/admin`)
- Role-protected (`AdminRoute`) access exclusively for campus staff and security officers.
- **Tab 1: Claims & Handover Approvals**: Review student claims, inspect proof, approve or reject claims, and execute physical in-person handovers with audit notes.
- **Tab 2: Campus Property Inventory**: Full catalog search and filtering by type (`Lost` / `Found`) and status (`Active`, `Found`, `Claimed`, `Resolved`), with quick status updates and item management.
- **Tab 3: Handover Audit Trail**: Detailed log of all completed returns with timestamps, claimant names, and desk notes.
- **Tab 4: Station Operations Guide**: Policies, holding periods (90-day custody), and contact extensions.

### 🔍 Public Handover Flow & Tracker (`/handover`)
- Real-time search bar to look up claim status and pickup readiness using a Claim Code or ID.
- Interactive 4-step protocol timeline and campus station directory.
- Clear FAQs answering student questions on device unlocking, holding windows, and authorized third-party pickups.

---

## 📂 Project Architecture

```
CampusFind/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Role-aware nav with ThemeToggle
│   │   │   ├── ThemeToggle.jsx     # Animated Sun/Moon switch
│   │   │   └── ItemMatchSuggestions.jsx # Ranked lost/found suggestions
│   │   ├── context/
│   │   │   └── ThemeContext.jsx    # Dark/Light persistent state
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page + live recent items
│   │   │   ├── Login.jsx           # Auth with role routing
│   │   │   ├── Lost.jsx            # Browse lost items + found reporting
│   │   │   ├── Found.jsx           # Browse found items + claim submission
│   │   │   ├── HandoverFlow.jsx    # 4-Step protocol + Real-time tracker
│   │   │   ├── UserDashboard.jsx   # Student portal & Handover Passes
│   │   │   ├── AdminDashboard.jsx  # Staff desk & inventory control
│   │   │   ├── ReportLost.jsx      # Lost item reporting
│   │   │   └── ReportFound.jsx     # Found item reporting
│   │   ├── App.jsx                 # Routes with ProtectedRoute & AdminRoute
│   │   ├── main.jsx                # Entry point with ThemeProvider
│   │   └── index.css               # Theme rules, @custom-variant dark
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js   # JWT cookie auth & registration
│   │   │   ├── claimController.js  # Handover claims, tracking, & approvals
│   │   │   └── itemController.js   # Items CRUD, user items & found matching
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # protect, adminOnly, optionalProtect
│   │   ├── models/
│   │   │   ├── User.js             # User schema with roles (student, admin)
│   │   │   ├── Item.js             # Item schema with handover fields
│   │   │   ├── ItemMatch.js        # Match-pair notification deduplication
│   │   │   └── Claim.js            # Claim schema with claimCode & handover logs
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # /api/auth endpoints
│   │   │   ├── claimRoutes.js      # /api/claims endpoints
│   │   │   └── itemRoutes.js       # /api/items endpoints
│   │   ├── utils/
│   │   │   ├── itemMatching.js     # Weighted report similarity scoring
│   │   │   └── itemMatchNotification.js # Match email notifications
│   │   └── server.js               # Express server setup
│   └── package.json
│
└── README.md
```

---

## 🚀 Running the Application

### 1. Start Backend API
```bash
cd backend
npm run dev
```
API runs on `http://localhost:5000/api`.

### 2. Start Frontend App
```bash
cd frontend
npm run dev
```
Client runs on `http://localhost:5173`.

### QR item recovery

Authenticated Lost-item reports receive a unique recovery QR code. Owners can
show, download, or copy its link from the Lost Items catalog. Finders can submit
recovery details without signing in; owners review requests in **My Activity →
QR Recovery Requests**. Completing a request resolves the item and disables its
QR link. Recovery links expire after one year.

For deployment, set `FRONTEND_URL` in the backend environment to the full
frontend URL (for example, `https://campusfind.example.com`). This URL is used
to create recovery links and is automatically allowed by the backend CORS
configuration. If the frontend and backend use different origins, also set
`VITE_API_URL` in the frontend build environment to the backend origin. In
development, the API helper uses `http://localhost:5000` by default.

Recovery email notifications use the existing `EMAIL_USER` and `EMAIL_PASS`
backend variables. Reports are saved even when email is not configured or
temporarily unavailable.
