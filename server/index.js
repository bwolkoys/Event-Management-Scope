const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    required: true
  },
  location: {
    address: String,
    placeId: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  team: {
    type: String,
    required: false
  },
  guests: [{
    type: {
      type: String,
      enum: ['user', 'external'],
      required: true
    },
    id: String,
    name: String,
    email: String
  }],
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date
  },
  rsvpRequired: {
    type: Boolean,
    default: false
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    reminder: {
      type: String,
      enum: ['none', '15min', '1hour', '1day', '1week'],
      default: '1day'
    }
  },
  privacy: {
    type: String,
    enum: ['public', 'team'],
    default: 'team'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  parentEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  },
  instanceDate: {
    type: Date,
    required: false
  },
  isException: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    required: false
  }
});

const Event = mongoose.model('Event', eventSchema);

app.post('/api/events', async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      timezone,
      location,
      team,
      guests,
      recurring,
      rsvpRequired,
      notifications,
      privacy
    } = req.body;

    if (!title || !description || !startDate || !endDate || !timezone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = new Event({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timezone,
      location,
      team,
      guests: guests || [],
      recurring: recurring || { enabled: false },
      rsvpRequired: rsvpRequired || false,
      notifications: notifications || { email: true, reminder: '1day' },
      privacy: privacy || 'team'
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Helper function to track changes between original and updated data
function trackEventChanges(original, updated) {
  const changes = [];
  const fieldsToTrack = [
    'title', 'description', 'startDate', 'endDate', 'timezone',
    'location', 'team', 'guests', 'recurring', 'rsvpRequired', 'notifications', 'privacy'
  ];

  fieldsToTrack.forEach(field => {
    const originalValue = original[field];
    const updatedValue = updated[field];

    // Handle nested objects and arrays
    if (field === 'location') {
      if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
        changes.push({
          field: 'location',
          oldValue: originalValue,
          newValue: updatedValue,
          changeType: 'location_changed'
        });
      }
    } else if (field === 'guests') {
      if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
        changes.push({
          field: 'guests',
          oldValue: originalValue,
          newValue: updatedValue,
          changeType: 'guests_changed'
        });
      }
    } else if (field === 'recurring') {
      if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
        changes.push({
          field: 'recurring',
          oldValue: originalValue,
          newValue: updatedValue,
          changeType: 'recurring_changed'
        });
      }
    } else if (field === 'startDate' || field === 'endDate') {
      // Handle date comparisons
      const originalDate = originalValue ? new Date(originalValue).getTime() : null;
      const updatedDate = updatedValue ? new Date(updatedValue).getTime() : null;
      
      if (originalDate !== updatedDate) {
        changes.push({
          field: field,
          oldValue: originalValue,
          newValue: updatedValue,
          changeType: field === 'startDate' ? 'start_time_changed' : 'end_time_changed'
        });
      }
    } else {
      // Handle simple field comparisons
      if (originalValue !== updatedValue) {
        let changeType = `${field}_changed`;
        if (field === 'title') changeType = 'title_changed';
        else if (field === 'description') changeType = 'description_changed';
        else if (field === 'team') changeType = 'team_changed';
        
        changes.push({
          field: field,
          oldValue: originalValue,
          newValue: updatedValue,
          changeType: changeType
        });
      }
    }
  });

  return changes;
}

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updateType, instanceDate, ...updateData } = req.body;

    // Convert date strings to Date objects
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    if (updateData.recurring && updateData.recurring.endDate) {
      updateData.recurring.endDate = new Date(updateData.recurring.endDate);
    }

    const originalEvent = await Event.findById(id);
    if (!originalEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Track changes for notification purposes
    const changes = trackEventChanges(originalEvent.toObject(), updateData);

    // Handle recurring event updates - only create exception for single instance updates
    if (originalEvent.recurring && originalEvent.recurring.enabled && updateType === 'single' && instanceDate) {
      // Create exception for single instance of recurring event
      const exceptionData = {
        ...updateData,
        parentEventId: id,
        instanceDate: new Date(instanceDate),
        recurring: { enabled: false },
        isException: true
      };

      const exceptionEvent = new Event(exceptionData);
      const savedException = await exceptionEvent.save();
      
      // Include change tracking in response for notifications
      res.json({
        ...savedException.toObject(),
        changes: changes,
        isRecurringException: true
      });
    } else {
      // Update the original event (for non-recurring events or series updates)
      const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Include change tracking in response for notifications
      res.json({
        ...updatedEvent.toObject(),
        changes: changes,
        isRecurringException: false
      });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.isDeleted) {
      return res.status(400).json({ error: 'Event is already deleted' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      },
      { new: true }
    );

    res.json({ message: 'Event deleted successfully', event: updatedEvent });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

app.get('/api/events/deleted', async (req, res) => {
  try {
    const deletedEvents = await Event.find({ 
      isDeleted: true,
      deletedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ deletedAt: -1 });
    res.json(deletedEvents);
  } catch (error) {
    console.error('Error fetching deleted events:', error);
    res.status(500).json({ error: 'Failed to fetch deleted events' });
  }
});

app.post('/api/events/:id/recover', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isDeleted) {
      return res.status(400).json({ error: 'Event is not deleted' });
    }

    const timeSinceDeleted = Date.now() - new Date(event.deletedAt).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeSinceDeleted > twentyFourHours) {
      return res.status(400).json({ error: 'Recovery period expired (24 hours)' });
    }

    const recoveredEvent = await Event.findByIdAndUpdate(
      id,
      { 
        isDeleted: false, 
        deletedAt: null 
      },
      { new: true }
    );

    res.json({ message: 'Event recovered successfully', event: recoveredEvent });
  } catch (error) {
    console.error('Error recovering event:', error);
    res.status(500).json({ error: 'Failed to recover event' });
  }
});

const cleanupExpiredDeletedEvents = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Event.deleteMany({
      isDeleted: true,
      deletedAt: { $lt: twentyFourHoursAgo }
    });
    console.log(`Cleaned up ${result.deletedCount} expired deleted events`);
  } catch (error) {
    console.error('Error cleaning up expired deleted events:', error);
  }
};

setInterval(cleanupExpiredDeletedEvents, 60 * 60 * 1000);

app.get('/api/teams', (req, res) => {
  const teams = [
    { id: 'team1', name: 'West Ham United' },
    { id: 'team2', name: 'Arsenal' },
    { id: 'team3', name: 'Brentford' },
    { id: 'team4', name: 'Chelsea' }
  ];
  res.json(teams);
});

app.get('/api/users', (req, res) => {
  const users = [
    { id: 'user1', name: 'Jarrod Bowen', email: 'jarrod@example.com', teamId: 'team1' },
    { id: 'user2', name: 'Michail Antonio', email: 'michail@example.com', teamId: 'team2' },
    { id: 'user3', name: 'Edson Alvarez', email: 'edson@example.com', teamId: 'team3' },
    { id: 'user4', name: 'Maxwel Cornet', email: 'Maxwel@example.com', teamId: 'team4' }
  ];
  res.json(users);
});

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } else {
      console.log('MongoDB URI not provided, running without database');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});