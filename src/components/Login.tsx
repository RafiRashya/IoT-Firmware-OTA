import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, Divider } from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import logoWhite from '../assets/logo-white.png';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cek status autentikasi saat komponen dimount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // Subscribe ke perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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
            Masuk dengan Google
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
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 