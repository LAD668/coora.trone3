import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'de';

interface Translations {
  // Navigation
  infoHub: string;
  dashboard: string;
  calendar: string;
  players: string;
  liveTicker: string;
  settings: string;
  notifications: string;

  // Common
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  confirm: string;
  success: string;
  error: string;
  yes: string;
  no: string;
  back: string;
  next: string;
  done: string;
  close: string;
  search: string;
  filter: string;
  all: string;
  none: string;
  required: string;
  optional: string;

  // Auth & User
  signIn: string;
  signOut: string;
  signUp: string;
  email: string;
  password: string;
  name: string;
  fullName: string;
  phoneNumber: string;
  position: string;
  role: string;
  profile: string;
  account: string;

  // Dashboard
  welcomeBack: string;
  quickActions: string;
  teamStatistics: string;
  clubStatistics: string;
  teamGoals: string;
  addGoal: string;
  createTeamGoal: string;
  goalTitle: string;
  description: string;
  priority: string;
  deadline: string;
  progress: string;
  tasks: string;
  completed: string;
  high: string;
  medium: string;
  low: string;
  due: string;
  playerOfTheMatch: string;
  voteForTop3Players: string;
  selectRecentMatch: string;
  selectPlayer: string;
  selectAssist: string;
  noAssist: string;
  submitVotes: string;
  votesSubmitted: string;
  firstPlace: string;
  secondPlace: string;
  thirdPlace: string;
  notSelected: string;
  yourVotes: string;

  // Info Hub
  organization: string;
  trainers: string;
  createUpdate: string;
  updateTitle: string;
  postTo: string;
  publishUpdate: string;
  readMore: string;
  reaction: string;
  reactions: string;
  tapToReadMore: string;

  // Live Ticker
  liveMatch: string;
  matchEvents: string;
  startMatch: string;
  endMatch: string;
  resetMatch: string;
  addEvent: string;
  selectEventType: string;
  goalMyTeam: string;
  goalOpponent: string;
  yellowCard: string;
  redCard: string;
  substitution: string;
  myTeam: string;
  opponent: string;
  shareLiveTicker: string;
  postToInfoHub: string;
  shareExternally: string;
  noEventsYet: string;
  accessRestricted: string;
  onlyTrainersAndAdmins: string;
  live: string;
  ended: string;
  paused: string;
  notStarted: string;

  // Settings
  preferences: string;
  app: string;
  privacySecurity: string;
  language: string;
  darkMode: string;
  soundEffects: string;
  appVersion: string;
  helpSupport: string;
  editProfile: string;
  changePhoto: string;
  memberSince: string;
  saveChanges: string;
  profilePrivacy: string;
  profileVisibility: string;
  whoCanSeeProfile: string;
  public: string;
  team: string;
  private: string;
  showEmail: string;
  displayEmailInProfile: string;
  showPhone: string;
  displayPhoneInProfile: string;
  communication: string;
  directMessages: string;
  allowTeamMembersToMessage: string;
  shareStatistics: string;
  includeStatsInReports: string;
  security: string;
  twoFactorAuth: string;
  addExtraSecurityToAccount: string;
  sessionTimeout: string;
  autoLogoutAfterInactivity: string;
  loginNotifications: string;
  getNotifiedOfNewSignIns: string;
  dataAnalytics: string;
  dataCollection: string;
  helpImproveAppWithUsage: string;
  selectLanguage: string;
  appWillRestart: string;
  languageChanged: string;
  languageChangedMessage: string;
  enableTwoFactor: string;
  enableTwoFactorMessage: string;
  enable: string;
  disableTwoFactor: string;
  disableTwoFactorMessage: string;
  disable: string;
  disabled: string;
  enabled: string;

  // Notifications
  upcomingTraining: string;
  newTeamUpdate: string;
  playerAdded: string;
  goalCompleted: string;
  matchReminder: string;
  markAllRead: string;
  unread: string;
  noUnreadNotifications: string;
  allCaughtUp: string;
  noNotifications: string;
  teamUpdatesHere: string;

