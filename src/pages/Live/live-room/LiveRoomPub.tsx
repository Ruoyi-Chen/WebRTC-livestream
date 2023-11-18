import React, {useState, useEffect, useRef} from "react";
import {Row, Col, Button, Tag, Input, UploadFile, message, Modal, Rate} from "antd";
import axios from "axios"
import {io, Socket} from "socket.io-client"; // connect to redis server
import DefaultEventsMap from "socket.io-client";
import "./LiveRoomPub.less";
import {
    PlayCircleOutlined,
    AudioOutlined,
    AudioMutedOutlined,
    VideoCameraAddOutlined,
    VideoCameraOutlined,
    ShareAltOutlined,
    CloseCircleOutlined,
    UploadOutlined
} from '@ant-design/icons';
import {v4 as uuidv4} from "uuid";
import {updateStar} from "../../../api";
import {Layout} from "antd";
import HeaderComponent from "../../Home/HeaderComponent";
import Upload from "antd/es/upload/Upload";
import {UploadChangeParam} from "antd/es/upload";
import {useNavigate} from "react-router-dom";

const {Content} = Layout;

const SERVER_ADDR = "192.168.1.101";
const srsServerAPIURL = 'http://' + SERVER_ADDR + ':1985/';
const srsServerRTCURL = 'webrtc://' + SERVER_ADDR + ':8085/live/';
const srsServerFlvURL = 'http://' + SERVER_ADDR + ':8085/live/';

interface UserInfo {
    userId: string,
    roomId: string,
    nickname: string
}

interface StreamingInfo {
    hostId: string | null,
    title: string,
    coverImage: File | null,
    coverImageUrl: string | null,
    tags: string[],
}


const handleError = (error: { message: any; name: any; }) => {
    console.error('Error: ', error.message, error.name);
}

// define params from URL
const getParams = (queryName: string) => {
    const url = window.location.href;
    const query = decodeURI(url.split('?')[1]);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split("=");
        if (pair[0] === queryName) {
            return pair[1];
        }
    }
    return null;
}

/**
 * TODO：从sa-token获取userId，获取用户名作为nickname，随机生成roomId，将这些信息作为RequestBody或者拼接在url里，转入/pub页面时自动拼接，如：http://localhost:3000/pub?userId=10001&roomId=11&nickname=cherry
 */
