import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Firebase imports
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const SettingsItem = ({ label, iconName, onPress, isDestructive = false }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <Ionicons
      name={iconName}
      size={22}
      color={isDestructive ? '#D32F2F' : '#555'}
      style={{ marginRight: 15 }}
    />
    <Text style={[styles.itemLabel, isDestructive && styles.destructiveText]}>{label}</Text>
    {!isDestructive && <Text style={styles.itemArrow}>›</Text>}
  </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen({ navigation }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const authInstance = getAuth();
    setLoggingOut(true);
    try {
      await signOut(authInstance);
      console.log('User signed out');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <SectionHeader title="Account" />
        <View style={styles.sectionContainer}>
          <SettingsItem label="Edit profile" iconName="person-outline" onPress={() => console.log('Edit Profile')} />
          <SettingsItem label="Security" iconName="lock-closed-outline" onPress={() => console.log('Security')} />
          <SettingsItem label="Notifications" iconName="notifications-outline" onPress={() => console.log('Notifications')} />
          <SettingsItem label="Privacy" iconName="shield-checkmark-outline" onPress={() => console.log('Privacy')} />
        </View>

        <SectionHeader title="Support & About" />
        <View style={styles.sectionContainer}>
          {/* ✅ Navigates to MyBookingsScreen */}
          <SettingsItem
            label="My Bookings"
            iconName="card-outline"
            onPress={() => navigation.navigate('MyBookings')}
          />
          <SettingsItem label="Help & Support" iconName="help-circle-outline" onPress={() => console.log('Help & Support')} />
          <SettingsItem label="Terms and Policies" iconName="document-text-outline" onPress={() => console.log('Terms and Policies')} />
        </View>

        <SectionHeader title="Cache & cellular" />
        <View style={styles.sectionContainer}>
          <SettingsItem label="Free up space" iconName="trash-outline" onPress={() => console.log('Free up space')} />
          <SettingsItem label="Data Saver" iconName="cellular-outline" onPress={() => console.log('Data Saver')} />
        </View>

        <SectionHeader title="Actions" />
        <View style={styles.sectionContainer}>
          <SettingsItem label="Report a problem" iconName="flag-outline" onPress={() => console.log('Report a problem')} />
          <SettingsItem label="Add account" iconName="add-circle-outline" onPress={() => console.log('Add account')} />
          <SettingsItem
            label={loggingOut ? "Logging out..." : "Log out"}
            iconName="log-out-outline"
            onPress={loggingOut ? null : handleLogout}
            isDestructive={true}
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 15,
    marginTop: 25,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemArrow: {
    fontSize: 18,
    color: '#BDBDBD',
  },
  destructiveText: {
    color: '#D32F2F',
    textAlign: 'center',
    flex: 1,
    marginRight: -15,
  },
});