import { Tag } from "antd";

export const getStatusTag = (status: string) => {
  const statusMap = {
    pending_approval: { color: "orange", text: "待审核" },
    approved: { color: "blue", text: "已审核" },
    rejected: { color: "red", text: "已拒绝" },
    pending_score_review: { color: "gold", text: "待审核成绩" },
    completed: { color: "green", text: "已完成" },
  };

  const config = statusMap[status as keyof typeof statusMap];
  return <Tag color={config?.color}>{config?.text || status}</Tag>;
};

export const getGenderText = (gender: number | undefined) => {
  if (gender === undefined || gender === null) return "未知";
  const genderMap = { 1: "男子", 2: "女子", 3: "不限" };
  return genderMap[gender as keyof typeof genderMap] || "未知";
};

export const getGenderTag = (gender: number | undefined) => {
  if (gender === undefined || gender === null) {
    return <Tag color="default">未知</Tag>;
  }

  const genderConfig = {
    1: { color: "blue", text: "男" },
    2: { color: "pink", text: "女" },
    3: { color: "purple", text: "不限" },
  };

  const config = genderConfig[gender as keyof typeof genderConfig];
  return <Tag color={config?.color}>{config?.text || "未知"}</Tag>;
};

export const getRankingModeText = (rankingMode: string) => {
  return rankingMode === "higher_first" ? "分数越高越好" : "分数越低越好";
};

export const getRankingDisplay = (ranking?: number) => {
  if (!ranking) return "-";

  if (ranking <= 3) {
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <span style={{ color: colors[ranking - 1], fontWeight: "bold" }}>
        {medals[ranking - 1]} 第{ranking}名
      </span>
    );
  }
  return `第${ranking}名`;
};

export const getRankingDisplayForTable = (ranking?: number) => {
  if (!ranking) return "-";

  if (ranking <= 3) {
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: "16px" }}>{medals[ranking - 1]}</span>
        <span style={{ color: colors[ranking - 1], fontWeight: "bold" }}>
          {ranking}
        </span>
      </div>
    );
  }
  return `第${ranking}名`;
};

export const getRankingColor = (ranking?: number) => {
  if (!ranking) return "#666";
  if (ranking === 1) return "#FFD700";
  if (ranking === 2) return "#C0C0C0";
  if (ranking === 3) return "#CD7F32";
  return "#1677ff";
};

export const getWinningCount = (scores?: Array<{ ranking?: number }>) => {
  return scores?.filter((s) => s.ranking && s.ranking <= 3).length || 0;
};

export const getBestRanking = (scores?: Array<{ ranking?: number }>) => {
  const rankings = scores?.filter((s) => s.ranking).map((s) => s.ranking ?? 0);
  return rankings && rankings.length > 0 ? Math.min(...rankings) : null;
};

export const getCompetitionTypeTag = (competitionType: string) => {
  const typeMap = {
    individual: { color: "blue", text: "个人赛" },
    team: { color: "purple", text: "团体赛" },
  };

  const config = typeMap[competitionType as keyof typeof typeMap];
  return <Tag color={config?.color}>{config?.text || competitionType}</Tag>;
};
