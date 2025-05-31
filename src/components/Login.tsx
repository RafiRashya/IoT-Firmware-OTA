import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, Divider, Link, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import logoWhite from '../assets/logo-white.png';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';
import { access } from 'fs';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;
    
    // Optimized auth check using cached session first
    const checkAuth = async () => {
      try {
        // Check if coming from email confirmation
        const params = new URLSearchParams(window.location.search);
        const isEmailConfirmation = params.get('confirmed') === 'true';
        
        // If it's email confirmation, clear any existing session
        if (isEmailConfirmation) {
          localStorage.removeItem('sb-session');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          await supabase.auth.signOut();
          return;
        }
        
        // Check localStorage first for faster initial load
        const cachedSession = localStorage.getItem('sb-session');
        if (cachedSession) {
          const session = JSON.parse(cachedSession);
          if (session && new Date(session.expires_at) > new Date()) {
            if (isSubscribed) navigate('/dashboard');
            return;
          }
        }

        // Set timeout for auth check
        timeoutId = setTimeout(() => {
          if (isSubscribed) {
            console.log('Auth check timed out');
          }
        }, 5000);

        // Only make API call if no valid cached session
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        
        if (session && isSubscribed && !isEmailConfirmation) {
          localStorage.setItem('sb-session', JSON.stringify(session));
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        clearTimeout(timeoutId);
      }
    };

    checkAuth();

    // Subscribe ke perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      
      const params = new URLSearchParams(window.location.search);
      const isEmailConfirmation = params.get('confirmed') === 'true';
      
      // Jika sedang dalam proses konfirmasi email, jangan redirect
      if (!isEmailConfirmation && isSubscribed) {
        localStorage.setItem('sb-session', JSON.stringify(session));
        navigate('/dashboard');
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const loginTimeout = setTimeout(() => {
      controller.abort();
      setError('Connection timeout. Please try again.');
      setLoading(false);
    }, 5000); // Reduced to 5 second timeout

    try {
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => 
            reject(new Error('Request timed out'))
          );
        })
      ]) as any;

      clearTimeout(loginTimeout);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      const access_token = data.session?.access_token;
      const refresh_token = data.session?.refresh_token;

      // Cache the tokens as soon as we get them
      if (data.session) {
        localStorage.setItem('sb-session', JSON.stringify(data.session));
      }

      if (!access_token || !refresh_token) {
        throw new Error('Failed to get authentication token');
      }

      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Cache session data
      if (data.session) {
        localStorage.setItem('sb-session', JSON.stringify(data.session));
      }

      // Pre-fetch user data if needed
      if (data.user) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            hd: 'lokatani.id',
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.origin + '/dashboard'
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) {
        if (error.message.toLowerCase().includes('user not found')) {
          setResetError('Email not registered in our system.');
        } else {
          setResetError(error.message);
        }
        return;
      }
      setResetSuccess(true);
    } catch (error: any) {
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 2,
          }}
        >
          <Box 
            sx={{ 
              backgroundColor: '#2E6224',
              padding: 2,
              borderRadius: 1,
              marginBottom: 2,
              width: 'fit-content'
            }}
          >
            <Box component="img" src={logoWhite} alt="Logo" sx={{ height: 40 }} />
          </Box>
          <Typography component="h1" variant="h5" sx={{ mb: 3, color: '#2E6224', fontWeight: 'bold' }}>
            Login
          </Typography>

          {/* Google Login Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              mb: 3,
              borderColor: '#2E6224',
              color: '#2E6224',
              '&:hover': {
                borderColor: '#1e4117',
                backgroundColor: 'rgba(46, 98, 36, 0.04)',
              },
            }}
          >
            Sign In With Google
          </Button>

          <Divider sx={{ width: '100%', mb: 3 }}>
            <Typography color="textSecondary">atau</Typography>
          </Divider>

          <Box component="form" onSubmit={handleEmailLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="off"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.getElementById('password')?.focus();
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  handleEmailLogin();
                }
              }}
            />
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setResetEmail(email); // Set email yang sudah diinput ke resetEmail
                  setOpenForgotPassword(true);
                }}
                sx={{
                  color: '#2E6224',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot Password?
              </Link>
            </Box>
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: '#2E6224',
                '&:hover': {
                  backgroundColor: '#1e4117',
                },
              }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/signup')}
                  sx={{ 
                    color: '#2E6224',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Forgot Password Dialog */}
          <Dialog 
            open={openForgotPassword} 
            onClose={() => setOpenForgotPassword(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <DialogTitle sx={{ color: '#2E6224', fontWeight: 'bold' }}>Reset Password</DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={(e) => {
                e.preventDefault();
                handleForgotPassword(e);
              }} sx={{ mt: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                {resetError && (
                  <Typography color="error" sx={{ mt: 2 }}>
                    {resetError}
                  </Typography>
                )}
                {resetSuccess && (
                  <Typography color="success.main" sx={{ mt: 2 }}>
                    Reset link sent! Please check your email.
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setOpenForgotPassword(false)}
                sx={{ color: '#2E6224' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleForgotPassword}
                variant="contained"
                disabled={resetLoading}
                sx={{
                  backgroundColor: '#2E6224',
                  '&:hover': {
                    backgroundColor: '#1e4117',
                  },
                }}
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;