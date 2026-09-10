/**
 * ChargeLoop Booking State Machine
 *
 * Centralizes all booking status transitions with validation.
 * Every status change in the system MUST go through transitionBookingStatus().
 *
 * States:
 *   pending   → accepted, declined, expired, cancelled
 *   accepted  → ongoing, cancelled, completed
 *   ongoing   → completed, cancelled
 *   completed → (terminal)
 *   declined  → (terminal)
 *   expired   → (terminal)
 *   cancelled → (terminal)
 *
 * Actors:
 *   user   — the EV driver who made the booking
 *   host   — the charger owner
 *   system — auto-expiry worker, cron jobs
 */

const VALID_TRANSITIONS = {
  pending:   ['accepted', 'declined', 'expired', 'cancelled'],
  accepted:  ['ongoing', 'cancelled', 'completed'],
  ongoing:   ['completed', 'cancelled'],
  completed: [],
  declined:  [],
  expired:   [],
  cancelled: [],
};

/**
 * Which actors may trigger each target status.
 * If a status is not listed here, any actor can trigger it (shouldn't happen
 * because VALID_TRANSITIONS already limits reachability).
 */
const ACTOR_PERMISSIONS = {
  accepted:  ['host'],
  declined:  ['host'],
  ongoing:   ['host', 'system'],
  completed: ['host', 'user'],
  cancelled: ['host', 'user'],
  expired:   ['system'],
};

/**
 * Check whether a transition from `fromStatus` to `toStatus` is valid.
 *
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
function canTransition(fromStatus, toStatus) {
  const allowed = VALID_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

/**
 * Transition a booking document to a new status.
 *
 * Validates:
 *   1. The transition is allowed by the state machine.
 *   2. The actor has permission to trigger the target status.
 *
 * Side-effects on the booking document (does NOT call .save()):
 *   - Sets `status` to `toStatus`
 *   - Sets timestamps and metadata based on the transition
 *
 * @param {object}  booking   Mongoose BookingRequest document (not lean)
 * @param {string}  toStatus  Target status
 * @param {string}  actor     'user' | 'host' | 'system'
 * @param {object}  [meta]    Optional metadata (reason, etc.)
 * @returns {object} The mutated booking document (unsaved)
 * @throws {Error}  If the transition is invalid or unauthorized
 */
function transitionBookingStatus(booking, toStatus, actor, meta = {}) {
  const fromStatus = booking.status;

  // 1. Validate the transition
  if (!canTransition(fromStatus, toStatus)) {
    const err = new Error(
      `Invalid booking transition: '${fromStatus}' → '${toStatus}'. ` +
      `Allowed from '${fromStatus}': [${(VALID_TRANSITIONS[fromStatus] || []).join(', ')}]`
    );
    err.code = 'INVALID_TRANSITION';
    err.statusCode = 400;
    throw err;
  }

  // 2. Validate actor permissions
  const allowedActors = ACTOR_PERMISSIONS[toStatus];
  if (allowedActors && !allowedActors.includes(actor)) {
    const err = new Error(
      `Actor '${actor}' is not allowed to transition booking to '${toStatus}'. ` +
      `Allowed actors: [${allowedActors.join(', ')}]`
    );
    err.code = 'UNAUTHORIZED_TRANSITION';
    err.statusCode = 403;
    throw err;
  }

  const now = new Date();

  // 3. Apply the transition
  booking.status = toStatus;

  // 4. Set timestamps and metadata based on the target status
  switch (toStatus) {
    case 'accepted':
      booking.startTime = booking.scheduledTime;
      booking.hostResponse = {
        ...(booking.hostResponse || {}),
        respondedAt: now,
        acceptedAt: now,
      };
      break;

    case 'declined':
      booking.hostResponse = {
        ...(booking.hostResponse || {}),
        respondedAt: now,
        declinedAt: now,
        declineReason: meta.reason || 'No reason provided',
      };
      break;

    case 'ongoing':
      if (!booking.startTime) {
        booking.startTime = now;
      }
      break;

    case 'completed':
      booking.endTime = now;
      if (booking.startTime) {
        booking.actualDuration = Math.max(
          1,
          Math.round((now - new Date(booking.startTime)) / (1000 * 60))
        );
      }
      break;

    case 'cancelled':
      booking.endTime = now;
      if (actor === 'host') {
        booking.hostResponse = {
          ...(booking.hostResponse || {}),
          respondedAt: now,
          cancelledAt: now,
          cancelReason: meta.reason || 'Host cancelled the booking',
        };
      } else if (actor === 'user') {
        booking.metadata = booking.metadata || {};
        booking.metadata.cancellationReason = meta.reason || 'User cancelled the booking';
        booking.metadata.cancelledBy = 'user';
      }
      break;

    case 'expired':
      booking.hostResponse = {
        ...(booking.hostResponse || {}),
        respondedAt: now,
        autoExpired: true,
        expiryReason: meta.reason || 'Host did not respond within the allowed time',
      };
      break;
  }

  return booking;
}

module.exports = {
  VALID_TRANSITIONS,
  ACTOR_PERMISSIONS,
  canTransition,
  transitionBookingStatus,
};
