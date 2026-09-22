import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const STORAGE_KEY = '@link_mvp_v1';
const ACCENT = '#6C5CE7';

const light = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  text: '#111318',
  sub: '#6F7582',
  border: '#E8EAF0',
  soft: '#F0F1F6',
  input: '#F2F3F7',
  tab: 'rgba(255,255,255,0.96)',
  inverse: '#111318',
  inverseText: '#FFFFFF',
  danger: '#E5484D',
  success: '#1F9D66',
};

const dark = {
  bg: '#0B0C0F',
  card: '#13151A',
  elevated: '#181A20',
  text: '#F6F7FA',
  sub: '#9EA3AF',
  border: '#252832',
  soft: '#1A1D23',
  input: '#1B1E25',
  tab: 'rgba(16,17,21,0.96)',
  inverse: '#F6F7FA',
  inverseText: '#111318',
  danger: '#FF6B6B',
  success: '#47C98A',
};

const demoPeople = [
  {
    id: 'demo_nela',
    name: 'Nela K.',
    username: '@nelak',
    bio: 'music • nights • prague',
    metAt: 'Today, 10:42',
    metWhere: 'Coffee spot',
    status: 'Online',
    initials: 'NK',
  },
  {
    id: 'demo_david',
    name: 'David M.',
    username: '@davidm',
    bio: 'design / streetwear',
    metAt: 'Yesterday',
    metWhere: 'LINK demo',
    status: '2m ago',
    initials: 'DM',
  },
];

const seedMessages = {
  demo_nela: [
    { id: 'm1', from: 'them', text: 'yo, nice meeting u 👋', time: '10:44' },
    { id: 'm2', from: 'me', text: 'same haha, LINK actually worked 😭', time: '10:45' },
  ],
  demo_david: [{ id: 'm3', from: 'them', text: 'send me that brand name later', time: '22:14' }],
};

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const initialsFor = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('') || 'L';

function IconButton({ icon, onPress, theme, filled = false, size = 21 }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: filled ? theme.inverse : theme.soft, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Ionicons name={icon} size={size} color={filled ? theme.inverseText : theme.text} />
    </Pressable>
  );
}

function Avatar({ person, size = 48, theme, accent = ACCENT }) {
  const initials = person?.initials || initialsFor(person?.name);
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: person?.id === 'me' ? accent : theme.soft,
        },
      ]}
    >
      <Text style={{ color: person?.id === 'me' ? '#fff' : theme.text, fontWeight: '800', fontSize: size * 0.32 }}>
        {initials}
      </Text>
    </View>
  );
}

function Pill({ children, theme, tone = 'soft' }) {
  const bg = tone === 'accent' ? ACCENT : theme.soft;
  const color = tone === 'accent' ? '#fff' : theme.sub;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  );
}

function SectionTitle({ children, theme, action, onAction }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={{ color: ACCENT, fontWeight: '700' }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PersonRow({ person, theme, onPress, onChat }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.personRow,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Avatar person={person} size={50} theme={theme} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowBetween}>
          <Text numberOfLines={1} style={[styles.personName, { color: theme.text }]}>
            {person.name}
          </Text>
          <Text style={[styles.metaText, { color: theme.sub }]}>{person.metAt}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.personSub, { color: theme.sub }]}>
          {person.username} · {person.metWhere}
        </Text>
      </View>
      <Pressable
        onPress={(e) => {
          e?.stopPropagation?.();
          onChat?.();
        }}
        style={[styles.miniChatButton, { backgroundColor: theme.soft }]}
      >
        <Ionicons name="chatbubble-ellipses" size={18} color={theme.text} />
      </Pressable>
    </Pressable>
  );
}

