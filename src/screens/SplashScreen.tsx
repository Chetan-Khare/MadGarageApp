import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    Animated,
    Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient'; // Added for smooth grid dissolve

const { width, height } = Dimensions.get('window');

// ── Floating Ambient Dots ───────────────────────────────────────────────────
const DOTS = [
    { x: 0.08, y: 0.1, size: 2 }, { x: 0.85, y: 0.12, size: 1.5 },
    { x: 0.15, y: 0.42, size: 1.2 }, { x: 0.9, y: 0.38, size: 2 },
    { x: 0.05, y: 0.7, size: 1.5 }, { x: 0.92, y: 0.68, size: 1.2 },
    { x: 0.22, y: 0.88, size: 2 }, { x: 0.75, y: 0.9, size: 1.5 },
    { x: 0.5, y: 0.05, size: 1 }, { x: 0.48, y: 0.92, size: 1 },
];

const Particle = ({ x, y, size, delay }: { x: number, y: number, size: number, delay: number }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(opacity, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 0.1, duration: 1200, useNativeDriver: true }),
                    ]),
                    Animated.sequence([
                        Animated.timing(translateY, { toValue: -15, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                        Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
                    ]),
                ]),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{
            position: 'absolute', left: x * width, top: y * height,
            width: size * 2, height: size * 2, borderRadius: size,
            backgroundColor: '#DF2324', opacity, transform: [{ translateY }],
        }} />
    );
};

// ── Exact RN Translation of your HTML Astronaut ────────────────────────────
const HtmlAstronaut = () => {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -15,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                })
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.loader, { transform: [{ translateY: floatAnim }] }]}>
            {/* The outer span container with the 4 exhaust/leg spans */}
            <View style={styles.spanGroup}>
                <View style={styles.spanItem} />
                <View style={styles.spanItem} />
                <View style={styles.spanItem} />
                <View style={styles.spanItem} />
            </View>

            {/* The main base and face */}
            <View style={styles.base}>
                {/* FIX 2: baseSpan renders first, face renders on top naturally without zIndex: -1 */}
                <View style={styles.baseSpan} />
                <View style={styles.face} />
            </View>
        </Animated.View>
    );
};

// ── 3D Perspective Grid ────────────────────────────────────────────────────────
const PerspectiveGrid = () => {
    const translateZ = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(translateZ, {
                toValue: 60, duration: 800, easing: Easing.linear, useNativeDriver: true,
            })
        ).start();
    }, []);

    const gridLines = [];
    for (let i = -10; i <= 10; i++) {
        let x = i * 60;
        gridLines.push(<Path key={`v${i}`} d={`M ${x} 0 L ${x} 800`} stroke="rgba(223, 35, 36, 0.4)" strokeWidth="1.5" />);
    }
    for (let i = 0; i <= 20; i++) {
        let y = i * 60;
        gridLines.push(<Path key={`h${i}`} d={`M -600 ${y} L 600 ${y}`} stroke="rgba(223, 35, 36, 0.4)" strokeWidth="1.5" />);
    }

    return (
        <View style={styles.gridContainer}>
            <Animated.View style={[styles.gridBox, {
                transform: [{ perspective: 400 }, { rotateX: '75deg' }, { translateY: translateZ }]
            }]}>
                <Svg width="1200" height="800" viewBox="-600 0 1200 800">{gridLines}</Svg>
            </Animated.View>

            {/* FIX 3: Replaced static view with LinearGradient for smooth dissolve */}
            <LinearGradient
                colors={['#08080C', 'transparent']}
                style={styles.gridFadeOverlay}
            />
        </View>
    );
};

