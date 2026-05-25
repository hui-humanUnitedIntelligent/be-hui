# HUI Runtime Action Map

Canonical runtime authorities:

- Navigation: `src/core/hui.navigation.js` for route handoff, `HomeShell.switchTab()` for in-app tabs.
- Action dispatch: `src/core/hui.actions.js` plus `validateAction()` in `src/core/hui.contracts.js`.
- Overlays: `HomeShell.centralCloseFlow()` owns teardown across overlay booleans, `WorldSurfaceContext`, and `OrbWorldContext`.
- Flow memory: `createFlowStore()` in `src/core/hui.flow.js`.
- Publish/create flows: `Home.jsx` mounts the active flow after a validated action handoff.
- Viewer routing: `ProfileLauncher` is the canonical profile overlay renderer; route-level backs hand off to canonical routes.

Canonical action record:

```js
{
  actionId,
  source,
  target,
  entityType,
  entityId,
  route,
  runtimeEffect,
  requiresAuth,
}
```

Action audit summary:

| Area | Before | Status after hardening |
| --- | --- | --- |
| BottomNav tabs | Action engine and `onTab` both fired | Action return value gates fallback; active prop fixed |
| BottomNav Orb | `OPEN_ORB` and Home `onOrbAction` both opened state | `OPEN_ORB` is canonical; fallback only logs if dispatch fails |
| Notifications -> feed | Routed to invalid `home` tab | Routed to `feed` |
| Orb selector | Member path bypassed world/orb lifecycle | Opens `WorldSurface("orb")`, confirms on selector mount, closes via `CLOSE_ORB` |
| HuiPlusSheet | Mount timeout ran while invisible | Guard only runs while visible |
| Profile close/chat/book | Direct local setters | Routed through `CLOSE_PROFILE`, `OPEN_CHAT`, `OPEN_BOOKING` |
| Route back | Local `navigate(-1)` | `navigateCanonical()` handoff |
| Undefined actions | `OPEN_WERK`, `OPEN_MOMENT`, earnings/settings/manager | Defined centrally; UI callers for unavailable actions removed or deprecated |
| Noop buttons | Draft/media/legal/settings/booking-more placeholders | Removed or rendered only when a real handler exists |

Deprecated runtime paths:

- `HuiPlusSheet` / `OrbPortal` remains as legacy mounted fallback, but `OPEN_ORB` no longer opens it for the member create path.
- `OPEN_MOMENT`, `OPEN_CALENDAR`, `OPEN_EARNINGS`, `OPEN_EXPERIENCE_MANAGER`, and `OPEN_NOTIFICATIONS_SETTINGS` are contract-defined as deprecated/no-runtime actions and are no longer mounted from active UI.
- Direct route history back is deprecated in favor of `navigateCanonical()`.
- Local fallback callbacks on Home feed/discover/favorites are fallback-only and should not be used as primary navigation.
