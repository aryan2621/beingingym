import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { radius, space, useColors } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function Screen({ children, scroll = true, ...props }: ScrollViewProps & { scroll?: boolean }) {
    const c = useColors();
    const content = scroll ? (
        <ScrollView contentContainerStyle={styles.screenContent} {...props}>
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.screenContent, { flex: 1 }]}>{children}</View>
    );
    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
            {content}
        </SafeAreaView>
    );
}

export function Title({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
    const c = useColors();
    return (
        <View style={{ marginBottom: space(5) }}>
            <Text style={[styles.title, { color: c.text }]}>{children}</Text>
            {subtitle ? <Text style={{ color: c.muted, marginTop: space(1), fontSize: 15 }}>{subtitle}</Text> : null}
        </View>
    );
}

export function Card({ style, ...props }: ViewProps) {
    const c = useColors();
    return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]} {...props} />;
}

export function Label({ children }: { children: React.ReactNode }) {
    const c = useColors();
    return <Text style={{ color: c.muted, fontSize: 13, fontWeight: '500' }}>{children}</Text>;
}

export function Big({ children, color }: { children: React.ReactNode; color?: string }) {
    const c = useColors();
    return <Text style={{ color: color ?? c.text, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 2 }}>{children}</Text>;
}

type ButtonProps = PressableProps & {
    title: string;
    icon?: IconName;
    variant?: 'primary' | 'outline' | 'danger' | 'ghost';
    loading?: boolean;
    size?: 'md' | 'lg';
};

export function Button({ title, icon, variant = 'primary', loading, size = 'md', disabled, style, ...props }: ButtonProps) {
    const c = useColors();
    const palette = {
        primary: { bg: c.primary, fg: c.onPrimary, border: c.primary },
        outline: { bg: 'transparent', fg: c.text, border: c.border },
        danger: { bg: 'transparent', fg: c.danger, border: c.danger },
        ghost: { bg: 'transparent', fg: c.primary, border: 'transparent' },
    }[variant];
    return (
        <Pressable
            accessibilityRole='button'
            accessibilityLabel={title}
            disabled={disabled || loading}
            style={(state) => [
                styles.button,
                size === 'lg' && styles.buttonLg,
                { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.5 : state.pressed ? 0.85 : 1 },
                typeof style === 'function' ? style(state) : style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={palette.fg} />
            ) : (
                <>
                    {icon ? <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={palette.fg} /> : null}
                    <Text style={{ color: palette.fg, fontWeight: '700', fontSize: size === 'lg' ? 17 : 15 }}>{title}</Text>
                </>
            )}
        </Pressable>
    );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
    const c = useColors();
    return (
        <Pressable
            accessibilityRole='button'
            accessibilityState={{ selected }}
            onPress={onPress}
            style={[styles.chip, { backgroundColor: selected ? c.primary : c.card, borderColor: selected ? c.primary : c.border }]}
        >
            <Text style={{ color: selected ? c.onPrimary : c.text, fontWeight: '600' }}>{label}</Text>
        </Pressable>
    );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
    const c = useColors();
    return (
        <View style={[styles.segmented, { backgroundColor: c.surface, borderColor: c.border }]}>
            {options.map((o) => (
                <Pressable
                    key={o}
                    accessibilityRole='button'
                    accessibilityState={{ selected: o === value }}
                    onPress={() => onChange(o)}
                    style={[styles.segment, o === value && { backgroundColor: c.card, borderColor: c.border, borderWidth: 1 }]}
                >
                    <Text style={{ color: o === value ? c.text : c.muted, fontWeight: '600' }}>{o}</Text>
                </Pressable>
            ))}
        </View>
    );
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
    const c = useColors();
    return (
        <View style={{ alignItems: 'center', paddingVertical: space(12), gap: space(3) }}>
            <Ionicons name={icon} size={36} color={c.muted} />
            <Text style={{ color: c.muted, textAlign: 'center', maxWidth: 260 }}>{text}</Text>
        </View>
    );
}

export function Loading() {
    const c = useColors();
    return <ActivityIndicator style={{ paddingVertical: space(12) }} color={c.primary} />;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
    const c = useColors();
    return <Text style={{ color: c.danger, marginVertical: space(2) }}>{children}</Text>;
}

export function IconBadge({ name }: { name: IconName }) {
    const c = useColors();
    return (
        <View style={[styles.iconBadge, { backgroundColor: c.accent }]}>
            <Ionicons name={name} size={18} color={c.onAccent} />
        </View>
    );
}

const styles = StyleSheet.create({
    screenContent: { padding: space(5), paddingBottom: space(10) },
    title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    card: { borderWidth: 1, borderRadius: radius.lg, padding: space(4) },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space(2),
        height: 48,
        paddingHorizontal: space(5),
        borderRadius: radius.md,
        borderWidth: 1,
    },
    buttonLg: { height: 56, borderRadius: radius.lg },
    chip: { paddingHorizontal: space(4), paddingVertical: space(2), borderRadius: 999, borderWidth: 1 },
    segmented: { flexDirection: 'row', borderRadius: radius.md, borderWidth: 1, padding: 4 },
    segment: { flex: 1, alignItems: 'center', paddingVertical: space(2), borderRadius: radius.sm },
    iconBadge: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
