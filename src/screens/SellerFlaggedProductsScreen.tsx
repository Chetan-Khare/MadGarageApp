import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Image, ActivityIndicator, Alert, StatusBar, TextInput, 
    KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'SellerFlaggedProducts'>;

export default function SellerFlaggedProductsScreen({ navigation }: Props) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [responseModalVisible, setResponseModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [sellerResponse, setSellerResponse] = useState('');
    
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    useEffect(() => {
        fetchFlaggedProducts();
    }, []);

    const fetchFlaggedProducts = async () => {
        try {
            const response = await apiClient.get('/seller/inventory');
            // Filter only flagged products
            const flagged = response.data.filter((p: any) => p.flagged);
            setProducts(flagged);
        } catch (error) {
            console.error('Failed to fetch flagged products:', error);
            Alert.alert('Error', 'Could not load compliance data.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenResponse = (product: any) => {
        setSelectedProduct(product);
        setSellerResponse(product.sellerResponse || '');
        setResponseModalVisible(true);
    };

    const handleSubmitResponse = async () => {
        if (!sellerResponse.trim()) {
            Alert.alert('Response Required', 'Please enter a justification for the administration.');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.put(`/seller/inventory/${selectedProduct.id}/respond`, {
                response: sellerResponse
            });
            Alert.alert('Success', 'Your response has been transmitted to the admin team.');
            setResponseModalVisible(false);
            fetchFlaggedProducts();
        } catch (error) {
            console.error('Response submission failed:', error);
            Alert.alert('Error', 'Could not submit response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderProductItem = ({ item }: { item: any }) => (
        <View style={[styles.productCard, { backgroundColor: T.statBg, borderColor: '#FF9B3E44' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.imageContainer}>
                    <Image 
                        source={{ uri: item.imageUrl ? `${BASE_SERVER_URL}${item.imageUrl}` : 'https://via.placeholder.com/150' }} 
                        style={styles.productImage} 
                    />
                    <View style={styles.flagIcon}>
                        <Ionicons name="flag" size={12} color="#FFF" />
                    </View>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={[styles.productName, { color: T.text }]} numberOfLines={1}>{item.partName}</Text>
                    <Text style={[styles.productBrand, { color: T.subText }]}>{item.brand} | SKU: {item.sku}</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: '#DF2324' }]}>₹{item.price.toLocaleString()}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.reasonBox}>
                <View style={styles.reasonHeader}>
                    <Ionicons name="alert-circle" size={16} color="#FF9B3E" />
                    <Text style={styles.reasonTitle}>ADMIN FEEDBACK</Text>
                </View>
                <Text style={styles.reasonText}>{item.flagReason || 'Reason not specified. Please contact support.'}</Text>
            </View>

            {item.sellerResponse && (
                <View style={[styles.responseBox, { backgroundColor: isDark ? '#1A1A1E' : '#F9F9F9' }]}>
                    <Text style={styles.responseTitle}>YOUR JUSTIFICATION</Text>
                    <Text style={[styles.responseText, { color: T.text }]}>{item.sellerResponse}</Text>
                </View>
            )}

            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { borderStyle: 'dashed', borderWidth: 1, borderColor: T.subText }]}
                    onPress={() => navigation.navigate('EditProduct' as any, { product: item } as any)}
                >
                    <Ionicons name="create-outline" size={16} color={T.text} />
                    <Text style={[styles.btnText, { color: T.text }]}>RESOLVE DETAILS</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#FF9B3E' }]}
                    onPress={() => handleOpenResponse(item)}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#000" />
                    <Text style={[styles.btnText, { color: '#000' }]}>{item.sellerResponse ? 'UPDATE REPLY' : 'SEND RESPONSE'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: T.bg2 }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg2} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#DF2324" />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: T.text }]}>Compliance Hub</Text>
                    <Text style={styles.subtitle}>Audit & Response Center</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#DF2324" />
                    <Text style={[styles.loadingText, { color: T.subText }]}>AUDITING INVENTORY...</Text>
                </View>
            ) : products.length > 0 ? (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderProductItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="shield-checkmark" size={64} color="#4CAF50" />
                    </View>
                    <Text style={[styles.emptyTitle, { color: T.text }]}>CLEAN RECORD</Text>
                    <Text style={[styles.emptyText, { color: T.subText }]}>None of your products are currently flagged for compliance issues.</Text>
                </View>
            )}

            {/* Response Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={responseModalVisible}
                onRequestClose={() => setResponseModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: T.bg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: T.text }]}>Justification Report</Text>
                            <TouchableOpacity onPress={() => setResponseModalVisible(false)}>
                                <Ionicons name="close" size={24} color={T.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.modalSub}>Providing context helps admins resolve flags faster.</Text>
                        
                        <View style={[styles.modalInputBox, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                            <TextInput 
                                style={[styles.modalInput, { color: T.text }]}
                                placeholder="State your case or provide certification details..."
                                placeholderTextColor={T.placeholder}
                                value={sellerResponse}
                                onChangeText={setSellerResponse}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
                            onPress={handleSubmitResponse}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Text style={styles.submitBtnText}>TRANSMIT JUSTIFICATION</Text>
                                    <Ionicons name="send" size={16} color="#FFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(223, 35, 36, 0.05)' },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, italic: true },
    subtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: '#FF9B3E', textTransform: 'uppercase', marginTop: -2 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    productCard: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    imageContainer: { position: 'relative' },
    productImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#F0F0F0' },
    flagIcon: { position: 'absolute', top: -5, left: -5, backgroundColor: '#FF9B3E', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    headerInfo: { flex: 1, justifyContent: 'center' },
    productName: { fontSize: 16, fontWeight: '800', italic: true },
    productBrand: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
    priceRow: { marginTop: 6 },
    price: { fontSize: 18, fontWeight: '900' },
    
    reasonBox: { backgroundColor: 'rgba(255, 155, 62, 0.08)', borderRadius: 16, padding: 15, borderLeftWidth: 4, borderLeftColor: '#FF9B3E' },
    reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    reasonTitle: { fontSize: 10, fontWeight: '900', color: '#FF9B3E', letterSpacing: 1 },
    reasonText: { fontSize: 13, fontWeight: '700', color: '#B06D1D', lineHeight: 18 },

    responseBox: { marginTop: 12, borderRadius: 16, padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    responseTitle: { fontSize: 9, fontWeight: '900', color: '#888', letterSpacing: 1, marginBottom: 4 },
    responseText: { fontSize: 13, fontWeight: '600', fontStyle: 'italic', lineHeight: 18 },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
    btnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 11, fontWeight: '800', letterSpacing: 2 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(76, 175, 80, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '900', italic: true, letterSpacing: 1 },
    emptyText: { textAlign: 'center', marginTop: 10, fontSize: 13, fontWeight: '600', lineHeight: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 22, fontWeight: '900', italic: true },
    modalSub: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 20 },
    modalInputBox: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 20 },
    modalInput: { fontSize: 15, fontWeight: '600', minHeight: 120 },
    submitBtn: { backgroundColor: '#DF2324', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});
