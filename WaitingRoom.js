import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import ChatOverlay from '../components/ChatOverlay';
import NotificationBanner from '../components/NotificationBanner';

const { width } = Dimensions.get('window');
const PASTEL = ['#ffd6e0','#fce4ec','#e8d5f5','#dbeafe'];

export default function WaitingRoom({ navigation, route }) {
  const { stream } = route.params;
  const [secsLeft,  setSecsLeft]  = useState(0);
  const [isReady,   setIsReady]   = useState(false);   // หลังนับถอยหลังเสร็จ
  const [launching, setLaunching] = useState(false);   // กำลังเร่งเวลา
  const notifRef  = useRef(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const launchTimer = useRef(null);

  useEffect(() => {
    // นับถอยหลัง
    const tick = () => {
      const diff = moment(stream.scheduledAt).diff(moment(), 'seconds');
      setSecsLeft(Math.max(diff, 0));
      if (diff <= 0) setIsReady(true);
    };
    tick();
    const id = setInterval(tick, 1000);

    // แสดง fade-in
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:800, useNativeDriver:true }),
      Animated.spring(scaleAnim, { toValue:1, friction:5,   useNativeDriver:true }),
    ]).start();

    // แจ้งเตือนทุกชั่วโมง
    const hourId = setInterval(() => {
      const h = moment().format('HH');
      const m = moment().format('mm');
      if (m === '00') notifRef.current?.show(`⏰ ตอนนี้เวลา ${h}:00 น.`);
    }, 60000);

    return () => { clearInterval(id); clearInterval(hourId); clearTimeout(launchTimer.current); };
  }, []);

  // เร่งเวลา
  function fastForward() {
    if (launching) return;
    setLaunching(true);
    let elapsed = 0;
    const step  = Math.ceil(secsLeft / 30);  // เร่ง 30 steps ใน ~3 วินาที
    const id = setInterval(() => {
      elapsed++;
      setSecsLeft(prev => {
        const next = Math.max(prev - step, 0);
        if (next <= 0) { clearInterval(id); setIsReady(true); setLaunching(false); }
        return next;
      });
    }, 100);
    launchTimer.current = id;
  }

  // เปิด Live ทันที
  function goLive() {
    navigation.replace('Live', { stream });
  }

  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const pad  = n => String(n).padStart(2, '0');

  return (
    <LinearGradient colors={PASTEL} start={{x:0,y:0}} end={{x:1,y:1}} style={s.bg}>

      <NotificationBanner ref={notifRef} />

      <Animated.View style={[s.center, { opacity: fadeAnim, transform: [{scale: scaleAnim}] }]}>

        {!isReady ? (
          <>
            <Text style={s.coming}>Live กำลังจะมา...</Text>
            <Text style={s.streamTitle}>[Live🎉] {stream.title}</Text>

            {/* Countdown */}
            <View style={s.timerBox}>
              <Text style={s.timer}>{pad(Math.floor(mins/60))}:{pad(mins%60)}:{pad(secs)}</Text>
              <Text style={s.timerLabel}>ชั่วโมง : นาที : วินาที</Text>
            </View>

            {/* Fast forward (เจ้าของเท่านั้น) */}
            <TouchableOpacity style={s.ffBtn} onPress={fastForward} disabled={launching}>
              <Text style={s.ffTxt}>{launching ? '⚡ กำลังเร่ง...' : '⚡ เปิด Live เร็วขึ้น'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.readyTxt}>กำลังเตรียมตัวรอแป๊บนะ 🎀</Text>
            <TouchableOpacity style={s.liveBtn} onPress={goLive}>
              <Text style={s.liveTxt}>🔴  เริ่ม Live เลย!</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Chat overlay มุมขวาล่าง */}
      <ChatOverlay streamId={stream.id} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg:           { flex:1 },
  center:       { flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:32 },
  coming:       { fontFamily:'Mitr_400Regular', fontSize:16, color:'#a78bfa', marginBottom:6 },
  streamTitle:  { fontFamily:'Mitr_500Medium', fontSize:20, color:'#6d28d9', textAlign:'center', marginBottom:28 },
  timerBox:     { backgroundColor:'rgba(255,255,255,0.7)', borderRadius:24, paddingVertical:24, paddingHorizontal:40, alignItems:'center', marginBottom:28, elevation:4 },
  timer:        { fontFamily:'TiltWarp_400Regular', fontSize:56, color:'#c084fc', letterSpacing:4 },
  timerLabel:   { fontFamily:'Mitr_400Regular', fontSize:12, color:'#bbb', marginTop:6 },
  ffBtn:        { backgroundColor:'rgba(192,132,252,0.2)', borderRadius:14, paddingHorizontal:24, paddingVertical:12, borderWidth:1, borderColor:'#c084fc' },
  ffTxt:        { fontFamily:'Mitr_400Regular', fontSize:14, color:'#7c3aed' },
  readyTxt:     { fontFamily:'Mitr_500Medium', fontSize:26, color:'#7c3aed', textAlign:'center', marginBottom:32 },
  liveBtn:      { backgroundColor:'#ef4444', borderRadius:20, paddingHorizontal:40, paddingVertical:18, elevation:6 },
  liveTxt:      { fontFamily:'Mitr_500Medium', fontSize:20, color:'#fff' },
});
