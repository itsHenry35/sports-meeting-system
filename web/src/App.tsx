import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { AuthProvider } from "./contexts/AuthContext";
import { WebsiteProvider } from "./contexts/WebsiteContext";
import AppRouter from "./router/AppRouter";
import "./App.css";

// 打印项目信息：D
console.log(
  "%c🏫 运动会管理系统 %c  By Henry  %c  https://itshenryz.com/ ",
  "color: #fff; background: #4C80F8",
  "color: #fff; background: #3F3F3F",
  "",
);

console.log(
  "%c📞 Contact Me %c WeChat: itshenryz %c QQ: 2671230065 %c Email: zhr0305@outlook.com",
  "color: #fff; background: #4C80F8",
  "color: #fff; background: #3F3F3F",
  "color: #fff; background: #3F3F3F",
  "color: #fff; background: #3F3F3F",
);

console.log(
  "%c💻 GitHub %c https://github.com/itsHenry35/sports-meeting-system",
  "color: #fff; background: #4C80F8",
  "",
);

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <BrowserRouter>
        <WebsiteProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </WebsiteProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
