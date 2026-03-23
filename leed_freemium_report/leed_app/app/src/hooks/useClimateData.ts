import { useState, useCallback } from 'react';
import axios from 'axios';
import type { 
  Location, 
  SolarData, 
  WindData, 
  ClimateData, 
  SoilData,
  NASAPowerResponse 
} from '@/types';

const NASA_POWER_BASE = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const SOILGRIDS_BASE = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

// Oman climate zone mapping based on coordinates
const getClimateZone = (lat: number, lng: number): string => {
  // Coastal regions
  if (lat > 23.5 && lat < 24.5 && lng > 56.5 && lng < 59.5) {
    return 'Coastal - Hot Desert (BWh)';
  }
  // Dhofar region
  if (lat < 19.5) {
    return 'Dhofar - Semi-Arid (BSh) with Khareef';
  }
  // Mountain regions
  if (lat > 22.5 && lat < 23.5 && lng > 57.0 && lng < 58.5) {
    return 'Mountain - Arid with Altitude Variation';
  }
  // Interior desert
  if (lng < 56.0) {
    return 'Interior - Hot Desert (BWh)';
  }
  return 'Desert - Hot Arid (BWh)';
};

// Dust impact assessment based on location
const getDustImpact = (lat: number, lng: number): { level: 'low' | 'moderate' | 'high'; value: number } => {
  // Rub'al Khali and Wahiba Sands areas
  if ((lat < 21.0 && lng > 54.0) || (lat > 21.5 && lat < 23.0 && lng > 57.0 && lng < 59.0)) {
    return { level: 'high', value: 35 };
  }
  // Coastal areas - moderate dust
  if (lat > 23.0 && lng > 57.0) {
    return { level: 'moderate', value: 20 };
  }
  // Mountain regions - low dust
  if (lat > 22.5 && lng > 57.0 && lng < 58.5) {
    return { level: 'low', value: 12 };
  }
  return { level: 'moderate', value: 22 };
};

// Wind turbine suitability assessment
const getTurbineSuitability = (avgSpeed: number): 'excellent' | 'good' | 'moderate' | 'poor' => {
  if (avgSpeed >= 7.0) return 'excellent';
  if (avgSpeed >= 5.5) return 'good';
  if (avgSpeed >= 4.0) return 'moderate';
  return 'poor';
};

// Prevailing wind direction based on location
const getPrevailingDirection = (lat: number, lng: number): string => {
  if (lat > 24.0) return 'Northwest (Shamal)';
  if (lat < 20.0) return 'Southwest (Monsoon)';
  if (lng > 57.5) return 'Northwest-Southwest Variable';
  return 'Northwest (Shamal)';
};

// Calculate optimal tilt angle based on latitude
const calculateOptimalTilt = (lat: number): number => {
  // General rule: tilt ≈ latitude for year-round production
  // For Oman, adjust for high temperatures
  const baseTilt = Math.abs(lat);
  return Math.min(Math.max(Math.round(baseTilt * 0.9), 15), 30);
};

// Calculate optimal azimuth (South-facing for Northern Hemisphere)
const calculateOptimalAzimuth = (_lat: number, lng: number): number => {
  // For Northern Hemisphere, face South (0° from South)
  // Adjust slightly for Oman based on location
  if (lng > 58.0) return -5; // Slightly East for morning sun
  if (lng < 55.0) return 5;  // Slightly West for afternoon sun
  return 0;
};

