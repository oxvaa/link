import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
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

const STORAGE_KEY = '@link_social_core_v2';
const ACCENT = '#6C5CE7';
const BUILD = 'LINK 0.2';

const light = {
  bg: '#F6F7FB', card: '#FFFFFF', elevated: '#FFFFFF', text: '#111318', sub: '#6F7582',
  border: '#E8EAF0', soft: '#F0F1F6', input: '#F2F3F7', tab: 'rgba(255,255,255,0.97)',
  inverse: '#111318', inverseText: '#FFFFFF', danger: '#E5484D', success: '#1F9D66', warning: '#F59E0B',
};
const dark = {
  bg: '#0B0C0F', card: '#13151A', elevated: '#181A20', text: '#F6F7FA', sub: '#9EA3AF',
  border: '#252832', soft: '#1A1D23', input: '#1B1E25', tab: 'rgba(16,17,21,0.97)',
  inverse: '#F6F7FA', inverseText: '#111318', danger: '#FF6B6B', success: '#47C98A', warning: '#FFB84D',
};

const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const initialsFor = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]?.toUpperCase()).join('') || 'L';
const threadKey = (a, b) => [a, b].sort().join('__');
const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const normalizeUsername = (value = '') => {
  const clean = value.trim().replace(/\s+/g, '').replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();
  return `@${clean || 'linkuser'}`;
};

function initialData() {
  const profiles = {
    local_simi: {
      id: 'local_simi', isLocal: true, name: 'Šimi', username: '@simi', bio: 'music • nights • LINK',
      status: 'Outside', socials: { instagram: '@simi', spotify: 'Šimi' },
    },
    local_nela: {
      id: 'local_nela', isLocal: true, name: 'Nela K.', username: '@nelak', bio: 'music • prague • late nights',
      status: 'Available', socials: { instagram: '@nelak', spotify: 'nela k' },
    },
    local_alex: {
      id: 'local_alex', isLocal: true, name: 'Alex V.', username: '@alexv', bio: 'design / streetwear / coffee',
      status: 'At work', socials: { instagram: '@alexv', spotify: 'alex v' },
    },
    demo_david: {
      id: 'demo_david', isLocal: false, name: 'David M.', username: '@davidm', bio: 'design / streetwear',
      status: '2m ago', socials: { instagram: '@davidm', spotify: 'David M' },
    },
  };

  const keySN = threadKey('local_simi', 'local_nela');
  const keySD = threadKey('local_simi', 'demo_david');

  return {
    version: 2,
    themeSetting: 'light',
    activeAccountId: 'local_simi',
    localAccountIds: ['local_simi', 'local_nela', 'local_alex'],
    profiles,
    relationships: {
      local_simi: ['local_nela', 'demo_david'],
      local_nela: ['local_simi'],
      local_alex: [],
      demo_david: ['local_simi'],
    },
    requests: [
      { id: 'req_alex_simi', fromId: 'local_alex', toId: 'local_simi', createdAt: 'Today, 11:12' },
    ],
    conversations: {
      [keySN]: [
        { id: 'm1', senderId: 'local_nela', type: 'text', text: 'yo, nice meeting u 👋', time: '10:44', readBy: ['local_nela', 'local_simi'], reactions: [] },
        { id: 'm2', senderId: 'local_simi', type: 'text', text: 'same haha, LINK actually worked 😭', time: '10:45', readBy: ['local_simi'], reactions: [{ userId: 'local_nela', emoji: '❤️' }] },
      ],
      [keySD]: [
        { id: 'm3', senderId: 'demo_david', type: 'text', text: 'send me that brand name later', time: 'Yesterday', readBy: ['demo_david', 'local_simi'], reactions: [] },
      ],
    },
    moments: [
      { id: 'mom_nela', ownerId: 'local_nela', emoji: '🎧', caption: 'late night playlist', createdAt: Date.now() - 1000 * 60 * 25 },
      { id: 'mom_david', ownerId: 'demo_david', emoji: '🧢', caption: 'new pieces soon', createdAt: Date.now() - 1000 * 60 * 72 },
    ],
    notifications: {
      local_simi: [
        { id: 'n_req', type: 'request', title: 'New LINK request', body: 'Alex V. wants to LINK with you.', time: '11:12', read: false },
      ],
      local_nela: [],
      local_alex: [],
    },
    privacy: {
      local_simi: { showStatus: true, showSocials: true, momentsToLinks: true },
      local_nela: { showStatus: true, showSocials: true, momentsToLinks: true },
      local_alex: { showStatus: true, showSocials: false, momentsToLinks: true },
    },
  };
}

function Avatar({ person, size = 48, theme, accent = ACCENT }) {
  const isLocal = person?.isLocal;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: isLocal ? accent : theme.soft }]}> 
      <Text style={{ color: isLocal ? '#fff' : theme.text, fontWeight: '900', fontSize: size * 0.31 }}>{initialsFor(person?.name)}</Text>
    </View>
  );
}

function IconButton({ icon, onPress, theme, filled = false, badge = 0, size = 21 }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: filled ? theme.inverse : theme.soft, opacity: pressed ? 0.7 : 1 }]}> 
      <Ionicons name={icon} size={size} color={filled ? theme.inverseText : theme.text} />
      {badge > 0 ? <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{badge > 9 ? '9+' : badge}</Text></View> : null}
    </Pressable>
  );
}

function Pill({ children, theme, tone = 'soft' }) {
  const bg = tone === 'accent' ? ACCENT : tone === 'success' ? 'rgba(31,157,102,.12)' : theme.soft;
  const color = tone === 'accent' ? '#fff' : tone === 'success' ? theme.success : theme.sub;
  return <View style={[styles.pill, { backgroundColor: bg }]}><Text style={[styles.pillText, { color }]}>{children}</Text></View>;
}

function SectionTitle({ children, theme, action, onAction }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>
      {action ? <Pressable onPress={onAction}><Text style={{ color: ACCENT, fontWeight: '800' }}>{action}</Text></Pressable> : null}
    </View>
  );
}

function AccountChip({ person, theme, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.accountChip, { backgroundColor: theme.soft }]}> 
      <Avatar person={person} size={30} theme={theme} />
      <View style={{ minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.accountChipName, { color: theme.text }]}>{person.name}</Text>
        <Text numberOfLines={1} style={[styles.accountChipUser, { color: theme.sub }]}>{person.username}</Text>
      </View>
      <Ionicons name="chevron-down" size={15} color={theme.sub} />
    </Pressable>
  );
}

