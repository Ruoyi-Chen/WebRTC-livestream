import React, {useState, useEffect, useRef} from 'react';
import {Layout, Menu} from "antd";
import HeaderComponent from "../Home/HeaderComponent";
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
const { Header, Content } = Layout;
const { SubMenu } = Menu;
import type { UploadChangeParam } from 'antd/es/upload';
import './InfoManage.less'
import {
    Button,
    Form,
    Input,
    InputNumber,
    Radio,
    Select,
    Switch,
    TreeSelect,
    Upload,
    message,
    Avatar,
} from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { UserOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import {UserInfoManage, InfoUpdate} from "../../api";

const InfoManage = () => {
    const [userName, setUserName] = useState<string>();
    const [introduction, setIntroduction] = useState<string>();
    const [phone, setPhone] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [avatarUrl, setAvatarUrl] = useState<string>();

    const [userInfo, setUserInfo] = useState({userName: "", avatar: "", introduction: "", phone: "", email: ""});

    const userInfoRef = useRef({
        userName: '',
        avatar: '',
        introduction: '',
        phone: '',
        email: ''
    });
    const [, setRender] = useState({});

    const [loading, setLoading] = useState(false);

    const updateUserInfo = (key: string, value: string) => {
        userInfoRef.current = { ...userInfoRef.current, [key]: value };
        if (key == 'avatar') {
            setAvatarUrl(value);
        }
        if (key == 'userName') {
            setUserName(value);
        }
        if (key == 'introduction') {
            setIntroduction(value);
        }
        if (key =='phone') {
            setPhone(value);
        }
        if (key == 'email') {
            setEmail(value)
        }
        setRender({}); // 触发组件重新渲染
    };

    useEffect(() => {
        UserInfoManage();


        const userName = window.localStorage.getItem("userName");
        if (userName) {
            // setUserInfo(prevData => ({...prevData, userName: userName}));
            updateUserInfo('userName', userName);
        }
        const avatar = window.localStorage.getItem("avatar");
        if (avatar) {
            // setUserInfo(prevData => ({...prevData, avatar: avatar}));
            updateUserInfo('avatar', avatar);
        }
        const introduction = window.localStorage.getItem("introduction");
        if (introduction) {
            // setUserInfo(prevData => ({...prevData, introduction: introduction}));
            updateUserInfo('introduction', introduction);updateUserInfo('introduction', introduction);
        }
        const phone = window.localStorage.getItem("phone");
        if (phone) {
            // setUserInfo(prevData => ({...prevData, phone: phone}));
            updateUserInfo('phone', phone);
        }
        const email = window.localStorage.getItem("email");
        if (email) {
            // setUserInfo(prevData => ({...prevData, email: email}));
            updateUserInfo('email', email);
        }
        // const userInfo = window.localStorage.getItem("userInfo");
        // if (userInfo) {
        //     console.log(JSON.parse(userInfo));
        //     setUserInfo(JSON.parse(userInfo));
        // }
    }, [avatarUrl]);

    const beforeUpload = async (file: RcFile) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
        } else if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
        } else {
            console.log('InfoUpdateStart')
            await InfoUpdate("", "", "", "", file);
            console.log('UserInfoManageStart')
            await UserInfoManage();
            const avatar = window.localStorage.getItem("avatar");
            if (avatar) {
                // setUserInfo(prevData => ({...prevData, avatar: avatar}));
                updateUserInfo('avatar', avatar);
                // setAvatarUrl(avatar);
            }
            setRender({});
        // window.location.reload();
        }
    };

    // const handleChange = (info) => {
    //     if (info.file.status === 'done') {
    //         message.success(`${info.file.name} file uploaded successfully.`);
    //         setAvatarUrl(URL.createObjectURL(info.file.originFileObj));
    //     } else if (info.file.status === 'error') {
    //         message.error(`${info.file.name} file upload failed.`);
    //     }
    // };

    // const handleChange = (info: UploadChangeParam) => {
    //     console.log('handleChange')
    //     InfoUpdate("", "", "", "", file);
    //     UserInfoManage();
    //     const avatar = window.localStorage.getItem("avatar");
    //     if (avatar) {
    //         // setUserInfo(prevData => ({...prevData, avatar: avatar}));
    //         updateUserInfo('avatar', avatar);
    //     }
    // }

    const handleChange = (info: UploadChangeParam) => {
        UserInfoManage();
        if (info.file.status === 'done') {
            message.success(`${info.file.name} file uploaded successfully.`);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
        }
    };

    // type FormValues = {
    //     userName: any,
    //     phone: any,
    //     email: any,
    //     introduction: any
    // };

    const handlesubmit = async (values: any) => {
        console.log('form updating', values)
        await InfoUpdate(values.userName, values.phone, values.email, values.introduction, null);
        await UserInfoManage();

        const userName = window.localStorage.getItem("userName");
        if (userName) {
            // setUserInfo(prevData => ({...prevData, userName: userName}));
            updateUserInfo('userName', userName);
        }
        const avatar = window.localStorage.getItem("avatar");
        if (avatar) {
            // setUserInfo(prevData => ({...prevData, avatar: avatar}));
            updateUserInfo('avatar', avatar);
        }
        const introduction = window.localStorage.getItem("introduction");
        if (introduction) {
            // setUserInfo(prevData => ({...prevData, introduction: introduction}));
            updateUserInfo('introduction', introduction);
        }
        const phone = window.localStorage.getItem("phone");
        if (phone) {
            // setUserInfo(prevData => ({...prevData, phone: phone}));
            updateUserInfo('phone', phone);
        }
        const email = window.localStorage.getItem("email");
        if (email) {
            // setUserInfo(prevData => ({...prevData, email: email}));
            updateUserInfo('email', email);
        }
        window.location.reload();
        // setRender({});
    };

    return (
        <Layout>
        <HeaderComponent/>
        <Content>
            <div className="container">
                <div className="container-avatar">
                <Upload
                    name="avatar"
                    listType="picture-circle"
                    className="avatar-uploader"
                    showUploadList={false}
                    // action={handleChange}
                    beforeUpload={beforeUpload}
                    // onChange={handleChange}
                    // customRequest={customRequest}
                >
                    {avatarUrl ? (
                        <Avatar src={avatarUrl} className="info-image" size={100} />
                    ) : (
                        <Avatar icon={<UserOutlined />} size={64} />
                    )}
                </Upload>
                </div>
                {/*<div>*/}
                <Form
                    // labelCol={{ span: 4 }}
                    // wrapperCol={{ span: 14 }}
                    layout="vertical"
                    style={{ maxWidth: 2000 }}
                    className="info-form"
                    initialValues={userInfoRef.current}
                    onFinish={handlesubmit}
                    // onFinish={handleCustomSubmit}
                >
                    <Form.Item label="User Name" name="userName">
                        <Input placeholder={userName}></Input>
                    </Form.Item>
                    <Form.Item label="Phone" name="phone">
                        <Input placeholder={phone}></Input>
                    </Form.Item>
                    <Form.Item label="Email" name="email">
                        <Input placeholder={email}></Input>
                    </Form.Item>
                    <Form.Item label="Introduction" name="introduction">
                        <TextArea rows={4} placeholder={introduction}></TextArea>
                    </Form.Item>
                    <Form.Item  className="form-button">
                        <Button type="primary" htmlType="submit">Edit Profile</Button>
                    </Form.Item>
                </Form>
                {/*</div>*/}
            </div>
        </Content>
        </Layout>
    );
};

export default InfoManage;