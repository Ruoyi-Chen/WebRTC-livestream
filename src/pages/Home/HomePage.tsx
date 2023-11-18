import React from 'react';
import { Layout } from 'antd';
import './HomePage.less';

const { Content } = Layout;
import HeaderComponent from "./HeaderComponent";
import Home from "./Home";

const HomePage = () => {
  return (
    <Layout>
      <HeaderComponent />
      <Content>
        <Home />
      </Content>
    </Layout>
  );
};

export default HomePage;
