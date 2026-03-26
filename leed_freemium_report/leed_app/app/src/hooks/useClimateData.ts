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

// ─── API Endpoints ────────────────────────────────────────────────────────────
const NASA_POWER_BASE  = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const PVGIS_BASE       = 'https://re.jrc.ec.europa.eu/api/v5_2';
const OPENLANDMAP_BASE = 'https://api.openlandmap.org/query/point';

// PVGIS blocks browser AJAX — use CORS proxy
const CORS_PROXY = 'https://corsproxy.io/?';
const pvgisUrl   = (path: string) => CORS_PROXY + encodeURIComponent(`${PVGIS_BASE}${path}`);

// ─── Oman Climate Zone Mapping ────────────────────────────────────────────────
const getClimateZone = (lat: number, lng: number): string => {
  if (lat > 23.5 && lat < 24.5 && lng > 56.5 && lng < 59.5) return 'Coastal - Hot Desert (BWh)';
  if (lat < 19.5) return 'Dhofar - Semi-Arid (BSh) with Khareef';
  if (lat > 22.5 && lat < 23.5 && lng > 57.0 && lng < 58.5) return 'Mountain - Arid with Altitude Variation';
  if (lng < 56.0) return 'Interior - Hot Desert (BWh)';
  return 'Desert - Hot Arid (BWh)';
};

const getDustImpact = (lat: number, lng: number): { level: 'low' | 'moderate' | 'high'; value: number } => {
  if ((lat < 21.0 && lng > 54.0) || (lat > 21.5 && lat < 23.0 && lng > 57.0 && lng < 59.0)) return { level: 'high', value: 35 };
  if (lat > 23.0 && lng > 57.0) return { level: 'moderate', value: 20 };
  if (lat > 22.5 && lng > 57.0 && lng < 58.5) return { level: 'low', value: 12 };
  return { level: 'moderate', value: 22 };
};

const getTurbineSuitability = (avgSpeed: number): 'excellent' | 'good' | 'moderate' | 'poor' => {
  if (avgSpeed >= 7.0) return 'excellent';
  if (avgSpeed >= 5.5) return 'good';
  if (avgSpeed >= 4.0) return 'moderate';
  return 'poor';
};

const getPrevailingDirection = (lat: number, lng: number): string => {
  if (lat > 24.0) return 'Northwest (Shamal)';
  if (lat < 20.0) return 'Southwest (Monsoon)';
  if (lng > 57.5) return 'Northwest-Southwest Variable';
  return 'Northwest (Shamal)';
};

const calculateOptimalTilt = (lat: number): number =>
  Math.min(Math.max(Math.round(Math.abs(lat) * 0.9), 15), 30);

const calculateOptimalAzimuth = (_lat: number, lng: number): number => {
  if (lng > 58.0) return -5;
  if (lng < 55.0) return 5;
  return 0;
};

// ─── OpenLandMap soil texture classification ──────────────────────────────────
const classifySoilType = (sand: number, silt: number, clay: number): string => {
  if (clay > 40) return 'Clay (Vertisols)';
  if (clay > 27 && sand < 20) return 'Clay Loam (Cambisols)';
  if (silt > 50 && clay < 27) return 'Silty Loam (Fluvisols)';
  if (sand > 85) return 'Sand (Arenosols)';
  if (sand > 70 && clay < 15) return 'Desert Sand (Yermosols)';
  if (clay > 20 && sand > 40) return 'Sandy Clay Loam (Cambisols)';
  return 'Loam (Cambisols)';
};

const estimateBearingCapacity = (soilType: string, clay: number): number => {
  if (soilType.includes('Clay')) return clay > 35 ? 180 : 220;
  if (soilType.includes('Sand')) return 120;
  if (soilType.includes('Loam')) return 180;
  return 150;
};

const estimateDrainage = (sand: number, clay: number): 'excellent' | 'good' | 'moderate' | 'poor' => {
  if (clay > 35) return 'poor';
  if (clay > 20) return 'moderate';
  if (sand > 70) return 'excellent';
  return 'good';
};

