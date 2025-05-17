import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { io } from 'socket.io-client';
import TemperatureChart from './TemperatureChart';
import HumidityChart from './HumidityChart';
import SoilMoistureChart from './SoilMoistureChart';
import SensorCard from './SensorCard';

interface SensorData {
  suhu: number;
  kelembaban_udara: number;
  kelembaban_tanah: number;
  timestamp: string;
}

const MAX_DATA_POINTS = 10; // Jumlah maksimum data yang akan ditampilkan

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    suhu: 0,
    kelembaban_udara: 0,
    kelembaban_tanah: 0,
    timestamp: new Date().toISOString(),
  });

  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);

  useEffect(() => {
    // Mengambil data terbaru saat komponen dimount
    // fetch('http://localhost:5000/api/data/latest')
    //   .then(response => response.json())
    //   .then((data: SensorData) => {
    //     setSensorData(data);
    //     setSensorHistory([data]);
    //   })
    //   .catch(error => console.error('Error fetching initial data:', error));

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('sensor_update', (data: any) => {
      setSensorData(prev => {
        const updated = { ...prev };
        
        if (data.tipe === "suhu") {
          updated.suhu = data.nilai;
        } else if (data.tipe === "kelembabanUdara" && data.node_id === "node2") {
          updated.kelembaban_udara = data.nilai;
        } else if (data.tipe === "kelembabanTanah" && data.node_id === "node1") {
          updated.kelembaban_tanah = data.nilai;
        }
    
        updated.timestamp = data.timestamp;
    
        return updated;
      });
    
      setSensorHistory(prev => {
        const lastEntry = prev[prev.length - 1] || {
          suhu: 0,
          kelembaban_udara: 0,
          kelembaban_tanah: 0,
          timestamp: data.timestamp
        };
    
        const newEntry: SensorData = {
          ...lastEntry,
          timestamp: data.timestamp,
        };
    
        if (data.tipe === "suhu") {
          newEntry.suhu = data.nilai;
        } else if (data.tipe === "kelembabanUdara" && data.node_id === "node2") {
          newEntry.kelembaban_udara = data.nilai;
        } else if (data.tipe === "kelembabanTanah" && data.node_id === "node1") {
          newEntry.kelembaban_tanah = data.nilai;
        }
    
        const newHistory = [...prev, newEntry];
        return newHistory.slice(-MAX_DATA_POINTS);
      });
    });    

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        {/* Sensor Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}>
          <SensorCard
            title="Suhu"
            value={sensorData.suhu}
            unit="°C"
            icon="thermostat"
          />
          <SensorCard
            title="Kelembaban Udara"
            value={sensorData.kelembaban_udara}
            unit="%"
            icon="water_drop"
          />
          <SensorCard
            title="Kelembaban Tanah"
            value={sensorData.kelembaban_tanah}
            unit="%"
            icon="grass"
          />
        </Box>

        {/* Charts */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3
        }}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <TemperatureChart data={sensorHistory} />
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <HumidityChart data={sensorHistory} />
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <SoilMoistureChart data={sensorHistory} />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard; 