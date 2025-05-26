import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import Thermostat from '@mui/icons-material/Thermostat';
import WaterDrop from '@mui/icons-material/WaterDrop';
import Grass from '@mui/icons-material/Grass';

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit, icon }) => {
  const getIcon = () => {
    switch (icon) {
      case 'thermostat':
        return <Thermostat sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'water_drop':
        return <WaterDrop sx={{ fontSize: 40, color: '#2196f3' }} />;
      case 'grass':
        return <Grass sx={{ fontSize: 40, color: '#4caf50' }} />;
      default:
        return null;
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: 140,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {getIcon()}
        <Typography variant="h6" component="div" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value.toFixed(1)}
        <Typography component="span" variant="h6" sx={{ ml: 0.5 }}>
          {unit}
        </Typography>
      </Typography>
    </Paper>
  );
};

export default SensorCard; 