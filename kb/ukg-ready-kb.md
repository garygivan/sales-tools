# UKG Ready — Knowledge Base for Custom GPT
**Maintained by: Mosaic HCM / Evolve HCM**
**Purpose: Reference document for AI-assisted UKG Ready Q&A and sales support**

---

## 1. Platform Overview

**UKG Ready** (formerly Kronos Workforce Ready) is a cloud-based Human Capital Management (HCM) platform designed for small to mid-market businesses, typically 50–2,500 employees. It is part of the UKG (Ultimate Kronos Group) product family.

UKG Ready is a unified suite — HR, payroll, time, scheduling, benefits, recruiting, and onboarding all live in a single database, meaning employee data entered once flows across all modules without re-entry or integration overhead.

**Key differentiators vs. competitors:**
- Single employee record shared across all modules
- Strong time & attendance and scheduling depth (Kronos heritage)
- Multi-state payroll built-in (not an add-on)
- Configurable to a wide range of industries including cannabis, healthcare, manufacturing, retail, nonprofit, and professional services
- Mobile-first employee and manager self-service

---

## 2. Core Modules

### 2.1 Human Resources (HR)
- Central employee record: demographics, employment history, job and pay history, custom fields
- Document management: attach and store I-9s, offer letters, certifications, compliance docs
- Position management and org structure
- Custom workflows for approvals (job changes, terminations, etc.)
- Employee and manager self-service portal
- ACA tracking and reporting
- Performance management (goals, reviews, check-ins)
- Compensation management
- Reporting and analytics on workforce data

### 2.2 Payroll
- Full federal, state, and local tax calculation and filing
- Multi-state payroll — employees can work in multiple states; taxes calculated per jurisdiction
- Pay rules: overtime (FLSA and state-level), shift differentials, blended overtime, weighted average OT
- Multiple pay frequencies and pay groups within the same company
- Direct deposit, check, pay card
- Garnishments, deductions, benefits deductions
- Off-cycle payroll and manual checks
- Payroll preview and audit tools before committing a run
- Year-end: W-2, W-2c, ACA 1094/1095 filing
- General ledger (GL) export — configurable mapping to accounting systems
- Certified payroll (for contractors/government projects)

**Common payroll configuration elements:**
- Pay groups (which employees run on which schedule)
- Earning codes (regular, OT, holiday, bonus, commission, etc.)
- Deduction codes (benefits, garnishments, 401k, etc.)
- Tax jurisdictions and registrations
- Pay rules linked to employee job/location
- GL account mapping

### 2.3 Time & Attendance
- Employee clock-in/out: web, mobile, physical time clock (UKG-compatible hardware)
- Timesheet management and approval workflow
- Pay rule engine: overtime triggers, meal break deductions, shift rules, rounding rules
- Schedule vs. actual comparison
- Exception management (missed punches, late arrivals, unexcused absences)
- Leave management: PTO, sick, FMLA, custom leave types — accruals and balances
- Labor distribution across departments, cost centers, projects
- Geofencing for mobile punch (location-restricted clock-in)

**Cannabis-specific time considerations:**
- Seed-to-sale workforce log support via custom fields and job codes
- Predictive scheduling compliance (Oregon, Chicago, NYC, etc.) — UKG Ready has schedule publish rules that can be configured per location
- Shift-based ops with split shifts and position-based scheduling

### 2.4 Scheduling
- Drag-and-drop schedule builder
- Shift templates and recurring schedule patterns
- Open shift management — publish shifts employees can self-claim
- Coverage requirements by position, location, department
- Schedule visibility for employees on mobile
- Schedule vs. availability matching
- Manager schedule approval workflow
- Integration with time & attendance — scheduled hours auto-populate timesheet context

### 2.5 Benefits Administration
- Open enrollment workflows (employee self-service)
- Life event management (marriage, dependent add, loss of coverage)
- Benefit plan configuration: medical, dental, vision, FSA/HSA, 401k, life, supplemental
- Dependent management and eligibility rules
- ACA affordability and tracking (1094/1095)
- Benefits carrier connections — carrier feeds (EDI 834) to benefits carriers
- Consolidated billing reporting