const SplashScreen: React.FC = () => {
    const glowOpacity = useRef(new Animated.Value(0.4)).current;
    const glowScale = useRef(new Animated.Value(0.9)).current;
    const logoScale = useRef(new Animated.Value(0.6)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(20)).current;

    // FIX 1 & 5: New Animated Refs for Progress Bar and System Blink
    const progressTranslate = useRef(new Animated.Value(-280)).current;
    const progressOpacity = useRef(new Animated.Value(0)).current;
    const systemBlink = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Red Core Glow pulse
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(glowOpacity, { toValue: 0.85, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(glowOpacity, { toValue: 0.25, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(glowScale, { toValue: 1.1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(glowScale, { toValue: 0.9, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
            ])
        ).start();

        // FIX 5: Slow blink pulse for "SYSTEM UNDER LOAD"
        Animated.loop(
            Animated.sequence([
                Animated.timing(systemBlink, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(systemBlink, { toValue: 0.3, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // FIX 1: Recursive Progress Bar Loop (Fade In -> Slide -> Fade Out -> Reset Invisible)
        const runProgressLoop = () => {
            progressTranslate.setValue(-280);
            progressOpacity.setValue(0);

            Animated.sequence([
                Animated.timing(progressOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(progressTranslate, { toValue: 280, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(progressOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start(() => runProgressLoop());
        };
        runProgressLoop();

        // Entrance Animations (Logo -> Title)
        Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(titleTranslate, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ])
        ]).start();
    }, []);

    return (
        <View style={styles.root}>
            <PerspectiveGrid />

            <Animated.View style={[
                styles.radialGlow,
                { opacity: glowOpacity, transform: [{ scale: glowScale }] }
            ]} />

            {DOTS.map((d, i) => (
                <Particle key={i} x={d.x} y={d.y} size={d.size} delay={i * 200} />
            ))}

            {/* ── Top Header Bar ── */}
            <View style={styles.header}>
                <View style={styles.headerIconPlaceholder} />
                <View style={styles.nodeStatusContainer}>
                    {/* FIX 4: Static green dot, removed unused nodePulseOpacity */}
                    <View style={styles.nodeIndicator} />
                    <Text style={styles.nodeText}>NODE-04 ACTIVE</Text>
                </View>
            </View>

            {/* ── Main Content Layer ── */}
            <View style={styles.contentWrap}>

                {/* 1. Mad Garage Logo */}
                <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                    <View style={styles.logoRing}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.logo} />
                    </View>
                </Animated.View>

                {/* 2. Mad Garage Text */}
                <Animated.Text style={[styles.brandTitle, { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
                    <Text style={styles.brandTitleBold}>MAD GARAGE</Text>
                </Animated.Text>

                {/* 3. HTML-based Astronaut Replacement */}
                <HtmlAstronaut />

                {/* 4. HTML Typography & Loading Bar */}
                <View style={styles.loaderTextContainer}>
                    <Text style={styles.fetchingText}>FETCHING CONTENT</Text>
                    <Text style={styles.calibratingText}>
                        Calibrating neural data buffers • EST. 2.4s
                    </Text>

                    {/* FIX 1: Linked opacity to the recursive loop fade */}
                    <View style={styles.progressBarTrack}>
                        <Animated.View style={[
                            styles.progressBarFill,
                            {
                                opacity: progressOpacity,
                                transform: [{ translateX: progressTranslate }]
                            }
                        ]} />
                    </View>
                </View>
            </View>

            {/* FIX 5: Animated telemetry text with ● prefix and brand red color */}
            <Animated.View style={[styles.bottomStatus, { opacity: systemBlink }]}>
                <Text style={styles.systemLoadText}>● SYSTEM UNDER LOAD</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#08080C', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    gridContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.5, alignItems: 'center', overflow: 'hidden' },
    gridBox: { position: 'absolute', top: -100 },
    gridFadeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 }, // FIX 3: Background & opacity removed for LinearGradient
    radialGlow: { position: 'absolute', width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45, backgroundColor: 'rgba(223, 35, 36, 0.08)', top: height * 0.05 },

    header: { position: 'absolute', top: 0, width: '100%', padding: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 },
    headerIconPlaceholder: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 },
    nodeStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nodeIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
    nodeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, color: '#9ca3af' },

    contentWrap: { alignItems: 'center', paddingHorizontal: 24, marginTop: -20 },

    // Logo 
    logoWrap: { marginBottom: 20 },
    logoRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#DF2324', backgroundColor: '#0F0F14', justifyContent: 'center', alignItems: 'center', shadowColor: '#DF2324', shadowOffset: { width: 0, height: 0 }, shadowRadius: 16, shadowOpacity: 0.5, elevation: 10, overflow: 'hidden' },
    logo: { width: 96, height: 96, resizeMode: 'cover', borderRadius: 48 },

    // Title 
    brandTitle: { flexDirection: 'row', textAlign: 'center', marginBottom: 40 },
    brandTitleBold: { color: '#DF2324', fontSize: 28, fontWeight: '900', letterSpacing: 4, textShadowColor: 'rgba(223, 35, 36, 0.7)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },

    // HTML Astronaut Styles
    loader: { width: 64, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 40, zIndex: 10 },
    base: { width: 50, height: 65, backgroundColor: '#FFFFFF', borderRadius: 25, borderWidth: 3, borderColor: '#1F2937', alignItems: 'center', paddingTop: 10, zIndex: 2 },
    face: { width: 32, height: 20, backgroundColor: '#1F2937', borderRadius: 10, marginTop: 4 },
    baseSpan: { position: 'absolute', width: 60, height: 40, backgroundColor: '#E5E7EB', borderRadius: 15, borderWidth: 3, borderColor: '#1F2937', top: 10 }, // FIX 2: Removed zIndex: -1
    spanGroup: { flexDirection: 'row', position: 'absolute', bottom: -10, gap: 6, zIndex: 1 },
    spanItem: { width: 6, height: 16, backgroundColor: '#DF2324', borderRadius: 3 },

    // Loader Typography & Bar
    loaderTextContainer: { alignItems: 'center', width: 280 },
    fetchingText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
    calibratingText: { fontSize: 10, color: '#6B7280', letterSpacing: 3, fontWeight: '600', textTransform: 'uppercase', marginBottom: 32, textAlign: 'center' },
    progressBarTrack: { width: '100%', height: 2, backgroundColor: '#1F2937', overflow: 'hidden', position: 'relative' },
    progressBarFill: { width: '33%', height: '100%', backgroundColor: '#DF2324', position: 'absolute', left: 0 },

    // FIX 4: Removed 4 unused Telemetry styles (Left/Right/Text/TextRight)

    // Status
    bottomStatus: { position: 'absolute', bottom: 24, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    systemLoadText: { fontSize: 10, color: '#DF2324', fontWeight: 'bold', letterSpacing: 4 } // FIX 5: Color set to brand red and font weight increased
});

export default SplashScreen;