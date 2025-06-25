import React from 'react';

function EventDetailsModal({ event, onClose }) {
  if (!event) return null;

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  const getRecurringText = (recurring) => {
    if (!recurring || !recurring.enabled) return 'No';
    const { frequency, interval } = recurring;
    const intervalText = interval > 1 ? `${interval} ` : '';
    const frequencyText = interval > 1 ? `${frequency}s` : frequency;
    return `Yes - Every ${intervalText}${frequencyText.toLowerCase()}`;
  };

  const getReminderText = (reminder) => {
    const reminderMap = {
      'none': 'No reminder',
      '15min': '15 minutes before',
      '1hour': '1 hour before',
      '1day': '1 day before',
      '1week': '1 week before'
    };
    return reminderMap[reminder] || 'No reminder';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '15px'
        }}>
          <h2 style={{
            color: '#2c3e50',
            fontSize: '1.8rem',
            fontWeight: '600',
            margin: 0
          }}>
            Event Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            color: '#2c3e50',
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '15px'
          }}>
            {event.title}
          </h3>
          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            lineHeight: '1.6',
            marginBottom: '20px'
          }}>
            {event.description}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{
              color: '#2c3e50',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '15px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '8px'
            }}>
              Date & Time
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>Start:</strong> {formatDateTime(event.startDate)}
              </p>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>End:</strong> {formatDateTime(event.endDate)}
              </p>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>Timezone:</strong> {event.timezone || 'Not specified'}
              </p>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>Recurring:</strong> {getRecurringText(event.recurring)}
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{
              color: '#2c3e50',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '15px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '8px'
            }}>
              Location
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              {event.location && event.location.address ? (
                <p style={{ margin: '5px 0', color: '#495057' }}>
                  {event.location.address}
                </p>
              ) : (
                <p style={{ margin: '5px 0', color: '#6c757d', fontStyle: 'italic' }}>
                  No location specified
                </p>
              )}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{
              color: '#2c3e50',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '15px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '8px'
            }}>
              Event Settings
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>Privacy:</strong> {event.privacy === 'public' ? 'Public' : 'Team Only'}
              </p>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>RSVP Required:</strong> {event.rsvpRequired ? 'Yes' : 'No'}
              </p>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>Email Notifications:</strong> {event.notifications?.email ? 'Enabled' : 'Disabled'}
              </p>
              <p style={{ margin: '5px 0', color: '#495057' }}>
                <strong>Reminder:</strong> {getReminderText(event.notifications?.reminder)}
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{
              color: '#2c3e50',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '15px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '8px'
            }}>
              Attendees & RSVP Status
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              {event.guests && event.guests.length > 0 ? (
                <div>
                  <p style={{ margin: '5px 0 10px 0', color: '#495057', fontWeight: '600' }}>
                    Total Invited: {event.guests.length}
                  </p>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {event.guests.map((guest, index) => (
                      <div key={index} style={{
                        padding: '8px 12px',
                        margin: '5px 0',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                            {guest.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                            {guest.email}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                            {guest.type === 'user' ? 'Team Member' : 'External Guest'}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          backgroundColor: '#ffc107',
                          color: '#212529'
                        }}>
                          Pending
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '6px', border: '1px solid #bbdefb' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#1565c0' }}>
                      <strong>Note:</strong> RSVP tracking is currently in development. All attendees show as "Pending" status.
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ margin: '5px 0', color: '#6c757d', fontStyle: 'italic' }}>
                  No attendees added yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef',
          textAlign: 'right'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsModal;