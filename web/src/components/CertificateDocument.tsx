import { jsPDF } from "jspdf";

export interface CertificateData {
  participantName: string;
  schoolName: string;
  eventName: string;
  competitionName: string;
  ranking: number;
  date: string;
  // 字体大小配置
  fontSize1: number;
  fontSize2: number;
  fontSize3: number;
  fontSizeSchool: number;
  fontSizeDate: number;
  // Y坐标配置
  yPosition1: number;
  yPosition2: number;
  yPosition3: number;
  yPositionSchool: number;
  yPositionDate: number;
}

export const generateCertificatePDF = async (
  certificates: CertificateData[],
): Promise<Blob> => {
  // 创建 PDF 文档 (A4 横向, 单位: mm)
  // A4 横向: 297mm × 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // 加载字体
  const fontUrl = "/SourceHanSansCN-Medium.ttf";
  const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());

  // 添加自定义字体
  const fontBase64 = arrayBufferToBase64(fontBytes);
  doc.addFileToVFS("SourceHanSansCN-Medium.ttf", fontBase64);
  doc.addFont("SourceHanSansCN-Medium.ttf", "SourceHanSansCN-Medium", "normal");
  doc.setFont("SourceHanSansCN-Medium", "normal");

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];

    // 如果不是第一页，添加新页
    if (i > 0) {
      doc.addPage();
    }

    // 设置文本颜色为黑色
    doc.setTextColor(0, 0, 0);

    // 第一行：参与者名称（班级+姓名）
    doc.setFontSize(cert.fontSize1);
    doc.text(cert.participantName, 24, cert.yPosition1);

    // 第二行：荣获 + 学校 + 年份 + 项目名称（居中）
    const line2Text = `荣获${cert.eventName}`;
    doc.setFontSize(cert.fontSize2);
    const line2Width = doc.getTextWidth(line2Text);
    doc.text(line2Text, (297 - line2Width) / 2, cert.yPosition2);

    // 第三行：项目 + 第X名（居中）
    const rankingText = cert.ranking.toString();
    const line3Text = `${cert.competitionName} 第${rankingText}名`;
    doc.setFontSize(cert.fontSize3);
    const line3Width = doc.getTextWidth(line3Text);
    doc.text(line3Text, (297 - line3Width) / 2, cert.yPosition3);

    // 颁发单位（右对齐）
    doc.setFontSize(cert.fontSizeSchool);
    const schoolNameWidth = doc.getTextWidth(cert.schoolName);
    doc.text(cert.schoolName, 273 - schoolNameWidth, cert.yPositionSchool);

    // 日期（右对齐）
    doc.setFontSize(cert.fontSizeDate);
    const dateWidth = doc.getTextWidth(cert.date);
    doc.text(cert.date, 273 - dateWidth, cert.yPositionDate);
  }

  // 返回 Blob
  return doc.output("blob");
};

// 辅助函数：将 ArrayBuffer 转换为 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
