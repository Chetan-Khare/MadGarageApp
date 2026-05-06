import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyPolicyScreen() {
  const { isDark } = useThemeStore();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const T = {
    bg: isDark ? '#000000' : '#F0F1F3',
    card: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subText: isDark ? '#B0B0C0' : '#55555C',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={T.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: T.text }]}>PRIVACY POLICY</Text>
          <Text style={styles.headerSub}>LAST UPDATED: MAY 6, 2026</Text>
        </View>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.shieldIconWrapper}>
            <Ionicons name="shield-checkmark" size={40} color="#DF2324" />
          </View>
          <Text style={[styles.bannerTitle, { color: T.text }]}>DATA SECURITY PROTOCOL</Text>
          <Text style={[styles.bannerSub, { color: T.subText }]}>VERSION 1.0 • SECURE DATA INITIATIVE</Text>
        </View>

        {/* Content Box */}
        <View style={[styles.contentBox, { backgroundColor: T.card, borderColor: T.border }]}>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye" size={20} color="#DF2324" />
              <Text style={[styles.sectionTitle, { color: T.text }]}>INFORMATION WE COLLECT</Text>
            </View>
            <Text style={[styles.paragraph, { color: T.subText }]}>
              At MAD GARAGE, we prioritize the security of your automotive data. To provide precision fitment and AI-driven recommendations, we collect:
            </Text>
            
            <View style={styles.bulletList}>
              {['Vehicle Build Specifications', 'Precise Location (Geo-fencing)', 'Transaction History', 'AI Chat Interactions'].map((item, idx) => (
                <View key={idx} style={[styles.bulletItem, { backgroundColor: isDark ? '#111' : '#F8F9FA', borderColor: T.border }]}>
                  <Ionicons name="chevron-forward" size={16} color="#DF2324" />
                  <Text style={[styles.bulletText, { color: T.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed" size={20} color="#DF2324" />
              <Text style={[styles.sectionTitle, { color: T.text }]}>DATA SECURITY PROTOCOL</Text>
            </View>
            <Text style={[styles.paragraph, { color: T.subText }]}>
              Our infrastructure is hardened with enterprise-grade encryption. Every transmission is secured via TLS 1.3, and personal identifiers are purged from our AI training models to ensure absolute anonymity.
            </Text>
            
            <View style={[styles.highlightBox, { borderColor: 'rgba(223,35,36,0.3)' }]}>
              <Ionicons name="shield-half" size={24} color="#DF2324" />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.highlightTitle, { color: T.text }]}>END-TO-END ENCRYPTION</Text>
                <Text style={[styles.highlightSub, { color: T.subText }]}>YOUR GARAGE TELEMETRY IS PRIVATE.</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="documents" size={20} color="#DF2324" />
              <Text style={[styles.sectionTitle, { color: T.text }]}>THIRD-PARTY PARTNERS</Text>
            </View>
            <Text style={[styles.paragraph, { color: T.subText }]}>
              We only share limited telemetry with verified sellers and logistics partners when necessary to fulfill your precision fitment requests or logistics. No data is ever sold for marketing purposes.
            </Text>
          </View>

        </View>
        
        {/* Contact Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: T.subText }]}>QUESTIONS REGARDING OUR DATA SOVEREIGNTY?</Text>
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:support@madgarage.com')}
          >
            <Text style={styles.contactBtnText}>CONTACT SECURITY DESK</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
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
    color: '#DF2324',
    marginTop: -2,
    letterSpacing: 0.5,
  },
  scrollContent: { padding: 20 },
  bannerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  shieldIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(223,35,36,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
    textAlign: 'center',
  },
  bannerSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 5,
  },
  contentBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginLeft: 10,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  bulletText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 10,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223,35,36,0.05)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  highlightSub: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 15,
    textAlign: 'center',
  },
  contactBtn: {
    backgroundColor: '#DF2324',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  contactBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
