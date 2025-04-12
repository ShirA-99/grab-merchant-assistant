import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const GrabButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, text
  size = 'medium', // small, medium, large
  fullWidth = false,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.disabled;
    
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
      case 'text':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return theme.colors.textLight;
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return theme.colors.textInverted;
      case 'outline':
      case 'text':
        return theme.colors.primary;
      default:
        return theme.colors.textInverted;
    }
  };
  
  const getBorderColor = () => {
    if (disabled) return theme.colors.disabled;
    
    return variant === 'outline' ? theme.colors.primary : 'transparent';
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };
  
  const getBorderRadius = () => {
    switch (size) {
      case 'small':
        return theme.rounded.sm;
      case 'medium':
        return theme.rounded.md;
      case 'large':
        return theme.rounded.md;
      default:
        return theme.rounded.md;
    }
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: getBorderRadius(),
          width: fullWidth ? '100%' : undefined,
          ...getPadding(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GrabButton;