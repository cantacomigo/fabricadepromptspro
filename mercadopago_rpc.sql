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
  arg_purchase_id text
) RETURNS jsonb AS $$
DECLARE
  resp http_response;
  access_token text := 'APP_USR-6736974007209606-022515-2315816c91bbb8511521cd9a54012b24-1240474199';
  payment_data jsonb;
BEGIN
  -- Search for payments with this external_reference
  SELECT * INTO resp FROM http_get(
    'https://api.mercadopago.com/v1/payments/search?external_reference=' || arg_purchase_id,
    ARRAY[http_header('Authorization', 'Bearer ' || access_token)]
  );

  payment_data := resp.content::jsonb;

    -- If there's an approved payment, update the purchase record
    IF (payment_data->'results'->0->>'status' = 'approved') THEN
        -- Link the payment ID to ALL purchases with this preference ID
        UPDATE purchases
        SET
            status = 'confirmed',
            mp_payment_id = payment_data->'results'->0->>'id'
        WHERE mp_preference_id = (arg_payload->>'preference_id');

        -- Check if any of these purchases are for the VIP Subscription
        IF EXISTS (
            SELECT 1 FROM purchases
            WHERE mp_preference_id = (arg_payload->>'preference_id')
            AND prompt_id = '00000000-0000-0000-0000-000000000001'
        ) THEN
            -- Activate the subscription for the user
            -- Use the user_id from the first purchase found
            PERFORM public.activate_subscription(
                (SELECT user_id FROM purchases WHERE mp_preference_id = (arg_payload->>'preference_id') LIMIT 1),
                payment_data->'results'->0->>'id',
                30
            );
        END IF;

        RETURN jsonb_build_object('status', 'approved', 'id', payment_data->'results'->0->>'id');
    END IF;

  RETURN jsonb_build_object('status', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
