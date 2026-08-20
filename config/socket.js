const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Registration = require('../models/Registration');

const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join-event-room', async ({ eventId, token }, callback) => {
      try {
        if (!eventId || !token) {
          return callback?.({ success: false, message: 'Event ID and token are required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventpulse_dev_secret');
        const user = await User.findById(decoded.userId);

        if (!user) {
          return callback?.({ success: false, message: 'User not found' });
        }

        const registration = await Registration.findOne({
          user: user._id,
          event: eventId,
          status: 'registered',
        });

        if (!registration && user.role !== 'admin') {
          return callback?.({ success: false, message: 'You must be registered for this event to join the room' });
        }

        socket.join(`event:${eventId}`);
        socket.data.user = user;
        socket.data.eventId = eventId;

        callback?.({ success: true, message: 'Joined event room' });
      } catch (error) {
        callback?.({ success: false, message: 'Invalid token or room access denied' });
      }
    });

    socket.on('send-announcement', async ({ eventId, content, token }, callback) => {
      try {
        if (!eventId || !content) {
          return callback?.({ success: false, message: 'Event ID and content are required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventpulse_dev_secret');
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'admin') {
          return callback?.({ success: false, message: 'Only admins can send announcements' });
        }

        const message = await Message.create({
          event: eventId,
          sender: user._id,
          content,
        });

        const populatedMessage = await message.populate({ path: 'sender', select: 'name email role' });

        io.to(`event:${eventId}`).emit('new-announcement', {
          _id: populatedMessage._id,
          event: populatedMessage.event,
          sender: populatedMessage.sender,
          content: populatedMessage.content,
          createdAt: populatedMessage.createdAt,
        });

        callback?.({ success: true, message: 'Announcement sent', data: populatedMessage });
      } catch (error) {
        callback?.({ success: false, message: 'Failed to send announcement' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = configureSocket;
