import axios from "axios";
import {RcFile} from "antd/es/upload/interface";
import {message} from "antd";

const REQUEST_LIST = [];

axios.interceptors.request.use((request) => {
    (request.baseURL = "http://localhost:8080")
    // (request.withCredentials = true);
    return request;
});

export interface BaseRes {
    code: string;
    msg: string;
}

export const LoginUser = (email: string, password: string) => {
    return new Promise((resolve, reject) => {
        axios({
            method: "POST",
            url: "http://localhost:8080/account/login",
            data: {
                email: email,
                password: password,
            },
        })
            .then((res) => {
                if (res.data.success) {
                    const key = res.data["data"]["tokenName"];
                    const value = res.data["data"]["tokenValue"];
                    window.localStorage.setItem(key, value);

                    const userId = res.data["data"]["loginId"];
                    window.localStorage.setItem("userId", userId);

                    resolve(1);
                } else {
                    reject(res.data.msg);
                }
            })
            .catch((error) => {
                reject("Login failed. Please try again.");
            });
    });
};

export const LogoutUser = () => {
    axios({
        method: 'GET',
        headers: {"satoken": window.localStorage.getItem("satoken")},
        url: 'http://localhost:8080/account/logout',
    })
        .then(() => {
            window.location.href = '/login';
        })
}

export const RegisterUser = (name: string, email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        axios({
            method: 'POST',
            url: 'http://localhost:8080/account/register',
            data: {
                "name": name,
                "email": email,
                "password": password
            }
        })
            .then((res) => {
                if (res.data.success) {
                    alert("Registered successfully!");
                    resolve();
                } else {
                    // email has already been registered
                    reject(res.data.msg);
                }
            })
            .catch((error) => {
                reject("Registration failed. Please try again.")
            });
    });
};

export const UserInfoManage = async () => {
    const userId = window.localStorage.getItem("userId");
    await axios({
        method: 'POST',
        url: 'http://localhost:8080/user/userinfo/info/' + userId
    }).then((res) => {
        if (res.data.success) {
            // store Username in local storage
            const userName = res.data['data']['userName'];
            window.localStorage.setItem('userName', userName);

            // store Avatar in local storage
            const avatar = res.data['data']['avatar'];
            window.localStorage.setItem('avatar', avatar);

            // store Introduction in local storage
            const introduction = res.data['data']['introduction'];
            window.localStorage.setItem('introduction', introduction);

            // store Phone in local storage
            const phone = res.data['data']['phone'];
            window.localStorage.setItem('phone', phone);

            // store Email in local storage
            const email = res.data['data']['email'];
            window.localStorage.setItem('email', email);

            // window.localStorage.setItem('userInfo', JSON.stringify(res.data['data']));
        } else {
            alert(res.data.msg)
        }
    })
}

export const InfoUpdate = async (userName: string, phone: string, email: string, introduction: string, avatar: any) => {
  const userId = window.localStorage.getItem("userId");
  const formData = new FormData();
  console.log(userName)
  console.log(phone)
  console.log(email)
  console.log(introduction)
  if (userId) {
    formData.append('userId', userId);
  }
  if (userName != "") {
    formData.append('userName', userName);
  }
  if (avatar != null) {
    formData.append('avatar', avatar);
  }
  if (phone != "") {
    formData.append('phone', phone);
  }
  if (email != "") {
    formData.append('email', email);
  }
  if (introduction != "") {
    formData.append('introduction', introduction);
  }
  console.log(formData)
  await axios({
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    url: 'http://localhost:8080/user/userinfo/update',
    data: formData
  }).then((res) => {
    if (res.data.success) {
      console.log("Edit successfully!");
    } else {
        message.error("Fail to edit.");
        alert(res.data.msg);
    }
    })
}

export const getStudyPlan = async () => {
    const userId = window.localStorage.getItem("userId");
    const res = await axios({
        method: "POST",
        url: "http://localhost:8080/user/studyplan/info/" + userId,
    });
    if (res.data.success) {
        return res.data.data;
    } else {
        throw new Error(res.data.msg);
    }
};


export const updateStudyPlan = async (updatedPlan: any) => {
    const res = await axios({
        method: "POST",
        url: `http://localhost:8080/user/studyplan/update`,
        data: updatedPlan
    });
    if (res.data.success) {
        return res.data.data;
    } else {
        throw new Error(res.data.msg);
    }
};

export const deleteStudyPlan = async (planId: number) => {
    const res = await axios({
        method: "GET",
        url: `http://localhost:8080/user/studyplan/delete/${planId}`
    });
    if (res.data.success) {
        return res.data.data;
    } else {
        throw new Error(res.data.msg);
    }
};

export const createStudyPlan = async (newPlan: any) => {
    newPlan.userId = window.localStorage.getItem("userId");
    const res = await axios({
        method: "POST",
        url: `http://localhost:8080/user/studyplan/create`,
        data: newPlan
    });
    if (res.data.success) {
        return res.data.data;
    } else {
        throw new Error(res.data.msg);
    }
};

export const createStudyTrack = async (newTrack: any) => {
    newTrack.userId = window.localStorage.getItem("userId");
    const res = await axios({
        method: "POST",
        url: `http://localhost:8080/user/studytrack/create`,
        data: newTrack
    });
    if (res.data.success) {
        return res.data.data;
    } else {
        throw new Error(res.data.msg);
    }
};

export const getStudyTrack = async () => {
    const userId = window.localStorage.getItem("userId");
    const res = await axios({
        method: "POST",
        url: "http://localhost:8080/user/studytrack/info/" + userId,
    });
    if (res.data.success) {
        return res.data.data;
    } else {
        throw new Error(res.data.msg);
    }
};

export const updateStar = async (roomId: any, likesStarCount: any, evaStarCount: any, duration: any) => {
    const userId = window.localStorage.getItem("userId");
    await axios({
        method: "POST",
        url: "http://localhost:8080/user/star/update",
        data: {
            "userId": userId,
            "roomId": roomId,
            "likesStarCount": likesStarCount,
            "evaStarCount": evaStarCount,
            "duration": duration
        }
    }).then((res) => {
        if (res.data.success) {
            console.log("Stars update successfully!");
        }
        else {
            alert(res.data.msg);
        }
    })
};