import React from 'react';
import { StyleSheet, View } from 'react-native';
import UserLocation from '@/UserLocation';
export default function App() {
     return (
          <View style={styles.container}>
               <UserLocation />
          </View>
     );
}
const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
     },
});