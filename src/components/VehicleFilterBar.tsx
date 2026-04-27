import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModernDropdown from './ModernDropdown';
import { useVehicles } from '../hooks/useVehicles';

interface Props {
    selection: {
        make: string;
        model: string;
        year: string;
        fuel: string;
        trim: string;
        engine: string;
    };
    onSelectionChange: (field: string, value: string) => void;
    onClear: () => void;
    isVisible: boolean;
    onToggleVisibility: () => void;
    theme: any;
}

export const VehicleFilterBar: React.FC<Props> = ({
    selection,
    onSelectionChange,
    onClear,
    isVisible,
    onToggleVisibility,
    theme: T
}) => {
    const v = useVehicles();
    
    const { data: makes = [] } = v.useMakes();
    const { data: models = [] } = v.useModels(selection.make);
    const { data: years = [] } = v.useYears(selection.make, selection.model);
    const { data: fuels = [] } = v.useFuels(selection.make, selection.model, selection.year);
    const { data: trims = [] } = v.useTrims(selection.make, selection.model, selection.year, selection.fuel);
    const { data: engines = [] } = v.useEngines(selection.make, selection.model, selection.year, selection.fuel, selection.trim);

    const toggle = () => {
        if (Platform.OS !== 'web') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        onToggleVisibility();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.toggleBar,
                    { backgroundColor: T.inputBg, borderColor: selection.engine ? '#DF232466' : T.inputBorder }
                ]}
                onPress={toggle}
                activeOpacity={0.7}
            >
                <Ionicons name="car-outline" size={18} color={selection.engine ? '#DF2324' : T.subText} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    {selection.engine ? (
                        <Text style={[styles.summaryText, { color: T.text }]}>
                            {selection.year} {selection.make} {selection.model} • {selection.trim}
                        </Text>
                    ) : (
                        <Text style={[styles.placeholderText, { color: T.subText }]}>
                            Select Your Vehicle for Precise Fitment
                        </Text>
                    )}
                </View>
                <Ionicons
                    name={isVisible ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={T.subText}
                />
            </TouchableOpacity>

            {selection.engine && !isVisible && (
                <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
                    <Ionicons name="close-circle" size={20} color="#DF2324" />
                </TouchableOpacity>
            )}

            {isVisible && (
                <View style={[styles.filterContent, { backgroundColor: T.bg }]}>
                    <View style={styles.pickerRow}>
                        <ModernDropdown
                            label="MAKE"
                            value={selection.make}
                            options={makes}
                            onSelect={(val) => onSelectionChange('make', val)}
                            placeholder="Select Make"
                            containerStyle={{ flex: 1 }}
                        />
                        <ModernDropdown
                            label="MODEL"
                            value={selection.model}
                            options={models}
                            onSelect={(val) => onSelectionChange('model', val)}
                            placeholder="Select Model"
                            enabled={!!selection.make}
                            containerStyle={{ flex: 1 }}
                        />
                    </View>
                    <View style={styles.pickerRow}>
                        <ModernDropdown
                            label="YEAR"
                            value={selection.year}
                            options={years}
                            onSelect={(val) => onSelectionChange('year', val)}
                            placeholder="Select Year"
                            enabled={!!selection.model}
                            containerStyle={{ flex: 1 }}
                        />
                        <ModernDropdown
                            label="FUEL"
                            value={selection.fuel}
                            options={fuels}
                            onSelect={(val) => onSelectionChange('fuel', val)}
                            placeholder="Select Fuel"
                            enabled={!!selection.year}
                            containerStyle={{ flex: 1 }}
                        />
                    </View>
                    <View style={styles.pickerRow}>
                        <ModernDropdown
                            label="TRIM"
                            value={selection.trim}
                            options={trims}
                            onSelect={(val) => onSelectionChange('trim', val)}
                            placeholder="Select Trim"
                            enabled={!!selection.fuel}
                            containerStyle={{ flex: 1 }}
                        />
                        <ModernDropdown
                            label="ENGINE"
                            value={selection.engine}
                            options={engines}
                            onSelect={(val) => {
                                onSelectionChange('engine', val);
                                toggle();
                            }}
                            placeholder="Select Engine"
                            enabled={!!selection.trim}
                            containerStyle={{ flex: 1 }}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        position: 'relative'
    },
    toggleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 54,
        borderRadius: 18,
        borderWidth: 1.5,
    },
    summaryText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Inter-Bold' : 'sans-serif-medium',
    },
    placeholderText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Inter-Medium' : 'sans-serif',
        letterSpacing: -0.2
    },
    clearBtn: {
        position: 'absolute',
        right: 42,
        top: 17,
        zIndex: 10
    },
    filterContent: {
        marginTop: 12,
        padding: 4,
        gap: 12
    },
    pickerRow: {
        flexDirection: 'row',
        gap: 12
    }
});
