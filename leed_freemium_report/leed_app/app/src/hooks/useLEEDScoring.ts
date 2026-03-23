import { useState, useCallback } from 'react';
import type { 
  Location, 
  SolarData, 
  WindData, 
  ClimateData, 
  SoilData,
  LandAssessment,
  LEEDCategory,
  OBCRecommendation,
  FutureImprovement 
} from '@/types';

// LEED v4.1 BD+C scoring categories - for reference only
const LEED_CATEGORIES = [
  {
    name: 'Location & Transportation',
    maxPoints: 16,
    icon: 'MapPin',
    description: 'Sustainable site selection and transportation access',
  },
  {
    name: 'Sustainable Sites',
    maxPoints: 10,
    icon: 'TreePine',
    description: 'Site design and management practices',
  },
  {
    name: 'Water Efficiency',
    maxPoints: 11,
    icon: 'Droplets',
    description: 'Water use reduction and efficiency',
  },
  {
    name: 'Energy & Atmosphere',
    maxPoints: 33,
    icon: 'Zap',
    description: 'Energy performance and renewable energy',
  },
  {
    name: 'Materials & Resources',
    maxPoints: 13,
    icon: 'Recycle',
    description: 'Sustainable material selection and waste management',
  },
  {
    name: 'Indoor Environmental Quality',
    maxPoints: 16,
    icon: 'Wind',
    description: 'Indoor air quality and occupant comfort',
  },
  {
    name: 'Innovation',
    maxPoints: 6,
    icon: 'Lightbulb',
    description: 'Innovative design and performance',
  },
  {
    name: 'Regional Priority',
    maxPoints: 4,
    icon: 'Award',
    description: 'Region-specific environmental priorities',
  },
];

// Calculate current land status points for Location & Transportation
const calculateLTCurrentPoints = (location: Location, soil: SoilData): number => {
  let points = 0;
  
  // LEED ND Location - brownfield assessment
  if (soil.contaminationRisk === 'high') points += 2;
  
  // Sensitive land protection
  if (soil.contaminationRisk === 'low') points += 1;
  
  // High priority site (based on Oman's development zones)
  if ((location.lat > 23.5 && location.lat < 24.0 && location.lng > 58.3 && location.lng < 58.7) ||
      (location.lat > 19.5 && location.lat < 20.0 && location.lng > 57.0 && location.lng < 57.5) ||
      (location.lat > 16.5 && location.lat < 17.5 && location.lng > 53.5 && location.lng < 55.0)) {
    points += 3;
  }
  
  return Math.min(points, 6); // Current land can only achieve partial
};

// Calculate potential points for Location & Transportation (design/construction)
const calculateLTPotentialPoints = (_location: Location, _soil: SoilData): number => {
  // These points can only be achieved during design/construction
  return 10; // Surrounding density, transit access, bike facilities, parking
};

// Calculate current land status points for Sustainable Sites
const calculateSSCurrentPoints = (_location: Location, climate: ClimateData, soil: SoilData): number => {
  let points = 0;
  
  // Site assessment (can be done with current data)
  if (soil.type && soil.bearingCapacity > 0) points += 1;
  
  // Site development - habitat protection assessment
  if (soil.contaminationRisk === 'low') points += 1;
  
  // Rainfall management potential
  if (climate.rainfall > 50) points += 1;
  
  return Math.min(points, 3); // Current land limited
};

// Calculate potential points for Sustainable Sites (design/construction)
const calculateSSPotentialPoints = (_location: Location, climate: ClimateData, _soil: SoilData): number => {
  let points = 0;
  
  // Construction activity pollution prevention
  points += 1;
  
  // Open space design
  if (climate.avgTemperature > 25) points += 1;
  
  // Heat island reduction (critical for Oman)
  if (climate.avgTemperature > 30) points += 2;
  
  // Light pollution reduction
  points += 1;
  
  // Site development - restore habitat
  points += 2;
  
  return Math.min(points, 7);
};

// Calculate current land status points for Water Efficiency
const calculateWECurrentPoints = (climate: ClimateData): number => {
  let points = 0;
  
  // Rainfall potential for water harvesting
  if (climate.rainfall > 50) points += 1;
  
  return points; // Very limited without building
};

