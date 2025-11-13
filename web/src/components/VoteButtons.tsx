import React from "react";
import { VoteType } from "../types";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import "./VoteButtons.css";

interface VoteButtonsProps {
  voteCount: number;
  userVote?: VoteType | null;
  onVote?: (voteType: VoteType) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

const VoteButtons: React.FC<VoteButtonsProps> = ({
  voteCount,
  userVote,
  onVote,
  disabled = false,
  size = "medium",
}) => {
  const handleUpvote = () => {
    if (!disabled && onVote) {
      onVote(VoteType.Up);
    }
  };

  const handleDownvote = () => {
    if (!disabled && onVote) {
      onVote(VoteType.Down);
    }
  };

  const isUpvoted = userVote === VoteType.Up;
  const isDownvoted = userVote === VoteType.Down;

  return (
    <div className={`vote-buttons vote-buttons-${size}`}>
      <button
        className={`vote-button upvote ${isUpvoted ? "active" : ""} ${disabled ? "disabled" : ""}`}
        onClick={handleUpvote}
        disabled={disabled}
        title={disabled ? "" : "赞成"}
      >
        <UpOutlined />
      </button>
      <div
        className={`vote-count ${voteCount > 0 ? "positive" : voteCount < 0 ? "negative" : ""}`}
      >
        {voteCount}
      </div>
      <button
        className={`vote-button downvote ${isDownvoted ? "active" : ""} ${disabled ? "disabled" : ""}`}
        onClick={handleDownvote}
        disabled={disabled}
        title={disabled ? "" : "反对"}
      >
        <DownOutlined />
      </button>
    </div>
  );
};

export default VoteButtons;
