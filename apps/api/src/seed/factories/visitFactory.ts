/**
 * Visit Factory for Demo Data Generation
 * Creates realistic gym visit patterns with seasonal variations
 */

export interface VisitData {
  membershipId: string;
  gymId: string;
  checkIn: Date;
  checkOut: Date | null;
  duration?: number; // in minutes
}

export function createVisitFactory() {
  return {
    create(date: Date, membershipId: string, gymId: string): VisitData {
      // Generate realistic check-in times based on day patterns
      const checkInTime = this.generateCheckInTime(date);

      // Generate session duration (30-120 minutes, weighted toward 60-90)
      const duration = this.generateSessionDuration();

      const checkIn = new Date(date);
      checkIn.setHours(checkInTime.hours, checkInTime.minutes, 0, 0);

      // 85% of visits have check-out (some people forget to check out)
      const hasCheckOut = Math.random() < 0.85;
      const checkOut = hasCheckOut ? new Date(checkIn.getTime() + duration * 60 * 1000) : null;

      return {
        membershipId,
        gymId,
        checkIn,
        checkOut,
        duration: hasCheckOut ? duration : undefined,
      };
    },

    /**
     * Generate realistic check-in times based on gym usage patterns
     */
    generateCheckInTime(date: Date): { hours: number; minutes: number } {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Peak hours: 6-9 AM, 6-9 PM on weekdays; 9 AM-2 PM, 5-8 PM on weekends
      const peakHours = isWeekend
        ? [9, 10, 11, 12, 13, 14, 17, 18, 19, 20] // Weekend peaks
        : [6, 7, 8, 18, 19, 20, 21]; // Weekday peaks

      const offPeakHours = isWeekend
        ? [8, 15, 16, 21] // Weekend off-peak
        : [9, 10, 11, 12, 13, 14, 15, 16, 17, 22]; // Weekday off-peak

      // 70% chance of peak hours, 30% off-peak
      const usePeakHours = Math.random() < 0.7;
      const availableHours = usePeakHours ? peakHours : offPeakHours;

      const hours = availableHours[Math.floor(Math.random() * availableHours.length)];
      const minutes = Math.floor(Math.random() * 60); // Random minutes

      return { hours, minutes };
    },

    /**
     * Generate realistic session duration
     */
    generateSessionDuration(): number {
      // Weighted distribution: most sessions are 60-90 minutes
      const rand = Math.random();

      if (rand < 0.1) {
        // 10% short sessions (30-45 minutes)
        return 30 + Math.floor(Math.random() * 16);
      } else if (rand < 0.7) {
        // 60% medium sessions (60-90 minutes)
        return 60 + Math.floor(Math.random() * 31);
      } else if (rand < 0.9) {
        // 20% long sessions (90-120 minutes)
        return 90 + Math.floor(Math.random() * 31);
      } else {
        // 10% very long sessions (120-150 minutes)
        return 120 + Math.floor(Math.random() * 31);
      }
    },

    /**
     * Create visits for a specific day with realistic patterns
     */
    createDayVisits(
      date: Date,
      memberships: Array<{ id: string; memberId: string }>,
      gyms: Array<{ id: string; capacity: number }>,
      targetCount?: number
    ): VisitData[] {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      // Calculate target visits if not provided
      if (!targetCount) {
        const baseVisits = isWeekend ? 25 : 19; // Weekend uplift
        targetCount = Math.floor(baseVisits + Math.random() * 10);
      }

      const visits: VisitData[] = [];
      const usedMemberships = new Set<string>();

      for (let i = 0; i < targetCount; i++) {
        // Select a membership (avoid duplicates on same day)
        let membership;
        let attempts = 0;
        do {
          membership = memberships[Math.floor(Math.random() * memberships.length)];
          attempts++;
        } while (usedMemberships.has(membership.id) && attempts < 10);

        if (attempts >= 10) break; // Avoid infinite loop

        usedMemberships.add(membership.id);

        // Select gym (weighted by capacity)
        const totalCapacity = gyms.reduce((sum, gym) => sum + gym.capacity, 0);
        let randomCapacity = Math.random() * totalCapacity;
        let selectedGym = gyms[0];

        for (const gym of gyms) {
          randomCapacity -= gym.capacity;
          if (randomCapacity <= 0) {
            selectedGym = gym;
            break;
          }
        }

        const visit = this.create(date, membership.id, selectedGym.id);
        visits.push(visit);
      }

      return visits;
    },

    /**
     * Generate visit patterns for multiple days
     */
    createMultiDayVisits(
      startDate: Date,
      days: number,
      memberships: Array<{ id: string; memberId: string }>,
      gyms: Array<{ id: string; capacity: number }>
    ): VisitData[] {
      const allVisits: VisitData[] = [];

      for (let day = 0; day < days; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);

        const dayVisits = this.createDayVisits(currentDate, memberships, gyms);
        allVisits.push(...dayVisits);
      }

      return allVisits;
    },

    /**
     * Get visit statistics for validation
     */
    getVisitStats(visits: VisitData[]) {
      const totalVisits = visits.length;
      const withCheckOut = visits.filter(v => v.checkOut !== null).length;
      const avgDuration =
        visits.filter(v => v.duration).reduce((sum, v) => sum + (v.duration || 0), 0) /
        visits.filter(v => v.duration).length;

      return {
        totalVisits,
        withCheckOut,
        checkOutRate: withCheckOut / totalVisits,
        avgDuration: Math.round(avgDuration),
      };
    },
  };
}

/**
 * Utility function to validate visit data
 */
export function validateVisitData(visit: VisitData): boolean {
  return !!(
    visit.membershipId &&
    visit.gymId &&
    visit.checkIn &&
    visit.checkIn instanceof Date &&
    (!visit.checkOut || visit.checkOut instanceof Date) &&
    (!visit.checkOut || visit.checkOut > visit.checkIn)
  );
}
