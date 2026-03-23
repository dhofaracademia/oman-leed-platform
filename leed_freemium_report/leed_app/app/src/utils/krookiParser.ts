import proj4 from 'proj4';

// WGS84 projection definition
const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

export interface KrookiData {
  planNumber: string;
  wilayat: string;
  area: number;
  coordinates: {
    northing: number;
    easting: number;
  }[];
  centerPoint: {
    lat: number;
    lng: number;
  };
  polygon: [number, number][]; // [lat, lng][] for Leaflet
}

export interface ManualCoordinate {
  northing: number;
  easting: number;
  lat: number;
  lng: number;
}

/**
 * Convert UTM coordinates (NORTHING, EASTING) to Lat/Lng (WGS84)
 * Oman primarily uses UTM Zone 40N
 */
export function utmToLatLng(northing: number, easting: number, zone: number = 40): { lat: number; lng: number } {
  const utmProj = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
  const [lng, lat] = proj4(utmProj, WGS84, [easting, northing]);
  return { lat, lng };
}

/**
 * Convert Lat/Lng to UTM coordinates
 */
export function latLngToUtm(lat: number, lng: number, zone: number = 40): { northing: number; easting: number } {
  const utmProj = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
  const [easting, northing] = proj4(WGS84, utmProj, [lng, lat]);
  return { northing, easting };
}

/**
 * Calculate polygon area using the shoelace formula
 * Returns area in square meters
 */
