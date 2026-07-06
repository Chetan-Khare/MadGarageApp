import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, TextInput, FlatList, Image, 
  Dimensions, StatusBar, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  sender: 'USER' | 'AI';
  imageUrl?: string;
  createdAt: string;
}

export default function AdminChatAuditScreen({ navigation }: any) {
  const { isDark } = useThemeStore();
  const insets = useSafeAreaInsets();
  
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [originalUsers, setOriginalUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'RECENT' | 'A-Z' | 'Z-A'>('RECENT');

  const scrollRef = useRef<ScrollView>(null);

  const bgPrimary = isDark ? '#000000' : '#F0F1F3';
  const bgSecondary = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#B0B0C0' : '#55555C';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    fetchChatUsers();
  }, []);

  const fetchChatUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/assistant/admin/users');
      setUsers(response.data);
      setOriginalUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch chatting users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (user: ChatUser) => {
    setSelectedUser(user);
    setViewMode('chat');
    setChatLoading(true);
    try {
      const response = await apiClient.get(`/assistant/admin/history/${user.id}`);
      // Handle Spring Page DTO ({ content: [...] }) or plain array
      const data = response.data?.content ?? response.data;
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch user history:", error);
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredUsers = (sortOrder === 'RECENT' ? originalUsers : users).filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortOrder === 'A-Z') return (a.fullName || '').localeCompare(b.fullName || '');
    if (sortOrder === 'Z-A') return (b.fullName || '').localeCompare(a.fullName || '');
    return 0;
  });

  const renderUserItem = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity 
      style={[styles.userItem, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}
      onPress={() => fetchUserHistory(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        <Ionicons name="person-outline" size={20} color="#DF2324" />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: textPrimary }]}>{item.fullName}</Text>
        <Text style={[styles.userEmail, { color: textMuted }]}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderSubtle, paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
        <TouchableOpacity 
          onPress={() => viewMode === 'chat' ? setViewMode('list') : navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name={viewMode === 'chat' ? "close" : "chevron-back"} size={24} color={textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            {viewMode === 'list' ? 'AI AUDIT LOGS' : 'SESSION INSPECTION'}
          </Text>
          <Text style={[styles.headerSub, { color: '#DF2324' }]}>
            {viewMode === 'list' ? 'NEURAL TRAFFIC CONTROL' : selectedUser?.fullName.toUpperCase()}
          </Text>
        </View>
      </View>

      {viewMode === 'list' ? (
        <View style={styles.listContainer}>
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}>
              <Ionicons name="search" size={18} color={textMuted} />
              <TextInput 
                style={[styles.searchInput, { color: textPrimary }]}
                placeholder="SEARCH CUSTOMERS..."
                placeholderTextColor={textMuted}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            <TouchableOpacity 
              style={[styles.sortBtn, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}
              onPress={() => {
                setSortOrder(prev => prev === 'RECENT' ? 'A-Z' : prev === 'A-Z' ? 'Z-A' : 'RECENT');
              }}
            >
              <Text style={[styles.sortBtnText, { color: sortOrder === 'RECENT' ? '#DF2324' : textMuted }]}>
                {sortOrder === 'RECENT' ? 'TIME' : sortOrder}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#DF2324" />
              <Text style={[styles.loadingText, { color: textMuted }]}>SYNCING NEURAL LOGS...</Text>
            </View>
          ) : (
            <FlatList 
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: textMuted }]}>NO CHAT SESSIONS DETECTED</Text>
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.chatContainer}>
          {chatLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#DF2324" />
              <Text style={[styles.loadingText, { color: textMuted }]}>DECOMPILING CONVERSATION...</Text>
            </View>
          ) : (
            <ScrollView 
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollContent}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg) => (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageRow, 
                    msg.sender === 'USER' ? styles.userRow : styles.aiRow
                  ]}
                >
                  <View style={[
                    styles.messageBubble,
                    msg.sender === 'USER' ? [styles.userBubble, { backgroundColor: '#DF2324' }] : [styles.aiBubble, { backgroundColor: bgSecondary, borderColor: borderSubtle }]
                  ]}>
                    {msg.imageUrl && (
                      <Image 
                        source={{ uri: msg.imageUrl.startsWith('/') ? `${BASE_SERVER_URL}${msg.imageUrl}` : msg.imageUrl }} 
                        style={styles.messageImage}
                      />
                    )}
                    <Text style={[
                      styles.messageText, 
                      { color: msg.sender === 'USER' ? '#FFF' : textPrimary }
                    ]}>
                      {msg.message}
                    </Text>
                    <Text style={[
                      styles.messageTime, 
                      { color: msg.sender === 'USER' ? 'rgba(255,255,255,0.5)' : textMuted }
                    ]}>
                      {(() => {
                        const d = Array.isArray(msg.createdAt)
                          ? new Date((msg.createdAt as any)[0], (msg.createdAt as any)[1] - 1, (msg.createdAt as any)[2], (msg.createdAt as any)[3] || 0, (msg.createdAt as any)[4] || 0)
                          : new Date(msg.createdAt);
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      })()}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          
          <View style={[styles.auditFooter, { borderTopColor: borderSubtle, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Ionicons name="shield-checkmark" size={16} color="#DF2324" />
            <Text style={[styles.footerText, { color: textMuted }]}>SECURE AUDIT TERMINAL // READ-ONLY MODE</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: -2,
    letterSpacing: 0.5,
  },
  listContainer: { flex: 1, padding: 20 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortBtn: {
    height: 50,
    width: 60,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortBtnText: {
    fontSize: 9,
    fontWeight: '900',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '800',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  listContent: { paddingBottom: 20 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(223,35,36,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  chatContainer: { flex: 1 },
  chatScroll: { flex: 1 },
  chatScrollContent: { padding: 20, paddingBottom: 40 },
  messageRow: {
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
  },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '85%',
    padding: 15,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: 5,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#000',
  },
  auditFooter: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    gap: 8,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
