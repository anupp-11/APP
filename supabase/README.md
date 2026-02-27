# ChimeTracker Supabase Backend

## Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to Supabase Auth |
| `chime_accounts` | Chime accounts with per-account limits |
| `payment_platforms` | External payment platforms |
| `games` | Games/apps for transaction reference |
| `transactions` | Core transaction records |

### Key Features

1. **Per-Account Configurable Limits**
   - `monthly_in_limit` - Maximum deposits per month
   - `monthly_out_limit` - Maximum withdrawals per month
   - `atm_withdrawal_enabled` - Only for holding accounts

2. **Soft Delete** - All deletions use `deleted_at` + `deleted_by` columns

3. **UTC Timestamps** - All timestamps stored in UTC

4. **Money Precision** - `NUMERIC(12,2)` for all monetary values

---

## Setup Instructions

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run Migrations

```bash
# Option A: Using Supabase CLI
cd supabase
supabase db push

# Option B: Run manually in SQL Editor
# 1. Run migrations/001_schema.sql
# 2. Run migrations/002_rls_policies.sql
# 3. Run migrations/003_rpc_functions.sql
# 4. Run seed.sql (optional, for test data)
```

### 3. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Create Initial Admin User

1. Sign up a user through your app or Supabase Auth UI
2. Get their user ID from `auth.users`
3. Insert their profile:

```sql
INSERT INTO profiles (user_id, role, name)
VALUES ('your-auth-user-id', 'admin', 'Admin Name');
```

---

## RLS Policies Summary

| Role | profiles | chime_accounts | payment_platforms | games | transactions |
|------|----------|----------------|-------------------|-------|--------------|
| Admin | FULL | FULL | FULL | FULL | FULL |
| Operator | Read own | Read active | Read active | Read active | Read all, Insert own, Update/Delete own |

---

## RPC Functions

### `create_transaction_with_limit_check`

**Purpose:** Create a transaction with server-side limit enforcement

**Parameters:**
```typescript
{
  p_direction: 'deposit' | 'withdraw',
  p_amount: number,
  p_source_type: 'chime' | 'platform',
  p_chime_account_id?: string,
  p_payment_platform_id?: string,
  p_game_id?: string,
  p_withdraw_subtype?: 'normal' | 'atm',
  p_notes?: string
}
```

**Returns:**
```typescript
{
  success: boolean,
  transaction_id?: string,
  error?: string,
  message: string,
  // If LIMIT_EXCEEDED:
  current_total?: number,
  limit?: number,
  remaining?: number,
  requested?: number
}
```

**Validations:**
- Amount must be > 0
- Deposits require a game
- Chime transactions check monthly limits
- ATM withdrawals require `atm_withdrawal_enabled = true` on holding accounts
- All referenced entities must exist and be active

### `soft_delete_transaction`

**Purpose:** Soft delete a transaction (operators can only delete their own)

### `get_quick_transaction_data`

**Purpose:** Single call to fetch all data for Quick Transaction form

**Returns:** Chime accounts with totals, platforms, games

### `get_today_summary`

**Purpose:** Today's transaction totals

### `get_monthly_account_summary`

**Purpose:** Detailed monthly breakdown per account

---

## Indexes

| Index | Purpose |
|-------|---------|
| `idx_transactions_chime_monthly` | Fast monthly aggregates by account |
| `idx_transactions_today` | Today's transactions query |
| `idx_transactions_operator` | Operator's own transactions |
| `idx_transactions_chime_month_sum` | Monthly sum calculations |

---

## Usage Examples

### Quick Transaction Submit

```typescript
import { submitTransaction } from '@/lib/supabase';

const result = await submitTransaction({
  direction: 'deposit',
  amount: 50.00,
  sourceType: 'chime',
  chimeAccountId: 'uuid-here',
  gameId: 'game-uuid',
  notes: 'Customer deposit',
});

if (result.success) {
  console.log('Transaction ID:', result.transaction_id);
} else {
  console.error('Error:', result.error, result.message);
}
```

### Fetch Form Data

```typescript
import { fetchQuickTransactionData } from '@/lib/supabase';

const { data, error } = await fetchQuickTransactionData();

// data.chime_accounts - accounts with current_month_in/out
// data.payment_platforms - active platforms
// data.games - active games
```

### Using React Hook

```typescript
import { useQuickTransactionData, useSubmitTransaction } from '@/hooks/useSupabase';

function QuickTransactionForm() {
  const { data, loading, refetch } = useQuickTransactionData();
  const { submit, loading: submitting, result } = useSubmitTransaction();
  
  // ...
}
```

---

## Security Notes

1. **Limit enforcement is server-side** - The `create_transaction_with_limit_check` RPC validates limits, not just the client

2. **RLS is always on** - Even if client tries direct insert, RLS policies apply

3. **Soft delete only** - No hard deletes for transactions (audit trail)

4. **Operators can't edit others' transactions** - RLS policy enforces this

5. **Admins have full access** - Use admin accounts carefully

---

## File Structure

```
supabase/
├── migrations/
│   ├── 001_schema.sql         # Tables, indexes, views
│   ├── 002_rls_policies.sql   # Row Level Security
│   └── 003_rpc_functions.sql  # Server functions
├── seed.sql                   # Test data
├── example_queries.sql        # Query reference
└── config.toml                # Supabase config

lib/supabase/
├── client.ts                  # Browser client
├── server.ts                  # Server client
├── database.types.ts          # TypeScript types
├── api.ts                     # API wrapper functions
└── index.ts                   # Exports

hooks/
└── useSupabase.ts             # React hooks
```
