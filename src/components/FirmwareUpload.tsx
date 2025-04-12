import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FirmwareUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [deviceType, setDeviceType] = useState('esp32');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version) {
      setError('File dan versi harus diisi');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('device_type', deviceType);

    try {
      const response = await fetch('http://localhost:5050/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat mengunggah firmware');
      }

      // const data = await response.json();
      setSuccess('Firmware berhasil diunggah!');
      setFile(null);
      setVersion('');
      // Reset form
      const form = e.target as HTMLFormElement;
      form.reset();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal mengunggah firmware. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#2E6224', fontWeight: 'bold', mb: 3 }}>
          Upload Firmware
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tipe Perangkat</InputLabel>
            <Select
              value={deviceType}
              label="Tipe Perangkat"
              onChange={(e) => setDeviceType(e.target.value)}
            >
              <MenuItem value="esp32">ESP32</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Versi"
            variant="outlined"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            sx={{ mb: 3 }}
            required
          />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ 
              mb: 3,
              height: '100px',
              border: '2px dashed #2E6224',
              color: '#2E6224',
              '&:hover': {
                border: '2px dashed #1e4117'
              }
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CloudUploadIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography>
                {file ? file.name : 'Pilih File Firmware'}
              </Typography>
            </Box>
            <input
              type="file"
              hidden
              onChange={handleFileChange}
              accept=".bin,.hex,.ino"
            />
          </Button>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: '#2E6224',
              '&:hover': {
                backgroundColor: '#1e4117',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Upload Firmware'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FirmwareUpload; 