// ============================================================
// components/CustomBottomSheet.tsx — Full-screen, above tab bar
// ============================================================

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardEvent,
    ListRenderItem,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Tab bar metrics from your layout */
const TAB_BAR_BOTTOM = 0;
const TAB_BAR_HEIGHT = 20;
const TAB_BAR_TOTAL = TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + 16; // +16 padding gap

interface CustomBottomSheetProps<T = any> {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    showCloseButton?: boolean;
    headerStyle?: ViewStyle;
    cardStyle?: ViewStyle;
    backdropOpacity?: number;
    disableBackdropClose?: boolean;
    /** Optional: pass a FlatList data array to render inside the sheet */
    listData?: T[];
    /** Optional: renderItem for the FlatList */
    renderItem?: ListRenderItem<T>;
    /** Optional: keyExtractor for the FlatList */
    keyExtractor?: (item: T, index: number) => string;
    /** Optional: empty component when listData is empty */
    listEmptyComponent?: React.ReactNode;
}

export default function CustomBottomSheet<T = any>({
    visible,
    onClose,
    title,
    children,
    actions,
    showCloseButton = true,
    headerStyle,
    cardStyle,
    backdropOpacity = 0.55,
    disableBackdropClose = false,
    listData,
    renderItem,
    keyExtractor,
    listEmptyComponent,
}: CustomBottomSheetProps<T>) {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const isVisibleRef = useRef(visible);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        isVisibleRef.current = visible;
    }, [visible]);

    useEffect(() => {
        const handleKeyboardShow = (event: KeyboardEvent) => {
            setKeyboardHeight(event.endCoordinates.height);
        };
        const handleKeyboardHide = () => setKeyboardHeight(0);

        const showSub = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            handleKeyboardShow
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            handleKeyboardHide
        );

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const animateIn = useCallback(() => {
        translateY.setValue(SCREEN_HEIGHT);
        backdropAnim.setValue(0);

        Animated.parallel([
            Animated.timing(backdropAnim, {
                toValue: backdropOpacity,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 9,
                tension: 45,
                useNativeDriver: true,
            }),
        ]).start();
    }, [backdropOpacity, backdropAnim, translateY]);

    const animateOut = useCallback((callback?: () => void) => {
        Keyboard.dismiss();
        Animated.parallel([
            Animated.timing(backdropAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => callback?.());
    }, [backdropAnim, translateY]);

    useEffect(() => {
        if (visible) animateIn();
        else animateOut();
    }, [visible, animateIn, animateOut]);

    const handleBackdropPress = useCallback(() => {
        if (!disableBackdropClose) animateOut(onClose);
    }, [disableBackdropClose, animateOut, onClose]);

    const handleClose = useCallback(() => animateOut(onClose), [animateOut, onClose]);

    if (!visible && !isVisibleRef.current) return null;

    const topMargin = 60;
    const bottomSafe = TAB_BAR_TOTAL; // <-- KEY: push above tab bar
    const cardHeight = SCREEN_HEIGHT - topMargin - bottomSafe - (Platform.OS === "ios" ? keyboardHeight : 0);

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={[StyleSheet.absoluteFill, styles.wrapper]} pointerEvents={visible ? "auto" : "none"}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
                    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]} />
                </Pressable>

                <Animated.View
                    style={[
                        styles.card,
                        cardStyle,
                        { transform: [{ translateY }], maxHeight: cardHeight, marginTop: topMargin, marginBottom: bottomSafe },
                    ]}
                >
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={[styles.header, headerStyle]}>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        {showCloseButton && (
                            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
                                <Ionicons name="close" size={20} color="#666666" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {listData && renderItem ? (
                        <FlatList
                            ref={flatListRef}
                            data={listData}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            ListHeaderComponent={<View>{children}</View>}
                            ListEmptyComponent={listEmptyComponent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                            contentContainerStyle={styles.scrollContent}
                        />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={[]}
                            renderItem={() => null}
                            ListHeaderComponent={<View>{children}</View>}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                            contentContainerStyle={styles.scrollContent}
                        />
                    )}

                    {actions && (
                        <View style={styles.actionsWrapper}>
                            <View style={styles.actionsDivider} />
                            {actions}
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

export function SheetActionButtons({
    onCancel,
    onSave,
    cancelText = "Cancel",
    saveText = "Save",
    saveIcon = "checkmark-circle",
    disabled = false,
    loading = false,
}: {
    onCancel: () => void;
    onSave: () => void;
    cancelText?: string;
    saveText?: string;
    saveIcon?: string;
    disabled?: boolean;
    loading?: boolean;
}) {
    return (
        <View style={actionStyles.row}>
            <TouchableOpacity style={actionStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                <Text style={actionStyles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[actionStyles.saveBtn, disabled && actionStyles.saveBtnDisabled]}
                onPress={onSave}
                disabled={disabled}
                activeOpacity={0.8}
            >
                {loading ? (
                    <View style={actionStyles.row}>
                        <View style={actionStyles.spinner} />
                        <Text style={actionStyles.saveText}>Saving...</Text>
                    </View>
                ) : (
                    <View style={actionStyles.row}>
                        <Text style={actionStyles.saveText}>{saveText}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const actionStyles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
    cancelText: { color: "#073474", fontSize: 15, fontWeight: "700" },
    saveBtn: { flex: 1.5, height: 52, borderRadius: 14, backgroundColor: "#073474", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8 },
    saveBtnDisabled: { backgroundColor: "#073474" },
    saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    spinner: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#FFFFFF", borderTopColor: "transparent" },
});

const styles = StyleSheet.create({
    wrapper: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, elevation: 99999 },
    backdrop: { backgroundColor: "#000000" },
    card: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 24 : 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 25,
    },
    dragHandleContainer: { alignItems: "center", paddingVertical: 8 },
    dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: "#d1d5db" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 4 },
    title: { color: "#073474", fontSize: 20, fontWeight: "900", letterSpacing: 0.3, flex: 1, marginRight: 12 },
    closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 8 },
    actionsWrapper: { paddingTop: 0, backgroundColor: "#FFFFFF", zIndex: 1000 },
    actionsDivider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 8 },
});