// Calculate potential points for Water Efficiency (design/construction)
const calculateWEPotentialPoints = (climate: ClimateData): number => {
  let points = 0;
  
  // Outdoor water use reduction (critical in Oman)
  if (climate.rainfall < 200) points += 2;
  
  // Indoor water use reduction
  points += 4;
  
  // Cooling tower water use
  if (climate.avgTemperature > 30) points += 2;
  
  // Water metering
  points += 1;
  
  return Math.min(points, 9);
};

// Calculate current land status points for Energy & Atmosphere
const calculateEACurrentPoints = (solar: SolarData, wind: WindData): number => {
  let points = 0;
  
  // Renewable energy potential assessment
  if (solar.yearlyGHI > 2000) points += 2;
  else if (solar.yearlyGHI > 1800) points += 1;
  
  if (wind.turbineSuitability === 'good' || wind.turbineSuitability === 'excellent') {
    points += 1;
  }
  
  return Math.min(points, 3);
};

// Calculate potential points for Energy & Atmosphere (design/construction)
const calculateEAPotentialPoints = (solar: SolarData, wind: WindData, climate: ClimateData): number => {
  let points = 0;
  
  // Fundamental commissioning
  points += 1;
  
  // Minimum energy performance
  if (solar.yearlyGHI > 1800) points += 3;
  
  // Building-level energy metering
  points += 1;
  
  // Fundamental refrigerant management
  points += 1;
  
  // Enhanced commissioning
  points += 2;
  
  // Optimize energy performance
  if (climate.avgTemperature > 30) {
    points += 8;
  } else {
    points += 5;
  }
  
  // Advanced energy metering
  points += 1;
  
  // Renewable energy production
  if (solar.yearlyGHI > 2000) points += 5;
  else if (solar.yearlyGHI > 1800) points += 3;
  
  if (wind.turbineSuitability === 'good' || wind.turbineSuitability === 'excellent') {
    points += 2;
  }
  
  // Enhanced refrigerant management
  points += 1;
  
  // Measurement and verification
  points += 2;
  
  // Green power and carbon offsets
  points += 1;
  
  return Math.min(points, 30);
};

// Calculate current land status points for Materials & Resources
const calculateMRCurrentPoints = (soil: SoilData): number => {
  let points = 0;
  
  // Local material availability assessment
  if (soil.type.includes('Sand') || soil.type.includes('Loam')) points += 1;
  
  return points;
};

// Calculate potential points for Materials & Resources (design/construction)
const calculateMRPotentialPoints = (): number => {
  let points = 0;
  
  // Storage and collection of recyclables
  points += 1;
  
  // Construction and demolition waste management
  points += 2;
  
  // Building product disclosure
  points += 2;
  
  // Environmental product declarations
  points += 2;
  
  // Sourcing of raw materials
  points += 2;
  
  // Material ingredients
  points += 2;
  
  // Construction and demolition waste management (additional)
  points += 1;
  
  return Math.min(points, 12);
};

// Calculate current land status points for Indoor Environmental Quality
const calculateEQCurrentPoints = (climate: ClimateData, solar: SolarData): number => {
  let points = 0;
  
  // Natural ventilation potential
  if (climate.avgTemperature > 20 && climate.avgTemperature < 35) points += 1;
  
  // Daylight potential
  if (solar.yearlyGHI > 1800) points += 1;
  
  return Math.min(points, 2);
};

// Calculate potential points for Indoor Environmental Quality (design/construction)
const calculateEQPotentialPoints = (climate: ClimateData, solar: SolarData): number => {
  let points = 0;
  
  // Minimum indoor air quality performance
  points += 1;
  
  // Environmental tobacco smoke control
  points += 1;
  
  // Enhanced indoor air quality strategies
  points += 1;
  
  // Low-emitting materials
  points += 3;
  
  // Construction indoor air quality management plan
  points += 1;
  
  // Indoor air quality assessment
  points += 1;
  
  // Thermal comfort
  if (climate.avgTemperature > 30) points += 2;
  
  // Interior lighting
  if (solar.yearlyGHI > 1800) points += 2;
  
  // Daylight
  if (solar.yearlyGHI > 2000) points += 2;
  
  // Quality views
  points += 1;
  
  // Acoustic performance
  points += 1;
  
  return Math.min(points, 14);
};

