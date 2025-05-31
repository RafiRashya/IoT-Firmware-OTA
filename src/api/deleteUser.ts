import { supabaseProjectUrl, supabase } from '../lib/supabaseClient';

export const deleteUser = async (userId: string) => {
  try {
    if (!userId) {
       throw new Error('User ID is required for deletion.');
    }

    // Panggil Edge Function delete-user
    const edgeFunctionUrl = `${supabaseProjectUrl}/functions/v1/delete-user`;

    console.log(`Calling Edge Function at: ${edgeFunctionUrl}`);

    // Ambil sesi pengguna yang sedang aktif
    const { data: { session } } = await supabase.auth.getSession();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Tambahkan header Authorization jika sesi ada
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ userId: userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error from Edge Function:', data);
      throw new Error(data.error || 'Failed to delete user via Edge Function');
    }

    console.log('User deletion request sent successfully via Edge Function:', data);

    // Jika Edge Function berhasil, kembalikan success: true
    return { success: true };

  } catch (error: any) {
    console.error('Error deleting user:', error);
    // Kembalikan error yang diterima dari Edge Function atau error lokal
    return { error: error.message || 'Failed to delete user' };
  }
};