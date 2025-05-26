import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  Button,
  IconButton,
  Divider,
  ClickAwayListener,
  TextField,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import Settings from './Settings';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';

const Profile: React.FC = () => {
  const { user, signOut, updateUserProfile, updateUserPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) return;
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const handleProfileOpen = () => {
    setProfileOpen(true);
    setOpen(false);
    setNewUsername(user?.user_metadata?.first_name || '');
    setNewLastName(user?.user_metadata?.last_name || '');
  };

  const handleProfileClose = () => {
    setProfileOpen(false);
    setNewUsername('');
    setNewLastName('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match!');
          return;
        }
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }
      }

      if ((newUsername !== user?.user_metadata?.first_name) || (newLastName !== user?.user_metadata?.last_name)) {
        await updateUserProfile({ 
          first_name: newUsername,
          last_name: newLastName 
        });
      }

      if (newPassword) {
        await updateUserPassword(newPassword);
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        handleProfileClose();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitial = () => {
    if (!user) return '?';
    if (user.user_metadata?.first_name) return user.user_metadata.first_name.charAt(0).toUpperCase();
    if (user.user_metadata?.full_name) return user.user_metadata.full_name.charAt(0).toUpperCase();
    return user.email?.charAt(0).toUpperCase() || '?';
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.first_name || user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim();
    }
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    return user?.email || 'User';
  };

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} sx={{ p: 0.5 }} aria-haspopup="true">
        <Avatar sx={{ width: 40, height: 40, bgcolor: '#1e4117', border: '2px solid white' }}>
          {getInitial()}
        </Avatar>
      </IconButton>

      {open && (
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: 64,
              right: 16,
              width: 300,
              maxWidth: '100%',
              zIndex: 1300,
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: '#2E6224' }}>
                  {getInitial()}
                </Avatar>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {getDisplayName()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                startIcon={<PersonIcon />}
                onClick={handleProfileOpen}
                sx={{ justifyContent: 'flex-start', mb: 1, color: '#2E6224' }}
              >
                My Profile
              </Button>

              <Button
                fullWidth
                startIcon={<SettingsIcon />}
                onClick={() => {
                  setSettingsOpen(true);
                  setOpen(false);
                }}
                sx={{ justifyContent: 'flex-start', mb: 1, color: '#2E6224' }}
              >
                Settings
              </Button>

              <Button
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ justifyContent: 'flex-start', color: '#d32f2f' }}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </ClickAwayListener>
      )}

      <Dialog open={profileOpen} onClose={handleProfileClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>My Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2, px: 2 }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#2E6224',
                fontSize: '3rem',
                mb: 3,
                border: '4px solid #f5f5f5',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              {getInitial()}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#2E6224' }}>
              {`${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`}
            </Typography>
            <Typography variant="subtitle1" sx={{
              color: 'text.secondary',
              bgcolor: '#f5f5f5',
              py: 0.5,
              px: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#2E6224',
                display: 'inline-block'
              }} />
              {user?.email}
            </Typography>

            <Divider sx={{ width: '100%', my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <TextField
                label="First Name"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle sx={{ color: '#2E6224' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
              
              <TextField
                label="Last Name"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle sx={{ color: '#2E6224' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Box>
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#2E6224' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#2E6224' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleProfileClose} disabled={loading} sx={{ color: '#2E6224', borderRadius: 2 }}>
            Cancel
          </Button>
          <Button onClick={handleProfileUpdate} disabled={loading} variant="contained" sx={{
            bgcolor: '#2E6224',
            '&:hover': { bgcolor: '#23511d' },
            borderRadius: 2
          }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error || !!success} autoHideDuration={4000} onClose={() => {
        setError(null);
        setSuccess(null);
      }}>
        <Alert severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>
          {error || success}
        </Alert>
      </Snackbar>

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default Profile;