import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';

// Firebase imports
import { db, rdb } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import {
  ref,
  onValue,
  update,
} from 'firebase/database';

// Time Slot Component
const TimeSlot = ({ time, available, selected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.timeSlot,
      available ? (selected ? styles.selectedTimeSlot : styles.availableTimeSlot) : styles.unavailableTimeSlot,
    ]}
    onPress={onPress}
    disabled={!available}
  >
    <Text style={[
      styles.timeSlotText,
      available ? (selected ? styles.selectedTimeSlotText : styles.availableTimeSlotText) : styles.unavailableTimeSlotText,
    ]}>
      {time}
    </Text>
  </TouchableOpacity>
);

export default function CourtBookingScreen({ navigation, route }) {
  const { venueId } = route.params || {};
  const [selectedDate, setSelectedDate] = useState('2025-04-08'); // Default date
  const [selectedCourt, setSelectedCourt] = useState(null); // Will be set after fetching
  const [timeSlots, setTimeSlots] = useState([]); // All time slots
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [courts, setCourts] = useState([]); // List of courts for tabs

  // Load courts from Firestore
  useEffect(() => {
    const fetchCourts = async () => {
      if (!venueId) return;
      try {
        const courtsSnapshot = await getDocs(collection(db, `venues/${venueId}/courts`));
        const courtList = [];
        courtsSnapshot.forEach(doc => {
          const data = doc.data();
          courtList.push({
            id: doc.id,
            name: data.name || doc.id,
          });
        });
        setCourts(courtList);
        if (courtList.length > 0) {
          setSelectedCourt(courtList[0].id); // Default select first court
        }
      } catch (error) {
        console.error("Error fetching courts:", error);
      }
    };
    fetchCourts();
  }, [venueId]);

  // Fetch all time slots for the selected court and date
  useEffect(() => {
    if (!venueId || !rdb || !selectedCourt) {
      // Don't warn here; just wait until all data is ready
      return;
    }
  
    const courtPath = `venues/${venueId}/courts/${selectedCourt}`;
    const realtimeRef = ref(rdb, `${courtPath}/${selectedDate}`);
  
    const unsubscribe = onValue(realtimeRef, (snapshot) => {
      let slots = [
        { time: '06:00-07:00', available: true },
        { time: '07:00-08:00', available: true },
        { time: '08:00-09:00', available: true },
        { time: '09:00-10:00', available: true },
        { time: '10:00-11:00', available: true },
        { time: '11:00-12:00', available: true },
        { time: '12:00-13:00', available: true },
        { time: '13:00-14:00', available: true },
        { time: '14:00-15:00', available: true },
        { time: '15:00-16:00', available: true },
        { time: '16:00-17:00', available: true },
        { time: '17:00-18:00', available: true },
        { time: '18:00-19:00', available: true },
        { time: '19:00-20:00', available: true },
        { time: '20:00-21:00', available: true },
        { time: '21:00-22:00', available: true },
      ];
  
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.entries(data).forEach(([key, value]) => {
          const slotTime = key.replace(/_/, '-');
          const index = slots.findIndex(slot => slot.time === slotTime);
          if (index !== -1) {
            slots[index].available = !value.booked;
          }
        });
      }
  
      setTimeSlots(slots);
    });
  
    return () => unsubscribe();
  }, [venueId, selectedDate, selectedCourt]);

  // Handle Booking
  const handleBooking = async () => {
  if (!venueId || selectedTimeSlots.length === 0) {
    alert('Please select at least one time slot.');
    return;
  }

  try {
    // Fetch venue name dynamically
    const venueDocRef = doc(db, 'venues', venueId);
    const venueDocSnap = await getDoc(venueDocRef);
    const venueName = venueDocSnap.exists() ? venueDocSnap.data().name : 'Badminton Arena';

    // Get selected court name
    const selectedCourtObj = courts.find(court => court.id === selectedCourt);
    const courtName = selectedCourtObj?.name || 'Unknown Court';

    const bookingDetails = {
      venueName,
      venueId,
      courtId: selectedCourt,
      courtName,
      date: selectedDate,
      time: selectedTimeSlots.join(', ')
    };

    // ✅ Only navigate if bookingDetails has required fields
    if (!bookingDetails.venueId || !bookingDetails.courtId) {
      console.error("Missing required booking details", bookingDetails);
      alert("Failed to prepare booking. Please try again.");
      return;
    }

    navigation.navigate('Payment', { bookingDetails });

  } catch (error) {
    console.error("Error preparing booking:", error);
    alert("Failed to load booking details. Please try again.");
  }
};

  const handleTimeSlotPress = (time) => {
    setSelectedTimeSlots(prev =>
      prev.includes(time)
        ? prev.filter(slot => slot !== time)
        : [...prev, time]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={timeSlots}
        renderItem={({ item }) => (
          <TimeSlot
            time={item.time}
            available={item.available}
            selected={selectedTimeSlots.includes(item.time)}
            onPress={() => handleTimeSlotPress(item.time)}
          />
        )}
        keyExtractor={(item) => item.time}
        numColumns={2}
        columnWrapperStyle={styles.timeSlotRow}
        contentContainerStyle={styles.timeSlotsContainer}
        ListHeaderComponent={
          <>
            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                }}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    disableTouchEvent: true,
                    selectedDotColor: '#4CAF50'
                  }
                }}
                theme={{
                  todayTextColor: '#4CAF50',
                  selectedDayBackgroundColor: '#4CAF50',
                  selectedDayTextColor: '#ffffff',
                }}
                style={styles.calendar}
              />
            </View>

            {/* Court Tabs */}
            <View style={styles.courtTabsContainer}>
              {courts.map((court) => (
                <TouchableOpacity
                  key={court.id}
                  style={[
                    styles.courtTab,
                    selectedCourt === court.id && styles.selectedCourtTab,
                  ]}
                  onPress={() => {
                    setSelectedCourt(court.id);
                    setSelectedTimeSlots([]);
                  }}
                >
                  <Text style={[
                    styles.courtTabText,
                    selectedCourt === court.id && styles.selectedCourtTabText,
                  ]}>
                    {court.name || court.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
      />

      {/* Book Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.bookButton, selectedTimeSlots.length === 0 && styles.disabledBookButton]}
          onPress={handleBooking}
          disabled={selectedTimeSlots.length === 0}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles remain unchanged — use the same styles from your file
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  calendarContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  calendar: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  courtTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  courtTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectedCourtTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  courtTabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  selectedCourtTabText: {
    color: '#4CAF50',
  },
  timeSlotsContainer: {
    padding: 15,
  },
  timeSlotRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeSlot: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  availableTimeSlot: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BDBDBD',
  },
  selectedTimeSlot: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unavailableTimeSlot: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  availableTimeSlotText: {
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  unavailableTimeSlotText: {
    color: '#BDBDBD',
    textDecorationLine: 'line-through',
  },
  buttonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBookButton: {
    backgroundColor: '#A5D6A7',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});