/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, {useEffect, useState} from 'react';
import {WebView} from 'react-native-webview';
import StaticServer from 'react-native-static-server';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Platform,
  SafeAreaView,
  Text,
  View,
} from 'react-native';


function App(): JSX.Element {
  const [serverUrl, setUrl] = useState(null);
  const [highScore, setHighScore] = useState('0');

  function getPath() {
    return Platform.OS === 'android'
      ? RNFS.DocumentDirectoryPath + '/www'
      : RNFS.MainBundlePath + '/www';
  }

  async function moveAndroidFiles() {
    if (Platform.OS === 'android') {
      await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/www');
      const files = [
        'www/index.html',
        'www/style.css',
        'www/index.js',
        'www/three.min.js',
        'www/TweenMax.min.js',
      ];
      await files.forEach(async file => {
        await RNFS.copyFileAssets(
          file,
          RNFS.DocumentDirectoryPath + '/' + file,
        );
      });
    }
  }

  async function storeData(value: string) {
    try{
      await AsyncStorage.setItem('high-score', value);
    } catch (e) {
      console.log(e);
    }
  }

  async function getData() {
    try{
     const value =  await AsyncStorage.getItem('high-score');
     if(value !== null) {
      console.log("Stored High Score", value);
      setHighScore(value);
     }
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    //onmount
    getData();
    moveAndroidFiles();
    let path = getPath();
    let server = new StaticServer(8080, path);
    server.start().then((url: any) => {
      setUrl(url);
    });

    //unmount
    return () => {
      if(server && server.isRunning()) {
        server.stop();
      }
    }
  }, [])

  function onMessage(event: any) {
    const data = JSON.parse(event.nativeEvent.data);
    if(data.highScore) {
      console.log("New High Score: ", data);
      storeData(String(data.highScore));
    }
  }

  const INJECT_JS = `
    window.addEventListener("message", message => {
      document.getElementById('high-score').innerHTML = message.data;
    });
    window.postMessage(${highScore});
    true;
  `

  if(!serverUrl){
    return (
      <SafeAreaView>
        <Text>Hello World</Text>
      </SafeAreaView>
    )
  }
  return (
    <SafeAreaView style={{flex:1}}>
      <View style={{height: '100%', width: '100%'}}>
        <WebView
          source={{uri: serverUrl}}
          style={{flex:1}}
          onMessage={onMessage}
          javaScriptEnabled={true}
          injectedJavaScript={INJECT_JS}
        />
      </View>
    </SafeAreaView>
  );
}

export default App;
