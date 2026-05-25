import express from 'express';
import { SchoolController } from '../controllers/schoolController.js';
import { requireStudent, requireTeacher } from '../middleware/schoolAuth.js';

const router = express.Router();
const controller = new SchoolController();

// 先生用: Supabase Authのアクセストークンが必要。
router.get('/teacher/me', requireTeacher, (req, res) => controller.getTeacherProfile(req, res));
router.get('/teacher/classes', requireTeacher, (req, res) => controller.listClasses(req, res));
router.post('/teacher/classes', requireTeacher, (req, res) => controller.createClass(req, res));
router.get('/teacher/classes/:classId/students', requireTeacher, (req, res) => controller.listStudents(req, res));
router.post('/teacher/classes/:classId/students', requireTeacher, (req, res) => controller.createStudent(req, res));
router.get('/teacher/classes/:classId/progress', requireTeacher, (req, res) => controller.getClassProgressBoard(req, res));

// 生徒用: 生徒IDログインで発行されたVCL独自JWTが必要。
router.post('/students/login', (req, res) => controller.loginStudent(req, res));
router.post('/students/change-password', requireStudent, (req, res) => controller.changeStudentPassword(req, res));
router.post('/students/progress', requireStudent, (req, res) => controller.recordStudentProgress(req, res));
router.post('/students/trophies', requireStudent, (req, res) => controller.unlockStudentTrophy(req, res));

export default router;
