// Edge function: delete-account
// Authenticated user requests erasure of their account & personal data.
// Anonymizes records that must be retained for legal/finance reasons,
// deletes user-owned content, then deletes the auth user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Anonymize records retained for legal/finance/audit reasons
    await admin
      .from("bookings")
      .update({ requirements: null, notes: null, location: null })
      .or(`client_id.eq.${userId},creator_id.eq.${userId}`);

    await admin
      .from("reviews")
      .update({ client_name: "Deleted user", client_avatar: null, review_text: "[removed]" })
      .eq("client_id", userId);

    await admin
      .from("payments")
      .update({})
      .or(`client_id.eq.${userId},creator_id.eq.${userId}`);

    // Delete user-owned content
    const userOwned = [
      "messages",
      "notifications",
      "shortlists",
      "portfolio_items",
      "services",
      "verification_requests",
      "availability_slots",
      "project_likes",
      "comment_likes",
      "project_comments",
      "collab_applications",
      "collab_projects",
      "projects",
      "subscriptions",
      "creator_profiles",
    ];

    for (const table of userOwned) {
      const filter =
        table === "creator_profiles"
          ? { col: "profile_id", val: userId }
          : table === "messages"
          ? null
          : table === "shortlists" || table === "subscriptions" || table === "notifications" ||
            table === "verification_requests" || table === "project_likes" ||
            table === "comment_likes" || table === "project_comments" ||
            table === "collab_applications"
          ? { col: "user_id", val: userId }
          : { col: "creator_id", val: userId };

      if (table === "messages") {
        await admin.from("messages").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      } else if (filter) {
        // collab_applications uses applicant_id, not user_id; portfolio/services/projects/availability_slots use creator_id
        const col =
          table === "collab_applications"
            ? "applicant_id"
            : table === "shortlists"
            ? "client_id"
            : filter.col;
        await admin.from(table).delete().eq(col, filter.val);
      }
    }

    // Mark profile as deleted and anonymize PII
    await admin
      .from("profiles")
      .update({
        name: "Deleted user",
        bio: null,
        avatar_url: null,
        cover_url: null,
        phone: null,
        website: null,
        city: null,
        state: null,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // Finally delete auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});