import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
export default function SafeScreen({ onHoldStart, onHoldEnd, connectionFault }) {
  return (
    <View style={s.overlay}>
      <LinearGradient colors={['#ffd6e0','#e8d5f5']} style={s.bg}>
        <Text style={s.icon}>{connectionFault ? '📡' : '🛡️'}</Text>
        <Text style={s.title}>{connectionFault ? 'Connection faulty' : 'กำลังเตรียมตัวรอแป๊บนะ'}</Text>
        {connectionFault && <Text style={s.sub}>การเชื่อมต่อมีปัญหา — Live ยังทำงานอยู่</Text>}
        <Text style={s.hint}>กดค้าง 10 วินาที เพื่อปิด Safe Screen</Text>
        <TouchableOpacity style={s.holdBtn} onPressIn={onHoldStart} onPressOut={onHoldEnd}>
          <Text style={s.holdTxt}>กดค้างเพื่อปิด</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
const s = StyleSheet.create({
  overlay:{ position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:999 },
  bg:     { flex:1, justifyContent:'center', alignItems:'center' },
  icon:   { fontSize:64, marginBottom:16 },
  title:  { fontFamily:'Mitr-Medium', fontSize:24, color:'#6d28d9', textAlign:'center', marginBottom:8 },
  sub:    { fontFamily:'Mitr_400Regular', fontSize:14, color:'#888', marginBottom:8, textAlign:'center', paddingHorizontal:32 },
  hint:   { fontFamily:'Mitr_400Regular', fontSize:13, color:'#a78bfa', marginBottom:24 },
  holdBtn:{ backgroundColor:'rgba(192,132,252,0.3)', borderRadius:16, paddingHorizontal:32, paddingVertical:14, borderWidth:1, borderColor:'#c084fc' },
  holdTxt:{ fontFamily:'Mitr-Medium', fontSize:15, color:'#7c3aed' },
});
