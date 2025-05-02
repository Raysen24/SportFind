import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Firebase imports
import { rdb, auth } from '../firebaseConfig';
import { ref, update, push, set } from 'firebase/database';

const PaymentMethod = ({ route, navigation }) => {
  const [selectedMethod, setSelectedMethod] = useState('visa');

  const { bookingDetails } = route.params || {};
  const { venueName, venueId, courtId, courtName, date, time } = bookingDetails || {};

  const handlePaymentSelection = (method) => {
    setSelectedMethod(method);
  };

  const handleConfirmPayment = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to confirm the booking.');
      return;
    }

    // Validate required data
    if (!venueId || !courtId || !date || !time) {
      Alert.alert(
        'Error',
        'Missing booking details. Please go back and try again.'
      );
      return;
    }

    try {
      const userId = auth.currentUser.uid;

      // ✅ 1. Save to /bookings (for history)
      const bookingsRef = ref(rdb, 'bookings/');
      const newBookingRef = push(bookingsRef); // Generate unique key
      await set(newBookingRef, {
        ...bookingDetails,
        paymentMethod: selectedMethod,
        userId,
        timestamp: Date.now(),
      });

      // ✅ 2. Update Realtime DB to mark selected time slots as booked
      const updates = {};
      const timeArray = time.split(', ');

      timeArray.forEach(slot => {
        const dbKey = slot.replace('-', '_'); // "06:00-07:00" → "06:00_07:00"
        updates[dbKey] = { booked: true, userId };
      });

      const courtPath = `venues/${venueId}/courts/${courtId}`;
      const realtimeRef = ref(rdb, `${courtPath}/${date}`);
      await update(realtimeRef, updates); // Mark time slots as booked

      // ✅ Show success and navigate
      Alert.alert('Success', 'Your booking and payment have been confirmed!');
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (error) {
      console.error('Error saving booking:', error);
      Alert.alert('Error', 'Failed to confirm your booking. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Booking Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        <Text style={styles.summaryText}>Venue: {venueName || 'Unknown Venue'}</Text>
        <Text style={styles.summaryText}>Date: {date || 'N/A'}</Text>
        <Text style={styles.summaryText}>Court: {courtName || 'N/A'}</Text>
        <Text style={styles.summaryText}>Time: {time || 'N/A'}</Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.selectText}>Select your payment method</Text>

        {/* Credit Card */}
        <TouchableOpacity
          style={styles.creditCard}
          onPress={() => handlePaymentSelection('visa')}
        >
          <LinearGradient
            colors={['#8E44AD', '#2C3E50']}
            style={styles.cardGradient}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioButton,
                  selectedMethod === 'visa' && styles.checkedRadio,
                ]}
              />
            </View>
            <Text style={styles.visaText}>VISA</Text>
            <Text style={styles.cardNumber}>4570 5367 5338 6080</Text>
            <View style={styles.cardDetails}>
              <Text style={styles.cvvText}>CVV</Text>
              <Text style={styles.expiresText}>EXPIRES</Text>
              <Text style={styles.cvvValue}>****</Text>
              <Text style={styles.expiresValue}>08/27</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        {/* Payment Options */}
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => handlePaymentSelection('gopay')}
          >
            <View
              style={[
                styles.radioButton,
                selectedMethod === 'gopay' && styles.checkedRadio,
              ]}
            />
            <Text style={styles.paymentText}>Gopay</Text>
            <Image
              source={require('../assets/gopay-logo.png')}
              style={styles.paymentLogo}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => handlePaymentSelection('shopeepay')}
          >
            <View
              style={[
                styles.radioButton,
                selectedMethod === 'shopeepay' && styles.checkedRadio,
              ]}
            />
            <Text style={styles.paymentText}>ShopeePay</Text>
            <Image
              source={require('../assets/shopeepay-logo.png')}
              style={styles.paymentLogo}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => handlePaymentSelection('dana')}
          >
            <View
              style={[
                styles.radioButton,
                selectedMethod === 'dana' && styles.checkedRadio,
              ]}
            />
            <Text style={styles.paymentText}>Dana</Text>
            <Image
              source={require('../assets/dana-logo.png')}
              style={styles.paymentLogo}
            />
          </TouchableOpacity>
        </View>

        {/* Pay Button */}
        <TouchableOpacity style={styles.payButton} onPress={handleConfirmPayment}>
          <Text style={styles.payButtonText}>Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 20,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 10,
    flex: 1,
  },
  selectText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  creditCard: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  radioContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2C3E50',
    marginRight: 10,
  },
  checkedRadio: {
    backgroundColor: '#2C3E50',
  },
  visaText: {
    fontSize: 24,
    color: 'white',
    alignSelf: 'flex-end',
  },
  cardNumber: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cvvText: {
    fontSize: 12,
    color: 'white',
  },
  expiresText: {
    fontSize: 12,
    color: 'white',
  },
  cvvValue: {
    fontSize: 16,
    color: 'white',
  },
  expiresValue: {
    fontSize: 16,
    color: 'white',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D3D3D3',
  },
  orText: {
    marginHorizontal: 10,
    color: '#D3D3D3',
  },
  paymentOptions: {
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  paymentText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  paymentLogo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  payButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PaymentMethod;