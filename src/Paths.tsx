import React from "react";
import {Navigate, Routes, Route} from "react-router-dom";
import {Login} from "./pages/Auth/login/login";
import {Register} from "./pages/Auth/register/register";
import Homepage from "./pages/Home/HomePage";
import LiveRoomPub from "./pages/Live/live-room/LiveRoomPub";
import LiveRoomView from "./pages/Live/live-room/LiveRoomView";
import MeetingRoom from "./pages/Live/meeting-room/MeetingRoom";
import InfoManage from "./pages/User/InfoManage";
import ProfilePage from "./pages/User/ProfilePage";

export const Paths: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login"/>}/>
            <Route path="/login" element={<Login/>}></Route>
            <Route path="/register" element={<Register/>}></Route>

            {/* Home Pages */}
            <Route path="/homepage" element={<Homepage/>}></Route>

            {/*Live*/}
            <Route path="/pub" element={<LiveRoomPub/>}></Route>
            <Route path="/live" element={<LiveRoomView/>}></Route>

            {/*Meeting Room*/}
            <Route path="/meeting" element={<MeetingRoom />}></Route>
            <Route path="/single" element={<MeetingRoom />} />

            {/*Profile*/}
            <Route path="/dashboard" element={<ProfilePage />}></Route>
            <Route path="/manage" element={<InfoManage />}></Route>
        </Routes>
    );
};
