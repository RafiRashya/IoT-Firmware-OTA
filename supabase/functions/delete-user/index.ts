import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'; // Ganti versi sesuai kebutuhan

console.log('Delete User function started');

serve(async (req) => {
  // CORS headers for local development or specific origins
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Ganti dengan origin frontend Anda di produksi
    'Access-Control-Allow-Headers': 'Authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get the Supabase Service Role Key from environment variables
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceRoleKey) {
       throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment variables.');
    }

    // Create a Supabase client with the Service Role Key
    // This client bypasses RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse the request body to get the user ID
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Attempting to delete user with ID: ${userId}`);

    // --- Panggil RPC handle_user_deletion (Opsional) ---
    // Panggil ini jika Anda memiliki fungsi SQL 'handle_user_deletion'
    // untuk membersihkan data di tabel lain yang tidak menggunakan ON DELETE CASCADE.
    // Jika semua tabel terkait sudah ON DELETE CASCADE ke auth.users, baris ini bisa dihapus.
    // Error RPC tidak harus menghentikan proses jika penghapusan auth.users
    // sudah cukup untuk sebagian besar cleanup via cascade.
    try {
        const { error: rpcError } = await supabaseClient.rpc('handle_user_deletion', {
            user_id: userId
        });
        if (rpcError) {
            console.error('Error calling handle_user_deletion RPC:', rpcError);
            // Pilihan: lempar error untuk menghentikan proses
            // throw rpcError;
            // Pilihan: log error dan lanjutkan (jika RPC tidak krusial)
        } else {
            console.log('handle_user_deletion RPC called successfully (if it exists).');
        }
    } catch (rpcCallError) {
         console.error('Failed to call handle_user_deletion RPC:', rpcCallError);
         // Pilihan: lempar error
         // throw rpcCallError;
    }


    // --- Hapus User dari auth.users ---
    // Ini adalah langkah utama. Supabase akan otomatis menghapus baris
    // terkait di tabel lain yang memiliki foreign key dengan ON DELETE CASCADE.
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (authError) {
       console.error('Error deleting user from auth.users:', authError);
       // Jika error ini terjadi, kemungkinan besar pengguna tidak ditemukan
       // atau ada masalah dengan Service Role Key/izin.
       return new Response(JSON.stringify({ error: authError.message || 'Failed to delete user from auth' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 500, // Use 500 for server-side deletion error
       });
    }

    console.log(`User ${userId} deleted successfully.`);

    // Return success response
    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('General error in delete-user function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});