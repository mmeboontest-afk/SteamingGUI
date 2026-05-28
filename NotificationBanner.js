import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
const COLORS = ['#ffd6e0','#e8d5f5','#dbeafe','#d1fae5'];
let ci = 0;
const NotificationBanner = forwardRef((props, ref) => {
  const [msg, setMsg] = useState('');
  const [vis, setVis] = useState(false);
  const [bg, setBg]   = useState(COLORS[0]);
  const fade = useRef(new Animated.Value(0)).current;
  const t    = useRef(null);
  useImperativeHandle(ref, () => ({
    show(text, dur=5000) {
      clearTimeout(t.current);
      ci = (ci+1) % COLORS.length;
      setBg(COLORS[ci]); setMsg(text); setVis(true);
      Animated.timing(fade,{toValue:1,duration:300,useNativeDriver:true}).start();
      t.current = setTimeout(() => {
        Animated.timing(fade,{toValue:0,duration:300,useNativeDriver:true}).start(()=>setVis(false));
      }, dur);
    }
  }));
  if (!vis) return null;
  return (
    <Animated.View style={[s.banner,{backgroundColor:bg,opacity:fade}]}>
      <Text style={s.txt} numberOfLines={2}>{msg}</Text>
    </Animated.View>
  );
});
export default NotificationBanner;
const s = StyleSheet.create({
  banner:{ position:'absolute',top:16,left:12,right:12,borderRadius:14,padding:12,zIndex:200,elevation:8 },
  txt:   { fontFamily:'Mitr-Medium',fontSize:14,color:'#4c1d95' },
});
