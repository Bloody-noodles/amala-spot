# API Specification

Proposed routes; final request/response schemas must be captured in code and tests before the API is considered stable.

| Method | Route | Purpose |
|---|---|---|
| GET | /api/categories | Visible categories |
| GET | /api/menu | List, search, and filter items |
| GET | /api/menu/[slug] | Item details |
| GET | /api/menu/[id]/availability | Current availability |
| GET | /api/menu/[id]/modifiers | Valid modifiers |
| POST | /api/cart/validate | Revalidate cart and calculate totals |
| POST | /api/orders | Create demonstration order |
| GET | /api/orders/[reference] | Protected order lookup |
| POST | /api/assistant/chat | Gemini conversation and approved tool execution |

Admin routes must enforce authentication and role checks on the server. Never trust client-supplied prices or totals. Use Zod schemas and safe error responses.
