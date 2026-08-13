import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { count: failedLogins } = await supabaseClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'FAILED_LOGIN_ATTEMPT');

    const { count: unauthorizedAttempts } = await supabaseClient
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT');

    const { count: breakGlassCount } = await supabaseClient
      .from('break_glass_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    const failedLoginsVal = failedLogins || 0;
    const unauthorizedVal = unauthorizedAttempts || 0;
    const breakGlassVal = breakGlassCount || 0;

    let riskScore = Math.min(100, (failedLoginsVal * 15) + (unauthorizedVal * 25) + (breakGlassVal * 20));
    let classification = 'LOW';
    if (riskScore > 80) classification = 'CRITICAL';
    else if (riskScore > 60) classification = 'HIGH';
    else if (riskScore > 30) classification = 'MEDIUM';

    const explainableReasons = [];
    if (failedLoginsVal > 0) explainableReasons.push(`Failed authentication attempts detected (${failedLoginsVal})`);
    if (unauthorizedVal > 0) explainableReasons.push(`Unauthorized cross-department access attempts (${unauthorizedVal})`);
    if (breakGlassVal > 0) explainableReasons.push(`Active Emergency Break-Glass override sessions (${breakGlassVal})`);
    if (explainableReasons.length === 0) explainableReasons.push('Standard operational access pattern');

    return new Response(
      JSON.stringify({
        riskScore,
        classification,
        isAnomaly: riskScore > 60,
        explainableReasons,
        recommendation: classification === 'CRITICAL' ? 'Account lock recommended' : (classification === 'HIGH' ? 'Enhanced audit monitoring' : 'No action required')
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
