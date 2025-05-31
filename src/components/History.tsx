import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';

interface FirmwareHistory {
  id: string;
  description: string;
  device_type: string;
  node_type: string;
  status: string;
  update_date: string;
  version_from: string;
  version_to: string;
}

const History: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<FirmwareHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('firmware_history')
        .select('*')
        .order('update_date', { ascending: false })
        .limit(20);

      if (error) throw error;

      setHistory(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (tab === 0) return true; // Semua
    if (tab === 1) return item.status === 'Berhasil';
    return item.status === 'Rollback';
  });
  return (
    <Box 
      sx={{ 
        maxWidth: 1200, 
        mx: 'auto', 
        p: 3,
        bgcolor: 'white',
        borderRadius: 4,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4,
        pb: 2,
        borderBottom: '1px solid #eaeaea'
      }}>
        <Typography variant="h5" sx={{ 
          color: '#2E6224', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Box 
            sx={{ 
              width: 20, 
              height: 20, 
              borderRadius: '50%', 
              backgroundColor: '#2E6224',
              opacity: 0.2 
            }} 
          />
          Riwayat Pembaruan
        </Typography>
      </Box>      <Box sx={{ bgcolor: '#f8f8f8', p: 1, borderRadius: 2, mb: 4 }}>
        <Tabs 
          value={tab} 
          onChange={(_, newValue) => setTab(newValue)}
          sx={{
            minHeight: 42,
            '& .MuiTabs-indicator': {
              backgroundColor: '#2E6224',
              height: '3px',
              borderRadius: '3px'
            },
            '& .MuiTab-root': {
              minHeight: 42,
              borderRadius: 2,
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#2E6224',
              },
            },
          }}
        >
          <Tab label="Semua" />
          <Tab label="Berhasil" />
          <Tab label="Rollback" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#2E6224' }} />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            {filteredHistory.length === 0 ? (
              <Box 
                sx={{ 
                  py: 6, 
                  textAlign: 'center',
                  color: 'text.secondary',
                  bgcolor: '#f8f8f8',
                  borderRadius: 2
                }}
              >
                <Typography>Tidak ada riwayat pembaruan</Typography>
              </Box>
            ) : (
              filteredHistory.map((item) => (<Paper
              key={item.id}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid #eaeaea',
                bgcolor: '#ffffff',
                transition: 'all 0.3s ease',
                ':hover': {
                  boxShadow: '0 4px 12px rgba(46, 98, 36, 0.08)',
                  borderColor: '#2E6224',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={{ color: '#2E6224' }}>
                  {item.node_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(item.update_date), 'dd/MM/yyyy HH:mm')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1">v{item.version_from}</Typography>
                <Box component="span" sx={{ color: '#666' }}>→</Box>
                <Typography variant="body1">v{item.version_to}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {item.description || '*Tidak ada deskripsi'}
                </Typography>
                <Chip
                  label={item.status}
                  size="small"
                  sx={{
                    backgroundColor: item.status === 'Berhasil' ? '#e8f5e9' : '#ffebee',
                    color: item.status === 'Berhasil' ? '#2e7d32' : '#d32f2f',
                    fontWeight: 'medium',
                  }}
                />
              </Box>            </Paper>
              ))
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default History;