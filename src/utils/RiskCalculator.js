/**
 * Calculate patient risk score based on emergency department utilization
 * According to project requirements:
 * - High risk: 4+ visits per year OR 8+ visits over 2 years
 * - Medium risk: 2-3 visits per year OR 4-7 visits over 2 years
 * - Low risk: <2 visits per year
 */

export function calculateRiskScore(encounters) {
  if (!encounters || encounters.length === 0) {
    return 'low';
  }

  const now = new Date();
  const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
  const twoYearsAgo = new Date(now.setFullYear(now.getFullYear() - 1));

  // Count visits in different time periods
  let visitsLastYear = 0;
  let visitsLastTwoYears = 0;

  encounters.forEach(entry => {
    const encounter = entry.resource || entry;
    if (encounter.period?.start) {
      const visitDate = new Date(encounter.period.start);

      if (visitDate >= oneYearAgo) {
        visitsLastYear++;
      }
      if (visitDate >= twoYearsAgo) {
        visitsLastTwoYears++;
      }
    }
  });

  // Determine risk level based on thresholds
  if (visitsLastYear >= 4 || visitsLastTwoYears >= 8) {
    return 'high';
  } else if (visitsLastYear >= 2 || visitsLastTwoYears >= 4) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get intervention recommendations based on risk level
 */
export function getInterventionRecommendations(riskLevel) {
  const recommendations = {
    high: [
      'Schedule immediate appointment with primary care provider',
      'Enroll in care coordination program',
      'Set up medication management consultation',
      'Consider home health services',
      'Establish relationship with care manager'
    ],
    medium: [
      'Schedule regular check-ups with primary care',
      'Review and optimize medication regimen',
      'Identify and address barriers to primary care access',
      'Consider telehealth options for routine care'
    ],
    low: [
      'Maintain regular primary care visits',
      'Continue current medication adherence',
      'Stay up to date with preventive care'
    ]
  };

  return recommendations[riskLevel] || recommendations.low;
}

/**
 * Identify patterns in ED visits
 */
export function analyzeVisitPatterns(encounters) {
  const patterns = {
    timeOfDay: {},
    dayOfWeek: {},
    reasons: {},
    seasonal: {}
  };

  encounters.forEach(entry => {
    const encounter = entry.resource || entry;

    if (encounter.period?.start) {
      const visitDate = new Date(encounter.period.start);

      // Time of day analysis
      const hour = visitDate.getHours();
      const timeSlot = hour < 8 ? 'night' : hour < 17 ? 'day' : 'evening';
      patterns.timeOfDay[timeSlot] = (patterns.timeOfDay[timeSlot] || 0) + 1;

      // Day of week analysis
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][visitDate.getDay()];
      patterns.dayOfWeek[dayName] = (patterns.dayOfWeek[dayName] || 0) + 1;

      // Reason analysis
      if (encounter.reasonCode && encounter.reasonCode[0]) {
        const reason = encounter.reasonCode[0].text || encounter.reasonCode[0].coding?.[0]?.display || 'Unknown';
        patterns.reasons[reason] = (patterns.reasons[reason] || 0) + 1;
      }

      // Seasonal analysis
      const month = visitDate.getMonth();
      const season = month < 3 ? 'Winter' : month < 6 ? 'Spring' : month < 9 ? 'Summer' : 'Fall';
      patterns.seasonal[season] = (patterns.seasonal[season] || 0) + 1;
    }
  });

  return patterns;
}