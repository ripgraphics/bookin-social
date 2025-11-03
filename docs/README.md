# BOOKIN.social - Documentation Index

## 🚨 CRITICAL DOCUMENTS

### **MUST READ BEFORE ANY DATABASE WORK:**
📘 **[MIGRATION_STANDARD_PROCEDURE.md](./MIGRATION_STANDARD_PROCEDURE.md)**
- **READ THIS FIRST** before running any database migrations
- Defines the ONLY approved way to run migrations
- Prevents wasted time with trial-and-error

---

## Property Management System (PMS)

### Implementation Documentation
- **[PMS_IMPLEMENTATION_COMPLETE.md](./PMS_IMPLEMENTATION_COMPLETE.md)** - Phase 1 completion summary
- **[property-management-system.md](./property-management-system.md)** - Complete system overview
- **[pms-implementation-status.md](./pms-implementation-status.md)** - Current implementation status
- **[pms-phase1-summary.md](./pms-phase1-summary.md)** - Phase 1 detailed summary
- **[pms-quick-start.md](./pms-quick-start.md)** - Quick start guide for testing

### Migration Scripts
- `scripts/applyPMSMigration.js` - Apply PMS database migration
- `scripts/verifyPMSTables.js` - Verify PMS tables created
- `scripts/testPMSEndpoints.js` - API endpoints reference

---

## General Documentation

### Setup & Configuration
- **[supabase-setup.md](./supabase-setup.md)** - Supabase configuration guide

### Development
- **[info.md](./info.md)** - Development notes and error logs

---

## Quick Links

### For Database Migrations
1. Read: [MIGRATION_STANDARD_PROCEDURE.md](./MIGRATION_STANDARD_PROCEDURE.md)
2. Create migration script following the template
3. Run: `node scripts/yourMigration.js`

### For PMS Development
1. Start here: [PMS_IMPLEMENTATION_COMPLETE.md](./PMS_IMPLEMENTATION_COMPLETE.md)
2. API testing: [pms-quick-start.md](./pms-quick-start.md)
3. System overview: [property-management-system.md](./property-management-system.md)

---

## File Organization

```
docs/
├── README.md (this file)
├── MIGRATION_STANDARD_PROCEDURE.md ⚠️ CRITICAL
├── PMS_IMPLEMENTATION_COMPLETE.md
├── property-management-system.md
├── pms-implementation-status.md
├── pms-phase1-summary.md
├── pms-quick-start.md
├── supabase-setup.md
└── info.md

scripts/
├── applyPMSMigration.js
├── verifyPMSTables.js
├── testPMSEndpoints.js
└── [other migration scripts...]

supabase/
└── migrations/
    ├── 0030_property_management_system.sql
    └── [other migrations...]
```

---

## Migration History

| Migration | File | Script | Status |
|-----------|------|--------|--------|
| Property Management System | `0030_property_management_system.sql` | `applyPMSMigration.js` | ✅ Applied |
| Enterprise Apps Schema | `0009_enterprise_apps_schema.sql` | `applyEnterpriseSchema.js` | ✅ Applied |
| [Previous migrations...] | ... | ... | ✅ Applied |

---

*Last Updated: 2025-11-02*

