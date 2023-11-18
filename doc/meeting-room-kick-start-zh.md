# 基础逻辑

A 推流给SRS服务器，将StreamId告诉B，B根据StreamId从SRS服务器拉流。
- 携带userId、昵称、房间号注册到Socket客户端
- 注册成功后，将自己的画面流通过WebRTC推流到SRS，并记录一个StreamId，这个StreamId是用户自己的唯一id
- 如果同一个房间内有人，则广播自己的信息到房间内所有人，收到新加入成员后，使用新成员的StreamID去SRS拉流
- 房间内所有人的流都需要主动从SRS拉流，从而形成会议

