import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Target, Plus, X, User, Phone, Calendar, Ruler, Weight, Trophy, Activity, Clock, Hash } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamPlayers, createPlayer } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const formations = [
  {
    id: '4-4-2',
    name: '4-4-2',
    positions: [
      { role: 'GK', x: 50, y: 90 },
      { role: 'LB', x: 15, y: 75 },
      { role: 'CB', x: 35, y: 75 },
      { role: 'CB', x: 65, y: 75 },
      { role: 'RB', x: 85, y: 75 },
      { role: 'LM', x: 20, y: 55 },
      { role: 'CM', x: 40, y: 55 },
      { role: 'CM', x: 60, y: 55 },
      { role: 'RM', x: 80, y: 55 },
      { role: 'ST', x: 40, y: 15 },
      { role: 'ST', x: 60, y: 15 },
    ],
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    positions: [
      { role: 'GK', x: 50, y: 90 },
      { role: 'LB', x: 15, y: 75 },
      { role: 'CB', x: 35, y: 75 },
      { role: 'CB', x: 65, y: 75 },
      { role: 'RB', x: 85, y: 75 },
      { role: 'DM', x: 50, y: 65 },
      { role: 'CM', x: 35, y: 50 },
      { role: 'CM', x: 65, y: 50 },
      { role: 'LW', x: 20, y: 25 },
      { role: 'CF', x: 50, y: 20 },
      { role: 'RW', x: 80, y: 25 },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    positions: [
      { role: 'GK', x: 50, y: 90 },
      { role: 'CB', x: 25, y: 75 },
      { role: 'CB', x: 50, y: 75 },
      { role: 'CB', x: 75, y: 75 },
      { role: 'LWB', x: 10, y: 55 },
      { role: 'CM', x: 35, y: 55 },
      { role: 'CM', x: 50, y: 55 },
      { role: 'CM', x: 65, y: 55 },
      { role: 'RWB', x: 90, y: 55 },
      { role: 'ST', x: 40, y: 15 },
      { role: 'ST', x: 60, y: 15 },
    ],
  },
];

export default function PlayerboardScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'lineup'>('list');
  const [selectedFormation, setSelectedFormation] = useState(formations[1]); // Default to 4-3-3
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [isPlayerModalVisible, setPlayerModalVisible] = useState(false);
  const [isPositionModalVisible, setPositionModalVisible] = useState(false);
  const [isCreatePlayerModalVisible, setCreatePlayerModalVisible] = useState(false);
  const [assignedPlayers, setAssignedPlayers] = useState<{[key: string]: any}>({});
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    position: '',
    jerseyNumber: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    position?: string;
    jerseyNumber?: string;
  }>({});

  const canManagePlayers = user?.role === 'trainer' || user?.role === 'admin';

  // Load players on component mount
  useEffect(() => {
    if (user?.teamId) {
      loadPlayers();
    }
  }, [user]);

  const loadPlayers = async () => {
    if (!user?.teamId) return;
    
    setIsLoading(true);
    try {
      const data = await getTeamPlayers(user.teamId);
      setPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const positions = [
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward',
    'Left Back',
    'Right Back',
    'Center Back',
    'Defensive Midfielder',
    'Central Midfielder',
    'Attacking Midfielder',
    'Left Winger',
    'Right Winger',
    'Striker',
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handlePlayerPress = (player: any) => {
    setSelectedPlayer(player);
    setPlayerModalVisible(true);
  };

  const handlePositionPress = (position: any, index: number) => {
    setSelectedPosition({ ...position, index });
    setPositionModalVisible(true);
  };

  const assignPlayerToPosition = (player: any) => {
    setAssignedPlayers(prev => ({ ...prev, [selectedPosition.index]: player }));
    setPositionModalVisible(false);
  };

  const validateCreatePlayerForm = () => {
    const newErrors: typeof errors = {};

    if (!newPlayer.name.trim()) {
      newErrors.name = 'Player name is required';
    }

    if (!newPlayer.position.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!newPlayer.jerseyNumber.trim()) {
      newErrors.jerseyNumber = 'Jersey number is required';
    } else {
      const jerseyNum = parseInt(newPlayer.jerseyNumber);
      if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
        newErrors.jerseyNumber = 'Jersey number must be between 1 and 99';
      } else if (players.some(p => p.number === jerseyNum)) {
        newErrors.jerseyNumber = 'Jersey number already taken';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePlayer = async () => {
    if (!validateCreatePlayerForm()) return;
    if (!user?.teamId) return;

    try {
      await createPlayer({
        name: newPlayer.name.trim(),
        position: newPlayer.position.trim(),
        jerseyNumber: parseInt(newPlayer.jerseyNumber),
        teamId: user.teamId,
      });
      
      setNewPlayer({ name: '', position: '', jerseyNumber: '' });
      setErrors({});
      setCreatePlayerModalVisible(false);
      Alert.alert('Success', 'Player created successfully!');
      loadPlayers(); // Reload players
    } catch (error) {
      Alert.alert('Error', 'Failed to create player. Please try again.');
    }
  };


  return (
    <View style={styles.container}>
      <Header title="Players" />

      {/* Toggle Section */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              view === 'list' && styles.toggleButtonActive
            ]}
            onPress={() => setView('list')}
          >
            <Users size={18} color={view === 'list' ? '#1A1A1A' : '#8E8E93'} strokeWidth={1.5} />
            <Text style={[
              styles.toggleText,
              view === 'list' && styles.toggleTextActive
            ]}>
              List
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              view === 'lineup' && styles.toggleButtonActive
            ]}
            onPress={() => setView('lineup')}
          >
            <Target size={18} color={view === 'lineup' ? '#1A1A1A' : '#8E8E93'} strokeWidth={1.5} />
            <Text style={[
              styles.toggleText,
              view === 'lineup' && styles.toggleTextActive
            ]}>
              Lineup
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {view === 'list' ? (
          <View style={styles.listView}>
            <Text style={styles.sectionTitle}>Team Players</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading players...</Text>
              </View>
            ) : players.length === 0 ? (
              <View style={styles.emptyPlayersState}>
                <Users size={48} color="#E5E5E7" strokeWidth={1} />
                <Text style={styles.emptyPlayersText}>No players found</Text>
                {canManagePlayers && (
                  <Text style={styles.emptyPlayersSubtext}>Add your first player to get started</Text>
                )}
              </View>
            ) : (
              <View style={styles.playersList}>
                {players.map((player) => (
                  <TouchableOpacity 
                    key={player.id} 
                    style={styles.playerCard}
                    onPress={() => handlePlayerPress(player)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerInitials}>
                        {getInitials(player.name)}
                      </Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerPosition}>{player.position}</Text>
                    </View>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>#{player.jersey_number || '?'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.lineupView}>
            <View style={styles.formationHeader}>
              <Text style={styles.formationTitle}>Formation: {selectedFormation.name}</Text>
              <TouchableOpacity style={styles.aiInsightsButton}>
                <Text style={styles.aiInsightsText}>⚡ AI Insights</Text>
              </TouchableOpacity>
            </View>

            {/* Formation Selector */}
            <ScrollView 
              horizontal 
              contentContainerStyle={styles.formationSelector}
              showsHorizontalScrollIndicator={false}
            >
              {formations.map((formation) => (
                <TouchableOpacity
                  key={formation.id}
                  style={[
                    styles.formationButton,
                    formation.id === selectedFormation.id && styles.formationButtonActive,
                  ]}
                  onPress={() => setSelectedFormation(formation)}
                >
                  <Text
                    style={[
                      styles.formationButtonText,
                      formation.id === selectedFormation.id && styles.formationButtonTextActive,
                    ]}
                  >
                    {formation.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Football Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.field}>
                {/* Field markings */}
                <View style={styles.fieldMarkings}>
                  {/* Center circle */}
                  <View style={styles.centerCircle} />
                  {/* Goal areas */}
                  <View style={[styles.goalArea, styles.topGoalArea]} />
                  <View style={[styles.goalArea, styles.bottomGoalArea]} />
                  {/* Penalty areas */}
                  <View style={[styles.penaltyArea, styles.topPenaltyArea]} />
                  <View style={[styles.penaltyArea, styles.bottomPenaltyArea]} />
                  {/* Center line */}
                  <View style={styles.centerLine} />
                </View>

                {/* Player positions */}
                {selectedFormation.positions.map((pos, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.positionCircle,
                      {
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                      },
                    ]}
                    onPress={() => handlePositionPress(pos, index)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.positionText}>
                      {assignedPlayers[index] ? getInitials(assignedPlayers[index].name) : pos.role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

    {view === 'list' && (
  <TouchableOpacity
    style={styles.floatingButton}
    onPress={() => setCreatePlayerModalVisible(true)}
    activeOpacity={0.8}
  >
    <Plus size={24} color="#FFFFFF" strokeWidth={2} />
  </TouchableOpacity>
    )}

      {/* Player Details Modal */}
      <Modal
        isVisible={isPlayerModalVisible}
        onBackdropPress={() => setPlayerModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Player Details</Text>
            <TouchableOpacity onPress={() => setPlayerModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {selectedPlayer && (
            <ScrollView style={styles.playerDetails} showsVerticalScrollIndicator={false}>
              {/* Player Avatar and Basic Info */}
              <View style={styles.playerHeader}>
                <View style={styles.playerModalAvatar}>
                  <Text style={styles.playerModalInitials}>
                    {getInitials(selectedPlayer.name)}
                  </Text>
                </View>
                <View style={styles.playerBasicInfo}>
                  <Text style={styles.playerModalName}>{selectedPlayer.name}</Text>
                  <Text style={styles.playerModalPosition}>{selectedPlayer.position}</Text>
                  <View style={styles.playerModalNumber}>
                    <Text style={styles.playerModalNumberText}>#{selectedPlayer.number}</Text>
                  </View>
                </View>
              </View>

              {/* Player Stats */}
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Season Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Target size={20} color="#34C759" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Goals</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Activity size={20} color="#007AFF" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.statValue}>8</Text>
                    <Text style={styles.statLabel}>Assists</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Trophy size={20} color="#FF9500" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.statValue}>15</Text>
                    <Text style={styles.statLabel}>Matches</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Clock size={20} color="#8E4EC6" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.statValue}>18</Text>
                    <Text style={styles.statLabel}>Trainings</Text>
                  </View>
                </View>
              </View>

              {/* Player Info */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Player Information</Text>
                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <User size={16} color="#8E8E93" strokeWidth={1.5} />
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>24 years</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ruler size={16} color="#8E8E93" strokeWidth={1.5} />
                    <Text style={styles.infoLabel}>Height</Text>
                    <Text style={styles.infoValue}>180 cm</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Weight size={16} color="#8E8E93" strokeWidth={1.5} />
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>75 kg</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Phone size={16} color="#8E8E93" strokeWidth={1.5} />
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>+1 234 567 890</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Create Player Modal */}
      <Modal
        isVisible={isCreatePlayerModalVisible}
        onBackdropPress={() => setCreatePlayerModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Player</Text>
            <TouchableOpacity onPress={() => setCreatePlayerModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                  <User size={20} color="#8E8E93" strokeWidth={1.5} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter player's full name"
                    value={newPlayer.name}
                    onChangeText={(text) => {
                      setNewPlayer(prev => ({ ...prev, name: text }));
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Position Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Position *</Text>
                <View style={[styles.inputContainer, errors.position && styles.inputError]}>
                  <Target size={20} color="#8E8E93" strokeWidth={1.5} />
                  <TextInput
                    style={styles.input}
                    placeholder="Select or enter position"
                    value={newPlayer.position}
                    onChangeText={(text) => {
                      setNewPlayer(prev => ({ ...prev, position: text }));
                      if (errors.position) setErrors(prev => ({ ...prev, position: undefined }));
                    }}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}
                
                {/* Position Suggestions */}
                {newPlayer.position && (
                  <View style={styles.positionSuggestions}>
                    {positions
                      .filter(pos => pos.toLowerCase().includes(newPlayer.position.toLowerCase()))
                      .slice(0, 4)
                      .map((position) => (
                        <TouchableOpacity
                          key={position}
                          style={styles.positionSuggestion}
                          onPress={() => {
                            setNewPlayer(prev => ({ ...prev, position }));
                            if (errors.position) setErrors(prev => ({ ...prev, position: undefined }));
                          }}
                        >
                          <Text style={styles.positionSuggestionText}>{position}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </View>

              {/* Jersey Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Jersey Number *</Text>
                <View style={[styles.inputContainer, errors.jerseyNumber && styles.inputError]}>
                  <Hash size={20} color="#8E8E93" strokeWidth={1.5} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter jersey number (1-99)"
                    value={newPlayer.jerseyNumber}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericText = text.replace(/[^0-9]/g, '');
                      setNewPlayer(prev => ({ ...prev, jerseyNumber: numericText }));
                      if (errors.jerseyNumber) setErrors(prev => ({ ...prev, jerseyNumber: undefined }));
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                {errors.jerseyNumber && <Text style={styles.errorText}>{errors.jerseyNumber}</Text>}
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setNewPlayer({ name: '', position: '', jerseyNumber: '' });
                setErrors({});
                setCreatePlayerModalVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePlayer}
            >
              <Text style={styles.createButtonText}>Create Player</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Position Assignment Modal */}
      <Modal
        isVisible={isPositionModalVisible}
        onBackdropPress={() => setPositionModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Assign Player to {selectedPosition?.role}
            </Text>
            <TouchableOpacity onPress={() => setPositionModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.playerSelection} showsVerticalScrollIndicator={false}>
            {/* Clear Position Option */}
            {assignedPlayers[selectedPosition?.index] && (
              <TouchableOpacity 
                style={styles.clearPositionButton}
                onPress={() => {
                  setAssignedPlayers(prev => {
                    const newAssigned = { ...prev };
                    delete newAssigned[selectedPosition.index];
                    return newAssigned;
                  });
                  setPositionModalVisible(false);
                }}
              >
                <X size={20} color="#FF3B30" strokeWidth={1.5} />
                <Text style={styles.clearPositionText}>Clear Position</Text>
              </TouchableOpacity>
            )}

            {/* Available Players */}
            <Text style={styles.sectionTitle}>Select Player</Text>
            <View style={styles.availablePlayersList}>
              {players
                .filter(player => !Object.values(assignedPlayers).some(assigned => assigned?.id === player.id))
                .map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.availablePlayerCard}
                  onPress={() => assignPlayerToPosition(player)}
                >
                  <View style={styles.availablePlayerAvatar}>
                    <Text style={styles.availablePlayerInitials}>
                      {getInitials(player.name)}
                    </Text>
                  </View>
                  <View style={styles.availablePlayerInfo}>
                    <Text style={styles.availablePlayerName}>{player.name}</Text>
                    <Text style={styles.availablePlayerPosition}>{player.position}</Text>
                  </View>
                  <View style={styles.availablePlayerNumber}>
                    <Text style={styles.availablePlayerNumberText}>#{player.jersey_number || '?'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Show message if no available players */}
            {players.filter(player => !Object.values(assignedPlayers).some(assigned => assigned?.id === player.id)).length === 0 && (
              <View style={styles.noPlayersAvailable}>
                <Users size={32} color="#E5E5E7" strokeWidth={1} />
                <Text style={styles.noPlayersText}>All players are assigned</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const FIELD_WIDTH = width - 48;
const FIELD_HEIGHT = (FIELD_WIDTH * 1.4);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toggleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 6,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  toggleTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listView: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 20,
  },
  playersList: {
    gap: 16,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playerInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  playerNumber: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playerNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  lineupView: {
    paddingBottom: 100,
  },
  formationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  aiInsightsButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  aiInsightsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
    fontFamily: 'Urbanist-Medium',
  },
  formationSelector: {
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  formationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  formationButtonActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  formationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  formationButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  fieldContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  field: {
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fieldMarkings: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ translateY: -1 }],
  },
  goalArea: {
    position: 'absolute',
    left: '35%',
    width: '30%',
    height: '12%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  topGoalArea: {
    top: 0,
    borderTopWidth: 0,
  },
  bottomGoalArea: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  penaltyArea: {
    position: 'absolute',
    left: '20%',
    width: '60%',
    height: '20%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  topPenaltyArea: {
    top: 0,
    borderTopWidth: 0,
  },
  bottomPenaltyArea: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  positionCircle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -22 }, { translateY: -22 }],
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  positionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  floatingButton: {
  position: 'absolute',
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#000',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3.84,
  zIndex: 100,
},
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  emptyPlayersState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyPlayersText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  emptyPlayersSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
  playerDetails: {
    flex: 1,
    paddingHorizontal: 24,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 24,
  },
  playerModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  playerModalInitials: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  playerBasicInfo: {
    flex: 1,
  },
  playerModalName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  playerModalPosition: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 12,
  },
  playerModalNumber: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  playerModalNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  playerSelection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  clearPositionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    gap: 8,
  },
  clearPositionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    fontFamily: 'Urbanist-Medium',
  },
  availablePlayersList: {
    gap: 12,
  },
  availablePlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  availablePlayerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  availablePlayerInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  availablePlayerInfo: {
    flex: 1,
  },
  availablePlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  availablePlayerPosition: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  availablePlayerNumber: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availablePlayerNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  noPlayersAvailable: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noPlayersText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formSection: {
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontFamily: 'Urbanist-Regular',
    marginTop: 8,
  },
  positionSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  positionSuggestion: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  positionSuggestionText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
});