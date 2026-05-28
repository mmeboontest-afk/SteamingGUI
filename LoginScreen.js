import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const PASTEL = ['#ffd6e0','#ffecf5','#e8d5f5','#d5eef5'];

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',  // ใส่ Google Client ID
    webClientId:     'YOUR_WEB_CLIENT_ID',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUser(authentication.accessToken);
    }
  }, [response]);

  async function fetchUser(token) {
    setLoading(true);
    try {
      const res  = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      navigation.replace('Home', { user });
    } catch (e) {
      Alert.alert('Login Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={PASTEL} start={{x:0,y:0}} end={{x:1,y:1}} style={s.bg}>
      <View style={s.card}>
        <Text style={s.title}>N'Me's SM</Text>
        <Text style={s.sub}>Streaming Manager</Text>

        {loading ? <ActivityIndicator size="large" color="#c084fc" style={{marginTop:32}} /> : (
          <TouchableOpacity
            style={s.btn}
            onPress={() => promptAsync()}
            disabled={!request}
          >
            <Text style={s.btnTxt}>🔑  เข้าสู่ระบบด้วย Google</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg:    { flex:1, justifyContent:'center', alignItems:'center' },
  card:  { backgroundColor:'rgba(255,255,255,0.7)', borderRadius:24, padding:36, alignItems:'center', width:'82%', elevation:6 },
  title: { fontSize:36, fontFamily:'TiltWarp_400Regular', color:'#c084fc', marginBottom:4 },
  sub:   { fontSize:15, fontFamily:'Mitr_400Regular', color:'#888', marginBottom:32 },
  btn:   { backgroundColor:'#c084fc', borderRadius:16, paddingHorizontal:28, paddingVertical:14 },
  btnTxt:{ fontSize:16, fontFamily:'Mitr_500Medium', color:'#fff' },
});
