import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI, teamsAPI } from '../services/api'; // Changed this line
import EventDetailsModal from './EventDetailsModal';
import CreateEventModal from './CreateEventModal';

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadEventsAndTeams();
  }, []);

  const loadEventsAndTeams = async () => {
    try {
      setLoading(true);
      const [eventsResponse, teamsResponse] = await Promise.all([
        eventAPI.getEvents(), // Changed from fetchEvents()
        teamsAPI.getTeams()   // Changed from fetchTeams()
      ]);
      setEvents(eventsResponse.data);
      setTeams(teamsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load events and teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventAPI.deleteEvent(eventId); // Changed from deleteEvent()
        await loadEventsAndTeams();
      } catch (error) {
        console.error('Error deleting event:', error);
        setError('Failed to delete event');
      }
    }
  };

  const handleRecoverEvent = async (eventId) => {
    try {
      await eventAPI.recoverEvent(eventId); // Changed from recoverEvent()
      await loadEventsAndTeams();
    } catch (error) {
      console.error('Error recovering event:', error);
      setError('Failed to recover event');
    }
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setIsCreateEventOpen(true);
  };

  const handleEventCreated = () => {
    loadEventsAndTeams();
    setIsCreateEventOpen(false);
    setEditingEvent(null);
  };

  const toggleDeletedEvents = () => {
    setShowDeleted(!showDeleted);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTeam('');
    setEventTypeFilter('');
    setDateFilter('');
    setMyEventsOnly(false);
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    // Basic search filter
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Team filter
    const matchesTeam = selectedTeam === '' || event.teamId === selectedTeam;

    // Event type filter
    const matchesEventType = eventTypeFilter === '' || 
                            (eventTypeFilter === 'public' && !event.teamId) ||
                            (eventTypeFilter === 'team' && event.teamId);

    // Date filter
    const eventDate = new Date(event.dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = eventDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      matchesDate = eventDate >= today && eventDate <= weekFromNow;
    } else if (dateFilter === 'month') {
      const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      matchesDate = eventDate >= today && eventDate <= monthFromNow;
    } else if (dateFilter === 'past') {
      matchesDate = eventDate < today;
    }

    // My events filter
    const matchesMyEvents = !myEventsOnly || event.createdBy === user?.id;

    // Deleted events filter
    const matchesDeletedFilter = showDeleted ? event.isDeleted : !event.isDeleted;

    return matchesSearch && matchesTeam && matchesEventType && matchesDate && matchesMyEvents && matchesDeletedFilter;
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading events...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            left: '0',
            top: '10px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          ← Back to Dashboard
        </button>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#2c3e50', 
          marginBottom: '10px',
          fontWeight: '700'
        }}>
          Your Events
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#7f8c8d', 
          marginBottom: '30px' 
        }}>
          Manage and view all your events
        </p>
      </div>

      {/* Control Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setIsCreateEventOpen(true)}
          style={{
            padding: '15px 30px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
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

        {error && (
          <div style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '30px' 
        }}>
          <input
            type="text"
            placeholder="Search events by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '25px',
              width: '100%',
              maxWidth: '500px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Filters Section */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '25px', 
          borderRadius: '10px', 
          marginBottom: '30px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            marginTop: '0', 
            marginBottom: '20px', 
            color: '#2c3e50',
            fontSize: '1.2rem'
          }}>
            Filter Events
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            alignItems: 'end'
          }}>
            {/* Team Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#555'
              }}>
                Filter by Team:
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#555'
              }}>
                Event Type:
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Types</option>
                <option value="public">Public Events</option>
                <option value="team">Team Events</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#555'
              }}>
                Date Range:
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="past">Past Events</option>
              </select>
            </div>

            {/* My Events Toggle */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                fontWeight: '500',
                color: '#555'
              }}>
                <input
                  type="checkbox"
                  checked={myEventsOnly}
                  onChange={(e) => setMyEventsOnly(e.target.checked)}
                  style={{ 
                    marginRight: '10px',
                    transform: 'scale(1.2)'
                  }}
                />
                Show only my events
              </label>
            </div>

            {/* Clear Filters Button */}
            <div>
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            border: '2px dashed #dee2e6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
            <h3 style={{ 
              color: '#6c757d', 
              marginBottom: '10px',
              fontSize: '1.3rem'
            }}>
              {showDeleted ? 'No deleted events found' : 'No events found'}
            </h3>
            <p style={{ color: '#6c757d', fontSize: '1rem' }}>
              {showDeleted 
                ? 'You don\'t have any deleted events matching your criteria.'
                : searchTerm || selectedTeam || eventTypeFilter || dateFilter || myEventsOnly
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first event to get started!'
              }
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '25px',
            padding: '20px 0'
          }}>
            {filteredEvents.map(event => {
              const eventDate = new Date(event.dateTime);
              const team = teams.find(t => t._id === event.teamId);
              
              return (
                <div
                  key={event._id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '25px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e1e8ed',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {event.isDeleted && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      DELETED
                    </div>
                  )}
                  
                  <h3 style={{ 
                    marginTop: '0', 
                    marginBottom: '10px', 
                    color: '#2c3e50',
                    fontSize: '1.3rem',
                    lineHeight: '1.4'
                  }}>
                    {event.title}
                  </h3>
                  
                  <p style={{ 
                    color: '#7f8c8d', 
                    marginBottom: '15px',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    height: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {event.description}
                  </p>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      color: '#555',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ marginRight: '8px' }}>📅</span>
                      <strong>{eventDate.toLocaleDateString()}</strong>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: team ? '8px' : '0',
                      color: '#555',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ marginRight: '8px' }}>🕒</span>
                      <strong>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                    {team && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: '#555',
                        fontSize: '0.9rem'
                      }}>
                        <span style={{ marginRight: '8px' }}>👥</span>
                        <strong>{team.name}</strong>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => openEventDetails(event)}
                      style={{
                        flex: '1',
                        minWidth: '80px',
                        padding: '8px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                    >
                      View Details
                    </button>
                    
                    {!event.isDeleted ? (
                      <>
                        <button
                          onClick={() => openEditEvent(event)}
                          style={{
                            flex: '1',
                            minWidth: '60px',
                            padding: '8px 12px',
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'background-color 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#e67e22'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#f39c12'}
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          style={{
                            flex: '1',
                            minWidth: '60px',
                            padding: '8px 12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'background-color 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRecoverEvent(event._id)}
                        style={{
                          flex: '2',
                          padding: '8px 12px',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
                      >
                        Recover Event
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {isEventDetailsOpen && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          teams={teams}
          onClose={() => {
            setIsEventDetailsOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {isCreateEventOpen && (
        <CreateEventModal
          teams={teams}
          onClose={() => {
            setIsCreateEventOpen(false);
            setEditingEvent(null);
          }}
          onEventCreated={handleEventCreated}
          editingEvent={editingEvent}
        />
      )}
    </div>
  );
};

export default EventsPage;
