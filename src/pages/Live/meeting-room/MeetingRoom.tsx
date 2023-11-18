import React, {useState, useEffect, useRef} from "react";
import {io, Socket} from "socket.io-client";
import {Row, Col, Modal, Form, Input, Select, Tag, Button, Layout, message} from 'antd';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MediaHelper from "../../../utils/srs/MediaHelper";
import SrsHelper from "../../../utils/srs/SrsHelper";
import axios from "axios";
import {
    AudioMutedOutlined,
    AudioOutlined,
    VideoCameraAddOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import HeaderComponent from "../../Home/HeaderComponent";
import {Content} from "antd/es/layout/layout";
import "./MeetingRoom.less"
import {useNavigate} from "react-router-dom";

const {Option} = Select;

const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const host = window.location.host;
const server = protocol + host;
const serverSocketUrl = process.env.NODE_ENV === 'development' ? 'ws://127.0.0.1:18080' : server;
const SERVER_ADDR = "192.168.1.101";
const srsServerAPIURL = 'http://' + SERVER_ADDR + ':1985/';
const srsServerFlvURL = 'http://' + SERVER_ADDR + ':8085/live/';
const RECONNECTION_DELAY_MAX = 100000;

interface Device {
    id: string;
    kind: MediaDeviceKind;
    label: string;
}

interface LocalDevice {
    audioIn: Device[];
    videoIn: Device[];
    audioOut: Device[];
}


const MeetingRoom: React.FC = () => {
    const [localDevice, setLocalDevice] = useState<LocalDevice>({
        audioIn: [],
        videoIn: [],
        audioOut: [],
    });
    const [centerDialogVisible, setCenterDialogVisible] = useState(true);
    const formInline = useRef({
        userId: '',
        roomId: '',
        nickname: '',
        videoId: '',
        audioInId: '',
        rao: '',
        type: 'meeting'
    });
    const [linkSocket, setLinkSocket] = useState<Socket>();
    const [roomUserList, setRoomUserList] = useState<any[]>([]);
    const [others, setOthers] = useState<any[]>([]);
    const [RTCPushPeer, setRTCPushPeer] = useState<any>();
    const [RTCPullPeerMap, setRTCPullPeerMap] = useState<Map<string, any>>(new Map());
    const [rules] = useState({
        roomId: [{required: true, message: 'Please enter the room ID', trigger: 'change'}],
        nickname: [{required: true, message: 'Please enter your nickname', trigger: 'change'}],
        videoId: [{required: true, message: 'Please select the camera', trigger: 'change'}],
        audioInId: [{required: true, message: 'Please select the microphone', trigger: 'change'}],
        rao: [{required: true, message: 'Please select the resolution', trigger: 'change'}],
        type: [{required: false, message: 'Meeting'}]
    });
    const [raoList] = useState<string[]>(['1920X1080', '1080X720', '720X640', '640X480', '480X320']);
    const localStreamRef = useRef<MediaStream | null>(null);
    const constraints = {video: true, audio: true};
    const [audioStatus, setAudioStatus] = useState(true);
    const [videoStatus, setVideoStatus] = useState(true);


    useEffect(() => {
        initInnerLocalDevice();

    }, []);

    const initInnerLocalDevice = () => {
        // Check if the browser supports media devices
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices()) {
            console.log("Browser does not support media devices.");
            return;
        }

        // Get the media stream
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                // stop all tracks to release the camera / microphone
                stream.getTracks().forEach((track) => {
                    track.stop();
                });

                // Enumerate all media devices
                navigator.mediaDevices.enumerateDevices()
                    .then((devices) => {
                        devices.forEach((device) => {
                            const obj = {
                                id: device.deviceId,
                                kind: device.kind,
                                label: device.label,
                            }
                            if (device.kind === 'audioinput') {
                                // Add audio input devices to the localDevice
                                if (localDevice.audioIn.filter((e) => e.id === device.deviceId).length === 0) {
                                    setLocalDevice((prevState) => ({
                                        ...prevState,
                                        audioIn: [...prevState.audioIn, obj],
                                    }));
                                }
                            } else if (device.kind === 'audiooutput') {
                                // Add audio output devices to the localDevice
                                if (localDevice.audioOut.filter((e) => e.id === device.deviceId).length === 0) {
                                    setLocalDevice((prevState) => ({
                                        ...prevState,
                                        audioOut: [...prevState.audioOut, obj],
                                    }));
                                }
                            } else if (device.kind === 'videoinput') {
                                // Add video input devices to the localDevice
                                if (localDevice.videoIn.filter((e) => e.id === device.deviceId).length === 0) {
                                    setLocalDevice((prevState) => ({
                                        ...prevState,
                                        videoIn: [...prevState.videoIn, obj],
                                    }));
                                }
                            }
                        });
                    })
                    .catch(handleError);
            })
            .catch(handleError);
    }

    const init = () => {
        console.log("init...");
        console.log("server: ", serverSocketUrl);
        const socket = io(serverSocketUrl, {
            reconnectionDelayMax: RECONNECTION_DELAY_MAX,
            transports: ['websocket'],
            query: formInline.current,
        });
        setLinkSocket(socket);

        socket.on('connect', () => {
            console.log('server init connect success', linkSocket);
            // join room succeeded
            setCenterDialogVisible(false);
            // get the room user list
            socket.emit('roomUserList', {roomId: formInline.current.roomId});
            console.log('roomUserList', roomUserList[0]);
        });

        socket.on('roomUserList', (e) => {
            initMeetingRoom();
            roomUserList.push(e);
        });

        socket.on('msg', async (e) => {
            console.log('msg', e);
            if (e['type'] === 'join' || e['type'] === 'leave') {
                const userId = e['data']['userId'];
                const nickname = e['data']['nickname'];
                if (e['type'] === 'join') {
                    message.success(`${nickname} joined the room`);

                    const streamId = userId;

                    let pc = RTCPullPeerMap.get(streamId);
                    if (pc) {
                        pc.close();
                    } else {
                        RTCPullPeerMap.set(streamId, pc);
                    }
                    pc = await getPullSdp(streamId, nickname);
                    RTCPullPeerMap.set(streamId, pc);
                    pc.ontrack = function (e: { track: MediaStreamTrack; }) {
                        setDomVideoTrack(streamId + "-video", e.track, nickname);
                    };
                } else {
                    message.success(`${nickname} left the room`);
                    await MediaHelper.removeChildVideoDom(userId);
                }
            }
        });

        socket.on('error', (e) => {
            console.log('error', e);
        });
    }

    const getPullSdp = async (streamId: any, nickname: string | null) => {
        console.log("Pull stream.. ", streamId);
        const pc = await new RTCPeerConnection(undefined);
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.ontrack = function (e: { track: MediaStreamTrack; }) {
            // 这里DOM ID 就是用户UserID 和 streamID一致
            setDomVideoTrack(streamId + "-video", e.track, nickname);
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const data = {
            api: `${srsServerAPIURL}rtc/v1/play/`,
            streamurl: srsServerFlvURL + streamId,
            sdp: offer.sdp,
        };
        try {
            const res = await axios.post(srsServerAPIURL + 'rtc/v1/play/', data);
            console.log(res.data);
            if (res.data.code === 0) {
                await pc.setRemoteDescription(
                    new RTCSessionDescription({ type: "answer", sdp: res.data.sdp })
                );
            }
        } catch (e) {
            console.error("SRS pull stream fail", e);
        }
        return pc;
    }


    const setDomVideoTrack = async (domId: string, track: MediaStreamTrack, nickname: string | null) => {
        let video = document.getElementById(domId) as HTMLVideoElement;
        if (!video) {
            // 创建新的 video 元素和间隔元素
            const row = document.getElementById("videos-row")!;
            const col = document.createElement("div");
            col.id = domId + "-col";
            col.style.position = "relative";
            col.style.width = "400px";
            col.style.height = "300px";
            col.style.borderRadius = "8px";
            col.style.backgroundColor = "rgba(166,163,163,0.65)";
            col.style.overflow = "hidden";
            col.style.marginBottom = "16px";
            row.appendChild(col);

            const label = document.createElement("label");
            label.style.position = "absolute";
            label.style.left = "5px";
            label.style.bottom = "5px";
            label.style.color = "antiquewhite";
            label.style.fontSize = "18px";
            label.style.zIndex = "999";
            label.textContent = nickname;
            col.appendChild(label);

            video = document.createElement("video");
            video.id = domId;
            video.controls = true;
            video.autoplay = true;
            video.style.width = "100%";
            video.style.height = "100%";
            video.muted = true;
            col.appendChild(video);
        }

        let stream = video.srcObject as MediaStream;
        if (stream) {
            stream.addTrack(track);
        } else {
            stream = new MediaStream();
            stream.addTrack(track);
            video.srcObject = stream;
        }
    };

    const navigate = useNavigate();
    const initMeetingRoom = async () => {
        console.log("init meeting room...")
        if (!localStreamRef.current) {
            const stream = await MediaHelper
                .getLocalUserMedia(
                    formInline.current.audioInId, formInline.current.videoId,
                    formInline.current.rao.split('X')[0] as ConstrainULong, formInline.current.rao.split('X')[1] as ConstrainULong,
                    15, 24, localStreamRef, handleError
                );
            if (stream) {
                localStreamRef.current = stream;
            }
        }

        // local preview
        await MediaHelper.setDomVideoStream("localMediaDom", localStreamRef.current);

        // push stream
        const streamId = formInline.current.userId;
        const rtcPushPeerConnection = await SrsHelper.getPushSdp(streamId, localStreamRef.current);
        setRTCPushPeer(rtcPushPeerConnection);

        // check if there are other users in the room
        const others = roomUserList.filter(e => e.userId !== formInline.current.userId)[0];
        console.log("others", others);
        for (let i = 0; i < others.length; i++) {
            const user = others[i];
            // pull other user's media stream
            const rtcPullPeerConnection = await getPullSdp(user.userId, user.nickname);
            // put into RTCPullPeerMap
            RTCPullPeerMap.set(user.userId, rtcPullPeerConnection);
        }
        navigate(`/meeting?type=${formInline.current.type}&userId=${formInline.current.userId}&roomId=${formInline.current.roomId}&nickname=${formInline.current.nickname}`);
    }


    const handleError = (error: any) => {
        console.error('error', error);
    }


    const handleJoinRoom = (values: any) => {
        console.log("join room")
        setCenterDialogVisible(false);
        formInline.current = values;
        init();
    };


    const audioControl = (status: boolean) => {
        if (RTCPushPeer) {
            setAudioStatus(!audioStatus);
            const senders = RTCPushPeer.getSenders();
            const send = senders.find((s: any) => s.track && s.track.kind === 'audio');
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
        if (RTCPushPeer) {
            setVideoStatus(!videoStatus);
            const senders = RTCPushPeer.getSenders();
            const send = senders.find((s: any) => s.track && s.track.kind === 'video');
            console.log("pc", RTCPushPeer);
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


    return (
        <Layout>
            <HeaderComponent/>
            <Content>
                <div className="container">
                    <Row>
                        <div className="controls-container">
                            <div className="controls">
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
                            </div>
                        </div>
                    </Row>
                    <Row
                        id="videos-row"
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            flexWrap: "wrap",
                            gap: 16,
                        }}
                    >
                        <Col
                            style={{
                                position: "relative",
                                width: 400,
                                height: 300,
                                borderRadius: 8,
                                backgroundColor: "#2344dc",
                                overflow: "hidden",
                            }}
                        >
                            <label
                                style={{
                                    position: "absolute",
                                    left: 5,
                                    bottom: 5,
                                    color: "antiquewhite",
                                    fontSize: 18,
                                    zIndex: 999,
                                }}
                            >
                                {formInline.current.userId} - preview
                            </label>
                            <video
                                id="localMediaDom"
                                style={{ objectFit: "fill", height: "100%", width: "100%" }}
                            ></video>
                        </Col>
                    </Row>
                    <Modal
                        open={centerDialogVisible}
                        onCancel={() => setCenterDialogVisible(false)}
                        footer={null}
                        centered
                        destroyOnClose
                    >
                        <div className="dialog-inner-container">
                            <Form
                                initialValues={{
                                    userId: '',
                                    roomId: '',
                                    nickname: '',
                                    videoId: '',
                                    audioInId: '',
                                    rao: '',
                                    type: 'meeting'
                                }}
                                onFinish={handleJoinRoom}
                                layout="horizontal"
                                labelCol={{span: 8}}
                                wrapperCol={{span: 16}}
                            >
                                <Form.Item label="User ID" name="userId" rules={[{required: true}]}>
                                    <Input placeholder="UserId"/>
                                </Form.Item>
                                <Form.Item label="Room ID" name="roomId" rules={[{required: true, message: 'Please input room id.'}]}>
                                    <Input placeholder="Room ID"/>
                                </Form.Item>
                                <Form.Item label="Nickname" name="nickname" rules={rules.nickname}>
                                    <Input placeholder="Name to display"/>
                                </Form.Item>
                                <Form.Item label="Camera" name="videoId" rules={rules.videoId}>
                                    <Select placeholder="Camera">
                                        {localDevice.videoIn.map((item, index) => (
                                            <Option key={index} value={item.id}>
                                                {item.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Microphone" name="audioInId" rules={rules.audioInId}>
                                    <Select placeholder="Microphone">
                                        {localDevice.audioIn.map((item, index) => (
                                            <Option key={index} value={item.id}>
                                                {item.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Resolution" name="rao" rules={rules.rao}>
                                    <Select placeholder="Resolution">
                                        {raoList.map((item, index) => (
                                            <Option key={index} value={item}>
                                                {item}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Room Type" name="type" rules={rules.type}>
                                    Meeting
                                </Form.Item>
                                <Form.Item wrapperCol={{offset: 8, span: 16}}>
                                    <button className="ant-btn ant-btn-warning" type="submit">
                                        Enter
                                    </button>
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>
                </div>
            </Content>
        </Layout>

    );
};

export default MeetingRoom;