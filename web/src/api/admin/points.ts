import { api, callApi } from "../config";
import type {
  ApiResponse,
  ClassPointsSummary,
  StudentPointsSummary,
  PointDetail,
} from "../../types";

export const pointsAPI = {
  // 获取班级得分汇总
  getClassPointsSummary: async (): Promise<
    ApiResponse<ClassPointsSummary[]>
  > => {
    return await callApi(() => api.get("/admin/points/classes/summary"));
  },

  // 获取学生得分汇总
  getStudentPointsSummary: async (): Promise<
    ApiResponse<StudentPointsSummary[]>
  > => {
    return await callApi(() => api.get("/admin/points/students/summary"));
  },

  // 获取班级得分明细
  getClassPointDetails: async (
    classId: number,
  ): Promise<ApiResponse<PointDetail[]>> => {
    return await callApi(() =>
      api.get(`/admin/points/classes/${classId}/details`),
    );
  },

  // 获取学生得分明细
  getStudentPointDetails: async (
    studentId: number,
  ): Promise<ApiResponse<PointDetail[]>> => {
    return await callApi(() =>
      api.get(`/admin/points/students/${studentId}/details`),
    );
  },

  // 添加自定义得分
  addCustomPointsToClass: async (
    classId: number,
    points: number,
    reason: string,
  ): Promise<ApiResponse> => {
    return await callApi(() =>
      api.post("/admin/points/classes/custom", {
        class_id: classId,
        points,
        reason,
      }),
    );
  },

  // 删除自定义得分
  deleteCustomPoint: async (pointId: number): Promise<ApiResponse> => {
    return await callApi(() => api.delete(`/admin/points/custom/${pointId}`));
  },
};
