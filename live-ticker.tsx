import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import Modal from 'react-native-modal';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { X, Play, Pause, Square, Plus, Target, Users, TriangleAlert as AlertTriangle, RotateCcw, Share2, MessageSquare, Clock, Trophy, User } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface MatchEvent {
  id: string;
  type: 'goal_my_team' | 'goal_opponent' | 'yellow_my_team' | 'red_my_team' | 'yellow_opponent' | 'red_opponent' | 'substitution';
  minute: number;
  player?: string;
  assist?: string;
  substitutionIn?: string;
  substitutionOut?: string;
  timestamp: Date;
}

export default function LiveTickerScreen() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [matchTime, setMatchTime] = useState(0); // in seconds
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentName, setOpponentName] = useState('Opponent Team');
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<MatchEvent['type'] | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedAssist, setSelectedAssist] = useState<string>('');
  const [pendingEvent, setPendingEvent] = useState<Partial<MatchEvent> | null>(null);

  const canManageMatch = user?.role === 'trainer' || user?.role === 'admin';

  // Load players on component mount
  useEffect(() => {
    if (user?.teamId) {
      loadPlayers();
    }
  }, [user]);

  const loadPlayers = async () => {
    if (!user?.teamId) return;
    
    try {
      const data = await getTeamPlayers(user.teamId);
      setPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMatchActive && !isPaused) {
      interval = setInterval(() => {
        setMatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMatchActive, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentMinute = () => {
    return Math.floor(matchTime / 60);
  };

  const startMatch = () => {
    setIsMatchActive(true);
    setIsPaused(false);
  };

  const pauseMatch = () => {
    setIsPaused(!isPaused);
  };

  const endMatch = () => {
    Alert.alert(
      t.endMatch,
      t.confirm + '?',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.endMatch, 
          style: 'destructive',
          onPress: () => {
            setIsMatchActive(false);
            setIsPaused(false);
          }
        }
      ]
    );
  };

  const resetMatch = () => {
    Alert.alert(
      t.resetMatch,
      t.confirm + '?',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.resetMatch, 
          style: 'destructive',
          onPress: () => {
            setIsMatchActive(false);
            setIsPaused(false);
            setMatchTime(0);
            setTeamScore(0);
            setOpponentScore(0);
            setEvents([]);
          }
        }
      ]
    );
  };

  const handleEventSelection = (eventType: MatchEvent['type']) => {
    setSelectedEventType(eventType);
    setShowEventModal(false);
    setShowPlayerModal(true);
  };

  const handlePlayerSelection = (playerId: string, playerName: string) => {
    setSelectedPlayer(playerName);
    setShowPlayerModal(false);

    // If it's a goal, ask for assist
    if (selectedEventType === 'goal_my_team') {
      setShowAssistModal(true);
      setPendingEvent({
        type: selectedEventType,
        minute: getCurrentMinute(),
        player: playerName,
        timestamp: new Date(),
      });
    } else {
      // Add event directly for non-goal events
      addEvent({
        type: selectedEventType!,
        minute: getCurrentMinute(),
        player: playerName,
        timestamp: new Date(),
      });
    }
  };

  const handleAssistSelection = (assistPlayer?: string) => {
    setShowAssistModal(false);
    
    if (pendingEvent) {
      addEvent({
        ...pendingEvent,
        assist: assistPlayer,
      } as MatchEvent);
    }
    
    setPendingEvent(null);
    setSelectedAssist('');
  };

  const addEvent = (event: Omit<MatchEvent, 'id'>) => {
    const newEvent: MatchEvent = {
      ...event,
      id: Date.now().toString(),
    };

    setEvents(prev => [...prev, newEvent]);

    // Update scores for goals
    if (event.type === 'goal_my_team') {
      setTeamScore(prev => prev + 1);
    } else if (event.type === 'goal_opponent') {
      setOpponentScore(prev => prev + 1);
    }

    // Reset selections
    setSelectedEventType(null);
    setSelectedPlayer('');
  };

  const removeEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    Alert.alert(
      t.delete,
      t.confirm + '?',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.delete, 
          style: 'destructive',
          onPress: () => {
            setEvents(prev => prev.filter(e => e.id !== eventId));
            
            // Update scores
            if (event.type === 'goal_my_team') {
              setTeamScore(prev => Math.max(0, prev - 1));
            } else if (event.type === 'goal_opponent') {
              setOpponentScore(prev => Math.max(0, prev - 1));
            }
          }
        }
      ]
    );
  };

  const generateLiveTicker = () => {
    const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);
    
    let ticker = `🏆 ${t.liveMatch}\n\n`;
    ticker += `${user?.name || 'My Team'} ${teamScore} - ${opponentScore} ${opponentName}\n`;
    ticker += `⏱️ ${getCurrentMinute()}'${isMatchActive ? ` (${t.live})` : ` (${t.ended})`}\n\n`;
    
    if (sortedEvents.length > 0) {
      ticker += `📋 ${t.matchEvents}:\n`;
      sortedEvents.forEach(event => {
        const minute = event.minute;
        switch (event.type) {
          case 'goal_my_team':
            ticker += `⚽ ${minute}' ${t.goalMyTeam.split(' - ')[0].toUpperCase()}! ${event.player} (${user?.name || 'My Team'})`;
            if (event.assist) ticker += ` - ${t.selectAssist.split(' ')[1]}: ${event.assist}`;
            ticker += `\n`;
            break;
          case 'goal_opponent':
            ticker += `⚽ ${minute}' ${t.goalOpponent.split(' - ')[0]} ${event.player} (${opponentName})\n`;
            break;
          case 'yellow_my_team':
            ticker += `🟨 ${minute}' ${t.yellowCard} - ${event.player} (${user?.name || 'My Team'})\n`;
            break;
          case 'red_my_team':
            ticker += `🟥 ${minute}' ${t.redCard} - ${event.player} (${user?.name || 'My Team'})\n`;
            break;
          case 'yellow_opponent':
            ticker += `🟨 ${minute}' ${t.yellowCard} - ${event.player} (${opponentName})\n`;
            break;
          case 'red_opponent':
            ticker += `🟥 ${minute}' ${t.redCard} - ${event.player} (${opponentName})\n`;
            break;
          case 'substitution':
            ticker += `🔄 ${minute}' ${t.substitution} - ${event.substitutionOut} ➡️ ${event.substitutionIn}\n`;
            break;
        }
      });
    } else {
      ticker += `${t.noEventsYet}.\n`;
    }
    
    ticker += `\n📱 ${language === 'de' ? 'Generiert von Team App' : 'Generated by Team App'}`;
    return ticker;
  };

  const shareLiveTicker = async () => {
    try {
      const ticker = generateLiveTicker();
      await Share.share({
        message: ticker,
        title: t.liveTicker,
      });
    } catch (error) {
      Alert.alert(t.error, t.somethingWentWrong);
    }
  };

  const postToInfoHub = () => {
    const ticker = generateLiveTicker();
    Alert.alert(
      t.postToInfoHub,
      language === 'de' ? 'Dies wird den aktuellen Live-Ticker im Team Info-Hub posten.' : 'This will post the current live ticker to the team\'s Info Hub.',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: language === 'de' ? 'Posten' : 'Post', 
          onPress: () => {
            Alert.alert(t.success, language === 'de' ? 'Live-Ticker im Info-Hub gepostet!' : 'Live ticker posted to Info Hub!');
          }
        }
      ]
    );
  };

  const getEventIcon = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal_my_team':
      case 'goal_opponent':
        return Target;
      case 'yellow_my_team':
      case 'yellow_opponent':
      case 'red_my_team':
      case 'red_opponent':
        return AlertTriangle;
      case 'substitution':
        return RotateCcw;
      default:
        return User;
    }
  };

  const getEventColor = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal_my_team':
        return '#34C759';
      case 'goal_opponent':
        return '#FF3B30';
      case 'yellow_my_team':
      case 'yellow_opponent':
        return '#FF9500';
      case 'red_my_team':
      case 'red_opponent':
        return '#FF3B30';
      case 'substitution':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getEventDescription = (event: MatchEvent) => {
    const minute = event.minute;
    switch (event.type) {
      case 'goal_my_team':
        return `${minute}' GOAL! ${event.player}${event.assist ? ` (Assist: ${event.assist})` : ''}`;
      case 'goal_opponent':
        return `${minute}' Goal ${event.player}`;
      case 'yellow_my_team':
      case 'yellow_opponent':
        return `${minute}' Yellow Card - ${event.player}`;
      case 'red_my_team':
      case 'red_opponent':
        return `${minute}' Red Card - ${event.player}`;
      case 'substitution':
        return `${minute}' ${event.substitutionOut} ➡️ ${event.substitutionIn}`;
      default:
        return `${minute}' Event`;
    }
  };

  if (!canManageMatch) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.liveTicker}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.accessDenied}>
          <Trophy size={48} color="#E5E5E7" strokeWidth={1} />
          <Text style={styles.accessDeniedTitle}>{t.accessRestricted}</Text>
          <Text style={styles.accessDeniedText}>
            {t.onlyTrainersAndAdmins}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.liveTicker}</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={shareLiveTicker}
        >
          <Share2 size={20} color="#007AFF" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Match Score */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreCard}>
            <View style={styles.teamNames}>
              <Text style={styles.teamName}>{user?.name || 'My Team'}</Text>
              <Text style={styles.teamNameVs}>vs</Text>
              <Text style={styles.teamName}>{opponentName}</Text>
            </View>
            <View style={styles.scoreDisplay}>
              <Text style={styles.score}>{teamScore}</Text>
              <Text style={styles.scoreDividerText}>-</Text>
              <Text style={styles.score}>{opponentScore}</Text>
            </View>
          </View>
          
          <View style={styles.matchInfo}>
            <Clock size={16} color="#8E8E93" strokeWidth={1.5} />
            <Text style={styles.matchTime}>{formatTime(matchTime)}</Text>
            <Text style={styles.matchStatus}>
              {isMatchActive ? (isPaused ? t.paused : t.live) : t.notStarted}
            </Text>
          </View>
        </View>

        {/* Match Controls */}
        <View style={styles.controlsSection}>
          <View style={styles.controls}>
            {!isMatchActive ? (
              <TouchableOpacity style={styles.startButton} onPress={startMatch}>
                <Play size={20} color="#FFFFFF" strokeWidth={1.5} />
                <Text style={styles.startButtonText}>{t.startMatch}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.pauseButton]} 
                  onPress={pauseMatch}
                >
                  {isPaused ? (
                    <Play size={20} color="#FFFFFF" strokeWidth={1.5} />
                  ) : (
                    <Pause size={20} color="#FFFFFF" strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.endButton]} 
                  onPress={endMatch}
                >
                  <Square size={20} color="#FFFFFF" strokeWidth={1.5} />
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.resetButton]} 
              onPress={resetMatch}
            >
              <RotateCcw size={20} color="#FF3B30" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {isMatchActive && (
            <TouchableOpacity 
              style={styles.addEventButton}
              onPress={() => setShowEventModal(true)}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text style={styles.addEventText}>{t.addEvent}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>{t.matchEvents}</Text>
          
          {events.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Trophy size={32} color="#E5E5E7" strokeWidth={1} />
              <Text style={styles.emptyEventsText}>{t.noEventsYet}</Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {[...events].reverse().map((event) => {
                const IconComponent = getEventIcon(event.type);
                const color = getEventColor(event.type);
                
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventItem}
                    onLongPress={() => removeEvent(event.id)}
                  >
                    <View style={[styles.eventIcon, { backgroundColor: `${color}15` }]}>
                      <IconComponent size={16} color={color} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.eventDescription}>
                      {getEventDescription(event)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Share Section */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>{t.shareLiveTicker}</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareOptionButton} onPress={postToInfoHub}>
              <MessageSquare size={20} color="#34C759" strokeWidth={1.5} />
              <Text style={styles.shareOptionText}>{t.postToInfoHub}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareOptionButton} onPress={shareLiveTicker}>
              <Share2 size={20} color="#007AFF" strokeWidth={1.5} />
              <Text style={styles.shareOptionText}>{t.shareExternally}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Event Selection Modal */}
      <Modal
        isVisible={showEventModal}
        onBackdropPress={() => setShowEventModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.selectEventType}</Text>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.eventTypes}>
            <TouchableOpacity 
              style={[styles.eventTypeButton, styles.goalMyTeam]}
              onPress={() => handleEventSelection('goal_my_team')}
            >
              <Target size={20} color="#34C759" strokeWidth={1.5} />
              <Text style={styles.eventTypeText}>{t.goalMyTeam}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTypeButton, styles.goalOpponent]}
              onPress={() => handleEventSelection('goal_opponent')}
            >
              <Target size={20} color="#FF3B30" strokeWidth={1.5} />
              <Text style={styles.eventTypeText}>{t.goalOpponent}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTypeButton, styles.yellowCard]}
              onPress={() => handleEventSelection('yellow_my_team')}
            >
              <AlertTriangle size={20} color="#FF9500" strokeWidth={1.5} />
              <Text style={styles.eventTypeText}>{t.yellowCard} - {t.myTeam}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTypeButton, styles.yellowCard]}
              onPress={() => handleEventSelection('yellow_opponent')}
            >
              <AlertTriangle size={20} color="#FF9500" strokeWidth={1.5} />
              <Text style={styles.eventTypeText}>{t.yellowCard} - {t.opponent}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTypeButton, styles.redCard]}
              onPress={() => handleEventSelection('red_my_team')}
            >
              <AlertTriangle size={20} color="#FF3B30" strokeWidth={1.5} />
              <Text style={styles.eventTypeText}>{t.redCard} - {t.myTeam}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTypeButton, styles.redCard]}
              onPress={() => handleEventSelection('red_opponent')}
            >
              <AlertTriangle size={20} color="#FF3B30" strokeWidth={1.5} />
              <Text style={styles.eventTypeText}>{t.redCard} - {t.opponent}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTypeButton, styles.substitution]}
              onPress={() => handleEventSelection('substitution')}
            >
              <RotateCcw size={20} color="#007AFF" strokeWidth={1.5} />
              <Text style={styles.eventTypeText}>{t.substitution}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Player Selection Modal */}
      <Modal
        isVisible={showPlayerModal}
        onBackdropPress={() => setShowPlayerModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.selectPlayer}</Text>
            <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.playersList}>
            {selectedEventType?.includes('opponent') ? (
              <View style={styles.opponentInput}>
                <TextInput
                  style={styles.opponentNameInput}
                  placeholder={language === 'de' ? 'Gegner-Spielername eingeben' : 'Enter opponent player name'}
                  value={selectedPlayer}
                  onChangeText={setSelectedPlayer}
                  placeholderTextColor="#8E8E93"
                />
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => handlePlayerSelection('', selectedPlayer)}
                  disabled={!selectedPlayer.trim()}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    !selectedPlayer.trim() && styles.confirmButtonTextDisabled
                  ]}>
                    {t.confirm}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              players.length === 0 ? (
                <View style={styles.emptyPlayers}>
                  <Text style={styles.emptyPlayersText}>
                    {language === 'de' ? 'Keine Spieler gefunden' : 'No players found'}
                  </Text>
                </View>
              ) : (
                players.map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    style={styles.playerItem}
                    onPress={() => handlePlayerSelection(player.id, player.name)}
                  >
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerPosition}>{player.position}</Text>
                    </View>
                    <View style={styles.playerJersey}>
                      <Text style={styles.playerJerseyNumber}>{player.jersey_number || '?'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Assist Selection Modal */}
      <Modal
        isVisible={showAssistModal}
        onBackdropPress={() => handleAssistSelection()}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.selectAssist}</Text>
            <TouchableOpacity onPress={() => handleAssistSelection()}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.noAssistButton}
            onPress={() => handleAssistSelection()}
          >
            <Text style={styles.noAssistText}>{t.noAssist}</Text>
          </TouchableOpacity>

          <ScrollView style={styles.playersList}>
            {players
              .filter(player => player.name !== selectedPlayer)
              .map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerItem}
                  onPress={() => handleAssistSelection(player.name)}
                >
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerPosition}>{player.position}</Text>
                  </View>
                  <View style={styles.playerJersey}>
                    <Text style={styles.playerJerseyNumber}>{player.jersey_number || '?'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scoreSection: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  scoreCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  teamNames: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    textAlign: 'center',
  },
  teamNameVs: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  scoreDividerText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  matchStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
    fontFamily: 'Urbanist-Medium',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  controlsSection: {
    marginBottom: 32,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
  resetButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addEventText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  eventsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  emptyEvents: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEventsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDescription: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    flex: 1,
  },
  shareSection: {
    marginBottom: 32,
  },
  shareButtons: {
    gap: 12,
  },
  shareOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  accessDeniedText: {
    marginTop: 8,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  eventTypes: {
    padding: 24,
    gap: 12,
  },
  eventTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
  },
  goalMyTeam: {
    backgroundColor: '#F0FFF4',
    borderColor: '#34C759',
  },
  goalOpponent: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  yellowCard: {
    backgroundColor: '#FFFBF0',
    borderColor: '#FF9500',
  },
  redCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  substitution: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
  },
  eventTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  playersList: {
    maxHeight: 400,
    paddingHorizontal: 24,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  playerJersey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerJerseyNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  opponentInput: {
    padding: 16,
    gap: 16,
  },
  opponentNameInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  confirmButtonTextDisabled: {
    color: '#8E8E93',
  },
  noAssistButton: {
    margin: 24,
    marginBottom: 0,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  noAssistText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  emptyPlayers: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPlayersText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});