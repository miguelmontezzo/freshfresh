ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS cooking_level text DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS max_active_cooking_minutes integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS meal_prep_days_per_week integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS has_microwave boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_stove boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_oven boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_air_fryer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_fridge boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_freezer boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS needs_portable_meals boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_reheat_away_from_home boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_meal_temperature text DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS shopping_frequency text DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS pantry_first boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS price_priority integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS convenience_priority integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS nutrition_priority integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS taste_priority integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS variety_priority integer DEFAULT 3;

CREATE TABLE IF NOT EXISTS user_price_reports (
  id bigserial PRIMARY KEY,
  auth_user_id text NOT NULL,
  product_id bigint NOT NULL REFERENCES grocery_products(id) ON DELETE CASCADE,
  retailer_id bigint REFERENCES retailers(id) ON DELETE SET NULL,
  retailer_location_id bigint REFERENCES retailer_locations(id) ON DELETE SET NULL,
  reported_price numeric NOT NULL CHECK (reported_price >= 0),
  package_size text, unit_price numeric,
  source_type text NOT NULL DEFAULT 'user_entered',
  receipt_image_url text, shelf_image_url text, notes text,
  purchased boolean DEFAULT false,
  reported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_price_reports_product_time ON user_price_reports(product_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_price_reports_location_time ON user_price_reports(retailer_location_id, reported_at DESC);
ALTER TABLE user_price_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_price_reports_insert_own ON user_price_reports FOR INSERT TO authenticated WITH CHECK (auth_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));
CREATE POLICY user_price_reports_read_all ON user_price_reports FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT ON user_price_reports TO authenticated;

ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY plan_items_owner ON plan_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM weekly_plans wp WHERE wp.id=plan_items.plan_id AND wp.auth_user_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))) WITH CHECK (EXISTS (SELECT 1 FROM weekly_plans wp WHERE wp.id=plan_items.plan_id AND wp.auth_user_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'sub')));
ALTER TABLE nutrition_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY nutrition_blocks_owner ON nutrition_blocks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM weekly_plans wp WHERE wp.id=nutrition_blocks.plan_id AND wp.auth_user_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))) WITH CHECK (EXISTS (SELECT 1 FROM weekly_plans wp WHERE wp.id=nutrition_blocks.plan_id AND wp.auth_user_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'sub')));

CREATE OR REPLACE VIEW product_price_community AS
SELECT product_id, retailer_location_id,
 percentile_cont(0.5) WITHIN GROUP (ORDER BY reported_price) AS median_recent_price,
 count(*) AS report_count, max(reported_at) AS last_reported_at
FROM user_price_reports WHERE reported_at >= now()-interval '30 days'
GROUP BY product_id, retailer_location_id;
