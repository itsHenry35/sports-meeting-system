import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Tabs,
  Space,
  Typography,
  Tag,
  message,
} from "antd";
import {
  TrophyOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { pointsAPI } from "../../api/admin/points";
import { adminClassAPI } from "../../api/admin/student";
import {
  handleResp,
  handleRespWithNotifySuccess,
} from "../../utils/handleResp";
import { getRankingDisplayForTable } from "../../utils/competition";
import { chineseSort } from "../../utils/sort";
import type {
  ClassPointsSummary,
  StudentPointsSummary,
  PointDetail,
  Class,
} from "../../types";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PointsManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [classPoints, setClassPoints] = useState<ClassPointsSummary[]>([]);
  const [studentPoints, setStudentPoints] = useState<StudentPointsSummary[]>(
    [],
  );
  const [classLoading, setClassLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<PointDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailType, setDetailType] = useState<"class" | "student">("class"); // 标识当前查看的是班级还是学生明细
  const [classes, setClasses] = useState<Class[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // 获取班级列表
  const fetchClasses = async () => {
    const data = await adminClassAPI.getClasses();
    handleResp(data, (data) => {
      setClasses(data || []);
    });
  };

  // 获取班级得分汇总
  const fetchClassPoints = async () => {
    setClassLoading(true);
    const data = await pointsAPI.getClassPointsSummary();
    handleResp(
      data,
      (data) => {
        setClassPoints(data || []);
        setClassLoading(false);
      },
      () => {
        setClassLoading(false);
      },
    );
  };

  // 获取学生得分汇总
  const fetchStudentPoints = async () => {
    setStudentLoading(true);
    const data = await pointsAPI.getStudentPointsSummary();
    handleResp(
      data,
      (data) => {
        setStudentPoints(data || []);
        setStudentLoading(false);
      },
      () => {
        setStudentLoading(false);
      },
    );
  };

  // 查看班级得分明细
  const viewClassDetails = async (classId: number, className: string) => {
    setDetailTitle(`${className} - 得分明细`);
    setDetailType("class");
    setDetailModalVisible(true);
    setDetailsLoading(true);
    const data = await pointsAPI.getClassPointDetails(classId);
    handleResp(
      data,
      (data) => {
        setSelectedDetails(data || []);
        setDetailsLoading(false);
      },
      () => {
        setDetailsLoading(false);
      },
    );
  };

  // 查看学生得分明细
  const viewStudentDetails = async (studentId: number, studentName: string) => {
    setDetailTitle(`${studentName} - 得分明细`);
    setDetailType("student");
    setDetailModalVisible(true);
    setDetailsLoading(true);
    const data = await pointsAPI.getStudentPointDetails(studentId);
    handleResp(
      data,
      (data) => {
        setSelectedDetails(data || []);
        setDetailsLoading(false);
      },
      () => {
        setDetailsLoading(false);
      },
    );
  };

  // 添加自定义得分
  const handleAddCustomPoints = async (values: any) => {
    const data = await pointsAPI.addCustomPointsToClass(
      values.class_id,
      values.points,
      values.reason,
    );
    handleRespWithNotifySuccess(data, () => {
      setAddModalVisible(false);
      form.resetFields();
      fetchClassPoints();
    });
  };

  // 删除自定义得分
  const handleDeleteCustomPoint = async (pointId: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这条自定义得分记录吗？",
      onOk: async () => {
        const data = await pointsAPI.deleteCustomPoint(pointId);
        handleRespWithNotifySuccess(data, () => {
          setDetailModalVisible(false);
          fetchClassPoints();
        });
      },
    });
  };

  // 导出团体得分表格
  const handleExportClassPoints = async () => {
    setExportLoading(true);
    try {
      // 获取所有班级得分汇总
      const summaryResponse = await pointsAPI.getClassPointsSummary();
      let classSummaries: ClassPointsSummary[] = [];
      await new Promise<void>((resolve) => {
        handleResp(
          summaryResponse,
          (data) => {
            classSummaries = data;
            resolve();
          },
          () => {
            resolve();
          },
        );
      });

      if (classSummaries.length === 0) {
        throw new Error("没有班级得分数据");
      }

      // 按班级名排序
      classSummaries.sort((a, b) => chineseSort(a.class_name, b.class_name));

      // 获取所有班级的得分明细
      const classDetailsMap = new Map<
        number,
        { details: PointDetail[]; summary: ClassPointsSummary }
      >();

      for (const summary of classSummaries) {
        const detailsResponse = await pointsAPI.getClassPointDetails(
          summary.class_id,
        );
        let details: PointDetail[] = [];
        await new Promise<void>((resolve) => {
          handleResp(
            detailsResponse,
            (data) => {
              details = data;
              resolve();
            },
            () => {
              resolve();
            },
          );
        });

        classDetailsMap.set(summary.class_id, { details, summary });
      }

      // 收集所有个人项目和团体项目名称
      const individualProjects = new Set<string>();
      const teamProjects = new Set<string>();

      classDetailsMap.forEach(({ details }) => {
        details.forEach((detail) => {
          if (detail.point_type === "ranking") {
            if (detail.competition_type === "individual") {
              individualProjects.add(detail.competition_name);
            } else if (detail.competition_type === "team") {
              teamProjects.add(detail.competition_name);
            }
          }
        });
      });

      const individualProjectList = Array.from(individualProjects);
      const teamProjectList = Array.from(teamProjects);

      // 动态导入 excel 工具
      const { exportExcel, createMerge } = await import("../../utils/excel");

      // 构建表格数据
      const sheetData: any[][] = [];
      const merges: any[] = [];

      // 构建第一行表头（大类）
      const headerRow1 = [
        "班级",
        ...Array(individualProjectList.length + 1).fill("个人项目"),
        ...Array(teamProjectList.length).fill("团体项目"),
        "班级总分",
        "班级名次",
      ];
      sheetData.push(headerRow1);

      // 构建第二行表头（具体项目名）
      const headerRow2 = [
        "", // 班级列在第一行
        ...individualProjectList,
        "个人项目总分",
        ...teamProjectList,
        "", // 班级总分在第一行
        "", // 班级名次在第一行
      ];
      sheetData.push(headerRow2);

      // 创建合并单元格
      // 班级列：合并第1-2行，第1列
      merges.push(createMerge(0, 0, 1, 0, true, true));

      // 个人项目：合并第1行，从第2列到个人项目总分列
      const individualStartCol = 1;
      const individualEndCol =
        individualStartCol + individualProjectList.length;
      merges.push(
        createMerge(0, individualStartCol, 0, individualEndCol, true, true),
      );

      // 团体项目：合并第1行，团体项目列
      const teamStartCol = individualEndCol + 1;
      const teamEndCol = teamStartCol + teamProjectList.length - 1;
      if (teamProjectList.length > 0) {
        merges.push(createMerge(0, teamStartCol, 0, teamEndCol, true, true));
      }

      // 班级总分：合并第1-2行
      const totalCol = teamEndCol + 1;
      merges.push(createMerge(0, totalCol, 1, totalCol, true, true));

      // 班级名次：合并第1-2行
      const rankCol = totalCol + 1;
      merges.push(createMerge(0, rankCol, 1, rankCol, true, true));

      // 构建数据行
      classSummaries.forEach((summary) => {
        const classData = classDetailsMap.get(summary.class_id);
        if (!classData) return;

        const row: any[] = [summary.class_name];

        // 创建得分映射（项目名 -> 得分）
        const pointsMap = new Map<string, number>();
        classData.details.forEach((detail) => {
          if (detail.point_type === "ranking") {
            const existingPoints = pointsMap.get(detail.competition_name) || 0;
            pointsMap.set(
              detail.competition_name,
              existingPoints + detail.points,
            );
          }
        });

        // 个人项目得分
        let individualTotal = 0;
        individualProjectList.forEach((project) => {
          const points = pointsMap.get(project) || 0;
          individualTotal += points;
          row.push(points > 0 ? points : "");
        });

        // 个人项目总分
        row.push(individualTotal > 0 ? individualTotal : "");

        // 团体项目得分
        teamProjectList.forEach((project) => {
          const points = pointsMap.get(project) || 0;
          row.push(points > 0 ? points : "");
        });

        // 班级总分
        row.push(summary.total_points);

        // 班级名次
        row.push(summary.rank);

        sheetData.push(row);
      });

      const colWidths = [
        10, // 班级
        ...individualProjectList.map(() => 12),
        12, // 个人项目总分
        ...teamProjectList.map(() => 12),
        10, // 班级总分
        8, // 班级名次
      ];

      const filename = `团体得分_${new Date().toLocaleDateString()}.xlsx`;
      exportExcel(
        [
          {
            name: "团体得分",
            data: sheetData,
            merges: merges,
            colWidths: colWidths,
          },
        ],
        filename,
      );

      message.success("导出成功");
    } catch (error) {
      message.error("导出失败：" + (error as Error).message);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchClassPoints();
    fetchStudentPoints();
    fetchClasses();
  }, []);

  // 班级得分表格列
  const classColumns = [
    {
      title: "排名",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      render: (rank: number) => getRankingDisplayForTable(rank),
    },
    {
      title: "班级",
      dataIndex: "class_name",
      key: "class_name",
    },
    {
      title: "总分",
      dataIndex: "total_points",
      key: "total_points",
      render: (points: number) => points.toFixed(1),
      sorter: (a: ClassPointsSummary, b: ClassPointsSummary) =>
        a.total_points - b.total_points,
    },
    {
      title: "排名得分",
      dataIndex: "ranking_points",
      key: "ranking_points",
      render: (points: number) => points.toFixed(1),
    },
    {
      title: "自定义得分",
      dataIndex: "custom_points",
      key: "custom_points",
      render: (points: number) => points.toFixed(1),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: ClassPointsSummary) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewClassDetails(record.class_id, record.class_name)}
        >
          查看明细
        </Button>
      ),
    },
  ];

  // 学生得分表格列
  const studentColumns = [
    {
      title: "排名",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      render: (rank: number) => getRankingDisplayForTable(rank),
    },
    {
      title: "姓名",
      dataIndex: "student_name",
      key: "student_name",
    },
    {
      title: "班级",
      dataIndex: "class_name",
      key: "class_name",
    },
    {
      title: "总分",
      dataIndex: "total_points",
      key: "total_points",
      render: (points: number) => points.toFixed(1),
      sorter: (a: StudentPointsSummary, b: StudentPointsSummary) =>
        a.total_points - b.total_points,
    },
    {
      title: "排名得分",
      dataIndex: "ranking_points",
      key: "ranking_points",
      render: (points: number) => points.toFixed(1),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: StudentPointsSummary) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() =>
            viewStudentDetails(record.student_id, record.student_name)
          }
        >
          查看明细
        </Button>
      ),
    },
  ];

  // 得分明细表格列（根据类型动态生成）
  const getDetailColumns = (): any[] => {
    const baseColumns: any[] = [
      {
        title: "比赛项目",
        dataIndex: "competition_name",
        key: "competition_name",
      },
      {
        title: "得分",
        dataIndex: "points",
        key: "points",
        render: (points: number) => (
          <Text strong style={{ color: "#52c41a" }}>
            {points > 0 ? "+" : ""}
            {points.toFixed(1)}
          </Text>
        ),
      },
      {
        title: "类型",
        dataIndex: "point_type",
        key: "point_type",
        render: (type: string) =>
          type === "ranking" ? (
            <Tag color="blue">排名得分</Tag>
          ) : (
            <Tag color="orange">自定义得分</Tag>
          ),
      },
      {
        title: "排名",
        dataIndex: "ranking",
        key: "ranking",
        render: (ranking?: number) => ranking || "-",
      },
      {
        title: "原因",
        dataIndex: "reason",
        key: "reason",
        render: (reason?: string) => reason || "-",
      },
    ];

    // 班级得分明细才显示"创建者"和"操作"列
    if (detailType === "class") {
      baseColumns.push(
        {
          title: "创建者",
          dataIndex: "creator_name",
          key: "creator_name",
          render: (name?: string) => name || "-",
        },
        {
          title: "操作",
          key: "action",
          render: (_: any, record: PointDetail) =>
            record.point_type === "custom" ? (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteCustomPoint(record.id)}
              >
                删除
              </Button>
            ) : null,
        },
      );
    }

    return baseColumns;
  };

  return (
    <div>
      <Title level={2}>
        <TrophyOutlined /> 得分管理
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            添加自定义得分
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportClassPoints}
            loading={exportLoading}
          >
            导出团体得分
          </Button>
        </Space>
      </Card>

      <Tabs defaultActiveKey="class">
        <TabPane
          tab={
            <span>
              <TeamOutlined />
              班级分数榜
            </span>
          }
          key="class"
        >
          <Card>
            <Table
              columns={classColumns}
              dataSource={classPoints}
              loading={classLoading}
              rowKey="class_id"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <UserOutlined />
              个人分数榜
            </span>
          }
          key="student"
        >
          <Card>
            <Table
              columns={studentColumns}
              dataSource={studentPoints}
              loading={studentLoading}
              rowKey="student_id"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 添加自定义得分Modal */}
      <Modal
        title="添加自定义得分"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddCustomPoints}>
          <Form.Item
            label="班级"
            name="class_id"
            rules={[{ required: true, message: "请选择班级" }]}
          >
            <Select placeholder="请选择班级">
              {classes.map((cls) => (
                <Select.Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="得分"
            name="points"
            rules={[{ required: true, message: "请输入得分" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="请输入得分（可为负数）"
            />
          </Form.Item>

          <Form.Item
            label="原因"
            name="reason"
            rules={[{ required: true, message: "请输入原因" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="例如：开幕式表演、纪律加分等"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setAddModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 得分明细Modal */}
      <Modal
        title={detailTitle}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={getDetailColumns()}
          dataSource={selectedDetails}
          loading={detailsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
};

export default PointsManagement;
