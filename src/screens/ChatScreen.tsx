import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Text, Image, TextInput,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
    Alert, StatusBar, ImageBackground, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';
import { useCartStore } from '../store/cartStore';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    FadeInUp,
    Layout,
    FadeInDown
} from 'react-native-reanimated';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    imageUri?: string;
    products?: any[];
    showRequestButton?: boolean;
}

// ─── Theme Definitions ────────────────────────────────────────────────────────
const DARK = {
    bg: ['#050505', '#0A0A0A', '#050505'] as const,
    card: 'rgba(20, 20, 22, 0.65)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.03)',
    text: '#FFFFFF',
    subText: '#A1A1AA',
    icon: '#71717A',
    placeholder: '#71717A',
    blurTint: 'dark' as const,
};

const LIGHT = {
    bg: ['#F4F4F5', '#FFFFFF', '#F4F4F5'] as const,
    card: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
    inputBg: 'rgba(0, 0, 0, 0.02)',
    text: '#18181B',
    subText: '#71717A',
    icon: '#A1A1AA',
    placeholder: '#A1A1AA',
    blurTint: 'light' as const,
};

export default function ChatScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '0',
            role: 'ai',
            text: "Hey there! 👋 I'm your Virtual Mechanic at MAD GARAGE.\n\nTell me what you drive and what you're looking for, or upload a photo of a part, and I'll find it in our inventory.",
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [pickedImage, setPickedImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    const addItem = useCartStore((state) => state.addItem);
    const { isDark } = useThemeStore();
    const { role } = useAuthStore();
    const theme = isDark ? DARK : LIGHT;
    const navigation = useNavigation();

    // Animations
    const avatarPulse = useSharedValue(1);

    useEffect(() => {
        avatarPulse.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedAvatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: avatarPulse.value }],
        opacity: withTiming(avatarPulse.value === 1 ? 0.2 : 0.6),
    }));

    // Premium Technical Background
    const BACKGROUND_IMAGE = require('../../assets/chat_bg.png');
    const overlayGradient = isDark
        ? ['rgba(5, 5, 5, 0.3)', 'rgba(5, 5, 5, 0.5)', 'rgba(5, 5, 5, 0.7)'] as const
        : ['rgba(244, 244, 245, 0.8)', 'rgba(244, 244, 245, 0.95)', '#F4F4F5'] as const;

    // ── File Handling ──────────────────────────────────────────────────────────
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library to attach images.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });
        if (!result.canceled && result.assets.length > 0) {
            setPickedImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow camera access to take photos.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });
        if (!result.canceled && result.assets.length > 0) {
            setPickedImage(result.assets[0].uri);
        }
    };

    const showImageOptions = () => {
        Keyboard.dismiss();
        Alert.alert('Attach Image', 'Scan a part or show damage', [
            { text: '📷 Open Camera', onPress: takePhoto },
            { text: '🖼 Photo Library', onPress: pickImage },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // ── Logic ─────────────────────────────────────────────────────────────────
    const isGreeting = (msg: string) => {
        const lower = msg.toLowerCase().replace(/[^a-z ]/g, '').trim();
        const greetings = ['hi', 'hello', 'hey', 'yo', 'sup'];
        return greetings.includes(lower);
    };

    const sendMessage = useCallback(async () => {
        const text = inputText.trim();
        if ((!text && !pickedImage) || isThinking) return;

        if (text && !pickedImage && isGreeting(text)) {
            const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: "Hey! Let me know your vehicle's Year, Make, and Model, and I'll find exactly what you need.",
            };
            setMessages(prev => [...prev, userMsg, aiMsg]);
            setInputText('');
            return;
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: text || 'Can you identify this part?',
            imageUri: pickedImage ?? undefined,
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        const imageToSend = pickedImage;
        setPickedImage(null);
        setIsThinking(true);

        try {
            const formData = new FormData();
            if (text) formData.append('message', text);

            if (imageToSend) {
                const filename = imageToSend.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                formData.append('image', { uri: imageToSend, name: filename, type } as any);
            }

            const response = await apiClient.post('/assistant/chat', formData);

            const result = response.data;
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: result.message || "Here are the best matches for your vehicle.",
                products: result.products || [],
                showRequestButton: result.showRequestButton || false,
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error('Chat API error:', error);
            const fallbackMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: `Connection Failure: ${error.message}`,
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsThinking(false);
        }

    }, [inputText, isThinking, pickedImage]);

    // ── Render Message Bubble ─────────────────────────────────────────────────
    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';

        return (
            <Animated.View
                entering={FadeInUp.duration(400)}
                layout={Layout.springify().damping(15)}
                style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}
            >
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <Animated.View style={[styles.avatarGlow, animatedAvatarStyle]} />
                        <View style={[styles.avatar, { backgroundColor: isDark ? '#1A0B0B' : '#FFF0F0', borderColor: 'rgba(223, 35, 36, 0.4)' }]}>
                            <Ionicons name="hardware-chip-outline" size={14} color="#DF2324" />
                        </View>
                    </View>
                )}

                <View style={{ maxWidth: isUser ? '85%' : '88%' }}>
                    {item.imageUri && (
                        <Image source={{ uri: item.imageUri }} style={styles.attachedImage} resizeMode="cover" />
                    )}

                    {isUser ? (
                        <LinearGradient
                            colors={['#DF2324', '#B91C1C']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={[styles.bubble, styles.bubbleUser]}
                        >
                            <Text style={styles.bubbleTextUser}>{item.text}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[styles.bubble, styles.bubbleAi, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                            <Text style={[styles.bubbleTextAi, { color: theme.text }]}>{item.text}</Text>

                            {/* Embedded Product Mini-Widgets */}
                            {item.products && item.products.length > 0 && (
                                <View style={styles.productGrid}>
                                    {item.products.map((p: any, i: number) => (
                                        <TouchableOpacity key={i} activeOpacity={0.85} style={styles.productCardWrap}>
                                            <BlurView intensity={isDark ? 30 : 60} tint={theme.blurTint} style={[styles.productCardInner, { borderColor: theme.cardBorder }]}>
                                                <Image
                                                    source={{ uri: (p.imageUrl?.startsWith('/') ? `${BASE_SERVER_URL}${p.imageUrl}` : (p.imageUrl || 'https://via.placeholder.com/150')) }}
                                                    style={styles.productImage}
                                                />
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productBrand}>{p.manufacturer || 'MAD GARAGE'}</Text>
                                                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{p.partName || p.name}</Text>

                                                    <View style={styles.productFooter}>
                                                        <Text style={[styles.productPrice, { color: theme.text }]}>₹{(p.garagePrice || p.price || 0).toLocaleString()}</Text>
                                                        {role !== 'ROLE_SELLER' && (
                                                            <TouchableOpacity
                                                                style={styles.addBtn}
                                                                disabled={(p.stockQuantity ?? 0) <= 0}
                                                                onPress={() => {
                                                                    const success = addItem({
                                                                        id: p.id?.toString(),
                                                                        partName: p.partName || p.name,
                                                                        price: p.price,
                                                                        imageUrl: p.imageUrl,
                                                                        brand: p.manufacturer || p.brand || 'MAD GARAGE',
                                                                        quantity: 1,
                                                                        stockQuantity: p.stockQuantity ?? 0
                                                                    });
                                                                    if (success) {
                                                                        Alert.alert("Added", "Item added to your cart.");
                                                                    }
                                                                }}
                                                            >
                                                                <Ionicons name="cart" size={16} color="#FFF" />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                            </BlurView>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {item.showRequestButton && (
                                <TouchableOpacity 
                                    style={styles.requestBtn}
                                    onPress={() => navigation.navigate('PartRequest' as never)}
                                >
                                    <Ionicons name="document-text-outline" size={16} color="#FFF" />
                                    <Text style={styles.requestBtnText}>Request Part Manually</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <ImageBackground source={BACKGROUND_IMAGE} style={styles.safeArea} resizeMode="cover">
            <LinearGradient colors={overlayGradient} style={{ flex: 1 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent />

                {/* Glass Header */}
                <BlurView intensity={isDark ? 40 : 80} tint={theme.blurTint} style={[styles.integratedHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.cardBorder }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={theme.text} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>MAD GARAGE AI</Text>
                        <Text style={styles.headerSubtitle}>VIRTUAL MECHANIC</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.headerLogo} />
                    </View>
                </BlurView>

                {/* Main Chat Area */}
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={[styles.messageList, { paddingTop: 20 }]}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        keyboardDismissMode="interactive"
                        showsVerticalScrollIndicator={false}
                    />

                    {isThinking && (
                        <Animated.View entering={FadeInDown} style={styles.thinkingRow}>
                            <View style={styles.avatarContainer}>
                                <Animated.View style={[styles.avatarGlow, animatedAvatarStyle]} />
                                <View style={[styles.avatar, { backgroundColor: isDark ? '#1A0B0B' : '#FFF0F0', borderColor: 'rgba(223, 35, 36, 0.4)' }]}>
                                    <Ionicons name="hardware-chip-outline" size={14} color="#DF2324" />
                                </View>
                            </View>
                            <BlurView intensity={isDark ? 30 : 60} tint={theme.blurTint} style={[styles.thinkingBubble, { borderColor: theme.cardBorder }]}>
                                <ActivityIndicator size="small" color="#DF2324" />
                                <Text style={[styles.thinkingText, { color: theme.subText }]}>Searching Inventory...</Text>
                            </BlurView>
                        </Animated.View>
                    )}

                    {/* Input Area */}
                    <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                        {pickedImage && (
                            <BlurView intensity={isDark ? 50 : 80} tint={theme.blurTint} style={[styles.imagePreviewBar, { borderColor: theme.cardBorder }]}>
                                <Image source={{ uri: pickedImage }} style={styles.imagePreviewThumb} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.imagePreviewLabel, { color: theme.text }]}>Image Attached</Text>
                                    <Text style={{ fontSize: 11, color: theme.subText }}>Ready for analysis</Text>
                                </View>
                                <TouchableOpacity onPress={() => setPickedImage(null)} style={styles.removeImageBtn}>
                                    <Ionicons name="close-circle" size={24} color={theme.subText} />
                                </TouchableOpacity>
                            </BlurView>
                        )}

                        <BlurView intensity={isDark ? 50 : 80} tint={theme.blurTint} style={[styles.floatingInput, { borderColor: theme.cardBorder }]}>
                            <TouchableOpacity style={styles.attachBtn} onPress={showImageOptions} disabled={isThinking}>
                                <Ionicons name="add-circle" size={28} color={pickedImage ? '#DF2324' : theme.icon} />
                            </TouchableOpacity>

                            <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                placeholder="Message Garage AI..."
                                placeholderTextColor={theme.placeholder}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={500}
                            />

                            <TouchableOpacity
                                style={[styles.sendBtn, (!inputText.trim() && !pickedImage) && { backgroundColor: theme.inputBg }]}
                                onPress={sendMessage}
                                disabled={isThinking || (!inputText.trim() && !pickedImage)}
                            >
                                <Ionicons name="arrow-up" size={18} color={(!inputText.trim() && !pickedImage) ? theme.icon : '#FFF'} />
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },
    container: { flex: 1 },

    // Header
    integratedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 40, alignItems: 'flex-end' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: '#DF2324', letterSpacing: 1 },
    headerSubtitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, color: '#DF2324', textTransform: 'uppercase', marginTop: 2, opacity: 0.9 },
    headerLogo: { width: 32, height: 32, borderRadius: 16 },

    // Messages
    messageList: { paddingHorizontal: 16, paddingBottom: 10 },
    msgRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
    msgRowLeft: { justifyContent: 'flex-start' },
    msgRowRight: { justifyContent: 'flex-end' },

    avatarContainer: { width: 28, height: 28, marginRight: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    avatarGlow: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: '#DF2324' },
    avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

    bubble: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'transparent' },
    bubbleUser: { borderBottomRightRadius: 6 },
    bubbleAi: { borderBottomLeftRadius: 6 },
    bubbleTextUser: { color: '#FFF', fontSize: 15, lineHeight: 22, fontWeight: '500' },
    bubbleTextAi: { fontSize: 15, lineHeight: 24, fontWeight: '400' },

    attachedImage: { width: '100%', height: 200, borderRadius: 18, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    // Mini Product Widgets inside Chat
    productGrid: { marginTop: 16, gap: 12 },
    productCardWrap: { borderRadius: 16, overflow: 'hidden' },
    productCardInner: { flexDirection: 'row', padding: 10, borderWidth: 1, borderRadius: 16, alignItems: 'center' },
    productImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.1)' },
    productInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    productBrand: { color: '#DF2324', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    productName: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
    productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { fontSize: 15, fontWeight: '900', fontStyle: 'italic' },
    addBtn: { backgroundColor: '#DF2324', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    // Thinking Indicator
    thinkingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
    thinkingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    thinkingText: { marginLeft: 10, fontSize: 12, fontWeight: '600' },

    // Input Area
    inputContainer: { paddingHorizontal: 16, paddingTop: 8 },
    imagePreviewBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
    imagePreviewThumb: { width: 44, height: 44, borderRadius: 10 },
    imagePreviewLabel: { fontSize: 14, fontWeight: '700' },
    removeImageBtn: { padding: 4 },
    floatingInput: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 28, paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, overflow: 'hidden' },
    attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    textInput: { flex: 1, maxHeight: 100, minHeight: 40, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 10, fontSize: 15 },
    sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DF2324', justifyContent: 'center', alignItems: 'center', marginBottom: 2, marginRight: 2 },

    requestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(223, 35, 36, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(223, 35, 36, 0.4)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 12,
        alignSelf: 'flex-start'
    },
    requestBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8
    }
});