import React, {
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';
import { API_URL } from '../config';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowUp,
  MessageCircle,
  LockKeyhole,
  CheckCircle2,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';
import axios from 'axios';
import io from 'socket.io-client';

import { AuthContext } from '../context/AuthContext';

const API = API_URL;

const C = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  muted: '#96939F',
  purple: '#6456B8',
  lavender: '#EEE7F7',
  mint: '#E7F0E5',
  green: '#507B60',
  amber: '#976D30',
  border: '#E1DFE7',
  white: '#FFFFFF',
};

const SoftBackground = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;

        setSize(previous =>
          previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFillObject}
        >
          <Defs>
            <LinearGradient
              id="issueChatBackground"
              x1="0%"
              y1="0%"
              x2="90%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#EEE7F8" />
              <Stop offset="34%" stopColor="#FAFAF7" />
              <Stop offset="76%" stopColor="#FAFAF7" />
              <Stop offset="100%" stopColor="#EAF1E7" />
            </LinearGradient>
          </Defs>

          <Rect
            width={size.width}
            height={size.height}
            fill="url(#issueChatBackground)"
          />
        </Svg>
      ) : null}
    </View>
  );
};

const ConversationIllustration = () => (
  <Svg
    width={142}
    height={112}
    viewBox="0 0 142 112"
    accessible={false}
  >
    <Circle cx="69" cy="53" r="43" fill="#F0EBF6" />

    <Path
      d="M25 89C39 103 67 102 83 89"
      fill="none"
      stroke="#C4B8D8"
      strokeWidth="1.5"
      strokeDasharray="3 5"
      strokeLinecap="round"
    />

    <Rect
      x="26"
      y="22"
      width="66"
      height="45"
      rx="15"
      fill="#FFFFFF"
      stroke="#DDD3EB"
      strokeWidth="1.4"
    />

    <Path
      d="M39 66L36 77L52 67"
      fill="#FFFFFF"
      stroke="#DDD3EB"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    <Path
      d="M42 38H74M42 48H64"
      stroke="#B5A4D1"
      strokeWidth="3"
      strokeLinecap="round"
    />

    <Rect
      x="68"
      y="51"
      width="48"
      height="34"
      rx="12"
      fill="#E1EBDD"
      stroke="#CCDCC7"
      strokeWidth="1.4"
    />

    <Path
      d="M101 84L108 92L107 81"
      fill="#E1EBDD"
      stroke="#CCDCC7"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    <Circle cx="82" cy="68" r="2" fill="#77936E" />
    <Circle cx="92" cy="68" r="2" fill="#77936E" />
    <Circle cx="102" cy="68" r="2" fill="#77936E" />

    <Circle cx="111" cy="24" r="4" fill="#D8E6D2" />
    <Circle cx="19" cy="59" r="3" fill="#D5C7E7" />
  </Svg>
);

const getDateLabel = value => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== today.getFullYear()
      ? { year: 'numeric' }
      : {}),
  });
};

