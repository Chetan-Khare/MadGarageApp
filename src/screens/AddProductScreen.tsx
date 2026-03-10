import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/apiClient';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;
};

export default function AddProductScreen({ navigation }: Props) {
    const [partName, setPartName] = useState('');
    const [brand, setBrand] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('All Tech');
    const [price, setPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!partName || !price || !stockQuantity || !imageUri) {
            Alert.alert("Missing Details", "Please fill out the name, price, stock, and select an image.");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();

            // Append Image
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: imageUri,
                name: filename,
                type: type
            } as any);

            // Append Data
            formData.append('partName', partName);
            formData.append('brand', brand || 'Mad Garage');
            formData.append('sku', sku || `MG-${Math.floor(Math.random() * 10000)}`);
            formData.append('category', category);
            formData.append('price', price);
            formData.append('stockQuantity', stockQuantity);
            formData.append('description', description || 'High performance part.');

            // Dummy vehicle IDs for now
            formData.append('vehicleIds', '1');

            await apiClient.post('/seller/inventory', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert("Success", "Part successfully listed!");
            navigation.goBack();

        } catch (error: any) {
            console.error("Upload failed", error);
            Alert.alert("Upload Failed", "Could not list the part. Check the server connection.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FF3333" />
                </TouchableOpacity>
                <Text style={styles.title}>New Listing</Text>
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                    <Text style={styles.imagePickerSuccess}>Image Selected ✓</Text>
                ) : (
                    <>
                        <Ionicons name="camera-outline" size={40} color="#FF3333" />
                        <Text style={styles.imagePickerText}>Upload Part Photo</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={styles.form}>
                <Text style={styles.label}>PART NAME</Text>
                <TextInput style={styles.input} placeholderTextColor="#666" placeholder="e.g. Forged Pistons" value={partName} onChangeText={setPartName} />

                <Text style={styles.label}>BRAND</Text>
                <TextInput style={styles.input} placeholderTextColor="#666" placeholder="e.g. CP Carrillo" value={brand} onChangeText={setBrand} />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>PRICE (USD)</Text>
                        <TextInput style={styles.input} placeholderTextColor="#666" placeholder="99.99" keyboardType="numeric" value={price} onChangeText={setPrice} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>STOCK QTY</Text>
                        <TextInput style={styles.input} placeholderTextColor="#666" placeholder="10" keyboardType="numeric" value={stockQuantity} onChangeText={setStockQuantity} />
                    </View>
                </View>

                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholderTextColor="#666"
                    placeholder="Enter detailed specifications..."
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleUpload} disabled={uploading}>
                    {uploading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>PUBLISH TO MARKETPLACE</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 10 },
    backButton: { marginRight: 15 },
    title: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    imagePicker: {
        height: 150,
        backgroundColor: '#111',
        borderWidth: 2,
        borderColor: '#FF333333',
        borderStyle: 'dashed',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    imagePickerText: { color: '#888', marginTop: 10, fontWeight: 'bold' },
    imagePickerSuccess: { color: '#00FF00', fontWeight: 'bold', fontSize: 16 },
    form: { marginBottom: 50 },
    label: { color: '#FF3333', fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    input: {
        backgroundColor: '#111',
        color: '#FFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 16,
    },
    row: { flexDirection: 'row' },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitBtn: {
        backgroundColor: '#FF3333',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
