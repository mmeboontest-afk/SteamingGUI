import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Alert, PanResponder, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';
import ChatOverlay from '../components/ChatOverlay';
import NotificationBanner from '../components/NotificationBanner';
import SafeScreen from '../components/SafeScreen';

const { width, height } = Dimensions.get('window');
const PASTEL = ['#ffd6e0','#fce4ec','#e8d5f5','#dbeafe'];

// คำหยาบ — ตรวจแบบ word boundary ไม่จับมั่ว
const BAD_WORDS = ['ไอ้สัตว์','ควาย','เหี้ย','เชี่ย','สัตว์','fuck','shit','bitch','ass'];
const isBadName = n => BAD_WORDS.some(w => n.toLowerCase().split(/\s+/).includes(w.toLowerCase()));

const GAMES = ['Roblox','Minecraft','Mini World','Project Sekai'];

export default function LiveScreen({ navigation, route }) {
  const { stream } = route.params;
  const [safeVisible,  setSafe]       = useState(false);
  const [toolbarVis,   setToolbar]    = useState(true);
  const [gameIdx,      setGameIdx]    = useState(0);
  const [viewers,      setViewers]    = useState(0);
  const [endVisible,   setEndVisible] = useState(false);
  const [elapsed,      setElapsed]    = useState(0);   // วินาทีที่ Live ไปแล้ว
  const notifRef  = useRef(null);
  const safeHold  = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    'TiltWarp':    require('../../assets/fonts/TiltWarp-Regular.ttf'),
    'Mitr-Medium': require('../../assets/fonts/Mitr-Medium.ttf'),
  });

  // pulse animation for LIVE badge
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue:1.25, duration:600, useNativeDriver:true }),
        Animated.timing(pulseAnim, { toValue:1,    duration:600, useNativeDriver:true }),
      ])
    ).start();
  }, []);

  // นับเวลา Live
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e+1), 1000);
    return () => clearInterval(id);
  }, []);

  // แจ้งเตือนทุกชั่วโมง
  useEffect(() => {
    const id = setInterval(() => {
      const m = new Date().getMinutes();
      if (m === 0) {
        const h = new Date().getHours();
        const msg = `ตอนนี้เป็นเวลา ${h} นาฬิกา`;
        notifRef.current?.show(msg);
        Speech.speak(msg, { language:'th' });
      }
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // Super Thanks handler (เรียกจาก socket)
  function onSuperThanks(user, amount) {
    const display = isBadName(user) ? 'ขอบคุณที่ Super Thanks คร๊าบ!' : `${user} ให้ Super Thanks! ${amount}`;
    notifRef.current?.show(`💛 ${display}`);
    Speech.speak(display, { language:'th' });
  }

  // Subscriber handler
  function onSubscribe(user, role, months) {
    if (isBadName(user)) return;
    const msg = `${user} เป็น ${role} ${months} เดือนแล้วน้า!!`;
    notifRef.current?.show(`🌟 ${msg}`);
    Speech.speak(msg, { language:'th' });
  }

  // Safe Screen hold 10s to close
  function startSafeHold() {
    safeHold.current = setTimeout(() => setSafe(false), 10000);
  }
  function cancelSafeHold() {
    clearTimeout(safeHold.current);
  }

  function confirmEnd() {
    Alert.alert('ปิด Live', 'ต้องการปิด Live ใช่ไหม?', [
      { text:'ยกเลิก' },
      { text:'ปิด Live', style:'destructive', onPress: () => navigation.replace('End', { stream }) }
    ]);
  }

  const pad = n => String(n).padStart(2,'0');
  const elapsedFmt = `${pad(Math.floor(elapsed/3600))}:${pad(Math.floor(elapsed%3600/60))}:${pad(elapsed%60)}`;

  if (!fontsLoaded) return null;

  return (
    <View style={s.container}>

      {/* ── GAME AREA ─────────────────────────────────────────────── */}
      <View style={s.gameArea}>
        {/* LiveTitle overlay (always on top) */}
        <Image source={require('../../assets/LiveTitle.png')} style={s.liveTitle} resizeMode="contain" />

        {/* LIVE badge */}
        <Animated.View style={[s.liveBadge, {transform:[{scale:pulseAnim}]}]}>
          <Text style={s.liveDot}>●</Text>
          <Text style={s.liveTxt}>Live</Text>
        </Animated.View>

        {/* Elapsed time */}
        <View style={s.elapsed}>
          <Text style={s.elapsedTxt}>{elapsedFmt}</Text>
        </View>

        {/* Game label */}
        <View style={s.gameLabel}>
          <Text style={s.gameTxt}>{GAMES[gameIdx]}</Text>
        </View>

        {/* Placeholder (จริงๆ คือ screen share) */}
        <View style={s.gamePlaceholder}>
          <Text style={s.gameIcon}>🎮</Text>
          <Text style={s.gameHint}>แชร์หน้าจอเพื่อแสดงเกม</Text>
          <Text style={s.gameHint2}>{GAMES[gameIdx]}</Text>
        </View>
      </View>

      {/* ── NOTIFICATION ─────────────────────────────────────────── */}
      <NotificationBanner ref={notifRef} />

      {/* ── CHAT (มุมขวาล่าง) ────────────────────────────────────── */}
      <ChatOverlay streamId={stream.id} onSuperThanks={onSuperThanks} onSubscribe={onSubscribe} />

      {/* ── TOOLBAR (เจ้าของเท่านั้น) ────────────────────────────── */}
      {toolbarVis && (
        <BlurView intensity={60} style={s.toolbar}>
          {/* เปลี่ยนเกม */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.gameScroll}>
            {GAMES.map((g,i) => (
              <TouchableOpacity key={g} style={[s.gamePill, gameIdx===i && s.gamePillActive]} onPress={() => setGameIdx(i)}>
                <Text style={[s.gamePillTxt, gameIdx===i && {color:'#fff'}]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={s.toolRow}>
            {/* Safe Screen */}
            <TouchableOpacity style={s.toolBtn} onPress={() => setSafe(true)}>
              <Text style={s.toolIcon}>🛡️</Text>
              <Text style={s.toolLabel}>Safe</Text>
            </TouchableOpacity>

            {/* ซ่อน toolbar */}
            <TouchableOpacity style={s.toolBtn} onPress={() => setToolbar(false)}>
              <Text style={s.toolIcon}>👁️</Text>
              <Text style={s.toolLabel}>ซ่อน</Text>
            </TouchableOpacity>

            {/* ปิด Live */}
            <TouchableOpacity style={[s.toolBtn, s.endBtn]} onPress={confirmEnd}>
              <Text style={s.toolIcon}>⏹️</Text>
              <Text style={[s.toolLabel, {color:'#ef4444'}]}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}

      {/* แสดง toolbar กลับ */}
      {!toolbarVis && (
        <TouchableOpacity style={s.showToolbar} onPress={() => setToolbar(true)}>
          <Text style={s.showToolbarTxt}>▲ แสดงเครื่องมือ</Text>
        </TouchableOpacity>
      )}

      {/* ── SAFE SCREEN ──────────────────────────────────────────── */}
      {safeVisible && (
        <SafeScreen
          onHoldStart={startSafeHold}
          onHoldEnd={cancelSafeHold}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#000' },
  gameArea:       { flex:1, position:'relative', backgroundColor:'#111', justifyContent:'center', alignItems:'center' },
  liveTitle:      { position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:99 },
  liveBadge:      { position:'absolute', top:12, left:12, flexDirection:'row', alignItems:'center', backgroundColor:'#ef4444', borderRadius:20, paddingHorizontal:12, paddingVertical:5, zIndex:100 },
  liveDot:        { color:'#fff', fontSize:10, marginRight:5 },
  liveTxt:        { fontFamily:'Mitr-Medium', fontSize:14, color:'#fff' },
  elapsed:        { position:'absolute', top:12, right:12, backgroundColor:'rgba(0,0,0,0.5)', borderRadius:10, paddingHorizontal:10, paddingVertical:4, zIndex:100 },
  elapsedTxt:     { fontFamily:'TiltWarp', fontSize:13, color:'#fff' },
  gameLabel:      { position:'absolute', bottom:80, left:12, backgroundColor:'rgba(0,0,0,0.5)', borderRadius:10, paddingHorizontal:10, paddingVertical:4 },
  gameTxt:        { fontFamily:'Mitr-Medium', fontSize:13, color:'#c084fc' },
  gamePlaceholder:{ alignItems:'center' },
  gameIcon:       { fontSize:60, marginBottom:12 },
  gameHint:       { fontFamily:'Mitr-Medium', fontSize:16, color:'#aaa' },
  gameHint2:      { fontFamily:'TiltWarp', fontSize:22, color:'#c084fc', marginTop:6 },
  toolbar:        { backgroundColor:'rgba(255,255,255,0.15)', paddingHorizontal:16, paddingVertical:12, borderTopLeftRadius:20, borderTopRightRadius:20 },
  gameScroll:     { marginBottom:10 },
  gamePill:       { backgroundColor:'rgba(255,255,255,0.2)', borderRadius:16, paddingHorizontal:14, paddingVertical:6, marginRight:8 },
  gamePillActive: { backgroundColor:'#c084fc' },
  gamePillTxt:    { fontFamily:'Mitr-Medium', fontSize:13, color:'#ddd' },
  toolRow:        { flexDirection:'row', justifyContent:'space-around' },
  toolBtn:        { alignItems:'center', paddingVertical:6, paddingHorizontal:20 },
  toolIcon:       { fontSize:24 },
  toolLabel:      { fontFamily:'Mitr-Medium', fontSize:11, color:'#ddd', marginTop:2 },
  endBtn:         { borderRadius:12 },
  showToolbar:    { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'rgba(0,0,0,0.5)', alignItems:'center', paddingVertical:8 },
  showToolbarTxt: { fontFamily:'Mitr-Medium', fontSize:13, color:'#c084fc' },
});
