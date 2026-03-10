import React, { useState, useCallback, useRef } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Text, Image, TextInput,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
    SafeAreaView, Alert, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/apiClient';
import { useCartStore } from '../store/cartStore';
import { useThemeStore } from '../store/themeStore';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    imageUri?: string;   // local image attached by user
    products?: any[];
}

export default function AntiGravChatScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '0',
            role: 'ai',
            text: "Hey there! 👋 I'm your Virtual Mechanic at Mad Garage!\n\nI can help you find the right parts for your vehicle. Just tell me:\n• Your vehicle's Year, Make & Model (e.g. \"2019 Hyundai Creta\")\n• What part you're looking for (e.g. brake pads, air filter)\n\nOr upload a photo of the part or damage and I'll take a look! 🔧",
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [pickedImage, setPickedImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    const addItem = useCartStore((state) => state.addItem);
    const { isDark } = useThemeStore();

    const bg = isDark ? '#050505' : '#F0F4FF';
    const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
    const cardBorder = isDark ? '#333' : '#E0E0E0';
    const textColor = isDark ? '#FFF' : '#1A1A1A';
    const subText = isDark ? '#888' : '#666';
    const inputBg = isDark ? '#1A1A1A' : '#FFFFFF';
    const inputBorder = isDark ? '#333' : '#DDD';
    const inputBarBg = isDark ? '#111' : '#F5F5F5';
    const inputBarBorder = isDark ? '#222' : '#DDD';
    const thinkingBubbleBg = isDark ? '#1A1A1A' : '#FFFFFF';

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
                text: "Hey! 👋 I'm your Virtual Mechanic at Mad Garage!\n\nTell me your vehicle's Year, Make & Model (e.g. \"2019 Hyundai Creta SX\") and what part you need, and I'll find the perfect match for you. 🔧\n\nYou can also upload a photo of the part or damage!",
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
            const formData = new FormData();
            if (text) formData.append('message', text);

            if (imageToSend) {
                const filename = imageToSend.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                formData.append('image', { uri: imageToSend, name: filename, type } as any);
            }

            const response = await apiClient.post('/assistant/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const result = response.data;
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: result.message || "I found some options for you!",
                products: result.products || [],
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat API error:', error);
            const fallbackMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: "I'm having trouble connecting to the Mad Garage server right now. Please make sure the Spring Boot backend is running, then try again!",
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
            <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
                {!isUser && (
                    <View style={[styles.avatar, { backgroundColor: isDark ? '#111' : '#F0F0F0' }]}>
                        <Ionicons name="car-sport" size={18} color="#FF3333" />
                    </View>
                )}
                <View style={{ maxWidth: '80%' }}>
                    {/* Attached image preview inside message */}
                    {item.imageUri && (
                        <Image
                            source={{ uri: item.imageUri }}
                            style={styles.attachedImage}
                            resizeMode="cover"
                        />
                    )}
                    <View style={[
                        styles.bubble,
                        isUser ? styles.bubbleUser : [styles.bubbleAi, { backgroundColor: cardBg, borderColor: cardBorder }]
                    ]}>
                        <Text style={[styles.bubbleText, !isUser && { color: textColor }]}>{item.text}</Text>

                        {/* Product cards */}
                        {item.products && item.products.length > 0 && (
                            <View style={styles.productGrid}>
                                {item.products.map((p: any, i: number) => (
                                    <View key={i} style={[styles.productCard, { backgroundColor: isDark ? '#111' : '#F5F5F5', borderColor: '#FF333333' }]}>
                                        <Image source={{ uri: p.imageUrl || 'https://via.placeholder.com/80' }} style={styles.productImage} />
                                        <View style={styles.productInfo}>
                                            <Text style={[styles.productName, { color: textColor }]} numberOfLines={2}>{p.partName || p.name}</Text>
                                            <Text style={styles.productPrice}>${p.price?.toLocaleString() || p.garagePrice}</Text>
                                            <TouchableOpacity
                                                style={styles.addBtn}
                                                onPress={() => addItem({
                                                    id: p.id?.toString(),
                                                    deviceName: p.partName || p.name,
                                                    price: p.price,
                                                    imageUrl: p.imageUrl,
                                                    manufacturer: p.brand || 'Mad Garage',
                                                    quantity: 1
                                                })}
                                            >
                                                <Text style={styles.addBtnText}>ADD TO CART</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {isThinking && (
                    <View style={styles.thinkingRow}>
                        <View style={[styles.avatar, { backgroundColor: isDark ? '#111' : '#F0F0F0' }]}>
                            <Ionicons name="car-sport" size={18} color="#FF3333" />
                        </View>
                        <View style={[styles.thinkingBubble, { backgroundColor: thinkingBubbleBg, borderColor: cardBorder }]}>
                            <ActivityIndicator size="small" color="#FF3333" />
                            <Text style={[styles.thinkingText, { color: subText }]}>Searching parts database...</Text>
                        </View>
                    </View>
                )}

                {/* Picked image preview above input bar */}
                {pickedImage && (
                    <View style={[styles.imagePreviewBar, { backgroundColor: inputBarBg, borderTopColor: inputBarBorder }]}>
                        <Image source={{ uri: pickedImage }} style={styles.imagePreviewThumb} />
                        <Text style={[styles.imagePreviewLabel, { color: textColor }]}>Image ready to send</Text>
                        <TouchableOpacity onPress={() => setPickedImage(null)} style={styles.removeImageBtn}>
                            <Ionicons name="close-circle" size={22} color="#FF3333" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: inputBarBg, borderTopColor: inputBarBorder }]}>
                    {/* Attach image button */}
                    <TouchableOpacity style={styles.attachBtn} onPress={showImageOptions} disabled={isThinking}>
                        <Ionicons name="image-outline" size={24} color={pickedImage ? '#FF3333' : (isDark ? '#666' : '#AAA')} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.textInput, { color: textColor, backgroundColor: isDark ? '#222' : '#FFFFFF', borderColor: inputBorder }]}
                        placeholder="e.g. 2019 Hyundai Creta SX brake pads"
                        placeholderTextColor={isDark ? '#555' : '#AAA'}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        returnKeyType="send"
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={isThinking}>
                        <Ionicons name="send" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    messageList: { padding: 15, paddingBottom: 10 },
    msgRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
    msgRowLeft: { justifyContent: 'flex-start' },
    msgRowRight: { justifyContent: 'flex-end' },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FF333333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        flexShrink: 0,
    },
    bubble: { padding: 12, borderRadius: 16 },
    bubbleUser: {
        backgroundColor: '#FF3333',
        borderBottomRightRadius: 4,
    },
    bubbleAi: {
        borderWidth: 1,
        borderBottomLeftRadius: 4,
    },
    bubbleText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
    attachedImage: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        marginBottom: 6,
        backgroundColor: '#222',
    },
    productGrid: { marginTop: 12 },
    productCard: {
        flexDirection: 'row',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 8,
        borderWidth: 1,
    },
    productImage: { width: 70, height: 70 },
    productInfo: { flex: 1, padding: 8, justifyContent: 'space-between' },
    productName: { fontSize: 12, fontWeight: 'bold' },
    productPrice: { color: '#FF3333', fontSize: 14, fontWeight: '900' },
    addBtn: {
        backgroundColor: '#FF333322',
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FF3333',
        alignItems: 'center',
    },
    addBtnText: { color: '#FF3333', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    thinkingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 },
    thinkingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
    },
    thinkingText: { marginLeft: 8, fontSize: 13 },
    // ── Image preview bar ──
    imagePreviewBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderTopWidth: 1,
        gap: 10,
    },
    imagePreviewThumb: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#333',
    },
    imagePreviewLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
    removeImageBtn: { padding: 4 },
    // ── Input bar ──
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingTop: 12,
        borderTopWidth: 1,
        gap: 8,
    },
    attachBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 120,
        borderWidth: 1,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FF3333',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF3333',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
});
