import { supabase } from '../lib/supabaseClient';

export const deleteUser = async (userId: string) => {
  try {
    // 1. Mark user for deletion to prevent new logins
    const { error: markError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        deleted: true,
        deleted_at: new Date().toISOString()
      });

    if (markError) {
      throw markError;
    }

    // 2. Delete user data from all related tables
    const { error: deleteError } = await supabase.rpc('handle_user_deletion', {
      user_id: userId
    });

    if (deleteError) {
      throw deleteError;
    }

    // 3. Delete user from auth.users (this will trigger our deletion cascade)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw authError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { error: error.message || 'Failed to delete user' };
  }
};