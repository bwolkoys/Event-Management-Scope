import React, { useState, useEffect } from 'react';
import CreateEventModal from './CreateEventModal';
import EventDetailsModal from './EventDetailsModal';
import { eventAPI, teamsAPI, usersAPI } from '../services/api';

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    team: '',
    eventType: '',
    dateRange: '',
    myEventsOnly: false
  });
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedEvents, setDeletedEvents] = useState([]);

  useEffect(() => {
    loadEvents();
    loadTeamsAndUsers();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventAPI.getEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsAndUsers = async () => {
    try {
      const [teamsResponse, usersResponse] = await Promise.all([
        teamsAPI.getTeams(),
        usersAPI.getUsers()
      ]);
      setTeams(teamsResponse.data?.data || []);
      setUsers(usersResponse.data?.data || []);
    } catch (error) {
      console.error('Error loading teams and users:', error);
      setTeams([]);
      setUsers([]);
    }
  };

  const handleOpenModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventCreated = (event) => {
    console.log('Event created:', event);
    setEvents(prev => [...prev, event]);
    setIsModalOpen(false);
  };

  const handleEventUpdated = (updatedEvent) => {
    console.log('Event updated:', updatedEvent);
    setEvents(prev => prev.map(event => 
      event._id === updatedEvent._id ? updatedEvent : event
    ));
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (eventId) => {
    const eventToUpdate = events.find(event => event._id === eventId);
    if (eventToUpdate) {
      setSelectedEvent(eventToUpdate);
      setIsModalOpen(true);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? You can recover it within 24 hours.')) {
      try {
        await eventAPI.deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event._id !== eventId));
        if (showDeleted) {
          loadDeletedEvents();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const loadDeletedEvents = async () => {
    try {
      const response = await eventAPI.getDeletedEvents();
      setDeletedEvents(response.data);
    } catch (error) {
      console.error('Error loading deleted events:', error);
    }
  };

  const handleRecoverEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to recover this event?')) {
      try {
        await eventAPI.recoverEvent(eventId);
        setDeletedEvents(prev => prev.filter(event => event._id !== eventId));
        loadEvents();
      } catch (error) {
        console.error('Error recovering event:', error);
        alert('Failed to recover event. Please try again.');
      }
    }
  };

  const toggleDeletedEvents = () => {
    setShowDeleted(!showDeleted);
    if (!showDeleted) {
      loadDeletedEvents();
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleViewDetails = (event) => {
    setSelectedEventForDetails(event);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEventForDetails(null);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      team: '',
      eventType: '',
      dateRange: '',
      myEventsOnly: false
    });
    setSearchTerm('');
  };

  const filteredEvents = events.filter(event => {
    // Search term filter
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Team filter
    const matchesTeam = !filters.team || event.team === filters.team;
    
    // Event type filter (based on privacy setting)
    const matchesEventType = !filters.eventType || event.privacy === filters.eventType;
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.dateRange) {
      const eventDate = new Date(event.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filters.dateRange) {
        case 'today':
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          matchesDateRange = eventDate >= today && eventDate <= todayEnd;
          break;
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(today.getDate() + 7);
          matchesDateRange = eventDate >= today && eventDate <= weekEnd;
          break;
        case 'month':
          const monthEnd = new Date(today);
          monthEnd.setMonth(today.getMonth() + 1);
          matchesDateRange = eventDate >= today && eventDate <= monthEnd;
          break;
        case 'past':
          matchesDateRange = eventDate < today;
          break;
        default:
          matchesDateRange = true;
      }
    }
    
    // My events filter (this would need user authentication to work properly)
    // For now, we'll assume all events are "mine" since there's no user context
    const matchesMyEvents = !filters.myEventsOnly || true;
    
    return matchesSearch && matchesTeam && matchesEventType && matchesDateRange && matchesMyEvents;
  }).sort((a, b) => {
    // Sort by date and time in ascending order (soonest first)
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateA - dateB;
  });

  return (
    <div className="dashboard" style={{ padding: '40px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            color: '#2c3e50', 
            marginBottom: '15px',
            fontWeight: '600'
          }}>
            Event Management Dashboard
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#6c757d', 
            maxWidth: '600px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Organize and manage your events with ease. Create new events, uopdate events, delete events,
            and stay on top of all your event planning needs.
          </p>
        </header>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={handleOpenModal}
            style={{
              padding: '15px 30px',
              backgroundColor: '#478c66',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#3a7257'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#478c66'}
          >
            Create New Event
          </button>
          
          
          <button
            onClick={toggleDeletedEvents}
            style={{
              padding: '15px 30px',
              backgroundColor: showDeleted ? '#3a7257' : '#478c66',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = showDeleted ? '#3a7257' : '#3a7257'}
            onMouseOut={(e) => e.target.style.backgroundColor = showDeleted ? '#478c66' : '#478c66'}
          >
            {showDeleted ? 'Show Active Events' : 'View Deleted Events'}
          </button>
        </div>

        {/* Events Display Section */}
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            color: '#2c3e50', 
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            {showDeleted ? 'Recently Deleted Events' : 'Your Events'}
          </h2>
          
          {!showDeleted && (
            <div style={{ 
              maxWidth: '1000px', 
              margin: '0 auto 30px auto',
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {/* Search Input */}
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Search events by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    fontSize: '16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>
              
              {/* Filter Controls */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                alignItems: 'end'
              }}>
                {/* Team Filter */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '500', 
                    color: '#495057' 
                  }}>
                    Filter by Team
                  </label>
                  <select
                    value={filters.team}
                    onChange={(e) => handleFilterChange('team', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Teams</option>
                    {teams?.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Event Type Filter */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '500', 
                    color: '#495057' 
                  }}>
                    Event Type
                  </label>
                  <select
                    value={filters.eventType}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="team">Team Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '500', 
                    color: '#495057' 
                  }}>
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">Next 7 Days</option>
                    <option value="month">Next 30 Days</option>
                    <option value="past">Past Events</option>
                  </select>
                </div>
                
                {/* My Events Toggle */}
                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '500', 
                    color: '#495057',
                    cursor: 'pointer',
                    padding: '8px 0'
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.myEventsOnly}
                      onChange={(e) => handleFilterChange('myEventsOnly', e.target.checked)}
                      style={{ 
                        width: '16px', 
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    My Events Only
                  </label>
                </div>
                
                {/* Clear Filters Button */}
                <div>
                  <button
                    onClick={clearFilters}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      backgroundColor: '#478c66',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#3a7257'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#478c66'}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading events...</p>
            </div>
          ) : showDeleted ? (
            deletedEvents.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                  No recently deleted events. Deleted events are automatically removed after 24 hours.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: '1fr',
                width: '60%',
                margin: '0 auto'
              }}>
                {deletedEvents.map(event => (
                  <div key={event._id} style={{
                    backgroundColor: '#fff3cd',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #ffeaa7'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ 
                        backgroundColor: '#f39c12', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginRight: '10px'
                      }}>
                        DELETED
                      </span>
                      <h3 style={{ 
                        margin: '0', 
                        color: '#2c3e50',
                        fontSize: '1.3rem'
                      }}>
                        {event.title}
                      </h3>
                    </div>
                    <p style={{ 
                      margin: '0 0 15px 0', 
                      color: '#6c757d',
                      lineHeight: '1.4'
                    }}>
                      {event.description}
                    </p>
                    <p style={{ 
                      margin: '0 0 10px 0', 
                      color: '#495057',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      <strong>Original Time:</strong> {formatDateTime(event.startDate)}
                    </p>
                    <p style={{ 
                      margin: '0 0 20px 0', 
                      color: '#dc3545',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      <strong>Deleted:</strong> {formatDateTime(event.deletedAt)}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      gap: '10px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => handleRecoverEvent(event._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                      >
                        Recover Event
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredEvents.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                {events.length === 0 
                  ? "No events created yet. Click \"Create New Event\" to get started!"
                  : "No events match your search. Try a different search term."
                }
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: '1fr',
              width: '60%',
              margin: '0 auto'
            }}>
              {filteredEvents.map(event => (
                <div key={event._id} style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    color: '#2c3e50',
                    fontSize: '1.3rem'
                  }}>
                    {event.title}
                  </h3>
                  <p style={{ 
                    margin: '0 0 15px 0', 
                    color: '#6c757d',
                    lineHeight: '1.4'
                  }}>
                    {event.description}
                  </p>
                  <p style={{ 
                    margin: '0 0 20px 0', 
                    color: '#495057',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    <strong>Time:</strong> {formatDateTime(event.startDate)}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => handleViewDetails(event)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#478c66',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#3a7257'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#478c66'}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleUpdateEvent(event._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#5DADE2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#3b96d1'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#5DADE2'}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateEventModal
          onClose={handleCloseModal}
          onEventCreated={handleEventCreated}
          onEventUpdated={handleEventUpdated}
          selectedEvent={selectedEvent}
          instanceDate={selectedEvent?.startDate}
        />
      )}

      {isDetailsModalOpen && (
        <EventDetailsModal
          event={selectedEventForDetails}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  );
}

export default Dashboard;