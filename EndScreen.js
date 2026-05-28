import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const PASTEL = ['#ffd6e0','#fce4ec','#e8d5f5','#dbeafe'];

export default function EndScreen({ navigation, route }) {
  const { stream } = route.params;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:600, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:600, useNativeDriver:true }),
    ]).start();

    // รอ 1 นาที แล้วกลับหน้า Home
    const id = setTimeout(() => navigation.replace('Home'), 60000);
    return () => clearTimeout(id);
  }, []);

  return (
    <LinearGradient colors={PASTEL} start={{x:0,y:0}} end={{x:1,y:1}} style={s.bg}>
      <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{translateY: slideAnim}] }]}>
        <Text style={s.emoji}>🎀</Text>
        <Text style={s.msg}>
          โอเค Live ของวันนี้ก็น่าจะมีประมาณนี้{'\n'}
          เจอกันใหม่ Live หน้าบ๊ายคร้าบบ!!
        </Text>
        <Text style={s.sub}>Live จะปิดใน 60 วินาที...</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg:   { flex:1, justifyContent:'center', alignItems:'center' },
  card: { backgroundColor:'rgba(255,255,255,0.8)', borderRadius:28, padding:36, alignItems:'center', width:width*0.85, elevation:6 },
  emoji:{ fontSize:56, marginBottom:16 },
  msg:  { fontFamily:'Mitr-Medium', fontSize:20, color:'#6d28d9', textAlign:'center', lineHeight:34, marginBottom:16 },
  sub:  { fontFamily:'Mitr_400Regular', fontSize:13, color:'#a78bfa' },
});
