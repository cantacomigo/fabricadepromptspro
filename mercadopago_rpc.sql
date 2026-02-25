CREATE EXTENSION IF NOT EXISTS http;

-- 1.5 Insert VIP Prompt for Subscription payment tracking
INSERT INTO prompts (id, title, description, prompt_text, price, category, image_url)
VALUES ('00000000-0000-0000-0000-000000000001', 'Assinatura VIP PRO', 'Acesso ilimitado por 30 dias', 'VIP', 49.90, 'VIP', 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (id) DO NOTHING;

-- 2. Create the preference creation function
CREATE OR REPLACE FUNCTION create_mp_preference_rpc(
  arg_items jsonb,
  arg_success_url text,
  arg_failure_url text,
  arg_purchase_id text
) RETURNS jsonb AS $$
DECLARE
  resp http_response;
  access_token text := 'APP_USR-6736974007209606-022515-2315816c91bbb8511521cd9a54012b24-1240474199'; -- Your Production Token
  pref_body jsonb;
BEGIN
  -- Build the Mercado Pago Preference body
  pref_body := jsonb_build_object(
    'items', arg_items,
    'back_urls', jsonb_build_object(
      'success', arg_success_url,
      'failure', arg_failure_url,
      'pending', arg_success_url
    ),
    'auto_return', 'approved',
    'statement_descriptor', 'FABRICA PROMPTS',
    'external_reference', arg_purchase_id
  );

  -- Execute the POST request
  SELECT * INTO resp FROM http_post(
    'https://api.mercadopago.com/checkout/preferences',
    pref_body::text,
    'application/json',
    ARRAY[http_header('Authorization', 'Bearer ' || access_token)]
  );

  -- Return the response content
  RETURN resp.content::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a status check function
CREATE OR REPLACE FUNCTION check_mp_payment_status_rpc(
  arg_payload jsonb
) RETURNS jsonb AS $$
DECLARE
  resp http_response;
  access_token text := 'APP_USR-6736974007209606-022515-2315816c91bbb8511521cd9a54012b24-1240474199';
  payment_data jsonb;
  search_url text;
BEGIN
  -- Search priority: 
  -- 1. By preference_id (used for subscriptions and new multi-item carts)
  -- 2. By external_reference (legacy/individual purchases)
  
  IF (arg_payload->>'preference_id' IS NOT NULL) THEN
    search_url := 'https://api.mercadopago.com/v1/payments/search?preference_id=' || (arg_payload->>'preference_id');
  ELSIF (arg_payload->>'purchase_id' IS NOT NULL) THEN
    search_url := 'https://api.mercadopago.com/v1/payments/search?external_reference=' || (arg_payload->>'purchase_id');
  ELSE
    RETURN jsonb_build_object('status', 'error', 'message', 'No valid ID provided for search');
  END IF;

  -- Execute the GET request
  SELECT * INTO resp FROM http_get(
    search_url,
    ARRAY[http_header('Authorization', 'Bearer ' || access_token)]
  );

  payment_data := resp.content::jsonb;

    -- If there's an approved payment, update the purchase record
    IF (payment_data->'results'->0->>'status' = 'approved') THEN
        -- Safely determine which preference_id to use for updating
        DECLARE
          found_pref_id text := COALESCE(arg_payload->>'preference_id', payment_data->'results'->0->>'preference_id');
          found_payment_id text := payment_data->'results'->0->>'id';
        BEGIN
            -- Update by Preference ID (covers multi-item and subscriptions)
            IF found_pref_id IS NOT NULL THEN
                UPDATE purchases
                SET status = 'confirmed', mp_payment_id = found_payment_id
                WHERE mp_preference_id = found_pref_id OR id = (arg_payload->>'purchase_id');
            ELSE
                -- Fallback to Purchase ID
                UPDATE purchases
                SET status = 'confirmed', mp_payment_id = found_payment_id
                WHERE id = (arg_payload->>'purchase_id');
            END IF;

            -- Subscription Activation Logic
            IF EXISTS (
                SELECT 1 FROM purchases
                WHERE (mp_preference_id = found_pref_id OR id = (arg_payload->>'purchase_id'))
                AND prompt_id = '00000000-0000-0000-0000-000000000001'
            ) THEN
                PERFORM public.activate_subscription(
                    (SELECT user_id FROM purchases WHERE (mp_preference_id = found_pref_id OR id = (arg_payload->>'purchase_id')) LIMIT 1),
                    found_payment_id,
                    30
                );
            END IF;
        END;

        RETURN jsonb_build_object('status', 'approved', 'id', payment_data->'results'->0->>'id');
    END IF;

    -- If no results but no error, it's just pending
    IF (jsonb_array_length(payment_data->'results') = 0) THEN
        RETURN jsonb_build_object('status', 'pending', 'debug_search_url', search_url);
    END IF;

    RETURN jsonb_build_object('status', 'pending', 'raw_res', payment_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
