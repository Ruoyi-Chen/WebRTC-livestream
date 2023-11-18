export interface IAuthAccount {
  user_id: number;
  username: string;
  password: string;
  status: number;
  create_time: Date;
  update_time: Date;
  sys_type: number;
  is_admin: number;
  create_ip: string;
  is_vip: number;
  salt: string;
  email: string;
}

export interface IStar {
  user_id: number | null;
  time_star_count: number | null;
  likes_star_count: number | null;
  eva_star_count: number | null;
  star_coin_count: number | null;
  create_time: Date | null;
  update_time: Date | null;
}

export interface IStudyPlan {
  user_id: number;
  parent_id: number | null;
  plan_id: number | null;
  plan_type: number;
  plan_goal: string;
  status: number;
  plan_desc: string | null;
  deadline: Date | null;
  create_time: Date | null;
  update_time: Date | null;
}

export interface IStudyTrack {
  track_id: number | null;
  user_id: number | null;
  study_room_id: number | null;
  start_time: Date | null;
  end_time: Date | null;
  duration: number | null;
  create_time: Date | null;
  update_time: Date | null;
}

export interface ITodoList {
  user_id: number | null;
  list_id: number | null;
  list_title: string | null;
  create_time: Date | null;
  update_time: Date | null;
}

export interface ITodoListItem {
  list_id: number | null;
  item_id: number | null;
  title: string | null;
  deadline: Date | null;
  is_repeat: number | null;
  priority: number | null;
  create_time: Date | null;
  update_time: Date | null;
}

export interface IUserInfo {
  user_id: number;
  user_name: string;
  avatar: string | null;
  introduction: string | null;
  phone: string | null;
  email: string | null;
  create_time: Date | null;
  update_time: Date | null;
}

export interface ILiveCategory {
  category_id: number;
  name: string;
  create_time: Date | null;
  update_time: Date | null;
}

export interface ILiveRoom {
  host_user_id: number;
  room_id: number;
  room_name: string;
  description: string | null;
  type: number;
  status: number;
  cover_url: string | null;
  category_id: number | null;
  label: string | null;
  start_time: Date | null;
  end_time: Date | null;
  create_time: Date | null;
  update_time: Date | null;
}

export interface IRecordingCollection {
  collectionId: number;
  ownerUserId: number;
  categoryId: number;
  uploadTime: string;
  title: string;
  cover: string | null;
  totalTime: number;
  description: string | null;
  privacy: number;
  status: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  forwardCount: number;
  createTime: string;
  updateTime: string;
}

export interface IRoomMember {
  id: number;
  roomId: number;
  userId: number;
  joinTime: string;
  leaveTime: string | null;
  duration: number | null;
}

export interface IVideo {
  videoId: number;
  videoUrl: string;
  duration: number;
  createTime: string | null;
  updateTime: string | null;
}