export const useClimateData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSolarData = useCallback(async (location: Location): Promise<SolarData> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const params = {
        parameters: 'ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF',
        community: 'RE',
        longitude: location.lng,
        latitude: location.lat,
        start: startDate.toISOString().slice(0, 10).replace(/-/g, ''),
        end: endDate.toISOString().slice(0, 10).replace(/-/g, ''),
        format: 'JSON',
      };

      const response = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, { params });
      const data = response.data.properties.parameter;

      // Calculate averages from daily data
      const ghiValues = data.ALLSKY_SFC_SW_DWN || [];
      const dniValues = data.ALLSKY_SFC_SW_DNI || [];
      const dhiValues = data.ALLSKY_SFC_SW_DIFF || [];

      const avgGHI = ghiValues.reduce((a: number, b: number) => a + b, 0) / ghiValues.length;
      const avgDNI = dniValues.reduce((a: number, b: number) => a + b, 0) / dniValues.length;
      const avgDHI = dhiValues.reduce((a: number, b: number) => a + b, 0) / dhiValues.length;

      const yearlyGHI = avgGHI * 365;
      const dustImpact = getDustImpact(location.lat, location.lng);
      
      // Adjust PV production for dust and temperature
      const basePVProduction = yearlyGHI * 0.18; // 18% panel efficiency
      const dustLossFactor = 1 - (dustImpact.value / 100);
      const tempLossFactor = 0.92; // 8% loss due to high temperatures
      const adjustedPVProduction = basePVProduction * dustLossFactor * tempLossFactor;

      return {
        ghi: Number(avgGHI.toFixed(2)),
        dni: Number(avgDNI.toFixed(2)),
        dhi: Number(avgDHI.toFixed(2)),
        etr: Number((avgGHI * 1.3).toFixed(2)),
        optimalTilt: calculateOptimalTilt(location.lat),
        optimalAzimuth: calculateOptimalAzimuth(location.lat, location.lng),
        yearlyGHI: Number(yearlyGHI.toFixed(0)),
        pvProductionPotential: Number(adjustedPVProduction.toFixed(0)),
        dustImpact: dustImpact.level,
        dustImpactValue: dustImpact.value,
      };
    } catch (err) {
      console.error('Error fetching solar data:', err);
      // Return fallback data based on Oman's average
      return {
        ghi: 5.8,
        dni: 6.2,
        dhi: 1.8,
        etr: 8.5,
        optimalTilt: 23,
        optimalAzimuth: 0,
        yearlyGHI: 2117,
        pvProductionPotential: 1650,
        dustImpact: 'moderate',
        dustImpactValue: 20,
      };
    }
  }, []);

  const fetchWindData = useCallback(async (location: Location): Promise<WindData> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const params = {
        parameters: 'WS10M,WS10M_MAX',
        community: 'RE',
        longitude: location.lng,
        latitude: location.lat,
        start: startDate.toISOString().slice(0, 10).replace(/-/g, ''),
        end: endDate.toISOString().slice(0, 10).replace(/-/g, ''),
        format: 'JSON',
      };

      const response = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, { params });
      const data = response.data.properties.parameter;

      const windSpeeds = data.WS10M || [];
      const maxWindSpeeds = data.WS10M_MAX || [];

      const avgSpeed = windSpeeds.reduce((a: number, b: number) => a + b, 0) / windSpeeds.length;
      const maxSpeed = Math.max(...maxWindSpeeds);

      // Calculate wind energy density: P = 0.5 * ρ * v³
      // Air density ρ ≈ 1.225 kg/m³ at sea level
      const airDensity = 1.225;
      const energyDensity = 0.5 * airDensity * Math.pow(avgSpeed, 3);

      // Calculate annual hours with viable wind (>3 m/s)
      const viableHours = windSpeeds.filter((v: number) => v > 3).length;

      return {
        averageSpeed: Number(avgSpeed.toFixed(2)),
        energyDensity: Number(energyDensity.toFixed(0)),
        prevailingDirection: getPrevailingDirection(location.lat, location.lng),
        maxSpeed: Number(maxSpeed.toFixed(2)),
        turbineSuitability: getTurbineSuitability(avgSpeed),
        annualHours: viableHours,
      };
    } catch (err) {
      console.error('Error fetching wind data:', err);
      return {
        averageSpeed: 5.45,
        energyDensity: 248,
        prevailingDirection: 'Northwest (Shamal)',
        maxSpeed: 15.2,
        turbineSuitability: 'good',
        annualHours: 2800,
      };
    }
  }, []);

  const fetchClimateData = useCallback(async (location: Location): Promise<ClimateData> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const params = {
        parameters: 'RH2M,T2M,T2M_MAX,T2M_MIN,PRECTOTCORR',
        community: 'RE',
        longitude: location.lng,
        latitude: location.lat,
        start: startDate.toISOString().slice(0, 10).replace(/-/g, ''),
        end: endDate.toISOString().slice(0, 10).replace(/-/g, ''),
        format: 'JSON',
      };

      const response = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, { params });
      const data = response.data.properties.parameter;

      const humidityValues = data.RH2M || [];
      const tempValues = data.T2M || [];
      const maxTempValues = data.T2M_MAX || [];
      const minTempValues = data.T2M_MIN || [];
      const rainValues = data.PRECTOTCORR || [];

      const avgHumidity = humidityValues.reduce((a: number, b: number) => a + b, 0) / humidityValues.length;
      const avgTemp = tempValues.reduce((a: number, b: number) => a + b, 0) / tempValues.length;
      const maxTemp = Math.max(...maxTempValues);
      const minTemp = Math.min(...minTempValues);
      const annualRainfall = rainValues.reduce((a: number, b: number) => a + b, 0);

      // Calculate sunshine hours based on location
      // Oman averages 3,493 hours annually (5th globally)
      const baseSunshineHours = 3493;
      const latAdjustment = Math.abs(location.lat - 23.5) * 20; // Adjustment from optimal latitude
      const estimatedSunshineHours = Math.max(baseSunshineHours - latAdjustment, 3000);

      return {
        relativeHumidity: Number(avgHumidity.toFixed(1)),
        avgTemperature: Number(avgTemp.toFixed(1)),
        maxTemperature: Number(maxTemp.toFixed(1)),
        minTemperature: Number(minTemp.toFixed(1)),
        rainfall: Number(annualRainfall.toFixed(0)),
        climateZone: getClimateZone(location.lat, location.lng),
        sunshineHours: Math.round(estimatedSunshineHours),
      };
    } catch (err) {
      console.error('Error fetching climate data:', err);
      return {
        relativeHumidity: 55,
        avgTemperature: 28.5,
        maxTemperature: 48,
        minTemperature: 15,
        rainfall: 100,
        climateZone: getClimateZone(location.lat, location.lng),
        sunshineHours: 3493,
      };
    }
  }, []);

  const fetchSoilData = useCallback(async (location: Location): Promise<SoilData> => {
    try {
      const params = {
        lat: location.lat,
        lon: location.lng,
        depth: '0-5cm',
        value: 'mean',
      };

      const response = await axios.get(SOILGRIDS_BASE, { 
        params,
        timeout: 10000 
      });

      const layers = response.data.properties.layers;

      // Extract soil properties
      const clayLayer = layers.find((l: { name: string }) => l.name === 'clay');
      const sandLayer = layers.find((l: { name: string }) => l.name === 'sand');
      const siltLayer = layers.find((l: { name: string }) => l.name === 'silt');
      const phLayer = layers.find((l: { name: string }) => l.name === 'phh2o');
      const ocLayer = layers.find((l: { name: string }) => l.name === 'ocd');

      const clayContent = clayLayer?.values.mean || 15;
      const sandContent = sandLayer?.values.mean || 70;
      const siltContent = siltLayer?.values.mean || 15;
      const phLevel = phLayer?.values.mean ? phLayer.values.mean / 10 : 7.5;
      const organicCarbon = ocLayer?.values.mean || 0.5;

      // Determine soil type based on texture
      let soilType = 'Desert Sand (Yermosols)';
      if (clayContent > 30) soilType = 'Clay Loam (Vertisols)';
      else if (siltContent > 40) soilType = 'Silty Loam (Fluvisols)';
      else if (sandContent > 80) soilType = 'Sand (Arenosols)';
      else if (clayContent > 20 && sandContent > 40) soilType = 'Sandy Clay Loam (Cambisols)';

      // Estimate bearing capacity based on soil type
      let bearingCapacity = 150;
      if (soilType.includes('Clay')) bearingCapacity = 200;
      else if (soilType.includes('Sand')) bearingCapacity = 120;
      else if (soilType.includes('Loam')) bearingCapacity = 180;

      // Determine drainage
      let drainage: 'excellent' | 'good' | 'moderate' | 'poor' = 'excellent';
      if (clayContent > 35) drainage = 'poor';
      else if (clayContent > 20) drainage = 'moderate';
      else if (sandContent > 70) drainage = 'excellent';
      else drainage = 'good';

      // Contamination risk based on location
      let contaminationRisk: 'low' | 'moderate' | 'high' = 'low';
      if (location.lat > 23.5 && location.lng > 57.5) contaminationRisk = 'moderate'; // Industrial areas

      return {
        type: soilType,
        texture: `${Math.round(sandContent)}% Sand, ${Math.round(siltContent)}% Silt, ${Math.round(clayContent)}% Clay`,
        bearingCapacity,
        drainage,
        phLevel: Number(phLevel.toFixed(1)),
        organicCarbon: Number(organicCarbon.toFixed(2)),
        clayContent: Math.round(clayContent),
        sandContent: Math.round(sandContent),
        siltContent: Math.round(siltContent),
        contaminationRisk,
        depth: 5,
      };
    } catch (err) {
      console.error('Error fetching soil data:', err);
      // Return fallback data based on typical Omani soil
      return {
        type: 'Desert Sand (Yermosols)',
        texture: '75% Sand, 15% Silt, 10% Clay',
        bearingCapacity: 120,
        drainage: 'excellent',
        phLevel: 8.2,
        organicCarbon: 0.3,
        clayContent: 10,
        sandContent: 75,
        siltContent: 15,
        contaminationRisk: 'low',
        depth: 5,
      };
    }
  }, []);

  const fetchAllData = useCallback(async (location: Location) => {
    setLoading(true);
    setError(null);

    try {
      const [solar, wind, climate, soil] = await Promise.all([
        fetchSolarData(location),
        fetchWindData(location),
        fetchClimateData(location),
        fetchSoilData(location),
      ]);

      return { solar, wind, climate, soil };
    } catch (err) {
      setError('Failed to fetch climate data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSolarData, fetchWindData, fetchClimateData, fetchSoilData]);

  return {
    loading,
    error,
    fetchSolarData,
    fetchWindData,
    fetchClimateData,
    fetchSoilData,
    fetchAllData,
  };
};
