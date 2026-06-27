**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)

---

## HUI Commerce 2.0

**Architecture Freeze:** Eine kanonische Commerce-Architektur.

### Kanonischer Checkout

`WerkeKorb` → `UnterstuetzenFlow` → `create-payment-intent` → Stripe → `handle-payment-webhook` → `orders.state = paid`

### Wichtige Dateien

| Bereich | Datei |
|---|---|
| Migration (Produktion) | `hui_057_commerce_schema_final.sql` |
| Commerce Service | `src/services/commerceEngine.js` |
| Deployment | `DEPLOY.md` |
| Migrationsübersicht | `supabase/MIGRATIONS_OVERVIEW.md` |
| Runtime Status | `supabase/COMMERCE_RUNTIME_STATUS.md` |
| Cleanup (Phase 5) | `docs/COMMERCE_CLEANUP_LIST.md` |

### Env-Vars (Commerce)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

<!-- deploy trigger 1777973743 -->