function MomentStrip({ theme, activeProfile, moments, profiles, visibleOwnerIds, onCreate, onOpen }) {
  const fresh = moments.filter(m => Date.now() - m.createdAt < 24 * 60 * 60 * 1000 && visibleOwnerIds.includes(m.ownerId));
  const latestByOwner = [];
  fresh.sort((a, b) => b.createdAt - a.createdAt).forEach(m => {
    if (!latestByOwner.find(x => x.ownerId === m.ownerId)) latestByOwner.push(m);
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.momentStrip}>
      <Pressable onPress={onCreate} style={styles.momentItem}>
        <View style={[styles.momentRing, { borderColor: theme.border }]}>
          <Avatar person={activeProfile} size={52} theme={theme} />
          <View style={styles.momentPlus}><Ionicons name="add" size={14} color="#fff" /></View>
        </View>
        <Text numberOfLines={1} style={[styles.momentName, { color: theme.sub }]}>Your moment</Text>
      </Pressable>
      {latestByOwner.filter(m => m.ownerId !== activeProfile.id).map(m => {
        const p = profiles[m.ownerId];
        if (!p) return null;
        return (
          <Pressable key={m.id} onPress={() => onOpen(m)} style={styles.momentItem}>
            <View style={[styles.momentRing, { borderColor: ACCENT }]}><Avatar person={p} size={52} theme={theme} /></View>
            <Text numberOfLines={1} style={[styles.momentName, { color: theme.sub }]}>{p.name.split(' ')[0]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function RequestCard({ request, profile, theme, onAccept, onDecline }) {
  return (
    <View style={[styles.requestCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
      <Avatar person={profile} size={48} theme={theme} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.personName, { color: theme.text }]}>{profile.name}</Text>
        <Text style={[styles.personSub, { color: theme.sub }]}>{profile.username} wants to LINK</Text>
        <View style={styles.requestActions}>
          <Pressable onPress={() => onAccept(request)} style={[styles.requestAccept, { backgroundColor: theme.inverse }]}><Text style={{ color: theme.inverseText, fontWeight: '800', fontSize: 12 }}>Accept</Text></Pressable>
          <Pressable onPress={() => onDecline(request.id)} style={[styles.requestDecline, { backgroundColor: theme.soft }]}><Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>Decline</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function PersonRow({ person, theme, onPress, onChat, unread = 0 }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.personRow, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.74 : 1 }]}> 
      <View><Avatar person={person} size={50} theme={theme} />{unread ? <View style={styles.unreadDot} /> : null}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowBetween}>
          <Text numberOfLines={1} style={[styles.personName, { color: theme.text }]}>{person.name}</Text>
          {person.isLocal ? <Pill theme={theme}>LOCAL</Pill> : null}
        </View>
        <Text numberOfLines={1} style={[styles.personSub, { color: theme.sub }]}>{person.username} · {person.status || 'Linked'}</Text>
      </View>
      <Pressable onPress={(e) => { e?.stopPropagation?.(); onChat?.(); }} style={[styles.miniChatButton, { backgroundColor: theme.soft }]}> 
        <Ionicons name="chatbubble-ellipses" size={18} color={theme.text} />
      </Pressable>
    </Pressable>
  );
}

function HomeScreen({ theme, activeProfile, connectedProfiles, conversations, activeId, requests, notifications, moments, profiles, openOwnCard, openScanner, openChat, openAccountSwitcher, openNotifications, onAccept, onDecline, onCreateMoment, onOpenMoment, setTab }) {
  const unreadNotifs = (notifications[activeId] || []).filter(n => !n.read).length;
  const visibleMomentOwners = [activeId, ...connectedProfiles.map(p => p.id)];
  const unreadFor = (personId) => (conversations[threadKey(activeId, personId)] || []).filter(m => !m.readBy?.includes(activeId) && m.senderId !== activeId).length;

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <AccountChip person={activeProfile} theme={theme} onPress={openAccountSwitcher} />
        <IconButton icon="notifications-outline" theme={theme} badge={unreadNotifs} onPress={openNotifications} />
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={styles.rowBetween}><Pill theme={theme} tone="accent">{BUILD}</Pill><Ionicons name="sparkles" size={19} color={ACCENT} /></View>
        <Text style={[styles.heroHeadline, { color: theme.text }]}>Meet IRL.{`\n`}Stay connected.</Text>
        <Text style={[styles.heroBody, { color: theme.sub }]}>LINK people you actually meet, then keep the conversation going without random DMs.</Text>
        <View style={styles.heroActions}>
          <Pressable onPress={openOwnCard} style={[styles.primaryButton, { backgroundColor: theme.inverse }]}><Ionicons name="qr-code" size={19} color={theme.inverseText} /><Text style={[styles.primaryButtonText, { color: theme.inverseText }]}>Show my LINK</Text></Pressable>
          <Pressable onPress={openScanner} style={[styles.secondaryButton, { backgroundColor: theme.soft }]}><Ionicons name="scan" size={20} color={theme.text} /></Pressable>
        </View>
      </View>

      <SectionTitle theme={theme}>Moments</SectionTitle>
      <MomentStrip theme={theme} activeProfile={activeProfile} moments={moments} profiles={profiles} visibleOwnerIds={visibleMomentOwners} onCreate={onCreateMoment} onOpen={onOpenMoment} />

      {requests.length ? (
        <>
          <SectionTitle theme={theme}>LINK requests</SectionTitle>
          {requests.slice(0, 2).map(r => <RequestCard key={r.id} request={r} profile={profiles[r.fromId]} theme={theme} onAccept={onAccept} onDecline={onDecline} />)}
        </>
      ) : null}

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}><Text style={[styles.statNumber, { color: theme.text }]}>{connectedProfiles.length}</Text><Text style={[styles.statLabel, { color: theme.sub }]}>People linked</Text></View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}><Text style={[styles.statNumber, { color: theme.text }]}>{connectedProfiles.filter(p => (conversations[threadKey(activeId, p.id)] || []).length).length}</Text><Text style={[styles.statLabel, { color: theme.sub }]}>Conversations</Text></View>
      </View>

      <SectionTitle theme={theme} action="See all" onAction={() => setTab('people')}>Recently linked</SectionTitle>
      {connectedProfiles.slice(0, 3).map(person => <PersonRow key={person.id} person={person} theme={theme} unread={unreadFor(person.id)} onPress={() => openChat(person)} onChat={() => openChat(person)} />)}

      <View style={[styles.localLabCard, { backgroundColor: theme.inverse }]}> 
        <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: theme.inverseText, opacity: .58 }]}>LOCAL ACCOUNTS LAB</Text><Text style={[styles.eventTitle, { color: theme.inverseText }]}>Test both sides.</Text><Text style={[styles.eventBody, { color: theme.inverseText, opacity: .7 }]}>Switch profiles, accept LINK requests and chat between accounts on this device.</Text></View>
        <Pressable onPress={openAccountSwitcher} style={[styles.eventIcon, { backgroundColor: theme.inverseText }]}><Ionicons name="swap-horizontal" size={24} color={theme.inverse} /></Pressable>
      </View>
    </ScrollView>
  );
}

