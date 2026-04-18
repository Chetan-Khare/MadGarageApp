import React, { useState, useCallback, useRef } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Text, Image, TextInput,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
    Alert, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';
import { useCartStore } from '../store/cartStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    FadeInUp,
    Layout
} from 'react-native-reanimated';
import { ModernDashboardHeader } from '../components/ModernDashboardHeader';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    imageUri?: string;   // local image attached by user
    products?: any[];
}

export default function ChatScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '0',
            role: 'ai',
            text: "Hey there! 👋 I'm your Virtual Mechanic at MAD GARAGE!\n\nI can help you find the right parts for your vehicle. Just tell me:\n• Your vehicle's Year, Make & Model (e.g. \"2019 Hyundai Creta\")\n• What part you're looking for (e.g. brake pads, air filter)\n\nOr upload a photo of the part or damage and I'll take a look! 🔧",
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [pickedImage, setPickedImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    const addItem = useCartStore((state) => state.addItem);
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const navigation = useNavigation();

    const avatarPulse = useSharedValue(1);

    React.useEffect(() => {
        avatarPulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
            ),
            -1,
            true
        );
    }, []);

    const animatedAvatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: avatarPulse.value }],
        opacity: withTiming(avatarPulse.value === 1 ? 0.4 : 0.8),
    }));

    const bg = isDark ? '#050505' : '#F6F8FF';
    const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
    const subText = isDark ? '#AAAAAA' : '#666666';
    const inputBarBg = isDark ? '#121216' : '#FFFFFF';
    const inputBarBorder = isDark ? 'rgba(255,255,255,0.1)' : '#EEE';
    const thinkingBubbleBg = isDark ? '#121216' : '#FFFFFF';


    // ── Pick image from gallery ───────────────────────────────────────────────
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

    // ── Take a photo ──────────────────────────────────────────────────────────
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
        Alert.alert('Attach Image', 'Choose a source', [
            { text: '📷 Camera', onPress: takePhoto },
            { text: '🖼 Gallery', onPress: pickImage },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // ── Send message ──────────────────────────────────────────────────────────
    // Quick local check — common greetings get an instant reply without hitting the backend
    const isGreeting = (msg: string) => {
        const lower = msg.toLowerCase().replace(/[^a-z ]/g, '').trim();
        const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'hiya', 'howdy',
            'good morning', 'good evening', 'good afternoon', 'help',
            'what can you do', 'who are you'];
        return greetings.includes(lower) || (lower.length <= 4 && !/\d/.test(lower));
    };

    const sendMessage = useCallback(async () => {
        const text = inputText.trim();
        if ((!text && !pickedImage) || isThinking) return;

        // ── Fast local greeting path ──────────────────────────────────────────
        if (text && !pickedImage && isGreeting(text)) {
            const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: "Hey! 👋 I'm your Virtual Mechanic at MAD GARAGE!\n\nTell me your vehicle's Year, Make & Model (e.g. \"2019 Hyundai Creta SX\") and what part you need, and I'll find the perfect match for you. 🔧\n\nYou can also upload a photo of the part or damage!",
            };
            setMessages(prev => [...prev, userMsg, aiMsg]);
            setInputText('');
            return;
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: text || '📷 Image attached — please analyse this.',
            imageUri: pickedImage ?? undefined,
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        const imageToSend = pickedImage;
        setPickedImage(null);
        setIsThinking(true);

        try {
            // Posting to assistant
            const formData = new FormData();
            if (text) formData.append('message', text);

            if (imageToSend) {
                const filename = imageToSend.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                formData.append('image', { uri: imageToSend, name: filename, type } as any);
                // Attachment logic
            }

            const response = await apiClient.post('/assistant/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Response received
            const result = response.data;
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: result.message || "I found some options for you!",
                products: result.products || [],
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error('Chat API error:', {
                message: error.message,
                code: error.code,
                configUrl: error.config?.url,
                response: error.response?.data
            });
            const fallbackMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: `Connection Failure: ${error.message}\n\nPlease check if your backend is running at ${BASE_SERVER_URL} and your device is on the same network.`,
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsThinking(false);
        }

    }, [inputText, isThinking, pickedImage]);

    // ── Render a single message ───────────────────────────────────────────────
    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <Animated.View
                entering={FadeInUp.duration(400)}
                layout={Layout.springify()}
                style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}
            >

                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <Animated.View style={[styles.avatarGlow, animatedAvatarStyle]} />
                        <View style={[styles.avatar, { backgroundColor: isDark ? '#1A0505' : '#F0F0F0' }]}>
                            <Ionicons name="car-sport" size={18} color="#DF2324" />
                        </View>
                    </View>
                )}
                <View style={{ maxWidth: '85%' }}>

                    {/* Attached image preview inside message */}
                    {item.imageUri && (
                        <Image
                            source={{ uri: item.imageUri }}
                            style={styles.attachedImage}
                            resizeMode="cover"
                        />
                    )}
                    {isUser ? (
                        <LinearGradient
                            colors={['#DC2626', '#991B1B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.bubble, styles.bubbleUser]}
                        >
                            <Text style={styles.bubbleText}>{item.text}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[
                            styles.bubble,
                            styles.bubbleAi,
                            { backgroundColor: isDark ? '#121216' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE', borderWidth: 1 }
                        ]}>
                            <Text style={[styles.bubbleText, { color: textColor }]}>{item.text}</Text>

                            {item.products && item.products.length > 0 && (
                                <View style={styles.productGrid}>
                                    {item.products.map((p: any, i: number) => (
                                        <TouchableOpacity
                                            key={i}
                                            activeOpacity={0.9}
                                            style={[styles.productCard, { backgroundColor: isDark ? '#1a1a20' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}
                                        >
                                            <View style={styles.productImageWrap}>
                                                <Image
                                                    source={{ uri: (p.imageUrl?.startsWith('/') ? `${BASE_SERVER_URL}${p.imageUrl}` : (p.imageUrl || 'https://via.placeholder.com/150')) }}
                                                    style={styles.productImage}
                                                />
                                                <View style={styles.productGradient} />
                                                <View style={styles.productImageOverlayText}>
                                                    <Text style={styles.productBrand}>{p.manufacturer || 'OEM Quality'}</Text>
                                                    <Text style={styles.productNameOverlay} numberOfLines={1}>{p.partName || p.name}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.productInfo}>
                                                <View style={styles.productFooter}>
                                                    <View>
                                                        {p.originalPrice && <Text style={styles.productOriginalPrice}>₹{(p.originalPrice || 0).toLocaleString()}</Text>}
                                                        <Text style={[styles.productPrice, { color: textColor }]}>₹{(p.garagePrice || p.price || 0).toLocaleString()}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.addBtn}
                                                        disabled={(p.stockQuantity ?? 0) <= 0}
                                                        onPress={() => {
                                                            addItem({
                                                                id: p.id?.toString(),
                                                                deviceName: p.partName || p.name,
                                                                price: p.price,
                                                                imageUrl: p.imageUrl,
                                                                manufacturer: p.manufacturer || p.brand || 'MAD GARAGE',
                                                                quantity: 1,
                                                                stockQuantity: p.stockQuantity ?? 0
                                                            });
                                                            Alert.alert("Success", "Added to cart.");
                                                        }}
                                                    >
                                                        <Ionicons name="cart-outline" size={20} color="#FFF" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };


    return (
        <View style={[styles.safeArea, { backgroundColor: bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

            <ModernDashboardHeader
                title="MAD GARAGE AI"
                subtitle="Virtual Mechanic"
                showThemeToggle={false}
                profileIcon="chevron-back"
                onProfilePress={() => navigation.goBack()}
                logo={require('../../assets/app_logo.png')}
            />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                />

                {isThinking && (
                    <View style={styles.thinkingRow}>
                        <View style={styles.avatarContainer}>
                            <Animated.View style={[styles.avatarGlow, animatedAvatarStyle]} />
                            <View style={[styles.avatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#EEE', borderWidth: 1 }]}>
                                <Ionicons name="car-sport" size={18} color="#DF2324" />
                            </View>
                        </View>
                        <View style={[styles.thinkingBubble, { backgroundColor: thinkingBubbleBg, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
                            <ActivityIndicator size="small" color="#DF2324" />
                            <Text style={[styles.thinkingText, { color: subText }]}>Analyzing Machine...</Text>
                        </View>
                    </View>
                )}


                {/* Picked image preview above input bar */}
                {pickedImage && (
                    <View style={[styles.imagePreviewBar, { backgroundColor: inputBarBg, borderTopColor: inputBarBorder }]}>
                        <Image source={{ uri: pickedImage }} style={styles.imagePreviewThumb} />
                        <Text style={[styles.imagePreviewLabel, { color: textColor }]}>Image ready to send</Text>
                        <TouchableOpacity onPress={() => setPickedImage(null)} style={styles.removeImageBtn}>
                            <Ionicons name="close-circle" size={22} color="#DF2324" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <View style={[styles.floatingInput, { backgroundColor: inputBarBg, borderColor: inputBarBorder }]}>
                        <TouchableOpacity style={styles.attachBtn} onPress={showImageOptions} disabled={isThinking}>
                            <Ionicons name="camera-outline" size={22} color={pickedImage ? '#DF2324' : (isDark ? '#555' : '#AAA')} />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.textInput, { color: textColor }]}
                            placeholder="Type vehicle model & part..."
                            placeholderTextColor={isDark ? '#444' : '#AAA'}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />

                        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={isThinking}>
                            <Ionicons name="arrow-up" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}


const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    messageList: { padding: 16, paddingBottom: 20 },
    msgRow: { flexDirection: 'row', marginBottom: 24, alignItems: 'flex-end' },
    msgRowLeft: { justifyContent: 'flex-start' },
    msgRowRight: { justifyContent: 'flex-end' },
    avatarContainer: {
        width: 34,
        height: 34,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarGlow: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DF2324',
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DF232444',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    bubble: { padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    bubbleUser: {
        borderTopRightRadius: 0,
    },
    bubbleAi: {
        borderTopLeftRadius: 0,
    },
    bubbleText: { color: '#FFF', fontSize: 15, lineHeight: 24, fontWeight: '600' },
    attachedImage: {
        width: 260,
        height: 180,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    productGrid: { marginTop: 24, gap: 16 },
    productCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 10,
    },
    productImageWrap: { position: 'relative', width: '100%', height: 160 },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    productGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', paddingTop: 20 },
    productImageOverlayText: { position: 'absolute', bottom: 16, left: 16, right: 16 },
    productBrand: { color: '#DF2324', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
    productNameOverlay: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 },
    productInfo: { padding: 20 },
    productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productOriginalPrice: { color: '#AAAAAA', fontSize: 10, fontWeight: '700', textDecorationLine: 'line-through' },
    productPrice: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
    addBtn: {
        backgroundColor: '#DF2324',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    thinkingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 },
    thinkingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    thinkingText: { marginLeft: 14, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
    imagePreviewBar: {
        marginHorizontal: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 24,
        gap: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    imagePreviewThumb: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#DF232444' },
    imagePreviewLabel: { flex: 1, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
    removeImageBtn: { padding: 4 },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    floatingInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 35,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 25,
        elevation: 15,
    },
    attachBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        maxHeight: 120,
        paddingHorizontal: 14,
        fontSize: 16,
        fontWeight: '700',
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DF2324',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 10,
    },
});