// Calculate current land status points for Innovation
const calculateInnovationCurrentPoints = (solar: SolarData, wind: WindData): number => {
  let points = 0;
  
  // Renewable integration potential
  if (solar.yearlyGHI > 2000 && wind.turbineSuitability !== 'poor') {
    points += 1;
  }
  
  return points;
};

// Calculate potential points for Innovation (design/construction)
const calculateInnovationPotentialPoints = (solar: SolarData, wind: WindData): number => {
  let points = 0;
  
  // Innovation in design
  if (solar.yearlyGHI > 2000 && wind.turbineSuitability !== 'poor') {
    points += 3;
  } else if (solar.yearlyGHI > 1800) {
    points += 2;
  }
  
  // LEED Accredited Professional
  points += 1;
  
  // Additional innovation
  points += 1;
  
  return Math.min(points, 5);
};

// Calculate current land status points for Regional Priority
const calculateRPCurrentPoints = (climate: ClimateData, solar: SolarData): number => {
  let points = 0;
  
  // Renewable energy potential
  if (solar.yearlyGHI > 2000) points += 1;
  
  // Water efficiency potential
  if (climate.rainfall < 200) points += 1;
  
  return Math.min(points, 2);
};

// Calculate potential points for Regional Priority (design/construction)
const calculateRPPotentialPoints = (climate: ClimateData, solar: SolarData): number => {
  let points = 0;
  
  // Renewable energy
  if (solar.yearlyGHI > 2000) points += 1;
  
  // Water efficiency
  if (climate.rainfall < 200) points += 1;
  
  // Energy efficiency
  if (climate.avgTemperature > 30) points += 1;
  
  // Sustainable materials
  points += 1;
  
  return Math.min(points, 2);
};

