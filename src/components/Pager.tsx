import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { StyleSheet, View, Animated, PanResponder, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25;

export interface PagerViewHandle {
    setPage: (index: number) => void;
}

export const Pager = forwardRef((props: any, ref: any) => {
    const { children, initialPage = 0, onPageSelected, style } = props;

    const pages = React.Children.toArray(children);
    const maxPage = pages.length - 1;

    // Absolute scroll position: page 0 = 0, page 1 = -SCREEN_WIDTH, etc.
    const scrollX = useRef(new Animated.Value(-initialPage * SCREEN_WIDTH)).current;
    const currentPageRef = useRef(initialPage);
    const maxPageRef = useRef(maxPage);
    maxPageRef.current = maxPage;
    const baseScrollX = useRef(-initialPage * SCREEN_WIDTH);
    const isAnimating = useRef(false);

    const animateToPage = (targetPage: number) => {
        const target = -targetPage * SCREEN_WIDTH;
        isAnimating.current = true;

        Animated.spring(scrollX, {
            toValue: target,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
        }).start(({ finished }) => {
            if (finished) {
                baseScrollX.current = target;
                currentPageRef.current = targetPage;
                isAnimating.current = false;
                onPageSelected?.({ nativeEvent: { position: targetPage } });
            }
        });
    };

    useImperativeHandle(ref, () => ({
        setPage: (index: number) => {
            if (index !== currentPageRef.current && index >= 0 && index <= maxPageRef.current) {
                animateToPage(index);
            }
        }
    }));

    const panResponder = useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                if (isAnimating.current) return false;
                return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => {
                scrollX.stopAnimation((value) => {
                    baseScrollX.current = value;
                });
            },
            onPanResponderMove: (evt, gestureState) => {
                let dx = gestureState.dx;
                const page = currentPageRef.current;

                // Rubber band at edges
                if (page === 0 && dx > 0) {
                    dx = dx * 0.3;
                }
                if (page >= maxPageRef.current && dx < 0) {
                    dx = dx * 0.3;
                }

                scrollX.setValue(baseScrollX.current + dx);
            },
            onPanResponderRelease: (evt, gestureState) => {
                const page = currentPageRef.current;
                const max = maxPageRef.current;

                const movedEnough = Math.abs(gestureState.dx) > SCREEN_WIDTH * SWIPE_THRESHOLD;
                const fastEnough = Math.abs(gestureState.vx) > 0.5;

                if ((movedEnough || fastEnough) && gestureState.dx < 0 && page < max) {
                    animateToPage(page + 1);
                } else if ((movedEnough || fastEnough) && gestureState.dx > 0 && page > 0) {
                    animateToPage(page - 1);
                } else {
                    // Spring back
                    animateToPage(page);
                }
            },
            onPanResponderTerminate: () => {
                animateToPage(currentPageRef.current);
            },
        }),
    [scrollX]);

    return (
        <View style={[styles.container, style]} {...panResponder.panHandlers}>
            {pages.map((page, i) => (
                <Animated.View
                    key={`page-${i}`}
                    style={[
                        styles.page,
                        {
                            transform: [{
                                translateX: Animated.add(scrollX, i * SCREEN_WIDTH),
                            }],
                        },
                    ]}
                >
                    {page}
                </Animated.View>
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    page: {
        ...StyleSheet.absoluteFillObject,
    },
});
