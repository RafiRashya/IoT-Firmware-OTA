import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, IconButton, Link } from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import logoWhite from '../assets/logo-white.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { PasswordValidator } from '../utils/passwordValidation';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setIsTyping(true);
    if (newPassword) {
      const errors = PasswordValidator.getPasswordValidationErrors(newPassword);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);    setError(null);
    setValidationErrors([]);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Password validation
    const errors = PasswordValidator.getPasswordValidationErrors(password);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      // If successful, show success message in UI
      if (data.user) {
        setSuccess('Please check your email for confirmation link');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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
            position: 'relative',
          }}
        >
          <IconButton 
            sx={{ position: 'absolute', top: 16, left: 16 }}
            onClick={() => navigate('/login')}
          >
            <ArrowBackIcon />
          </IconButton>

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
            Sign Up
          </Typography>

          <Box component="form" onSubmit={handleSignUp} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                sx: { borderRadius: 2 }
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
              onChange={handlePasswordChange}
              error={isTyping && validationErrors.length > 0}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            {validationErrors.length > 0 && (
              <Box sx={{ mt: 2, backgroundColor: '#ffebee', padding: 2, borderRadius: 1 }}>
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
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="success.main" sx={{ mt: 2 }}>
                {success}
              </Typography>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 4,
                mb: 2,
                backgroundColor: '#2E6224',
                '&:hover': {
                  backgroundColor: '#1e4117',
                },
                padding: '12px',
                borderRadius: 2,
                textTransform: 'uppercase',
              }}              disabled={loading}
            >
              {loading ? 'Processing...' : 'SIGN UP'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    color: '#2E6224',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Login here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;