function PeopleScreen({ theme, activeId, profiles, connectedIds, localAccountIds, requests, openProfile, openChat, sendRequest }) {
  const [query, setQuery] = useState('');
  const connected = connectedIds.map(id => profiles[id]).filter(Boolean);
  const discover = localAccountIds.map(id => profiles[id]).filter(p => p && p.id !== activeId && !connectedIds.includes(p.id));
  const match = p => `${p.name} ${p.username} ${p.bio}`.toLowerCase().includes(query.toLowerCase());
  const pendingTo = (id) => requests.some(r => r.fromId === activeId && r.toId === id);
  const pendingFrom = (id) => requests.some(r => r.fromId === id && r.toId === activeId);

  return (
    <View style={styles.flexOne}>
      <View style={styles.simpleHeader}><Text style={[styles.bigTitle, { color: theme.text }]}>People</Text><Text style={[styles.headerSub, { color: theme.sub }]}>Your real-life connections.</Text></View>
      <View style={[styles.searchBox, { backgroundColor: theme.input }]}><Ionicons name="search" size={19} color={theme.sub} /><TextInput placeholder="Search @username or name" placeholderTextColor={theme.sub} value={query} onChangeText={setQuery} style={[styles.searchInput, { color: theme.text }]} /></View>
      <ScrollView contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
        <SectionTitle theme={theme}>Linked</SectionTitle>
        {connected.filter(match).map(person => <PersonRow key={person.id} person={person} theme={theme} onPress={() => openProfile(person)} onChat={() => openChat(person)} />)}
        {!connected.filter(match).length ? <Text style={[styles.emptyInline, { color: theme.sub }]}>No linked people match this search.</Text> : null}

        <SectionTitle theme={theme}>Discover local test accounts</SectionTitle>
        {discover.filter(match).map(person => (
          <Pressable key={person.id} onPress={() => openProfile(person)} style={[styles.discoverRow, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <Avatar person={person} size={48} theme={theme} />
            <View style={{ flex: 1 }}><Text style={[styles.personName, { color: theme.text }]}>{person.name}</Text><Text style={[styles.personSub, { color: theme.sub }]}>{person.username} · {person.status}</Text></View>
            <Pressable disabled={pendingTo(person.id) || pendingFrom(person.id)} onPress={() => sendRequest(person.id)} style={[styles.linkRequestButton, { backgroundColor: pendingTo(person.id) || pendingFrom(person.id) ? theme.soft : theme.inverse }]}><Text style={{ color: pendingTo(person.id) || pendingFrom(person.id) ? theme.sub : theme.inverseText, fontWeight: '800', fontSize: 12 }}>{pendingFrom(person.id) ? 'Incoming' : pendingTo(person.id) ? 'Sent' : 'LINK'}</Text></Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function LinkScreen({ theme, activeProfile, payload, localProfiles, relationships, requests, openScanner, openOwnCard, sendRequest }) {
  const connected = id => (relationships[activeProfile.id] || []).includes(id);
  const sent = id => requests.some(r => r.fromId === activeProfile.id && r.toId === id);
  const incoming = id => requests.some(r => r.fromId === id && r.toId === activeProfile.id);
  return (
    <ScrollView contentContainerStyle={[styles.screenScroll, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.bigTitle, { color: theme.text, alignSelf: 'flex-start' }]}>LINK</Text>
      <Text style={[styles.headerSub, { color: theme.sub, alignSelf: 'flex-start', marginBottom: 20 }]}>Share your card or send a request nearby.</Text>
      <Pressable onPress={openOwnCard} style={[styles.linkCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={styles.linkCardTop}><View><Text style={[styles.linkBrand, { color: theme.text }]}>LINK*</Text><Text style={[styles.cardHint, { color: theme.sub }]}>tap · scan · connect</Text></View><Avatar person={activeProfile} size={54} theme={theme} /></View>
        <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}><QRCode value={payload} size={170} color="#0E0F12" backgroundColor="#FFFFFF" /></View>
        <Text style={[styles.linkName, { color: theme.text }]}>{activeProfile.name}</Text><Text style={[styles.linkUsername, { color: theme.sub }]}>{activeProfile.username}</Text>
        <View style={styles.linkCardPills}><Pill theme={theme}>Mutual LINK</Pill><Pill theme={theme}>Private</Pill></View>
      </Pressable>
      <Pressable onPress={openScanner} style={[styles.widePrimary, { backgroundColor: theme.inverse }]}><Ionicons name="scan" size={20} color={theme.inverseText} /><Text style={[styles.primaryButtonText, { color: theme.inverseText }]}>Scan a LINK</Text></Pressable>

      <SectionTitle theme={theme}>Local Accounts Lab</SectionTitle>
      <Text style={[styles.labHint, { color: theme.sub }]}>Send a request, switch account, accept it, then chat from both sides.</Text>
      <View style={{ width: '100%' }}>
        {localProfiles.filter(p => p.id !== activeProfile.id).map(p => (
          <View key={p.id} style={[styles.labAccountRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Avatar person={p} size={44} theme={theme} /><View style={{ flex: 1 }}><Text style={[styles.personName, { color: theme.text }]}>{p.name}</Text><Text style={[styles.personSub, { color: theme.sub }]}>{p.username}</Text></View>
            {connected(p.id) ? <Pill theme={theme} tone="success">LINKED</Pill> : <Pressable disabled={sent(p.id) || incoming(p.id)} onPress={() => sendRequest(p.id)} style={[styles.smallAction, { backgroundColor: theme.inverse }]}><Text style={{ color: theme.inverseText, fontWeight: '800', fontSize: 11 }}>{incoming(p.id) ? 'INCOMING' : sent(p.id) ? 'SENT' : 'SEND LINK'}</Text></Pressable>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ChatsScreen({ theme, activeId, profiles, connectedIds, conversations, openChat }) {
  const rows = connectedIds.map(id => {
    const person = profiles[id];
    const convo = conversations[threadKey(activeId, id)] || [];
    const last = convo[convo.length - 1];
    const unread = convo.filter(m => !m.readBy?.includes(activeId) && m.senderId !== activeId).length;
    return { person, last, unread };
  }).filter(x => x.person).sort((a, b) => (b.last?.id || '').localeCompare(a.last?.id || ''));

  return (
    <View style={styles.flexOne}>
      <View style={styles.simpleHeader}><Text style={[styles.bigTitle, { color: theme.text }]}>Chats</Text><Text style={[styles.headerSub, { color: theme.sub }]}>No random DMs. Only people you LINK.</Text></View>
      <FlatList data={rows} keyExtractor={x => x.person.id} contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable onPress={() => openChat(item.person)} style={({ pressed }) => [styles.chatRow, { borderBottomColor: theme.border, opacity: pressed ? .72 : 1 }]}> 
            <View><Avatar person={item.person} size={52} theme={theme} />{item.unread ? <View style={styles.unreadDot} /> : null}</View>
            <View style={{ flex: 1, minWidth: 0 }}><View style={styles.rowBetween}><Text style={[styles.personName, { color: theme.text }]}>{item.person.name}</Text><Text style={[styles.metaText, { color: theme.sub }]}>{item.last?.time || ''}</Text></View><Text numberOfLines={1} style={[styles.chatPreview, { color: item.unread ? theme.text : theme.sub, fontWeight: item.unread ? '700' : '400' }]}>{item.last ? `${item.last.senderId === activeId ? 'You: ' : ''}${item.last.type === 'text' ? item.last.text : item.last.type === 'photo' ? '📷 Photo' : '🎙 Voice message'}` : 'Start the conversation'}</Text></View>
            {item.unread ? <View style={styles.unreadCount}><Text style={styles.unreadCountText}>{item.unread}</Text></View> : null}
          </Pressable>
        )}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="chatbubble-ellipses-outline" size={40} color={theme.sub} /><Text style={[styles.emptyTitle, { color: theme.text }]}>No chats yet</Text><Text style={[styles.emptyBody, { color: theme.sub }]}>LINK with someone first.</Text></View>}
      />
    </View>
  );
}

function ThemeOption({ mode, active, label, icon, onPress, theme }) {
  return <Pressable onPress={() => onPress(mode)} style={[styles.themeOption, { backgroundColor: active ? theme.inverse : theme.soft }]}><Ionicons name={icon} size={18} color={active ? theme.inverseText : theme.text} /><Text style={{ color: active ? theme.inverseText : theme.text, fontWeight: '800', fontSize: 13 }}>{label}</Text></Pressable>;
}

function SettingsRow({ theme, icon, title, subtitle, right, last = false }) {
  return <View style={[styles.settingsRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}><View style={[styles.settingsIcon, { backgroundColor: theme.soft }]}><Ionicons name={icon} size={18} color={theme.text} /></View><View style={{ flex: 1 }}><Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.settingsSub, { color: theme.sub }]}>{subtitle}</Text></View>{right}</View>;
}

function ProfileScreen({ theme, activeProfile, updateProfile, themeSetting, setThemeSetting, privacy, setPrivacy, openAccountSwitcher, resetDemo }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(activeProfile);
  useEffect(() => setDraft(activeProfile), [activeProfile]);
  const save = () => {
    if (!draft.name.trim()) return Alert.alert('Name required', 'Add a display name first.');
    updateProfile({ ...draft, username: normalizeUsername(draft.username) }); setEditing(false);
  };
  const statuses = ['Available', 'Outside', 'At work', 'At event', 'Do not disturb'];

  return (
    <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}><View><Text style={[styles.bigTitle, { color: theme.text }]}>Profile</Text><Text style={[styles.headerSub, { color: theme.sub }]}>Your public LINK identity</Text></View><IconButton icon={editing ? 'checkmark' : 'create-outline'} onPress={editing ? save : () => setEditing(true)} theme={theme} filled={editing} /></View>
      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}><Avatar person={activeProfile} size={76} theme={theme} />
        {editing ? <View style={{ width: '100%', marginTop: 18, gap: 10 }}>
          <TextInput value={draft.name} onChangeText={name => setDraft({ ...draft, name })} placeholder="Display name" placeholderTextColor={theme.sub} style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]} />
          <TextInput value={draft.username} onChangeText={username => setDraft({ ...draft, username })} autoCapitalize="none" placeholder="@username" placeholderTextColor={theme.sub} style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]} />
          <TextInput value={draft.bio} onChangeText={bio => setDraft({ ...draft, bio })} placeholder="Short bio" placeholderTextColor={theme.sub} style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]} />
        </View> : <><Text style={[styles.profileName, { color: theme.text }]}>{activeProfile.name}</Text><Text style={[styles.profileUser, { color: theme.sub }]}>{activeProfile.username}</Text><Text style={[styles.profileBio, { color: theme.sub }]}>{activeProfile.bio}</Text><Pill theme={theme} tone="accent">{activeProfile.status}</Pill></>}
      </View>

      <SectionTitle theme={theme}>Status</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>{statuses.map(s => <Pressable key={s} onPress={() => updateProfile({ ...activeProfile, status: s })} style={[styles.statusChoice, { backgroundColor: activeProfile.status === s ? theme.inverse : theme.soft }]}><Text style={{ color: activeProfile.status === s ? theme.inverseText : theme.text, fontWeight: '700', fontSize: 12 }}>{s}</Text></Pressable>)}</ScrollView>

      <SectionTitle theme={theme}>Local accounts</SectionTitle>
      <Pressable onPress={openAccountSwitcher} style={[styles.accountManagerButton, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={[styles.settingsIcon, { backgroundColor: theme.soft }]}><Ionicons name="people-circle-outline" size={20} color={theme.text} /></View><View style={{ flex: 1 }}><Text style={[styles.settingsTitle, { color: theme.text }]}>Switch / create account</Text><Text style={[styles.settingsSub, { color: theme.sub }]}>Test chats and LINK requests from both sides</Text></View><Ionicons name="chevron-forward" size={20} color={theme.sub} /></Pressable>

      <SectionTitle theme={theme}>Appearance</SectionTitle>
      <View style={styles.themeRow}><ThemeOption mode="system" active={themeSetting === 'system'} label="System" icon="phone-portrait-outline" onPress={setThemeSetting} theme={theme} /><ThemeOption mode="light" active={themeSetting === 'light'} label="Light" icon="sunny-outline" onPress={setThemeSetting} theme={theme} /><ThemeOption mode="dark" active={themeSetting === 'dark'} label="Dark" icon="moon-outline" onPress={setThemeSetting} theme={theme} /></View>
      <Text style={[styles.settingHint, { color: theme.sub }]}>Light is the default. System follows your device automatically.</Text>

      <SectionTitle theme={theme}>Privacy</SectionTitle>
      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <SettingsRow theme={theme} icon="pulse-outline" title="Share status" subtitle="Linked people can see your current status" right={<Switch value={privacy.showStatus} onValueChange={v => setPrivacy({ ...privacy, showStatus: v })} trackColor={{ false: theme.soft, true: ACCENT }} />} />
        <SettingsRow theme={theme} icon="logo-instagram" title="Show socials" subtitle="Display social handles on your profile" right={<Switch value={privacy.showSocials} onValueChange={v => setPrivacy({ ...privacy, showSocials: v })} trackColor={{ false: theme.soft, true: ACCENT }} />} />
        <SettingsRow theme={theme} icon="aperture-outline" title="Moments to LINKs" subtitle="Only linked people can see your Moments" right={<Switch value={privacy.momentsToLinks} onValueChange={v => setPrivacy({ ...privacy, momentsToLinks: v })} trackColor={{ false: theme.soft, true: ACCENT }} />} last />
      </View>
      <Pressable onPress={resetDemo} style={[styles.resetButton, { borderColor: theme.border }]}><Ionicons name="refresh" size={18} color={theme.danger} /><Text style={{ color: theme.danger, fontWeight: '800' }}>Reset LINK 0.2 demo</Text></Pressable>
    </ScrollView>
  );
}

function ChatMessage({ message, mine, theme, profiles, onLongPress, quoted }) {
  const sender = profiles[message.senderId];
  const reactions = message.reactions || [];
  return (
    <View style={[styles.messageLine, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      <Pressable onLongPress={onLongPress} style={[styles.bubble, mine ? { backgroundColor: ACCENT } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}> 
        {quoted ? <View style={[styles.replyQuote, { borderLeftColor: mine ? 'rgba(255,255,255,.7)' : ACCENT }]}><Text numberOfLines={1} style={{ color: mine ? 'rgba(255,255,255,.78)' : theme.sub, fontSize: 11, fontWeight: '700' }}>{quoted.type === 'text' ? quoted.text : quoted.type === 'photo' ? '📷 Photo' : '🎙 Voice message'}</Text></View> : null}
        {message.type === 'photo' ? <View style={[styles.photoMessage, { backgroundColor: mine ? 'rgba(255,255,255,.15)' : theme.soft }]}>{message.uri ? <Image source={{ uri: message.uri }} style={styles.photoMessageImage} /> : <><Ionicons name="image-outline" size={28} color={mine ? '#fff' : theme.text} /><Text style={{ color: mine ? '#fff' : theme.text, fontWeight: '800', marginTop: 7 }}>Photo</Text></>}</View> : message.type === 'voice' ? <View style={styles.voiceMessage}><Ionicons name="play" size={18} color={mine ? '#fff' : theme.text} /><View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: mine ? 'rgba(255,255,255,.45)' : theme.border }} /><Text style={{ color: mine ? '#fff' : theme.text, fontSize: 11, fontWeight: '700' }}>{message.duration || '0:08'}</Text></View> : <Text style={[styles.bubbleText, { color: mine ? '#fff' : theme.text }]}>{message.text}</Text>}
        <View style={styles.messageMeta}><Text style={[styles.bubbleTime, { color: mine ? 'rgba(255,255,255,.68)' : theme.sub }]}>{message.time}</Text>{mine ? <Ionicons name={message.readBy?.length > 1 ? 'checkmark-done' : 'checkmark'} size={12} color="rgba(255,255,255,.7)" /> : null}</View>
        {reactions.length ? <View style={[styles.reactionBadge, { backgroundColor: theme.elevated }]}><Text>{reactions.map(r => r.emoji).join(' ')}</Text></View> : null}
      </Pressable>
    </View>
  );
}

function ChatScreen({ theme, activeProfile, person, messages, profiles, onBack, onSend, onReact, onDelete, onOpenProfile, markRead }) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);

  useEffect(() => { markRead(); }, [person.id]);
  const send = (extra = {}) => {
    const clean = text.trim();
    if (!clean && !extra.type) return;
    onSend(person.id, { type: extra.type || 'text', text: clean, replyTo: replyTo?.id || null, ...extra });
    setText(''); setReplyTo(null);
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
    if (!person.isLocal) { setTyping(true); setTimeout(() => setTyping(false), 1500); }
  };
  const longPress = (m) => {
    const mine = m.senderId === activeProfile.id;
    const buttons = [
      { text: 'Reply', onPress: () => setReplyTo(m) },
      { text: '❤️ React', onPress: () => onReact(person.id, m.id, '❤️') },
      { text: '😂 React', onPress: () => onReact(person.id, m.id, '😂') },
    ];
    if (mine) buttons.push({ text: 'Delete', style: 'destructive', onPress: () => onDelete(person.id, m.id) });
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Message', 'Choose an action', buttons);
  };

  return (
    <KeyboardAvoidingView style={[styles.flexOne, { backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flexOne}>
        <View style={[styles.chatHeader, { borderBottomColor: theme.border }]}><IconButton icon="chevron-back" onPress={onBack} theme={theme} /><Pressable onPress={() => onOpenProfile(person)} style={styles.chatHeaderPerson}><Avatar person={person} size={38} theme={theme} /><View><Text style={[styles.chatHeaderName, { color: theme.text }]}>{person.name}</Text><Text style={[styles.chatHeaderStatus, { color: theme.success }]}>{person.status || 'Linked'}</Text></View></Pressable><IconButton icon="videocam-outline" onPress={() => Alert.alert('LINK Call', 'Voice & video calling UI is reserved for a future backend build.')} theme={theme} /></View>
        <View style={[styles.metContext, { backgroundColor: theme.soft }]}><Ionicons name="link" size={14} color={theme.sub} /><Text style={[styles.metContextText, { color: theme.sub }]}>Mutual LINK · private conversation</Text></View>
        <FlatList ref={listRef} data={messages} keyExtractor={m => m.id} contentContainerStyle={styles.messageList} showsVerticalScrollIndicator={false} onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
          renderItem={({ item }) => <ChatMessage message={item} mine={item.senderId === activeProfile.id} theme={theme} profiles={profiles} quoted={messages.find(x => x.id === item.replyTo)} onLongPress={() => longPress(item)} />}
          ListEmptyComponent={<View style={styles.emptyChat}><Ionicons name="sparkles-outline" size={30} color={ACCENT} /><Text style={[styles.emptyTitle, { color: theme.text }]}>New LINK</Text><Text style={[styles.emptyBody, { color: theme.sub }]}>Say hi to {person.name.split(' ')[0]}.</Text></View>}
        />
        {typing ? <View style={styles.typingLine}><View style={[styles.typingBubble, { backgroundColor: theme.card }]}><Text style={{ color: theme.sub, letterSpacing: 2 }}>•••</Text></View><Text style={{ color: theme.sub, fontSize: 10 }}>{person.name.split(' ')[0]} is typing</Text></View> : null}
        {replyTo ? <View style={[styles.replyComposerBar, { backgroundColor: theme.soft }]}><View style={{ flex: 1 }}><Text style={{ color: ACCENT, fontWeight: '800', fontSize: 11 }}>Replying to {replyTo.senderId === activeProfile.id ? 'yourself' : profiles[replyTo.senderId]?.name}</Text><Text numberOfLines={1} style={{ color: theme.sub, fontSize: 12 }}>{replyTo.type === 'text' ? replyTo.text : replyTo.type}</Text></View><Pressable onPress={() => setReplyTo(null)}><Ionicons name="close" size={19} color={theme.sub} /></Pressable></View> : null}
        <View style={[styles.composerWrap, { borderTopColor: theme.border, backgroundColor: theme.bg }]}><Pressable style={[styles.plusButton, { backgroundColor: theme.soft }]} onPress={() => Alert.alert('Send', 'Choose a local demo attachment.', [{ text: 'Photo', onPress: () => send({ type: 'photo', text: '' }) }, { text: 'Voice message', onPress: () => send({ type: 'voice', text: '', duration: '0:08' }) }, { text: 'Cancel', style: 'cancel' }])}><Ionicons name="add" size={24} color={theme.text} /></Pressable><View style={[styles.composer, { backgroundColor: theme.input }]}><TextInput value={text} onChangeText={setText} placeholder={`Message ${person.name.split(' ')[0]}`} placeholderTextColor={theme.sub} style={[styles.composerInput, { color: theme.text }]} multiline maxLength={1000} /><Pressable onPress={() => send()} style={[styles.sendButton, { backgroundColor: text.trim() ? ACCENT : theme.soft }]}><Ionicons name="arrow-up" size={19} color={text.trim() ? '#fff' : theme.sub} /></Pressable></View></View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ScannerModal({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  useEffect(() => { if (visible) setLocked(false); }, [visible]);
  useEffect(() => { if (visible && permission && !permission.granted && permission.canAskAgain) requestPermission(); }, [visible, permission]);
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}><View style={styles.scannerPage}><SafeAreaView style={styles.flexOne}><View style={styles.scannerHeader}><View><Text style={styles.scannerTitle}>Scan LINK</Text><Text style={styles.scannerSub}>Point your camera at their card.</Text></View><Pressable onPress={onClose} style={styles.scannerClose}><Ionicons name="close" size={24} color="#fff" /></Pressable></View><View style={styles.cameraShell}>{permission?.granted ? <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={locked ? undefined : ({ data }) => { setLocked(true); onScanned(data); }} /> : <View style={styles.permissionState}><Ionicons name="camera-outline" size={42} color="#fff" /><Text style={styles.permissionTitle}>Camera access needed</Text><Text style={styles.permissionBody}>LINK uses the camera only to scan QR cards and create Moments.</Text><Pressable onPress={requestPermission} style={styles.permissionButton}><Text style={{ color: '#111318', fontWeight: '800' }}>Allow camera</Text></Pressable></View>}<View pointerEvents="none" style={styles.scanFrame}><View style={[styles.corner, styles.cornerTL]} /><View style={[styles.corner, styles.cornerTR]} /><View style={[styles.corner, styles.cornerBL]} /><View style={[styles.corner, styles.cornerBR]} /></View></View><Text style={styles.scannerFoot}>Only LINK QR cards are accepted.</Text>{locked ? <Pressable onPress={() => setLocked(false)} style={styles.scanAgainButton}><Text style={{ color: '#fff', fontWeight: '700' }}>Scan again</Text></Pressable> : null}</SafeAreaView></View></Modal>;
}

function OwnCardModal({ visible, onClose, theme, profile, payload }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={[styles.ownCardModal, { backgroundColor: theme.card }]}><View style={styles.rowBetween}><View><Text style={[styles.linkBrand, { color: theme.text }]}>LINK*</Text><Text style={[styles.cardHint, { color: theme.sub }]}>scan to send request</Text></View><IconButton icon="close" onPress={onClose} theme={theme} /></View><View style={[styles.qrWrapLarge, { backgroundColor: '#fff' }]}><QRCode value={payload} size={220} color="#0E0F12" backgroundColor="#FFFFFF" /></View><Text style={[styles.modalCardName, { color: theme.text }]}>{profile.name}</Text><Text style={[styles.modalCardUser, { color: theme.sub }]}>{profile.username}</Text><Text style={[styles.modalCardHint, { color: theme.sub }]}>Scanning sends a mutual LINK request. Chat unlocks after acceptance.</Text></View></View></Modal>;
}

function NotificationsModal({ visible, onClose, theme, items, markAllRead }) {
  useEffect(() => { if (visible) markAllRead(); }, [visible]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><Pressable style={[styles.sheetCard, { backgroundColor: theme.card }]} onPress={() => {}}><View style={styles.rowBetween}><View><Text style={[styles.sheetTitle, { color: theme.text }]}>Notifications</Text><Text style={[styles.sheetSub, { color: theme.sub }]}>LINK activity for this account</Text></View><IconButton icon="close" onPress={onClose} theme={theme} /></View><ScrollView style={{ maxHeight: 430 }} contentContainerStyle={{ paddingTop: 14 }}>{items.length ? items.map(n => <View key={n.id} style={[styles.notificationRow, { borderBottomColor: theme.border }]}><View style={[styles.notificationIcon, { backgroundColor: theme.soft }]}><Ionicons name={n.type === 'message' ? 'chatbubble-outline' : n.type === 'request' ? 'link-outline' : 'checkmark-circle-outline'} size={18} color={theme.text} /></View><View style={{ flex: 1 }}><Text style={[styles.settingsTitle, { color: theme.text }]}>{n.title}</Text><Text style={[styles.settingsSub, { color: theme.sub }]}>{n.body}</Text></View><Text style={[styles.metaText, { color: theme.sub }]}>{n.time}</Text></View>) : <View style={styles.emptyState}><Ionicons name="notifications-off-outline" size={34} color={theme.sub} /><Text style={[styles.emptyTitle, { color: theme.text }]}>All caught up</Text></View>}</ScrollView></Pressable></Pressable></Modal>;
}

function AccountSwitcherModal({ visible, onClose, theme, localProfiles, activeId, onSwitch, onCreate }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><Pressable style={[styles.sheetCard, { backgroundColor: theme.card }]} onPress={() => {}}><View style={styles.rowBetween}><View><Text style={[styles.sheetTitle, { color: theme.text }]}>Local accounts</Text><Text style={[styles.sheetSub, { color: theme.sub }]}>Switch identity on this device</Text></View><IconButton icon="close" onPress={onClose} theme={theme} /></View><View style={{ marginTop: 15 }}>{localProfiles.map(p => <Pressable key={p.id} onPress={() => onSwitch(p.id)} style={[styles.accountSwitchRow, { backgroundColor: p.id === activeId ? theme.soft : 'transparent' }]}><Avatar person={p} size={46} theme={theme} /><View style={{ flex: 1 }}><Text style={[styles.personName, { color: theme.text }]}>{p.name}</Text><Text style={[styles.personSub, { color: theme.sub }]}>{p.username}</Text></View>{p.id === activeId ? <Ionicons name="checkmark-circle" size={22} color={ACCENT} /> : <Ionicons name="swap-horizontal" size={20} color={theme.sub} />}</Pressable>)}</View><Pressable onPress={onCreate} style={[styles.createAccountButton, { backgroundColor: theme.inverse }]}><Ionicons name="person-add-outline" size={18} color={theme.inverseText} /><Text style={{ color: theme.inverseText, fontWeight: '800' }}>Create local account</Text></Pressable><Text style={[styles.tinyHint, { color: theme.sub }]}>Local accounts are stored only on this device. They are designed for testing LINK without a backend.</Text></Pressable></Pressable></Modal>;
}

function CreateAccountModal({ visible, onClose, theme, onCreate, existingProfiles }) {
  const [name, setName] = useState(''); const [username, setUsername] = useState(''); const [bio, setBio] = useState('');
  useEffect(() => { if (visible) { setName(''); setUsername(''); setBio(''); } }, [visible]);
  const submit = () => {
    const u = normalizeUsername(username || name);
    if (!name.trim()) return Alert.alert('Name required', 'Enter a display name.');
    if (Object.values(existingProfiles).some(p => p.username.toLowerCase() === u.toLowerCase())) return Alert.alert('Username taken', 'Choose another @username.');
    onCreate({ name: name.trim(), username: u, bio: bio.trim() || 'new on LINK', status: 'Available' });
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={[styles.sheetCard, { backgroundColor: theme.card }]}><View style={styles.rowBetween}><View><Text style={[styles.sheetTitle, { color: theme.text }]}>New local account</Text><Text style={[styles.sheetSub, { color: theme.sub }]}>Create another test identity</Text></View><IconButton icon="close" onPress={onClose} theme={theme} /></View><View style={{ gap: 10, marginTop: 18 }}><TextInput value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor={theme.sub} style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]} /><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="@username" placeholderTextColor={theme.sub} style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]} /><TextInput value={bio} onChangeText={setBio} placeholder="Short bio" placeholderTextColor={theme.sub} style={[styles.profileInput, { backgroundColor: theme.input, color: theme.text }]} /></View><Pressable onPress={submit} style={[styles.createAccountButton, { backgroundColor: theme.inverse }]}><Text style={{ color: theme.inverseText, fontWeight: '800' }}>Create & switch</Text></Pressable></View></View></Modal>;
}

function PersonProfileModal({ visible, onClose, theme, person, connected, privacy, onChat, onSendRequest }) {
  if (!person) return null;
  const showSocials = privacy?.showSocials !== false;
  const showStatus = privacy?.showStatus !== false;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><Pressable style={[styles.profileModal, { backgroundColor: theme.card }]} onPress={() => {}}><View style={styles.rowBetween}><Pill theme={theme}>{person.isLocal ? 'LOCAL ACCOUNT' : 'LINK PROFILE'}</Pill><IconButton icon="close" onPress={onClose} theme={theme} /></View><Avatar person={person} size={84} theme={theme} /><Text style={[styles.profileName, { color: theme.text }]}>{person.name}</Text><Text style={[styles.profileUser, { color: theme.sub }]}>{person.username}</Text><Text style={[styles.profileBio, { color: theme.sub }]}>{person.bio}</Text>{showStatus ? <Pill theme={theme} tone="success">{person.status}</Pill> : null}{showSocials ? <View style={[styles.socialBox, { backgroundColor: theme.soft }]}><View style={styles.socialLine}><Ionicons name="logo-instagram" size={17} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '700' }}>{person.socials?.instagram || person.username}</Text></View><View style={styles.socialLine}><Ionicons name="musical-notes-outline" size={17} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '700' }}>{person.socials?.spotify || person.name}</Text></View></View> : null}{connected ? <Pressable onPress={() => { onClose(); onChat(); }} style={[styles.widePrimary, { backgroundColor: theme.inverse }]}><Ionicons name="chatbubble-ellipses" size={18} color={theme.inverseText} /><Text style={[styles.primaryButtonText, { color: theme.inverseText }]}>Message</Text></Pressable> : <Pressable onPress={() => { onSendRequest?.(); onClose(); }} style={[styles.widePrimary, { backgroundColor: theme.inverse }]}><Ionicons name="link" size={18} color={theme.inverseText} /><Text style={[styles.primaryButtonText, { color: theme.inverseText }]}>Send LINK request</Text></Pressable>}<Pressable onPress={() => Alert.alert('Safety', 'Block and report controls are prepared for server-backed moderation in a later build.')} style={[styles.safetyButton, { borderColor: theme.border }]}><Ionicons name="shield-outline" size={17} color={theme.sub} /><Text style={{ color: theme.sub, fontWeight: '700' }}>Safety options</Text></Pressable></Pressable></Pressable></Modal>;
}

function MomentComposerModal({ visible, onClose, theme, activeProfile, onPost }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [caption, setCaption] = useState('');
  useEffect(() => { if (visible) { setCaptured(null); setCaption(''); if (permission && !permission.granted && permission.canAskAgain) requestPermission(); } }, [visible]);
  const snap = async () => { try { const photo = await cameraRef.current?.takePictureAsync?.({ quality: .55 }); if (photo?.uri) setCaptured(photo.uri); } catch { Alert.alert('Camera', 'Could not capture a photo. You can post a quick Moment instead.'); } };
  const post = () => { onPost({ imageUri: captured, caption: caption.trim() || (captured ? 'new moment' : 'quick moment ✨'), emoji: captured ? null : '✨' }); onClose(); };
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}><View style={[styles.momentComposerPage, { backgroundColor: '#08090C' }]}><SafeAreaView style={styles.flexOne}><View style={styles.scannerHeader}><View><Text style={styles.scannerTitle}>New Moment</Text><Text style={styles.scannerSub}>Visible to your LINKs for 24 hours.</Text></View><Pressable onPress={onClose} style={styles.scannerClose}><Ionicons name="close" size={24} color="#fff" /></Pressable></View><View style={styles.momentCameraShell}>{captured ? <Image source={{ uri: captured }} style={StyleSheet.absoluteFill} /> : permission?.granted ? <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" /> : <View style={styles.permissionState}><Ionicons name="camera-outline" size={42} color="#fff" /><Text style={styles.permissionTitle}>Camera access</Text><Pressable onPress={requestPermission} style={styles.permissionButton}><Text style={{ color: '#111318', fontWeight: '800' }}>Allow camera</Text></Pressable></View>}</View><View style={styles.momentComposerBottom}><TextInput value={caption} onChangeText={setCaption} placeholder="Add a caption…" placeholderTextColor="rgba(255,255,255,.45)" style={styles.momentCaptionInput} />{captured ? <Pressable onPress={() => setCaptured(null)} style={styles.momentSecondary}><Ionicons name="refresh" size={20} color="#fff" /></Pressable> : <Pressable onPress={snap} style={styles.shutter}><View style={styles.shutterInner} /></Pressable>}<Pressable onPress={post} style={styles.momentPost}><Ionicons name="arrow-up" size={22} color="#111318" /></Pressable></View></SafeAreaView></View></Modal>;
}

function MomentViewerModal({ visible, onClose, theme, moment, owner }) {
  if (!moment || !owner) return null;
  return <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}><View style={styles.momentViewer}><SafeAreaView style={styles.flexOne}><View style={styles.momentViewerHeader}><View style={styles.chatHeaderPerson}><Avatar person={owner} size={38} theme={dark} /><View><Text style={{ color: '#fff', fontWeight: '800' }}>{owner.name}</Text><Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 10 }}>Moment · today</Text></View></View><Pressable onPress={onClose} style={styles.scannerClose}><Ionicons name="close" size={24} color="#fff" /></Pressable></View><View style={styles.momentViewerContent}>{moment.imageUri ? <Image source={{ uri: moment.imageUri }} style={styles.momentViewerImage} resizeMode="cover" /> : <><Text style={styles.momentEmoji}>{moment.emoji || '✨'}</Text><Text style={styles.momentBigCaption}>{moment.caption}</Text></>}</View>{moment.imageUri ? <View style={styles.momentCaptionOverlay}><Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{moment.caption}</Text></View> : null}</SafeAreaView></View></Modal>;
}

