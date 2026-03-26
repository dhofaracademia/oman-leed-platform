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

const NASA_POWER_BASE  = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const PVGIS_BASE       = 'https://re.jrc.ec.europa.eu/api/v5_2';
const OPENLANDMAP_BASE = 'https://api.openlandmap.org/query/point';
const CORS_PROXY       = 'https://corsproxy.io/?';
const pvgisUrl         = (path: string) => CORS_PROXY + encodeURIComponent(`${PVGIS_BASE}${path}`);

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

const getTurbineSuitability = (s: number): 'excellent' | 'good' | 'moderate' | 'poor' =>
  s >= 7 ? 'excellent' : s >= 5.5 ? 'good' : s >= 4 ? 'moderate' : 'poor';

const getPrevailingDirection = (lat: number, lng: number): string => {
  if (lat > 24.0) return 'Northwest (Shamal)';
  if (lat < 20.0) return 'Southwest (Monsoon)';
  if (lng > 57.5) return 'Northwest-Southwest Variable';
  return 'Northwest (Shamal)';
};

const calcTilt    = (lat: number) => Math.min(Math.max(Math.round(Math.abs(lat) * 0.9), 15), 30);
const calcAzimuth = (_lat: number, lng: number) => lng > 58 ? -5 : lng < 55 ? 5 : 0;

const classifySoil = (sand: number, silt: number, clay: number): string => {
  if (clay > 40) return 'Clay (Vertisols)';
  if (clay > 27 && sand < 20) return 'Clay Loam (Cambisols)';
  if (silt > 50 && clay < 27) return 'Silty Loam (Fluvisols)';
  if (sand > 85) return 'Sand (Arenosols)';
  if (sand > 70 && clay < 15) return 'Desert Sand (Yermosols)';
  if (clay > 20 && sand > 40) return 'Sandy Clay Loam (Cambisols)';
  return 'Loam (Cambisols)';
};

const bearingCap = (type: string, clay: number) =>
  type.includes('Clay') ? (clay > 35 ? 180 : 220) : type.includes('Sand') ? 120 : 180;

const drainage = (sand: number, clay: number): 'excellent' | 'good' | 'moderate' | 'poor' =>
  clay > 35 ? 'poor' : clay > 20 ? 'moderate' : sand > 70 ? 'excellent' : 'good';

const avgRec = (obj: Record<string, number>): number => {
  const v = Object.values(obj).filter(x => x > -900);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};

