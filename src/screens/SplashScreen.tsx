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
import Animated2, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing as REasing,
    useDerivedValue,
    runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedPath = Animated2.createAnimatedComponent(Path);

// ── Gauge constants ───────────────────────────────────────────────────────────
const RADIUS = 100;
const STROKE_WIDTH = 12;
const SVG_SIZE = 260;
const CENTER = SVG_SIZE / 2;
const CIRCUMFERENCE = Math.PI * RADIUS;

const arcPath = `M ${CENTER - RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${CENTER}`;

const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg - 180) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

// ── Dot positions for a constellation ambient effect ─────────────────────────
const DOTS = [
    { x: 0.08, y: 0.1, size: 2 },
    { x: 0.85, y: 0.12, size: 1.5 },
    { x: 0.15, y: 0.42, size: 1.2 },
    { x: 0.9, y: 0.38, size: 2 },
    { x: 0.05, y: 0.7, size: 1.5 },
    { x: 0.92, y: 0.68, size: 1.2 },
    { x: 0.22, y: 0.88, size: 2 },
    { x: 0.75, y: 0.9, size: 1.5 },
    { x: 0.5, y: 0.05, size: 1 },
    { x: 0.48, y: 0.92, size: 1 },
];

// ── Floating particle component ───────────────────────────────────────────────
const Particle = ({ x, y, size, delay }: { x: number, y: number, size: number, delay: number }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(opacity, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 0.1, duration: 1200, useNativeDriver: true }),
                    ]),
                    Animated.sequence([
                        Animated.timing(translateY, { toValue: -12, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                        Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
                    ]),
                ]),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: x * width,
                top: y * height,
                width: size * 2,
                height: size * 2,
                borderRadius: size,
                backgroundColor: '#DF2324',
                opacity,
                transform: [{ translateY }],
            }}
        />
    );
};