function HomeScreen({ theme, profile, people, messages, openOwnCard, openScanner, openChat, setTab }) {
  const recent = people.slice(0, 3);
  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.sub }]}>GOOD TO SEE YOU</Text>
          <Text style={[styles.bigTitle, { color: theme.text }]}>{profile.name || 'Your LINK'}</Text>
        </View>
        <Avatar person={{ ...profile, id: 'me' }} size={46} theme={theme} />
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.rowBetween}>
          <Pill theme={theme} tone="accent">YOUR LINK</Pill>
          <Ionicons name="sparkles" size={19} color={ACCENT} />
        </View>
        <Text style={[styles.heroHeadline, { color: theme.text }]}>Meet IRL.{`\n`}Stay connected.</Text>
        <Text style={[styles.heroBody, { color: theme.sub }]}>Share your LINK Card, scan theirs and keep the conversation going.</Text>
        <View style={styles.heroActions}>
          <Pressable onPress={openOwnCard} style={[styles.primaryButton, { backgroundColor: theme.inverse }]}>
            <Ionicons name="qr-code" size={19} color={theme.inverseText} />
            <Text style={[styles.primaryButtonText, { color: theme.inverseText }]}>Show my LINK</Text>
          </Pressable>
          <Pressable onPress={openScanner} style={[styles.secondaryButton, { backgroundColor: theme.soft }]}>
            <Ionicons name="scan" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{people.length}</Text>
          <Text style={[styles.statLabel, { color: theme.sub }]}>People linked</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{Object.keys(messages).length}</Text>
          <Text style={[styles.statLabel, { color: theme.sub }]}>Conversations</Text>
        </View>
      </View>

      <SectionTitle theme={theme} action="See all" onAction={() => setTab('people')}>
        Recently linked
      </SectionTitle>

      {recent.map((person) => (
        <PersonRow key={person.id} person={person} theme={theme} onPress={() => openChat(person)} onChat={() => openChat(person)} />
      ))}

      <View style={[styles.eventCard, { backgroundColor: theme.inverse }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: theme.inverseText, opacity: 0.65 }]}>COMING NEXT</Text>
          <Text style={[styles.eventTitle, { color: theme.inverseText }]}>Event Mode</Text>
          <Text style={[styles.eventBody, { color: theme.inverseText, opacity: 0.68 }]}>Keep everyone you meet at one event grouped together automatically.</Text>
        </View>
        <View style={[styles.eventIcon, { backgroundColor: theme.inverseText }]}>
          <Ionicons name="ticket-outline" size={23} color={theme.inverse} />
        </View>
      </View>
    </ScrollView>
  );
}

