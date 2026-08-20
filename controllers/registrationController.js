const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.registerForEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.body;

  if (!eventId) {
    return next(new AppError(400, 'Event ID is required'));
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError(404, 'Event not found'));
  }

  const existingRegistration = await Registration.findOne({
    user: req.user._id,
    event: event._id,
    status: 'registered',
  });

  if (existingRegistration) {
    return next(new AppError(409, 'You are already registered for this event'));
  }

  const currentRegistrations = await Registration.countDocuments({
    event: event._id,
    status: 'registered',
  });

  if (currentRegistrations >= event.capacity) {
    return next(new AppError(400, 'Event capacity reached'));
  }

  const registration = await Registration.create({
    user: req.user._id,
    event: event._id,
    status: 'registered',
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: registration,
  });
});

exports.getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({
    user: req.user._id,
    status: 'registered',
  })
    .populate({
      path: 'event',
      populate: { path: 'category' },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

exports.cancelRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(new AppError(404, 'Registration not found'));
  }

  if (registration.user.toString() !== req.user._id.toString()) {
    return next(new AppError(403, 'You can only cancel your own registration'));
  }

  if (registration.status !== 'registered') {
    return next(new AppError(400, 'This registration is already cancelled'));
  }

  registration.status = 'cancelled';
  await registration.save();

  res.status(200).json({
    success: true,
    message: 'Registration cancelled successfully',
    data: registration,
  });
});