const SplashScreen: React.FC = () => {
    // ── Reanimated shared values ──────────────────────────────────────────────
    const rpm = useSharedValue(0);
    const [displayValue, setDisplayValue] = React.useState(0);

    // ── Animated (legacy API for subtle glow pulses) ──────────────────────────
    const glowOpacity = useRef(new Animated.Value(0.4)).current;
    const glowScale = useRef(new Animated.Value(0.9)).current;
    const logoScale = useRef(new Animated.Value(0.6)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(20)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const lineWidth = useRef(new Animated.Value(0)).current;
    const barWidth = useRef(new Animated.Value(0)).current;
    const BAR_TOTAL = width * 0.65;

    useEffect(() => {
        // Gauge fill
        rpm.value = withTiming(100, { duration: 2600, easing: REasing.out(REasing.cubic) });
        // Loading bar (parallel with gauge)
        Animated.timing(barWidth, { toValue: BAR_TOTAL, duration: 2600, useNativeDriver: false }).start();

        // Glow pulse
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

        // Logo entrance
        Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            ]),
        ]).start();

        // Title entrance
        Animated.sequence([
            Animated.delay(700),
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(titleTranslate, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
        ]).start();

        // Separator line grow
        Animated.sequence([
            Animated.delay(900),
            Animated.timing(lineWidth, { toValue: 80, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        ]).start();

        // Subtitle
        Animated.sequence([
            Animated.delay(1100),
            Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const gaugeProps = useAnimatedProps(() => ({
        strokeDashoffset: CIRCUMFERENCE - (rpm.value / 100) * CIRCUMFERENCE,
    }));

    useDerivedValue(() => {
        runOnJS(setDisplayValue)(Math.round(rpm.value));
    });

    const renderTicks = () => {
        const ticks = [];
        for (let i = 0; i <= 180; i += 30) {
            const outerPt = polarToCartesian(CENTER, CENTER, RADIUS + 2, i);
            const innerPt = polarToCartesian(CENTER, CENTER, RADIUS - STROKE_WIDTH - 4, i);
            const isLarge = i % 60 === 0;
            ticks.push(
                <Path
                    key={i}
                    d={`M ${outerPt.x} ${outerPt.y} L ${innerPt.x} ${innerPt.y}`}
                    stroke="#FFF"
                    strokeWidth={isLarge ? 2 : 1}
                    opacity={isLarge ? 0.5 : 0.25}
                />
            );
        }
        return ticks;
    };

    return (
        <View style={styles.root}>
            {/* Background ambient glow (pulsing red circle) */}
            <Animated.View style={[
                styles.radialGlow,
                { opacity: glowOpacity, transform: [{ scale: glowScale }] }
            ]} />

            {/* Floating ambient dots */}
            {DOTS.map((d, i) => (
                <Particle key={i} x={d.x} y={d.y} size={d.size} delay={i * 200} />
            ))}

            {/* ─── Main Content ─────────────────────────────────────────── */}
            <View style={styles.contentWrap}>

                {/* Logo */}
                <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                    <View style={styles.logoRing}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.logo} />
                    </View>
                </Animated.View>

                {/* Brand text */}
                <Animated.Text style={[styles.brandTitle, { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
                    THE MAD GARAGE
                </Animated.Text>

                {/* Separator line */}
                <Animated.View style={[styles.separator, { width: lineWidth }]} />

                {/* Tagline */}
                <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
                    PERFORMANCE & HI-END PARTS
                </Animated.Text>

                {/* ── Gauge ─────────────────────────────────────────────── */}
                <View style={styles.gaugeWrap}>
                    <Svg width={SVG_SIZE} height={CENTER + 30} viewBox={`0 0 ${SVG_SIZE} ${CENTER + 30}`}>
                        {/* Background track */}
                        <Path
                            d={arcPath}
                            stroke="#1E1E26"
                            strokeWidth={STROKE_WIDTH}
                            strokeLinecap="round"
                            fill="none"
                        />
                        {/* Tick marks */}
                        {renderTicks()}
                        {/* Active fill */}
                        <AnimatedPath
                            d={arcPath}
                            stroke="#DF2324"
                            strokeWidth={STROKE_WIDTH}
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                            animatedProps={gaugeProps}
                        />
                    </Svg>

                    {/* Percentage below arc */}
                    <View style={styles.percentageWrap}>
                        <Text style={styles.percentageValue}>{displayValue}<Text style={styles.percentSign}>%</Text></Text>
                        <Text style={styles.statusText}>
                            {displayValue < 40 ? 'BOOTING SYSTEMS' : displayValue < 80 ? 'LOADING ASSETS' : 'SYSTEMS READY'}
                        </Text>
                    </View>
                </View>

                {/* Bottom loading bar */}
                <View style={styles.loadingBarBg}>
                    <Animated.View style={[styles.loadingBarFill, { width: barWidth }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#08080C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radialGlow: {
        position: 'absolute',
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        backgroundColor: 'rgba(223, 35, 36, 0.07)',
        top: height * 0.05,
    },
    contentWrap: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    // Logo
    logoWrap: {
        marginBottom: 20,
    },
    logoRing: {
        width: 112,
        height: 112,
        borderRadius: 56,
        borderWidth: 2.5,
        borderColor: '#DF2324',
        backgroundColor: '#0F0F14',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 24,
        shadowOpacity: 0.6,
        elevation: 18,
        overflow: 'hidden',
    },
    logo: {
        width: 96,
        height: 96,
        resizeMode: 'cover',
        borderRadius: 48,
    },
    // Title
    brandTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 5,
        textAlign: 'center',
        marginBottom: 12,
    },
    separator: {
        height: 2,
        backgroundColor: '#DF2324',
        borderRadius: 2,
        marginBottom: 10,
    },
    tagline: {
        color: '#7A7A88',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 36,
    },
    // Gauge
    gaugeWrap: {
        alignItems: 'center',
        marginBottom: 28,
    },
    percentageWrap: {
        alignItems: 'center',
        marginTop: -8,
    },
    percentageValue: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '900',
        lineHeight: 50,
    },
    percentSign: {
        fontSize: 24,
        fontWeight: '700',
        color: '#DF2324',
    },
    statusText: {
        color: '#DF2324',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 3,
        marginTop: 4,
    },
    // Loading bar
    loadingBarBg: {
        width: width * 0.65,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#1A1A24',
        overflow: 'hidden',
    },
    loadingBarFill: {
        height: '100%',
        backgroundColor: '#DF2324',
        borderRadius: 2,
    },
});

export default SplashScreen;
