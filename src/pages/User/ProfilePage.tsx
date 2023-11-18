import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout, Menu, Table, Space, Button, Form, Modal, Input, DatePicker, Select } from 'antd';
import './ProfilePage.less';
import HeaderComponent from "../Home/HeaderComponent";
const { Content } = Layout;
import { getStudyPlan, updateStudyPlan, deleteStudyPlan, createStudyPlan, createStudyTrack, getStudyTrack } from "../../api";
import moment from "moment";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const ProfilePage: React.FC = () => {
    const [studyPlans, setStudyPlans] = useState([]);
    const [studyTracks, setStudyTracks] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState({planId: '', planType: '', planGoal: '', status: '', planDesc: '', deadline: ''});

    useEffect(() => {
        getStudyPlan()
            .then((data: any) => setStudyPlans(data))
            .catch((error: any) => alert(error.message));
        getStudyTrack()
            .then((data: any) => setStudyTracks(data))
            .catch((error: any) => alert(error.message));
    }, []);

    type StudyTrack = {
        startTime: string;
        duration: number;
    }
      
    type HeatmapData = {
        date: Date;
        count: number;
    }
      
    const getHeatmapData = (): HeatmapData[] => {
        const data: HeatmapData[] = [];
        studyTracks.forEach((track: StudyTrack) => {
            const date = new Date(track.startTime);
            const count = track.duration;
            data.push({ date, count });
        });
        return data;
      };

    const showCreateModal = () => {
        setIsCreateModalOpen(true);
    }

    const handleCreateFormSubmit = async (record: any) => {
        console.log('create study plan', record);
        await createStudyPlan(record);
        setIsCreateModalOpen(false);
        console.log("Created new study plan");
        window.location.reload();
    }

    const showUpdateModal = (record: any) => {
        setSelectedRecord(record);
        setIsUpdateModalOpen(true);
    };

    const handleUpdateFormSubmit = async (updatedRecord: any) => {
        await updateStudyPlan(updatedRecord);
        setIsUpdateModalOpen(false);
        console.log("Updated study plan ID " + selectedRecord.planId);
        window.location.reload();
    };

    const handleTrackFormSubmit = async (record: any) => {
        record.duration = Math.floor((record.endTime - record.startTime) / 60000);
        await createStudyTrack(record);
        setIsTrackModalOpen(false);
        console.log("Created new study track");
        window.location.reload();
    };

    const showTrackModal = () => {
        setIsTrackModalOpen(true);
    }

    const handleTrack = () => {
        showTrackModal();
    }

    const handleCreate = () => {
        showCreateModal();
    }

    const handleUpdate = (record: any) => {
        showUpdateModal(record);
    };
      
    const handleDelete = async (planId: number) => {
        try {
            await deleteStudyPlan(planId);
            console.log("Deleted plan ID " + planId);
            window.location.reload();
        } catch (error) {
            console.log("Failed to delete plan ID " + planId);
            console.log(error);
        }
      };

    const columns = [
        {
            title: 'Plan Id',
            dataIndex: 'planId',
            key: 'planId',
        },
        {
            title: 'Plan Type',
            dataIndex: 'planType',
            key: 'planType',
        },
        {
            title: 'Plan Goal',
            dataIndex: 'planGoal',
            key: 'planGoal',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Plan Description',
            dataIndex: 'planDesc',
            key: 'planDesc',
        },
        {
            title: 'Deadline',
            dataIndex: 'deadline',
            key: 'deadline',
            render: (text: string) => {
                const formattedTime = moment(text).format('YYYY-MM-DD HH:mm:ss');
                return <span>{formattedTime}</span>;
              },
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: { planId: any; }) => (
                <Space size="middle">
                    <Button style={{ width: 70 }} type="primary" size="small" onClick={() => handleUpdate(record)}>Update</Button>
                    <Button style={{ width: 70 }} danger size="small" onClick={() => handleDelete(record.planId)}>Delete</Button>
                </Space>
            ),
        },

      ];
    
      return (
        <div>
            <Layout>
                <HeaderComponent />
                <Content>
                    <h2>My Study Plans</h2>
                    <div className='table-wrapper'>
                        <Table dataSource={studyPlans} columns={columns} rowKey="planId"
                        pagination={{ defaultPageSize: 5 }}
                        />
                    </div>
                    <div className='button-container'>
                        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>Add Study Plan</Button>
                    </div>
                    <Modal
                        title="Update Study Plan"
                        open={isUpdateModalOpen}
                        onCancel={() => {
                            setIsUpdateModalOpen(false);
                            window.location.reload();
                        }}
                        footer={null}
                        >
                        <Form
                            name="updateForm"
                            initialValues={{
                            planId: selectedRecord.planId,
                            planType: selectedRecord.planType,
                            planGoal: selectedRecord.planGoal,
                            status: selectedRecord.status,
                            planDesc: selectedRecord.planDesc,
                            deadline: moment(selectedRecord.deadline),
                            }}
                            onFinish={handleUpdateFormSubmit}
                        >
                            <Form.Item
                                name="planId"
                                hidden
                                >
                            </Form.Item>
                            <Form.Item
                                label="Plan Type"
                                name="planType"
                                rules={[{ required: true, message: 'Please select plan type' }]}
                                >
                                <Select
                                    placeholder="select your study plan type"
                                    // allowClear
                                >
                                    <Select.Option value="0">daily</Select.Option>
                                    <Select.Option value="1">weekly</Select.Option>
                                    <Select.Option value="2">monthly</Select.Option>
                                    <Select.Option value="3">yearly</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="Plan Goal"
                                name="planGoal"
                                rules={[{ required: true, message: 'Please enter plan goal' }]}
                                >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label="Status"
                                name="status"
                                rules={[{ required: true, message: 'Please enter status' }]}
                                >
                                <Select
                                    placeholder="select the plan status"
                                    // allowClear
                                >
                                    <Select.Option value="0">to do</Select.Option>
                                    <Select.Option value="1">completed</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="Plan Description"
                                name="planDesc"
                                rules={[{ required: true, message: 'Please enter plan description' }]}
                                >
                                <Input.TextArea rows={4} />
                            </Form.Item>
                            <Form.Item
                                label="Deadline"
                                name="deadline"
                                rules={[{ required: true, message: 'Please select deadline' }]}
                                >
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Update
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="Create New Study Plan"
                        open={isCreateModalOpen}
                        onCancel={() => {
                            setIsCreateModalOpen(false);
                            window.location.reload();
                        }}
                        footer={null}
                        >
                        <Form
                            name="createForm"
                            onFinish={handleCreateFormSubmit}
                        >
                            <Form.Item
                                label="Plan Type"
                                name="planType"
                                required
                                >
                                <Select
                                    placeholder="select your study plan type"
                                    // allowClear
                                >
                                    <Select.Option value="0">daily</Select.Option>
                                    <Select.Option value="1">weekly</Select.Option>
                                    <Select.Option value="2">monthly</Select.Option>
                                    <Select.Option value="3">yearly</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="Plan Goal"
                                name="planGoal"
                                required
                                >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label="Status"
                                name="status"
                                required
                                >
                                <Select
                                    placeholder="select the plan status"
                                    // allowClear
                                >
                                    <Select.Option value="0">to do</Select.Option>
                                    <Select.Option value="1">completed</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="Plan Description"
                                name="planDesc"
                                required
                                >
                                <Input.TextArea rows={4} />
                            </Form.Item>
                            <Form.Item
                                label="Deadline"
                                name="deadline"
                                required
                                >
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Add
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="Track My Study"
                        open={isTrackModalOpen}
                        onCancel={() => {
                            setIsTrackModalOpen(false);
                            window.location.reload();
                        }}
                        footer={null}
                        >
                        <Form
                            name="trackForm"
                            onFinish={handleTrackFormSubmit}
                        >
                            <Form.Item
                                label="Study Room Id"
                                name="studyRoomId"
                                rules={[{ required: true, message: 'Please input the study room ID!' }]}
                                >
                                <Input />
                                </Form.Item>

                                <Form.Item
                                label="Start Time"
                                name="startTime"
                                rules={[{ required: true, message: 'Please select the start time!' }]}
                                >
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                                </Form.Item>

                                <Form.Item
                                label="End Time"
                                name="endTime"
                                rules={[{ required: true, message: 'Please select the end time!' }]}
                                >
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                                </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Track
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                    <div className='heatmap-container'>
                    <CalendarHeatmap
                        startDate={new Date("2023-01-01")}
                        endDate={new Date("2023-12-31")}
                        values={getHeatmapData()}
                        showWeekdayLabels
                        classForValue={(value) => {
                            if (!value) {
                                return "color-empty";
                            } else if (value.count <= 60) {
                                return "color-scale-1";
                            } else if (value.count <= 120) {
                                return "color-scale-2";
                            } else if (value.count <= 180) {
                                return "color-scale-3";
                            } else {
                                return "color-scale-4";
                            }
                        }}
                    />
                    </div>
                    <div className='button-container'>
                        <Button type="primary" onClick={() => setIsTrackModalOpen(true)}>Track My Study</Button>
                    </div>
                </Content>
                
            </Layout>
        </div>
      );
};


export default ProfilePage;