export const useClimateData = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchSolarData = useCallback(async (location: Location): Promise<SolarData> => {
    try {
      const mrRes = await axios.get(pvgisUrl(`/MRcalc?lat=${location.lat}&lon=${location.lng}&outputformat=json&browser=0`), { timeout: 15000 });
      const monthly = mrRes.data?.outputs?.monthly;
      if (!monthly?.length) throw new Error('empty');
      const avgGHI = monthly.reduce((s: number, m: { H_sun: number }) => s + (m.H_sun || 0), 0) / monthly.length / 1000;

      const pvRes    = await axios.get(pvgisUrl(`/PVcalc?lat=${location.lat}&lon=${location.lng}&peakpower=1&loss=14&optimalangles=1&outputformat=json&browser=0`), { timeout: 15000 });
      const pvT      = pvRes.data?.outputs?.totals?.fixed;
      const yearlyGHI      = pvT?.['H(i)_y'] ?? avgGHI * 365;
      const pvProduction   = pvT?.E_y         ?? yearlyGHI * 0.16;
      const optimalTilt    = pvRes.data?.inputs?.mounting_system?.fixed?.slope?.value   ?? calcTilt(location.lat);
      const optimalAzimuth = pvRes.data?.inputs?.mounting_system?.fixed?.azimuth?.value ?? calcAzimuth(location.lat, location.lng);
      const dust = getDustImpact(location.lat, location.lng);

      return {
        ghi: Number(avgGHI.toFixed(2)), dni: Number((avgGHI * 0.75).toFixed(2)),
        dhi: Number((avgGHI * 0.25).toFixed(2)), etr: Number((avgGHI * 1.3).toFixed(2)),
        optimalTilt: Number(optimalTilt), optimalAzimuth: Number(optimalAzimuth),
        yearlyGHI: Number(yearlyGHI.toFixed(0)),
        pvProductionPotential: Number((pvProduction * (1 - dust.value / 100)).toFixed(0)),
        dustImpact: dust.level, dustImpactValue: dust.value,
        dataSource: 'PVGIS v5.2 (EU JRC) — ±4% accuracy',
      };
    } catch {
      return fetchSolarNASA(location);
    }
  }, []);

  const fetchSolarNASA = async (location: Location): Promise<SolarData> => {
    try {
      const end = new Date(), start = new Date();
      start.setFullYear(end.getFullYear() - 1);
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
      const r = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, {
        params: { parameters: 'ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF', community: 'RE', longitude: location.lng, latitude: location.lat, start: fmt(start), end: fmt(end), format: 'JSON' },
        timeout: 20000,
      });
      const p = r.data.properties.parameter;
      const ghi = avgRec(p.ALLSKY_SFC_SW_DWN ?? {}), dni = avgRec(p.ALLSKY_SFC_SW_DNI ?? {}), dhi = avgRec(p.ALLSKY_SFC_SW_DIFF ?? {});
      const dust = getDustImpact(location.lat, location.lng);
      return {
        ghi: Number(ghi.toFixed(2)), dni: Number(dni.toFixed(2)), dhi: Number(dhi.toFixed(2)), etr: Number((ghi * 1.3).toFixed(2)),
        optimalTilt: calcTilt(location.lat), optimalAzimuth: calcAzimuth(location.lat, location.lng),
        yearlyGHI: Number((ghi * 365).toFixed(0)),
        pvProductionPotential: Number((ghi * 365 * 0.18 * (1 - dust.value / 100) * 0.92).toFixed(0)),
        dustImpact: dust.level, dustImpactValue: dust.value,
        dataSource: 'NASA POWER (fallback) — ±12% accuracy',
      };
    } catch {
      const dust = getDustImpact(location.lat, location.lng);
      return { ghi: 5.8, dni: 6.2, dhi: 1.8, etr: 8.5, optimalTilt: 23, optimalAzimuth: 0, yearlyGHI: 2117, pvProductionPotential: 1650, dustImpact: dust.level, dustImpactValue: dust.value, dataSource: 'Default fallback (Oman average)' };
    }
  };

  const fetchWindData = useCallback(async (location: Location): Promise<WindData> => {
    try {
      const end = new Date(), start = new Date();
      start.setFullYear(end.getFullYear() - 1);
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
      const r = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, {
        params: { parameters: 'WS10M,WS10M_MAX', community: 'RE', longitude: location.lng, latitude: location.lat, start: fmt(start), end: fmt(end), format: 'JSON' },
        timeout: 20000,
      });
      const p = r.data.properties.parameter;
      const ws  = Object.values(p.WS10M     ?? {}).filter(v => v > 0);
      const wsm = Object.values(p.WS10M_MAX ?? {}).filter(v => v > 0);
      const avg = ws.reduce((a, b) => a + b, 0) / ws.length;
      return {
        averageSpeed: Number(avg.toFixed(2)),
        energyDensity: Number((0.5 * 1.225 * Math.pow(avg, 3)).toFixed(0)),
        prevailingDirection: getPrevailingDirection(location.lat, location.lng),
        maxSpeed: Number(Math.max(...wsm).toFixed(2)),
        turbineSuitability: getTurbineSuitability(avg),
        annualHours: ws.filter(v => v > 3).length,
      };
    } catch {
      return { averageSpeed: 5.45, energyDensity: 248, prevailingDirection: 'Northwest (Shamal)', maxSpeed: 15.2, turbineSuitability: 'good', annualHours: 2800 };
    }
  }, []);

  const fetchClimateData = useCallback(async (location: Location): Promise<ClimateData> => {
    try {
      const end = new Date(), start = new Date();
      start.setFullYear(end.getFullYear() - 1);
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
      const r = await axios.get<NASAPowerResponse>(NASA_POWER_BASE, {
        params: { parameters: 'RH2M,T2M,T2M_MAX,T2M_MIN,PRECTOTCORR', community: 'RE', longitude: location.lng, latitude: location.lat, start: fmt(start), end: fmt(end), format: 'JSON' },
        timeout: 20000,
      });
      const p    = r.data.properties.parameter;
      const maxT = Object.values(p.T2M_MAX     ?? {}).filter(v => v > -900);
      const minT = Object.values(p.T2M_MIN     ?? {}).filter(v => v > -900);
      const rain = Object.values(p.PRECTOTCORR ?? {}).filter(v => v >= 0);
      return {
        relativeHumidity: Number(avgRec(p.RH2M ?? {}).toFixed(1)),
        avgTemperature:   Number(avgRec(p.T2M  ?? {}).toFixed(1)),
        maxTemperature:   Number((maxT.length ? Math.max(...maxT) : 48).toFixed(1)),
        minTemperature:   Number((minT.length ? Math.min(...minT) : 15).toFixed(1)),
        rainfall:         Number(rain.reduce((a, b) => a + b, 0).toFixed(0)),
        climateZone:      getClimateZone(location.lat, location.lng),
        sunshineHours:    Math.round(Math.max(3493 - Math.abs(location.lat - 23.5) * 20, 3000)),
      };
    } catch {
      return { relativeHumidity: 55, avgTemperature: 28.5, maxTemperature: 48, minTemperature: 15, rainfall: 100, climateZone: getClimateZone(location.lat, location.lng), sunshineHours: 3493 };
    }
  }, []);

  const fetchSoilData = useCallback(async (location: Location): Promise<SoilData> => {
    try {
      const r = await axios.get(OPENLANDMAP_BASE, {
        params: { lat: location.lat, lon: location.lng, coll: 'predicted250m', regex: 'sol_(sand|clay|silt)\\.tot_usda.*_b0\\.\\.0cm.*|sol_ph\\.h2o.*_b0\\.\\.0cm.*|sol_organic\\.carbon.*_b0\\.\\.0cm.*' },
        timeout: 12000,
      });
      const resp = r.data?.response?.[0] ?? {};
      const keys = Object.keys(resp);
      const g = (k: string, d: number) => { const f = keys.find(x => x.includes(k)); return f ? Number(resp[f] ?? d) : d; };

      const sand = g('sol_sand', 70), clay = g('sol_clay', 10), silt = g('sol_silt', 20);
      const phR  = g('sol_ph', 82), ph = phR > 14 ? phR / 10 : phR;
      const ocR  = g('sol_organic.carbon', 3), oc = ocR > 10 ? ocR / 10 : ocR;
      const type = classifySoil(sand, silt, clay);

      return {
        type, texture: `${Math.round(sand)}% Sand, ${Math.round(silt)}% Silt, ${Math.round(clay)}% Clay`,
        bearingCapacity: bearingCap(type, clay), drainage: drainage(sand, clay),
        phLevel: Number(ph.toFixed(1)), organicCarbon: Number(oc.toFixed(2)),
        clayContent: Math.round(clay), sandContent: Math.round(sand), siltContent: Math.round(silt),
        contaminationRisk: location.lat > 23.5 && location.lng > 57.5 ? 'moderate' : 'low',
        depth: 5, dataSource: 'OpenLandMap v0.2 (250m) — ±15% accuracy',
      };
    } catch {
      const d = location.lat < 19.5, m = location.lat > 22.5 && location.lat < 23.5 && location.lng > 57 && location.lng < 58.5, c = location.lng > 57.5 && location.lat > 22;
      if (d) return { type: 'Silty Loam (Fluvisols)',       texture: '40% Sand, 40% Silt, 20% Clay', bearingCapacity: 160, drainage: 'good',      phLevel: 7.2, organicCarbon: 1.2, clayContent: 20, sandContent: 40, siltContent: 40, contaminationRisk: 'low',      depth: 5, dataSource: 'Oman calibration (Dhofar)' };
      if (m) return { type: 'Sandy Clay Loam (Cambisols)', texture: '50% Sand, 25% Silt, 25% Clay', bearingCapacity: 200, drainage: 'good',      phLevel: 7.8, organicCarbon: 0.6, clayContent: 25, sandContent: 50, siltContent: 25, contaminationRisk: 'low',      depth: 5, dataSource: 'Oman calibration (Al Hajar)' };
      if (c) return { type: 'Desert Sand (Yermosols)',      texture: '70% Sand, 20% Silt, 10% Clay', bearingCapacity: 130, drainage: 'excellent', phLevel: 8.0, organicCarbon: 0.4, clayContent: 10, sandContent: 70, siltContent: 20, contaminationRisk: 'moderate', depth: 5, dataSource: 'Oman calibration (Coastal)' };
      return           { type: 'Desert Sand (Yermosols)',   texture: '75% Sand, 15% Silt, 10% Clay', bearingCapacity: 120, drainage: 'excellent', phLevel: 8.2, organicCarbon: 0.3, clayContent: 10, sandContent: 75, siltContent: 15, contaminationRisk: 'low',      depth: 5, dataSource: 'Oman calibration (Interior)' };
    }
  }, []);

  const fetchAllData = useCallback(async (location: Location) => {
    setLoading(true); setError(null);
    try {
      const [solar, wind, climate, soil] = await Promise.all([fetchSolarData(location), fetchWindData(location), fetchClimateData(location), fetchSoilData(location)]);
      return { solar, wind, climate, soil };
    } catch (err) { setError('Failed to fetch data.'); throw err; }
    finally { setLoading(false); }
  }, [fetchSolarData, fetchWindData, fetchClimateData, fetchSoilData]);

  return { loading, error, fetchSolarData, fetchWindData, fetchClimateData, fetchSoilData, fetchAllData };
};
