import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";

interface AutoSliderProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  autoPlayInterval?: number;
}

function AutoSlider<T>({
  data,
  renderItem,
  keyExtractor,
  autoPlayInterval = 4500,
}: AutoSliderProps<T>) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<T>>(null);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (data.length <= 1 || width === 0) return;
    timerRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % data.length;
      setActiveIndex(indexRef.current);
      listRef.current?.scrollToOffset({
        offset: indexRef.current * width,
        animated: true,
      });
    }, autoPlayInterval);
  }, [clearTimer, data.length, width, autoPlayInterval]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (width === 0) return;
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    indexRef.current = Math.max(0, Math.min(newIndex, data.length - 1));
    setActiveIndex(indexRef.current);
    startTimer();
  };

  if (!data || data.length === 0) return null;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={listRef}
          data={data}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          initialNumToRender={data.length}
          onScrollBeginDrag={clearTimer}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <View style={{ width }}>{renderItem(item, index)}</View>
          )}
        />
      )}

      {data.length > 1 && (
        <View className="flex-row justify-center items-center pb-6 gap-1.5">
          {data.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${
                i === activeIndex
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default AutoSlider;
