export default class MediaHelper {

    static async getLocalUserMedia(audioId: string | null, videoId: string | null, width: ConstrainULong, height: ConstrainULong, idealFrameRate: any, maxFrameRate: any, localStreamRef: React.MutableRefObject<MediaStream | null>, handleError: (arg0: any) => any) {
        console.log("get local user media....")
        const constraints = {
            audio: {deviceId: audioId ? {exact: audioId} : undefined},
            video: {
                deviceId: videoId ? {exact: videoId} : undefined,
                width: width as ConstrainULong,
                height: height as ConstrainULong,
                frameRate: {ideal: idealFrameRate, max: maxFrameRate},
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
    }

    static async setDomVideoStream(domId: string, newStream: MediaStream | null) {
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

    static async removeChildVideoDom(domId: string) {
        const video = document.getElementById(domId);
        if (!video) {
            throw new Error(`Cannot find video element with id "${domId}"`);
        }

        if (video.parentNode) {
            video.parentNode.removeChild(video);
        }
    }

    static setDomVideoTrick(domId: string, track: MediaStreamTrack) {
        const video = document.getElementById(domId) as HTMLVideoElement;
        let stream = video.srcObject as MediaStream;
        if (stream) {
            stream.addTrack(track);
        } else {
            stream = new MediaStream();
            stream.addTrack(track);
            video.srcObject = stream;
            video.controls = true;
            video.autoplay = true;
            video.style.width = "100%";
            video.style.height = "100%";
            video.muted = true;
        }
    }
}