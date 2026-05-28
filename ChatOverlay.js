import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Dimensions, PanResponder } from 'react-native';
const BAD = ['ไอ้สัตว์','ควาย','เหี้ย','เชี่ย','สัตว์','fuck','shit','bitch','ass'];
const isBad = t => BAD.some(w => t.toLowerCase().includes(w.toLowerCase()));
const COLORS = ['#f472b6','#a78bfa','#60a5fa','#34d399','#fb923c'];
const { width, height } = Dimensions.get('window');
let ncm = {};
function nc(n) { if(!ncm[n]) ncm[n]=COLORS[Object.keys(ncm).length%COLORS.length]; return ncm[n]; }
export default function ChatOverlay({ streamId }) {
  const [msgs, setMsgs] = useState([{id:'1',user:'ระบบ',text:'ยินดีต้อนรับสู่ Live! 🎀'}]);
  const pan  = useRef(new Animated.ValueXY({x:width-185,y:height-290})).current;
  const flat = useRef();
  const pr   = PanResponder.create({
    onStartShouldSetPanResponder:()=>true,
    onPanResponderMove: Animated.event([null,{dx:pan.x,dy:pan.y}],{useNativeDriver:false}),
    onPanResponderRelease:()=>{ pan.flattenOffset(); },
    onPanResponderGrant:()=>{ pan.setOffset({x:pan.x._value,y:pan.y._value}); pan.setValue({x:0,y:0}); }
  });
  function add(user,text) {
    if(isBad(user)||isBad(text)) return;
    setMsgs(p=>[...p,{id:Date.now()+'',user,text}].slice(-50));
    setTimeout(()=>flat.current?.scrollToEnd({animated:true}),100);
  }
  useEffect(()=>{
    const demo=[{user:'Viewer1',text:'สวัสดีครับ!'},{user:'แมวน้อย',text:'Live มาแล้ว 🎉'},{user:'NMeFan',text:'เย้!!'}];
    const id=setInterval(()=>{ const d=demo[Math.floor(Math.random()*demo.length)]; add(d.user,d.text); },9000);
    return ()=>clearInterval(id);
  },[]);
  return (
    <Animated.View style={[s.box,{transform:pan.getTranslateTransform()}]} {...pr.panHandlers}>
      <View style={s.hdr}><Text style={s.hdrTxt}>💬 แชท</Text></View>
      <FlatList ref={flat} data={msgs} keyExtractor={i=>i.id} style={s.list}
        renderItem={({item})=>(
          <View style={s.row}>
            <Text style={[s.name,{color:nc(item.user)}]}>{item.user}: </Text>
            <Text style={s.msg} numberOfLines={2}>{item.text}</Text>
          </View>
        )}
      />
    </Animated.View>
  );
}
const s = StyleSheet.create({
  box: { position:'absolute',bottom:80,right:8,width:178,height:220,backgroundColor:'rgba(30,0,50,0.65)',borderRadius:16,overflow:'hidden',zIndex:150 },
  hdr: { backgroundColor:'rgba(192,132,252,0.4)',padding:6,alignItems:'center' },
  hdrTxt: { fontFamily:'Mitr-Medium',fontSize:12,color:'#e9d5ff' },
  list:   { flex:1,padding:6 },
  row:    { flexDirection:'row',flexWrap:'wrap',marginBottom:4 },
  name:   { fontFamily:'Mitr-Medium',fontSize:11 },
  msg:    { fontFamily:'Mitr_400Regular',fontSize:11,color:'#e9d5ff',flex:1 },
});
