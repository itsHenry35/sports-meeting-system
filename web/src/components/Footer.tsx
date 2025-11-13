import { Layout, Space } from "antd";
import { useWebsite } from "../contexts/WebsiteContext";

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  const { icp_beian, public_sec_beian } = useWebsite();

  // 如果两个备案信息都为空，不显示页脚
  if (!icp_beian && !public_sec_beian) {
    return null;
  }

  // 从公安备案信息中提取代码
  const extractPsbCode = (beianText: string) => {
    const match = beianText.match(/\d+/g);
    return match ? match.join("") : "";
  };

  return (
    <AntFooter
      style={{
        textAlign: "center",
        padding: "15px 50px",
        color: "#666",
        fontSize: "14px",
        background: "transparent",
        height: "auto",
      }}
    >
      <Space size={24}>
        {icp_beian && (
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#666", fontWeight: "normal" }}
          >
            {icp_beian}
          </a>
        )}
        {public_sec_beian && (
          <a
            href={`https://beian.mps.gov.cn/#/query/webSearch?code=${extractPsbCode(public_sec_beian)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#666",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <img
              src="https://www.beian.gov.cn/img/new/gongan.png"
              alt="公安备案图标"
              style={{ marginRight: "5px", height: "16px" }}
            />
            {public_sec_beian}
          </a>
        )}
      </Space>
    </AntFooter>
  );
};

export default Footer;
