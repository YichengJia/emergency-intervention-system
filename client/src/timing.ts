// client/src/timing.ts
// Utility functions for parsing medication timing from FHIR dosage instructions

/**
 * Parse medication dosage text to extract specific times of day
 * This function handles various common medication timing formats
 * and converts them to specific clock times for patient reminders
 */
export function parseTimesFromDosageText(dosageText: string): string[] {
  const times: string[] = [];
  const text = dosageText.toLowerCase();

  // Handle specific time patterns (e.g., "at 8am", "at 9:00 PM")
  const timePattern = /at\s+(\d{1,2}):?(\d{0,2})?\s*(am|pm)?/gi;
  let match;
  while ((match = timePattern.exec(text)) !== null) {
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const period = match[3];

    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;

    times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }

  // If specific times were found, return them
  if (times.length > 0) {
    return times;
  }

  // Parse frequency-based instructions
  // BID (twice daily) - typically morning and evening
  if (/\bbid\b|twice\s+(a\s+)?daily|twice\s+(a\s+)?day|2\s+times\s+(a\s+)?day/i.test(text)) {
    times.push("08:00", "20:00");
  }
  // TID (three times daily) - morning, afternoon, evening
  else if (/\btid\b|three\s+times\s+(a\s+)?daily|three\s+times\s+(a\s+)?day|3\s+times\s+(a\s+)?day/i.test(text)) {
    times.push("08:00", "14:00", "20:00");
  }
  // QID (four times daily) - morning, noon, evening, bedtime
  else if (/\bqid\b|four\s+times\s+(a\s+)?daily|four\s+times\s+(a\s+)?day|4\s+times\s+(a\s+)?day/i.test(text)) {
    times.push("08:00", "12:00", "17:00", "21:00");
  }
  // Q6H (every 6 hours)
  else if (/\bq6h\b|every\s+6\s+hours/i.test(text)) {
    times.push("06:00", "12:00", "18:00", "00:00");
  }
  // Q8H (every 8 hours)
  else if (/\bq8h\b|every\s+8\s+hours/i.test(text)) {
    times.push("06:00", "14:00", "22:00");
  }
  // Q12H (every 12 hours)
  else if (/\bq12h\b|every\s+12\s+hours/i.test(text)) {
    times.push("08:00", "20:00");
  }
  // Daily/Once daily
  else if (/\bqd\b|\bdaily\b|once\s+(a\s+)?day|1\s+time\s+(a\s+)?day/i.test(text)) {
    // Check for specific timing hints
    if (/morning|breakfast|am\b/i.test(text)) {
      times.push("08:00");
    } else if (/evening|dinner|pm\b|supper/i.test(text)) {
      times.push("18:00");
    } else if (/bedtime|night|hs\b/i.test(text)) {
      times.push("21:00");
    } else if (/noon|lunch|midday/i.test(text)) {
      times.push("12:00");
    } else {
      // Default to morning for once daily
      times.push("08:00");
    }
  }
  // Meal-based timing
  else if (/before\s+breakfast|ac\s+breakfast/i.test(text)) {
    times.push("07:30");
  }
  else if (/with\s+breakfast|at\s+breakfast/i.test(text)) {
    times.push("08:00");
  }
  else if (/after\s+breakfast|pc\s+breakfast/i.test(text)) {
    times.push("08:30");
  }
  else if (/before\s+lunch|ac\s+lunch/i.test(text)) {
    times.push("11:30");
  }
  else if (/with\s+lunch|at\s+lunch/i.test(text)) {
    times.push("12:00");
  }
  else if (/after\s+lunch|pc\s+lunch/i.test(text)) {
    times.push("12:30");
  }
  else if (/before\s+dinner|ac\s+dinner|before\s+supper|ac\s+supper/i.test(text)) {
    times.push("17:30");
  }
  else if (/with\s+dinner|at\s+dinner|with\s+supper|at\s+supper/i.test(text)) {
    times.push("18:00");
  }
  else if (/after\s+dinner|pc\s+dinner|after\s+supper|pc\s+supper/i.test(text)) {
    times.push("18:30");
  }
  else if (/bedtime|hs\b|at\s+night/i.test(text)) {
    times.push("21:00");
  }
  // PRN (as needed) - no specific times
  else if (/\bprn\b|as\s+needed|when\s+needed|if\s+needed/i.test(text)) {
    // Return empty array for PRN medications
    return [];
  }

  // Handle "every X hours" patterns not covered above
  const everyHoursPattern = /every\s+(\d+)\s+hours?/i;
  const everyMatch = everyHoursPattern.exec(text);
  if (everyMatch && times.length === 0) {
    const interval = parseInt(everyMatch[1]);
    const timesPerDay = Math.floor(24 / interval);
    const startHour = 6; // Start at 6 AM

    for (let i = 0; i < timesPerDay && i < 4; i++) { // Max 4 times per day
      const hour = (startHour + (i * interval)) % 24;
      times.push(`${hour.toString().padStart(2, '0')}:00`);
    }
  }

  // If no pattern matched, return default times based on common patterns
  if (times.length === 0) {
    // Check for any numeric frequency
    const numericPattern = /(\d+)\s+times?\s+(per\s+)?(a\s+)?day/i;
    const numMatch = numericPattern.exec(text);
    if (numMatch) {
      const frequency = parseInt(numMatch[1]);
      switch (frequency) {
        case 1:
          times.push("08:00");
          break;
        case 2:
          times.push("08:00", "20:00");
          break;
        case 3:
          times.push("08:00", "14:00", "20:00");
          break;
        case 4:
          times.push("08:00", "12:00", "17:00", "21:00");
          break;
        default:
          // For higher frequencies, distribute evenly
          const interval = Math.floor(24 / frequency);
          for (let i = 0; i < frequency && i < 6; i++) {
            const hour = (8 + (i * interval)) % 24;
            times.push(`${hour.toString().padStart(2, '0')}:00`);
          }
      }
    }
  }

  // Sort times chronologically and remove duplicates
  return [...new Set(times)].sort();
}

