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
  CircularProgress,
  Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FirmwareUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [deviceType, setDeviceType] = useState('esp32');
  const [nodeType, setNodeType] = useState('');
  const [description, setDescription] = useState('');
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
    if (!file || !version || !nodeType) {
      setError('File, versi, dan tipe node harus diisi');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('device_type', deviceType);
    formData.append('node_type', nodeType);
    formData.append('description', description);

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

      setSuccess('Firmware berhasil diunggah!');
      setFile(null);
      setVersion('');
      setNodeType('');
      setDescription('');
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {/* Kolom Kiri - Form Input */}
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
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

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tipe Node</InputLabel>
                <Select
                  value={nodeType}
                  label="Tipe Node"
                  onChange={(e) => setNodeType(e.target.value)}
                  required
                >
                  <MenuItem value="soil-moisture">Soil Moisture</MenuItem>
                  <MenuItem value="temp-measure">Humidity</MenuItem>
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

              <TextField
                fullWidth
                label="Deskripsi"
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                placeholder="Masukkan deskripsi perubahan pada firmware terbaru"
                sx={{ mb: { xs: 3, md: 0 } }}
              />
            </Box>

            {/* Kolom Kanan - Upload File */}
            <Stack sx={{ width: { xs: '100%', md: '50%' }, height: '100%' }} spacing={2}>
              <Button
                variant="outlined"
                component="label"
                sx={{ 
                  flex: 1,
                  minHeight: '250px',
                  border: '2px dashed #2E6224',
                  color: '#2E6224',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  '&:hover': {
                    border: '2px dashed #1e4117'
                  }
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h6" align="center">
                  {file ? file.name : 'Pilih File Firmware'}
                </Typography>
                {file && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Ukuran: {(file.size / 1024).toFixed(2)} KB
                  </Typography>
                )}
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
                size="large"
                sx={{
                  backgroundColor: '#2E6224',
                  '&:hover': {
                    backgroundColor: '#1e4117',
                  },
                  py: 1.5
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Upload Firmware'
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default FirmwareUpload; 