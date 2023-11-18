import React from "react";
import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";
import { ProfileOutlined, TeamOutlined, UserOutlined, VideoCameraOutlined, HomeOutlined } from "@ant-design/icons";
const { SubMenu } = Menu;
const { Header } = Layout;

const HeaderComponent = () => {
    const url = window.localStorage.getItem("avatar") || undefined;
    return (
        <>
        <Header>
            <Menu theme="dark" mode="horizontal" style={{ display: 'block' }}>
                <Menu.Item key="home" icon={<HomeOutlined />} title="Home" style={{ float: 'left' }}>
                    <Link to="/homepage">Home</Link>
                </Menu.Item>
                <SubMenu key="live-room" icon={<VideoCameraOutlined />} title="Live Room" style={{ float: 'left' }}>
                    <Menu.Item key="start">
                        <Link to="/pub">Start My Live</Link>
                    </Menu.Item>
                    <Menu.Item key="watch">
                        <Link to="/live">Watch Lives</Link>
                    </Menu.Item>
                </SubMenu>
                <Menu.Item key="single" icon={<UserOutlined />} style={{ float: 'left' }}>
                    <Link to="/single">Single Room</Link>
                </Menu.Item>
                <Menu.Item key="meeting" icon={<TeamOutlined />} style={{ float: 'left' }}>
                    <Link to="/meeting">Multi Room</Link>
                </Menu.Item>
                <SubMenu key="profile" style={{ float: 'right' }}
                    title={
                        <div style={{ width: '64px', height: '64px' }}>
                        <img src={ url } alt="Avatar" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                        </div>
                    }>
                    <Menu.Item key="user-center">
                        <Link to="/dashboard">Dashboard</Link>
                    </Menu.Item>
                    <Menu.Item key="user-manage">
                        <Link to="/manage">Edit Profile</Link>
                    </Menu.Item>
                </SubMenu>
            </Menu>
        </Header>
        </>
    );
}

export default HeaderComponent;