/**
 * Format a time string for display
 * Converts 24-hour format to 12-hour format with AM/PM
 */
export function formatTimeForDisplay(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr);
  const minute = minuteStr || '00';

  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${period}`;
}

/**
 * Parse FHIR Timing object to extract schedule information
 * This handles the structured timing data from FHIR resources
 */
export function parseFHIRTiming(timing: any): string[] {
  const times: string[] = [];

  if (!timing) return times;

  // Handle timing.repeat structure
  if (timing.repeat) {
    const repeat = timing.repeat;

    // Handle when array (specific times of day codes)
    if (repeat.when && Array.isArray(repeat.when)) {
      repeat.when.forEach((whenCode: string) => {
        switch (whenCode) {
          case 'MORN':
          case 'CM':
            times.push('08:00');
            break;
          case 'NOON':
            times.push('12:00');
            break;
          case 'AFT':
          case 'CV':
            times.push('14:00');
            break;
          case 'EVE':
          case 'CD':
            times.push('18:00');
            break;
          case 'NIGHT':
          case 'HS':
            times.push('21:00');
            break;
          case 'AC': // before meals
            times.push('07:30', '11:30', '17:30');
            break;
          case 'PC': // after meals
            times.push('08:30', '12:30', '18:30');
            break;
        }
      });
    }

    // Handle timeOfDay array (specific clock times)
    if (repeat.timeOfDay && Array.isArray(repeat.timeOfDay)) {
      repeat.timeOfDay.forEach((tod: string) => {
        // Ensure format is HH:mm
        if (tod.match(/^\d{2}:\d{2}/)) {
          times.push(tod.substring(0, 5));
        }
      });
    }

    // Handle frequency and period
    if (repeat.frequency && repeat.period && repeat.periodUnit) {
      const freq = repeat.frequency;
      const period = repeat.period;
      const unit = repeat.periodUnit;

      if (unit === 'd' && period === 1) {
        // X times per day
        if (freq === 1) times.push('08:00');
        else if (freq === 2) times.push('08:00', '20:00');
        else if (freq === 3) times.push('08:00', '14:00', '20:00');
        else if (freq === 4) times.push('08:00', '12:00', '17:00', '21:00');
      }
    }
  }

  // Handle timing.code (coded timing like BID, TID, etc.)
  if (timing.code?.coding) {
    timing.code.coding.forEach((coding: any) => {
      const code = coding.code?.toUpperCase();
      switch (code) {
        case 'BID':
          times.push('08:00', '20:00');
          break;
        case 'TID':
          times.push('08:00', '14:00', '20:00');
          break;
        case 'QID':
          times.push('08:00', '12:00', '17:00', '21:00');
          break;
        case 'QD':
        case 'DAILY':
          times.push('08:00');
          break;
        case 'QHS':
          times.push('21:00');
          break;
      }
    });
  }

  // Remove duplicates and sort
  return [...new Set(times)].sort();
}

/**
 * Calculate next dose time based on current time and schedule
 */
export function getNextDoseTime(schedule: string[]): { time: string; isToday: boolean } | null {
  if (schedule.length === 0) return null;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  // Find next time today
  for (const time of schedule) {
    if (time > currentTimeStr) {
      return { time, isToday: true };
    }
  }

  // If no more doses today, return first dose tomorrow
  return { time: schedule[0], isToday: false };
}

/**
 * Check if a dose is overdue based on schedule and grace period
 */
export function isDoseOverdue(
  scheduleTime: string,
  gracePeriodMinutes: number = 30
): boolean {
  const now = new Date();
  const [hour, minute] = scheduleTime.split(':').map(Number);

  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // If scheduled time is in the past
  if (scheduledTime < now) {
    const diffMinutes = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);
    return diffMinutes > gracePeriodMinutes;
  }

  return false;
}

/**
 * Generate reminder message based on medication schedule
 */
export function generateReminderMessage(
  medicationName: string,
  scheduleTime: string,
  instructions?: string
): string {
  const formattedTime = formatTimeForDisplay(scheduleTime);
  let message = `Time to take ${medicationName} at ${formattedTime}`;

  if (instructions) {
    // Add relevant instructions
    if (/with food/i.test(instructions)) {
      message += ' - Take with food';
    } else if (/empty stomach/i.test(instructions)) {
      message += ' - Take on empty stomach';
    } else if (/with water/i.test(instructions)) {
      message += ' - Take with full glass of water';
    }
  }

  return message;
}

/**
 * Calculate medication adherence rate based on taken/missed doses
 */
export function calculateAdherenceRate(
  takenDoses: number,
  missedDoses: number
): number {
  const totalDoses = takenDoses + missedDoses;
  if (totalDoses === 0) return 100;

  return Math.round((takenDoses / totalDoses) * 100);
}

/**
 * Determine if medication schedule is complex
 * Complex schedules have higher risk of non-adherence
 */
export function isComplexSchedule(schedule: string[]): boolean {
  // Consider schedule complex if:
  // - More than 3 doses per day
  // - Irregular timing (not evenly spaced)
  // - Specific timing requirements

  if (schedule.length > 3) return true;

  if (schedule.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < schedule.length; i++) {
      const [h1, m1] = schedule[i - 1].split(':').map(Number);
      const [h2, m2] = schedule[i].split(':').map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      intervals.push(diff);
    }

    // Check if intervals vary by more than 60 minutes
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const hasIrregularIntervals = intervals.some(i => Math.abs(i - avgInterval) > 60);
    if (hasIrregularIntervals) return true;
  }

  return false;
}