-- 1. Enable the HTTP extension (Requires Superuser or Dashboard SQL Editor)
CREATE EXTENSION IF NOT EXISTS http;

-- 1.5 Insert VIP Prompt for Subscription payment tracking
INSERT INTO prompts (id, title, description, prompt_text, price, category, image_url)
VALUES ('00000000-0000-0000-0000-000000000001', 'Assinatura VIP PRO', 'Acesso ilimitado por 30 dias', 'VIP', 49.90, 'VIP', 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (id) DO NOTHING;

-- 2. Create the preference creation function
CREATE OR REPLACE FUNCTION create_mp_preference_rpc(
  payload jsonb
) RETURNS jsonb AS $$
DECLARE
  resp http_response;
  access_token text := 'APP_USR-6736974007209606-022515-2315816c91bbb8511521cd9a54012b24-1240474199';
  pref_body jsonb;
BEGIN
  pref_body := jsonb_build_object(
    'items', payload->'items',
    'back_urls', jsonb_build_object(
      'success', payload->>'success_url',
      'failure', payload->>'failure_url',
      'pending', payload->>'success_url'
    ),
    'auto_return', 'approved',
    'statement_descriptor', 'FABRICA PROMPTS',
    'external_reference', payload->>'external_reference'
  );

  SELECT * INTO resp FROM http_post(
    'https://api.mercadopago.com/checkout/preferences',
    pref_body::text,
    'application/json',
    ARRAY[http_header('Authorization', 'Bearer ' || access_token)]
  );

  RETURN resp.content::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop old versions to avoid conflicts
DROP FUNCTION IF EXISTS check_mp_payment_status_rpc(text);
DROP FUNCTION IF EXISTS check_mp_payment_status_rpc(jsonb);

-- 4. Create the payment status check function
CREATE OR REPLACE FUNCTION check_mp_payment_status_rpc(
  payload jsonb
) RETURNS jsonb AS $$
DECLARE
  resp http_response;
  access_token text := 'APP_USR-6736974007209606-022515-2315816c91bbb8511521cd9a54012b24-1240474199';
  payment_data jsonb;
  search_url text;
  found_pref_id text;
  found_payment_id text;
BEGIN
  -- Build search URL based on available data
  IF (payload->>'preference_id' IS NOT NULL) THEN
    search_url := 'https://api.mercadopago.com/v1/payments/search?preference_id=' || (payload->>'preference_id');
  ELSIF (payload->>'purchase_id' IS NOT NULL) THEN
    search_url := 'https://api.mercadopago.com/v1/payments/search?external_reference=' || (payload->>'purchase_id');
  ELSE
    RETURN jsonb_build_object('status', 'error', 'message', 'No valid ID provided');
  END IF;

  -- Call Mercado Pago API
  SELECT * INTO resp FROM http_get(
    search_url,
    ARRAY[http_header('Authorization', 'Bearer ' || access_token)]
  );

  payment_data := resp.content::jsonb;

  -- Check if we got results
  IF (payment_data->'results' IS NULL OR jsonb_array_length(payment_data->'results') = 0) THEN
    RETURN jsonb_build_object('status', 'pending');
  END IF;

  -- Check if the first result is approved
  IF (payment_data->'results'->0->>'status' = 'approved') THEN
    found_pref_id := COALESCE(payload->>'preference_id', payment_data->'results'->0->>'preference_id');
    found_payment_id := payment_data->'results'->0->>'id';

    -- Confirm purchases by preference_id
    IF found_pref_id IS NOT NULL THEN
      UPDATE purchases
      SET status = 'confirmed', mp_payment_id = found_payment_id
      WHERE mp_preference_id = found_pref_id;
    END IF;

    -- Also confirm by external_reference (purchase_id) as fallback
    IF (payload->>'purchase_id' IS NOT NULL) THEN
      UPDATE purchases
      SET status = 'confirmed', mp_payment_id = found_payment_id
      WHERE id = (payload->>'purchase_id')::uuid;
    END IF;

    -- Auto-activate VIP subscription if applicable
    IF EXISTS (
      SELECT 1 FROM purchases
      WHERE mp_preference_id = found_pref_id
      AND prompt_id = '00000000-0000-0000-0000-000000000001'
      AND status = 'confirmed'
    ) THEN
      PERFORM public.activate_subscription(
        (SELECT user_id FROM purchases WHERE mp_preference_id = found_pref_id LIMIT 1),
        found_payment_id,
        30
      );
    END IF;

    RETURN jsonb_build_object('status', 'approved', 'id', found_payment_id);
  END IF;

  -- Payment exists but not yet approved
  RETURN jsonb_build_object('status', payment_data->'results'->0->>'status');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
