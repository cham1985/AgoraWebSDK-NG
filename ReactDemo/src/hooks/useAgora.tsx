import { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient, IAgoraRTCRemoteUser, MicrophoneAudioTrackInitConfig, CameraVideoTrackInitConfig, IMicrophoneAudioTrack, ICameraVideoTrack, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';

/**
 * 自定义 hooks
 * @param client 用来放置本地客户端
 */
export default function useAgora(client: IAgoraRTCClient | undefined)
    :
    {//返回值
      localAudioTrack: ILocalAudioTrack | undefined,
      localVideoTrack: ILocalVideoTrack | undefined,
      joinState: boolean,
      leave: Function,
      join: Function,
      remoteUsers: IAgoraRTCRemoteUser[],
    }
{//函数体
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | undefined>(undefined);
  //用来放置本地音频轨道对象
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | undefined>(undefined);

  const [joinState, setJoinState] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  async function createLocalTracks(audioConfig?: MicrophoneAudioTrackInitConfig, videoConfig?: CameraVideoTrackInitConfig)
      : Promise<[IMicrophoneAudioTrack/*, ICameraVideoTrack*/]> {
    //通过麦克风采集的音频创建本地音频轨道对象
    const microphoneTrack= await AgoraRTC.createMicrophoneAudioTrack(audioConfig);
    setLocalAudioTrack(microphoneTrack);
    // setLocalVideoTrack(cameraTrack);
    return [microphoneTrack/*, cameraTrack*/];
  }

  async function join(appid: string, channel: string, token?: string, uid?: string | number | null) {
    if (!client) return;
    const [microphoneTrack/*, cameraTrack*/] = await createLocalTracks();

    await client.join(appid, channel, token || null);
    // 将这些音频轨道对象发布到频道中
    await client.publish([microphoneTrack/*, cameraTrack*/]).then(
        (res) => {
          console.log('publish ok')
        }
       ).catch(
         (e) => {
         console.log('publish err=',e)
        }
       );

    (window as any).client = client;
    // (window as any).videoTrack = cameraTrack;

    setJoinState(true);
  }

  async function leave() {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    setRemoteUsers([]);
    setJoinState(false);
    await client?.leave();
  }

  useEffect(() => {
    if (!client) return;
    console.log('useAgora.tsx useEffect')
    setRemoteUsers(client.remoteUsers);

    /**
     * 当有远端用户发布时开始订阅，并在订阅后自动播放远端音频轨道对象。
     * @param user
     * @param mediaType
     */
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      // 开始订阅远端用户。
      await client.subscribe(user, mediaType);
      // 表示本次订阅的是音频。
      if (mediaType === "audio") {
        user.audioTrack?.play()
        // 订阅完成后，从 `user` 中获取远端音频轨道对象。
        // const remoteAudioTrack = user.audioTrack;
        // 播放音频因为不会有画面，不需要提供 DOM 元素的信息。
        // remoteAudioTrack.play();
        console.log('useAgora.tsx ',user.uid,' 号用户的音频被订阅且开始播放')
      }
      // toggle rerender while state of remoteUsers changed.
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    /**
     * 当远端用户发布音频轨道时，SDK 会触发 client.on("user-published") 事件。我们需要通过 client.on 监听该事件并在回调中订阅新加入的远端用户。
     * 在创建客户端对象之后立即监听事件
     */
    client.on('user-published', handleUserPublished);
    /**
     * 当远端用户取消发布或离开频道时，SDK 会触发 client.on("user-unpublished") 事件
     */
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, [client]);

  return {
    localAudioTrack,
    localVideoTrack,
    joinState,
    leave,
    join,
    remoteUsers,
  };
}