export const useLEEDScoring = () => {
  const [loading, setLoading] = useState(false);

  const calculateAssessment = useCallback((
    location: Location,
    solar: SolarData,
    wind: WindData,
    climate: ClimateData,
    soil: SoilData
  ): LandAssessment => {
    setLoading(true);

    try {
      // Calculate CURRENT land status points (what the land offers now)
      const ltCurrent = calculateLTCurrentPoints(location, soil);
      const ssCurrent = calculateSSCurrentPoints(location, climate, soil);
      const weCurrent = calculateWECurrentPoints(climate);
      const eaCurrent = calculateEACurrentPoints(solar, wind);
      const mrCurrent = calculateMRCurrentPoints(soil);
      const eqCurrent = calculateEQCurrentPoints(climate, solar);
      const innovationCurrent = calculateInnovationCurrentPoints(solar, wind);
      const rpCurrent = calculateRPCurrentPoints(climate, solar);

      // Calculate POTENTIAL points (achievable during design/construction)
      const ltPotential = calculateLTPotentialPoints(location, soil);
      const ssPotential = calculateSSPotentialPoints(location, climate, soil);
      const wePotential = calculateWEPotentialPoints(climate);
      const eaPotential = calculateEAPotentialPoints(solar, wind, climate);
      const mrPotential = calculateMRPotentialPoints();
      const eqPotential = calculateEQPotentialPoints(climate, solar);
      const innovationPotential = calculateInnovationPotentialPoints(solar, wind);
      const rpPotential = calculateRPPotentialPoints(climate, solar);

      const categories: LEEDCategory[] = [
        { 
          ...LEED_CATEGORIES[0], 
          currentPoints: ltCurrent, 
          possiblePoints: ltCurrent + ltPotential 
        },
        { 
          ...LEED_CATEGORIES[1], 
          currentPoints: ssCurrent, 
          possiblePoints: ssCurrent + ssPotential 
        },
        { 
          ...LEED_CATEGORIES[2], 
          currentPoints: weCurrent, 
          possiblePoints: weCurrent + wePotential 
        },
        { 
          ...LEED_CATEGORIES[3], 
          currentPoints: eaCurrent, 
          possiblePoints: eaCurrent + eaPotential 
        },
        { 
          ...LEED_CATEGORIES[4], 
          currentPoints: mrCurrent, 
          possiblePoints: mrCurrent + mrPotential 
        },
        { 
          ...LEED_CATEGORIES[5], 
          currentPoints: eqCurrent, 
          possiblePoints: eqCurrent + eqPotential 
        },
        { 
          ...LEED_CATEGORIES[6], 
          currentPoints: innovationCurrent, 
          possiblePoints: innovationCurrent + innovationPotential 
        },
        { 
          ...LEED_CATEGORIES[7], 
          currentPoints: rpCurrent, 
          possiblePoints: rpCurrent + rpPotential 
        },
      ];

      const currentTotal = categories.reduce((sum, cat) => sum + cat.currentPoints, 0);
      const potentialTotal = categories.reduce((sum, cat) => sum + (cat.possiblePoints - cat.currentPoints), 0);
      const maxPossible = currentTotal + potentialTotal;

      return {
        currentScore: currentTotal,
        potentialScore: potentialTotal,
        maxPossibleScore: maxPossible,
        categories,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const generateOBCRecommendations = useCallback((
    _location: Location,
    solar: SolarData,
    wind: WindData,
    climate: ClimateData,
    soil: SoilData
  ): OBCRecommendation[] => {
    const recommendations: OBCRecommendation[] = [
      {
        id: 'obc-1',
        category: 'Orientation & Solar Design',
        title: 'Building Orientation',
        description: `Based on solar analysis: Orient building with larger openings towards north (${solar.optimalAzimuth}° azimuth), smaller openings towards east, south, and west. Optimal tilt angle: ${solar.optimalTilt}° for solar panels.`,
        status: 'future',
        priority: 'high',
        obcReference: 'Oman Energy Efficiency & Sustainability Code §4.2.1',
        leedReference: 'EA Credit: Optimize Energy Performance',
        potentialScoreIncrease: 8,
        implementationCost: 'low',
        implementationPhase: 'Design',
      },
      {
        id: 'obc-2',
        category: 'Building Envelope',
        title: 'Thermal Insulation',
        description: `Climate requires high insulation (avg temp: ${climate.avgTemperature}°C). Improve thermal insulation of walls, roof, and floor per OBC requirements. Window-to-wall ratio should be 15-25%. Use multi-layer glazing with low-E coating.`,
        status: 'future',
        priority: 'high',
        obcReference: 'Oman Energy Efficiency & Sustainability Code §4.3.2',
        leedReference: 'EA Credit: Optimize Energy Performance',
        potentialScoreIncrease: 8,
        implementationCost: 'medium',
        implementationPhase: 'Design & Construction',
      },
      {
        id: 'obc-3',
        category: 'Renewable Energy',
        title: 'Solar PV Integration',
        description: `Excellent solar potential: ${solar.yearlyGHI} kWh/m²/year. Install rooftop solar PV with ${solar.optimalTilt}° tilt facing ${solar.optimalAzimuth}°. Expected production: ${solar.pvProductionPotential} kWh/kWp/year. Consider dust mitigation systems (current impact: ${solar.dustImpactValue}% loss).`,
        status: 'future',
        priority: 'high',
        obcReference: 'Oman Energy Efficiency & Sustainability Code §5.1',
        leedReference: 'EA Credit: Renewable Energy Production',
        potentialScoreIncrease: 5,
        implementationCost: 'medium',
        implementationPhase: 'Design & Construction',
      },
      {
        id: 'obc-4',
        category: 'Renewable Energy',
        title: 'Wind Energy Assessment',
        description: `Wind speed: ${wind.averageSpeed} m/s, Energy density: ${wind.energyDensity} W/m². Suitability: ${wind.turbineSuitability}. Prevailing direction: ${wind.prevailingDirection}. ${wind.turbineSuitability === 'good' || wind.turbineSuitability === 'excellent' ? 'Consider small wind turbine installation.' : 'Wind energy not recommended for this location.'}`,
        status: wind.turbineSuitability === 'good' || wind.turbineSuitability === 'excellent' ? 'future' : 'na',
        priority: wind.turbineSuitability === 'good' || wind.turbineSuitability === 'excellent' ? 'medium' : 'low',
        obcReference: 'Oman Energy Efficiency & Sustainability Code §5.2',
        leedReference: 'EA Credit: Renewable Energy Production',
        potentialScoreIncrease: 2,
        implementationCost: 'high',
        implementationPhase: 'Design & Construction',
      },
      {
        id: 'obc-5',
        category: 'Water Conservation',
        title: 'Water Efficiency Systems',
        description: `Arid climate with ${climate.rainfall}mm annual rainfall. Install low-flow fixtures, consider greywater recycling system. Use drought-resistant native plants and drip irrigation. Implement rainwater harvesting if feasible.`,
        status: 'future',
        priority: 'high',
        obcReference: 'Oman Building Code - Plumbing §3.4',
        leedReference: 'WE Credit: Indoor Water Use Reduction',
        potentialScoreIncrease: 6,
        implementationCost: 'low',
        implementationPhase: 'Design & Construction',
      },
      {
        id: 'obc-6',
        category: 'Sustainable Materials',
        title: 'Local Materials Sourcing',
        description: `Soil type: ${soil.type}. Utilize local construction materials to reduce transportation emissions. Soil bearing capacity (${soil.bearingCapacity} kPa) suitable for foundation design. Consider local aggregate, limestone, and sand resources.`,
        status: 'future',
        priority: 'medium',
        obcReference: 'Oman Building Code §6.2.1',
        leedReference: 'MR Credit: Sourcing of Raw Materials',
        potentialScoreIncrease: 2,
        implementationCost: 'low',
        implementationPhase: 'Construction',
      },
      {
        id: 'obc-7',
        category: 'Indoor Environmental Quality',
        title: 'Natural Ventilation Design',
        description: `Wind conditions: ${wind.averageSpeed} m/s average, direction ${wind.prevailingDirection}. Design building for cross-ventilation during mild weather periods (November-March). Consider operable windows and ventilation shafts.`,
        status: wind.averageSpeed > 4 ? 'future' : 'na',
        priority: 'medium',
        obcReference: 'Oman Building Code - Mechanical §4.1',
        leedReference: 'EQ Credit: Natural Ventilation',
        potentialScoreIncrease: 2,
        implementationCost: 'low',
        implementationPhase: 'Design',
      },
      {
        id: 'obc-8',
        category: 'Building Performance',
        title: 'Smart Building Management System',
        description: 'Install automated building management system (BMS) for monitoring and controlling temperature, humidity, and energy use. Essential for Omani climate with high cooling demands. Include energy metering and sub-metering.',
        status: 'future',
        priority: 'medium',
        obcReference: 'Oman Energy Efficiency & Sustainability Code §7.1',
        leedReference: 'EA Credit: Advanced Energy Metering',
        potentialScoreIncrease: 3,
        implementationCost: 'medium',
        implementationPhase: 'Design & Construction',
      },
      {
        id: 'obc-9',
        category: 'Sustainable Sites',
        title: 'Heat Island Reduction',
        description: `High temperature climate (${climate.avgTemperature}°C average). Use high-SRI roofing materials, cool pavements, and shade structures. Consider green spaces and vegetation to reduce ambient temperature.`,
        status: climate.avgTemperature > 30 ? 'future' : 'na',
        priority: climate.avgTemperature > 30 ? 'high' : 'low',
        obcReference: 'Oman Energy Efficiency & Sustainability Code §4.4',
        leedReference: 'SS Credit: Heat Island Reduction',
        potentialScoreIncrease: 2,
        implementationCost: 'low',
        implementationPhase: 'Design',
      },
      {
        id: 'obc-10',
        category: 'Location & Transportation',
        title: 'Alternative Transportation',
        description: 'Provide bicycle storage and changing facilities. Consider EV charging infrastructure for future readiness. Design for pedestrian accessibility.',
        status: 'future',
        priority: 'low',
        obcReference: 'Oman Building Code - General Requirements',
        leedReference: 'LT Credit: Bicycle Facilities',
        potentialScoreIncrease: 1,
        implementationCost: 'low',
        implementationPhase: 'Design',
      },
    ];

    return recommendations.filter(r => r.status !== 'na');
  }, []);

  const generateFutureImprovements = useCallback((
    solar: SolarData,
    wind: WindData,
    climate: ClimateData,
    _soil: SoilData
  ): FutureImprovement[] => {
    const improvements: FutureImprovement[] = [];

    // Solar optimization
    if (solar.yearlyGHI > 2000) {
      improvements.push({
        id: 'imp-1',
        title: 'Advanced Solar Integration',
        description: 'Install building-integrated photovoltaics (BIPV) with battery storage system.',
        currentStatus: 'No system',
        potentialStatus: 'BIPV with 4-hour battery storage',
        leedPointsIncrease: 5,
        estimatedCost: 'OMR 25,000 - 40,000',
        paybackPeriod: '8-12 years',
        priority: 'high',
        implementationPhase: 'Design & Construction',
      });
    }

    // Wind energy
    if (wind.turbineSuitability === 'good' || wind.turbineSuitability === 'excellent') {
      improvements.push({
        id: 'imp-2',
        title: 'Small Wind Turbine',
        description: `Install small wind turbine suitable for ${wind.averageSpeed} m/s average wind speed.`,
        currentStatus: 'No wind generation',
        potentialStatus: '10kW wind turbine',
        leedPointsIncrease: 2,
        estimatedCost: 'OMR 8,000 - 15,000',
        paybackPeriod: '10-15 years',
        priority: 'medium',
        implementationPhase: 'Design & Construction',
      });
    }

    // Water efficiency (critical for Oman)
    improvements.push({
      id: 'imp-3',
      title: 'Greywater Recycling System',
      description: 'Implement greywater treatment and reuse for irrigation and toilet flushing.',
      currentStatus: 'Standard plumbing',
      potentialStatus: 'Treated greywater reuse',
      leedPointsIncrease: 3,
      estimatedCost: 'OMR 5,000 - 10,000',
      paybackPeriod: '5-8 years',
      priority: 'high',
      implementationPhase: 'Design & Construction',
    });

    // Thermal comfort
    if (climate.avgTemperature > 30) {
      improvements.push({
        id: 'imp-4',
        title: 'High-Performance Building Envelope',
        description: 'Upgrade to super-insulated walls (R-30+), cool roof technology, and triple-glazed windows.',
        currentStatus: 'Standard insulation',
        potentialStatus: 'Super-insulated envelope',
        leedPointsIncrease: 8,
        estimatedCost: 'OMR 15,000 - 25,000',
        paybackPeriod: '6-10 years',
        priority: 'high',
        implementationPhase: 'Design & Construction',
      });
    }

    // EV charging
    improvements.push({
      id: 'imp-5',
      title: 'EV Charging Infrastructure',
      description: 'Install EV charging stations with renewable energy integration.',
      currentStatus: 'No EV infrastructure',
      potentialStatus: '2x EV chargers with solar',
      leedPointsIncrease: 2,
      estimatedCost: 'OMR 3,000 - 6,000',
      paybackPeriod: 'N/A (amenity)',
      priority: 'medium',
      implementationPhase: 'Design',
    });

    // Green roof (if structurally feasible)
    if (_soil.bearingCapacity > 150) {
      improvements.push({
        id: 'imp-6',
        title: 'Green Roof System',
        description: 'Install extensive green roof with native drought-resistant plants.',
        currentStatus: 'Standard roof',
        potentialStatus: 'Extensive green roof (10cm)',
        leedPointsIncrease: 3,
        estimatedCost: 'OMR 12,000 - 20,000',
        paybackPeriod: '10-15 years',
        priority: 'low',
        implementationPhase: 'Design & Construction',
      });
    }

    // Smart building
    improvements.push({
      id: 'imp-7',
      title: 'AI-Powered Building Management',
      description: 'Implement predictive analytics for energy optimization and predictive maintenance.',
      currentStatus: 'Basic BMS',
      potentialStatus: 'AI-optimized building',
      leedPointsIncrease: 3,
      estimatedCost: 'OMR 8,000 - 15,000',
      paybackPeriod: '4-7 years',
      priority: 'medium',
      implementationPhase: 'Design & Construction',
    });

    return improvements.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, []);

  return {
    loading,
    calculateAssessment,
    generateOBCRecommendations,
    generateFutureImprovements,
  };
};
