import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Empty,
  Button,
  Space,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  TrophyOutlined,
  ReloadOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { studentAPI } from "../../api/student";
import { Score } from "../../types";
import { handleResp } from "../../utils/handleResp";
import {
  getRankingDisplayForTable,
  getRankingColor,
  getWinningCount,
  getBestRanking,
} from "../../utils/competition";

const { Title, Text } = Typography;

const StudentScores: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    setLoading(true);
    const data = await studentAPI.getScores();
    handleResp(
      data,
      (data) => {
        setScores(data || []);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
  };

  const columns = [
    {
      title: "项目名称",
      dataIndex: "competition_name",
      key: "competition_name",
      render: (name: string) => <div style={{ fontWeight: 500 }}>{name}</div>,
    },
    {
      title: "成绩",
      key: "score",
      render: (record: Score) => (
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: getRankingColor(record.ranking),
          }}
        >
          {record.score} {record.competition_name?.split(" ").pop() || ""}
        </div>
      ),
    },
    {
      title: "排名",
      dataIndex: "ranking",
      key: "ranking",
      render: getRankingDisplayForTable,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>我的成绩</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchScores}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {/* 成绩统计 */}
      {scores?.length > 0 && (
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="参赛项目"
                value={scores.length}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: "#1677ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="获奖次数"
                value={getWinningCount(scores)}
                prefix={<StarOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="最佳排名"
                value={getBestRanking(scores) || "-"}
                prefix={
                  getBestRanking(scores) === 1 ? (
                    "🥇"
                  ) : getBestRanking(scores) === 2 ? (
                    "🥈"
                  ) : getBestRanking(scores) === 3 ? (
                    "🥉"
                  ) : (
                    <TrophyOutlined />
                  )
                }
                valueStyle={{
                  color: getBestRanking(scores)
                    ? getRankingColor(getBestRanking(scores) ?? undefined)
                    : "#666",
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {scores?.length > 0 ? (
          <Table
            columns={columns}
            dataSource={scores}
            rowKey="id"
            loading={loading}
            tableLayout="auto"
            scroll={{ x: "max-content" }}
            pagination={false}
            rowClassName={(record) => {
              if (record.ranking === 1) return "score-ranking top-3";
              if (record.ranking === 2) return "score-ranking top-3";
              if (record.ranking === 3) return "score-ranking top-3";
              return "";
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div>还没有比赛成绩</div>
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8 }}
                >
                  参加比赛并完成后，成绩将在这里显示
                </Text>
                <Button
                  type="primary"
                  style={{ marginTop: 16 }}
                  icon={<TrophyOutlined />}
                  onClick={() => navigate("/student/competitions")}
                >
                  去报名比赛
                </Button>
              </div>
            }
          />
        )}
      </Card>

      {getWinningCount(scores) > 0 && (
        <Card
          title={
            <Space>
              <StarOutlined style={{ color: "#FFD700" }} />
              获奖记录
            </Space>
          }
          style={{ marginTop: 24 }}
        >
          <Row gutter={[16, 16]}>
            {scores
              .filter((s) => s.ranking && s.ranking <= 3)
              .map((score, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card
                    size="small"
                    style={{
                      border: `2px solid ${getRankingColor(score.ranking)}`,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: 8 }}>
                        {score.ranking === 1
                          ? "🥇"
                          : score.ranking === 2
                            ? "🥈"
                            : "🥉"}
                      </div>
                      <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                        {score.competition_name}
                      </div>
                      <div
                        style={{
                          color: getRankingColor(score.ranking),
                          fontWeight: "bold",
                        }}
                      >
                        第{score.ranking}名
                      </div>
                      <div style={{ color: "#666", fontSize: "12px" }}>
                        成绩：{score.score}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default StudentScores;
