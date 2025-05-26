import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '../api/deleteUser';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  buttonColor?: string;
}

const Settings: React.FC<SettingsProps> = ({ open, onClose, buttonColor = '#2E6224' }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  // Fetch user preferences when component mounts
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        if (!user) return;

        // First check localStorage
        const storedLang = localStorage.getItem('language');
        if (storedLang) {
          setLanguage(storedLang);
        }

        // Then try to get from database
        const { data, error } = await supabase
          .from('user_preferences')
          .select('language')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching language preference:', error);
          return;
        }

        if (data?.language) {
          setLanguage(data.language);
          localStorage.setItem('language', data.language);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };

    fetchUserPreferences();
  }, [user]);

  const handleEmailChange = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!newEmail || !emailPassword) {
        setError('Please enter both new email and your current password');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        setError('Please enter a valid email address');
        return;
      }

      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: emailPassword
      });

      if (signInError) {
        setError('Invalid password. Please try again.');
        return;
      }

      // Update email using Supabase
      const { error: updateError } = await supabase.auth.updateUser({ 
        email: newEmail 
      });

      if (updateError) throw updateError;

      setSuccess('Email change request sent. Please check your new email for confirmation.');
      setNewEmail('');
      setEmailPassword('');
    } catch (error: any) {
      setError(error.message || 'Failed to change email');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!password || !user) {
        setError('Silakan masukkan password Anda untuk mengkonfirmasi penghapusan akun');
        return;
      }

      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: password
      });

      if (signInError) {
        setError('Password salah. Silakan coba lagi.');
        return;
      }

      // Show detailed warning
      const confirmDelete = await new Promise<boolean>((resolve) => {
        const shouldDelete = window.confirm(
          'PERINGATAN: Menghapus akun akan:\n\n' +
          '1. Menghapus SEMUA data Anda secara permanen\n' +
          '2. Membatalkan semua sesi aktif\n' +
          '3. Menonaktifkan login ke akun ini\n\n' +
          'Tindakan ini tidak dapat dibatalkan. Lanjutkan?'
        );
        resolve(shouldDelete);
      });

      if (!confirmDelete) {
        setLoading(false);
        return;
      }

      // Delete user and all associated data
      const { error: deleteError } = await deleteUser(user.id);
      if (deleteError) {
        throw new Error(deleteError);
      }

      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();
      
      // Remove all sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      setSuccess('Akun Anda telah dihapus secara permanen');
      
      // Show success message briefly before redirecting
      setTimeout(() => {
        onClose();
        navigate('/login', { replace: true });
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Gagal menghapus akun');
      console.error('Delete account error:', error);
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setPassword('');
    }
  };

  const handleNotificationToggle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Update notification preference in the database
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          notifications_enabled: !notifications
        });

      if (updateError) throw updateError;

      setNotifications(!notifications);
      setSuccess('Notification preferences updated');
    } catch (error: any) {
      setError(error.message || 'Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Update language preference in the database
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          language: newLanguage,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setLanguage(newLanguage);
      setSuccess(`Language changed to ${newLanguage === 'en' ? 'English' : 'Indonesia'}`);

      // Simpan pilihan bahasa ke localStorage untuk persistence
      localStorage.setItem('app_language', newLanguage);
      
    } catch (error: any) {
      setError(error.message || 'Failed to update language preference');
      console.error('Language update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <List>
            {/* Email Settings */}
            <ListItem>
              <ListItemIcon>
                <EmailIcon sx={{ color: buttonColor }} />
              </ListItemIcon>
              <ListItemText 
                primary="Email" 
                secondary={user?.email}
              />
              <Button 
                variant="outlined" 
                onClick={() => setNewEmail(user?.email || '')}
                disabled={loading}
                sx={{ 
                  color: buttonColor,
                  borderColor: buttonColor,
                  '&:hover': {
                    borderColor: '#24501b',
                    backgroundColor: 'rgba(46, 98, 36, 0.04)'
                  }
                }}
              >
                Change
              </Button>
            </ListItem>
            <Divider />

            {/* Notification Settings */}
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon sx={{ color: buttonColor }} />
              </ListItemIcon>
              <ListItemText 
                primary="Notifications" 
                secondary="Receive notifications about your account"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications}
                    onChange={handleNotificationToggle}
                    disabled={loading}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: buttonColor,
                        '&:hover': { backgroundColor: 'rgba(46, 98, 36, 0.04)' }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: buttonColor
                      }
                    }}
                  />
                }
                label=""
              />
            </ListItem>
            <Divider />

            {/* Language Settings */}
            <ListItem>
              <ListItemIcon>
                <LanguageIcon sx={{ color: buttonColor }} />
              </ListItemIcon>
              <ListItemText 
                primary="Language" 
                secondary={`Current: ${language === 'en' ? 'English' : 'Indonesia'}`}
              />
              <Button
                variant="outlined"
                onClick={() => handleLanguageChange(language === 'en' ? 'id' : 'en')}
                disabled={loading}
                sx={{ 
                  color: buttonColor,
                  borderColor: buttonColor,
                  '&:hover': {
                    borderColor: '#24501b',
                    backgroundColor: 'rgba(46, 98, 36, 0.04)'
                  },
                  minWidth: '100px'
                }}
              >
                {language === 'en' ? 'Indonesia' : 'English'}
              </Button>
            </ListItem>
            <Divider />

            {/* Security Settings */}
            <ListItem>
              <ListItemIcon>
                <SecurityIcon sx={{ color: buttonColor }} />
              </ListItemIcon>
              <ListItemText 
                primary="Security" 
                secondary="Manage your account security"
              />
              <Button 
                variant="outlined" 
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={loading}
                sx={{ 
                  color: buttonColor,
                  borderColor: buttonColor,
                  '&:hover': {
                    borderColor: '#24501b',
                    backgroundColor: 'rgba(46, 98, 36, 0.04)'
                  }
                }}
              >
                Delete Account
              </Button>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading} sx={{ color: buttonColor }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Email Change Dialog */}
      <Dialog 
        open={!!newEmail} 
        onClose={() => {
          setNewEmail('');
          setEmailPassword('');
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>Change Email</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="New Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              margin="normal"
              disabled={loading}
              error={!!error}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <TextField
              label="Current Password"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              fullWidth
              margin="normal"
              disabled={loading}
              error={!!error}
              helperText={error}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setNewEmail('');
              setEmailPassword('');
              setError(null);
            }}
            disabled={loading} 
            sx={{ 
              color: buttonColor,
              borderRadius: 1,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEmailChange}
            variant="contained"
            sx={{ 
              backgroundColor: buttonColor, 
              '&:hover': { backgroundColor: '#24501b' },
              borderRadius: 1,
              px: 3
            }}
            disabled={loading}
          >
            {loading ? 'Changing...' : 'Change Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPassword('');
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ color: buttonColor }}>Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete your account? This action cannot be undone.
            Please enter your password to confirm.
          </Typography>
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading}
            error={!!error}
            helperText={error}
            autoFocus
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setPassword('');
              setError(null);
            }} 
            disabled={loading}
            sx={{ 
              color: buttonColor,
              borderRadius: 1,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount}
            variant="contained"
            sx={{ 
              backgroundColor: buttonColor, 
              '&:hover': { backgroundColor: '#24501b' },
              borderRadius: 1,
              px: 3
            }}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Settings;