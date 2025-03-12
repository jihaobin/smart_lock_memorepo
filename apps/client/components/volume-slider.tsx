import { useEffect, useRef, useState } from "react";
import { HStack } from "./ui/hstack";
import { Icon } from "./ui/icon";
import { Volume2 } from "lucide-react-native";
import { Box } from "./ui/box";
import { Pressable } from "./ui/pressable";
import { Text } from "./ui/text";

export default function VolumeSlider ({ value, onChange }) {
// 音量进度条组件
const VolumeSlider = ({ value, onChange }) => {
    const [sliderWidth, setSliderWidth] = useState(0);
    const sliderRef = useRef(null);
    
    // 处理滑动事件
    const handleSlide = (event) => {
      if (sliderWidth > 0) {
        const locationX = event.nativeEvent.locationX;
        const percentage = Math.min(Math.max((locationX / sliderWidth) * 100, 0), 100);
        onChange(Math.round(percentage));
      }
    };
  
    // 测量滑块宽度
    const measureSlider = () => {
      sliderRef.current?.measure((x, y, width) => {
        setSliderWidth(width);
      });
    };
  
    useEffect(() => {
      // 组件挂载后测量宽度
      setTimeout(measureSlider, 100);
    }, []);
  
    return (
      <HStack className="items-center space-x-2 my-2">
        <Icon as={Volume2} size="sm" color="#666" />
        <Box 
          ref={sliderRef}
          className="flex-1 h-8 justify-center"
          onLayout={measureSlider}
        >
          {/* 背景轨道 */}
          <Box className="h-1.5 bg-gray-200 rounded-full w-full absolute" />
          
          {/* 渐变填充 */}
          <Box 
            className="h-1.5 rounded-full absolute"
            style={{
              width: `${value}%`,
              backgroundColor: '#ef4444',
              backgroundImage: 'linear-gradient(to right, #ef4444, #f59e0b)'
            }}
          />
          
          {/* 滑块 */}
          <Box 
            className="w-5 h-5 bg-white rounded-full shadow-md absolute top-1/2 -mt-2.5"
            style={{ left: `calc(${value}% - 10px)` }}
          />
          
          {/* 触摸区域 */}
          <Pressable
            className="absolute w-full h-full"
            onPress={handleSlide}
          />
        </Box>
        <Text className="text-sm text-gray-500">{value}%</Text>
      </HStack>
    );
  };

}