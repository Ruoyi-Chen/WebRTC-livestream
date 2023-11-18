import React, {useState, useRef, useEffect} from 'react';
import {Row, Col, Button, Layout, message} from 'antd';
import './LiveRoomView.less';
import flvjs from "flv.js";
import HeaderComponent from "../../Home/HeaderComponent";
import {Content} from "antd/es/layout/layout";
import {StarOutlined} from "@ant-design/icons";
import {io, Socket} from "socket.io-client";

const SERVER_ADDR = "192.168.1.101";
const srsServerFlvURL = 'http://' + SERVER_ADDR + ':8085/live/';

const LiveRoomView: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [flvPlayer, setFlvPlayer] = useState<flvjs.Player | null>(null);
    const [streamId, setStreamId] = useState('');
    const [likeStar, setLikeStar] = useState(false);
    const [linkSocket, setLinkSocket] = useState<Socket>();
    const userId = window.localStorage.getItem("userId");

    useEffect(() => {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const streamId = urlSearchParams.get("streamId");
        if (!streamId) {
            console.warn("streamId not provided");
            return;
        }
        setStreamId(streamId);

        const flvUrl = `${srsServerFlvURL}${streamId}.flv`;

        const videoElement = videoRef.current;
        if (!videoElement) {
            return;
        }

        if (flvPlayer) {
            flvPlayer.destroy();
            setFlvPlayer(null);
        }

        if (flvjs.isSupported()) {
            const player = flvjs.createPlayer({
                type: "flv",
                isLive: true,
                url: flvUrl,
            });
            player.attachMediaElement(videoElement);
            player.on("error", function (err) {
                console.log(err);
            });
            player.load();
            player.play();

            setFlvPlayer(player);
        }


        // link to socket server
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
            }
        });
        setLinkSocket(socket);
        console.log("socket", socket);

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
    }, [srsServerFlvURL]);

    const play = () => {
        if (flvPlayer) {
            flvPlayer.destroy();
            setFlvPlayer(null);
        }

        const urlSearchParams = new URLSearchParams(window.location.search);
        const streamId = urlSearchParams.get("streamId");
        if (!streamId) {
            console.warn("streamId not provided.");
            return;
        }

        const flvUrl = `${srsServerFlvURL}${streamId}.flv`;

        const videoElement = videoRef.current;
        if (!videoElement) {
            return;
        }

        if (flvjs.isSupported()) {
            const player = flvjs.createPlayer({
                type: "flv",
                isLive: true,
                url: flvUrl,
            });
            player.attachMediaElement(videoElement);
            player.on("error", function (err) {
                console.log(err);
            });
            player.load();
            player.play();

            setFlvPlayer(player);
        }
    };

    const handleStarClick = () => {
        if (likeStar) {
            message.warning('You have already sent a star to the broadcaster!');
        } else {
            setLikeStar(true);
            message.success('You have sent a star to the broadcaster!');

            // send the star to the broadcaster
            console.log("sending star to the broadcaster..");
            if (linkSocket) {
                // TODO streamId should be the publisher's id
                linkSocket.emit('incrLikeStar', { userId: streamId, starType: 'like', incr: '1' });
            }
        }
    };

    return (
        <Layout>
            <HeaderComponent/>
            <Content>
                <div className="live-room-container">
                    <h2 className="live-title">Stream ID: {streamId}</h2>
                    <Row justify="center">
                        <Col xs={24} sm={24} md={16} lg={16} xl={16} className="mb-2">
                            <video
                                id="videoElement"
                                className="video-player"
                                controls
                                width="100%"
                                height="auto"
                                ref={videoRef}
                            ></video>
                        </Col>
                        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                            <Row justify="end" align="middle">
                                <Col>
                                    <Button className="play-button" onClick={play}>
                                        Refresh
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        className="star-button"
                                        type="primary"
                                        icon={<StarOutlined />}
                                        onClick={handleStarClick}>
                                        Give Star Coin
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </div>

            </Content>
        </Layout>

    );
};

export default LiveRoomView;