**Open enrollment key configuration points:**
- Enrollment windows (start/end dates, employee eligibility tiers)
- Benefit plan options and rate tables
- Dependent eligibility rules
- Evidence of Insurability (EOI) rules
- Life event definitions and qualifying documents

### 2.6 Recruiting (Talent Acquisition)
- Applicant tracking system (ATS) built into UKG Ready
- Job requisition workflow
- Careers page / job posting (hosted by UKG or embedded on company site)
- Indeed, LinkedIn, and other job board integrations
- Application management and candidate pipeline
- Interview scheduling
- Offer letter generation
- One-click conversion from applicant to employee

### 2.7 Onboarding
- New hire portal: custom welcome experience
- Task lists: I-9 completion, direct deposit setup, benefits enrollment, policy acknowledgment
- Electronic document signing (E-Verify integration available)
- Manager-facing new hire checklists
- Equipment requests and IT provisioning tasks (via custom tasks)
- Completion tracking and audit trail

**Cannabis-specific onboarding considerations:**
- State license/badge upload fields
- Background check integration
- I-9 compliance for high-turnover workforces (Section 1 and 2 completion tracking)

### 2.8 Performance Management
- Goal setting (individual, team, company)
- Mid-year check-ins
- Annual review workflows
- Manager and self-evaluation forms (fully customizable)
- 360-degree feedback (configurable)
- Competency libraries
- Performance rating history on employee record

### 2.9 Learning Management (LMS)
- Course library (internal or SCORM-compatible uploaded content)
- Assigned training and completion tracking
- Compliance training scheduling
- Certifications and renewal tracking
- Employee transcript and history

### 2.10 Analytics & Reporting
- Standard reports library (HR, payroll, time, benefits — 200+ out-of-the-box)
- Custom report builder: drag-and-drop field selection, filters, groupings, calculations
- Scheduled report delivery (email, in-system)
- Dashboard widgets: configurable for role (HR, payroll, manager, executive)
- Workforce analytics: turnover, headcount, overtime trends, time-to-fill
- Data export to Excel, CSV, PDF

---

## 3. Org Structure and Configuration Concepts

### 3.1 Company Setup
- **Company:** Top-level entity; one UKG Ready instance can support multiple companies (for multi-EIN organizations)
- **Location:** Physical site or business unit; drives tax jurisdiction, scheduling, and reporting filters
- **Department:** Organizational grouping within a location; used for reporting and approval routing
- **Position:** Job title + grade + pay range; can be tied to headcount budgeting
- **Cost Center:** Accounting-aligned labor allocation code; used in GL mapping and labor reporting

### 3.2 Pay Rules and Overtime
- Pay rules are the engine behind how hours translate to pay
- Rules define: when OT kicks in (daily vs. weekly), shift differentials, weekend premiums, holiday pay multipliers, meal break deductions
- Must be configured per location/state for multi-state compliance
- Common error: one company-wide pay rule applied to all employees regardless of state — causes incorrect OT and compliance exposure

### 3.3 User Roles and Permissions
- Role-based access control; roles are fully configurable
- Typical roles: Employee (self-service), Manager (team actions), HR Admin, Payroll Admin, System Admin
- Manager scope: controls which employees a manager can see and act on
- Sensitive field masking (SSN, pay rates) configurable by role

---

## 4. Multi-State Operations

UKG Ready handles multi-state payroll natively. Key considerations:

- Each state tax jurisdiction must be registered and active before running payroll for employees in that state
- State unemployment (SUI/SUTA) rates must be entered and updated annually
- Local tax jurisdictions (city, county) require separate registration in some states
- Pay rules must be reviewed for each state (overtime laws vary significantly — CA daily OT, CO, WA, etc.)
- Workers' comp codes can be configured per state
- Onboarding forms may differ by state (state-specific new hire docs, withholding forms)
- Predictive scheduling laws apply in specific cities/states — schedule publish deadlines and change penalty rules must be configured manually

