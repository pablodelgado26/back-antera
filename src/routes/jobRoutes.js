import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  deactivateJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
} from "../controllers/jobController.js";

const router = Router();

// Rotas de vagas
router.post("/", authMiddleware, createJob);
router.get("/", authMiddleware, getAllJobs);
router.get("/:id", authMiddleware, getJobById);
router.put("/:id", authMiddleware, updateJob);
router.delete("/:id", authMiddleware, deleteJob);
router.patch("/:id/deactivate", authMiddleware, deactivateJob);

// Rotas de candidaturas
router.post("/:id/apply", applyToJob); // Não requer autenticação
router.get("/:id/applications", authMiddleware, getJobApplications);
router.patch(
  "/:jobId/applications/:applicationId",
  authMiddleware,
  updateApplicationStatus,
);

export default router;
