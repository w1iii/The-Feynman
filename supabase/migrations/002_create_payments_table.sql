-- Manual GCash payment tracking
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL, -- centavos (99000 = ₱990)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reference_number TEXT, -- GCash reference
  notes TEXT, -- admin notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID -- admin user_id
);

-- RLS: users see own payments, admins see all
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policy: service_role bypasses RLS, so admin API uses service key
-- No need for admin RLS policy — admin route uses service client

-- Index for admin queries
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