  // Stats
  goalsScored: string;
  matchesPlayed: string;
  trainingsAttended: string;
  winRate: string;
  teamPlayers: string;
  upcomingEvents: string;

  // Time
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  today: string;
  yesterday: string;
  tomorrow: string;

  // Errors & Messages
  fillAllFields: string;
  validEmailRequired: string;
  profileUpdated: string;
  settingsUpdated: string;
  postCreated: string;
  goalCreated: string;
  matchEnded: string;
  matchReset: string;
  accessDenied: string;
  somethingWentWrong: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    infoHub: 'Info Hub',
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    players: 'Players',
    liveTicker: 'Live Ticker',
    settings: 'Settings',
    notifications: 'Notifications',

    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    none: 'None',
    required: 'Required',
    optional: 'Optional',

    // Auth & User
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    position: 'Position',
    role: 'Role',
    profile: 'Profile',
    account: 'Account',

    // Dashboard
    welcomeBack: 'Welcome back',
    quickActions: 'Quick Actions',
    teamStatistics: 'Team Statistics',
    clubStatistics: 'Club Statistics',
    teamGoals: 'Team Goals',
    addGoal: 'Add Goal',
    createTeamGoal: 'Create Team Goal',
    goalTitle: 'Goal Title',
    description: 'Description',
    priority: 'Priority',
    deadline: 'Deadline',
    progress: 'Progress',
    tasks: 'tasks',
    completed: 'Completed',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    due: 'Due',
    playerOfTheMatch: 'Player of the Match',
    voteForTop3Players: 'Vote for top 3 players from recent matches',
    selectRecentMatch: 'Select a Recent Match',
    selectPlayer: 'Select Player',
    selectAssist: 'Select Assist (Optional)',
    noAssist: 'No Assist',
    submitVotes: 'Submit Votes',
    votesSubmitted: 'Votes Submitted Successfully',
    firstPlace: '1st Place',
    secondPlace: '2nd Place',
    thirdPlace: '3rd Place',
    notSelected: 'Not selected',
    yourVotes: 'Your Votes',

    // Info Hub
    organization: 'Organization',
    trainers: 'Trainers',
    createUpdate: 'Create Update',
    updateTitle: 'Update title',
    postTo: 'Post to:',
    publishUpdate: 'Publish Update',
    readMore: 'Read more',
    reaction: 'reaction',
    reactions: 'reactions',
    tapToReadMore: 'Tap to read more...',

    // Live Ticker
    liveMatch: 'LIVE MATCH TICKER',
    matchEvents: 'Match Events',
    startMatch: 'Start Match',
    endMatch: 'End Match',
    resetMatch: 'Reset Match',
    addEvent: 'Add Event',
    selectEventType: 'Select Event Type',
    goalMyTeam: 'Goal - My Team',
    goalOpponent: 'Goal - Opponent',
    yellowCard: 'Yellow Card',
    redCard: 'Red Card',
    substitution: 'Substitution',
    myTeam: 'My Team',
    opponent: 'Opponent',
    shareLiveTicker: 'Share Live Ticker',
    postToInfoHub: 'Post to Info Hub',
    shareExternally: 'Share Externally',
    noEventsYet: 'No events yet',
    accessRestricted: 'Access Restricted',
    onlyTrainersAndAdmins: 'Only trainers and admins can manage live match tickers.',
    live: 'LIVE',
    ended: 'ENDED',
    paused: 'PAUSED',
    notStarted: 'NOT STARTED',

