import React, { useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './Call.css';

/**
 * 创建本地客户端 https://docs.agora.io/cn/Voice/start_call_audio_web_ng?platform=Web
 * 一对一或多人通话中，建议设为 "rtc"，使用通信场景。
 * 互动直播中，建议设为 "live"，使用直播场景。
 * codec 用于设置浏览器使用的编解码格式。如果你需要使用 Safari 12.1 及之前版本，将该参数设为 "h264"；其他情况我们推荐使用 "vp8"。
 */
const client = AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' });

function Call() {
  const [ appid, setAppid ] = useState('466efbaa001b469e93829bde1d2544f2');
  const [ token, setToken ] = useState('006466efbaa001b469e93829bde1d2544f2IADPUbJH1Y2oCTI3j/BIDTql0grNQg0YypA+ZELrY4aeCNJjSIgAAAAAEABoKgnHuHkvYAEAAQC3eS9g');
  const [ channel, setChannel ] = useState('123');
  const {
    localAudioTrack, localVideoTrack, leave, join, joinState, remoteUsers
  } = useAgora(client);

  return (
    <div className='call'>
      <form className='call-form'>
        <label>
          AppID:
          <input type='text' name='appid' onChange={(event) => { setAppid(event.target.value) }}/>
        </label>
        <label>
          Token(Optional):
          <input type='text' name='token' onChange={(event) => { setToken(event.target.value) }} />
        </label>
        <label>
          Channel:
          <input type='text' name='channel' onChange={(event) => { setChannel(event.target.value) }} />
        </label>
        <div className='button-group'>
          <button id='join' type='button' className='btn btn-primary btn-sm' disabled={joinState} onClick={() => {join(appid, channel, token)}}>Join</button>
          <button id='leave' type='button' className='btn btn-primary btn-sm' disabled={!joinState} onClick={() => {leave()}}>Leave</button>
        </div>
      </form>
      <div className='player-container'>
        <div className='local-player-wrapper'>
          <p className='local-player-text'>{localVideoTrack && `localTrack`}{joinState && localVideoTrack ? `(${client.uid})` : ''}</p>
          <MediaPlayer videoTrack={localVideoTrack} audioTrack={localAudioTrack}></MediaPlayer>
        </div>
        {remoteUsers.map(user => (<div className='remote-player-wrapper' key={user.uid}>
            <p className='remote-player-text'>{`remoteVideo(${user.uid})`}</p>
            {/*<MediaPlayer videoTrack={user.videoTrack} audioTrack={user.audioTrack}></MediaPlayer>*/}
          </div>))}
      </div>
    </div>
  );
}

export default Call;
