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
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '../api/deleteUser';
import { supabase } from '../lib/supabaseClient';
import { PasswordValidator } from '../utils/passwordValidation';

const Profile: React.FC = () => {
  const { user, signOut, updateUserProfile, updateUserPassword } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>('account');
  const [isTyping, setIsTyping] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

  const handleDeleteConfirmOpen = () => {
    setDeleteConfirmOpen(true);
    setOpen(false);
  };

  const handleProfileClose = () => {
    setProfileOpen(false);
    setNewUsername('');
    setNewLastName('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setDeletePassword('');
    setError(null);
    setSuccess(null);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setNewPassword(newPassword);
    setIsTyping(true);
    if (newPassword) {
      const errors = PasswordValidator.getPasswordValidationErrors(newPassword);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          setError('Please enter your current password');
          return;
        }
        
        if (newPassword !== confirmPassword) {
          setError('New passwords do not match');
          return;
        }
        
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }

        // Verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: currentPassword
        });

        if (signInError) {
          setError('Current password is incorrect');
          return;
        }

        // Update password directly
        const { error: updateError } = await supabase.auth.updateUser({ 
          password: newPassword 
        });

        if (updateError) throw updateError;

        setSuccess('Password updated successfully');
        setNewPassword('');
        setCurrentPassword('');
        setConfirmPassword('');
        
        // Close dialog after success
        setTimeout(() => {
          handleProfileClose();
        }, 2000);
        return;
      }

      // Handle profile update (first name and last name)
      if ((newUsername !== user?.user_metadata?.first_name) || (newLastName !== user?.user_metadata?.last_name)) {
        await updateUserProfile({ 
          first_name: newUsername,
          last_name: newLastName 
        });
        setSuccess('Profile information updated successfully');
        
        setTimeout(() => {
          handleProfileClose();
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!deletePassword || !user) {
        setError('Please enter your password to confirm account deletion');
        return;
      }

      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: deletePassword
      });

      if (signInError) {
        setError('Incorrect password. Please try again.');
        return;
      }

      // Show detailed warning
      const confirmDelete = await new Promise<boolean>((resolve) => {
        const shouldDelete = window.confirm(
          'WARNING: Deleting your account will:\n\n' +
          '1. Delete ALL your data permanently\n' +
          '2. Cancel all active sessions\n' +
          '3. Disable login to this account\n\n' +
          'This action cannot be undone. Continue?'
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
      
      setSuccess('Your account has been permanently deleted');
      
      // Show success message briefly before redirecting
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Failed to delete account');
      console.error('Delete account error:', error);
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setDeletePassword('');
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
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: '#2E6224', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Typography variant="h6" sx={{ color: '#2E6224', fontWeight: 'bold' }}>My Profile</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Accordion 
              expanded={expanded === 'account'} 
              onChange={handleAccordionChange('account')}
              sx={{ 
                mb: 1,
                '& .MuiAccordionDetails-root': {
                  bgcolor: '#ffffff',
                  px: 3,
                  py: 2
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#2E6224' }} />}
                sx={{ 
                  bgcolor: '#f5f5f5',
                  borderRadius: expanded === 'account' ? '4px 4px 0 0' : '4px',
                  '&:hover': {
                    bgcolor: '#e8f5e9'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountCircle sx={{ mr: 1, color: '#2E6224' }} />
                  <Typography sx={{ color: '#2E6224', fontWeight: 'medium' }}>Account Information</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Avatar 
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      bgcolor: '#2E6224',
                      fontSize: '2.5rem',
                      mb: 2,
                      border: '4px solid #e8f5e9'
                    }}
                  >
                    {getInitial()}
                  </Avatar>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ 
                      color: '#2E6224', 
                      borderColor: '#2E6224',
                      '&:hover': {
                        borderColor: '#23511d',
                        bgcolor: '#e8f5e9'
                      }
                    }}
                  >
                    Change Photo
                  </Button>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    Change your profile picture and personal information below
                  </Typography>
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: '#e8f5e9', 
                    borderRadius: 1,
                    border: '1px solid #2E6224'
                  }}>
                    <Typography variant="body2" color="#2E6224">
                      • Click "Change Photo" to update your profile picture<br/>
                      • Update your first and last name in the fields below<br/>
                      • Click "Save Changes" when you're done
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle 
                          sx={{
                            color: '#2E6224',
                            transform: user?.email ? 'scale(1.2)' : 'scale(1)',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2E6224',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-focused': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="First Name"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  margin="normal"
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
                  fullWidth
                  label="Last Name"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle sx={{ color: '#2E6224' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
                
                {success && success.includes('information') && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: '#e8f5e9',
                    borderRadius: 1,
                    border: '1px solid #2E6224',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" color="#2E6224">
                      {success}
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion 
              expanded={expanded === 'password'} 
              onChange={handleAccordionChange('password')}
              sx={{
                '& .MuiAccordionDetails-root': {
                  bgcolor: '#ffffff',
                  px: 3,
                  py: 2
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#2E6224' }} />}
                sx={{ 
                  bgcolor: '#f5f5f5',
                  borderRadius: expanded === 'password' ? '4px 4px 0 0' : '4px',
                  '&:hover': {
                    bgcolor: '#e8f5e9'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LockIcon sx={{ mr: 1, color: '#2E6224' }} />
                  <Typography sx={{ color: '#2E6224', fontWeight: 'medium' }}>Change Password</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    To change your password, follow these steps:
                  </Typography>
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: '#e8f5e9', 
                    borderRadius: 1,
                    border: '1px solid #2E6224'
                  }}>
                    <Typography variant="body2" color="#2E6224">
                      1. Enter your current password for verification<br/>
                      2. Enter your new password (minimum 6 characters)<br/>
                      3. Confirm your new password<br/>
                      4. Click "Save Changes" to update
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  margin="normal"
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon 
                          sx={{
                            color: '#2E6224',
                            transform: currentPassword ? 'scale(1.2)' : 'scale(1)',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2E6224',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-focused': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}
                />                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon 
                          sx={{
                            color: '#2E6224',
                            transform: newPassword ? 'scale(1.2)' : 'scale(1)',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2E6224',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-focused': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}
                />
                {validationErrors.length > 0 && (
                  <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #d32f2f' }}>
                    <Typography color="error" variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Password Requirements:
                    </Typography>
                    {validationErrors.map((error, index) => (
                      <Typography key={index} color="error" variant="body2" sx={{ ml: 2 }}>
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                )}
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  margin="normal"
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon 
                          sx={{
                            color: '#2E6224',
                            transform: confirmPassword ? 'scale(1.2)' : 'scale(1)',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2E6224',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-focused': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}                />
                {success && success.includes('Password')&& (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: '#e8f5e9',
                    borderRadius: 1,
                    border: '1px solid #2E6224',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" color="#2E6224">
                      {success}
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(true)}
            variant="outlined"
            sx={{
              color: '#2E6224',
              borderColor: '#2E6224',
              borderRadius: 2,
              mr: 'auto',
              '&:hover': {
                backgroundColor: '#e8f5e9',
                borderColor: '#23511d'
              }
            }}
          >
            Delete Account
          </Button>
          <Button 
            onClick={handleProfileClose} 
            disabled={loading} 
            variant="outlined"
            sx={{ 
              color: '#2E6224', 
              borderColor: '#2E6224',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#e8f5e9',
                borderColor: '#23511d'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProfileUpdate} 
            disabled={loading} 
            variant="contained" 
            sx={{
              bgcolor: '#2E6224',
              '&:hover': { bgcolor: '#23511d' },
              borderRadius: 2,
              ml: 1
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletePassword('');
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
        <DialogTitle>
          <Box display="flex" alignItems="center" sx={{ color: '#d32f2f' }}>
            <Avatar sx={{ bgcolor: '#ffebee', mr: 2 }}>
              <PersonIcon sx={{ color: '#d32f2f' }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">Delete Account</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ mt: 2, color: '#d32f2f' }}>
            Are you sure you want to delete your account? This action cannot be undone.
            Please enter your password to confirm.
          </Typography>
          <TextField
            label="Password"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            fullWidth
            margin="normal"
            disabled={loading}
            error={!!error}
            helperText={error}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#d32f2f' }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: error ? '#d32f2f' : '#d32f2f',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#c62828',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d32f2f',
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setDeletePassword('');
              setError(null);
            }} 
            disabled={loading}
            variant="outlined"
            sx={{ 
              color: '#2E6224',
              borderColor: '#2E6224',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                backgroundColor: '#e8f5e9',
                borderColor: '#23511d'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount}
            variant="contained"
            sx={{ 
              backgroundColor: '#d32f2f', 
              '&:hover': { backgroundColor: '#9a0007' },
              borderRadius: 2,
              px: 3,
              ml: 1
            }}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => {
        setError(null);
      }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Profile;