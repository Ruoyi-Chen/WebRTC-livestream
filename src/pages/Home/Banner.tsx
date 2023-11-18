import React from 'react';
import {Carousel} from 'antd';
import './Banner.less'

const Banner = () => {

    return (
        <Carousel autoplay autoplaySpeed={1500}>
            <div>
                <h3><img src={require('../../assets/banner/banner1.png')} alt="logo"/></h3>
            </div>
            <div>
                <h3><img src={require('../../assets/banner/banner2.png')} alt="logo"/></h3>
            </div>
            <div>
                <h3><img src={require('../../assets/banner/banner3.png')} alt="logo"/></h3>
            </div>
            <div>
                <h3><img src={require('../../assets/banner/banner4.jpeg')} alt="logo"/></h3>
            </div>
        </Carousel>
    );

}
export default Banner;