export function calculatePolygonArea(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculate area from UTM coordinates (more accurate for Oman)
 */
export function calculateUtmArea(utms: { northing: number; easting: number }[]): number {
  if (utms.length < 3) return 0;
  
  let area = 0;
  const n = utms.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += utms[i].northing * utms[j].easting;
    area -= utms[j].northing * utms[i].easting;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Parse krooki text to extract UTM coordinates
 * Enhanced to detect various krooki formats
 */
export function parseKrookiText(text: string): KrookiData | null {
  const lines = text.split('\n');
  
  // Extract plan number - multiple patterns
  const planNumberMatch = text.match(/رقم\s*المسسل[\s:]*([0-9-]+)/i) || 
                          text.match(/رقم\s*الخارطة[\s:]*([0-9-]+)/i) ||
                          text.match(/رقم\s*الرسم[\s:]*([0-9-]+)/i) ||
                          text.match(/Plan\s*No[.\s:]*([0-9-]+)/i) ||
                          text.match(/Plan\s*Number[.\s:]*([0-9-]+)/i) ||
                          text.match(/([0-9]{2}-[0-9]{2}-[0-9]{3}-[0-9]{2}-[0-9]{4})/) ||
                          text.match(/([0-9]{2}-[0-9]{2}-[0-9]{3})/);
  const planNumber = planNumberMatch ? planNumberMatch[1].trim() : 'Unknown';
  
  // Extract wilayat - multiple patterns
  const wilayatMatch = text.match(/المنطقة[\s:]*([^\n]+)/i) || 
                       text.match(/الولاية[\s:]*([^\n]+)/i) ||
                       text.match(/الوﻻية[\s:]*([^\n]+)/i) ||
                       text.match(/Wilayat[.\s:]*([^\n]+)/i) ||
                       text.match(/Region[.\s:]*([^\n]+)/i);
  const wilayat = wilayatMatch ? wilayatMatch[1].trim() : 'Unknown';
  
  // Extract area - multiple patterns
  const areaMatch = text.match(/المساحة[\s:]*([0-9.,]+)/i) || 
                    text.match(/PLAN\s*AREA[\s=]*([0-9.,]+)/i) ||
                    text.match(/Area[.\s:]*([0-9.,]+)/i) ||
                    text.match(/([0-9.,]+)\s*SQ\s*M/i) ||
                    text.match(/([0-9.,]+)\s*م²/i);
  const area = areaMatch ? parseFloat(areaMatch[1].replace(/,/g, '')) : 0;
  
  // Extract UTM coordinates - multiple patterns
  const coordinates: { northing: number; easting: number }[] = [];
  
  // Pattern 1: Standard UTM GRID table format
  let inUtmSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect UTM section start
    if (line.includes('UTM GRID') || (line.includes('NORTHING') && line.includes('EASTING'))) {
      inUtmSection = true;
      continue;
    }
    
    if (inUtmSection) {
      // Match coordinate lines like: "1 2 1880419.14 255925.01" or "1880419.14 255925.01"
      const coordMatch = line.match(/^\s*(?:\d+\s+)?(?:\d+\s+)?([0-9.]{7,})\s+([0-9.]{6,})/) ||
                         line.match(/^\s*([0-9.]{7,})\s+([0-9.]{6,})\s/);
      if (coordMatch) {
        const northing = parseFloat(coordMatch[1]);
        const easting = parseFloat(coordMatch[2]);
        if (!isNaN(northing) && !isNaN(easting) && northing > 100000 && easting > 100000) {
          coordinates.push({ northing, easting });
        }
      }
      
      // Stop if we hit a non-coordinate line after finding coordinates
      if (coordinates.length > 0 && (line.includes('PLAN AREA') || line.includes('DIAGONAL') || line.includes('المساحة'))) {
        break;
      }
    }
  }
  
  // Pattern 2: Look for coordinate pairs anywhere in the text
  if (coordinates.length === 0) {
    // Look for patterns like: NORTHING: 1880419.14 EASTING: 255925.01
    const coordRegex = /(?:NORTHING|نورثينج|خطوط\s*الطول)[\s:]*([0-9.]{7,})[\s,]*(?:EASTING|ايستينج|خطوط\s*العرض)[\s:]*([0-9.]{6,})/gi;
    let match;
    while ((match = coordRegex.exec(text)) !== null) {
      const northing = parseFloat(match[1]);
      const easting = parseFloat(match[2]);
      if (!isNaN(northing) && !isNaN(easting)) {
        coordinates.push({ northing, easting });
      }
    }
  }
  
  // Pattern 3: Look for tabular data with 6-7 digit numbers
  if (coordinates.length === 0) {
    const allNumbers = text.match(/[0-9.]{6,}/g);
    if (allNumbers) {
      for (let i = 0; i < allNumbers.length - 1; i++) {
        const num1 = parseFloat(allNumbers[i]);
        const num2 = parseFloat(allNumbers[i + 1]);
        // Northing is typically larger (7+ digits), easting smaller (6+ digits)
        if (num1 > 1000000 && num2 > 100000 && num2 < 1000000) {
          coordinates.push({ northing: num1, easting: num2 });
        }
      }
    }
  }
  
  if (coordinates.length === 0) {
    return null;
  }
  
  // Calculate center point
  const avgNorthing = coordinates.reduce((sum, c) => sum + c.northing, 0) / coordinates.length;
  const avgEasting = coordinates.reduce((sum, c) => sum + c.easting, 0) / coordinates.length;
  const centerPoint = utmToLatLng(avgNorthing, avgEasting);
  
  // Convert all coordinates to polygon
  const polygon: [number, number][] = coordinates.map(c => {
    const latLng = utmToLatLng(c.northing, c.easting);
    return [latLng.lat, latLng.lng] as [number, number];
  });
  
  return {
    planNumber,
    wilayat,
    area,
    coordinates,
    centerPoint,
    polygon,
  };
}

/**
 * Parse manual 4-point coordinate input
 */
export function parseManualCoordinates(
  coords: { northing: number; easting: number }[]
): ManualCoordinate[] | null {
  if (coords.length < 3) return null;
  
  return coords.map(c => {
    const latLng = utmToLatLng(c.northing, c.easting);
    return {
      northing: c.northing,
      easting: c.easting,
      lat: latLng.lat,
      lng: latLng.lng,
    };
  });
}

/**
 * Extract coordinates from OCR text using multiple patterns
 */
export function extractCoordinatesFromOCR(text: string): { lat: number; lng: number } | null {
  // Clean up the text
  const cleanedText = text.replace(/,/g, '.').replace(/\s+/g, ' ');
  
  // Try to parse krooki format first
  const krookiData = parseKrookiText(cleanedText);
  if (krookiData) {
    return krookiData.centerPoint;
  }
  
  // Look for direct lat/lng patterns
  const latLngMatch = cleanedText.match(/([0-9]{2}\.[0-9]+)[,\s]+([0-9]{2,3}\.[0-9]+)/);
  if (latLngMatch) {
    const lat = parseFloat(latLngMatch[1]);
    const lng = parseFloat(latLngMatch[2]);
    // Validate Oman bounds
    if (lat >= 16.5 && lat <= 26.5 && lng >= 52 && lng <= 60) {
      return { lat, lng };
    }
  }
  
  return null;
}

/**
 * Get UTM zone for a given longitude
 * Oman spans zones 39, 40, and 41
 */
export function getUtmZone(longitude: number): number {
  return Math.floor((longitude + 180) / 6) + 1;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Format UTM coordinates for display
 */
export function formatUtmCoordinates(northing: number, easting: number): string {
  return `N: ${northing.toFixed(2)}, E: ${easting.toFixed(2)}`;
}

/**
 * Validate if coordinates form a valid polygon
 */
export function isValidPolygon(coordinates: [number, number][]): boolean {
  if (coordinates.length < 3) return false;
  
  // Check for duplicate consecutive points
  for (let i = 0; i < coordinates.length; i++) {
    const next = (i + 1) % coordinates.length;
    if (coordinates[i][0] === coordinates[next][0] && 
        coordinates[i][1] === coordinates[next][1]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculate centroid of a polygon
 */
export function calculateCentroid(coordinates: [number, number][]): { lat: number; lng: number } {
  if (coordinates.length === 0) return { lat: 0, lng: 0 };
  
  const sumLat = coordinates.reduce((sum, c) => sum + c[0], 0);
  const sumLng = coordinates.reduce((sum, c) => sum + c[1], 0);
  
  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
}
