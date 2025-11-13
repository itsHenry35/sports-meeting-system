import { useState } from "react";
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Divider,
  Alert,
} from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWebsite } from "../../contexts/WebsiteContext";
import { handleRespWithoutAuthButNotifySuccess } from "../../utils";
import { authAPI } from "../../api/auth";
import Footer from "../../components/Footer";

const { Content } = Layout;
const { Title, Link } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { name: websiteName, dingtalk_corp_id } = useWebsite();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (values: LoginForm) => {
    // 前端验证
    if (!values.username || !values.username.trim()) {
      setError("请输入用户名");
      return;
    }
    if (!values.password || !values.password.trim()) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await authAPI.login(values);

    handleRespWithoutAuthButNotifySuccess(
      response,
      (data) => {
        // 成功回调 - 会自动显示成功消息
        login(data.user, data.token);
        // 根据用户角色跳转
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/student");
        }
        setLoading(false);
      },
      (message) => {
        // 失败回调 - 会自动显示错误消息
        setError(message);
        setLoading(false);
      },
    );
  };

  const handleDingTalkLogin = () => {
    if (!dingtalk_corp_id) {
      const errorMessage = "钉钉登录未配置，请使用账号密码登录";
      setError(errorMessage);
      return;
    }

    // 清除错误状态
    setError(null);
    // 跳转到钉钉登录页面
    navigate("/auth/dingtalk");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "40px" }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Title
              level={2}
              style={{
                color: "#1677ff",
                marginBottom: "8px",
                whiteSpace: "nowrap",
                fontSize: "clamp(24px, 5vw, 28px)",
              }}
            >
              {websiteName}
            </Title>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: "24px" }}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
          >
            <Form.Item name="username">
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item name="password">
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: "16px" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<LoginOutlined />}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          {dingtalk_corp_id && (
            <>
              <Divider>或</Divider>
              <Button
                block
                size="large"
                onClick={handleDingTalkLogin}
                disabled={loading}
                style={{
                  background: "#0089FF",
                  borderColor: "#0089FF",
                  color: "#fff",
                }}
              >
                钉钉登录
              </Button>
            </>
          )}

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Space direction="vertical" size={8}>
              <Link onClick={() => navigate("/")}>返回成绩看板</Link>
            </Space>
          </div>
        </Card>
      </Content>

      <Footer />
    </Layout>
  );
};

export default Login;