    // Settings
    preferences: 'Preferences',
    app: 'App',
    privacySecurity: 'Privacy & Security',
    language: 'Language',
    darkMode: 'Dark Mode',
    soundEffects: 'Sound Effects',
    appVersion: 'App Version',
    helpSupport: 'Help & Support',
    editProfile: 'Edit Profile',
    changePhoto: 'Change Photo',
    memberSince: 'Member Since',
    saveChanges: 'Save Changes',
    profilePrivacy: 'Profile Privacy',
    profileVisibility: 'Profile Visibility',
    whoCanSeeProfile: 'Who can see your profile',
    public: 'Public',
    team: 'Team',
    private: 'Private',
    showEmail: 'Show Email',
    displayEmailInProfile: 'Display email in your profile',
    showPhone: 'Show Phone',
    displayPhoneInProfile: 'Display phone number in your profile',
    communication: 'Communication',
    directMessages: 'Direct Messages',
    allowTeamMembersToMessage: 'Allow team members to message you',
    shareStatistics: 'Share Statistics',
    includeStatsInReports: 'Include your stats in team reports',
    security: 'Security',
    twoFactorAuth: 'Two-Factor Authentication',
    addExtraSecurityToAccount: 'Add extra security to your account',
    sessionTimeout: 'Session Timeout',
    autoLogoutAfterInactivity: 'Auto-logout after inactivity',
    loginNotifications: 'Login Notifications',
    getNotifiedOfNewSignIns: 'Get notified of new sign-ins',
    dataAnalytics: 'Data & Analytics',
    dataCollection: 'Data Collection',
    helpImproveAppWithUsage: 'Help improve the app with usage data',
    selectLanguage: 'Select Language',
    appWillRestart: 'The app will restart to apply the new language settings.',
    languageChanged: 'Language Changed',
    languageChangedMessage: 'Language has been changed to {language}. The app will restart to apply changes.',
    enableTwoFactor: 'Enable Two-Factor Authentication',
    enableTwoFactorMessage: 'This will add an extra layer of security to your account. You\'ll need to verify your identity with a second factor when signing in.',
    enable: 'Enable',
    disableTwoFactor: 'Disable Two-Factor Authentication',
    disableTwoFactorMessage: 'This will remove the extra security layer from your account. Are you sure?',
    disable: 'Disable',
    disabled: 'Disabled',
    enabled: 'Enabled',

    // Notifications
    upcomingTraining: 'Upcoming Training',
    newTeamUpdate: 'New Team Update',
    playerAdded: 'Player Added',
    goalCompleted: 'Goal Completed!',
    matchReminder: 'Match Reminder',
    markAllRead: 'Mark All Read',
    unread: 'Unread',
    noUnreadNotifications: 'No unread notifications',
    allCaughtUp: 'All caught up! Check back later for new updates.',
    noNotifications: 'No notifications',
    teamUpdatesHere: 'You\'ll see team updates, events, and messages here.',

    // Stats
    goalsScored: 'Goals Scored',
    matchesPlayed: 'Matches Played',
    trainingsAttended: 'Trainings Done',
    winRate: 'Win Rate',
    teamPlayers: 'Team Players',
    upcomingEvents: 'Upcoming Events',

    // Time
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',

