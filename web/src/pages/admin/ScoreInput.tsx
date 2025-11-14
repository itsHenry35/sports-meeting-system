import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Typography,
  Row,
  Col,
  InputNumber,
  Popconfirm,
  message,
} from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
  FormOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { adminScoreInputAPI } from "../../api/admin/score";
import { Competition, Score, StudentScore, Registration } from "../../types";
import {
  handleResp,
  handleRespWithNotifySuccess,
} from "../../utils/handleResp";
import { getRankingDisplayForTable } from "../../utils";
import { useIsMobile } from "../../utils/mobile";
import { chineseSort } from "../../utils/sort";
import { adminRegistrationAPI } from "../../api/admin/registration";

const { Title } = Typography;
const { Option } = Select;

interface ScoreFormData {
  competition_id: number;
  student_scores: { student_id?: number; class_id?: number; score?: number }[];
}

const ScoreInput: React.FC = () => {
  const [form] = Form.useForm();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(false);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [scoreFormData, setScoreFormData] = useState<ScoreFormData>({
    competition_id: 0,
    student_scores: [],
  });
  const [exportLoading, setExportLoading] = useState(false);

  const fetchCompetitions = async () => {
    setLoading(true);
    const data = await adminScoreInputAPI.getCompetitions();
    handleResp(
      data,
      (data) => {
        setCompetitions(data || []);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
  };

  const fetchScores = async (competitionId: number) => {
    setLoading(true);
    const data = await adminScoreInputAPI.getCompetitionScores(competitionId);
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

  const fetchRegistrations = async (competitionId: number) => {
    setLoading(true);
    const data = await adminScoreInputAPI.getRegisteredStudents(competitionId);
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

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleCompetitionChange = async (competitionId: number) => {
    const competition = competitions.find((c) => c.id === competitionId);
    setSelectedCompetition(competition || null);
    if (competitionId) {
      await Promise.all([
        fetchScores(competitionId),
        fetchRegistrations(competitionId),
      ]);
    }
  };

  const openModal = async () => {
    if (!selectedCompetition) {
      return;
    }

    // 如果还没有获取报名学生数据，先获取
    if (registrations.length === 0) {
      await fetchRegistrations(selectedCompetition.id);
    }

    setModalVisible(true);

    // 初始化成绩表单数据，如果已有成绩则预填写，否则为0
    const isTeamCompetition = selectedCompetition.competition_type === "team";

    let initialScores;
    if (isTeamCompetition) {
      // 团体赛：按班级去重，每个班级只有一条成绩记录
      const classMap = new Map<number, { class_id: number; score?: number }>();
      registrations.forEach((registration) => {
        if (registration.class_id && !classMap.has(registration.class_id)) {
          const existingScore = scores.find(
            (score) => score.class_id === registration.class_id,
          );
          classMap.set(registration.class_id, {
            class_id: registration.class_id,
            score: existingScore ? existingScore.score : undefined,
          });
        }
      });
      initialScores = Array.from(classMap.values());
    } else {
      // 个人赛：每个学生一条成绩记录
      initialScores = registrations.map((registration) => {
        const existingScore = scores.find(
          (score) => score.student_id === registration.student_id,
        );
        return {
          student_id: registration.student_id,
          score: existingScore ? existingScore.score : undefined,
        };
      });
    }

    setScoreFormData({
      competition_id: selectedCompetition.id,
      student_scores: initialScores,
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const updateStudentScore = (
    studentId: number | undefined,
    classId: number | undefined,
    score: number | null,
  ) => {
    setScoreFormData((prev) => ({
      ...prev,
      student_scores: prev.student_scores.map((s) => {
        if (studentId !== undefined && s.student_id === studentId) {
          return { ...s, score: score ?? undefined };
        }
        if (classId !== undefined && s.class_id === classId) {
          return { ...s, score: score ?? undefined };
        }
        return s;
      }),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedCompetition || scoreFormData.student_scores.length === 0) {
      return;
    }

    // 检查是否已有成绩数据
    const hasExistingScores = scores && scores.length > 0;

    const confirmSubmit = () => {
      // 只提交有成绩的数据（过滤掉 undefined 和 null）
      const studentScores: StudentScore[] = scoreFormData.student_scores
        .filter((s) => s.score !== undefined && s.score !== null)
        .map((s) => {
          if (s.class_id !== undefined) {
            return {
              class_id: s.class_id,
              score: s.score!,
            };
          } else {
            return {
              student_id: s.student_id,
              score: s.score!,
            };
          }
        });

      adminScoreInputAPI
        .createOrUpdateScores({
          competition_id: selectedCompetition.id,
          student_scores: studentScores,
        })
        .then((response) => {
          handleRespWithNotifySuccess(response, async () => {
            closeModal();
            await fetchScores(selectedCompetition.id);
          });
        });
    };

    if (hasExistingScores) {
      Modal.confirm({
        title: "确认重新提交成绩",
        content: `该比赛项目已存在成绩数据，确定要重新提交吗？这将覆盖原有的成绩记录。`,
        okText: "确定提交",
        cancelText: "取消",
        onOk: confirmSubmit,
      });
    } else {
      confirmSubmit();
    }
  };

  const handleDeleteScores = async () => {
    if (!selectedCompetition) return;

    const response = await adminScoreInputAPI.deleteScores(
      selectedCompetition.id,
    );
    handleRespWithNotifySuccess(response, async () => {
      await fetchScores(selectedCompetition.id);
    });
  };

  // 导出全部成绩（按比赛完整模式）
  const handleExportScores = async () => {
    setExportLoading(true);
    try {
      // 获取所有已完成的比赛
      const compsResponse = await adminScoreInputAPI.getCompetitions();
      let allCompetitions: Competition[] = [];

      await new Promise<void>((resolve, reject) => {
        handleResp(
          compsResponse,
          (comps) => {
            allCompetitions = comps.filter(
              (c: Competition) => c.status === "completed",
            );
            resolve();
          },
          () => {
            reject(new Error("获取比赛列表失败"));
          },
        );
      });

      if (allCompetitions.length === 0) {
        throw new Error("没有已完成的比赛");
      }

      // 获取每个比赛的报名和成绩数据
      const competitionsWithData = await Promise.all(
        allCompetitions.map(async (comp) => {
          // 获取报名数据
          const regResponse =
            await adminRegistrationAPI.getCompetitionRegistrations(comp.id);
          let registrations: Registration[] = [];
          await new Promise<void>((resolveReg) => {
            handleResp(
              regResponse,
              (data) => {
                registrations = data;
                resolveReg();
              },
              () => {
                resolveReg();
              },
            );
          });

          // 获取成绩数据
          const scoresResponse = await adminScoreInputAPI.getCompetitionScores(
            comp.id,
          );
          let scores: Score[] = [];
          await new Promise<void>((resolveScore) => {
            handleResp(
              scoresResponse,
              (data) => {
                scores = data;
                resolveScore();
              },
              () => {
                resolveScore();
              },
            );
          });

          // 按班级和姓名排序报名数据
          registrations.sort((a, b) => {
            const classCompare = chineseSort(a.class_name, b.class_name);
            if (classCompare !== 0) return classCompare;
            return a.student_name.localeCompare(b.student_name, "zh-CN");
          });

          // 创建成绩映射表（用于快速查找）
          const scoreMap = new Map<number, Score>();
          scores.forEach((score) => {
            if (score.student_id) {
              scoreMap.set(score.student_id, score);
            }
          });

          return {
            competition: comp,
            registrations,
            scoreMap,
          };
        }),
      );

      // 使用 excel 工具导出
      const { exportExcel, createMerge } = await import("../../utils/excel");

      const sheets = competitionsWithData.map(
        ({ competition, registrations, scoreMap }) => {
          const sheetData: any[][] = [];
          const merges: any[] = [];

          // 添加比赛名称作为标题（合并6列）
          sheetData.push([competition.name, "", "", "", "", ""]);
          merges.push(createMerge(0, 0, 0, 5));

          // 添加表头
          sheetData.push(["序号", "班级", "姓名", "成绩", "名次", "得分"]);

          // 添加学生数据，根据报名顺序生成序号
          registrations.forEach((reg, index) => {
            const score = reg.student_id ? scoreMap.get(reg.student_id) : null;
            sheetData.push([
              index + 1, // 序号基于报名列表
              reg.class_name,
              reg.student_name,
              score ? `${score.score} ${competition.unit}` : "", // 成绩
              score && score.ranking ? score.ranking : "", // 名次
              score && score.point !== undefined && score.point !== null
                ? score.point
                : "", // 得分
            ]);
          });

          return {
            name: competition.name.substring(0, 31), // Excel sheet 名称限制31字符
            data: sheetData,
            merges: merges,
            colWidths: [5, 10, 10, 10, 5, 5],
          };
        },
      );

      const filename = `成绩数据_${new Date().toLocaleDateString()}.xlsx`;
      exportExcel(sheets, filename);

      message.success("导出成功");
    } catch (error) {
      message.error("导出失败：" + (error as Error).message);
    } finally {
      setExportLoading(false);
    }
  };

  const getColumns = () => {
    const isTeamCompetition = selectedCompetition?.competition_type === "team";

    const baseColumns = [
      {
        title: "排名",
        dataIndex: "ranking",
        key: "ranking",
        render: getRankingDisplayForTable,
      },
    ];

    // 团体比赛不显示学生姓名列
    if (!isTeamCompetition) {
      baseColumns.push({
        title: "学生姓名",
        dataIndex: "student_name",
        key: "student_name",
        render: (name: unknown) => name as string,
      });
    }

    baseColumns.push(
      {
        title: "班级",
        dataIndex: "class_name",
        key: "class_name",
        render: (classname: unknown) => classname as string,
      },
      {
        title: "成绩",
        dataIndex: "score",
        key: "score",
        render: (score: unknown) => (
          <span>
            {score as number} {selectedCompetition?.unit}
          </span>
        ),
      },
      {
        title: "分数",
        dataIndex: "point",
        key: "point",
        render: (point: unknown) => <span>{point as number}</span>,
      },
    );

    return baseColumns;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>成绩录入</Title>
        {isMobile ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: 16,
            }}
          >
            <Select
              placeholder="请选择比赛项目"
              onChange={handleCompetitionChange}
              allowClear
              showSearch
              optionFilterProp="children"
              size="large"
              style={{ width: "100%" }}
              filterOption={(input, option) => {
                const children = option?.children;
                if (children && typeof children === "string") {
                  return (children as string)
                    .toLowerCase()
                    .includes(input.toLowerCase());
                }
                if (
                  children &&
                  typeof children === "object" &&
                  "toString" in children
                ) {
                  return children
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase());
                }
                return false;
              }}
            >
              {competitions.map((competition) => (
                <Option key={competition.id} value={competition.id}>
                  {competition.name}
                </Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCompetitions}
              loading={loading}
              size="large"
              style={{ width: "100%" }}
            >
              刷新
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportScores}
              loading={exportLoading}
              size="large"
              style={{ width: "100%" }}
            >
              导出成绩
            </Button>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <Space wrap>
              <Select
                placeholder="请选择比赛项目"
                style={{ width: 300 }}
                onChange={handleCompetitionChange}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const children = option?.children;
                  if (children && typeof children === "string") {
                    return (children as string)
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }
                  if (
                    children &&
                    typeof children === "object" &&
                    "toString" in children
                  ) {
                    return children
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }
                  return false;
                }}
              >
                {competitions.map((competition) => (
                  <Option key={competition.id} value={competition.id}>
                    {competition.name}
                  </Option>
                ))}
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchCompetitions}
                loading={loading}
              >
                刷新
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExportScores}
                loading={exportLoading}
              >
                导出成绩
              </Button>
            </Space>
          </div>
        )}
      </div>

      {selectedCompetition && (
        <Card
          title={`${selectedCompetition.name} - 成绩管理`}
          extra={
            <Space>
              {scores?.length > 0 && (
                <Popconfirm
                  title="确定删除所有成绩吗？"
                  onConfirm={handleDeleteScores}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除成绩
                  </Button>
                </Popconfirm>
              )}
              <Button
                type="primary"
                icon={<FormOutlined />}
                onClick={openModal}
              >
                录入成绩
              </Button>
            </Space>
          }
        >
          <Table
            columns={getColumns()}
            dataSource={scores}
            rowKey="id"
            loading={loading}
            tableLayout="auto"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条成绩`,
            }}
            locale={{
              emptyText: "暂无成绩数据",
            }}
          />
        </Card>
      )}

      <Modal
        title={scores && scores.length > 0 ? "编辑比赛成绩" : "录入比赛成绩"}
        open={modalVisible}
        onCancel={closeModal}
        width={800}
        footer={
          <Space>
            <Button onClick={closeModal}>取消</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
            >
              {scores && scores.length > 0 ? "更新成绩" : "保存成绩"}
            </Button>
          </Space>
        }
      >
        {registrations.length === 0 ? (
          <div>
            该比赛暂无报名
            {selectedCompetition?.competition_type === "team" ? "班级" : "学生"}
          </div>
        ) : (
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {(() => {
              const isTeamCompetition =
                selectedCompetition?.competition_type === "team";
              // 团体赛：按班级去重
              let displayList = isTeamCompetition
                ? Array.from(
                    new Map(
                      registrations
                        .filter((r) => r.class_id)
                        .map((r) => [r.class_id, r]),
                    ).values(),
                  )
                : registrations;

              // 按班级和姓名排序
              displayList = [...displayList].sort((a, b) => {
                const classCompare = chineseSort(a.class_name, b.class_name);
                if (classCompare !== 0) return classCompare;
                // 团体赛只按班级排序，个人赛还要按学生姓名排序
                if (!isTeamCompetition) {
                  return a.student_name.localeCompare(b.student_name, "zh-CN");
                }
                return 0;
              });

              return (
                <>
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "12px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      textAlign: "center",
                      fontWeight: 500,
                    }}
                  >
                    共有 {displayList.length}{" "}
                    {isTeamCompetition ? "个班级报名参赛" : "名学生报名参赛"}
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {displayList.map((registration) => {
                      const currentScore = scoreFormData.student_scores.find(
                        (s) =>
                          isTeamCompetition
                            ? s.class_id === registration.class_id
                            : s.student_id === registration.student_id,
                      );
                      return (
                        <Card
                          key={
                            isTeamCompetition
                              ? `class-${registration.class_id}`
                              : `student-${registration.id}`
                          }
                          size="small"
                          style={{ marginBottom: 8 }}
                          title={
                            <div>
                              {isTeamCompetition ? (
                                <strong>{registration.class_name}</strong>
                              ) : (
                                <>
                                  <strong>{registration.student_name}</strong>
                                  <span> ({registration.class_name})</span>
                                </>
                              )}
                            </div>
                          }
                        >
                          <Row gutter={16} align="middle">
                            <Col span={12}>
                              <span>成绩:</span>
                            </Col>
                            <Col span={12}>
                              <InputNumber
                                placeholder="请输入成绩"
                                style={{ width: "100%" }}
                                step={0.01}
                                value={currentScore?.score}
                                onChange={(value) =>
                                  updateStudentScore(
                                    isTeamCompetition
                                      ? undefined
                                      : registration.student_id,
                                    isTeamCompetition
                                      ? registration.class_id
                                      : undefined,
                                    value,
                                  )
                                }
                                addonAfter={selectedCompetition?.unit}
                              />
                            </Col>
                          </Row>
                        </Card>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScoreInput;
