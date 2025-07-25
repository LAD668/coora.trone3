import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Plus, Calendar as CalendarIcon, MapPin, Clock, ChevronLeft, ChevronRight, Check, X, Users, UserCheck, UserX, Clock as ClockIcon } from 'lucide-react-native';
import { Event } from '@/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'training' as 'training' | 'match',
    date: '',
    trainingStartTime: '', // For training sessions
    trainingEndTime: '', // For training sessions
    meetingTime: '', // For matches
    matchStartTime: '', // For matches
    matchEndTime: '', // For matches
    location: '',
    notes: '',
    isRepeating: false,
    repeatFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    repeatInterval: 1,
    repeatEndType: 'date' as 'date' | 'occurrences',
    repeatEndDate: '',
    repeatOccurrences: 10,
    selectedDays: [1, 3, 5] as number[], // Default: Mon, Wed, Fri
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const canCreateEvent = user?.role === 'trainer' || user?.role === 'admin';
  const isPlayer = user?.role === 'player';

  const handleCreateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate required times based on event type
    if (newEvent.type === 'training' && !newEvent.trainingStartTime) {
      Alert.alert('Error', 'Please provide a start time for training');
      return;
    }
    
    if (newEvent.type === 'match') {
      if (!newEvent.meetingTime || !newEvent.matchStartTime) {
        Alert.alert('Error', 'Please provide meeting time and start time for matches');
        return;
      }
      
      // Validate that meeting time is before start time
      if (newEvent.meetingTime >= newEvent.matchStartTime) {
        Alert.alert('Error', 'Meeting time must be before start time');
        return;
      }
    }

    // Additional validation for repeating events
    if (newEvent.isRepeating) {
      if (newEvent.repeatEndType === 'date' && !newEvent.repeatEndDate) {
        Alert.alert('Error', 'Please select an end date for repeating events');
        return;
      }
      if (newEvent.repeatEndType === 'occurrences' && newEvent.repeatOccurrences < 1) {
        Alert.alert('Error', 'Number of occurrences must be at least 1');
        return;
      }
      if (newEvent.repeatFrequency === 'weekly' && newEvent.selectedDays.length === 0) {
        Alert.alert('Error', 'Please select at least one day for weekly repeating events');
        return;
      }
    }

    // Validate end times if provided
    if (newEvent.type === 'training' && newEvent.trainingEndTime && newEvent.trainingStartTime >= newEvent.trainingEndTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }
    
    if (newEvent.type === 'match' && newEvent.matchEndTime && newEvent.matchStartTime >= newEvent.matchEndTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (newEvent.isRepeating && newEvent.type === 'training') {
      // Create repeating events
      const createdEvents = createRepeatingEvents();
      setEvents([...events, ...createdEvents].sort((a, b) => a.date.getTime() - b.date.getTime()));
    } else {
      // Create single event
      let eventDate: Date;
      let meetingTime: Date | undefined;
      let startTime: Date | undefined;
      let endDate: Date | undefined;
      
      if (newEvent.type === 'training') {
        eventDate = new Date(`${newEvent.date}T${newEvent.trainingStartTime}`);
        endDate = newEvent.trainingEndTime ? new Date(`${newEvent.date}T${newEvent.trainingEndTime}`) : undefined;
      } else {
        // For matches, the main date is the meeting time
        eventDate = new Date(`${newEvent.date}T${newEvent.meetingTime}`);
        meetingTime = new Date(`${newEvent.date}T${newEvent.meetingTime}`);
        startTime = new Date(`${newEvent.date}T${newEvent.matchStartTime}`);
        endDate = newEvent.matchEndTime ? new Date(`${newEvent.date}T${newEvent.matchEndTime}`) : undefined;
      }
      
      const event: Event = {
        id: Date.now().toString(),
        title: newEvent.title,
        type: newEvent.type,
        date: eventDate,
        meetingTime,
        startTime,
        endDate,
        location: newEvent.location,
        notes: newEvent.notes || undefined,
        teamId: user!.teamId,
        createdBy: user!.id,
      };

      setEvents([...events, event].sort((a, b) => a.date.getTime() - b.date.getTime()));
    }

    setNewEvent({ 
      title: '', 
      type: 'training', 
      date: '', 
      trainingStartTime: '', 
      trainingEndTime: '', 
      meetingTime: '',
      matchStartTime: '',
      matchEndTime: '',
      location: '', 
      notes: '',
      isRepeating: false,
      repeatFrequency: 'weekly',
      repeatInterval: 1,
      repeatEndType: 'date',
      repeatEndDate: '',
      repeatOccurrences: 10,
      selectedDays: [1, 3, 5],
    });
    setModalVisible(false);
  };

  const createRepeatingEvents = () => {
    const createdEvents: Event[] = [];
    const baseDate = new Date(`${newEvent.date}T${newEvent.trainingStartTime}`);
    const endDate = newEvent.trainingEndTime ? new Date(`${newEvent.date}T${newEvent.trainingEndTime}`) : undefined;
    const parentId = Date.now().toString();
    
    const repeatPattern = {
      frequency: newEvent.repeatFrequency,
      interval: newEvent.repeatInterval,
      endDate: newEvent.repeatEndType === 'date' ? new Date(newEvent.repeatEndDate) : undefined,
      occurrences: newEvent.repeatEndType === 'occurrences' ? newEvent.repeatOccurrences : undefined,
      daysOfWeek: newEvent.repeatFrequency === 'weekly' ? newEvent.selectedDays : undefined,
    };

    let currentDate = new Date(baseDate);
    let occurrenceCount = 0;
    const maxOccurrences = repeatPattern.occurrences || 100; // Safety limit
    const endLimit = repeatPattern.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year limit

    while (occurrenceCount < maxOccurrences && currentDate <= endLimit) {
      if (newEvent.repeatFrequency === 'weekly') {
        // For weekly, check if current day is in selected days
        const dayOfWeek = currentDate.getDay();
        if (newEvent.selectedDays.includes(dayOfWeek)) {
          const eventEndDate = endDate ? new Date(currentDate.getTime() + (endDate.getTime() - baseDate.getTime())) : undefined;
          
          createdEvents.push({
            id: `${parentId}-${occurrenceCount}`,
            title: newEvent.title,
            type: newEvent.type as 'training' | 'match',
            date: new Date(currentDate),
            endDate: eventEndDate,
            location: newEvent.location,
            notes: newEvent.notes || undefined,
            teamId: user!.teamId,
            createdBy: user!.id,
            isRepeating: true,
            repeatPattern,
            parentEventId: parentId,
          });
          occurrenceCount++;
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        // For daily and monthly
        const eventEndDate = endDate ? new Date(currentDate.getTime() + (endDate.getTime() - baseDate.getTime())) : undefined;
        
        createdEvents.push({
          id: `${parentId}-${occurrenceCount}`,
          title: newEvent.title,
          type: newEvent.type as 'training' | 'match',
          date: new Date(currentDate),
          endDate: eventEndDate,
          location: newEvent.location,
          notes: newEvent.notes || undefined,
          teamId: user!.teamId,
          createdBy: user!.id,
          requiresResponse: newEvent.type === 'training', // Training sessions require responses by default
          responses: newEvent.type === 'training' ? {} : undefined,
          isRepeating: true,
          repeatPattern,
          parentEventId: parentId,
          requiresResponse: true, // Repeating training sessions require responses
          responses: {},
        });
        occurrenceCount++;

        // Move to next occurrence
        if (newEvent.repeatFrequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + newEvent.repeatInterval);
        } else if (newEvent.repeatFrequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + newEvent.repeatInterval);
        }
      }
    }

    return createdEvents;
  };

  const handleTrainingResponse = (eventId: string, response: 'accepted' | 'declined') => {
    if (!user) return;
    
    setEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === eventId && event.type === 'training' && event.requiresResponse) {
          return {
            ...event,
            responses: {
              ...event.responses,
              [user.id]: response
            }
          };
        }
        return event;
      })
    );
    
    Alert.alert(
      'Response Recorded',
      `You have ${response} the training session.`,
      [{ text: 'OK' }]
    );
  };

  const getResponseStats = (event: Event) => {
    if (!event.responses) return { accepted: 0, declined: 0, pending: 0, total: 0 };
    
    const responses = Object.values(event.responses);
    return {
      accepted: responses.filter(r => r === 'accepted').length,
      declined: responses.filter(r => r === 'declined').length,
      pending: responses.filter(r => r === 'pending').length,
      total: responses.length
    };
  };

  const getUserResponse = (event: Event) => {
    if (!user || !event.responses) return 'pending';
    return event.responses[user.id] || 'pending';
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case 'accepted': return '#34C759';
      case 'declined': return '#FF3B30';
      default: return '#FF9500';
    }
  };

  const getResponseIcon = (response: string) => {
    switch (response) {
      case 'accepted': return UserCheck;
      case 'declined': return UserX;
      default: return ClockIcon;
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const toggleDaySelection = (dayIndex: number) => {
    const updatedDays = newEvent.selectedDays.includes(dayIndex)
      ? newEvent.selectedDays.filter(day => day !== dayIndex)
      : [...newEvent.selectedDays, dayIndex].sort();
    
    setNewEvent({ ...newEvent, selectedDays: updatedDays });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeRange = (startDate: Date, endDate?: Date) => {
    const startTime = formatTime(startDate);
    if (endDate) {
      const endTime = formatTime(endDate);
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  };

  const formatMatchTimes = (event: Event) => {
    if (event.type !== 'match') return '';
    
    const parts = [];
    if (event.meetingTime) {
      parts.push(`Meeting: ${formatTime(event.meetingTime)}`);
    }
    if (event.startTime) {
      parts.push(`Start: ${formatTime(event.startTime)}`);
    }
    if (event.endDate) {
      parts.push(`End: ${formatTime(event.endDate)}`);
    }
    
    return parts.join(' • ');
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventsForSelectedDate = () => {
    return events.filter(event => isSameDay(event.date, selectedDate));
  };

  const hasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.date, date));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <View style={styles.container}>
      <Header title="Calendar" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={20} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={20} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Days of Week Header */}
        <View style={styles.daysHeader}>
          {DAYS.map(day => (
            <Text key={day} style={styles.dayHeaderText}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day && isSameDay(day, selectedDate) && styles.selectedDay,
                day && isToday(day) && styles.today,
              ]}
              onPress={() => day && setSelectedDate(day)}
              disabled={!day}
            >
              {day && (
                <>
                  <Text style={[
                    styles.dayText,
                    isSameDay(day, selectedDate) && styles.selectedDayText,
                    isToday(day) && !isSameDay(day, selectedDate) && styles.todayText,
                  ]}>
                    {day.getDate()}
                  </Text>
                  {hasEvents(day) && (
                    <View style={[
                      styles.eventDot,
                      isSameDay(day, selectedDate) && styles.selectedEventDot
                    ]} />
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Date Events */}
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            {formatDate(selectedDate)}
          </Text>

          <View style={styles.eventsContainer}>
            {getEventsForSelectedDate().length === 0 ? (
              <View style={styles.emptyState}>
                <CalendarIcon size={48} color="#E5E5E7" strokeWidth={1} />
                <Text style={styles.emptyStateText}>No events scheduled</Text>
              </View>
            ) : (
              getEventsForSelectedDate().map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTypeContainer}>
                      <View style={[
                        styles.eventTypeDot,
                        { backgroundColor: event.type === 'match' ? '#FF3B30' : '#007AFF' }
                      ]} />
                      <Text style={styles.eventType}>
                        {event.type === 'match' ? 'Match' : 'Training'}
                      </Text>
                      {event.type === 'training' && event.requiresResponse && (
                        <View style={[
                          styles.responseIndicator,
                          { backgroundColor: getResponseColor(getUserResponse(event)) }
                        ]}>
                          <Text style={styles.responseIndicatorText}>
                            {getUserResponse(event).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.eventTime}>
                      {formatTime(event.date)}
                    </Text>
                  </View>
                  
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  
                  {event.type === 'match' ? (
                    <Text style={styles.eventTimeDetails}>
                      {formatMatchTimes(event)}
                    </Text>
                  ) : (
                    <Text style={styles.eventTimeDetails}>
                      {formatTimeRange(event.date, event.endDate)}
                    </Text>
                  )}
                  
                  <View style={styles.eventDetails}>
                    {event.isRepeating && (
                      <View style={styles.eventDetailRow}>
                        <View style={styles.repeatIndicator}>
                          <Text style={styles.repeatText}>↻</Text>
                        </View>
                        <Text style={styles.eventDetailText}>
                          Repeats {event.repeatPattern?.frequency}
                        </Text>
                      </View>
                    )}
                    <View style={styles.eventDetailRow}>
                      <MapPin size={14} color="#8E8E93" strokeWidth={1.5} />
                      <Text style={styles.eventDetailText}>{event.location}</Text>
                    </View>
                    
                    {/* Training Response Stats for Trainers */}
                    {event.type === 'training' && event.requiresResponse && canCreateEvent && (
                      <TouchableOpacity 
                        style={styles.eventDetailRow}
                        onPress={() => {
                          setSelectedEvent(event);
                          setShowResponseModal(true);
                        }}
                      >
                        <Users size={14} color="#8E8E93" strokeWidth={1.5} />
                        <Text style={styles.eventDetailText}>
                          {(() => {
                            const stats = getResponseStats(event);
                            return `${stats.accepted} accepted, ${stats.declined} declined, ${stats.pending} pending`;
                          })()}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {event.notes && (
                    <Text style={styles.eventNotes}>{event.notes}</Text>
                  )}
                  
                  {/* Training Response Buttons for Players */}
                  {event.type === 'training' && event.requiresResponse && isPlayer && (
                    <View style={styles.responseButtons}>
                      <TouchableOpacity
                        style={[
                          styles.responseButton,
                          styles.acceptButton,
                          getUserResponse(event) === 'accepted' && styles.responseButtonActive
                        ]}
                        onPress={() => handleTrainingResponse(event.id, 'accepted')}
                      >
                        <Check size={16} color={getUserResponse(event) === 'accepted' ? '#FFFFFF' : '#34C759'} strokeWidth={2} />
                        <Text style={[
                          styles.responseButtonText,
                          { color: getUserResponse(event) === 'accepted' ? '#FFFFFF' : '#34C759' }
                        ]}>
                          Accept
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.responseButton,
                          styles.declineButton,
                          getUserResponse(event) === 'declined' && styles.responseButtonActive
                        ]}
                        onPress={() => handleTrainingResponse(event.id, 'declined')}
                      >
                        <X size={16} color={getUserResponse(event) === 'declined' ? '#FFFFFF' : '#FF3B30'} strokeWidth={2} />
                        <Text style={[
                          styles.responseButtonText,
                          { color: getUserResponse(event) === 'declined' ? '#FFFFFF' : '#FF3B30' }
                        ]}>
                          Decline
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {canCreateEvent && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => {
            const dateStr = selectedDate.toISOString().split('T')[0];
            setNewEvent({ 
              ...newEvent, 
              date: dateStr, 
              trainingStartTime: '', 
              trainingEndTime: '',
              meetingTime: '',
              matchStartTime: '',
              matchEndTime: ''
            });
            setModalVisible(true);
          }}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      )}

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Event</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Event title"
            value={newEvent.title}
            onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            placeholderTextColor="#8E8E93"
          />

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                newEvent.type === 'training' && styles.typeButtonActive
              ]}
              onPress={() => setNewEvent({ ...newEvent, type: 'training' })}
            >
              <Text style={[
                styles.typeButtonText,
                newEvent.type === 'training' && styles.typeButtonTextActive
              ]}>Training</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                newEvent.type === 'match' && styles.typeButtonActive
              ]}
              onPress={() => setNewEvent({ ...newEvent, type: 'match' })}
            >
              <Text style={[
                styles.typeButtonText,
                newEvent.type === 'match' && styles.typeButtonTextActive
              ]}>Match</Text>
            </TouchableOpacity>
          </View>

          {/* Repeat Toggle - Only for Training */}
          {newEvent.type === 'training' && (
            <View style={styles.repeatSection}>
              <TouchableOpacity
                style={styles.repeatToggle}
                onPress={() => setNewEvent({ ...newEvent, isRepeating: !newEvent.isRepeating })}
              >
                <Text style={styles.repeatToggleText}>Repeat Training</Text>
                <View style={[
                  styles.toggleSwitch,
                  newEvent.isRepeating && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    newEvent.isRepeating && styles.toggleThumbActive
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Repeat Options */}
              {newEvent.isRepeating && (
                <View style={styles.repeatOptions}>
                  {/* Frequency Selection */}
                  <View style={styles.frequencySelector}>
                    {['daily', 'weekly', 'monthly'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.frequencyButton,
                          newEvent.repeatFrequency === freq && styles.frequencyButtonActive
                        ]}
                        onPress={() => setNewEvent({ ...newEvent, repeatFrequency: freq as any })}
                      >
                        <Text style={[
                          styles.frequencyButtonText,
                          newEvent.repeatFrequency === freq && styles.frequencyButtonTextActive
                        ]}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Interval Input */}
                  <View style={styles.intervalContainer}>
                    <Text style={styles.intervalLabel}>
                      Every {newEvent.repeatInterval} {newEvent.repeatFrequency === 'daily' ? 'day(s)' : newEvent.repeatFrequency === 'weekly' ? 'week(s)' : 'month(s)'}
                    </Text>
                    <View style={styles.intervalControls}>
                      <TouchableOpacity
                        style={styles.intervalButton}
                        onPress={() => setNewEvent({ ...newEvent, repeatInterval: Math.max(1, newEvent.repeatInterval - 1) })}
                      >
                        <Text style={styles.intervalButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.intervalValue}>{newEvent.repeatInterval}</Text>
                      <TouchableOpacity
                        style={styles.intervalButton}
                        onPress={() => setNewEvent({ ...newEvent, repeatInterval: Math.min(30, newEvent.repeatInterval + 1) })}
                      >
                        <Text style={styles.intervalButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Days of Week Selection (for weekly) */}
                  {newEvent.repeatFrequency === 'weekly' && (
                    <View style={styles.daysSelector}>
                      <Text style={styles.daysSelectorLabel}>Training Days:</Text>
                      <View style={styles.daysGrid}>
                        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                          <TouchableOpacity
                            key={dayIndex}
                            style={[
                              styles.dayButton,
                              newEvent.selectedDays.includes(dayIndex) && styles.dayButtonActive
                            ]}
                            onPress={() => toggleDaySelection(dayIndex)}
                          >
                            <Text style={[
                              styles.dayButtonText,
                              newEvent.selectedDays.includes(dayIndex) && styles.dayButtonTextActive
                            ]}>
                              {getDayName(dayIndex)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* End Options */}
                  <View style={styles.endOptionsContainer}>
                    <Text style={styles.endOptionsLabel}>End Repeat:</Text>
                    <View style={styles.endTypeSelector}>
                      <TouchableOpacity
                        style={[
                          styles.endTypeButton,
                          newEvent.repeatEndType === 'date' && styles.endTypeButtonActive
                        ]}
                        onPress={() => setNewEvent({ ...newEvent, repeatEndType: 'date' })}
                      >
                        <Text style={[
                          styles.endTypeButtonText,
                          newEvent.repeatEndType === 'date' && styles.endTypeButtonTextActive
                        ]}>
                          On Date
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.endTypeButton,
                          newEvent.repeatEndType === 'occurrences' && styles.endTypeButtonActive
                        ]}
                        onPress={() => setNewEvent({ ...newEvent, repeatEndType: 'occurrences' })}
                      >
                        <Text style={[
                          styles.endTypeButtonText,
                          newEvent.repeatEndType === 'occurrences' && styles.endTypeButtonTextActive
                        ]}>
                          After
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {newEvent.repeatEndType === 'date' ? (
                      <TextInput
                        style={styles.endDateInput}
                        placeholder="YYYY-MM-DD"
                        value={newEvent.repeatEndDate}
                        onChangeText={(text) => setNewEvent({ ...newEvent, repeatEndDate: text })}
                        placeholderTextColor="#8E8E93"
                      />
                    ) : (
                      <View style={styles.occurrencesContainer}>
                        <TextInput
                          style={styles.occurrencesInput}
                          placeholder="10"
                          value={newEvent.repeatOccurrences.toString()}
                          onChangeText={(text) => setNewEvent({ ...newEvent, repeatOccurrences: parseInt(text) || 1 })}
                          keyboardType="numeric"
                          placeholderTextColor="#8E8E93"
                        />
                        <Text style={styles.occurrencesLabel}>sessions</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.dateRow}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={newEvent.date}
              onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Time inputs based on event type */}
          {newEvent.type === 'training' ? (
            <View style={styles.timeRow}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>Start Time *</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="HH:MM"
                  value={newEvent.trainingStartTime}
                  onChangeText={(text) => setNewEvent({ ...newEvent, trainingStartTime: text })}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="HH:MM"
                  value={newEvent.trainingEndTime}
                  onChangeText={(text) => setNewEvent({ ...newEvent, trainingEndTime: text })}
                  placeholderTextColor="#8E8E93"
                />
              </View>
            </View>
          ) : (
            <View style={styles.matchTimesContainer}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>Meeting Time *</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="HH:MM"
                  value={newEvent.meetingTime}
                  onChangeText={(text) => setNewEvent({ ...newEvent, meetingTime: text })}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>Start Time *</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="HH:MM"
                  value={newEvent.matchStartTime}
                  onChangeText={(text) => {
                    setNewEvent({ ...newEvent, matchStartTime: text });
                    
                    // Auto-calculate end time (105 minutes later) if not already set
                    if (text && !newEvent.matchEndTime) {
                      const [hours, minutes] = text.split(':').map(Number);
                      if (!isNaN(hours) && !isNaN(minutes)) {
                        const startDate = new Date();
                        startDate.setHours(hours, minutes, 0, 0);
                        const endDate = new Date(startDate.getTime() + 105 * 60 * 1000); // Add 105 minutes
                        const endTime = endDate.toTimeString().slice(0, 5);
                        setNewEvent(prev => ({ ...prev, matchStartTime: text, matchEndTime: endTime }));
                      }
                    }
                  }}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="Auto-calculated"
                  value={newEvent.matchEndTime}
                  onChangeText={(text) => setNewEvent({ ...newEvent, matchEndTime: text })}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              
              <Text style={styles.matchTimeNote}>
                End time is automatically set to 105 minutes after start time, but can be modified.
              </Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Location"
            value={newEvent.location}
            onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
            placeholderTextColor="#8E8E93"
          />

          <TextInput
            style={styles.notesInput}
            placeholder="Notes (optional)"
            value={newEvent.notes}
            onChangeText={(text) => setNewEvent({ ...newEvent, notes: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#8E8E93"
          />

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateEvent}
          >
            <Text style={styles.createButtonText}>Schedule Event</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Response Details Modal for Trainers */}
      <Modal
        isVisible={showResponseModal}
        onBackdropPress={() => setShowResponseModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Training Responses</Text>
            <TouchableOpacity onPress={() => setShowResponseModal(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedEvent && (
            <>
              <Text style={styles.eventTitleInModal}>{selectedEvent.title}</Text>
              <Text style={styles.eventDateInModal}>
                {formatDate(selectedEvent.date)} at {formatTime(selectedEvent.date)}
              </Text>

              <View style={styles.responseStatsContainer}>
                {(() => {
                  const stats = getResponseStats(selectedEvent);
                  return (
                    <>
                      <View style={styles.responseStat}>
                        <View style={[styles.responseStatIcon, { backgroundColor: '#34C75915' }]}>
                          <UserCheck size={20} color="#34C759" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.responseStatNumber}>{stats.accepted}</Text>
                        <Text style={styles.responseStatLabel}>Accepted</Text>
                      </View>
                      
                      <View style={styles.responseStat}>
                        <View style={[styles.responseStatIcon, { backgroundColor: '#FF3B3015' }]}>
                          <UserX size={20} color="#FF3B30" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.responseStatNumber}>{stats.declined}</Text>
                        <Text style={styles.responseStatLabel}>Declined</Text>
                      </View>
                      
                      <View style={styles.responseStat}>
                        <View style={[styles.responseStatIcon, { backgroundColor: '#FF950015' }]}>
                          <ClockIcon size={20} color="#FF9500" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.responseStatNumber}>{stats.pending}</Text>
                        <Text style={styles.responseStatLabel}>Pending</Text>
                      </View>
                    </>
                  );
                })()}
              </View>

              <ScrollView style={styles.responsesList} showsVerticalScrollIndicator={false}>
                <Text style={styles.responsesListTitle}>Player Responses</Text>
                {selectedEvent.responses && Object.entries(selectedEvent.responses).map(([userId, response]) => {
                  const ResponseIcon = getResponseIcon(response);
                  return (
                    <View key={userId} style={styles.responseItem}>
                      <View style={styles.responsePlayerInfo}>
                        <View style={styles.responsePlayerAvatar}>
                          <Text style={styles.responsePlayerInitials}>
                            {userId === user?.id ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'P'}
                          </Text>
                        </View>
                        <Text style={styles.responsePlayerName}>
                          {userId === user?.id ? user.name : `Player ${userId.slice(-1)}`}
                        </Text>
                      </View>
                      <View style={[
                        styles.responseStatus,
                        { backgroundColor: `${getResponseColor(response)}15` }
                      ]}>
                        <ResponseIcon size={16} color={getResponseColor(response)} strokeWidth={1.5} />
                        <Text style={[
                          styles.responseStatusText,
                          { color: getResponseColor(response) }
                        ]}>
                          {response.charAt(0).toUpperCase() + response.slice(1)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for floating button
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  daysHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  selectedDay: {
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  today: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  todayText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  eventDot: {
    position: 'absolute',
    bottom: 6,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1A1A1A',
  },
  selectedEventDot: {
    backgroundColor: '#FFFFFF',
  },
  selectedDateSection: {
    marginBottom: 32,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
    fontFamily: 'Urbanist-SemiBold',
  },
  eventsContainer: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventType: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  eventTime: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    fontFamily: 'Urbanist-SemiBold',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  eventNotes: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'Urbanist-Regular',
  },
  responseIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  responseIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  responseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#F8FFF8',
    borderColor: '#34C759',
  },
  declineButton: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FF3B30',
  },
  responseButtonActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  repeatIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  input: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
    fontFamily: 'Urbanist-Regular',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateRow: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  matchTimesContainer: {
    gap: 16,
    marginBottom: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 8,
  },
  timeInput: {
    marginBottom: 0,
  },
  matchTimeNote: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  eventTimeDetails: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 12,
  },
  notesInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    height: 80,
    marginBottom: 24,
    fontFamily: 'Urbanist-Regular',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  createButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  eventTitleInModal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
  },
  eventDateInModal: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 24,
  },
  responseStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  responseStat: {
    alignItems: 'center',
    gap: 8,
  },
  responseStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  responseStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  responsesList: {
    maxHeight: 300,
  },
  responsesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  responseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  responsePlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  responsePlayerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  responsePlayerInitials: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  responsePlayerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  responseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  responseStatusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  repeatSection: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  repeatToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  repeatToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#34C759',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  repeatOptions: {
    gap: 20,
  },
  frequencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  intervalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intervalLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  intervalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  intervalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  intervalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    minWidth: 24,
    textAlign: 'center',
  },
  daysSelector: {
    gap: 12,
  },
  daysSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  endOptionsContainer: {
    gap: 12,
  },
  endOptionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  endTypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  endTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  endTypeButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  endTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  endTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  endDateInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    fontFamily: 'Urbanist-Regular',
  },
  occurrencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  occurrencesInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    fontFamily: 'Urbanist-Regular',
    width: 80,
    textAlign: 'center',
  },
  occurrencesLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});