    // Errors & Messages
    fillAllFields: 'Please fill in all required fields',
    validEmailRequired: 'Please enter a valid email address',
    profileUpdated: 'Profile updated successfully!',
    settingsUpdated: 'Settings updated successfully!',
    postCreated: 'Post created successfully!',
    goalCreated: 'Team goal created successfully!',
    matchEnded: 'Match ended successfully!',
    matchReset: 'Match has been reset!',
    accessDenied: 'Access denied',
    somethingWentWrong: 'Something went wrong',
  },
  de: {
    // Navigation
    infoHub: 'Info-Hub',
    dashboard: 'Dashboard',
    calendar: 'Kalender',
    players: 'Spieler',
    liveTicker: 'Live-Ticker',
    settings: 'Einstellungen',
    notifications: 'Benachrichtigungen',

    // Common
    loading: 'Lädt...',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    confirm: 'Bestätigen',
    success: 'Erfolgreich',
    error: 'Fehler',
    yes: 'Ja',
    no: 'Nein',
    back: 'Zurück',
    next: 'Weiter',
    done: 'Fertig',
    close: 'Schließen',
    search: 'Suchen',
    filter: 'Filter',
    all: 'Alle',
    none: 'Keine',
    required: 'Erforderlich',
    optional: 'Optional',

    // Auth & User
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    signUp: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Name',
    fullName: 'Vollständiger Name',
    phoneNumber: 'Telefonnummer',
    position: 'Position',
    role: 'Rolle',
    profile: 'Profil',
    account: 'Konto',

    // Dashboard
    welcomeBack: 'Willkommen zurück',
    quickActions: 'Schnellaktionen',
    teamStatistics: 'Team-Statistiken',
    clubStatistics: 'Vereins-Statistiken',
    teamGoals: 'Team-Ziele',
    addGoal: 'Ziel hinzufügen',
    createTeamGoal: 'Team-Ziel erstellen',
    goalTitle: 'Ziel-Titel',
    description: 'Beschreibung',
    priority: 'Priorität',
    deadline: 'Frist',
    progress: 'Fortschritt',
    tasks: 'Aufgaben',
    completed: 'Abgeschlossen',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    due: 'Fällig',
    playerOfTheMatch: 'Spieler des Spiels',
    voteForTop3Players: 'Stimme für die Top 3 Spieler aus den letzten Spielen ab',
    selectRecentMatch: 'Wähle ein aktuelles Spiel',
    selectPlayer: 'Spieler auswählen',
    selectAssist: 'Vorlage auswählen (Optional)',
    noAssist: 'Keine Vorlage',
    submitVotes: 'Stimmen abgeben',
    votesSubmitted: 'Stimmen erfolgreich abgegeben',
    firstPlace: '1. Platz',
    secondPlace: '2. Platz',
    thirdPlace: '3. Platz',
    notSelected: 'Nicht ausgewählt',
    yourVotes: 'Deine Stimmen',

    // Info Hub
    organization: 'Organisation',
    trainers: 'Trainer',
    createUpdate: 'Update erstellen',
    updateTitle: 'Update-Titel',
    postTo: 'Posten an:',
    publishUpdate: 'Update veröffentlichen',
    readMore: 'Mehr lesen',
    reaction: 'Reaktion',
    reactions: 'Reaktionen',
    tapToReadMore: 'Tippen zum Weiterlesen...',

    // Live Ticker
    liveMatch: 'LIVE SPIEL TICKER',
    matchEvents: 'Spiel-Ereignisse',
    startMatch: 'Spiel starten',
    endMatch: 'Spiel beenden',
    resetMatch: 'Spiel zurücksetzen',
    addEvent: 'Ereignis hinzufügen',
    selectEventType: 'Ereignis-Typ auswählen',
    goalMyTeam: 'Tor - Mein Team',
    goalOpponent: 'Tor - Gegner',
    yellowCard: 'Gelbe Karte',
    redCard: 'Rote Karte',
    substitution: 'Auswechslung',
    myTeam: 'Mein Team',
    opponent: 'Gegner',
    shareLiveTicker: 'Live-Ticker teilen',
    postToInfoHub: 'Im Info-Hub posten',
    shareExternally: 'Extern teilen',
    noEventsYet: 'Noch keine Ereignisse',
    accessRestricted: 'Zugriff beschränkt',
    onlyTrainersAndAdmins: 'Nur Trainer und Administratoren können Live-Match-Ticker verwalten.',
    live: 'LIVE',
    ended: 'BEENDET',
    paused: 'PAUSIERT',
    notStarted: 'NICHT GESTARTET',

    // Settings
    preferences: 'Einstellungen',
    app: 'App',
    privacySecurity: 'Datenschutz & Sicherheit',
    language: 'Sprache',
    darkMode: 'Dunkler Modus',
    soundEffects: 'Soundeffekte',
    appVersion: 'App-Version',
    helpSupport: 'Hilfe & Support',
    editProfile: 'Profil bearbeiten',
    changePhoto: 'Foto ändern',
    memberSince: 'Mitglied seit',
    saveChanges: 'Änderungen speichern',
    profilePrivacy: 'Profil-Datenschutz',
    profileVisibility: 'Profil-Sichtbarkeit',
    whoCanSeeProfile: 'Wer kann dein Profil sehen',
    public: 'Öffentlich',
    team: 'Team',
    private: 'Privat',
    showEmail: 'E-Mail anzeigen',
    displayEmailInProfile: 'E-Mail in deinem Profil anzeigen',
    showPhone: 'Telefon anzeigen',
    displayPhoneInProfile: 'Telefonnummer in deinem Profil anzeigen',
    communication: 'Kommunikation',
    directMessages: 'Direktnachrichten',
    allowTeamMembersToMessage: 'Erlaube Teammitgliedern dir zu schreiben',
    shareStatistics: 'Statistiken teilen',
    includeStatsInReports: 'Deine Statistiken in Team-Berichte einbeziehen',
    security: 'Sicherheit',
    twoFactorAuth: 'Zwei-Faktor-Authentifizierung',
    addExtraSecurityToAccount: 'Zusätzliche Sicherheit für dein Konto hinzufügen',
    sessionTimeout: 'Sitzungs-Timeout',
    autoLogoutAfterInactivity: 'Automatische Abmeldung nach Inaktivität',
    loginNotifications: 'Anmelde-Benachrichtigungen',
    getNotifiedOfNewSignIns: 'Benachrichtigung bei neuen Anmeldungen erhalten',
    dataAnalytics: 'Daten & Analysen',
    dataCollection: 'Datensammlung',
    helpImproveAppWithUsage: 'Hilf dabei, die App mit Nutzungsdaten zu verbessern',
    selectLanguage: 'Sprache auswählen',
    appWillRestart: 'Die App wird neu gestartet, um die neuen Spracheinstellungen anzuwenden.',
    languageChanged: 'Sprache geändert',
    languageChangedMessage: 'Die Sprache wurde auf {language} geändert. Die App wird neu gestartet, um die Änderungen anzuwenden.',
    enableTwoFactor: 'Zwei-Faktor-Authentifizierung aktivieren',
    enableTwoFactorMessage: 'Dies fügt eine zusätzliche Sicherheitsebene zu deinem Konto hinzu. Du musst deine Identität mit einem zweiten Faktor bestätigen, wenn du dich anmeldest.',
    enable: 'Aktivieren',
    disableTwoFactor: 'Zwei-Faktor-Authentifizierung deaktivieren',
    disableTwoFactorMessage: 'Dies entfernt die zusätzliche Sicherheitsebene von deinem Konto. Bist du sicher?',
    disable: 'Deaktivieren',
    disabled: 'Deaktiviert',
    enabled: 'Aktiviert',

    // Notifications
    upcomingTraining: 'Anstehendes Training',
    newTeamUpdate: 'Neues Team-Update',
    playerAdded: 'Spieler hinzugefügt',
    goalCompleted: 'Ziel erreicht!',
    matchReminder: 'Spiel-Erinnerung',
    markAllRead: 'Alle als gelesen markieren',
    unread: 'Ungelesen',
    noUnreadNotifications: 'Keine ungelesenen Benachrichtigungen',
    allCaughtUp: 'Alles erledigt! Schau später wieder vorbei für neue Updates.',
    noNotifications: 'Keine Benachrichtigungen',
    teamUpdatesHere: 'Hier siehst du Team-Updates, Ereignisse und Nachrichten.',

    // Stats
    goalsScored: 'Erzielte Tore',
    matchesPlayed: 'Gespielte Spiele',
    trainingsAttended: 'Trainings absolviert',
    winRate: 'Gewinnrate',
    teamPlayers: 'Team-Spieler',
    upcomingEvents: 'Anstehende Ereignisse',

    // Time
    minutesAgo: 'Min. her',
    hoursAgo: 'Std. her',
    daysAgo: 'T. her',
    today: 'Heute',
    yesterday: 'Gestern',
    tomorrow: 'Morgen',

    // Errors & Messages
    fillAllFields: 'Bitte fülle alle erforderlichen Felder aus',
    validEmailRequired: 'Bitte gib eine gültige E-Mail-Adresse ein',
    profileUpdated: 'Profil erfolgreich aktualisiert!',
    settingsUpdated: 'Einstellungen erfolgreich aktualisiert!',
    postCreated: 'Beitrag erfolgreich erstellt!',
    goalCreated: 'Team-Ziel erfolgreich erstellt!',
    matchEnded: 'Spiel erfolgreich beendet!',
    matchReset: 'Spiel wurde zurückgesetzt!',
    accessDenied: 'Zugriff verweigert',
    somethingWentWrong: 'Etwas ist schief gelaufen',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language on app start
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}