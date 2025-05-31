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
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.bin', '.hex', '.ino'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Hanya file .bin, .hex, dan .ino yang diperbolehkan');
      return;
    }
    
    setFile(file);
    setError(null);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version || !nodeType) {
      setError('File, version, and node type must be filled'); 
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
      const token = localStorage.getItem('access_token');
      const refresh_token = localStorage.getItem('refresh_token');
      const response = await fetch('https://update-firm-79269000209.asia-southeast2.run.app/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(refresh_token && { 'X-Refresh-Token': refresh_token })
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
                <InputLabel>Device Type</InputLabel>
                <Select
                  value={deviceType}
                  label="Device Type"
                  onChange={(e) => setDeviceType(e.target.value)}
                >
                  <MenuItem value="esp32">ESP32</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Node Type</InputLabel>
                <Select
                  value={nodeType}
                  label="Node Type"
                  onChange={(e) => setNodeType(e.target.value)}
                  required
                >
                  <MenuItem value="soil-moisture">Soil Moisture</MenuItem>
                  <MenuItem value="temp-measure">Humidity</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Version"
                variant="outlined"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                sx={{ mb: 3 }}
                required
              />

              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                placeholder="Enter the description of the changes in the latest firmware"
                sx={{ mb: { xs: 3, md: 0 } }}
              />
            </Box>

            {/* Kolom Kanan - Upload File */}
            <Stack sx={{ width: { xs: '100%', md: '50%' }, height: '100%' }} spacing={2}>
              <Box
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{ 
                  flex: 1,
                  minHeight: '250px',
                  border: isDragging ? '2px solid #2E6224' : '2px dashed #2E6224',
                  backgroundColor: isDragging ? 'rgba(46, 98, 36, 0.1)' : 'transparent',
                  color: '#2E6224',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer',
                  borderRadius: 1,
                  position: 'relative',
                  '&:hover': {
                    border: '2px solid #1e4117',
                    backgroundColor: 'rgba(46, 98, 36, 0.05)'
                  }
                }}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".bin,.hex,.ino"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <CloudUploadIcon sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h6" align="center">
                  {file ? file.name : 'Upload Firmware'}
                </Typography>
                {file && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Ukuran: {(file.size / 1024).toFixed(2)} KB
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  Support file: .bin, .hex, .ino
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                size="large"
                sx={{
                  mt: 2,
                  bgcolor: '#2E6224',
                  '&:hover': {
                    bgcolor: '#1e4117'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
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