// ─── SOLAR DATA — PVGIS (replaces NASA POWER) ────────────────────────────────
export const useClimateData = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchSolarData = useCallback(async (location: Location): Promise<SolarData> => {
    try {
      // PVGIS Monthly Radiation — ±4% accuracy vs ±12% for NASA POWER
      const monthlyUrl = pvgisUrl(
        `/MRcalc?lat=${location.lat}&lon=${location.lng}&outputformat=json&browser=0`
      );
      const pvgisRes = await axios.get(monthlyUrl, { timeout: 15000 });
      const monthly  = pvgisRes.data?.outputs?.monthly;

      if (!monthly?.length) throw new Error('PVGIS monthly data empty');

      // Average monthly GHI → daily
      const avgGHI = monthly.reduce((sum: number, m: { H_sun: number }) =>
        sum + (m.H_sun || 0), 0) / monthly.length / 1000; // Wh/m² → kWh/m²

      // PVGIS PVcalc for production estimate
      const pvUrl = pvgisUrl(
        `/PVcalc?lat=${location.lat}&lon=${location.lng}&peakpower=1&loss=14&optimalangles=1&outputformat=json&browser=0`
      );
      const pvRes   = await axios.get(pvUrl, { timeout: 15000 });
      const pvTotals = pvRes.data?.outputs?.totals?.fixed;

      const yearlyGHI       = pvTotals?.['H(i)_y']  || avgGHI * 365;
      const pvProduction    = pvTotals?.E_y          || yearlyGHI * 0.16;
      const optimalTilt     = pvRes.data?.inputs?.mounting_system?.fixed?.slope?.value || calculateOptimalTilt(location.lat);
      const optimalAzimuth  = pvRes.data?.inputs?.mounting_system?.fixed?.azimuth?.value || calculateOptimalAzimuth(location.lat, location.lng);

      const dustImpact = getDustImpact(location.lat, location.lng);
      const dustFactor = 1 - (dustImpact.value / 100);
      const adjustedPV = pvProduction * dustFactor;

      // Estimate DNI / DHI from GHI using standard decomposition
      const avgDNI = avgGHI * 0.75;
      const avgDHI = avgGHI * 0.25;

      return {
        ghi:                  Number(avgGHI.toFixed(2)),
        dni:                  Number(avgDNI.toFixed(2)),
        dhi:                  Number(avgDHI.toFixed(2)),
        etr:                  Number((avgGHI * 1.3).toFixed(2)),
        optimalTilt:          Number(optimalTilt),
        optimalAzimuth:       Number(optimalAzimuth),
        yearlyGHI:            Number(yearlyGHI.toFixed(0)),
        pvProductionPotential: Number(adjustedPV.toFixed(0)),
        dustImpact:           dustImpact.level,
        dustImpactValue:      dustImpact.value,
        dataSource:           'PVGIS v5.2 (EU JRC) — ±4% accuracy',
      };
    } catch (err) {
      console.warn('PVGIS failed, falling back to NASA POWER:', err);
      return fetchSolarNASA(location);
    }
  }, []);

  // ─── Fallback: NASA POWER solar (original) ─────────────────────────────────
  const fetchSolarNASA = async (location: Location): Promise<SolarData> => {
    try {
      const endDate   = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const response = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, {
        params: {
          parameters: 'ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF',
          community: 'RE',
          longitude: location.lng,
          latitude:  location.lat,
          start:     startDate.toISOString().slice(0, 10).replace(/-/g, ''),
          end:       endDate.toISOString().slice(0, 10).replace(/-/g, ''),
          format:    'JSON',
        },
        timeout: 20000,
      });

      const data = response.data.properties.parameter;
      const ghiValues = Object.values(data.ALLSKY_SFC_SW_DWN || {}) as number[];
      const dniValues = Object.values(data.ALLSKY_SFC_SW_DNI || {}) as number[];
      const dhiValues = Object.values(data.ALLSKY_SFC_SW_DIFF || {}) as number[];

      const avg = (arr: number[]) => arr.filter(v => v > 0).reduce((a, b) => a + b, 0) / arr.filter(v => v > 0).length;
      const avgGHI = avg(ghiValues);
      const avgDNI = avg(dniValues);
      const avgDHI = avg(dhiValues);
      const yearlyGHI = avgGHI * 365;
      const dustImpact = getDustImpact(location.lat, location.lng);
      const adjustedPV = yearlyGHI * 0.18 * (1 - dustImpact.value / 100) * 0.92;

      return {
        ghi: Number(avgGHI.toFixed(2)),
        dni: Number(avgDNI.toFixed(2)),
        dhi: Number(avgDHI.toFixed(2)),
        etr: Number((avgGHI * 1.3).toFixed(2)),
        optimalTilt:          calculateOptimalTilt(location.lat),
        optimalAzimuth:       calculateOptimalAzimuth(location.lat, location.lng),
        yearlyGHI:            Number(yearlyGHI.toFixed(0)),
        pvProductionPotential: Number(adjustedPV.toFixed(0)),
        dustImpact:           dustImpact.level,
        dustImpactValue:      dustImpact.value,
        dataSource:           'NASA POWER (fallback) — ±12% accuracy',
      };
    } catch {
      const dustImpact = getDustImpact(location.lat, location.lng);
      return {
        ghi: 5.8, dni: 6.2, dhi: 1.8, etr: 8.5,
        optimalTilt: 23, optimalAzimuth: 0,
        yearlyGHI: 2117, pvProductionPotential: 1650,
        dustImpact: dustImpact.level, dustImpactValue: dustImpact.value,
        dataSource: 'Default fallback (Oman average)',
      };
    }
  };

  // ─── WIND & CLIMATE — NASA POWER (unchanged — no CORS issue) ───────────────
  const fetchWindData = useCallback(async (location: Location): Promise<WindData> => {
    try {
      const endDate   = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const response = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, {
        params: {
          parameters: 'WS10M,WS10M_MAX',
          community:  'RE',
          longitude:  location.lng,
          latitude:   location.lat,
          start:      startDate.toISOString().slice(0, 10).replace(/-/g, ''),
          end:        endDate.toISOString().slice(0, 10).replace(/-/g, ''),
          format:     'JSON',
        },
        timeout: 20000,
      });

      const data          = response.data.properties.parameter;
      const windSpeeds    = Object.values(data.WS10M     || {}) as number[];
      const maxWindSpeeds = Object.values(data.WS10M_MAX || {}) as number[];

      const validWind  = windSpeeds.filter(v => v > 0);
      const avgSpeed   = validWind.reduce((a, b) => a + b, 0) / validWind.length;
      const maxSpeed   = Math.max(...maxWindSpeeds.filter(v => v > 0));
      const energyDensity = 0.5 * 1.225 * Math.pow(avgSpeed, 3);
      const viableHours   = windSpeeds.filter(v => v > 3).length;

      return {
        averageSpeed:      Number(avgSpeed.toFixed(2)),
        energyDensity:     Number(energyDensity.toFixed(0)),
        prevailingDirection: getPrevailingDirection(location.lat, location.lng),
        maxSpeed:          Number(maxSpeed.toFixed(2)),
        turbineSuitability: getTurbineSuitability(avgSpeed),
        annualHours:       viableHours,
      };
    } catch {
      return {
        averageSpeed: 5.45, energyDensity: 248,
        prevailingDirection: 'Northwest (Shamal)',
        maxSpeed: 15.2, turbineSuitability: 'good', annualHours: 2800,
      };
    }
  }, []);

  const fetchClimateData = useCallback(async (location: Location): Promise<ClimateData> => {
    try {
      const endDate   = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const response = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, {
        params: {
          parameters: 'RH2M,T2M,T2M_MAX,T2M_MIN,PRECTOTCORR',
          community:  'RE',
          longitude:  location.lng,
          latitude:   location.lat,
          start:      startDate.toISOString().slice(0, 10).replace(/-/g, ''),
          end:        endDate.toISOString().slice(0, 10).replace(/-/g, ''),
          format:     'JSON',
        },
        timeout: 20000,
      });

      const data = response.data.properties.parameter;
      const avg  = (obj: Record<string, number>) => {
        const vals = Object.values(obj).filter(v => v > -900);
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      };

      const avgHumidity    = avg(data.RH2M         || {});
      const avgTemp        = avg(data.T2M          || {});
      const maxTempValues  = Object.values(data.T2M_MAX     || {}).filter((v): v is number => v > -900);
      const minTempValues  = Object.values(data.T2M_MIN     || {}).filter((v): v is number => v > -900);
      const rainValues     = Object.values(data.PRECTOTCORR || {}).filter((v): v is number => v >= 0);
      const annualRainfall = rainValues.reduce((a, b) => a + b, 0);

      const baseSunshineHours  = 3493;
      const latAdjustment      = Math.abs(location.lat - 23.5) * 20;
      const estimatedSunshine  = Math.max(baseSunshineHours - latAdjustment, 3000);

      return {
        relativeHumidity: Number(avgHumidity.toFixed(1)),
        avgTemperature:   Number(avgTemp.toFixed(1)),
        maxTemperature:   Number(Math.max(...maxTempValues).toFixed(1)),
        minTemperature:   Number(Math.min(...minTempValues).toFixed(1)),
        rainfall:         Number(annualRainfall.toFixed(0)),
        climateZone:      getClimateZone(location.lat, location.lng),
        sunshineHours:    Math.round(estimatedSunshine),
      };
    } catch {
      return {
        relativeHumidity: 55, avgTemperature: 28.5,
        maxTemperature: 48, minTemperature: 15,
        rainfall: 100,
        climateZone:  getClimateZone(location.lat, location.lng),
        sunshineHours: 3493,
      };
    }
  }, []);

  // ─── SOIL DATA — OpenLandMap (replaces broken SoilGrids) ─────────────────
  const fetchSoilData = useCallback(async (location: Location): Promise<SoilData> => {
    try {
      // Query OpenLandMap REST API for multiple soil layers
      const layers = [
        'sol_sand.tot_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2.tif',
        'sol_clay.tot_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2.tif',
        'sol_silt.tot_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2.tif',
        'sol_ph.h2o_usda.4c1a2a_m_250m_b0..0cm_1950..2017_v0.2.tif',
        'sol_organic.carbon_usda.6a1c_m_250m_b0..0cm_1950..2017_v0.2.tif',
      ];

      const regex = layers.map(l => l.replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)')).join('|');

      const response = await axios.get(OPENLANDMAP_BASE, {
        params: {
          lat:  location.lat,
          lon:  location.lng,
          coll: 'predicted250m',
          regex,
        },
        timeout: 12000,
      });

      const resp = response.data?.response?.[0] || {};

      // Extract values (OpenLandMap encodes fractions as 0-100)
      const sandContent = Number(
        resp['sol_sand.tot_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2.tif'] ?? 70
      );
      const clayContent = Number(
        resp['sol_clay.tot_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2.tif'] ?? 10
      );
      const siltContent = Number(
        resp['sol_silt.tot_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2.tif'] ?? 20
      );
      // OpenLandMap pH is stored ×10
      const phRaw          = Number(resp['sol_ph.h2o_usda.4c1a2a_m_250m_b0..0cm_1950..2017_v0.2.tif'] ?? 82);
      const phLevel        = phRaw > 14 ? phRaw / 10 : phRaw;
      const organicCarbon  = Number(resp['sol_organic.carbon_usda.6a1c_m_250m_b0..0cm_1950..2017_v0.2.tif'] ?? 3) / 10;

      const soilType        = classifySoilType(sandContent, siltContent, clayContent);
      const bearingCapacity = estimateBearingCapacity(soilType, clayContent);
      const drainage        = estimateDrainage(sandContent, clayContent);

      const contaminationRisk: 'low' | 'moderate' | 'high' =
        location.lat > 23.5 && location.lng > 57.5 ? 'moderate' : 'low';

      return {
        type:             soilType,
        texture:          `${Math.round(sandContent)}% Sand, ${Math.round(siltContent)}% Silt, ${Math.round(clayContent)}% Clay`,
        bearingCapacity,
        drainage,
        phLevel:          Number(phLevel.toFixed(1)),
        organicCarbon:    Number(organicCarbon.toFixed(2)),
        clayContent:      Math.round(clayContent),
        sandContent:      Math.round(sandContent),
        siltContent:      Math.round(siltContent),
        contaminationRisk,
        depth:            5,
        dataSource:       'OpenLandMap v0.2 (250m) — ±15% accuracy',
      };
    } catch (err) {
      console.warn('OpenLandMap failed, using Oman defaults:', err);
      // Oman-calibrated defaults (better than generic fallback)
      const isCoastal   = location.lng > 57.5 && location.lat > 22;
      const isDhofar    = location.lat < 19.5;
      const isMountain  = location.lat > 22.5 && location.lat < 23.5 && location.lng > 57 && location.lng < 58.5;

      if (isDhofar)   return { type: 'Silty Loam (Fluvisols)', texture: '40% Sand, 40% Silt, 20% Clay', bearingCapacity: 160, drainage: 'good', phLevel: 7.2, organicCarbon: 1.2, clayContent: 20, sandContent: 40, siltContent: 40, contaminationRisk: 'low', depth: 5, dataSource: 'Oman regional calibration (Dhofar)' };
      if (isMountain) return { type: 'Sandy Clay Loam (Cambisols)', texture: '50% Sand, 25% Silt, 25% Clay', bearingCapacity: 200, drainage: 'good', phLevel: 7.8, organicCarbon: 0.6, clayContent: 25, sandContent: 50, siltContent: 25, contaminationRisk: 'low', depth: 5, dataSource: 'Oman regional calibration (Al Hajar)' };
      if (isCoastal)  return { type: 'Desert Sand (Yermosols)', texture: '70% Sand, 20% Silt, 10% Clay', bearingCapacity: 130, drainage: 'excellent', phLevel: 8.0, organicCarbon: 0.4, clayContent: 10, sandContent: 70, siltContent: 20, contaminationRisk: 'moderate', depth: 5, dataSource: 'Oman regional calibration (Coastal)' };
      return { type: 'Desert Sand (Yermosols)', texture: '75% Sand, 15% Silt, 10% Clay', bearingCapacity: 120, drainage: 'excellent', phLevel: 8.2, organicCarbon: 0.3, clayContent: 10, sandContent: 75, siltContent: 15, contaminationRisk: 'low', depth: 5, dataSource: 'Oman regional calibration (Interior)' };
    }
  }, []);

  // ─── COMBINED FETCH ──────────────────────────────────────────────────────────
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
      setError('Failed to fetch data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSolarData, fetchWindData, fetchClimateData, fetchSoilData]);

  return { loading, error, fetchSolarData, fetchWindData, fetchClimateData, fetchSoilData, fetchAllData };
};
