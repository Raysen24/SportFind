import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ref, get, orderByChild, query, equalTo } from 'firebase/database';
import { database, auth } from '../firebaseconfig'; // Import Firebase config

const MyBookingsScreen = ({ navigation }) => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchBookings = async () => {
      try {
        const userId = auth.currentUser.uid;
        const bookingsRef = ref(database, 'bookings/');

        // Fetch all bookings for the current user
        const snapshot = await get(bookingsRef);
        const bookingsData = snapshot.val() || {};

        // Filter active and history bookings based on date
        const now = new Date().getTime();

        const bookingsArray = Object.values(bookingsData).filter(
          (booking) => booking.userId === userId
        );

        const active = bookingsArray.filter((booking) => {
          const bookingDate = new Date(booking.date).getTime();
          return bookingDate > now; // Active bookings are in the future
        });

        const history = bookingsArray.filter((booking) => {
          const bookingDate = new Date(booking.date).getTime();
          return bookingDate <= now; // History bookings are in the past
        });

        setActiveBookings(active);
        setHistoryBookings(history);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, [auth.currentUser]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Active Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          {activeBookings.length > 0 ? (
            activeBookings.map((booking, index) => (
              <BookingCard key={index} booking={booking} />
            ))
          ) : (
            <Text style={styles.noBookingsText}>No active bookings.</Text>
          )}
        </View>

        {/* History Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History Bookings</Text>
          {historyBookings.length > 0 ? (
            historyBookings.map((booking, index) => (
              <BookingCard key={index} booking={booking} />
            ))
          ) : (
            <Text style={styles.noBookingsText}>No history bookings.</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="chatbubble" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="home" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Booking Card Component
const BookingCard = ({ booking }) => {
  return (
    <View style={styles.bookingCard}>
      <Image
        source={{ uri: booking.image }} // Replace with actual image URL
        style={styles.cardImage}
      />
      <View style={styles.cardDetails}>
        <Text style={styles.cardTitle}>{booking.venueName}</Text>
        <Text style={styles.cardSubtitle}>
          {new Date(booking.date).toLocaleDateString()}{' '}
          {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.cardDescription}>{booking.court}, {booking.time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    height: 60,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  contentContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -20,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noBookingsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  bookingCard: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  cardDetails: {
    flex: 1,
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  bottomNav: {
    height: 60,
    backgroundColor: '#2C3E50',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default MyBookingsScreen;
