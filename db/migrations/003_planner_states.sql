-- Additive migration: existing profiles, prices and plans stay intact.
BEGIN;
CREATE TABLE IF NOT EXISTS public.planner_states (
  auth_user_id text PRIMARY KEY,
  state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object' AND octet_length(state::text) <= 200000),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.planner_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_states FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='planner_states' AND policyname='planner_state_owner') THEN
    CREATE POLICY planner_state_owner ON public.planner_states FOR ALL TO authenticated
      USING (auth_user_id = (current_setting('request.jwt.claims',true)::jsonb ->> 'sub'))
      WITH CHECK (auth_user_id = (current_setting('request.jwt.claims',true)::jsonb ->> 'sub'));
  END IF;
END $$;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.planner_states TO authenticated;
COMMIT;
