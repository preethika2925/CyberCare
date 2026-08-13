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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { action, doctorId, patientId, reason, otpCode } = await req.json();

    if (action === 'request') {
      if (!reason || reason.trim().length < 10) {
        return new Response(
          JSON.stringify({ error: 'Clinical emergency reason must be at least 10 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 6-digit emergency OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 300000).toISOString();

      await supabaseClient.from('otp_sessions').insert({
        user_id: doctorId,
        otp_code: generatedOtp,
        expires_at: expiresAt
      });

      await supabaseClient.from('audit_logs').insert({
        user_id: doctorId,
        action: 'EMERGENCY_BREAK_GLASS_REQUESTED',
        patient_id: patientId,
        status: 'WARNING',
        risk_score: 35,
        reason: `Emergency Break-Glass requested. Reason: ${reason}`
      });

      return new Response(
        JSON.stringify({ message: 'EMERGENCY_OTP_REQUIRED', demoOtpCode: generatedOtp }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

      const { data: breakGlass, error } = await supabaseClient
        .from('break_glass_events')
        .insert({
          doctor_id: doctorId,
          patient_id: patientId,
          reason: reason,
          started_at: now.toISOString(),
          expires_at: expiresAt,
          status: 'ACTIVE',
          otp_verified: true
        })
        .select()
        .single();

      if (error) throw error;

      await supabaseClient.from('audit_logs').insert({
        user_id: doctorId,
        action: 'BREAK_GLASS_ACCESS_GRANTED',
        patient_id: patientId,
        status: 'EMERGENCY',
        risk_score: 50,
        reason: `Emergency 15-minute access granted. Reason: ${reason}`
      });

      await supabaseClient.from('security_events').insert({
        user_id: doctorId,
        event_type: 'EMERGENCY_BREAK_GLASS_ACTIVATED',
        risk_score: 50,
        classification: 'MEDIUM',
        details: `Activated Break-Glass for patient ID ${patientId}. Reason: ${reason}`
      });

      return new Response(
        JSON.stringify({ message: 'EMERGENCY_ACCESS_ACTIVATED', breakGlass }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
