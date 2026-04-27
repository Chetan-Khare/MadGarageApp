import React from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
    id: string;
    label: string;
    icon: string;
}

const CATEGORIES: Category[] = [
    { id: 'All', label: 'All Parts', icon: 'apps-outline' },
    { id: 'Brakes', label: 'Brakes', icon: 'disc-outline' },
    { id: 'Engine', label: 'Engine', icon: 'speedometer-outline' },
    { id: 'Suspension', label: 'Suspension', icon: 'construct-outline' },
    { id: 'Exhaust', label: 'Exhaust', icon: 'flame-outline' },
    { id: 'Electrical', label: 'Electrical', icon: 'flash-outline' },
];

interface Props {
    activeCategory: string;
    onSelect: (id: string) => void;
    theme: any;
}

export const CategoryList: React.FC<Props> = ({ activeCategory, onSelect, theme: T }) => {
    return (
        <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item: cat }) => (
                <TouchableOpacity
                    style={[
                        styles.pill,
                        { backgroundColor: T.inputBg, borderColor: T.inputBorder },
                        activeCategory === cat.id && styles.pillActive
                    ]}
                    onPress={() => onSelect(cat.id)}
                >
                    <Ionicons 
                        name={cat.icon as any} 
                        size={14} 
                        color={activeCategory === cat.id ? '#FFF' : T.subText} 
                    />
                    <Text style={[
                        styles.text, 
                        { color: T.subText }, 
                        activeCategory === cat.id && styles.textActive
                    ]}>
                        {cat.label}
                    </Text>
                </TouchableOpacity>
            )}
        />
    );
};

const styles = StyleSheet.create({
    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 8,
        gap: 10
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        gap: 8
    },
    pillActive: {
        backgroundColor: '#DF2324',
        borderColor: '#DF2324',
    },
    text: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    textActive: {
        color: '#FFF'
    }
});
