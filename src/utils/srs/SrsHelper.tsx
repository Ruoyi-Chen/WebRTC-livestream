import axios from "axios";

// ENV ARGS
const SERVER_ADDR = "192.168.1.101";
const srsServerAPIURL = 'http://' + SERVER_ADDR + ':1985/';
const srsServerRTCURL = 'webrtc://' + SERVER_ADDR + ':8085/live/';
const srsServerFlvURL = 'http://' + SERVER_ADDR + ':8085/live/';

export default class SrsHelper {

    static async getPushSdp(streamId: string, stream: MediaStream | null) {
        console.log(`push stream..`, streamId)
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
            } else {
                // error occur
                console.error('Fail to push SRS stream. ');
            }
        } catch (e) {
            console.error('Fail to push SRS stream. ', e);
        }
        return pc;
    }

    static async getPullSdp(streamId: any) {
        console.log("Pull stream.. ", streamId);
        const pc = await new RTCPeerConnection(undefined);
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
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

}