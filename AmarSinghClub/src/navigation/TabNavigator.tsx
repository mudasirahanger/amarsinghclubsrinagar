import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActivityScreen from '../screens/ActivityScreen';
import TopUpScreen from '../screens/TopUpScreen';


const Tab = createBottomTabNavigator();

/**
 * Custom Tab Bar Component
 * Replaces the default React Navigation bar to perfectly match the Regal Heritage UI
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="flex-row bg-background pt-3 pb-2 px-4 shadow-[0_-10px_40px_rgba(31,27,20,0.05)] border-t-0"
      // Dynamically handle the bottom spacing for notched iPhones vs standard Androids
      style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16 }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Map route names to icons
        let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Activities') iconName = 'insert-chart';
        else if (route.name === 'Top-Up') iconName = 'account-balance-wallet';
        else if (route.name === 'Profile') iconName = 'person';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.8}
            className="flex-1 items-center justify-center"
          >
            {/* --- FIX APPLIED HERE --- */}
            <View 
              className={`items-center justify-center w-[90%] py-2 rounded-2xl overflow-hidden ${isFocused ? 'bg-secondary' : 'bg-transparent'}`}
              // Forcing Android's rendering engine to respect the 16px curve
              style={Platform.OS === 'android' ? { borderRadius: 16 } : {}}
            >
              <MaterialIcons 
                name={iconName} 
                size={24} 
                color={isFocused ? '#ffffff' : '#7a9491'} 
              />
              <Text 
                className={`text-[10px] font-label uppercase tracking-widest mt-1 ${isFocused ? 'text-white' : 'text-on-primary-container'}`}
              >
                {route.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * The Tab Navigator Wrapper
 */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Activities" component={ActivityScreen} />
      <Tab.Screen name="Top-Up" component={TopUpScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}