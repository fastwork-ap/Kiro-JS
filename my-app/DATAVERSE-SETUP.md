# Dataverse Setup — Cascading Intake Form

This document describes the Dataverse tables, columns, and relationships needed to
back the cascading dropdowns in the React intake form:

```
Discipline  →  Project Category (filtered by Discipline)  →  Baseline (filtered by Project Category)
```

The form uses **model (A)**: one lookup per level, forming a chain. Because each
Project Category belongs to exactly one Discipline, filtering Baseline by the
selected Project Category implicitly respects the chosen Discipline as well. No
redundant Discipline lookup is needed on Baseline.

> If a Project Category can belong to more than one Discipline (many-to-many),
> this model needs to change — tell the developer and switch to model (B)
> (add a direct Discipline lookup on Baseline).

---

## Tables

Create these in the Power Apps maker portal (make.powerapps.com) → your solution →
New → Table. Use a consistent publisher prefix (shown here as `cr123_` — replace
with your environment's prefix).

### 1. Discipline (parent)

| Column (Display)   | Type           | Notes                          |
|--------------------|----------------|--------------------------------|
| Name               | Text (Primary) | e.g. "Electrical", "Mechanical"|
| (system columns)   | —              | Id, Created On, etc. automatic |

Logical table name example: `cr123_discipline`
Primary column logical name example: `cr123_name`

### 2. Project Category (child of Discipline)

| Column (Display)   | Type                     | Notes                                   |
|--------------------|--------------------------|-----------------------------------------|
| Name               | Text (Primary)           | e.g. "New Build", "Retrofit"            |
| Discipline         | Lookup → Discipline      | **Required.** This is the cascade link. |

Logical table name example: `cr123_projectcategory`
Lookup column logical name example: `cr123_disciplineid`
→ The Web API foreign-key field is `_cr123_disciplineid_value`

### 3. Baseline (child of Project Category)

| Column (Display)   | Type                          | Notes                                   |
|--------------------|-------------------------------|-----------------------------------------|
| Name               | Text (Primary)                | e.g. "Baseline 2026 Q1"                 |
| Project Category   | Lookup → Project Category     | **Required.** This is the cascade link. |

Logical table name example: `cr123_baseline`
Lookup column logical name example: `cr123_projectcategoryid`
→ The Web API foreign-key field is `_cr123_projectcategoryid_value`

### 4. (Optional) Intake Request — the record the form submits

If the form also saves a submission, create a table to hold it:

| Column (Display)   | Type                          |
|--------------------|-------------------------------|
| Title              | Text (Primary)                |
| Discipline         | Lookup → Discipline           |
| Project Category   | Lookup → Project Category     |
| Baseline           | Lookup → Baseline             |
| Description        | Multiline Text                |
| Request Status     | Choice: Draft / Pending L1 Approval / Pending L2 Approval / Approved / Declined by L1 Approver / Declined by L2 Approver |

---

## Relationships (summary)

- Discipline **1 : N** Project Category   (via `cr123_disciplineid` on Project Category)
- Project Category **1 : N** Baseline      (via `cr123_projectcategoryid` on Baseline)

Creating the Lookup columns above automatically creates these 1:N relationships.

---

## How the cascade queries work (Web API / OData)

Once the data source is added to the code app, the generated SDK issues filtered
reads equivalent to:

```
# All disciplines (load on mount)
GET /cr123_disciplines

# Categories for the selected discipline
GET /cr123_projectcategories?$filter=_cr123_disciplineid_value eq {disciplineId}

# Baselines for the selected category
GET /cr123_baselines?$filter=_cr123_projectcategoryid_value eq {projectCategoryId}
```

The React form maps each selection to the next query and resets downstream
dropdowns when a parent changes.

---

## Connecting the code app to these tables

1. Enable Code apps for the environment (Admin Center → Settings → Product → Features).
2. From `my-app/`, run `pa app init` (interactive sign-in) to link the app to the environment.
3. Add the Dataverse tables as data sources (the SDK generates typed TypeScript models).
4. Replace the local `cascadeData` model in `src/services/cascadeData.ts` with calls
   to the generated Dataverse services. The field names in `src/services/types.ts`
   are already aligned to the structure above to keep that swap small.
