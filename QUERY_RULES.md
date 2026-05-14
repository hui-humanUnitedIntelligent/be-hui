# HUI Query Rules — NEVER BREAK THESE

## Rule 1: Pure async/await ONLY for Supabase queries

```js
// ✅ CORRECT
const { data, error } = await supabase
  .from('works')
  .select('id,title,price')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .limit(20);

// ❌ WRONG — .then() mixed with query builder
supabase.from('works').select('*').then(r => r.data);

// ❌ WRONG — query builder methods inside .then() callback
supabase.from('works').select('*').then(({ data }).limit(20) => {});

// ❌ WRONG — nested .then() chains
supabase.from('a').select('*').then(({ data }) => {
  supabase.from('b').select('*').then(({ data: d2 }) => { ... });
});
```

## Rule 2: Parallel queries → Promise.all with await

```js
// ✅ CORRECT — pure async/await parallel
const [profileRes, worksRes] = await Promise.all([
  supabase.from('profiles').select('id,display_name').eq('id', uid).single(),
  supabase.from('works').select('id,title,price').eq('user_id', uid).limit(20),
]);
const profile = profileRes.data;
const works   = worksRes.data || [];

// ❌ WRONG — mixing await Promise.all with .then() inside
const [a, b] = await Promise.all([
  supabase.from('profiles').select('*').then(r => r.data),  // ← forbidden
  supabase.from('works').select('*').then(r => r.data),     // ← forbidden
]);
```

## Rule 3: useEffect with async → use async IIFE

```js
// ✅ CORRECT
useEffect(() => {
  if (!userId) return;
  (async () => {
    const { data } = await supabase.from('profiles').select('id,name').eq('id', userId).single();
    setProfile(data);
  })();
}, [userId]);

// ❌ WRONG — async directly on useEffect callback
useEffect(async () => {   // React ignores the returned Promise
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
}, [userId]);
```

## Rule 4: All queries go through /services/db.js

```js
// ✅ CORRECT — use service layer
import { ProfileService } from '../services/db';
const { data } = await ProfileService.getById(userId);

// ❌ WRONG — direct supabase in component
const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
```

## Rule 5: No select("*") — always explicit fields

```js
// ✅ CORRECT
.select('id,title,price,category,status,created_at')

// ❌ WRONG
.select('*')
```

## Rule 6: Always add .limit() to list queries

```js
// ✅ CORRECT
.select('id,title').order('created_at', {ascending:false}).limit(50)

// ❌ WRONG — no limit = unbounded query
.select('id,title').order('created_at', {ascending:false})
```

## Rule 7: Always handle errors

```js
// ✅ CORRECT
const { data, error } = await supabase.from('works').select('id,title').limit(20);
if (error) { console.error('[HUI]', error.message); return; }

// ❌ WRONG — silent failure
const { data } = await supabase.from('works').select('id,title');
```
