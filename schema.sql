CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  flavour TEXT NOT NULL,
  pounds TEXT NOT NULL,
  required_date TEXT NOT NULL,
  required_time TEXT,
  fulfilment TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending confirmation',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
