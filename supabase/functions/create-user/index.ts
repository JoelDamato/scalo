import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: "admin" | "dev" | "client";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // First verify the caller is an admin using their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await userClient.auth.getUser();
    if (callerError || !caller) {
      throw new Error("Unauthorized");
    }

    // Check if caller is admin
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Only admins can create users");
    }

    // Now use service role to create the user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, password, name, role }: CreateUserRequest = await req.json();

    if (!email || !password || !name) {
      throw new Error("Missing required fields: email, password, name");
    }

    const nextRole = role === "admin" || role === "dev" || role === "client" ? role : "client";

    // Create the user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name },
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user?.id) {
      throw new Error("User creation did not return an id");
    }

    const userId = newUser.user.id;

    // Keep a single application role per user because the frontend resolves one role at a time.
    const { error: deleteRolesError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteRolesError) {
      throw deleteRolesError;
    }

    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: nextRole });

    if (roleError) {
      throw roleError;
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          email,
          name,
        },
        { onConflict: "user_id" },
      );

    if (profileError) {
      throw profileError;
    }

    console.log(`User created successfully: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user?.id, 
          email: newUser.user?.email,
          role: nextRole,
        } 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
