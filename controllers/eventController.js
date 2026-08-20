const mongoose = require('mongoose');

const Event = require('../models/Event');
const Category = require('../models/Category');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const buildEventQuery = (req) => {
  const { category, city, startDate, endDate, search } = req.query;
  const query = {};

  if (category) {
    query.category = mongoose.Types.ObjectId.isValid(category)
      ? new mongoose.Types.ObjectId(category)
      : category;
  }

  if (city) query.city = { $regex: city, $options: 'i' };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return query;
};

const getSortOption = (sortBy) => {
  switch (sortBy) {
    case 'registrations':
      return { createdAt: -1 };
    case 'date':
      return { date: 1 };
    default:
      return { date: 1 };
  }
};

exports.getEvents = asyncHandler(async (req, res) => {
  const query = buildEventQuery(req);
  const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
  const limit = parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 10;
  const sortBy = req.query.sortBy || 'date';
  const total = await Event.countDocuments(query);

  let events;

  if (sortBy === 'registrations') {
    events = await Event.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'event',
          as: 'registrations',
        },
      },
      { $addFields: { registrationCount: { $size: '$registrations' } } },
      { $sort: { registrationCount: -1, date: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
    ]);
  } else {
    events = await Event.find(query)
      .populate('category')
      .sort(getSortOption(sortBy))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    totalPages,
    data: events,
  });
});

exports.getEventById = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id).populate('category');

  if (!event) {
    return next(new AppError(404, 'Event not found'));
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

exports.createEvent = asyncHandler(async (req, res, next) => {
  const { title, description, category, date, city, location, capacity, price, image } = req.body;

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new AppError(400, 'Category not found'));
  }

  const event = await Event.create({
    title,
    description,
    category,
    date,
    city,
    location,
    capacity,
    price: price || 0,
    image: image || '',
  });

  const populatedEvent = await event.populate('category');

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: populatedEvent,
  });
});

exports.updateEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError(404, 'Event not found'));
  }

  const { title, description, category, date, city, location, capacity, price, image } = req.body;

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new AppError(400, 'Category not found'));
    }
  }

  Object.assign(event, {
    title: title ?? event.title,
    description: description ?? event.description,
    category: category ?? event.category,
    date: date ?? event.date,
    city: city ?? event.city,
    location: location ?? event.location,
    capacity: capacity ?? event.capacity,
    price: price ?? event.price,
    image: image ?? event.image,
  });

  await event.save();

  const updatedEvent = await Event.findById(event._id).populate('category');

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: updatedEvent,
  });
});

exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError(404, 'Event not found'));
  }

  await Registration.deleteMany({ event: event._id });
  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully',
  });
});
