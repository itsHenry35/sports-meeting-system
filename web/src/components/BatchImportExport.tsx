import React, { useState } from "react";
import {
  Modal,
  Button,
  Space,
  Upload,
  message,
  Divider,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  ImportOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd";

const { Text } = Typography;

interface ImportExportSection {
  title: string;
  icon?: React.ReactNode;
  // 导入相关
  onImport?: (data: any[]) => Promise<any>;
  importTemplate?: any[][];
  importTemplateFilename?: string;
  importRequiredFields?: string[];
  importButtonText?: string;
  // 导出相关
  onExport?: () => Promise<any[]>;
  exportFormatter?: (data: any[]) => any[];
  exportFilename?: string;
  exportButtonText?: string;
}

export interface BatchImportExportProps {
  visible: boolean;
  onClose: () => void;
  sections: ImportExportSection[];
}

const BatchImportExport: React.FC<BatchImportExportProps> = ({
  visible,
  onClose,
  sections,
}) => {
  const [loading, setLoading] = useState(false);
  const [fileLists, setFileLists] = useState<{ [key: number]: UploadFile[] }>(
    {},
  );

  // 下载模板
  const downloadTemplate = async (template: any[][], filename: string) => {
    // 动态导入 excel 工具
    const { exportExcel } = await import("../utils/excel");

    exportExcel(
      [
        {
          name: "Sheet1",
          data: template,
        },
      ],
      filename,
    );
  };

  // 通用导入处理
  const handleImport = async (
    sectionIndex: number,
    section: ImportExportSection,
  ) => {
    const fileList = fileLists[sectionIndex];
    if (!fileList || !fileList.length) {
      message.warning("请先选择文件");
      return;
    }

    setLoading(true);
    try {
      // 动态导入 excel 工具
      const { readExcelFile } = await import("../utils/excel");

      const file = fileList[0].originFileObj as File;
      const data = await readExcelFile(file);

      if (!data.length) {
        message.error("文件中没有数据");
        setLoading(false);
        return;
      }

      // 验证必填字段
      if (
        section.importRequiredFields &&
        section.importRequiredFields.length > 0
      ) {
        const firstRow = data[0];
        const missingFields = section.importRequiredFields.filter(
          (field) => !(field in firstRow),
        );

        if (missingFields.length > 0) {
          message.error(`缺少必填列：${missingFields.join(", ")}`);
          setLoading(false);
          return;
        }
      }

      const result = await section.onImport?.(data);

      // 如果导入成功，返回结果，由页面处理后续逻辑
      if (result) {
        message.success("验证成功");
      }

      setFileLists((prev) => ({ ...prev, [sectionIndex]: [] }));
      setLoading(false);
    } catch (error) {
      console.error("导入失败:", error);
      message.error("导入失败：" + (error as Error).message);
      setLoading(false);
    }
  };

  // 通用导出处理
  const handleExport = async (section: ImportExportSection) => {
    setLoading(true);
    try {
      // 动态导入 excel 工具
      const { exportExcel } = await import("../utils/excel");

      const data = await section.onExport?.();
      if (data && data.length > 0) {
        const exportData = section.exportFormatter
          ? section.exportFormatter(data)
          : data;
        const filename = section.exportFilename || "export.xlsx";

        // 将 JSON 数据转换为二维数组格式
        const headers = Object.keys(exportData[0] || {});
        const sheetData = [
          headers,
          ...exportData.map((row) => headers.map((header) => row[header])),
        ];

        exportExcel(
          [
            {
              name: "Sheet1",
              data: sheetData,
            },
          ],
          filename,
        );
        message.success("导出成功");
      } else {
        message.warning("没有数据可导出");
      }
      setLoading(false);
    } catch (error) {
      message.error("导出失败：" + (error as Error).message);
      setLoading(false);
    }
  };

  // 更新文件列表
  const updateFileList = (sectionIndex: number, fileList: UploadFile[]) => {
    setFileLists((prev) => ({ ...prev, [sectionIndex]: fileList }));
  };

  return (
    <Modal
      title="批量导入/导出"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
    >
      <div>
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            <div style={{ marginBottom: 24 }}>
              <Text
                strong
                style={{ fontSize: 16, display: "block", marginBottom: 12 }}
              >
                {section.icon || <FileExcelOutlined />} {section.title}
              </Text>
              <Space direction="vertical" style={{ width: "100%" }}>
                {section.onImport && (
                  <Space wrap>
                    {section.importTemplate &&
                      section.importTemplateFilename && (
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={() =>
                            downloadTemplate(
                              section.importTemplate!,
                              section.importTemplateFilename!,
                            )
                          }
                          size="small"
                        >
                          下载模板
                        </Button>
                      )}
                    <Upload
                      fileList={fileLists[index] || []}
                      onChange={({ fileList }) =>
                        updateFileList(index, fileList)
                      }
                      beforeUpload={() => false}
                      accept=".xlsx,.xls"
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} size="small">
                        选择文件
                      </Button>
                    </Upload>
                    <Button
                      type="primary"
                      icon={<ImportOutlined />}
                      onClick={() => handleImport(index, section)}
                      loading={loading}
                      disabled={!fileLists[index]?.length}
                      size="small"
                    >
                      {section.importButtonText || "导入"}
                    </Button>
                  </Space>
                )}
                {section.onExport && (
                  <Button
                    icon={<ExportOutlined />}
                    onClick={() => handleExport(section)}
                    loading={loading}
                    size="small"
                  >
                    {section.exportButtonText || "导出"}
                  </Button>
                )}
              </Space>
            </div>
            {index < sections.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </div>
    </Modal>
  );
};

export default BatchImportExport;