**States with notable complexity:**
- California: daily OT at 8 hrs, double-time at 12 hrs; meal and rest break tracking; PAGA exposure
- Colorado: daily OT at 12 hrs; FAMLI leave; local jurisdictions (Denver, Aurora, etc.)
- Washington: L&I (workers' comp) is state-managed — requires separate reporting
- New York: NYC-specific scheduling, multiple local tax jurisdictions
- Illinois: Chicago predictive scheduling; IL WARN Act considerations for multi-location

---

## 5. Cannabis Industry Specifics

UKG Ready can be configured for cannabis operations. Key requirements and configurations:

### Compliance
- I-9 with E-Verify: critical for high-turnover cannabis workforces; UKG Ready tracks Section 1 and 2 completion and re-verification dates
- State cannabis employee license/badge: store badge number, issue date, expiration via custom employee fields; set up alerts for expiring badges
- Background check integrations: Checkr, Sterling, others supported via API
- Multi-jurisdiction compliance: each state has different cannabis labor requirements — must be reviewed state by state

### Payroll
- Cash-adjacent payroll documentation: UKG Ready's payroll audit trail and pay stub records support documentation requirements
- Tip and commission handling for retail/dispensary roles via custom earning codes
- Multiple EINs (if operating separate license entities) can be managed in one instance

### Time & Scheduling
- Shift-based workforce with position-specific scheduling (budtender, cultivation, extraction, management)
- Open shift management for variable labor demand
- Custom job codes to distinguish workforce segments for seed-to-sale alignment
- Predictive scheduling configuration per location where required

### Onboarding
- State badge/license upload step in onboarding workflow
- State-specific new hire paperwork by location (configurable onboarding task lists per location)

---

## 6. Implementation: What Good Looks Like

### Implementation Phases (typical)
1. **Discovery & Configuration Design** — document current state, map org structure, define pay rules, identify integrations
2. **System Build** — configure company setup, org structure, pay rules, earning/deduction codes, user roles, onboarding workflows
3. **Parallel Payroll** — run new system alongside current payroll to validate output before go-live
4. **Testing** — HR workflows, manager self-service, onboarding, benefits enrollment, reporting
5. **Training** — HR admins, payroll admins, managers, employees (self-service)
6. **Go-Live** — first live payroll run, first active onboarding, benefits enrollment (if applicable)
7. **Post Go-Live Support** — first 90 days: config gaps surface, manager habits form, report needs clarify

### Common Implementation Failures
- **Under-configured go-live:** rushing to hit a date; pay rules incomplete, cost centers wrong, reporting not set up
- **No parallel payroll:** going live on new payroll without validating against existing system
- **Manager training skipped:** platform is live, managers have never seen it; self-service adoption fails
- **Partner disappears at go-live:** no post-launch support; issues compound with no help
- **Benefits not tested before open enrollment:** life event logic untested, eligibility rules stale

### What to Demand from an Implementation Partner
- Named implementation lead accessible before go-live
- Defined go-live criteria (not just a date — specific checklists)
- Parallel payroll run included in scope
- Manager training scheduled, not optional
- 90-day post-launch check-in as a standard deliverable
- Willingness to flex milestone dates when client is not ready

---

## 7. Common Post-Go-Live Issues and Fixes

| Issue | Root Cause | Fix |
|---|---|---|
| OT calculated incorrectly | Wrong pay rule assigned to employee | Audit pay rule assignments; correct and retroactive adjust if needed |
| Reports export to Excel, nobody uses dashboards | Dashboard never configured post-go-live | Build role-specific dashboard with 3–5 key widgets; retrain managers |
| New hires stuck in onboarding | Task assigned to role that doesn't exist or wrong email domain | Audit onboarding task routing; fix role assignments |
| Benefits deductions wrong after open enrollment | Plan rates not updated or employee enrolled in wrong tier | Audit enrollment data; run deduction audit report pre-payroll |
| Managers can't see their team | Manager scope not configured correctly | Audit manager-employee relationships in org structure |
| GL export not matching | Account codes mapped to wrong earning/deduction codes | Re-map GL in payroll settings; rerun export for affected periods |
| Cost centers not showing in reports | Cost centers not assigned to positions or employees | Audit position and employee cost center assignments |

---

## 8. Integrations

UKG Ready supports integrations via:
- **UKG Marketplace:** pre-built integrations with 300+ vendors (benefits brokers, background check, LMS, ERP, etc.)
- **APIs:** REST API for custom integrations; used for HRIS-to-HRIS, benefits carrier feeds, payroll GL feeds
- **SFTP file-based:** EDI 834 benefits carrier feeds, retirement plan contribution files

**Common integrations:**
- Benefits carriers (BCBS, Cigna, Aetna, etc.) — EDI 834
- 401k / retirement providers (Fidelity, Principal, Voya) — contribution file
- Background check (Checkr, Sterling)
- ATS (if not using UKG native recruiting)
- Accounting / ERP (QuickBooks, Sage Intacct, NetSuite) — GL export
- Identity providers (SSO via SAML — Okta, Azure AD)
- Paycom, Paylocity, ADP (data migration from prior systems)

---

## 9. UKG Bryte AI

UKG Bryte AI is UKG's embedded AI layer across the UKG Ready platform. It is not a standalone chatbot — it is workforce productivity embedded in existing workflows.

**Key capabilities:**
- **HR question deflection:** Employees ask Bryte common HR questions (PTO balance, pay stub, benefits info) without going to HR
- **Manager reporting assistance:** Natural language queries against workforce data ("Show me overtime by department this month")
- **Document intelligence:** Summarize policy documents; answer questions from uploaded HR docs
- **Scheduling recommendations:** AI-assisted schedule suggestions based on historical demand and coverage requirements
- **Performance insights:** Surfacing engagement and performance signals for managers
- **Recruiting:** AI-assisted job description writing, candidate screening summaries

**ROI framing areas:**
- HR ticket/call deflection (quantify HR team hours spent answering routine questions)
- Manager reporting time saved
- Recruiting efficiency (time-to-fill, screening hours)
- Overtime reduction via smarter scheduling
- Compliance risk reduction via document management

---

## 10. Competitive Context

| Platform | Best for | UKG Ready advantage |
|---|---|---|
| Paycom | Single-database mid-market | UKG Ready stronger in time/scheduling depth; Paycom stronger in self-service UX |
| Paylocity | Engagement-forward mid-market | UKG Ready stronger in time/scheduling; Paylocity stronger in social/engagement features |
| ADP Workforce Now | Large mid-market / enterprise | UKG Ready simpler to configure; ADP stronger in enterprise scale |
| Rippling | Tech-forward SMB | UKG Ready stronger in time/compliance depth; Rippling stronger in IT/device management |
| Bamboo HR | Small business / light HCM | UKG Ready full-suite including payroll; BambooHR no native payroll |
| Gusto | SMB payroll-first | UKG Ready stronger in time/scheduling/compliance; Gusto simpler for very small orgs |

---

## 11. Glossary

- **ACA:** Affordable Care Act — employer mandate tracking and 1094/1095 filing in UKG Ready
- **ATS:** Applicant Tracking System — recruiting module
- **EDI 834:** Electronic benefits enrollment file sent to carriers
- **EIN:** Employer Identification Number — each legal entity payroll runs under
- **FLSA:** Fair Labor Standards Act — federal overtime law; UKG Ready pay rules must comply
- **GL:** General Ledger — accounting export from payroll
- **Pay Group:** A set of employees who run payroll together on the same schedule
- **Pay Rule:** Configuration that defines how hours convert to pay (OT, differentials, breaks)
- **PAGA:** Private Attorneys General Act — California law; makes CA labor compliance particularly high-stakes
- **SUI/SUTA:** State Unemployment Insurance — state-specific rate entered per company in payroll setup
- **Self-Service:** Employee or manager actions taken directly in UKG Ready without HR involvement (PTO requests, pay stub access, time-off approvals, etc.)
- **Parallel Payroll:** Running new system alongside existing payroll to validate output before cutting over
- **Go-Live:** First live payroll run and/or first employees actively using the system
- **DOA (Dead on Arrival):** Industry term for a technically live implementation that isn't actually configured or working correctly

---

## 12. Quick Reference — Questions This GPT Can Help With

- How does UKG Ready handle [specific payroll scenario]?
- What's the right way to configure [pay rules / OT / benefits / onboarding] for [situation]?
- What does the implementation process look like and what should we expect?
- How do we handle multi-state employees in UKG Ready?
- What integrations are available for [specific vendor]?
- What are the cannabis-specific configuration considerations?
- How should we set up org structure for [company type]?
- What reports are available for [HR / payroll / time / benefits]?
- What questions should we ask an implementation partner before signing?
- How do we fix [common post-go-live issue]?

---

*Document version: October 2026*
*For internal use by Mosaic HCM and Evolve HCM teams*
