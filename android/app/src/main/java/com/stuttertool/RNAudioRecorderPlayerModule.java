package com.stuttertool;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;

import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.MediaRecorder.AudioSource;
import java.util.ArrayDeque;
import java.util.Deque;

import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.PermissionChecker;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionListener;

import org.json.JSONException;

import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;

import javax.annotation.Nullable;

public class RNAudioRecorderPlayerModule extends ReactContextBaseJavaModule implements PermissionListener{
  private int subsDurationMillis = 100;

  private final ReactApplicationContext reactContext;
  private AudioRecord audioRec = null;
  private long delaytime = 1000;
  private boolean running = false;
  private boolean setFlag = false;
  private int bufSize;
  private int samplingRate;
  private static int[] mSampleRates = new int[] { 44100, 22050, 11025, 8000};
  private AudioTrack audioTrack;

  public RNAudioRecorderPlayerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNAudioRecorderPlayer";
  }

  @ReactMethod
  public void startRecorderAndStartPlayer(final int delaytime, Promise promise) {
    try {
      if (
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
              (
                  ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED
              )
          ) {
        ActivityCompat.requestPermissions(getCurrentActivity(), new String[]{
            Manifest.permission.RECORD_AUDIO,
        }, 0);
        promise.reject("No permission granted.", "Try again after adding permission.");
        return;
      }
    } catch (NullPointerException ne) {
      promise.reject("No permission granted.", "Try again after adding permission.");
      return;
    }
    if (audioRec == null) {
        setFlag = setAudioRecord();
        if (setFlag == false) {
            promise.reject("Not use microphone ", "Try again after adding permission.");
            return;
        }
    }
    if (running) {
        running = false;
        audioRec.stop();
        audioTrack.stop();
    } else {
        audioRec.startRecording();
        running = true;
        audioTrack.play();
        new Thread(new Runnable() {
            @Override
            public void run() {
                byte[] buf = new byte[bufSize];
                Deque<byte[]> deque = new ArrayDeque<byte[]>(1000);
                boolean flag1 = true;
                boolean flag2 = true;
                long time1 = 0;
                long time2 = 0;
                long diff = 0;
                while (running) {
                    if (flag1) {
                        time1 = System.currentTimeMillis();
                        flag1 = false;
                    }
                    int bufRecordResult = audioRec.read(buf,0, buf.length);
                    byte[] tmpbuf = new byte[bufRecordResult];
                    System.arraycopy(buf, 0, tmpbuf, 0, bufRecordResult);
                    deque.offerFirst(tmpbuf);
                    if (flag2) {
                        time2 = System.currentTimeMillis();
                        diff = time2 - time1;
                        if (diff >= delaytime) {
                            flag2 = false;
                        }
                    }
                    else {
                        byte[] dbuf = deque.pollLast();
                        audioTrack.write(dbuf, 0, dbuf.length);
                    }
                }
            }
        }).start();
    }
    promise.resolve("true");
  }
  
  public boolean setAudioRecord() {
    boolean hit = false;
    for (int rate : mSampleRates) {
        try {
            int audioFormat = AudioFormat.ENCODING_PCM_16BIT;
            int channelConfig = AudioFormat.CHANNEL_IN_STEREO;
            //int channelConfig = AudioFormat.CHANNEL_IN_MONO;
            int bufferSize = AudioTrack.getMinBufferSize(rate,
                    channelConfig, audioFormat);
            if (bufferSize != AudioRecord.ERROR_BAD_VALUE) {
                // check if we can instantiate and have a success
                AudioRecord recorder = new AudioRecord(
                        AudioSource.MIC,
                        //AudioSource.DEFAULT,
                        rate,
                        channelConfig,
                        audioFormat,
                        bufferSize);

                if (recorder.getState() == AudioRecord.STATE_INITIALIZED)
                    bufSize = bufferSize;

                samplingRate = rate;
                audioTrack = new AudioTrack(
                    AudioManager.STREAM_VOICE_CALL,
                    //AudioManager.STREAM_MUSIC,
                    samplingRate,
                    AudioFormat.CHANNEL_OUT_STEREO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufSize,
                    AudioTrack.MODE_STREAM);
                audioRec = recorder;
            }
            hit = true;
        } catch (Exception e) {
        }
    }
    return hit;
  }

  @ReactMethod
  public void releaseRecorderAndReleasePlayer(Promise promise) {
    if (audioRec == null) {
        promise.resolve("release ok");
    } else {
        if (running) {
            running = false;
            audioRec.stop();
            audioTrack.stop();
            audioTrack.release();
            audioRec.release();
            audioRec = null;
            promise.resolve("release ok");
        } else {
            audioTrack.release();
            audioRec.release();
            audioRec = null;
            promise.resolve("release ok");
        }
    }
  }

  @ReactMethod
  public void setSubscriptionDuration(double sec, Promise promise) {
    this.subsDurationMillis = (int) (sec * 1000);
    promise.resolve("setSubscriptionDuration: " + this.subsDurationMillis);
  }

  @Override
  public boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    final int REQUEST_RECORD_AUDIO_PERMISSION = 200;
    switch (requestCode) {
      case REQUEST_RECORD_AUDIO_PERMISSION:
        if (grantResults[0] == PackageManager.PERMISSION_GRANTED)
          return true;
        break;
    }
    return false;
  }
}
