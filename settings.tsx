import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import Modal from 'react-native-modal';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { X, User, Bell, Shield, Palette, Globe, CircleHelp as HelpCircle, LogOut, ChevronRight, Moon, Volume2, Smartphone, Save, CreditCard as Edit3, Eye, EyeOff, Lock, Key, UserCheck, Database, Check, UserPlus, ArrowRight, Mail } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';


export default function SettingsScreen() {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isAddAccountModalVisible, setAddAccountModalVisible] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<'signin' | 'signup'>('signin');
  const [newAccountData, setNewAccountData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [newAccountErrors, setNewAccountErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});
  const [editingProfile, setEditingProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    position: '',
  });
  
  // Privacy & Security settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'team' as 'public' | 'team' | 'private',
    showEmail: true,
    showPhone: false,
    allowDirectMessages: true,
    shareStats: true,
    dataCollection: true,
    twoFactorAuth: false,
    sessionTimeout: '30' as '15' | '30' | '60' | 'never',
    loginNotifications: true,
  });

  // Update editing profile when user changes
  useEffect(() => {
    if (user) {
      setEditingProfile({
        name: user.name,
        email: user.email,
        phone: '',
        position: '',
      });
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      t.signOut,
      `${t.confirm}?`,
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.signOut, 
          style: 'destructive',
          onPress: performLogout
        }
      ]
    );
  };

  const handleAddAccount = () => {
    router.push('/auth/login');
  };

  const performLogout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Call the signOut function from AuthContext
      await signOut();
      
      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during logout';
        
      Alert.alert(
        t.error, 
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: performLogout
          },
          {
            text: t.cancel,
            style: 'cancel'
          }
        ]
      );
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </View>
    );
  }

  const handleProfileEdit = () => {
    if (user) {
      setEditingProfile({
        name: user.name,
        email: user.email,
        phone: '',
        position: '',
      });
    }
    setProfileModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!editingProfile.name.trim() || !editingProfile.email.trim()) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingProfile.email)) {
      Alert.alert(t.error, t.validEmailRequired);
      return;
    }

    // In a real app, this would update the user in Supabase
    // For now, just show success message

    setProfileModalVisible(false);
    Alert.alert(t.success, t.profileUpdated);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditingProfile({
        name: user.name,
        email: user.email,
        phone: '',
        position: '',
      });
    }
    setProfileModalVisible(false);
  };

  const handlePrivacySettings = () => {
    setPrivacyModalVisible(true);
  };

  const handleSavePrivacySettings = () => {
    setPrivacyModalVisible(false);
    Alert.alert(t.success, t.settingsUpdated);
  };

  const handleCancelPrivacySettings = () => {
    setPrivacyModalVisible(false);
  };

  const handleLanguageSelection = () => {
    setLanguageModalVisible(true);
  };

  const handleLanguageChange = (newLanguage: 'en' | 'de') => {
    const languageName = newLanguage === 'en' ? 'English' : 'Deutsch';
    setLanguage(newLanguage);
    setLanguageModalVisible(false);
    Alert.alert(t.languageChanged, t.languageChangedMessage.replace('{language}', languageName));
  };

  const validateNewAccountForm = () => {
    const newErrors: typeof newAccountErrors = {};

    if (accountModalMode === 'signup' && !newAccountData.name.trim()) {
      newErrors.name = t.fillAllFields;
    }

    if (!newAccountData.email.trim()) {
      newErrors.email = t.fillAllFields;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAccountData.email)) {
      newErrors.email = t.validEmailRequired;
    }

    if (!newAccountData.password.trim()) {
      newErrors.password = t.fillAllFields;
    } else if (accountModalMode === 'signup' && newAccountData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setNewAccountErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAccountModal = async () => {
    if (!validateNewAccountForm()) return;

    try {
      if (accountModalMode === 'signin') {
        await signIn(newAccountData.email, newAccountData.password);
      } else {
        await signUp(newAccountData.email, newAccountData.password, newAccountData.name);
      }
      setNewAccountData({ email: '', password: '', name: '' });
      setNewAccountErrors({});
      setAddAccountModalVisible(false);
      Alert.alert(t.success, accountModalMode === 'signin' ? 'Account switched successfully!' : 'Account created and switched successfully!');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : t.somethingWentWrong);
    }
  };

  const handleCancelAddAccount = () => {
    setNewAccountData({ email: '', password: '', name: '' });
    setNewAccountErrors({});
    setAccountModalMode('signin');
    setAddAccountModalVisible(false);
  };

  const handleToggle2FA = () => {
    if (!privacySettings.twoFactorAuth) {
      Alert.alert(
        t.enableTwoFactor,
        t.enableTwoFactorMessage,
        [
          { text: t.cancel, style: 'cancel' },
          { 
            text: t.enable, 
            onPress: () => {
              setPrivacySettings(prev => ({ ...prev, twoFactorAuth: true }));
              Alert.alert(t.success, `${t.twoFactorAuth} ${t.enabled.toLowerCase()}!`);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        t.disableTwoFactor,
        t.disableTwoFactorMessage,
        [
          { text: t.cancel, style: 'cancel' },
          { 
            text: t.disable, 
            style: 'destructive',
            onPress: () => {
              setPrivacySettings(prev => ({ ...prev, twoFactorAuth: false }));
              Alert.alert(t.disabled, `${t.twoFactorAuth} ${t.disabled.toLowerCase()}.`);
            }
          }
        ]
      );
    }
  };

  const formatJoinedDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    rightComponent 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Icon size={20} color="#1A1A1A" strokeWidth={1.5} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && !rightComponent && (
          <ChevronRight size={16} color="#8E8E93" strokeWidth={1.5} />
        )}
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>{t.settings}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Add Account Button */}
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={UserPlus}
              title="Add Account"
              subtitle="Switch to another account"
              onPress={handleAddAccount}
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.account}</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={User}
              title={t.profile}
              subtitle={t.editProfile}
              onPress={handleProfileEdit}
            />
            <SettingItem
              icon={Shield}
              title={t.privacySecurity}
              subtitle={t.privacySecurity}
              onPress={handlePrivacySettings}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.preferences}</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={Bell}
              title={t.notifications}
              subtitle={t.notifications}
              showChevron={false}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingItem
              icon={Moon}
              title={t.darkMode}
              subtitle={t.darkMode}
              showChevron={false}
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingItem
              icon={Volume2}
              title={t.soundEffects}
              subtitle={t.soundEffects}
              showChevron={false}
              rightComponent={
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingItem
              icon={Globe}
              title={t.language}
              subtitle={language === 'en' ? 'English' : 'Deutsch'}
              onPress={handleLanguageSelection}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.app}</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={Smartphone}
              title={t.appVersion}
              subtitle="1.0.0"
              showChevron={false}
            />
            <SettingItem
              icon={HelpCircle}
              title={t.helpSupport}
              subtitle={t.helpSupport}
              onPress={() => Alert.alert(t.helpSupport, 'Help center coming soon')}
            />
            <SettingItem
              icon={LogOut}
              title={t.signOut}
              subtitle="Sign out of your account"
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        isVisible={isProfileModalVisible}
        onBackdropPress={handleCancelEdit}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.editProfile}</Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Profile Avatar */}
            <View style={styles.modalProfileSection}>
              <View style={styles.modalProfileAvatar}>
                <Text style={styles.modalProfileInitials}>
                  {editingProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Edit3 size={16} color="#007AFF" strokeWidth={1.5} />
                <Text style={styles.editAvatarText}>{t.changePhoto}</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.fullName} *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editingProfile.name}
                  onChangeText={(text) => setEditingProfile(prev => ({ ...prev, name: text }))}
                  placeholder={t.fullName}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.email} *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editingProfile.email}
                  onChangeText={(text) => setEditingProfile(prev => ({ ...prev, email: text }))}
                  placeholder={t.email}
                  placeholderTextColor="#8E8E93"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.phoneNumber}</Text>
                <TextInput
                  style={styles.formInput}
                  value={editingProfile.phone}
                  onChangeText={(text) => setEditingProfile(prev => ({ ...prev, phone: text }))}
                  placeholder={t.phoneNumber}
                  placeholderTextColor="#8E8E93"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.position}</Text>
                <TextInput
                  style={styles.formInput}
                  value={editingProfile.position}
                  onChangeText={(text) => setEditingProfile(prev => ({ ...prev, position: text }))}
                  placeholder={t.position}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              {/* Read-only fields */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.role}</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{user.role.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.memberSince}</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{formatJoinedDate('')}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Save size={16} color="#FFFFFF" strokeWidth={1.5} />
              <Text style={styles.saveButtonText}>{t.saveChanges}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy & Security Modal */}
      <Modal
        isVisible={isPrivacyModalVisible}
        onBackdropPress={handleCancelPrivacySettings}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
           <Text style={styles.modalTitle}>{t.privacySecurity}</Text>
            <TouchableOpacity onPress={handleCancelPrivacySettings}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Profile Privacy Section */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>{t.profilePrivacy}</Text>
              
              <View style={styles.privacyItem}>
                <View style={styles.privacyItemLeft}>
                  <Eye size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.profileVisibility}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.whoCanSeeProfile}</Text>
                  </View>
                </View>
                <View style={styles.visibilitySelector}>
                  {(['public', 'team', 'private'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.visibilityOption,
                        privacySettings.profileVisibility === option && styles.visibilityOptionActive
                      ]}
                      onPress={() => setPrivacySettings(prev => ({ ...prev, profileVisibility: option }))}
                    >
                      <Text style={[
                        styles.visibilityOptionText,
                        privacySettings.profileVisibility === option && styles.visibilityOptionTextActive
                      ]}>
                        {option === 'public' ? t.public : option === 'team' ? t.team : t.private}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.privacyToggleItem}>
                <View style={styles.privacyItemLeft}>
                  <UserCheck size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.showEmail}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.displayEmailInProfile}</Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.showEmail}
                  onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showEmail: value }))}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.privacyToggleItem}>
                <View style={styles.privacyItemLeft}>
                  <Smartphone size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.showPhone}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.displayPhoneInProfile}</Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.showPhone}
                  onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showPhone: value }))}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Communication Section */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>{t.communication}</Text>
              
              <View style={styles.privacyToggleItem}>
                <View style={styles.privacyItemLeft}>
                  <Bell size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.directMessages}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.allowTeamMembersToMessage}</Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.allowDirectMessages}
                  onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allowDirectMessages: value }))}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.privacyToggleItem}>
                <View style={styles.privacyItemLeft}>
                  <Database size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.shareStatistics}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.includeStatsInReports}</Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.shareStats}
                  onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, shareStats: value }))}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Security Section */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>{t.security}</Text>
              
              <View style={styles.privacyToggleItem}>
                <View style={styles.privacyItemLeft}>
                  <Lock size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.twoFactorAuth}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.addExtraSecurityToAccount}</Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.twoFactorAuth}
                  onValueChange={handleToggle2FA}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyItemLeft}>
                  <Key size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.sessionTimeout}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.autoLogoutAfterInactivity}</Text>
                  </View>
                </View>
                <View style={styles.timeoutSelector}>
                  {(['15', '30', '60', 'never'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.timeoutOption,
                        privacySettings.sessionTimeout === option && styles.timeoutOptionActive
                      ]}
                      onPress={() => setPrivacySettings(prev => ({ ...prev, sessionTimeout: option }))}
                    >
                      <Text style={[
                        styles.timeoutOptionText,
                        privacySettings.sessionTimeout === option && styles.timeoutOptionTextActive
                      ]}>
                        {option === 'never' ? 'Nie' : `${option}m`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.privacyToggleItem}>
                <View style={styles.privacyItemLeft}>
                  <Shield size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.loginNotifications}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.getNotifiedOfNewSignIns}</Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.loginNotifications}
                  onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, loginNotifications: value }))}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Data & Analytics Section */}
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>{t.dataAnalytics}</Text>
              
              <View style={styles.privacyToggleItem}>
                <View style={styles.privacyItemLeft}>
                  <Database size={20} color="#1A1A1A" strokeWidth={1.5} />
                  <View style={styles.privacyItemText}>
                    <Text style={styles.privacyItemTitle}>{t.dataCollection}</Text>
                    <Text style={styles.privacyItemSubtitle}>{t.helpImproveAppWithUsage}</Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.dataCollection}
                  onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, dataCollection: value }))}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelPrivacySettings}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePrivacySettings}
            >
              <Save size={16} color="#FFFFFF" strokeWidth={1.5} />
              <Text style={styles.saveButtonText}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        isVisible={isLanguageModalVisible}
        onBackdropPress={() => setLanguageModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
           <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.languageList}>
            {[
              { code: 'en' as const, name: 'English', nativeName: 'English' },
              { code: 'de' as const, name: 'German', nativeName: 'Deutsch' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  language === lang.code && styles.languageItemSelected
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    language === lang.code && styles.languageNameSelected
                  ]}>
                    {lang.name}
                  </Text>
                  <Text style={[
                    styles.languageNativeName,
                    language === lang.code && styles.languageNativeNameSelected
                  ]}>
                    {lang.nativeName}
                  </Text>
                </View>
                {language === lang.code && (
                  <Check size={20} color="#007AFF" strokeWidth={2} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.languageNote}>
            <Text style={styles.languageNoteText}>
            {t.appWillRestart}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Add Account Modal */}
      <Modal
        isVisible={isAddAccountModalVisible}
        onBackdropPress={handleCancelAddAccount}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {accountModalMode === 'signin' ? 'Switch Account' : 'Create Account'}
            </Text>
            <TouchableOpacity onPress={handleCancelAddAccount}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {/* Mode Toggle */}
          <View style={styles.accountModeToggle}>
            <TouchableOpacity
              style={[
                styles.accountModeButton,
                accountModalMode === 'signin' && styles.accountModeButtonActive
              ]}
              onPress={() => setAccountModalMode('signin')}
            >
              <Text style={[
                styles.accountModeButtonText,
                accountModalMode === 'signin' && styles.accountModeButtonTextActive
              ]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accountModeButton,
                accountModalMode === 'signup' && styles.accountModeButtonActive
              ]}
              onPress={() => setAccountModalMode('signup')}
            >
              <Text style={[
                styles.accountModeButtonText,
                accountModalMode === 'signup' && styles.accountModeButtonTextActive
              ]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <View style={styles.addAccountInfo}>
              <Text style={styles.addAccountInfoText}>
                {accountModalMode === 'signin' 
                  ? 'Sign in to switch to another account. You can easily switch between accounts in the future.'
                  : 'Create a new account to access another team. You can switch between accounts anytime.'
                }
              </Text>
            </View>

            <View style={styles.formSection}>
              {/* Name Input - Only for Sign Up */}
              {accountModalMode === 'signup' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t.fullName} *</Text>
                  <View style={[styles.addAccountInputContainer, newAccountErrors.name && styles.inputError]}>
                    <User size={20} color="#8E8E93" strokeWidth={1.5} />
                    <TextInput
                      style={styles.addAccountInput}
                      placeholder={t.fullName}
                      value={newAccountData.name}
                      onChangeText={(text) => {
                        setNewAccountData(prev => ({ ...prev, name: text }));
                        if (newAccountErrors.name) setNewAccountErrors(prev => ({ ...prev, name: undefined }));
                      }}
                      autoCapitalize="words"
                      placeholderTextColor="#8E8E93"
                    />
                  </View>
                  {newAccountErrors.name && <Text style={styles.errorText}>{newAccountErrors.name}</Text>}
                </View>
              )}

              {/* Email Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.email} *</Text>
                <View style={[styles.addAccountInputContainer, newAccountErrors.email && styles.inputError]}>
                  <Mail size={20} color="#8E8E93" strokeWidth={1.5} />
                  <TextInput
                    style={styles.addAccountInput}
                    placeholder={t.email}
                    value={newAccountData.email}
                    onChangeText={(text) => {
                      setNewAccountData(prev => ({ ...prev, email: text }));
                      if (newAccountErrors.email) setNewAccountErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                {newAccountErrors.email && <Text style={styles.errorText}>{newAccountErrors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t.password} *</Text>
                <View style={[styles.addAccountInputContainer, newAccountErrors.password && styles.inputError]}>
                  <Lock size={20} color="#8E8E93" strokeWidth={1.5} />
                  <TextInput
                    style={styles.addAccountInput}
                    placeholder={t.password}
                    value={newAccountData.password}
                    onChangeText={(text) => {
                      setNewAccountData(prev => ({ ...prev, password: text }));
                      if (newAccountErrors.password) setNewAccountErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    secureTextEntry={!showNewAccountPassword}
                    placeholderTextColor="#8E8E93"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewAccountPassword(!showNewAccountPassword)}
                  >
                    {showNewAccountPassword ? (
                      <EyeOff size={20} color="#8E8E93" strokeWidth={1.5} />
                    ) : (
                      <Eye size={20} color="#8E8E93" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                </View>
                {newAccountErrors.password && <Text style={styles.errorText}>{newAccountErrors.password}</Text>}
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelAddAccount}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addAccountButton}
              onPress={handleAddAccountModal}
            >
              <Text style={styles.addAccountButtonText}>
                {accountModalMode === 'signin' ? 'Switch Account' : 'Create Account'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
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
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    fontFamily: 'Urbanist-SemiBold',
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginHorizontal: 24,
    minHeight: 48,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  bottomSection: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  bottomSpacing: {
    height: 32,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  modalForm: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modalProfileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 24,
  },
  modalProfileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalProfileInitials: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  editAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  editAvatarText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  formSection: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    backgroundColor: '#FFFFFF',
  },
  readOnlyField: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
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
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  privacySection: {
    marginBottom: 32,
  },
  privacySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  privacyItem: {
    marginBottom: 24,
  },
  privacyToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyItemText: {
    marginLeft: 16,
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 2,
  },
  privacyItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  visibilitySelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
  },
  visibilityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  visibilityOptionActive: {
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
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  visibilityOptionTextActive: {
    color: '#1A1A1A',
  },
  timeoutSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    gap: 4,
  },
  timeoutOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeoutOptionActive: {
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
  timeoutOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  timeoutOptionTextActive: {
    color: '#1A1A1A',
  },
  languageList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  languageItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 4,
  },
  languageNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  languageNativeName: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  languageNativeNameSelected: {
    color: '#007AFF',
  },
  languageNote: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  languageNoteText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  addAccountInfo: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  addAccountInfoText: {
    fontSize: 14,
    color: '#1976D2',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
  addAccountInputContainer: {
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
  addAccountInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  eyeButton: {
    padding: 4,
  },
  addAccountButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    gap: 8,
  },
  addAccountButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  accountModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  accountModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  accountModeButtonActive: {
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
  accountModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  accountModeButtonTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontFamily: 'Urbanist-Regular',
    marginTop: 8,
  },
});