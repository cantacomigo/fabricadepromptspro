import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    const { action, data } = await req.json()

    // We only care about payment updates
    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id
      const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

      // 1. Fetch payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const paymentData = await mpResponse.json()

      if (paymentData.status === 'approved') {
        // 2. Initialize Supabase client with SERVICE ROLE KEY
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Find the purchase using mp_preference_id or metadata
        // MP preferences can store external_reference (we'll use this in mp-preference)
        const purchaseId = paymentData.external_reference

        if (purchaseId) {
          const { error } = await supabase
            .from('purchases')
            .update({
              status: 'confirmed',
              mp_payment_id: paymentId.toString()
            })
            .eq('id', purchaseId)

          if (error) throw error
          console.log(`Purchase ${purchaseId} confirmed via webhook.`)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
