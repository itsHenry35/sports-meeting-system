import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Empty,
  Popconfirm,
  Dropdown,
  Modal,
} from "antd";
import {
  ReloadOutlined,
  UserDeleteOutlined,
  TrophyOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { studentAPI } from "../../api/student";
import { Competition } from "../../types";
import {
  handleResp,
  handleRespWithNotifySuccess,
} from "../../utils/handleResp";
import { getStatusTag } from "../../utils/competition";
import { useIsMobile } from "../../utils/mobile";

const { Title } = Typography;

const StudentRegistrations: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState<Competition[]>([]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const data = await studentAPI.getRegistrations();
    handleResp(
      data,
      (data) => {
        setRegistrations(data || []);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
  };

  const handleUnregister = async (competition: Competition) => {
    const response = await studentAPI.unregisterCompetition(competition.id);
    handleRespWithNotifySuccess(response, () => {
      fetchRegistrations();
    });
  };

  const canUnregister = (competition: Competition) => {
    return ["approved", "pending_score_input"].includes(competition.status);
  };

  const getActionItems = (record: Competition) => {
    const items = [] as Array<{
      key: string;
      icon: React.ReactNode;
      label: string;
      danger?: boolean;
    }>;
    if (canUnregister(record)) {
      items.push({
        key: "unregister",
        icon: <UserDeleteOutlined />,
        label: "取消报名",
        danger: true,
      });
    }
    return items;
  };

  const columns = [
    {
      title: "项目名称",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <div style={{ fontWeight: 500 }}>{name}</div>,
    },
    {
      title: "项目状态",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
    },
    {
      title: "操作",
      key: "action",
      render: (record: Competition) => {
        if (!canUnregister(record)) {
          return null;
        }

        if (isMobile) {
          return (
            <Dropdown
              menu={{
                items: getActionItems(record),
                onClick: ({ key }) => {
                  if (key === "unregister") {
                    Modal.confirm({
                      title: "确定取消报名吗？",
                      content: "取消后可能无法再次报名",
                      onOk: () => handleUnregister(record),
                    });
                  }
                },
              }}
            >
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          );
        }

        return (
          <Space>
            <Popconfirm
              title="确定取消报名吗？"
              description="取消后可能无法再次报名"
              onConfirm={() => handleUnregister(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<UserDeleteOutlined />}>
                取消报名
              </Button>
            </Popconfirm>
          </Space>
        );
      },
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
        <Title level={2}>我的报名</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchRegistrations}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Card>
        {registrations?.length > 0 ? (
          <Table
            columns={columns}
            dataSource={registrations}
            rowKey="id"
            loading={loading}
            tableLayout="auto"
            scroll={{ x: "max-content" }}
            pagination={false}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div>还没有报名任何比赛项目</div>
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
    </div>
  );
};

export default StudentRegistrations;
