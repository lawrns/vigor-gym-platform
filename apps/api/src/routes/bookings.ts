import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createBookingSchema = z.object({
  classId: z.string().uuid(),
  membershipId: z.string().uuid(),
});

// POST /v1/bookings - Create a new booking
router.post(
  '/',
  authRequired(['staff', 'manager', 'owner', 'member']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const validation = createBookingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validation.error.errors,
        });
      }

      const { classId, membershipId } = validation.data;
      const companyId = req.tenant!.companyId;

      // Verify membership belongs to the tenant
      const membership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          companyId: companyId,
          status: 'active',
        },
        include: {
          member: true,
        },
      });

      if (!membership) {
        return res.status(404).json({ message: 'Active membership not found or access denied' });
      }

      // Verify class exists and is in the future
      const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          gym: true,
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Check if class is in the future
      if (classData.startsAt <= new Date()) {
        return res.status(400).json({ message: 'Cannot book past or ongoing classes' });
      }

      // Check capacity
      if (classData._count.bookings >= classData.capacity) {
        return res.status(409).json({
          message: 'Class is fully booked',
          capacity: classData.capacity,
          currentBookings: classData._count.bookings,
        });
      }

      // Check for existing booking
      const existingBooking = await prisma.booking.findFirst({
        where: {
          classId: classId,
          membershipId: membershipId,
          status: {
            in: ['reserved', 'checked_in'],
          },
        },
      });

      if (existingBooking) {
        return res.status(409).json({
          message: 'Member already has a booking for this class',
          existingBooking: {
            id: existingBooking.id,
            status: existingBooking.status,
            bookedAt: existingBooking.createdAt,
          },
        });
      }

      // Create the booking
      const booking = await prisma.booking.create({
        data: {
          classId: classId,
          membershipId: membershipId,
          status: 'reserved',
        },
        include: {
          class: {
            include: {
              gym: true,
            },
          },
          membership: {
            include: {
              member: true,
            },
          },
        },
      });

      res.status(201).json({
        id: booking.id,
        status: booking.status,
        bookedAt: booking.createdAt,
        class: {
          id: booking.class.id,
          title: booking.class.title,
          startsAt: booking.class.startsAt,
          gym: {
            id: booking.class.gym.id,
            name: booking.class.gym.name,
            city: booking.class.gym.city,
          },
        },
        member: booking.membership.member
          ? {
              id: booking.membership.member.id,
              firstName: booking.membership.member.firstName,
              lastName: booking.membership.member.lastName,
              email: booking.membership.member.email,
            }
          : null,
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/bookings - List bookings for the tenant
router.get(
  '/',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const companyId = req.tenant!.companyId;
      const { page = 1, limit = 20, classId, memberId, status, from, to } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        membership: {
          companyId: companyId,
        },
      };

      if (classId) {
        where.classId = classId;
      }

      if (memberId) {
        where.membership.memberId = memberId;
      }

      if (status) {
        where.status = status;
      }

      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from as string);
        }
        if (to) {
          where.createdAt.lte = new Date(to as string);
        }
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            class: {
              include: {
                gym: true,
              },
            },
            membership: {
              include: {
                member: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.booking.count({ where }),
      ]);

      res.json({
        bookings: bookings.map(booking => ({
          id: booking.id,
          status: booking.status,
          bookedAt: booking.createdAt,
          class: {
            id: booking.class.id,
            title: booking.class.title,
            startsAt: booking.class.startsAt,
            gym: {
              id: booking.class.gym.id,
              name: booking.class.gym.name,
              city: booking.class.gym.city,
            },
          },
          member: booking.membership.member
            ? {
                id: booking.membership.member.id,
                firstName: booking.membership.member.firstName,
                lastName: booking.membership.member.lastName,
                email: booking.membership.member.email,
              }
            : null,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PATCH /v1/bookings/:id/checkin - Check in to a class
router.patch(
  '/:id/checkin',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const bookingId = req.params.id;
      const companyId = req.tenant!.companyId;

      // Find the booking and verify it belongs to the tenant
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          membership: {
            companyId: companyId,
          },
        },
        include: {
          class: true,
          membership: {
            include: {
              member: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found or access denied' });
      }

      if (booking.status !== 'reserved') {
        return res.status(400).json({
          message: 'Can only check in reserved bookings',
          currentStatus: booking.status,
        });
      }

      // Check if class is happening now (within 30 minutes before or after start time)
      const now = new Date();
      const classStart = booking.class.startsAt;
      const thirtyMinutesBefore = new Date(classStart.getTime() - 30 * 60 * 1000);
      const thirtyMinutesAfter = new Date(classStart.getTime() + 30 * 60 * 1000);

      if (now < thirtyMinutesBefore || now > thirtyMinutesAfter) {
        return res.status(400).json({
          message: 'Check-in only allowed 30 minutes before to 30 minutes after class start time',
          classStartsAt: classStart,
          currentTime: now,
        });
      }

      // Update booking status to checked_in
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'checked_in' },
        include: {
          class: {
            include: {
              gym: true,
            },
          },
          membership: {
            include: {
              member: true,
            },
          },
        },
      });

      res.json({
        id: updatedBooking.id,
        status: updatedBooking.status,
        bookedAt: updatedBooking.createdAt,
        class: {
          id: updatedBooking.class.id,
          title: updatedBooking.class.title,
          startsAt: updatedBooking.class.startsAt,
          gym: {
            id: updatedBooking.class.gym.id,
            name: updatedBooking.class.gym.name,
            city: updatedBooking.class.gym.city,
          },
        },
        member: updatedBooking.membership.member
          ? {
              id: updatedBooking.membership.member.id,
              firstName: updatedBooking.membership.member.firstName,
              lastName: updatedBooking.membership.member.lastName,
              email: updatedBooking.membership.member.email,
            }
          : null,
      });
    } catch (error) {
      console.error('Error checking in booking:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// DELETE /v1/bookings/:id - Cancel a booking
router.delete(
  '/:id',
  authRequired(['staff', 'manager', 'owner', 'member']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const bookingId = req.params.id;
      const companyId = req.tenant!.companyId;

      // Find the booking and verify it belongs to the tenant
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          membership: {
            companyId: companyId,
          },
        },
        include: {
          class: true,
        },
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found or access denied' });
      }

      if (booking.status === 'cancelled') {
        return res.status(400).json({ message: 'Booking is already cancelled' });
      }

      if (booking.status === 'checked_in') {
        return res
          .status(400)
          .json({ message: 'Cannot cancel a booking that has been checked in' });
      }

      // Check if cancellation is allowed (e.g., at least 2 hours before class)
      const now = new Date();
      const twoHoursBefore = new Date(booking.class.startsAt.getTime() - 2 * 60 * 60 * 1000);

      if (now > twoHoursBefore) {
        return res.status(400).json({
          message: 'Cancellation not allowed less than 2 hours before class start time',
          classStartsAt: booking.class.startsAt,
          currentTime: now,
        });
      }

      // Update booking status to cancelled
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
