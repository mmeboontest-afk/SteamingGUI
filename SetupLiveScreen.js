import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const PASTEL = ['#ffd6e0','#ffecf5','#e8d5f5','#d5eef5'];

export default function SetupLiveScreen({ navigation, route }) {
  const [title, setTitle]       = useState('');
  const [desc,  setDesc]        = useState('');
  const [thumb, setThumb]       = useState(null);
  const [date,  setDate]        = useState(new Date(Date.now() + 60*60*1000));
  const [showPicker, setShow]   = useState(false);
  const [mode, setMode]         = useState('date');

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, aspect: [16,9],
    });
    if (!res.canceled) setThumb(res.assets[0].uri);
  }

  async function save() {
    if (!title.trim()) { Alert.alert('กรุณาใส่ชื่อ Live'); return; }
    const stream = {
      id: Date.now().toString(),
      title: title.trim(),
      description: desc.trim(),
      thumbnail: thumb,
      scheduledAt: date.toISOString(),
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(await AsyncStorage.getItem('streams') || '[]');
    existing.push(stream);
    await AsyncStorage.setItem('streams', JSON.stringify(existing));
    route.params?.onSave?.();
    navigation.goBack();
  }

  return (
    <LinearGradient colors={PASTEL} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← กลับ</Text>
          </TouchableOpacity>
          <Text style={s.title}>ตั้งค่า Live</Text>
          <View style={{width:48}} />
        </View>

        {/* Thumbnail */}
        <TouchableOpacity style={s.thumbBox} onPress={pickImage}>
          {thumb ? (
            <Image source={{uri:thumb}} style={s.thumbImg} />
          ) : (
            <Text style={s.thumbPlaceholder}>แตะเพื่อใส่ปก Live{'\n'}(16:9)</Text>
          )}
          <View style={s.thumbBadge}><Text style={{color:'#fff',fontSize:12}}>📷 เปลี่ยน</Text></View>
        </TouchableOpacity>
        <Text style={s.thumbNote}>⚠️ LiveTitle.png จะถูกวางทับอัตโนมัติบนทุก Live</Text>

        {/* Title */}
        <Text style={s.label}>ชื่อ Live</Text>
        <TextInput
          style={s.input}
          placeholder="ชื่อสตรีมของคุณ..."
          placeholderTextColor="#ccc"
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />
        <Text style={s.preview}>[Live🎉] {title || 'ชื่อของคุณ'}</Text>

        {/* Description */}
        <Text style={s.label}>คำอธิบาย</Text>
        <TextInput
          style={[s.input, {height:90, textAlignVertical:'top'}]}
          placeholder="คำอธิบาย Live..."
          placeholderTextColor="#ccc"
          value={desc}
          onChangeText={setDesc}
          multiline
          maxLength={300}
        />

        {/* Schedule */}
        <Text style={s.label}>วันและเวลา Live</Text>
        <TouchableOpacity style={s.dateBtn} onPress={() => { setMode('date'); setShow(true); }}>
          <Text style={s.dateTxt}>📅  {moment(date).format('D MMMM YYYY')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dateBtn} onPress={() => { setMode('time'); setShow(true); }}>
          <Text style={s.dateTxt}>🕐  {moment(date).format('HH:mm')}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date} mode={mode} is24Hour display="spinner"
            minimumDate={new Date()}
            onChange={(e, d) => { setShow(false); if (d) setDate(d); }}
          />
        )}

        <Text style={s.note}>
          🔔 ห้องรอจะเปิด 30 นาทีก่อน Live
        </Text>

        {/* Save */}
        <TouchableOpacity style={s.saveBtn} onPress={save}>
          <Text style={s.saveTxt}>✨  บันทึก Live</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll:           { padding:24, paddingTop:52 },
  header:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  back:             { fontSize:15, fontFamily:'Mitr_400Regular', color:'#7c3aed' },
  title:            { fontSize:20, fontFamily:'Mitr_500Medium', color:'#6d28d9' },
  thumbBox:         { width:'100%', height:180, backgroundColor:'rgba(255,255,255,0.6)', borderRadius:18, overflow:'hidden', justifyContent:'center', alignItems:'center', marginBottom:6 },
  thumbImg:         { width:'100%', height:'100%' },
  thumbPlaceholder: { fontFamily:'Mitr_400Regular', color:'#bbb', textAlign:'center', fontSize:14 },
  thumbBadge:       { position:'absolute', bottom:8, right:10, backgroundColor:'rgba(0,0,0,0.4)', borderRadius:10, paddingHorizontal:10, paddingVertical:4 },
  thumbNote:        { fontFamily:'Mitr_400Regular', fontSize:11, color:'#a78bfa', marginBottom:16 },
  label:            { fontFamily:'Mitr_500Medium', fontSize:14, color:'#7c3aed', marginBottom:6, marginTop:12 },
  input:            { backgroundColor:'rgba(255,255,255,0.75)', borderRadius:14, padding:14, fontFamily:'Mitr_400Regular', fontSize:14, color:'#333', marginBottom:4 },
  preview:          { fontFamily:'Mitr_400Regular', fontSize:12, color:'#a78bfa', marginBottom:8, marginLeft:4 },
  dateBtn:          { backgroundColor:'rgba(255,255,255,0.75)', borderRadius:14, padding:14, marginBottom:8 },
  dateTxt:          { fontFamily:'Mitr_400Regular', fontSize:15, color:'#6d28d9' },
  note:             { fontFamily:'Mitr_400Regular', fontSize:12, color:'#888', textAlign:'center', marginTop:8, marginBottom:16 },
  saveBtn:          { backgroundColor:'#c084fc', borderRadius:18, padding:16, alignItems:'center', marginTop:8, elevation:4 },
  saveTxt:          { fontFamily:'Mitr_500Medium', fontSize:17, color:'#fff' },
});
