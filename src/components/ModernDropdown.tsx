import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Modal, 
    FlatList, 
    TouchableWithoutFeedback,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

interface ModernDropdownProps {
    label?: string;
    value: string;
    options: string[] | number[];
    onSelect: (value: string) => void;
    placeholder?: string;
    enabled?: boolean;
    containerStyle?: any;
    error?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ModernDropdown: React.FC<ModernDropdownProps> = ({
    label,
    value,
    options,
    onSelect,
    placeholder = 'Select...',
    enabled = true,
    containerStyle,
    error
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    const renderItem = ({ item }: { item: string | number }) => (
        <TouchableOpacity
            style={[styles.optionItem, { borderBottomColor: T.cardBorder + '22' }]}
            onPress={() => {
                onSelect(item.toString());
                setModalVisible(false);
            }}
        >
            <Text style={[styles.optionText, { color: T.text }, value === item.toString() && { color: '#DF2324', fontWeight: '800' }]}>
                {item}
            </Text>
            {value === item.toString() && (
                <Ionicons name="checkmark-circle" size={18} color="#DF2324" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: T.subText }]}>{label}</Text>
            )}
            
            <TouchableOpacity
                onPress={() => enabled && setModalVisible(true)}
                activeOpacity={0.7}
                style={[
                    styles.dropdown,
                    { 
                        backgroundColor: T.inputBg, 
                        borderColor: error ? '#FF4444' : T.inputBorder,
                        opacity: enabled ? 1 : 0.5 
                    }
                ]}
            >
                <Text style={[
                    styles.valueText, 
                    { color: value ? T.text : T.placeholder }
                ]} numberOfLines={1}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#DF2324" />
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: T.text }]}>{label || 'Select Option'}</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color={T.subText} />
                                    </TouchableOpacity>
                                </View>
                                
                                <FlatList
                                    data={options}
                                    keyExtractor={(item) => item.toString()}
                                    renderItem={renderItem}
                                    contentContainerStyle={styles.listPadding}
                                    showsVerticalScrollIndicator={false}
                                    style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1.2,
        marginLeft: 2,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
    },
    valueText: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        flex: 1,
    },
    errorText: {
        color: '#FF4444',
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    optionText: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    listPadding: {
        paddingBottom: 20,
    }
});

export default ModernDropdown;
