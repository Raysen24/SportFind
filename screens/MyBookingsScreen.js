import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Firebase imports
import { auth, db, rdb } from '../firebaseConfig'; // Make sure all services are imported
import {
  ref,
  onValue,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import {
  doc,
  getDoc
} from 'firebase/firestore';

const MyBookingsScreen = ({ navigation }) => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Temporary state to store rdb after it's initialized
  const [rtDbReady, setRtDbReady] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
  
    const userId = auth.currentUser.uid;
  
    // Check if `rdb` is ready
    if (!rtDbReady && !rdb) {
      console.warn("Firebase Realtime DB not ready yet");
      const timer = setTimeout(() => {
        setRtDbReady(!!rdb);
      }, 500); // Retry after delay
      return () => clearTimeout(timer);
    }
  
    if (!db || !rdb) {
      setError("Database not ready. Please restart the app.");
      setLoading(false);
      return;
    }
  
    const bookingsRef = ref(rdb, 'bookings/');
    const userBookingsQuery = query(
      bookingsRef,
      orderByChild('userId'),
      equalTo(userId)
    );
  
    const unsubscribe = onValue(userBookingsQuery, async (snapshot) => {
      try {
        const bookingsData = snapshot.val() || {};
        
        // Convert object to array and filter by userId
        const bookingsList = Object.values(bookingsData).filter(booking => booking.userId === userId);
  
        // ✅ Sort bookings by timestamp in descending order (latest first)
        const sortedBookings = [...bookingsList].sort((a, b) => {
          return (b.timestamp || 0) - (a.timestamp || 0); // Descending order
        });
  
        const now = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
        const active = [];
        const history = [];
  
        for (const booking of sortedBookings) {
          const { venueId, court, date } = booking;
  
          let venueName = 'Unknown Venue';
          let courtName = 'Court';
          let mainImageUrl = null;
  
          // Fetch venue name and image
          if (db && venueId) {
            try {
              const venueSnap = await getDoc(doc(db, 'venues', venueId));
              if (venueSnap.exists()) {
                const data = venueSnap.data();
                venueName = data.name || 'Venue';
                mainImageUrl = data.mainImageUrl || null;
              }
            } catch (err) {
              console.error("Error fetching venue:", err);
            }
          }
  
          // Fetch court name
          if (db && venueId && court) {
            try {
              const courtSnap = await getDoc(doc(db, `venues/${venueId}/courts`, court));
              if (courtSnap.exists()) {
                courtName = courtSnap.data().name || court;
              }
            } catch (err) {
              console.error("Error fetching court:", err);
            }
          }
  
          const bookingWithNames = {
            ...booking,
            venueName,
            courtName,
            mainImageUrl,
          };
  
          if (date > now) {
            active.push(bookingWithNames);
          } else {
            history.push(bookingWithNames);
          }
        }
  
        setActiveBookings(active);
        setHistoryBookings(history);
        setLoading(false);
      } catch (err) {
        console.error("Error processing bookings:", err);
        setError("Failed to load bookings.");
        setLoading(false);
      }
    }, (dbErr) => {
      console.error("Firebase Database error:", dbErr);
      setError("Database connection failed.");
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [auth.currentUser, rtDbReady]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Loading bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            setRtDbReady(false);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Text style={styles.sectionTitle}>Past Bookings</Text>
          {historyBookings.length > 0 ? (
            historyBookings.map((booking, index) => (
              <BookingCard key={index} booking={booking} />
            ))
          ) : (
            <Text style={styles.noBookingsText}>No past bookings.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Booking Card Component
const BookingCard = ({ booking }) => {
  const { venueName, courtName, date, time, paymentMethod, mainImageUrl } = booking;

  return (
    <View style={styles.bookingCard}>
      <Image
        source={{
          uri: mainImageUrl || 'https://picsum.photos/200/300'
        }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardDetails}>
        <Text style={styles.cardTitle}>{venueName ?? 'Unknown Venue'}</Text>
        <Text style={styles.cardSubtitle}>{date ?? 'N/A'}</Text>
        <Text style={styles.cardDescription}>
          Court: {courtName ?? booking.court ?? 'N/A'}, Time: {time ?? 'N/A'}
        </Text>
        <Text style={styles.paymentMethod}>
          Payment: {paymentMethod || 'N/A'}
        </Text>
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
    flexGrow: 1,
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
  errorMessage: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#FFA726',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
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
    height: 150,
    resizeMode: 'cover',
  },
  cardDetails: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
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
  paymentMethod: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
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