function PeopleScreen({ theme, people, openChat }) {
  const [query, setQuery] = useState('');
  const filtered = people.filter((p) => `${p.name} ${p.username} ${p.metWhere}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <View style={styles.flexOne}>
      <View style={styles.simpleHeader}>
        <Text style={[styles.bigTitle, { color: theme.text }]}>People</Text>
        <Text style={[styles.headerSub, { color: theme.sub }]}>{people.length} people you’ve linked with</Text>
      </View>
      <View style={[styles.searchBox, { backgroundColor: theme.input }]}> 
        <Ionicons name="search" size={19} color={theme.sub} />
        <TextInput
          placeholder="Search people"
          placeholderTextColor={theme.sub}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PersonRow person={item} theme={theme} onPress={() => openChat(item)} onChat={() => openChat(item)} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={38} color={theme.sub} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No one here yet</Text>
            <Text style={[styles.emptyBody, { color: theme.sub }]}>Scan someone’s LINK Card to add them.</Text>
          </View>
        }
      />
    </View>
  );
}

function LinkScreen({ theme, profile, payload, openScanner, addDemoLink }) {
  return (
    <ScrollView contentContainerStyle={[styles.screenScroll, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.bigTitle, { color: theme.text, alignSelf: 'flex-start' }]}>LINK</Text>
      <Text style={[styles.headerSub, { color: theme.sub, alignSelf: 'flex-start', marginBottom: 22 }]}>Share your card or scan someone nearby.</Text>

      <View style={[styles.linkCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.linkCardTop}>
          <View>
            <Text style={[styles.linkBrand, { color: theme.text }]}>LINK*</Text>
            <Text style={[styles.cardHint, { color: theme.sub }]}>tap · scan · connect</Text>
          </View>
          <Avatar person={{ ...profile, id: 'me' }} size={54} theme={theme} />
        </View>
        <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}>
          <QRCode value={payload} size={180} color="#0E0F12" backgroundColor="#FFFFFF" />
        </View>
        <Text style={[styles.linkName, { color: theme.text }]}>{profile.name}</Text>
        <Text style={[styles.linkUsername, { color: theme.sub }]}>{profile.username}</Text>
        <View style={styles.linkCardPills}>
          <Pill theme={theme}>Chat ready</Pill>
          <Pill theme={theme}>Private</Pill>
        </View>
      </View>

      <Pressable onPress={openScanner} style={[styles.widePrimary, { backgroundColor: theme.inverse }]}>
        <Ionicons name="scan" size={20} color={theme.inverseText} />
        <Text style={[styles.primaryButtonText, { color: theme.inverseText }]}>Scan a LINK</Text>
      </Pressable>

      <Pressable onPress={addDemoLink} style={[styles.wideSecondary, { backgroundColor: theme.soft }]}>
        <Ionicons name="flash-outline" size={20} color={theme.text} />
        <Text style={[styles.primaryButtonText, { color: theme.text }]}>Demo: link someone nearby</Text>
      </Pressable>

      <Text style={[styles.privacyNote, { color: theme.sub }]}>Only the details shown on your LINK Card are shared. A chat is created only after a successful link.</Text>
    </ScrollView>
  );
}

function ChatsScreen({ theme, people, messages, openChat }) {
  const rows = people
    .map((person) => {
      const convo = messages[person.id] || [];
      return { person, last: convo[convo.length - 1] };
    })
    .filter((x) => x.last)
    .reverse();

  return (
    <View style={styles.flexOne}>
      <View style={styles.simpleHeader}>
        <Text style={[styles.bigTitle, { color: theme.text }]}>Chats</Text>
        <Text style={[styles.headerSub, { color: theme.sub }]}>People you met, one tap away.</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.person.id}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openChat(item.person)}
            style={({ pressed }) => [styles.chatRow, { borderBottomColor: theme.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <Avatar person={item.person} size={52} theme={theme} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.personName, { color: theme.text }]}>{item.person.name}</Text>
                <Text style={[styles.metaText, { color: theme.sub }]}>{item.last.time}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.chatPreview, { color: theme.sub }]}>
                {item.last.from === 'me' ? 'You: ' : ''}{item.last.text}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={theme.sub} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No chats yet</Text>
            <Text style={[styles.emptyBody, { color: theme.sub }]}>Link with someone and your conversation will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

function ThemeOption({ mode, active, label, icon, onPress, theme }) {
  return (
    <Pressable onPress={() => onPress(mode)} style={[styles.themeOption, { backgroundColor: active ? theme.inverse : theme.soft }]}> 
      <Ionicons name={icon} size={18} color={active ? theme.inverseText : theme.text} />
      <Text style={{ color: active ? theme.inverseText : theme.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function ProfileScreen({ theme, profile, setProfile, themeSetting, setThemeSetting, resetDemo }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  useEffect(() => setDraft(profile), [profile]);

  const save = () => {
    if (!draft.name.trim()) return Alert.alert('Name required', 'Add a display name before saving.');
    const username = draft.username.trim().startsWith('@') ? draft.username.trim() : `@${draft.username.trim()}`;
    setProfile({ ...draft, username });
    setEditing(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.bigTitle, { color: theme.text }]}>Profile</Text>
          <Text style={[styles.headerSub, { color: theme.sub }]}>Your public LINK Card</Text>
        </View>
        <IconButton icon={editing ? 'checkmark' : 'create-outline'} onPress={editing ? save : () => setEditing(true)} theme={theme} filled={editing} />
      </View>

      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Avatar person={{ ...profile, id: 'me' }} size={76} theme={theme} />
        {editing ? (
          <View style={{ width: '100%', marginTop: 18, gap: 10 }}>
            <TextInput
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              placeholder="Display name"
              placeholderTextColor={theme.sub}
              style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]}
            />
            <TextInput
              value={draft.username}
              onChangeText={(username) => setDraft({ ...draft, username })}
              autoCapitalize="none"
              placeholder="@username"
              placeholderTextColor={theme.sub}
              style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]}
            />
            <TextInput
              value={draft.bio}
              onChangeText={(bio) => setDraft({ ...draft, bio })}
              placeholder="Short bio"
              placeholderTextColor={theme.sub}
              style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]}
            />
          </View>
        ) : (
          <>
            <Text style={[styles.profileName, { color: theme.text }]}>{profile.name}</Text>
            <Text style={[styles.profileUser, { color: theme.sub }]}>{profile.username}</Text>
            <Text style={[styles.profileBio, { color: theme.sub }]}>{profile.bio}</Text>
          </>
        )}
      </View>

      <SectionTitle theme={theme}>Appearance</SectionTitle>
      <View style={styles.themeRow}>
        <ThemeOption mode="system" active={themeSetting === 'system'} label="System" icon="phone-portrait-outline" onPress={setThemeSetting} theme={theme} />
        <ThemeOption mode="light" active={themeSetting === 'light'} label="Light" icon="sunny-outline" onPress={setThemeSetting} theme={theme} />
        <ThemeOption mode="dark" active={themeSetting === 'dark'} label="Dark" icon="moon-outline" onPress={setThemeSetting} theme={theme} />
      </View>
      <Text style={[styles.settingHint, { color: theme.sub }]}>LINK starts in Light mode. Choose System to follow your phone automatically.</Text>

      <SectionTitle theme={theme}>Privacy</SectionTitle>
      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <SettingsRow theme={theme} icon="shield-checkmark-outline" title="Mutual linking" subtitle="Chats start only after a successful LINK" />
        <SettingsRow theme={theme} icon="eye-off-outline" title="Minimal sharing" subtitle="Your QR shares only card details" />
        <SettingsRow theme={theme} icon="ban-outline" title="Block & report" subtitle="Safety controls ready for the backend phase" last />
      </View>

      <Pressable onPress={resetDemo} style={[styles.resetButton, { borderColor: theme.border }]}> 
        <Ionicons name="refresh" size={18} color={theme.danger} />
        <Text style={{ color: theme.danger, fontWeight: '700' }}>Reset local demo data</Text>
      </Pressable>
    </ScrollView>
  );
}

function SettingsRow({ theme, icon, title, subtitle, last = false }) {
  return (
    <View style={[styles.settingsRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}> 
      <View style={[styles.settingsIcon, { backgroundColor: theme.soft }]}> 
        <Ionicons name={icon} size={18} color={theme.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingsSub, { color: theme.sub }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ChatScreen({ theme, person, messages, onBack, onSend }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const send = () => {
    const clean = text.trim();
    if (!clean) return;
    onSend(person.id, clean);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView style={[styles.flexOne, { backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <SafeAreaView style={styles.flexOne}>
        <View style={[styles.chatHeader, { borderBottomColor: theme.border }]}> 
          <IconButton icon="chevron-back" onPress={onBack} theme={theme} />
          <View style={styles.chatHeaderPerson}>
            <Avatar person={person} size={38} theme={theme} />
            <View>
              <Text style={[styles.chatHeaderName, { color: theme.text }]}>{person.name}</Text>
              <Text style={[styles.chatHeaderStatus, { color: theme.success }]}>{person.status || 'Linked'}</Text>
            </View>
          </View>
          <IconButton icon="ellipsis-horizontal" onPress={() => Alert.alert(person.name, `Met: ${person.metAt}\nAt: ${person.metWhere}`)} theme={theme} />
        </View>

        <View style={[styles.metContext, { backgroundColor: theme.soft }]}> 
          <Ionicons name="link" size={14} color={theme.sub} />
          <Text style={[styles.metContextText, { color: theme.sub }]}>You linked {person.metAt} · {person.metWhere}</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.from === 'me';
            return (
              <View style={[styles.messageLine, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}> 
                <View style={[styles.bubble, mine ? { backgroundColor: ACCENT } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}> 
                  <Text style={[styles.bubbleText, { color: mine ? '#fff' : theme.text }]}>{item.text}</Text>
                  <Text style={[styles.bubbleTime, { color: mine ? 'rgba(255,255,255,0.68)' : theme.sub }]}>{item.time}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="sparkles-outline" size={30} color={ACCENT} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>New LINK</Text>
              <Text style={[styles.emptyBody, { color: theme.sub }]}>Say hi to {person.name.split(' ')[0]}.</Text>
            </View>
          }
        />

        <View style={[styles.composerWrap, { borderTopColor: theme.border, backgroundColor: theme.bg }]}> 
          <Pressable style={[styles.plusButton, { backgroundColor: theme.soft }]} onPress={() => Alert.alert('Coming next', 'Photos, Moments, voice notes and location sharing are planned for the next build.')}> 
            <Ionicons name="add" size={24} color={theme.text} />
          </Pressable>
          <View style={[styles.composer, { backgroundColor: theme.input }]}> 
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={`Message ${person.name.split(' ')[0]}`}
              placeholderTextColor={theme.sub}
              style={[styles.composerInput, { color: theme.text }]}
              multiline
              maxLength={1000}
            />
            <Pressable onPress={send} style={[styles.sendButton, { backgroundColor: text.trim() ? ACCENT : theme.soft }]}>
              <Ionicons name="arrow-up" size={19} color={text.trim() ? '#fff' : theme.sub} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ScannerModal({ visible, onClose, onScanned, theme }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (visible) setLocked(false);
  }, [visible]);

  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [visible, permission]);

  const handle = ({ data }) => {
    if (locked) return;
    setLocked(true);
    onScanned(data);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.scannerPage, { backgroundColor: '#08090C' }]}> 
        <SafeAreaView style={styles.flexOne}>
          <View style={styles.scannerHeader}>
            <View>
              <Text style={styles.scannerTitle}>Scan LINK</Text>
              <Text style={styles.scannerSub}>Point your camera at their card.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.scannerClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.cameraShell}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={locked ? undefined : handle}
              />
            ) : (
              <View style={styles.permissionState}>
                <Ionicons name="camera-outline" size={42} color="#fff" />
                <Text style={styles.permissionTitle}>Camera access needed</Text>
                <Text style={styles.permissionBody}>LINK uses the camera only to scan QR cards.</Text>
                <Pressable onPress={requestPermission} style={styles.permissionButton}>
                  <Text style={{ color: '#111318', fontWeight: '800' }}>Allow camera</Text>
                </Pressable>
              </View>
            )}
            <View pointerEvents="none" style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          <Text style={styles.scannerFoot}>Only LINK QR cards are accepted.</Text>
          {locked ? (
            <Pressable onPress={() => setLocked(false)} style={styles.scanAgainButton}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Scan again</Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function OwnCardModal({ visible, onClose, theme, profile, payload }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.ownCardModal, { backgroundColor: theme.card }]}> 
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.linkBrand, { color: theme.text }]}>LINK*</Text>
              <Text style={[styles.cardHint, { color: theme.sub }]}>scan to connect</Text>
            </View>
            <IconButton icon="close" onPress={onClose} theme={theme} />
          </View>
          <View style={[styles.qrWrapLarge, { backgroundColor: '#fff' }]}> 
            <QRCode value={payload} size={220} color="#0E0F12" backgroundColor="#FFFFFF" />
          </View>
          <Text style={[styles.modalCardName, { color: theme.text }]}>{profile.name}</Text>
          <Text style={[styles.modalCardUser, { color: theme.sub }]}>{profile.username}</Text>
          <Text style={[styles.modalCardHint, { color: theme.sub }]}>After scanning, both people can continue in chat.</Text>
        </View>
      </View>
    </Modal>
  );
}

function TabBar({ tab, setTab, theme }) {
  const items = [
    ['home', 'home-outline', 'home'],
    ['people', 'people-outline', 'people'],
    ['link', 'add', 'link'],
    ['chats', 'chatbubble-ellipses-outline', 'chats'],
    ['profile', 'person-outline', 'profile'],
  ];
  return (
    <View style={[styles.tabBar, { backgroundColor: theme.tab, borderTopColor: theme.border }]}> 
      {items.map(([key, icon]) => {
        const active = tab === key;
        const center = key === 'link';
        return (
          <Pressable key={key} onPress={() => setTab(key)} style={styles.tabItem}>
            <View
              style={center ? [styles.centerTab, { backgroundColor: active ? ACCENT : theme.inverse }] : null}
            >
              <Ionicons
                name={active && !center ? icon.replace('-outline', '') : icon}
                size={center ? 26 : 23}
                color={center ? '#fff' : active ? theme.text : theme.sub}
              />
            </View>
            {!center ? <View style={[styles.tabDot, { backgroundColor: active ? ACCENT : 'transparent' }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const systemScheme = useColorScheme();
  const [hydrated, setHydrated] = useState(false);
  const [themeSetting, setThemeSetting] = useState('light');
  const [tab, setTab] = useState('home');
  const [profile, setProfile] = useState({
    id: `u_${Math.random().toString(36).slice(2, 10)}`,
    name: 'Your Name',
    username: '@yourlink',
    bio: 'tap • link • talk',
  });
  const [people, setPeople] = useState(demoPeople);
  const [messages, setMessages] = useState(seedMessages);
  const [activeChat, setActiveChat] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const activeMode = themeSetting === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeSetting;
  const theme = activeMode === 'dark' ? dark : light;

  const payload = useMemo(() => {
    const publicProfile = {
      v: 1,
      id: profile.id,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
    };
    return `LINK::${encodeURIComponent(JSON.stringify(publicProfile))}`;
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.profile) setProfile(saved.profile);
          if (Array.isArray(saved.people)) setPeople(saved.people);
          if (saved.messages) setMessages(saved.messages);
          if (['light', 'dark', 'system'].includes(saved.themeSetting)) setThemeSetting(saved.themeSetting);
        }
      } catch (e) {
        console.warn('LINK storage load failed', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, people, messages, themeSetting })).catch(() => {});
  }, [hydrated, profile, people, messages, themeSetting]);

  const addLinkedPerson = (incoming, source = 'QR LINK') => {
    if (!incoming?.id || !incoming?.name) {
      Alert.alert('Not a LINK card', 'This QR code does not contain a valid LINK profile.');
      return;
    }
    if (incoming.id === profile.id) {
      Alert.alert('That’s you', 'Scan someone else’s LINK Card to connect.');
      return;
    }
    const existing = people.find((p) => p.id === incoming.id);
    if (existing) {
      setScannerOpen(false);
      setActiveChat(existing);
      return;
    }
    const person = {
      id: incoming.id,
      name: incoming.name,
      username: incoming.username || '@linkuser',
      bio: incoming.bio || '',
      initials: initialsFor(incoming.name),
      metAt: `Today, ${formatTime()}`,
      metWhere: source,
      status: 'Linked now',
    };
    setPeople((prev) => [person, ...prev]);
    setMessages((prev) => ({ ...prev, [person.id]: [] }));
    setScannerOpen(false);
    setActiveChat(person);
  };

  const onScanned = (data) => {
    try {
      if (!String(data).startsWith('LINK::')) throw new Error('wrong format');
      const decoded = decodeURIComponent(String(data).slice(6));
      const incoming = JSON.parse(decoded);
      addLinkedPerson(incoming, 'QR LINK');
    } catch (e) {
      Alert.alert('Not a LINK card', 'Try scanning a QR generated inside LINK.');
    }
  };

  const addDemoLink = () => {
    const id = `demo_${Date.now()}`;
    const firstNames = ['Sofie R.', 'Alex V.', 'Tereza N.', 'Matyáš K.'];
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    addLinkedPerson(
      {
        id,
        name,
        username: `@${name.toLowerCase().replace(/[^a-zá-ž]/gi, '').slice(0, 9)}`,
        bio: 'new link • nearby',
      },
      'Nearby demo'
    );
  };

  const sendMessage = (personId, text) => {
    const msg = { id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, from: 'me', text, time: formatTime() };
    setMessages((prev) => ({ ...prev, [personId]: [...(prev[personId] || []), msg] }));
  };

  const resetDemo = () => {
    Alert.alert('Reset LINK?', 'This clears local profile changes, linked people and chats on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setThemeSetting('light');
          setPeople(demoPeople);
          setMessages(seedMessages);
          setProfile({ id: `u_${Math.random().toString(36).slice(2, 10)}`, name: 'Your Name', username: '@yourlink', bio: 'tap • link • talk' });
          setTab('home');
        },
      },
    ]);
  };

  if (!hydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: light.bg }]}> 
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>L*</Text>
        </View>
        <Text style={{ fontWeight: '800', color: light.text, fontSize: 17 }}>LINK</Text>
      </View>
    );
  }

  if (activeChat) {
    return (
      <>
        <RNStatusBar barStyle={activeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
        <ChatScreen
          theme={theme}
          person={activeChat}
          messages={messages[activeChat.id] || []}
          onBack={() => setActiveChat(null)}
          onSend={sendMessage}
        />
      </>
    );
  }

  return (
    <View style={[styles.app, { backgroundColor: theme.bg }]}> 
      <RNStatusBar barStyle={activeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {tab === 'home' && (
            <HomeScreen
              theme={theme}
              profile={profile}
              people={people}
              messages={messages}
              openOwnCard={() => setCardOpen(true)}
              openScanner={() => setScannerOpen(true)}
              openChat={setActiveChat}
              setTab={setTab}
            />
          )}
          {tab === 'people' && <PeopleScreen theme={theme} people={people} openChat={setActiveChat} />}
          {tab === 'link' && <LinkScreen theme={theme} profile={profile} payload={payload} openScanner={() => setScannerOpen(true)} addDemoLink={addDemoLink} />}
          {tab === 'chats' && <ChatsScreen theme={theme} people={people} messages={messages} openChat={setActiveChat} />}
          {tab === 'profile' && (
            <ProfileScreen
              theme={theme}
              profile={profile}
              setProfile={setProfile}
              themeSetting={themeSetting}
              setThemeSetting={setThemeSetting}
              resetDemo={resetDemo}
            />
          )}
        </View>
        <TabBar tab={tab} setTab={setTab} theme={theme} />
      </SafeAreaView>

      <ScannerModal visible={scannerOpen} onClose={() => setScannerOpen(false)} onScanned={onScanned} theme={theme} />
      <OwnCardModal visible={cardOpen} onClose={() => setCardOpen(false)} theme={theme} profile={profile} payload={payload} />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1 },
  flexOne: { flex: 1 },
  screenScroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 120 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  simpleHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  bigTitle: { fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.2 },
  headerSub: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  heroCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 28, padding: 20, marginBottom: 14 },
  heroHeadline: { fontSize: 33, lineHeight: 35, fontWeight: '900', letterSpacing: -1.35, marginTop: 28 },
  heroBody: { marginTop: 10, fontSize: 15, lineHeight: 21, maxWidth: 310 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  primaryButton: { height: 48, borderRadius: 16, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontWeight: '800', fontSize: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  statNumber: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  statLabel: { fontSize: 12.5, marginTop: 2 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  personRow: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 },
  personName: { fontSize: 15.5, fontWeight: '800' },
  personSub: { fontSize: 12.5, marginTop: 4 },
  metaText: { fontSize: 10.5, marginLeft: 8 },
  miniChatButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eventCard: { marginTop: 19, borderRadius: 26, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18 },
  eventTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.7, marginTop: 6 },
  eventBody: { fontSize: 13.5, lineHeight: 19, marginTop: 7 },
  eventIcon: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchBox: { marginHorizontal: 18, height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9, marginBottom: 7 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  listPad: { paddingHorizontal: 18, paddingTop: 9, paddingBottom: 120 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 90, paddingHorizontal: 34 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 14 },
  emptyBody: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  linkCard: { width: '100%', borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 20, alignItems: 'center' },
  linkCardTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkBrand: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
  cardHint: { fontSize: 11, marginTop: 2 },
  qrWrap: { padding: 14, borderRadius: 24, marginTop: 24 },
  linkName: { fontSize: 25, fontWeight: '900', letterSpacing: -0.7, marginTop: 18 },
  linkUsername: { fontSize: 14, marginTop: 4 },
  linkCardPills: { flexDirection: 'row', gap: 7, marginTop: 15, marginBottom: 2 },
  widePrimary: { width: '100%', height: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 16 },
  wideSecondary: { width: '100%', height: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10 },
  privacyNote: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 18, marginTop: 16 },
  chatRow: { flexDirection: 'row', gap: 12, paddingVertical: 13, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  chatPreview: { fontSize: 13.5, marginTop: 4 },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  profileCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 28, padding: 22, alignItems: 'center', marginBottom: 22 },
  profileName: { fontSize: 24, fontWeight: '900', marginTop: 14, letterSpacing: -0.7 },
  profileUser: { fontSize: 14, marginTop: 3 },
  profileBio: { fontSize: 13.5, marginTop: 11 },
  profileInput: { width: '100%', minHeight: 46, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeOption: { flex: 1, minHeight: 48, borderRadius: 16, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  settingHint: { fontSize: 12, lineHeight: 18, marginTop: 9, marginBottom: 18 },
  settingsCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14 },
  settingsIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  settingsTitle: { fontWeight: '800', fontSize: 14 },
  settingsSub: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  resetButton: { marginTop: 22, marginBottom: 18, height: 48, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  tabBar: { height: 78, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 14 : 6, paddingHorizontal: 6 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 58 },
  centerTab: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -6 }] },
  tabDot: { width: 4, height: 4, borderRadius: 2, marginTop: 5 },
  chatHeader: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  chatHeaderPerson: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  chatHeaderName: { fontWeight: '800', fontSize: 14.5 },
  chatHeaderStatus: { fontSize: 10.5, marginTop: 2, fontWeight: '700' },
  metContext: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, marginTop: 10 },
  metContextText: { fontSize: 10.5, fontWeight: '600' },
  messageList: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18, flexGrow: 1 },
  messageLine: { flexDirection: 'row', marginVertical: 4 },
  bubble: { maxWidth: '82%', borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 9, marginTop: 5, alignSelf: 'flex-end' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  composerWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', padding: 10, borderTopWidth: StyleSheet.hairlineWidth },
  plusButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  composer: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 18, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 13, paddingRight: 5, paddingVertical: 5 },
  composerInput: { flex: 1, fontSize: 15, maxHeight: 100, paddingTop: 7, paddingBottom: 7 },
  sendButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
  scannerPage: { flex: 1 },
  scannerHeader: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scannerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  scannerSub: { color: 'rgba(255,255,255,0.58)', marginTop: 3, fontSize: 13 },
  scannerClose: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  cameraShell: { flex: 1, marginHorizontal: 14, borderRadius: 30, overflow: 'hidden', backgroundColor: '#15171C', alignItems: 'center', justifyContent: 'center' },
  scanFrame: { position: 'absolute', width: 250, height: 250 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  scannerFoot: { color: 'rgba(255,255,255,0.56)', textAlign: 'center', fontSize: 12, paddingVertical: 14 },
  scanAgainButton: { alignSelf: 'center', marginBottom: 10, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14 },
  permissionState: { alignItems: 'center', paddingHorizontal: 34 },
  permissionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 15 },
  permissionBody: { color: 'rgba(255,255,255,0.58)', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 7 },
  permissionButton: { backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 15, marginTop: 17 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  ownCardModal: { width: '100%', maxWidth: 420, borderRadius: 30, padding: 20 },
  qrWrapLarge: { alignSelf: 'center', padding: 15, borderRadius: 25, marginTop: 24 },
  modalCardName: { fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 18, letterSpacing: -0.7 },
  modalCardUser: { fontSize: 14, textAlign: 'center', marginTop: 3 },
  modalCardHint: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 28, marginTop: 13, marginBottom: 4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingLogo: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT },
  loadingLogoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
});
