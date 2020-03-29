/**
 * @format
 */
/**
 * @format
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  Text,
  View,
  StyleSheet,
  Button,
  Image,
  TouchableOpacity,
  Platform,
  ToastAndroid,
  TextInput,
  Keyboard,
  Alert,
  PermissionsAndroid,
  BackHandler,
  DeviceEventEmitter,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { 
  createBottomTabNavigator,
  createAppContainer,
} from 'react-navigation';
import Tts from 'react-native-tts';
import Sound from 'react-native-sound';
import timer from 'react-native-timer';
import AudioRecorderPlayer from './audioRecorderPlayer';
//import RNHomePressed from './rnHomePressed';

var infoDeveloper = () => {
    Alert.alert(
        '開発者',
        '・よこはま言友会に入っています。\n・ご要望やご質問がある方は下記にご連絡を\n　kouhei.ocp117@gmail.com\n',
    )
}

class DAF extends Component {
  constructor(props) {
    super(props);
    const audioRecorderAndPlayer = new AudioRecorderPlayer();
    this.onStartRecordAndStartPlayer = this.onStartRecordAndStartPlayer.bind(this);
    this.recordAndPlay = this.recordAndPlay.bind(this);
    this.changeValue = this.changeValue.bind(this);
    this.releaseAll = this.releaseAll.bind(this);
    this.requestMicrophonePermission = this.requestMicrophonePermission.bind(this);
    this.helpAlert = this.helpAlert.bind(this);
    this.state = {
        value: 10,
        disvalue: "1.0",
        recordflag:false,
        audioRecorderAndPlayer: audioRecorderAndPlayer,
        playTime: null,
        duration: null,
        permission: false,
      };
      this.props.navigation.addListener('didBlur', () => this.releaseAll());
      this.requestMicrophonePermission();
  };
  requestMicrophonePermission = async() => {
    const grantedflag = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (grantedflag === PermissionsAndroid.RESULTS.GRANTED) {
        this.setState({
            permission:true
        })
    } else {
        try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              {
                'title': 'はじめに',
                'message': '・本アプリはマイクの使用を許可していただく必要があります。'
              }
            )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              //console.log("You can use the camera")
              this.setState({
                  permission:true
              })
            } else {
              //console.log("Camera permission denied")
            }
        } catch (err) {
            ToastAndroid.show("warning",ToastAndroid.SHORT);
            //console.warn(err)
        }
    }
  };
  releaseAll = () => {
    if(this.state.recordflag) {
        this.setState({
            recordflag: false,
        });
    }
    this.state.audioRecorderAndPlayer.releaseRecorderAndReleasePlayer();
  };
  onStartRecordAndStartPlayer = async () => {
    //ToastAndroid.show('onStartRecordAndStartPlayer',ToastAndroid.SHORT);
    const result = await this.state.audioRecorderAndPlayer.startRecorderAndStartPlayer(100*this.state.value);
    console.log(result);
  };
  changeValue = async (value) => {
    this.setState({ value: value, disvalue:String((value*0.1).toFixed(1)) })
    if(this.state.recordflag) {
        //ToastAndroid.show('change stop',ToastAndroid.SHORT);
        this.onStartRecordAndStartPlayer();
        this.setState({
            recordflag: false,
        });
    }
  };
  recordAndPlay = async () => {
    if (this.state.recordflag) {
      //ToastAndroid.show("stop",ToastAndroid.SHORT);
      this.setState({
        recordflag: false,
      });
      this.onStartRecordAndStartPlayer();
    } else {
      //ToastAndroid.show("recordAndPlay",ToastAndroid.SHORT);
      this.setState({
        recordflag: true,
      });
      ToastAndroid.show('録音／再生を始めます',
        ToastAndroid.SHORT);
      this.onStartRecordAndStartPlayer();
    }
  };
  helpAlert = () =>{
    Alert.alert(
        'DAFの使い方',
        '・start/stopボタンで音声の録音／再生と終了ができます。\n・シークバーで音声の遅延時間が調整できます。\n・イヤホンの使用を推奨します。',
    )
  };
  componentDidMount() {
    DeviceEventEmitter.addListener(
     'ON_HOME_BUTTON_PRESSED',
     () => {
        this.releaseAll();
    })
    BackHandler.addEventListener('hardwareBackPress', this.releaseAll);
  };
  componentWillUnmount() {
    //ToastAndroid.show('close',ToastAndroid.SHORT);
    this.releaseAll();
    BackHandler.removeEventListener("hardwareBackPress", this.releaseAll);
  };
  render() {
    const value = this.state.value;
    const disvalue = this.state.disvalue;
    if (this.state.permission) {
        return (
            <View style={{flex: 1,
                alignItems: 'flex-end',
                justifyContent:  'space-between'}}>
              <View></View>
              <View 
                style={{ 
                width: 300,
                marginTop: 50,
                justifyContent: 'center',
                alignSelf: 'center' }}>
                <View style={{width: 300, marginTop: 50}}>
                  <Text style={styles.text}>
                    {disvalue}秒遅れて聞こえます
                  </Text>
                  <Slider
                    step={1}
                    minimumValue={1}
                    maximumValue={50}
                    onValueChange={ value => this.changeValue(value)}
                    value={value}
                  />
                  <Button
                    onPress={this.recordAndPlay}
                    title="START/STOP"
                    color="#6495ed"
                  /> 
                </View>
              </View>
              <View style ={{flexDirection: 'row'}}>
                <TouchableOpacity
                  onPress={this.helpAlert}>
                  <Image
                    style= {{width:40, height:40}}
                    source={require('./hatena.png')}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={infoDeveloper}>
                  <Image
                    style= {{width:40, height:40}}
                    source={require('./info.png')}
                  />
                </TouchableOpacity>
              </View>
            </View>
        );
    } else {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.text}>
                  DAF
              </Text>
            </View>
        );
    }
  };
}

class TextToSpeech extends Component {
  state = {
    voices: [],
    ttsStatus: "initiliazing",
    selectedVoice: null,
    speechRate: 0.5,
    speechPitch: 1,
    speechappinstall: false,
    text: "ファミチキください"
  };
  constructor(props) {
    super(props);
    this.helpAlert = this.helpAlert.bind(this);
    Tts.addEventListener("tts-start", event =>
      this.setState({ ttsStatus: "started" })
    );
    Tts.addEventListener("tts-finish", event =>
      this.setState({ ttsStatus: "finished" })
    );
    Tts.addEventListener("tts-cancel", event =>
      this.setState({ ttsStatus: "cancelled" })
    );
    Tts.setDefaultRate(this.state.speechRate);
    Tts.setDefaultPitch(this.state.speechPitch);
    Tts.getInitStatus().then(() => {
      this.setState({speechappinstall:true});
      this.initTts
    }, (err) => {
      if (err.code === 'no_engine') {
        Alert.alert(
          'はじめに',
          '・本アプリはテキスト読み上げソフトをインストールしていただく必要があります。',
          [
            {text: 'OK', onPress: () => Tts.requestInstallEngine()},
          ],
          {cancelable: false},
        );
      } else {
          this.setState({speechappinstall:true});
          this.initTts
      }
    });
  };
  initTts = async () => {
    const voices = await Tts.voices();
    const availableVoices = voices
      .filter(v => !v.networkConnectionRequired && !v.notInstalled)
      .map(v => {
        return { id: v.id, name: v.name, language: v.language };
      });
    let selectedVoice = null;
    if (voices && voices.length > 0) {
      selectedVoice = voices[0].id;
      try {
        await Tts.setDefaultLanguage(voices[0].language);
      } catch (err) {
        // My Samsung S9 has always this error: "Language is not supported"
        console.log(`setDefaultLanguage error `, err);
      }
      await Tts.setDefaultVoice(voices[0].id);
      this.setState({
        voices: availableVoices,
        selectedVoice,
        ttsStatus: "initialized"
      });
    } else {
      this.setState({ ttsStatus: "initialized" });
    }
  };
  readText = async () => {
    Tts.stop();
    Tts.speak(this.state.text);
  };
  setSpeechRate = async rate => {
    await Tts.setDefaultRate(rate);
    this.setState({ speechRate: rate });
  };
  setSpeechPitch = async rate => {
    await Tts.setDefaultPitch(rate);
    this.setState({ speechPitch: rate });
  };
  onVoicePress = async voice => {
    try {
      await Tts.setDefaultLanguage(voice.language);
    } catch (err) {
      console.log(`setDefaultLanguage error `, err);
    }
    await Tts.setDefaultVoice(voice.id);
    this.setState({ selectedVoice: voice.id });
  };
  helpAlert = () =>{
    Alert.alert(
        'テキスト読み上げの使い方',
        '・テキストを読み上げるボタンで音声が出ます。\n・シークバーで読み上げる速度とピッチを調整できます。',
    )
  };
  render() {
    if (this.state.speechappinstall) {
        return (
            <View style={{flex: 1,
                alignItems: 'flex-end',
                justifyContent:  'space-between'}}>
              <View style={{  
                justifyContent: 'center',
                alignSelf: 'center' }}>
                <Text style={{ textAlign: "center", fontSize: 20, }}
                  >話す速度：{this.state.speechRate.toFixed(2)
                }</Text>
                <Slider
                  style={{width: 300, height: 30, borderRadius: 50}}
                  minimumValue={0.1}
                  maximumValue={1.0}
                  step={0.1} 
                  value={this.state.speechRate}
                  onSlidingComplete={this.setSpeechRate}
                />
                <Text style={{ textAlign: "center", fontSize: 20 }}
                  >ピッチ：　{this.state.speechPitch.toFixed(2)}
                </Text>
                <Slider
                  style={{width: 300, height: 30, borderRadius: 50}}
                  minimumValue={0.5}
                  maximumValue={2}
                  step={0.1}  
                  value={this.state.speechPitch}
                  onSlidingComplete={this.setSpeechPitch}
                />
              </View>
              <TextInput
                style={styles.textInput}
                multiline={true}
                onChangeText={text => this.setState({ text })}
                value={this.state.text}
                onSubmitEditing={Keyboard.dismiss}
              />     
              <View style={{width: 300, marginTop: 50,
                justifyContent: 'center',
                alignSelf: 'center'}}>
                <Button
                  onPress={this.readText}
                  title="テキストを読み上げる"
                  color="#6495ed"
                />
              </View>
              <View style ={{flexDirection: 'row'}}>
                <TouchableOpacity
                  onPress={this.helpAlert}>
                  <Image
                    style= {{width:40, height:40}}
                    source={require('./hatena.png')}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
    } else {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.text}>
                  TextToSpeech
              </Text>
            </View>
        );
    }
  }
}

class Metronome extends Component {
    constructor(props) {
      super(props);
      this.onPlayAndStop = this.onPlayAndStop.bind(this);
      this.changeValue = this.changeValue.bind(this);
      this.playMetronome = this.playMetronome.bind(this);
      this.intervalPlay = this.intervalPlay.bind(this);
      this.clearTimer = this.clearTimer.bind(this);
      this.helpAlert = this.helpAlert.bind(this);
      var gen = new Sound('asset:/media/metronome_sound2.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log('failed to load the sound', error);
            return;
        }
      }) ;
      gen.setVolume(1.);
      gen.setNumberOfLoops(-1);
      this.state = {
          interval: 10,
          generator: gen,
          disinterval: "1.0",
          runningflag: false,
      };
      this.props.navigation.addListener('didBlur', () => this.clearTimer());
    };
    intervalPlay = () => {
        //this.state.generator.pause();
        this.state.generator.play();
    };
    clearTimer = () => {
        if(this.state.runningflag) {
            this.setState({
                runningflag: false,
            });
        }
        timer.clearInterval(this, "metronome");
    };
    onPlayAndStop = () => {
      //ToastAndroid.show('onPlayAndStop',ToastAndroid.SHORT);
      if (this.state.runningflag) {
          timer.clearInterval(this, "metronome");
      } else {
          this.state.generator.play();
          timer.setInterval(this, "metronome", () => this.intervalPlay(), this.state.interval*100);
      }
    };
    changeValue = (interval) => {
      this.setState({ interval: interval, disinterval:String((interval*0.1).toFixed(1)) })
      if(this.state.runningflag) {
          this.onPlayAndStop();
          this.setState({
              runningflag: false,
          });
      } 
    };
    playMetronome = () => {
      if(this.state.runningflag) {
          //ToastAndroid.show('stopGenerator',ToastAndroid.SHORT);
          this.onPlayAndStop();
          this.setState({
              runningflag: false,
          });
      } else {
          //ToastAndroid.show('startGenerator',ToastAndroid.SHORT);
          this.onPlayAndStop();
          this.setState({
              runningflag: true,
          });
      }
    };
    helpAlert = () =>{
        Alert.alert(
            'メトロノームの使い方',
            '・start/stopボタンで音の開始と終了ができます。\n・シークバーで音が鳴る間隔を調整できます。',
        )
    };
    componentDidMount() {
        DeviceEventEmitter.addListener(
         'ON_HOME_BUTTON_PRESSED',
         () => {
            this.clearTimer();
        })
        BackHandler.addEventListener('hardwareBackPress', this.clearTimer);
    };
    componentWillUnmount() {
        //ToastAndroid.show('close',ToastAndroid.SHORT);
        this.clearTimer();
    };
    render() {
      const interval = this.state.interval;
      const disinterval = this.state.disinterval;
      return (
        <View style={{flex: 1,
            alignItems: 'flex-end',
            justifyContent:  'space-between'}}>
          <View></View>
          <View 
            style={{ 
                width: 300,
                marginTop: 50,
                justifyContent: 'center',
                alignSelf: 'center' }}>
          <Text style={styles.text}>
              {disinterval}秒の間隔で音が出ます
          </Text>
          <Slider
              step={1}
              minimumValue={3}
              maximumValue={20}
              onValueChange={ interval => this.changeValue(interval)}
              value={interval}
            />
            <Button
              onPress={this.playMetronome}
              title="START/STOP"
              color="#6495ed"
            />
          </View>
          <View style ={{flexDirection: 'row'}}>
            <TouchableOpacity
              onPress={this.helpAlert}>
              <Image
                style= {{width:40, height:40}}
                source={require('./hatena.png')}
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

const RootStack = createBottomTabNavigator(
  {
    DAF: { 
        screen: DAF,
        navigationOptions: {
            headerTitle: 'DAF',
        },
    },
    TextToSpeech: {
      screen: TextToSpeech,
      navigationOptions: {
        headerTitle: 'TextToSpeech',
      },
    },
    Metronome: {
      screen: Metronome,
        navigationOptions: {
          headerTitle: 'Metronome',
      },
    },
  },
  {
    initialRouteName: 'DAF'
  }
);

const AppContainer = createAppContainer(RootStack);

export default class StutterTool extends React.Component {
  render() {
    return <AppContainer
      ref={nav => {
        this.navigator = nav;
      }}
    />;
  }
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  text: {
    fontSize: 50,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  textInput: {
    borderColor: "gray",
    borderWidth: 1,
    flex: 1,
    width: "100%",
    maxHeight:200,
  }
});

AppRegistry.registerComponent('StutterTool', () => StutterTool);