const getTimeLabel = value => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const IssueChatScreen = ({ route, navigation }) => {
  const { incidentId, assignee, title, status } = route.params;
  const { userToken, userData } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState(null);

  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  const isReadOnly =
    status === 'Resolved' && userData?.role !== 'admin';

  const hasText = Boolean(inputText.trim());

  const statusColor =
    status === 'Resolved'
      ? C.green
      : status === 'In Progress'
        ? C.purple
        : C.amber;

  useEffect(() => {
    fetchConversationAndMessages();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit(
          'leave_conversation',
          conversation?._id,
        );
        socketRef.current.disconnect();
      }
    };
  }, []);

  const setupSocket = () => {
    socketRef.current = io(API.replace('/api/v1', ''), {
      query: { token: userToken },
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('new_message', msg => {
      setMessages(prev => {
        if (
          prev.find(
            m =>
              m._id === msg._id ||
              (m.clientMessageId &&
                m.clientMessageId === msg.clientMessageId),
          )
        ) {
          return prev;
        }

        return [msg, ...prev];
      });
    });
  };

  const fetchConversationAndMessages = async () => {
    try {
      const convRes = await axios.get(
        `${API}/incidents/${incidentId}/conversation`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );

      setConversation(convRes.data);

      if (socketRef.current) {
        socketRef.current.emit(
          'join_conversation',
          convRes.data._id,
        );
      }

      const msgRes = await axios.get(
        `${API}/incidents/${incidentId}/messages`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );

      setMessages(msgRes.data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 403) {
        Alert.alert(
          'Unauthorized',
          "You don't have access to this conversation.",
        );
        navigation.goBack();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    if (status === 'Resolved' && userData.role !== 'admin') {
      Alert.alert('Resolved', 'This conversation is read-only.');
      return;
    }

    const clientMsgId = Date.now().toString();

    const tempMsg = {
      _id: clientMsgId,
      text: inputText,
      senderId: { _id: userData._id || userData.userId },
      createdAt: new Date().toISOString(),
      clientMessageId: clientMsgId,
    };

    setMessages([tempMsg, ...messages]);

    const textToSend = inputText;
    setInputText('');

    try {
      const res = await axios.post(
        `${API}/incidents/${incidentId}/messages`,
        { text: textToSend, clientMessageId: clientMsgId },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );

      setMessages(prev =>
        prev.map(m =>
          m.clientMessageId === clientMsgId ? res.data : m,
        ),
      );
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Error',
        'Failed to send message. Please try again.',
      );
    }
  };

  const renderMessage = ({ item, index }) => {
    const senderId =
      typeof item.senderId === 'object'
        ? item.senderId?._id
        : item.senderId;

    const currentUserId = userData?._id || userData?.userId;
    const isMe =
      Boolean(senderId && currentUserId) &&
      String(senderId) === String(currentUserId);

    const olderMessage = messages[index + 1];
    const dateLabel = getDateLabel(item.createdAt);

    const showDate =
      !olderMessage ||
      new Date(item.createdAt).toDateString() !==
        new Date(olderMessage.createdAt).toDateString();

    const senderName =
      typeof item.senderId === 'object'
        ? item.senderId?.name
        : null;

    return (
      <View>
        {showDate && dateLabel ? (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            <View style={styles.dateLine} />
          </View>
        ) : null}

        <View
          style={[
            styles.messageRow,
            isMe ? styles.outgoingRow : styles.incomingRow,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.myMessage : styles.otherMessage,
            ]}
          >
            {!isMe && senderName ? (
              <Text style={styles.senderName}>{senderName}</Text>
            ) : null}

            {item.type === 'image' && item.photo ? (
              <Image
                source={{ uri: item.photo }}
                style={styles.messagePhoto}
                resizeMode="cover"
                accessibilityLabel="Message attachment"
              />
            ) : null}

            {item.text ? (
              <Text style={styles.messageText}>{item.text}</Text>
            ) : null}

            <Text
              style={[
                styles.timeText,
                isMe && styles.outgoingTime,
              ]}
            >
              {getTimeLabel(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SoftBackground />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.eyebrow}>CAMPUS TRAIL</Text>
          <Text style={styles.headerTitle}>Conversation</Text>
        </View>

        <View style={styles.headerIcon}>
          <MessageCircle
            size={21}
            color={C.purple}
            strokeWidth={1.6}
          />
        </View>
      </View>

      <View style={styles.issueContext}>
        <View style={styles.issueTopRow}>
          <Text style={styles.contextLabel}>ABOUT THIS ISSUE</Text>

          <View style={styles.statusWrap}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: statusColor },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        <Text style={styles.issueTitle} numberOfLines={2}>
          {title || 'Issue conversation'}
        </Text>

        <View style={styles.assigneeRow}>
          {assignee?.profilePhoto ? (
            <Image
              source={{ uri: assignee.profilePhoto }}
              style={styles.assigneeAvatar}
            />
          ) : (
            <View style={styles.assigneePlaceholder}>
              <Text style={styles.assigneeInitial}>
                {assignee?.name?.charAt(0)?.toUpperCase() || '—'}
              </Text>
            </View>
          )}

          <Text style={styles.assigneeText} numberOfLines={1}>
            {assignee
              ? `Assigned to ${assignee.name || 'staff'}`
              : 'Awaiting staff assignment'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={C.purple} />
          <Text style={styles.loadingText}>
            Opening your conversation…
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ConversationIllustration />

          <Text style={styles.emptyTitle}>
            A little detail helps.
          </Text>

          <Text style={styles.emptyText}>
            {isReadOnly
              ? 'No messages were exchanged for this issue.'
              : 'Use this space to clarify the issue\nand keep the next steps clear.'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.list}
          data={messages}
          keyExtractor={item => String(item._id)}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
        />
      )}

      {isReadOnly ? (
        <View
          style={[
            styles.readOnlyContainer,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <View style={styles.resolvedIcon}>
            <CheckCircle2
              size={22}
              color={C.green}
              strokeWidth={1.7}
            />
          </View>

          <View style={styles.readOnlyCopy}>
            <Text style={styles.readOnlyTitle}>
              Another step completed.
            </Text>
            <Text style={styles.readOnlyText}>
              This issue is resolved. You can still read the conversation.
            </Text>
          </View>

          <LockKeyhole size={16} color={C.green} strokeWidth={1.7} />
        </View>
      ) : (
        <View
          style={[
            styles.composerContainer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.composerShell}>
            <TextInput
              style={styles.input}
              placeholder="Write a message…"
              placeholderTextColor={C.muted}
              selectionColor={C.purple}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Message"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !hasText && styles.sendButtonInactive,
              ]}
              onPress={sendMessage}
              disabled={!hasText}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !hasText }}
            >
              <ArrowUp
                size={21}
                color={hasText ? C.white : '#A69ABF'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.composerHint}>
            A clearer conversation. A better next step.
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
    color: C.purple,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 21,
    letterSpacing: -0.6,
    fontWeight: '600',
    color: C.text,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  issueContext: {
    marginHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D9D3E3',
  },
  issueTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contextLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: C.secondary,
    marginRight: 12,
    marginVertical: 3,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  issueTitle: {
    color: C.text,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.3,
    fontWeight: '500',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 9,
    marginRight: 8,
  },
  assigneePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 9,
    marginRight: 8,
    backgroundColor: '#E5DDF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitial: {
    color: C.purple,
    fontSize: 10,
    fontWeight: '600',
  },
  assigneeText: {
    flex: 1,
    color: C.secondary,
    fontSize: 12,
    lineHeight: 18,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 22,
  },
  dateLine: {
    width: 28,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DAD5E2',
  },
  dateLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginHorizontal: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  outgoingRow: {
    justifyContent: 'flex-end',
  },
  incomingRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    minWidth: 76,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 9,
    borderRadius: 20,
  },
  myMessage: {
    backgroundColor: '#EAE2F4',
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E0E9',
    borderBottomLeftRadius: 6,
  },
  senderName: {
    fontSize: 10,
    fontWeight: '600',
    color: C.purple,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
    color: C.text,
  },
  messagePhoto: {
    width: 190,
    maxWidth: '100%',
    height: 190,
    borderRadius: 12,
    backgroundColor: C.border,
    marginBottom: 7,
  },
  timeText: {
    color: C.muted,
    fontSize: 9,
    lineHeight: 13,
    alignSelf: 'flex-end',
    marginTop: 7,
  },
  outgoingTime: {
    color: '#8B7F9E',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: C.secondary,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '500',
    letterSpacing: -0.6,
    color: C.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 21,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 9,
  },

  composerContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: 'rgba(250,250,247,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E0E8',
  },
  composerShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#E4DEEB',
    borderRadius: 25,
    padding: 6,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: 22,
    color: C.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  sendButtonInactive: {
    backgroundColor: '#F0EAF6',
  },
  composerHint: {
    textAlign: 'center',
    color: C.muted,
    fontSize: 9,
    letterSpacing: 0.2,
    marginTop: 9,
    marginBottom: 2,
  },

  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 17,
    backgroundColor: '#EEF3EA',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9E3D4',
  },
  resolvedIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#E0EADB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  readOnlyCopy: {
    flex: 1,
    marginRight: 10,
  },
  readOnlyTitle: {
    color: C.green,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  readOnlyText: {
    color: '#778472',
    fontSize: 11,
    lineHeight: 17,
  },
});

export default IssueChatScreen;