function TabBar({ tab, setTab, theme }) {
  const items = [['home', 'home-outline'], ['people', 'people-outline'], ['link', 'add'], ['chats', 'chatbubble-ellipses-outline'], ['profile', 'person-outline']];
  return <View style={[styles.tabBar, { backgroundColor: theme.tab, borderTopColor: theme.border }]}>{items.map(([key, icon]) => { const active = tab === key; const center = key === 'link'; return <Pressable key={key} onPress={() => setTab(key)} style={styles.tabItem}><View style={center ? [styles.centerTab, { backgroundColor: active ? ACCENT : theme.inverse }] : null}><Ionicons name={active && !center ? icon.replace('-outline', '') : icon} size={center ? 26 : 23} color={center ? '#fff' : active ? theme.text : theme.sub} /></View>{!center ? <View style={[styles.tabDot, { backgroundColor: active ? ACCENT : 'transparent' }]} /> : null}</Pressable>; })}</View>;
}

export default function App() {
  const systemScheme = useColorScheme();
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState(initialData());
  const [tab, setTab] = useState('home');
  const [activeChatId, setActiveChatId] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [profileModalId, setProfileModalId] = useState(null);
  const [momentComposerOpen, setMomentComposerOpen] = useState(false);
  const [momentViewId, setMomentViewId] = useState(null);

  const activeMode = data.themeSetting === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : data.themeSetting;
  const theme = activeMode === 'dark' ? dark : light;
  const activeProfile = data.profiles[data.activeAccountId];
  const localProfiles = data.localAccountIds.map(id => data.profiles[id]).filter(Boolean);
  const connectedIds = data.relationships[data.activeAccountId] || [];
  const connectedProfiles = connectedIds.map(id => data.profiles[id]).filter(Boolean);
  const incomingRequests = data.requests.filter(r => r.toId === data.activeAccountId);
  const privacy = data.privacy[data.activeAccountId] || { showStatus: true, showSocials: true, momentsToLinks: true };
  const activeChatPerson = activeChatId ? data.profiles[activeChatId] : null;
  const activeMessages = activeChatId ? data.conversations[threadKey(data.activeAccountId, activeChatId)] || [] : [];
  const profileModalPerson = profileModalId ? data.profiles[profileModalId] : null;
  const momentView = momentViewId ? data.moments.find(m => m.id === momentViewId) : null;

  const payload = useMemo(() => {
    if (!activeProfile) return 'LINK::invalid';
    return `LINK::${encodeURIComponent(JSON.stringify({ v: 2, id: activeProfile.id, name: activeProfile.name, username: activeProfile.username, bio: activeProfile.bio, status: activeProfile.status }))}`;
  }, [activeProfile]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved?.version === 2 && saved?.profiles && saved?.activeAccountId) setData(saved);
        }
      } catch (e) { console.warn('LINK storage load failed', e); }
      finally { setHydrated(true); }
    })();
  }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {}); }, [hydrated, data]);

  const mutate = (fn) => setData(prev => fn(prev));
  const notify = (draft, accountId, item) => {
    draft.notifications = { ...draft.notifications, [accountId]: [{ id: uid('n'), time: nowTime(), read: false, ...item }, ...(draft.notifications[accountId] || [])] };
    return draft;
  };

  const switchAccount = (id) => {
    setActiveChatId(null); setTab('home'); setAccountsOpen(false);
    mutate(prev => ({ ...prev, activeAccountId: id }));
  };

  const createLocalAccount = (profile) => {
    const id = uid('local');
    const newProfile = { id, isLocal: true, socials: { instagram: profile.username, spotify: profile.name }, ...profile };
    mutate(prev => ({
      ...prev,
      activeAccountId: id,
      localAccountIds: [...prev.localAccountIds, id],
      profiles: { ...prev.profiles, [id]: newProfile },
      relationships: { ...prev.relationships, [id]: [] },
      notifications: { ...prev.notifications, [id]: [] },
      privacy: { ...prev.privacy, [id]: { showStatus: true, showSocials: true, momentsToLinks: true } },
    }));
    setCreateAccountOpen(false); setAccountsOpen(false); setTab('home');
  };

  const updateActiveProfile = (next) => mutate(prev => ({ ...prev, profiles: { ...prev.profiles, [prev.activeAccountId]: { ...next, id: prev.activeAccountId, isLocal: true } } }));
  const setThemeSetting = (themeSetting) => mutate(prev => ({ ...prev, themeSetting }));
  const setPrivacy = (next) => mutate(prev => ({ ...prev, privacy: { ...prev.privacy, [prev.activeAccountId]: next } }));

  const sendRequest = (toId) => {
    if (!toId || toId === data.activeAccountId || connectedIds.includes(toId)) return;
    const already = data.requests.some(r => (r.fromId === data.activeAccountId && r.toId === toId) || (r.fromId === toId && r.toId === data.activeAccountId));
    if (already) return Alert.alert('Request already exists', 'Switch to the other account to accept an incoming request.');
    mutate(prev => {
      const next = { ...prev, requests: [...prev.requests, { id: uid('req'), fromId: prev.activeAccountId, toId, createdAt: `Today, ${nowTime()}` }] };
      return notify(next, toId, { type: 'request', title: 'New LINK request', body: `${prev.profiles[prev.activeAccountId].name} wants to LINK with you.` });
    });
    Alert.alert('LINK request sent', data.profiles[toId]?.isLocal ? `Switch to ${data.profiles[toId].name} to accept it.` : 'The request will unlock chat after acceptance.');
  };

  const acceptRequest = (request) => {
    mutate(prev => {
      const from = request.fromId, to = request.toId;
      const nextRel = { ...prev.relationships };
      nextRel[from] = Array.from(new Set([...(nextRel[from] || []), to]));
      nextRel[to] = Array.from(new Set([...(nextRel[to] || []), from]));
      let next = { ...prev, relationships: nextRel, requests: prev.requests.filter(r => r.id !== request.id) };
      next = notify(next, from, { type: 'accepted', title: 'LINK accepted', body: `${prev.profiles[to].name} accepted your LINK request.` });
      return next;
    });
  };
  const declineRequest = (id) => mutate(prev => ({ ...prev, requests: prev.requests.filter(r => r.id !== id) }));

  const onScanned = (raw) => {
    try {
      if (!String(raw).startsWith('LINK::')) throw new Error('format');
      const incoming = JSON.parse(decodeURIComponent(String(raw).slice(6)));
      if (!incoming?.id || !incoming?.name) throw new Error('invalid');
      if (incoming.id === data.activeAccountId) return Alert.alert('That’s you', 'Scan someone else’s LINK Card.');
      mutate(prev => {
        const profiles = prev.profiles[incoming.id] ? prev.profiles : { ...prev.profiles, [incoming.id]: { ...incoming, isLocal: false, socials: { instagram: incoming.username, spotify: incoming.name } } };
        return { ...prev, profiles };
      });
      setScannerOpen(false);
      setTimeout(() => sendRequest(incoming.id), 60);
    } catch { Alert.alert('Not a LINK card', 'Try scanning a QR generated inside LINK.'); }
  };

  const openChat = (person) => {
    if (!(data.relationships[data.activeAccountId] || []).includes(person.id)) return Alert.alert('LINK first', 'Chat unlocks after both people accept the LINK.');
    setActiveChatId(person.id);
  };

  const markRead = () => {
    if (!activeChatId) return;
    const key = threadKey(data.activeAccountId, activeChatId);
    mutate(prev => ({ ...prev, conversations: { ...prev.conversations, [key]: (prev.conversations[key] || []).map(m => ({ ...m, readBy: Array.from(new Set([...(m.readBy || []), prev.activeAccountId])) })) } }));
  };

  const sendMessage = (personId, payload) => {
    const key = threadKey(data.activeAccountId, personId);
    mutate(prev => {
      const msg = { id: uid('m'), senderId: prev.activeAccountId, type: payload.type || 'text', text: payload.text || '', uri: payload.uri, duration: payload.duration, replyTo: payload.replyTo || null, time: nowTime(), readBy: [prev.activeAccountId], reactions: [] };
      let next = { ...prev, conversations: { ...prev.conversations, [key]: [...(prev.conversations[key] || []), msg] } };
      if (prev.profiles[personId]?.isLocal) next = notify(next, personId, { type: 'message', title: prev.profiles[prev.activeAccountId].name, body: msg.type === 'text' ? msg.text : msg.type === 'photo' ? '📷 Photo' : '🎙 Voice message' });
      return next;
    });
  };

  const reactMessage = (personId, messageId, emoji) => {
    const key = threadKey(data.activeAccountId, personId);
    mutate(prev => ({ ...prev, conversations: { ...prev.conversations, [key]: (prev.conversations[key] || []).map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []).filter(r => r.userId !== prev.activeAccountId), { userId: prev.activeAccountId, emoji }] } : m) } }));
  };
  const deleteMessage = (personId, messageId) => {
    const key = threadKey(data.activeAccountId, personId);
    mutate(prev => ({ ...prev, conversations: { ...prev.conversations, [key]: (prev.conversations[key] || []).filter(m => !(m.id === messageId && m.senderId === prev.activeAccountId)) } }));
  };

  const postMoment = ({ imageUri, caption, emoji }) => {
    mutate(prev => ({ ...prev, moments: [{ id: uid('mom'), ownerId: prev.activeAccountId, imageUri, caption, emoji, createdAt: Date.now() }, ...prev.moments] }));
  };
  const markNotificationsRead = () => mutate(prev => ({ ...prev, notifications: { ...prev.notifications, [prev.activeAccountId]: (prev.notifications[prev.activeAccountId] || []).map(n => ({ ...n, read: true })) } }));

  const resetDemo = () => Alert.alert('Reset LINK 0.2?', 'This clears all local accounts, requests, Moments and chats.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reset', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(STORAGE_KEY); setData(initialData()); setActiveChatId(null); setTab('home'); } }]);

  if (!hydrated || !activeProfile) return <View style={[styles.loading, { backgroundColor: light.bg }]}><View style={styles.loadingLogo}><Text style={styles.loadingLogoText}>L*</Text></View><Text style={{ fontWeight: '900', color: light.text, fontSize: 17 }}>LINK</Text><Text style={{ color: light.sub, fontSize: 12 }}>{BUILD}</Text></View>;

  if (activeChatPerson) return <><RNStatusBar barStyle={activeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} /><ChatScreen theme={theme} activeProfile={activeProfile} person={activeChatPerson} messages={activeMessages} profiles={data.profiles} onBack={() => setActiveChatId(null)} onSend={sendMessage} onReact={reactMessage} onDelete={deleteMessage} onOpenProfile={p => setProfileModalId(p.id)} markRead={markRead} /><PersonProfileModal visible={!!profileModalId} onClose={() => setProfileModalId(null)} theme={theme} person={profileModalPerson} connected={(data.relationships[data.activeAccountId] || []).includes(profileModalId)} privacy={profileModalPerson?.isLocal ? data.privacy[profileModalId] : { showStatus: true, showSocials: true }} onChat={() => profileModalPerson && openChat(profileModalPerson)} /></>;

  return (
    <View style={[styles.app, { backgroundColor: theme.bg }]}>
      <RNStatusBar barStyle={activeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <SafeAreaView style={styles.safe}><View style={styles.content}>
        {tab === 'home' && <HomeScreen theme={theme} activeProfile={activeProfile} connectedProfiles={connectedProfiles} conversations={data.conversations} activeId={data.activeAccountId} requests={incomingRequests} notifications={data.notifications} moments={data.moments} profiles={data.profiles} openOwnCard={() => setCardOpen(true)} openScanner={() => setScannerOpen(true)} openChat={openChat} openAccountSwitcher={() => setAccountsOpen(true)} openNotifications={() => setNotificationsOpen(true)} onAccept={acceptRequest} onDecline={declineRequest} onCreateMoment={() => setMomentComposerOpen(true)} onOpenMoment={m => setMomentViewId(m.id)} setTab={setTab} />}
        {tab === 'people' && <PeopleScreen theme={theme} activeId={data.activeAccountId} profiles={data.profiles} connectedIds={connectedIds} localAccountIds={data.localAccountIds} requests={data.requests} openProfile={p => setProfileModalId(p.id)} openChat={openChat} sendRequest={sendRequest} />}
        {tab === 'link' && <LinkScreen theme={theme} activeProfile={activeProfile} payload={payload} localProfiles={localProfiles} relationships={data.relationships} requests={data.requests} openScanner={() => setScannerOpen(true)} openOwnCard={() => setCardOpen(true)} sendRequest={sendRequest} />}
        {tab === 'chats' && <ChatsScreen theme={theme} activeId={data.activeAccountId} profiles={data.profiles} connectedIds={connectedIds} conversations={data.conversations} openChat={openChat} />}
        {tab === 'profile' && <ProfileScreen theme={theme} activeProfile={activeProfile} updateProfile={updateActiveProfile} themeSetting={data.themeSetting} setThemeSetting={setThemeSetting} privacy={privacy} setPrivacy={setPrivacy} openAccountSwitcher={() => setAccountsOpen(true)} resetDemo={resetDemo} />}
      </View><TabBar tab={tab} setTab={setTab} theme={theme} /></SafeAreaView>

      <ScannerModal visible={scannerOpen} onClose={() => setScannerOpen(false)} onScanned={onScanned} />
      <OwnCardModal visible={cardOpen} onClose={() => setCardOpen(false)} theme={theme} profile={activeProfile} payload={payload} />
      <NotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} theme={theme} items={data.notifications[data.activeAccountId] || []} markAllRead={markNotificationsRead} />
      <AccountSwitcherModal visible={accountsOpen} onClose={() => setAccountsOpen(false)} theme={theme} localProfiles={localProfiles} activeId={data.activeAccountId} onSwitch={switchAccount} onCreate={() => { setAccountsOpen(false); setCreateAccountOpen(true); }} />
      <CreateAccountModal visible={createAccountOpen} onClose={() => setCreateAccountOpen(false)} theme={theme} onCreate={createLocalAccount} existingProfiles={data.profiles} />
      <PersonProfileModal visible={!!profileModalId} onClose={() => setProfileModalId(null)} theme={theme} person={profileModalPerson} connected={(data.relationships[data.activeAccountId] || []).includes(profileModalId)} privacy={profileModalPerson?.isLocal ? data.privacy[profileModalId] : { showStatus: true, showSocials: true }} onChat={() => profileModalPerson && openChat(profileModalPerson)} onSendRequest={() => profileModalId && sendRequest(profileModalId)} />
      <MomentComposerModal visible={momentComposerOpen} onClose={() => setMomentComposerOpen(false)} theme={theme} activeProfile={activeProfile} onPost={postMoment} />
      <MomentViewerModal visible={!!momentViewId} onClose={() => setMomentViewId(null)} theme={theme} moment={momentView} owner={momentView ? data.profiles[momentView.ownerId] : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 }, app: { flex: 1 }, safe: { flex: 1 }, content: { flex: 1 },
  screenScroll: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 120 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  simpleHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  bigTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1.2 }, headerSub: { fontSize: 13.5, marginTop: 4 },
  eyebrow: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1.1 },
  accountChip: { maxWidth: 220, borderRadius: 18, padding: 7, paddingRight: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountChipName: { fontSize: 13.5, fontWeight: '900', maxWidth: 110 }, accountChipUser: { fontSize: 10.5, marginTop: 1, maxWidth: 110 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { position: 'absolute', right: -3, top: -3, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: '#fff' }, iconBadgeText: { color: '#fff', fontSize: 8.5, fontWeight: '900' },
  heroCard: { borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 20, marginBottom: 18 },
  heroHeadline: { fontSize: 34, lineHeight: 35, fontWeight: '900', letterSpacing: -1.5, marginTop: 24 },
  heroBody: { fontSize: 14, lineHeight: 20, marginTop: 10, maxWidth: 330 }, heroActions: { flexDirection: 'row', gap: 9, marginTop: 22 },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { fontWeight: '900', fontSize: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' }, pillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: .35 },
  sectionTitleRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 10 }, sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -.4 },
  momentStrip: { gap: 12, paddingBottom: 10 }, momentItem: { width: 70, alignItems: 'center' }, momentRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, momentPlus: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }, momentName: { fontSize: 10, marginTop: 6, maxWidth: 68 },
  requestCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 12, flexDirection: 'row', gap: 12, marginBottom: 9 }, requestActions: { flexDirection: 'row', gap: 7, marginTop: 10 }, requestAccept: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 11 }, requestDecline: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 11 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 17, marginBottom: 16 }, statCard: { flex: 1, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 16 }, statNumber: { fontSize: 24, fontWeight: '900', letterSpacing: -.8 }, statLabel: { fontSize: 12.5, marginTop: 2 },
  personRow: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 }, personName: { fontSize: 15.5, fontWeight: '900' }, personSub: { fontSize: 12.5, marginTop: 4 }, miniChatButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, metaText: { fontSize: 10.5, marginLeft: 8 },
  unreadDot: { position: 'absolute', right: 0, top: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: ACCENT, borderWidth: 2, borderColor: '#fff' }, unreadCount: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }, unreadCountText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  localLabCard: { marginTop: 19, borderRadius: 26, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18 }, eventTitle: { fontSize: 23, fontWeight: '900', letterSpacing: -.7, marginTop: 6 }, eventBody: { fontSize: 13, lineHeight: 19, marginTop: 7 }, eventIcon: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchBox: { marginHorizontal: 18, height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9, marginBottom: 7 }, searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 }, listPad: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 120 }, emptyInline: { fontSize: 12.5, paddingVertical: 16 },
  discoverRow: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 }, linkRequestButton: { minWidth: 62, paddingHorizontal: 12, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkCard: { width: '100%', borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 20, alignItems: 'center' }, linkCardTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, linkBrand: { fontSize: 22, fontWeight: '900', letterSpacing: -.8 }, cardHint: { fontSize: 11, marginTop: 2 }, qrWrap: { padding: 14, borderRadius: 24, marginTop: 22 }, linkName: { fontSize: 25, fontWeight: '900', letterSpacing: -.7, marginTop: 17 }, linkUsername: { fontSize: 14, marginTop: 4 }, linkCardPills: { flexDirection: 'row', gap: 7, marginTop: 15, marginBottom: 2 },
  widePrimary: { width: '100%', height: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 16 }, wideSecondary: { width: '100%', height: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10 },
  labHint: { width: '100%', fontSize: 12, lineHeight: 17, marginBottom: 10 }, labAccountRow: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }, smallAction: { minHeight: 34, borderRadius: 11, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  chatRow: { flexDirection: 'row', gap: 12, paddingVertical: 13, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth }, chatPreview: { fontSize: 13.5, marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 70, paddingHorizontal: 34 }, emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 14 }, emptyBody: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  profileCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 28, padding: 22, alignItems: 'center', marginBottom: 12 }, profileName: { fontSize: 24, fontWeight: '900', marginTop: 14, letterSpacing: -.7 }, profileUser: { fontSize: 14, marginTop: 3 }, profileBio: { fontSize: 13.5, marginTop: 10, marginBottom: 12, textAlign: 'center' }, profileInput: { width: '100%', minHeight: 46, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
  statusRow: { gap: 8, paddingBottom: 4 }, statusChoice: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14 },
  accountManagerButton: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  themeRow: { flexDirection: 'row', gap: 8 }, themeOption: { flex: 1, minHeight: 48, borderRadius: 16, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, settingHint: { fontSize: 12, lineHeight: 18, marginTop: 9, marginBottom: 4 },
  settingsCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, overflow: 'hidden' }, settingsRow: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14 }, settingsIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, settingsTitle: { fontWeight: '900', fontSize: 14 }, settingsSub: { fontSize: 11.5, lineHeight: 16, marginTop: 2 }, resetButton: { marginTop: 22, marginBottom: 18, height: 48, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  tabBar: { height: 78, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 14 : 6, paddingHorizontal: 6 }, tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 58 }, centerTab: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -6 }] }, tabDot: { width: 4, height: 4, borderRadius: 2, marginTop: 5 },
  chatHeader: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth }, chatHeaderPerson: { flexDirection: 'row', gap: 9, alignItems: 'center' }, chatHeaderName: { fontWeight: '900', fontSize: 14.5 }, chatHeaderStatus: { fontSize: 10.5, marginTop: 2, fontWeight: '800' }, metContext: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, marginTop: 10 }, metContextText: { fontSize: 10.5, fontWeight: '700' },
  messageList: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18, flexGrow: 1 }, messageLine: { flexDirection: 'row', marginVertical: 5 }, bubble: { maxWidth: '82%', borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7 }, bubbleText: { fontSize: 15, lineHeight: 20 }, messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 5 }, bubbleTime: { fontSize: 9 }, replyQuote: { borderLeftWidth: 2, paddingLeft: 7, marginBottom: 7, maxWidth: 220 }, reactionBadge: { position: 'absolute', bottom: -13, right: 8, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, shadowColor: '#000', shadowOpacity: .08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  photoMessage: { width: 190, height: 145, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, photoMessageImage: { width: '100%', height: '100%' }, voiceMessage: { width: 190, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 }, typingLine: { paddingHorizontal: 16, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', gap: 7 }, typingBubble: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14 }, replyComposerBar: { marginHorizontal: 10, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  composerWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', padding: 10, borderTopWidth: StyleSheet.hairlineWidth }, plusButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, composer: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 18, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 13, paddingRight: 5, paddingVertical: 5 }, composerInput: { flex: 1, fontSize: 15, maxHeight: 100, paddingTop: 7, paddingBottom: 7 }, sendButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
  scannerPage: { flex: 1, backgroundColor: '#08090C' }, scannerHeader: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, scannerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -.8 }, scannerSub: { color: 'rgba(255,255,255,.58)', marginTop: 3, fontSize: 13 }, scannerClose: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }, cameraShell: { flex: 1, marginHorizontal: 14, borderRadius: 30, overflow: 'hidden', backgroundColor: '#15171C', alignItems: 'center', justifyContent: 'center' }, scanFrame: { position: 'absolute', width: 250, height: 250 }, corner: { position: 'absolute', width: 40, height: 40, borderColor: '#fff' }, cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 }, cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 }, cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 }, cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 }, scannerFoot: { color: 'rgba(255,255,255,.56)', textAlign: 'center', fontSize: 12, paddingVertical: 14 }, scanAgainButton: { alignSelf: 'center', marginBottom: 10, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,.14)', borderRadius: 14 }, permissionState: { alignItems: 'center', paddingHorizontal: 34 }, permissionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 15 }, permissionBody: { color: 'rgba(255,255,255,.58)', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 7 }, permissionButton: { backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 15, marginTop: 17 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.62)', alignItems: 'center', justifyContent: 'center', padding: 18 }, ownCardModal: { width: '100%', maxWidth: 420, borderRadius: 30, padding: 20 }, qrWrapLarge: { alignSelf: 'center', padding: 15, borderRadius: 25, marginTop: 24 }, modalCardName: { fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 18, letterSpacing: -.7 }, modalCardUser: { fontSize: 14, textAlign: 'center', marginTop: 3 }, modalCardHint: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 28, marginTop: 13, marginBottom: 4 },
  sheetCard: { width: '100%', maxWidth: 440, borderRadius: 28, padding: 18, maxHeight: '82%' }, sheetTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -.7 }, sheetSub: { fontSize: 12, marginTop: 3 }, notificationRow: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 }, notificationIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  accountSwitchRow: { minHeight: 62, borderRadius: 17, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 5 }, createAccountButton: { minHeight: 50, borderRadius: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, tinyHint: { textAlign: 'center', fontSize: 10.5, lineHeight: 15, marginTop: 12 },
  profileModal: { width: '100%', maxWidth: 420, borderRadius: 30, padding: 20, alignItems: 'center' }, socialBox: { width: '100%', borderRadius: 18, padding: 13, marginTop: 16, gap: 12 }, socialLine: { flexDirection: 'row', alignItems: 'center', gap: 9 }, safetyButton: { width: '100%', height: 46, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  momentComposerPage: { flex: 1 }, momentCameraShell: { flex: 1, marginHorizontal: 12, borderRadius: 30, overflow: 'hidden', backgroundColor: '#15171C', alignItems: 'center', justifyContent: 'center' }, momentComposerBottom: { minHeight: 88, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, momentCaptionInput: { flex: 1, minHeight: 48, borderRadius: 16, paddingHorizontal: 14, color: '#fff', backgroundColor: 'rgba(255,255,255,.1)' }, shutter: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }, shutterInner: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff' }, momentPost: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, momentSecondary: { width: 50, height: 50, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  momentViewer: { flex: 1, backgroundColor: '#08090C' }, momentViewerHeader: { minHeight: 68, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, momentViewerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, momentViewerImage: { width: '100%', height: '100%', borderRadius: 28 }, momentEmoji: { fontSize: 96 }, momentBigCaption: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 22 }, momentCaptionOverlay: { position: 'absolute', bottom: 50, left: 24, right: 24, backgroundColor: 'rgba(0,0,0,.34)', borderRadius: 18, padding: 14 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9 }, loadingLogo: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT }, loadingLogoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
});
