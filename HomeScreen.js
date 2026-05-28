import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const PASTEL = ['#ffd6e0','#ffecf5','#e8d5f5','#d5eef5'];

export default function HomeScreen({ navigation, route }) {
  const [user, setUser]       = useState(route.params?.user || {});
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    loadStreams();
    loadUser();
  }, []);

  async function loadUser() {
    const u = await AsyncStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }

  async function loadStreams() {
    const s = await AsyncStorage.getItem('streams');
    if (s) setStreams(JSON.parse(s));
  }

  async function deleteStream(id) {
    Alert.alert('ลบ Live', 'ยืนยันลบ?', [
      { text: 'ยกเลิก' },
      { text: 'ลบ', style: 'destructive', onPress: async () => {
        const updated = streams.filter(s => s.id !== id);
        setStreams(updated);
        await AsyncStorage.setItem('streams', JSON.stringify(updated));
      }}
    ]);
  }

  function openStream(stream) {
    const now      = moment();
    const liveTime = moment(stream.scheduledAt);
    const diff     = liveTime.diff(now, 'seconds');
    if (diff > 0) {
      navigation.navigate('Waiting', { stream });
    } else {
      navigation.navigate('Live', { stream });
    }
  }

  return (
    <LinearGradient colors={PASTEL} start={{x:0,y:0}} end={{x:1,y:1}} style={s.bg}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.hello}>สวัสดี, {user.given_name || 'Creator'} 👋</Text>
          <Text style={s.subHello}>จัดการ Live ของคุณ</Text>
        </View>
        {user.picture && <Image source={{uri: user.picture}} style={s.avatar} />}
      </View>

      {/* Create button */}
      <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('SetupLive', { onSave: loadStreams })}>
        <Text style={s.createTxt}>＋  สร้าง Live ใหม่</Text>
      </TouchableOpacity>

      {/* Stream list */}
      <ScrollView style={s.list} contentContainerStyle={{paddingBottom:32}}>
        {streams.length === 0 && (
          <Text style={s.empty}>ยังไม่มี Live — กด "สร้าง Live ใหม่" เลย!</Text>
        )}
        {streams.map(stream => (
          <TouchableOpacity key={stream.id} style={s.card} onPress={() => openStream(stream)}>
            {stream.thumbnail && (
              <Image source={{uri: stream.thumbnail}} style={s.thumb} />
            )}
            <View style={s.cardInfo}>
              <Text style={s.cardTitle} numberOfLines={1}>[Live🎉] {stream.title}</Text>
              <Text style={s.cardTime}>
                {moment(stream.scheduledAt).format('D MMM YYYY HH:mm')}
              </Text>
              <Text style={s.cardDesc} numberOfLines={2}>{stream.description}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteStream(stream.id)} style={s.delBtn}>
              <Text style={s.delTxt}>🗑️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg:        { flex:1, paddingTop:52 },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:24, marginBottom:16 },
  hello:     { fontSize:22, fontFamily:'Mitr_500Medium', color:'#7c3aed' },
  subHello:  { fontSize:13, fontFamily:'Mitr_400Regular', color:'#a78bfa' },
  avatar:    { width:48, height:48, borderRadius:24, borderWidth:2, borderColor:'#c084fc' },
  createBtn: { marginHorizontal:24, backgroundColor:'#c084fc', borderRadius:16, paddingVertical:14, alignItems:'center', marginBottom:16, elevation:4 },
  createTxt: { fontSize:17, fontFamily:'Mitr_500Medium', color:'#fff' },
  list:      { flex:1, paddingHorizontal:24 },
  empty:     { textAlign:'center', fontFamily:'Mitr_400Regular', color:'#aaa', marginTop:48, fontSize:15 },
  card:      { backgroundColor:'rgba(255,255,255,0.8)', borderRadius:18, marginBottom:14, flexDirection:'row', overflow:'hidden', elevation:3 },
  thumb:     { width:90, height:90 },
  cardInfo:  { flex:1, padding:12 },
  cardTitle: { fontFamily:'Mitr_500Medium', fontSize:14, color:'#6d28d9', marginBottom:3 },
  cardTime:  { fontFamily:'Mitr_400Regular', fontSize:12, color:'#a78bfa', marginBottom:4 },
  cardDesc:  { fontFamily:'Mitr_400Regular', fontSize:12, color:'#888' },
  delBtn:    { padding:14, justifyContent:'center' },
  delTxt:    { fontSize:18 },
});
