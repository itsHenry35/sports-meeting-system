import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Avatar,
  List,
} from "antd";
import {
  TrophyOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { studentAPI } from "../../api/student";
import { Competition, Score } from "../../types";
import { handleRespWithoutNotify } from "../../utils/handleResp";
import { getStatusTag, getRankingDisplay } from "../../utils/competition";

const { Title, Text } = Typography;

interface PointsSummary {
  student_id: number;
  student_name: string;
  class_id: number;
  class_name: string;
  total_points: number;
  ranking_points: number;
  rank: number;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Competition[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [registrationData, scoresData, pointsData] = await Promise.allSettled(
      [
        studentAPI.getRegistrations(),
        studentAPI.getScores(),
        studentAPI.getPointsSummary(),
      ],
    );

    if (registrationData.status === "fulfilled") {
      handleRespWithoutNotify(registrationData.value, (data) => {
        setRegistrations(data || []);
      });
    }
    if (scoresData.status === "fulfilled") {
      handleRespWithoutNotify(scoresData.value, (data) => {
        setScores(data || []);
      });
    }
    if (pointsData.status === "fulfilled") {
      handleRespWithoutNotify(pointsData.value, (data) => {
        setPointsSummary(data || null);
      });
    }
  };

  return (
    <div>
      {/* 欢迎信息 */}
      <Card style={{ marginBottom: 24, color: "#000" }}>
        <Row align="middle">
          <Col flex="none">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              style={{ marginRight: 24 }}
            />
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ color: "#000", margin: 0 }}>
              你好，{user?.full_name}
            </Title>
            <Text style={{ color: "rgba(0, 0, 0, 0.85)", fontSize: "16px" }}>
              在这里提交推荐项目、管理你的比赛报名、查看你的成绩
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="hover-card"
            onClick={() => navigate("/student/registrations")}
          >
            <Statistic
              title="我的报名"
              value={registrations?.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="hover-card"
            onClick={() => navigate("/student/scores")}
          >
            <Statistic
              title="已完成比赛"
              value={scores?.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="hover-card">
            <Statistic
              title="当前排名"
              value={pointsSummary?.rank || "-"}
              prefix={<CrownOutlined />}
              valueStyle={{ color: "#faad14" }}
              suffix={pointsSummary?.rank ? "名" : ""}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="hover-card">
            <Statistic
              title="总得分"
              value={pointsSummary?.total_points?.toFixed(1) || "0"}
              prefix={<FireOutlined />}
              valueStyle={{ color: "#f5222d" }}
              suffix="分"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 最近报名 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                最近报名
              </Space>
            }
            extra={
              <Button
                size="small"
                onClick={() => navigate("/student/registrations")}
              >
                查看全部
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            {registrations?.length > 0 ? (
              <List
                dataSource={registrations?.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <Space>
                          {getStatusTag(item.status)}
                          <Text type="secondary">{item.unit}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  color: "#999",
                }}
              >
                <FileTextOutlined
                  style={{ fontSize: "32px", marginBottom: "8px" }}
                />
                <div>还没有报名任何比赛</div>
                <Button
                  type="link"
                  onClick={() => navigate("/student/competitions")}
                >
                  去报名
                </Button>
              </div>
            )}
          </Card>
        </Col>

        {/* 最近成绩 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TrophyOutlined />
                最近成绩
              </Space>
            }
            extra={
              <Button size="small" onClick={() => navigate("/student/scores")}>
                查看全部
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            {scores?.length > 0 ? (
              <List
                dataSource={scores?.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.competition_name}
                      description={
                        <Space>
                          <Text strong>
                            {item.score} {item.competition_name}
                          </Text>
                          {getRankingDisplay(item.ranking)}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  color: "#999",
                }}
              >
                <TrophyOutlined
                  style={{ fontSize: "32px", marginBottom: "8px" }}
                />
                <div>还没有比赛成绩</div>
                <Button
                  type="link"
                  onClick={() => navigate("/student/competitions")}
                >
                  去报名比赛
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card title="快捷操作">
        <Row gutter={16}>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<EyeOutlined />}
              onClick={() => navigate("/student/competitions")}
            >
              报名比赛项目
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate("/student/submit")}
            >
              推荐新项目
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => navigate("/student/registrations")}
            >
              查看我的报名
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<BarChartOutlined />}
              onClick={() => navigate("/student/scores")}
            >
              查看我的成绩
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default StudentDashboard;
