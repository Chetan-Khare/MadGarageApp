import React, { useEffect, useRef, useState } from 'react';
import {
    Animated, Text, StyleSheet, View, TouchableOpacity, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastRef {
    show: (config: ToastConfig) => void;
}

// Singleton ref so any component can call Toast.show()
let toastRef: ToastRef | null = null;

export const Toast = {
    show: (config: ToastConfig) => {
        toastRef?.show(config);
    },
};

const TYPE_CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    success: { icon: 'checkmark-circle',  color: '#22C55E' },
    error:   { icon: 'close-circle',      color: '#DF2324' },
    info:    { icon: 'information-circle', color: '#3B82F6' },
};

export const ToastProvider: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<ToastConfig>({ message: '', type: 'success' });
    const translateY = useRef(new Animated.Value(120)).current;
    const opacity    = useRef(new Animated.Value(0)).current;
    const timer      = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        toastRef = {
            show: (cfg) => {
                if (timer.current) clearTimeout(timer.current);

                setConfig(cfg);
                setVisible(true);

                // Slide up + fade in
                Animated.parallel([
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
                    Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
                ]).start();

                timer.current = setTimeout(() => {
                    // Slide down + fade out
                    Animated.parallel([
                        Animated.timing(translateY, { toValue: 120, duration: 250, useNativeDriver: true }),
                        Animated.timing(opacity,    { toValue: 0,   duration: 250, useNativeDriver: true }),
                    ]).start(() => setVisible(false));
                }, cfg.duration ?? 2500);
            },
        };

        return () => { toastRef = null; };
    }, []);

    if (!visible) return null;

    const { icon, color } = TYPE_CONFIG[config.type ?? 'success'];

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY }], opacity },
            ]}
            pointerEvents="box-none"
        >
            <View style={[styles.pill, { borderLeftColor: color }]}>
                <Ionicons name={icon} size={20} color={color} style={{ marginRight: 10 }} />
                <Text style={styles.text} numberOfLines={2}>{config.message}</Text>
                <TouchableOpacity onPress={() => setVisible(false)} style={{ marginLeft: 8 }}>
                    <Ionicons name="close" size={16} color="#888" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 90 : 80,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        width: '100%',
    },
    text: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
});
