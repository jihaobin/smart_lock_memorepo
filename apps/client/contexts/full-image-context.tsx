import React, {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Zoomable } from '@likashefqet/react-native-image-zoom';
import { X, Download } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

interface ImageContextType {
  showImage: (imageUri: string) => void;
}

const ImageContext = createContext<ImageContextType | null>(null);

export const useImageViewer = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageViewer must be used within ImageProvider');
  }
  return context;
};

interface ImageProviderProps {
  children: React.ReactNode;
}

export default function ImageProvider({ children }: ImageProviderProps) {
  const imageRef = useRef<any>(null);

  const showImage = (imageUri: string) => {
    imageRef.current?.show(imageUri);
  };

  return (
    <ImageContext.Provider value={{ showImage }}>
      {children}
      <ImageView ref={imageRef} />
    </ImageContext.Provider>
  );
}

interface ImageViewRef {
  show: (uri: string) => void;
  hide: () => void;
}

const ImageView = forwardRef<ImageViewRef>((props, ref) => {
  const [show, setShow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const imageUriRef = useRef('');

  useImperativeHandle(ref, () => ({
    hide: () => {
      imageUriRef.current = '';
      setShow(false);
    },
    show: (uri = '') => {
      if (!uri) {
        return;
      }
      imageUriRef.current = uri;
      setShow(true);
    },
  }));

  if (!show) return null;

  const hide = () => {
    setShow(false);
    imageUriRef.current = '';
  };

  const saveImageToGallery = async () => {
    if (!imageUriRef.current || isSaving) return;

    try {
      setIsSaving(true);

      // 请求媒体库权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能保存图片');
        return;
      }

      let fileUri: string;
      const imageUri = imageUriRef.current;

      // 检测图片格式：base64 或 网络URL
      if (imageUri.startsWith('data:image/')) {
        // 处理base64格式图片
        const [mimeType, base64Data] = imageUri.split(',');
        // 使用正则表达式提取图片类型
        const imageTypeMatch = mimeType.match(/data:image\/(\w+)/);
        const imageType = imageTypeMatch ? imageTypeMatch[1] : 'jpg';
        const fileExtension = imageType === 'jpeg' ? 'jpg' : imageType;

        fileUri = FileSystem.documentDirectory + `temp_image.${fileExtension}`;

        // 将base64数据写入文件
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        // 处理网络URL格式图片
        fileUri = FileSystem.documentDirectory + 'temp_image.jpg';
        const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);

        if (downloadResult.status !== 200) {
          throw new Error('下载失败');
        }
      }

      // 保存到相册
      // const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.saveToLibraryAsync(fileUri);

      Alert.alert('保存成功', '图片已保存到相册');
    } catch (error) {
      console.error('保存图片失败:', error);
      Alert.alert('保存失败', '无法保存图片到相册');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayBackground} />
      <View style={styles.overlayContent}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={saveImageToGallery}
            disabled={isSaving}
          >
            <Icon as={Download} className="h-6 w-6 text-white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.closeButton]} onPress={hide}>
            <Icon as={X} className="h-6 w-6 text-white" />
          </TouchableOpacity>
        </View>
        <Zoomable
          style={styles.zoomableContainer}
          minScale={1}
          maxScale={5}
          doubleTapScale={2}
          isSingleTapEnabled={true}
          isDoubleTapEnabled={true}
          isPinchEnabled={true}
          isPanEnabled={true}
          onSingleTap={hide}
        >
          <Image
            source={{ uri: imageUriRef.current }}
            style={styles.image}
            transition={500}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </Zoomable>
      </View>
    </View>
  );
});

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1001,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  closeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  zoomableContainer: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
});
