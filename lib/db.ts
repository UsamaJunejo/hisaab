// Database access. Production: Postgres via DATABASE_URL. Without it (dev & tests) an embedded
// Postgres (PGlite) is used, so the app runs with zero setup.
// Money is stored as whole paisa / cents in BIGINT columns.

export type Row = Record<string, unknown>;

export interface Db {
  q<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  country TEXT NOT NULL DEFAULT 'PK',
  dob DATE,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  level SMALLINT NOT NULL DEFAULT 3 CHECK (level IN (1, 2, 3)),
  currency TEXT NOT NULL DEFAULT 'PKR',
  date_format TEXT NOT NULL DEFAULT 'DD-MM-YYYY',
  time24 BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'en',
  show_name BOOLEAN NOT NULL DEFAULT true,
  show_email BOOLEAN NOT NULL DEFAULT true,
  show_phone BOOLEAN NOT NULL DEFAULT true,
  mpin_hash TEXT,
  photo BYTEA,
  photo_at TIMESTAMPTZ,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'yearly')),
  plan_until DATE NOT NULL DEFAULT (CURRENT_DATE + 14),
  data_mb INTEGER NOT NULL DEFAULT 25,
  referred_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nok_name TEXT, nok_email TEXT, nok_phone TEXT,
  nok_after_days INTEGER, nok_interval_days INTEGER, nok_times INTEGER,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Level 1: category. nature decides which report it belongs to.
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nature TEXT NOT NULL CHECK (nature IN ('Assets', 'Liabilities', 'Equity', 'Expenses', 'Income')),
  color TEXT NOT NULL DEFAULT '#000000',
  icon TEXT NOT NULL DEFAULT 'plus-circle',
  kind TEXT NOT NULL DEFAULT 'normal' CHECK (kind IN ('normal', 'payables', 'receivables')),
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- Level 2
CREATE TABLE IF NOT EXISTS subcategories (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#000000',
  icon TEXT NOT NULL DEFAULT 'plus-circle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subcategories_cat ON subcategories(category_id);

-- Level 3
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#000000',
  icon TEXT NOT NULL DEFAULT 'plus-circle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accounts_sub ON accounts(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- One voucher: moves amount FROM one account TO another.
-- vtype P = payment voucher, R = receipt voucher (only decides which list it appears in).
-- status: 3 = approved (counts). Entries a sharer makes in someone else's account start at 0 (sent)
-- and count for the owner only once approved (1 seen, 2 rejected, 3 approved).
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vtype CHAR(1) NOT NULL CHECK (vtype IN ('P', 'R')),
  date DATE NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  from_account_id INTEGER NOT NULL REFERENCES accounts(id),
  to_account_id INTEGER NOT NULL REFERENCES accounts(id),
  note TEXT,
  highlight TEXT,
  currency TEXT,
  foreign_amount BIGINT,
  rate NUMERIC(18, 6),
  status SMALLINT NOT NULL DEFAULT 3,
  transferred BOOLEAN NOT NULL DEFAULT false,
  transfer_of INTEGER REFERENCES entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  CHECK (from_account_id <> to_account_id)
);
CREATE INDEX IF NOT EXISTS idx_entries_from ON entries(from_account_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_to ON entries(to_account_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id, date);

CREATE TABLE IF NOT EXISTS entry_status_log (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  status SMALLINT NOT NULL,
  by_user INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_entry ON attachments(entry_id);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- An account shared by its owner with another user.
CREATE TABLE IF NOT EXISTS shares (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  shared_with INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write')),
  transfer_enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, shared_with)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('transaction', 'activity', 'alert')),
  ref_id INTEGER,
  text TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_licenses (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  number TEXT NOT NULL UNIQUE,
  package TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Paid', 'UnPaid', 'FREE')),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS funds (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('add', 'transfer', 'invoice', 'referral')),
  amount_cents INTEGER NOT NULL,
  method TEXT,
  remarks TEXT,
  payment_to TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fx_rates (
  day DATE NOT NULL,
  base TEXT NOT NULL,
  code TEXT NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (day, base, code)
);

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
`;

/** Changes after the first release go here, in order. Never edit an old one. */
export const MIGRATIONS: string[] = [
  // 2: group packages, contact-us messages
  `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;
   ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'monthly', 'yearly', 'group_monthly', 'group_yearly'));
   CREATE TABLE IF NOT EXISTS contact_messages (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     first_name TEXT NOT NULL, last_name TEXT, phone TEXT, email TEXT NOT NULL, company TEXT, message TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );`,
  // 3: Business Module (shop / restaurant): products, vendors, customers, purchases, sales, payments, stock
  `CREATE TABLE IF NOT EXISTS businesses (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name TEXT NOT NULL, address TEXT, phone TEXT, email TEXT, fax TEXT, tax_no TEXT, website TEXT, country TEXT,
     customers_sub_id INTEGER, vendors_sub_id INTEGER, walkin_account_id INTEGER, sales_account_id INTEGER, purchases_account_id INTEGER,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE TABLE IF NOT EXISTS biz_warehouses (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     name TEXT NOT NULL, address TEXT, city TEXT, state TEXT, zip TEXT, country TEXT, contact TEXT, email TEXT, phone TEXT, fax TEXT
   );
   CREATE TABLE IF NOT EXISTS biz_taxes (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     name TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('percent', 'amount')), rate NUMERIC(14, 3) NOT NULL, active BOOLEAN NOT NULL DEFAULT true
   );
   CREATE TABLE IF NOT EXISTS biz_discounts (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     name TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('percent', 'amount')), rate NUMERIC(14, 3) NOT NULL
   );
   CREATE TABLE IF NOT EXISTS biz_categories (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     name TEXT NOT NULL, parent_id INTEGER REFERENCES biz_categories(id) ON DELETE CASCADE
   );
   CREATE TABLE IF NOT EXISTS biz_products (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     category_id INTEGER REFERENCES biz_categories(id) ON DELETE SET NULL, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'Stock',
     barcode TEXT, sale_price BIGINT NOT NULL DEFAULT 0, purchase_price BIGINT NOT NULL DEFAULT 0, tax_id INTEGER REFERENCES biz_taxes(id) ON DELETE SET NULL,
     size TEXT, color TEXT, location TEXT, low_stock NUMERIC(14, 3) NOT NULL DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS biz_parties (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     kind TEXT NOT NULL CHECK (kind IN ('customer', 'vendor')), name TEXT NOT NULL, company TEXT, contact TEXT, email TEXT, address TEXT,
     city TEXT, state TEXT, country TEXT, tax_no TEXT, st_no TEXT, terms TEXT, account_id INTEGER NOT NULL REFERENCES accounts(id)
   );
   CREATE TABLE IF NOT EXISTS biz_docs (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     kind TEXT NOT NULL CHECK (kind IN ('purchase', 'sale', 'expense')), number TEXT NOT NULL, party_id INTEGER REFERENCES biz_parties(id),
     warehouse_id INTEGER REFERENCES biz_warehouses(id) ON DELETE SET NULL, expense_account_id INTEGER REFERENCES accounts(id),
     date DATE NOT NULL, subtotal BIGINT NOT NULL, discount BIGINT NOT NULL DEFAULT 0, tax BIGINT NOT NULL DEFAULT 0, total BIGINT NOT NULL,
     note TEXT, entry_id INTEGER REFERENCES entries(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE TABLE IF NOT EXISTS biz_doc_lines (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, doc_id INTEGER NOT NULL REFERENCES biz_docs(id) ON DELETE CASCADE,
     product_id INTEGER NOT NULL REFERENCES biz_products(id), qty NUMERIC(14, 3) NOT NULL CHECK (qty > 0), price BIGINT NOT NULL, total BIGINT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS biz_payments (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     kind TEXT NOT NULL CHECK (kind IN ('vendor', 'customer')), party_id INTEGER NOT NULL REFERENCES biz_parties(id), doc_id INTEGER REFERENCES biz_docs(id) ON DELETE SET NULL,
     date DATE NOT NULL, amount BIGINT NOT NULL CHECK (amount > 0), account_id INTEGER NOT NULL REFERENCES accounts(id), note TEXT,
     entry_id INTEGER REFERENCES entries(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS biz_docs_business ON biz_docs (business_id, kind, date);
   CREATE INDEX IF NOT EXISTS biz_lines_product ON biz_doc_lines (product_id);`,
];
export const LATEST_VERSION = MIGRATIONS.length + 1;

async function migrate(d: Db) {
  await d.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await d.tx(async (t) => {
    const [{ v: now }] = await t.q<{ v: number | null }>("SELECT MAX(version) AS v FROM schema_migrations");
    let version = now ?? 0;
    if (version === 0) {
      await t.exec(SCHEMA);
      await t.q("INSERT INTO schema_migrations (version) VALUES (1)");
      version = 1;
    }
    for (let next = version + 1; next <= LATEST_VERSION; next++) {
      await t.exec(MIGRATIONS[next - 2]);
      await t.q("INSERT INTO schema_migrations (version) VALUES ($1)", [next]);
    }
  });
}

type PgRunner = { query<R>(t: string, p?: unknown[]): Promise<{ rows: R[] }>; exec(t: string): Promise<unknown> };
type PGliteLike = PgRunner & { transaction<T>(fn: (tx: PgRunner) => Promise<T>): Promise<T> };

function wrapPglite(pg: PGliteLike): Db {
  const make = (runner: PgRunner, inTx: boolean): Db => ({
    q: async <T>(text: string, params: unknown[] = []) => (await runner.query<T>(text, params)).rows,
    tx: (fn) => (inTx ? fn(make(runner, true)) : pg.transaction((t) => fn(make(t, true)))),
    exec: async (sql) => void (await runner.exec(sql)),
  });
  return make(pg, false);
}

export async function openPglite(dataDir?: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const d = wrapPglite(new PGlite(dataDir) as unknown as PGliteLike);
  await migrate(d);
  return d;
}

async function openPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
    onnotice: () => {},
  });
  type Runner = { unsafe: (t: string, p?: unknown[]) => Promise<unknown> };
  const make = (runner: Runner, inTx: boolean): Db => ({
    q: async <T>(text: string, params: unknown[] = []) => (await runner.unsafe(text, params as never[])) as unknown as T[],
    tx: async <T>(fn: (db: Db) => Promise<T>) =>
      inTx ? fn(make(runner, true)) : ((await sql.begin((t) => fn(make(t as unknown as Runner, true)))) as T),
    exec: async (script) => void (await runner.unsafe(script)),
  });
  const d = make(sql as unknown as Runner, false);
  await migrate(d);
  return d;
}

const g = globalThis as unknown as { __db?: Promise<Db> };

export function db(): Promise<Db> {
  if (!g.__db) {
    const url = process.env.DATABASE_URL;
    if (!url && process.env.VERCEL) throw new Error("DATABASE_URL is not set");
    g.__db = (url ? openPostgres(url) : openPglite(process.env.PGLITE_DIR || "./data/pglite")).catch((e) => {
      g.__db = undefined;
      throw e;
    });
  }
  return g.__db;
}
