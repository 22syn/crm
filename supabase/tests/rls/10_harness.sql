-- Test harness: run one statement as a given persona, record pass/fail, report at the end.
--
-- Each statement runs inside a subtransaction that is always rolled back, so writes made by
-- one check (a delete, an insert) never leak into the next check, and the role / JWT claims
-- switch back to the test owner afterwards.

CREATE SCHEMA rls_test;

CREATE TABLE rls_test.personas (
  name    text PRIMARY KEY,
  user_id uuid,         -- NULL = anonymous visitor
  db_role text NOT NULL -- the Postgres role PostgREST would use for this caller
);

CREATE TABLE rls_test.results (
  n       serial PRIMARY KEY,
  persona text,
  name    text NOT NULL,
  passed  boolean NOT NULL,
  detail  text
);

-- Runs _sql as _persona. SELECTs report the number of rows returned; other statements the
-- number of rows they changed. Errors are caught and returned instead of aborting the run.
-- _db_role overrides the persona's role (used to test a trigger with table privileges out of
-- the way).
CREATE FUNCTION rls_test.try_as(
  _persona text, _sql text, _db_role text DEFAULT NULL,
  OUT row_count bigint, OUT err_state text, OUT err_message text
)
LANGUAGE plpgsql AS $$
DECLARE
  p rls_test.personas;
  claims jsonb;
BEGIN
  SELECT * INTO STRICT p FROM rls_test.personas WHERE name = _persona;
  claims := CASE
    WHEN p.user_id IS NULL THEN jsonb_build_object('role', 'anon')
    ELSE jsonb_build_object('sub', p.user_id, 'role', 'authenticated')
  END;

  BEGIN
    PERFORM set_config('request.jwt.claims', claims::text, true);
    EXECUTE format('SET LOCAL ROLE %I', coalesce(_db_role, p.db_role));
    -- Run the statement as written (not wrapped in count(*), which lets the planner skip
    -- evaluating functions in the select list) and read how many rows it produced.
    EXECUTE _sql;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE EXCEPTION 'rls_test rollback' USING ERRCODE = 'RLSTR';
  EXCEPTION
    WHEN SQLSTATE 'RLSTR' THEN
      NULL;
    WHEN OTHERS THEN
      row_count := NULL;
      err_state := SQLSTATE;
      err_message := SQLERRM;
  END;
END $$;

CREATE FUNCTION rls_test.record(_persona text, _name text, _passed boolean, _detail text)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO rls_test.results (persona, name, passed, detail)
  VALUES (_persona, _name, coalesce(_passed, false), _detail);
$$;

CREATE FUNCTION rls_test.describe(r record) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF r.err_state IS NOT NULL THEN
    RETURN format('error %s: %s', r.err_state, r.err_message);
  END IF;
  RETURN format('%s row(s)', r.row_count);
END $$;

-- Passes when the statement succeeds and touches / returns exactly _expected rows.
CREATE FUNCTION rls_test.expect_rows(_persona text, _name text, _sql text, _expected bigint)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  r := rls_test.try_as(_persona, _sql);
  PERFORM rls_test.record(_persona, _name,
    r.err_state IS NULL AND r.row_count = _expected,
    format('expected %s row(s), got %s', _expected, rls_test.describe(r)));
END $$;

-- Passes when the statement succeeds and touches / returns at least one row.
CREATE FUNCTION rls_test.expect_some_rows(_persona text, _name text, _sql text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  r := rls_test.try_as(_persona, _sql);
  PERFORM rls_test.record(_persona, _name,
    r.err_state IS NULL AND r.row_count > 0,
    format('expected 1+ row(s), got %s', rls_test.describe(r)));
END $$;

-- Passes when the statement fails with _sqlstate (and, if given, a message matching
-- _message_like).
CREATE FUNCTION rls_test.expect_error(
  _persona text, _name text, _sql text, _sqlstate text,
  _message_like text DEFAULT NULL, _db_role text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  r := rls_test.try_as(_persona, _sql, _db_role);
  PERFORM rls_test.record(_persona, _name,
    r.err_state = _sqlstate AND (_message_like IS NULL OR r.err_message LIKE _message_like),
    format('expected error %s%s, got %s', _sqlstate,
      coalesce(' like "' || _message_like || '"', ''), rls_test.describe(r)));
END $$;

-- Prints every result and fails the run (non-zero psql exit) if any check failed.
CREATE FUNCTION rls_test.report() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  r rls_test.results;
  total int;
  failed int;
BEGIN
  FOR r IN SELECT * FROM rls_test.results ORDER BY n LOOP
    RAISE NOTICE '%', format('%s [%s] %s%s',
      CASE WHEN r.passed THEN 'ok  ' ELSE 'FAIL' END,
      coalesce(r.persona, '-'), r.name,
      CASE WHEN r.passed THEN '' ELSE ' -- ' || r.detail END);
  END LOOP;

  SELECT count(*), count(*) FILTER (WHERE NOT passed) INTO total, failed FROM rls_test.results;
  IF total = 0 THEN
    RAISE EXCEPTION 'RLS tests: no checks ran';
  END IF;
  IF failed > 0 THEN
    RAISE EXCEPTION 'RLS tests: % of % checks FAILED', failed, total;
  END IF;
  RAISE NOTICE 'RLS tests: all % checks passed', total;
END $$;
