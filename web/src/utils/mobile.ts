import { useState, useEffect } from "react";

/**
 * 自定义 Hook，用于检测当前设备是否为移动端
 * @param breakpoint 断点值，默认为 768px
 * @returns boolean 是否为移动端
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(() => {
    // 服务端渲染兼容处理
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // 初始检查
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener("resize", checkMobile);

    // 清理监听器
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
};

/**
 * 工具函数，用于检测当前设备是否为移动端（非响应式）
 * @param breakpoint 断点值，默认为 768px
 * @returns boolean 是否为移动端
 */
export const IsMobile = (breakpoint: number = 768): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth <= breakpoint;
};