const LiveRoomPub: React.FC = () => {
    const navigate = useNavigate();
    // const userId = getParams('userId');
    const userId = window.localStorage.getItem("userId");
    const roomId = getParams('roomId');
    const nickname = window.localStorage.getItem("userName");

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [streamId, setStreamId] = useState<string>('');
    const [scanUrlFlv, setScanUrlFlv] = useState<string>("");
    const [scanUrlHls, setScanUrlHls] = useState<string>("");
    const [audioStatus, setAudioStatus] = useState(true);
    const [videoStatus, setVideoStatus] = useState(true);
    const [shareStatus, setShareStatus] = useState(false);
    const [shareStream, setShareStream] = useState<MediaStream | null>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

    // about rating
    const [isEvaModalOpen, setIsEvaModalOpen] = useState(false);
    const startTime = useRef(0);

    // Initialization
    // const [userInfo, roomUserList, linkSocket] = useInit(userId, roomId, nickname);
    // const socket = linkSocket as Socket;

    const [streamingInfo, setStreamingInfo] = useState<StreamingInfo>({
        hostId: userId,
        title: "",
        coverImage: null,
        coverImageUrl: null,
        tags: [],
    });
    const [showDialog, setShowDialog] = useState(true);

    const videoElementRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const [userInfo, setUserInfo] = useState({});
    const [socket, setSocket] = useState<Socket>();
    useEffect(() => {

        // set user info
        setUserInfo({
            userId: userId,
            roomId: roomId,
            nickname: nickname,
        });

        // link to socket server with current userId & roomId
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const host = window.location.host;
        const server = protocol + host;
        const serverSocketUrl = process.env.NODE_ENV === 'development' ? 'ws://127.0.0.1:18080' : server;

        const socket = io(serverSocketUrl, {
            reconnectionDelayMax: 100000,
            transports: ['websocket'],
            query: {
                userId: userId,
                roomId: streamId,
                nickname: nickname,
                pub: "pub",
                type: "live"
            }
        });
        setSocket(socket);

        // listen on [connect success] event
        socket.on('connect', () => {
            console.log('Server init connect success!', socket);
        });

        // listen on [message] event
        socket.on('msg', async (e) => {
            console.log('msg', e);
        });

        // listen on [error] event
        socket.on('error', (e) => {
            console.log('error', e);
        });

        // close the socket when destroyed the component
        return () => {
            socket.disconnect();
        };
    }, [userId, roomId, nickname]);


    const play = async () => {
        console.log("play....")
        // let streamId = uuidv4();
        // if (userId && roomId) {
        //     // set streamId
        //     streamId = userId + roomId + Date.now();
        // }
        // setStreamId(streamId);

        // if localStream == null, get local media resource and set into LocalStream
        if (!localStreamRef.current) {
            const stream = await getLocalUserMedia(null, null);
            setLocalStream(stream || null);
        }

        console.log("video status", videoStatus);
        await setDomVideoStream('videoElement', localStreamRef.current);
        await getPushSdp(streamId, localStreamRef.current);
    };

    const getLocalUserMedia = async (audioId: null | string, videoId: null | string) => {
        console.log("get local user media....")
        const constraints = {
            audio: {deviceId: audioId ? {exact: audioId} : undefined},
            video: {
                deviceId: videoId ? {exact: videoId} : undefined,
                width: 1920,
                height: 1080,
                frameRate: {ideal: 15, max: 24},
            },
        };
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(e => handleError(e));
            if (stream) {
                localStreamRef.current = stream; // store the stream in localStreamRef
            }
            return stream;
        }
        return null;
    };

    const setDomVideoStream = async (domId: string, newStream: MediaStream | null) => {
        // get video by domId
        const video = document.getElementById(domId) as HTMLVideoElement;

        if (!video) {
            throw new Error(`Cannot find video element with id "${domId}"`);
        }

        // get video stream
        const stream = video.srcObject as MediaStream;

        // if the video already has a stream, stop all the media track
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }

        // assign newStream as video stream
        video.srcObject = newStream;

        // default muted and autoplay
        video.muted = true;
        video.autoplay = true;
    }

    const getPushSdp = async (streamId: string, stream: MediaStream | null) => {
        // create a new PeerConnection
        const pc = await new RTCPeerConnection(undefined);

        // add Transceiver of audio & video, set direction to be 'sendonly'
        pc.addTransceiver('audio', {direction: 'sendonly'});
        pc.addTransceiver('video', {direction: 'sendonly'});

        // add tracks in the stream to PeerConnection
        if (stream) {
            stream.getTracks().forEach((track: MediaStreamTrack) => {
                pc.addTrack(track, stream);
            });
        }

        // create an offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // send the offer and get response
        const data = {
            api: srsServerAPIURL + 'rtc/v1/publish/',
            streamurl: srsServerRTCURL + streamId,
            sdp: offer.sdp,
        };
        try {
            const res = await axios.post(srsServerAPIURL + 'rtc/v1/publish/', data);
            const {code, sdp} = res.data;
            console.log(res.data);
            if (code === 0) {
                // set remote SDP as response SDP of server
                await pc.setRemoteDescription(new RTCSessionDescription({type: 'answer', sdp}));
                // generate FLV & HLS address
                console.log("streamId", streamId);
                const flv = srsServerFlvURL + streamId + '.flv';
                const m3u8 = srsServerFlvURL + streamId + '.m3u8';
                setScanUrlFlv(flv);
                setScanUrlHls(m3u8);

                // start WebRTC pull stream preview
                // preLive();
            } else {
                // error occur
                console.error('Fail to push SRS stream. ');
            }
        } catch (e) {
            console.error('Fail to push SRS stream. ', e);
        }
        setPc(pc);
    }

    const audioControl = (status: boolean) => {
        if (pc) {
            setAudioStatus(!audioStatus);
            const senders = pc.getSenders();
            const send = senders.find((s) => s.track && s.track.kind === 'audio');
            if (send && send.track) {
                send.track.enabled = status;
            } else {
                console.log("No audio track found!");
            }
        } else {
            console.log("Publish Stream First!");
        }
    };

    const videoControl = (status: boolean) => {
        console.log("video conrtol...")
        if (pc) {
            setVideoStatus(!videoStatus);
            const senders = pc.getSenders();
            const send = senders.find((s) => s.track && s.track.kind === 'video');
            console.log("pc", pc);
            console.log("senders", senders)
            console.log("send", send);
            if (send && send.track) {
                send.track.enabled = status;
            } else {
                console.log("No video track found!");
            }
        } else {
            console.log("Publish Stream First!");
        }
    };

    const getShareMedia = async () => {
        const constraints = {
            video: {width: 1920, height: 1080},
            audio: false,
        };
        try {
            return await navigator.mediaDevices.getDisplayMedia(constraints);
        } catch (e) {
            console.error(e);
        }
    }

    const changeVideo = async () => {
        if (!pc) {
            console.log('Publish stream first!');
            return;
        }

        // get share stream
        const shareStream = await getShareMedia();
        if (!shareStream) {
            console.log("Share stream not available!");
            return;
        }

        // replace share stream with pc video tracks
        const [videoTrack] = shareStream.getVideoTracks();
        const senders = pc.getSenders();
        const send = senders.find((s) => s && s.track && s.track.kind === 'video');
        if (send) {
            send.replaceTrack(videoTrack);
        }

        // update state
        setShareStream(shareStream || null);
        setShareStatus(true);
    };

    const stopShare = async () => {
        if (shareStream) {
            // stop all tracks in the share stream
            shareStream.getTracks().forEach((track) => track.stop());
            setShareStream(null);
            setShareStatus(false);

            // replace pc video tracks with local stream's video tracks
            const [videoTrack] = localStream?.getVideoTracks() ?? [];
            const senders = pc?.getSenders();
            if (senders) {
                const send = senders.find((s) => s.track?.kind === 'video');
                if (send) {
                    await send.replaceTrack(videoTrack);
                }
            }
        }
    };

    // Room Info Setter
    const handleDialogOk = () => {
        if (streamingInfo.title && streamingInfo.coverImage && streamingInfo.tags.length > 0) {
            setShowDialog(false);
            console.log("commit streamingInfo to redis server...");

            let streamId = uuidv4();
            if (userId) {
                // set streamId
                startTime.current = Date.now();
                streamId = userId + Date.now();
            }
            setStreamId(streamId);

            // <streamId, streamingInfo>
            if (socket) {
                console.log("streamId", streamId);
                console.log("streamingInfo", streamingInfo);
                socket.emit('setStreamInfo', {
                    streamId: streamId,
                    streamingInfo: Object.assign({}, streamingInfo, {coverImage: null})
                });
            }

            navigate(`/pub?type=live&userId=${userId}&roomId=${streamId}&nickname=${nickname}&pub=pub`);
        } else {
            message.error("Please input complete room info!");
        }
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStreamingInfo((prev) => ({...prev, title: event.target.value}));
    };

    const handleCoverImageChange = (
        info: UploadChangeParam<UploadFile<any>>
    ) => {
        const file = info.file.originFileObj as File;
        // TODO：这里封面应该上传至OSS服务器，拿到云存储的url，否则后面没办法正常显示
        const url = URL.createObjectURL(file);
        setStreamingInfo((prev) => ({
            ...prev,
            coverImage: file,
            coverImageUrl: url,
        }));
    };

    const handleTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const tags = event.target.value.split(",").map((tag) => tag.trim());
        setStreamingInfo((prev) => ({
            ...prev,
            tags: tags,
        }));
    };

    const handleRatingSubmit = async (value: number) => {
        setIsEvaModalOpen(false);
        console.log("eva star", value);
        const endTime = Date.now();
        const duration = Math.floor((endTime-startTime.current)/(1000*60));
        await updateStar(roomId, null, value, duration);
        navigate(`/homepage`)
    }

    const maxInputLength = Math.floor(window.innerWidth / 3);
    return (
        <>
            <Layout>
                <HeaderComponent/>
                {showDialog && (
                    <div className="dialog-container"
                         style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                        <div className="dialog-input-container">
                            <Input
                                placeholder="Title"
                                value={streamingInfo.title}
                                onChange={handleTitleChange}
                                className="dialog-input"
                                style={{width: maxInputLength}}
                            />
                        </div>
                        <br/>
                        <div className="dialog-upload-container">
                            <Upload
                                onChange={handleCoverImageChange}
                                accept="image/*"
                                showUploadList={false}
                                className="dialog-upload"
                            >
                                <Button icon={<UploadOutlined/>}>Upload Cover</Button>
                            </Upload>
                            {streamingInfo.coverImageUrl && (
                                <div className="dialog-image-preview-container">
                                    <div className="dialog-image-preview-box">
                                        <img
                                            src={streamingInfo.coverImageUrl}
                                            alt="cover preview"
                                            className="dialog-image-preview"
                                            width={maxInputLength}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <br/>
                        <div className="dialog-input-container">
                            <Input
                                placeholder="Tags"
                                value={streamingInfo.tags.join(",")}
                                onChange={handleTagChange}
                                className="dialog-input"
                                style={{width: maxInputLength}}
                            />
                        </div>
                        <br/>
                        <Button onClick={handleDialogOk} className="dialog-button">
                            OK
                        </Button>
                    </div>
                )}

                {
                    !showDialog && (
                        <Content>
                            <div className="container">
                                <Row>
                                    <Col span={24}>
                                        <div className="video-container">
                                            <h1 className="title">Live Stream</h1>
                                            <div className="video-wrapper">
                                                <video
                                                    ref={videoElementRef}
                                                    id="videoElement"
                                                    className="video-element"
                                                    controls
                                                ></video>
                                                <div className="overlay"></div>
                                            </div>
                                            <div className="controls-container">
                                                <Tag className="stream-id">{`Stream ID: ${streamId}`}</Tag>
                                                {scanUrlFlv && (
                                                    <Tag
                                                        className="flv-url">{`FLV URL: ${srsServerFlvURL}${streamId}.flv`}</Tag>
                                                )}
                                                {scanUrlHls && (
                                                    <Tag
                                                        className="hls-url">{`HLS URL: ${srsServerFlvURL}${streamId}.m3u8`}</Tag>
                                                )}
                                                <div className="controls">
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        onClick={play}
                                                        icon={<PlayCircleOutlined/>}
                                                    >
                                                        Start Streaming
                                                    </Button>
                                                    {!audioStatus && (
                                                        <Button
                                                            type="primary"
                                                            danger
                                                            size="large"
                                                            onClick={() => audioControl(true)}
                                                            icon={<AudioOutlined/>}
                                                        >
                                                            Turn On Mic
                                                        </Button>
                                                    )}
                                                    {audioStatus && (
                                                        <Button
                                                            type="primary"
                                                            size="large"
                                                            onClick={() => audioControl(false)}
                                                            icon={<AudioMutedOutlined/>}
                                                        >
                                                            Turn Off Mic
                                                        </Button>
                                                    )}
                                                    {!videoStatus && (
                                                        <Button
                                                            type="primary"
                                                            danger
                                                            size="large"
                                                            onClick={() => videoControl(true)}
                                                            icon={<VideoCameraAddOutlined/>}
                                                        >
                                                            Turn On Camera
                                                        </Button>
                                                    )}
                                                    {videoStatus && (
                                                        <Button
                                                            type="primary"
                                                            size="large"
                                                            onClick={() => videoControl(false)}
                                                            icon={<VideoCameraOutlined/>}
                                                        >
                                                            Turn Off Camera
                                                        </Button>
                                                    )}
                                                    {!shareStatus && (
                                                        <Button
                                                            type="primary"
                                                            size="large"
                                                            onClick={changeVideo}
                                                            icon={<ShareAltOutlined/>}
                                                        >
                                                            Share Screen
                                                        </Button>
                                                    )}
                                                    {shareStatus && (
                                                        <Button
                                                            type="primary"
                                                            danger
                                                            size="large"
                                                            onClick={stopShare}
                                                            icon={<CloseCircleOutlined/>}
                                                        >
                                                            Stop Sharing
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <Button type="primary" onClick={() => setIsEvaModalOpen(true)}>
                                                    Self Evaluation
                                                </Button>
                                            </div>
                                            <div>
                                                <Modal
                                                    title="Self Evaluation"
                                                    open={isEvaModalOpen}
                                                    onCancel={() => {
                                                        setIsEvaModalOpen(false);
                                                        navigate(`/pub?type=live&userId=${userId}&roomId=${streamId}&nickname=${nickname}&pub=pub`)
                                                    }}
                                                    footer={null}
                                                >
                                                    <Rate onChange={handleRatingSubmit}/>
                                                </Modal>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </Content>
                    )
                }
            </Layout>
        </>
    )
        ;

};

export default LiveRoomPub;
