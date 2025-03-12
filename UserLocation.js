import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { EventEmitter } from 'expo-modules-core';

const LOCATION_TRACKING = 'location-tracking';
const locationEventEmitter = new EventEmitter();

function UserLocation() {
    const [locationStarted, setLocationStarted] = useState(false);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);

    const startLocationTracking = async () => {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

        if (fgStatus !== 'granted' || bgStatus !== 'granted') {
            console.log('Permission to access location was denied');
            return;
        }

        await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 5000,
            distanceInterval: 0,
        });

        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
        setLocationStarted(hasStarted);
        console.log('Tracking started?', hasStarted);
    };

    const sendLocation = async (latitude, longitude) => {
        try {
            const response = await fetch('https://vm.aio.co.id:20010/ps-run/api/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude,
                    longitude,
                }),
            });

            if (response.ok) {
                console.log('Location sent successfully');
            }
        } catch (error) {
            console.error('Error sending location:', error);
        }
    }

    useEffect(() => {
        // Listener untuk menerima event lokasi terbaru
        const subscription = locationEventEmitter.addListener('locationUpdated', (coords) => {
            setLatitude(coords.latitude);
            setLongitude(coords.longitude);
            sendLocation(coords.latitude, coords.longitude);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const stopLocation = async () => {
        setLocationStarted(false);
        const tracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
        if (tracking) {
            await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
        }
    };

    return (
        <View style={styles.container}>
            {locationStarted ? (
                <TouchableOpacity onPress={stopLocation}>
                    <Text style={styles.btnText}>Stop Tracking</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={startLocationTracking}>
                    <Text style={styles.btnText}>Start Tracking</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.locationText}>
                Last Location: {latitude ? `${latitude}, ${longitude}` : 'Waiting for update...'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginTop: 20,
    },
    btnText: {
        fontSize: 20,
        backgroundColor: 'green',
        color: 'white',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    locationText: {
        fontSize: 16,
        marginTop: 15,
    },
});

TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
    if (error) {
        console.log('LOCATION_TRACKING task ERROR:', error);
        return;
    }
    if (data) {
        const { locations } = data;
        if (locations.length > 0) {
            let lat = locations[0].coords.latitude;
            let long = locations[0].coords.longitude;

            console.log(`${new Date().toLocaleString()}: ${lat}, ${long}`);

            // Kirim event lokasi terbaru ke komponen UserLocation
            locationEventEmitter.emit('locationUpdated', { latitude: lat, longitude: long });
        }
    }
});

export default UserLocation;
