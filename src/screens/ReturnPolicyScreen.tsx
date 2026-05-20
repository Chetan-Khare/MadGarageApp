import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function ReturnPolicyScreen() {
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
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={T.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: T.text }]}>RETURN POLICY</Text>
          <Text style={styles.headerSub}>LAST UPDATED: MAY 20, 2026</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="refresh-circle" size={44} color="#DF2324" />
          </View>
          <Text style={[styles.bannerTitle, { color: T.text }]}>RETURN {'&'} REFUND ENGINE</Text>
          <Text style={[styles.bannerSub, { color: T.subText }]}>VERSION 1.1 • HARDENED CLAIMS MANAGEMENT</Text>
        </View>

        {/* Content Box */}
        <View style={[styles.contentBox, { backgroundColor: T.card, borderColor: T.border }]}>
          
          {/* Eligibility section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#DF2324" />
              <Text style={[styles.sectionTitle, { color: T.text }]}>10-DAY EASY RETURN WINDOW</Text>
            </View>
            <Text style={[styles.paragraph, { color: T.subText }]}>
              Eligible parts marked as Returnable can be returned or exchanged within 10 days of delivery if they meet the following:
            </Text>
            
            <View style={styles.bulletList}>
              {[
                'Unused & Uninstalled condition (No mounting bolts or marks)',
                'Original box packaging with all tags intact',
                'All brackets, gaskets, seals, and hardware included',
                'Proof of purchase or receipt summary'
              ].map((item, idx) => (
                <View key={idx} style={[styles.bulletItem, { backgroundColor: isDark ? '#111' : '#F8F9FA', borderColor: T.border }]}>
                  <Ionicons name="chevron-forward" size={16} color="#DF2324" />
                  <Text style={[styles.bulletText, { color: T.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Final Sale section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color="#DF2324" />
              <Text style={[styles.sectionTitle, { color: T.text }]}>NON-RETURNABLE (FINAL SALE)</Text>
            </View>
            <Text style={[styles.paragraph, { color: T.subText }]}>
              Items designated as Non-Returnable are ineligible for returns, refunds, or replacements due to safety or customization reasons.
            </Text>
            
            <View style={[styles.highlightBox, { borderColor: 'rgba(223,35,36,0.3)' }]}>
              <Ionicons name="warning" size={24} color="#DF2324" />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.highlightTitle, { color: T.text }]}>CRITICAL EXCEPTION</Text>
                <Text style={[styles.highlightSub, { color: T.subText }]}>
                  ECUs, custom fabricated components, and engine builds once shipped are final sale. Please verify fitment using AI Mechanic before purchasing.
                </Text>
              </View>
            </View>
          </View>

          {/* Logistics section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bus" size={20} color="#DF2324" />
              <Text style={[styles.sectionTitle, { color: T.text }]}>REVERSE LOGISTICS {'&'} PICKUPS</Text>
            </View>
            <Text style={[styles.paragraph, { color: T.subText }]}>
              Once approved by our audit staff, a courier collection is requested. Doorstep pickups are executed within 2-3 business days. Additional time may be required for heavy freight objects.
            </Text>
          </View>

          {/* Timelines section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color="#DF2324" />
              <Text style={[styles.sectionTitle, { color: T.text }]}>REFUND TIMELINES</Text>
            </View>
            <Text style={[styles.paragraph, { color: T.subText }]}>
              Refunds are processed to the original bank source within 5-7 business days after the part passes physical inspection at our central garage node.
            </Text>
          </View>

        </View>
        
        {/* Contact Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: T.subText }]}>NEED ASSISTANCE WITH REPLACEMENTS?</Text>
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:returns@madgarage.com')}
          >
            <Text style={styles.contactBtnText}>CONTACT RETURNS DESK</Text>
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
  spacer: { width: 40 },
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
  iconWrapper: {
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
    flex: 1,
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
    flex: 1,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    letterSpacing: 0.5,
    marginTop: 4,
    lineHeight: 14,
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
