import React, { useState, useEffect } from 'react';
import { eventAPI, teamsAPI, usersAPI } from '../services/api';
import LocationAutocomplete from './LocationAutocomplete';
import GuestSelector from './GuestSelector';
import moment from 'moment-timezone';

const CreateEventModal = ({ onClose, onEventCreated, onEventUpdated, selectedEvent }) => {
  const isEditing = !!selectedEvent;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: moment.tz.guess(),
    location: {
      address: '',
      placeId: '',
      coordinates: { lat: null, lng: null }
    },
    team: '',
    guests: [],
    recurring: {
      enabled: false,
      frequency: 'weekly',
      interval: 1,
      endDate: ''
    },
    rsvpRequired: false,
    notifications: {
      email: true,
      reminder: '1day'
    },
    privacy: 'team'
  });

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timezones = moment.tz.names();

  useEffect(() => {
    loadTeamsAndUsers();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const startDateTime = moment(selectedEvent.startDate);
      const endDateTime = moment(selectedEvent.endDate);
      
      setFormData({
        title: selectedEvent.title || '',
        description: selectedEvent.description || '',
        startDate: startDateTime.format('YYYY-MM-DD'),
        startTime: startDateTime.format('HH:mm'),
        endDate: endDateTime.format('YYYY-MM-DD'),
        endTime: endDateTime.format('HH:mm'),
        timezone: selectedEvent.timezone || moment.tz.guess(),
        location: selectedEvent.location || {
          address: '',
          placeId: '',
          coordinates: { lat: null, lng: null }
        },
        team: selectedEvent.team || '',
        guests: selectedEvent.guests || [],
        recurring: selectedEvent.recurring || {
          enabled: false,
          frequency: 'weekly',
          interval: 1,
          endDate: ''
        },
        rsvpRequired: selectedEvent.rsvpRequired || false,
        notifications: selectedEvent.notifications || {
          email: true,
          reminder: '1day'
        },
        privacy: selectedEvent.privacy || 'team'
      });
    }
  }, [selectedEvent]);

  const loadTeamsAndUsers = async () => {
    try {
      console.log('Loading teams and users...');
      const [teamsResponse, usersResponse] = await Promise.all([
        teamsAPI.getTeams(),
        usersAPI.getUsers()
      ]);
      console.log('Teams response:', teamsResponse);
      console.log('Users response:', usersResponse);
      setTeams(teamsResponse.data);
      setUsers(usersResponse.data);
      console.log('Teams set:', teamsResponse.data);
      console.log('Users set:', usersResponse.data);
    } catch (error) {
      console.error('Error loading teams and users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTeamChange = (e) => {
    const selectedTeamId = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      team: selectedTeamId
    }));
    
    if (selectedTeamId && users.length > 0) {
      const teamMembers = users.filter(user => user.teamId === selectedTeamId);
      const teamMemberGuests = teamMembers.map(user => ({
        type: 'user',
        id: user.id,
        name: user.name,
        email: user.email
      }));
      
      const externalGuests = formData.guests.filter(guest => guest.type === 'external');
      setFormData(prev => ({
        ...prev,
        guests: [...externalGuests, ...teamMemberGuests]
      }));
    } else if (!selectedTeamId) {
      const externalGuests = formData.guests.filter(guest => guest.type === 'external');
      setFormData(prev => ({
        ...prev,
        guests: externalGuests
      }));
    }
    
    if (errors.team) {
      setErrors(prev => ({
        ...prev,
        team: ''
      }));
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
    
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: ''
      }));
    }
  };

  const handleGuestsChange = (guests) => {
    setFormData(prev => ({
      ...prev,
      guests
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }


    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = moment.tz(`${formData.startDate} ${formData.startTime}`, formData.timezone);
      const endDateTime = moment.tz(`${formData.endDate} ${formData.endTime}`, formData.timezone);
      
      if (endDateTime.isSameOrBefore(startDateTime)) {
        newErrors.endDate = 'End date/time must be after start date/time';
      }
    }

    if (formData.recurring.enabled && formData.recurring.endDate) {
      const recurringEndDate = moment(formData.recurring.endDate);
      const eventStartDate = moment(formData.startDate);
      
      if (recurringEndDate.isSameOrBefore(eventStartDate)) {
        newErrors.recurringEndDate = 'Recurring end date must be after event start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = moment.tz(`${formData.startDate} ${formData.startTime}`, formData.timezone);
      const endDateTime = moment.tz(`${formData.endDate} ${formData.endTime}`, formData.timezone);

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        timezone: formData.timezone,
        location: formData.location.address ? formData.location : null,
        team: formData.team,
        guests: formData.guests,
        recurring: {
          ...formData.recurring,
          endDate: formData.recurring.endDate ? new Date(formData.recurring.endDate).toISOString() : null
        },
        rsvpRequired: formData.rsvpRequired,
        notifications: formData.notifications,
        privacy: formData.privacy
      };

      let response;
      if (isEditing) {
        response = await eventAPI.updateEvent(selectedEvent._id, eventData);
        onEventUpdated(response.data);
      } else {
        response = await eventAPI.createEvent(eventData);
        onEventCreated(response.data);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} event:`, error);
      setErrors({ 
        submit: `Failed to ${isEditing ? 'update' : 'create'} event. Please try again.` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEditing ? 'Update Event' : 'Create New Event'}</h2>
          <button 
            className="close-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Event Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter event description"
                rows="3"
              />
              {errors.description && <div className="error-message">{errors.description}</div>}
            </div>

            <div className="form-group">
              <label>Date & Time *</label>
              <div className="datetime-row">
                <div>
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  {errors.startDate && <div className="error-message">{errors.startDate}</div>}
                </div>
                <div>
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                  {errors.startTime && <div className="error-message">{errors.startTime}</div>}
                </div>
              </div>
              
              <div className="datetime-row" style={{ marginTop: '10px' }}>
                <div>
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                  {errors.endDate && <div className="error-message">{errors.endDate}</div>}
                </div>
                <div>
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                  {errors.endTime && <div className="error-message">{errors.endTime}</div>}
                </div>
              </div>

              <div className="timezone-select">
                <label htmlFor="timezone">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>
                      {tz} ({moment.tz(tz).format('Z')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <LocationAutocomplete
                onLocationSelect={handleLocationSelect}
                placeholder="Search for a location"
                initialValue={selectedEvent?.location?.address || ''}
              />
              {formData.location.address && (
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                  Selected: {formData.location.address}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="team">Team/Group</label>
              <select
                id="team"
                name="team"
                value={formData.team}
                onChange={handleTeamChange}
              >
                <option value="">Select a team</option>
                {teams && teams.length > 0 ? teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                )) : <option disabled>Loading teams...</option>}
              </select>
              {errors.team && <div className="error-message">{errors.team}</div>}
            </div>

            <div className="form-group">
              <label>Guests</label>
              {console.log('Rendering GuestSelector with users:', users)}
              <GuestSelector
                users={users || []}
                selectedGuests={formData.guests}
                onGuestsChange={handleGuestsChange}
                selectedTeamId={formData.team}
              />
            </div>

            <div className="form-group">
              <div className="checkbox-section">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="recurring-enabled"
                    checked={formData.recurring.enabled}
                    onChange={(e) => handleNestedChange('recurring', 'enabled', e.target.checked)}
                  />
                  <label htmlFor="recurring-enabled">
                    Recurring Event
                  </label>
                </div>
              
                {formData.recurring.enabled && (
                  <div className="checkbox-nested">
                  <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="recurringFrequency">Frequency</label>
                    <select
                      id="recurringFrequency"
                      value={formData.recurring.frequency}
                      onChange={(e) => handleNestedChange('recurring', 'frequency', e.target.value)}
                      style={{ marginLeft: '10px' }}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="recurringInterval">Every</label>
                    <input
                      type="number"
                      id="recurringInterval"
                      min="1"
                      max="52"
                      value={formData.recurring.interval}
                      onChange={(e) => handleNestedChange('recurring', 'interval', parseInt(e.target.value) || 1)}
                      style={{ marginLeft: '10px', width: '60px' }}
                    />
                    <span style={{ marginLeft: '5px' }}>
                      {formData.recurring.frequency === 'weekly' ? 'week(s)' : 
                       formData.recurring.frequency === 'monthly' ? 'month(s)' : 'year(s)'}
                    </span>
                  </div>
                  
                  <div>
                    <label htmlFor="recurringEndDate">End Date (optional)</label>
                    <input
                      type="date"
                      id="recurringEndDate"
                      value={formData.recurring.endDate}
                      onChange={(e) => handleNestedChange('recurring', 'endDate', e.target.value)}
                      style={{ marginLeft: '10px' }}
                    />
                    {errors.recurringEndDate && <div className="error-message">{errors.recurringEndDate}</div>}
                  </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="rsvp-required"
                  checked={formData.rsvpRequired}
                  onChange={(e) => handleChange({ target: { name: 'rsvpRequired', value: e.target.checked } })}
                />
                <label htmlFor="rsvp-required">
                  RSVP Required
                </label>
              </div>
            </div>

            <div className="form-group">
              <div className="checkbox-section">
                <span className="checkbox-section-title">Notification Preferences</span>
                
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={formData.notifications.email}
                    onChange={(e) => handleNestedChange('notifications', 'email', e.target.checked)}
                  />
                  <label htmlFor="email-notifications">
                    Email Notifications
                  </label>
                </div>
              
                <div style={{ marginTop: '16px' }}>
                  <label htmlFor="reminderTime">Reminder</label>
                  <select
                    id="reminderTime"
                    value={formData.notifications.reminder}
                    onChange={(e) => handleNestedChange('notifications', 'reminder', e.target.value)}
                    style={{ marginTop: '8px' }}
                  >
                    <option value="none">No Reminder</option>
                    <option value="15min">15 minutes before</option>
                    <option value="1hour">1 hour before</option>
                    <option value="1day">1 day before</option>
                    <option value="1week">1 week before</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="privacy">Privacy Settings</label>
              <select
                id="privacy"
                name="privacy"
                value={formData.privacy}
                onChange={handleChange}
                style={{ marginLeft: '10px' }}
              >
                <option value="team">Team Only</option>
                <option value="public">Public</option>
              </select>
            </div>

            {errors.submit && (
              <div className="error-message" style={{ marginBottom: '20px' }}>
                {errors.submit}
              </div>
            )}

            <div className="form-buttons">
              <button 
                type="button" 
                className="btn btn-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;