import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import mqtt from 'mqtt';
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
    // Konfigurasi MQTT client
    const client = mqtt.connect('wss://s1c71808.ala.asia-southeast1.emqxsl.com:8084/mqtt', {
      username: 'lokatani',
      password: 'lokatani711',
      clean: true,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe('monitoring/sensor');
    });

    client.on('message', (topic: string, message: Buffer) => {
      const data = JSON.parse(message.toString());
      const timestamp = new Date().toISOString();

      setSensorData(prev => {
        const updated = { ...prev };
        
        if (data.node_id === "node1") {
          if (data.tipe === "kelembabanTanah") {
            updated.kelembaban_tanah = data.nilai;
          }
        } else if (data.node_id === "node2") {
          data.data.forEach((item: any) => {
            if (item.tipe === "suhu") {
              updated.suhu = item.nilai;
            } else if (item.tipe === "kelembabanUdara") {
              updated.kelembaban_udara = item.nilai;
            }
          });
        }
        
        updated.timestamp = timestamp;
        return updated;
      });

      setSensorHistory(prev => {
        const lastEntry = prev[prev.length - 1] || {
          suhu: 0,
          kelembaban_udara: 0,
          kelembaban_tanah: 0,
          timestamp: timestamp
        };

        const newEntry: SensorData = {
          ...lastEntry,
          timestamp: timestamp,
        };

        if (data.node_id === "node1") {
          if (data.tipe === "kelembabanTanah") {
            newEntry.kelembaban_tanah = data.nilai;
          }
        } else if (data.node_id === "node2") {
          data.data.forEach((item: any) => {
            if (item.tipe === "suhu") {
              newEntry.suhu = item.nilai;
            } else if (item.tipe === "kelembabanUdara") {
              newEntry.kelembaban_udara = item.nilai;
            }
          });
        }

        const newHistory = [...prev, newEntry];
        return newHistory.slice(-MAX_DATA_POINTS);
      });
    });

    return () => {
      client.end();
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