import { SchoolService } from '../services/schoolService.js';

function createService() {
    return new SchoolService();
}

export class SchoolController {
    async getTeacherProfile(req, res) {
        res.json({ teacher: req.teacher });
    }

    async listClasses(req, res) {
        try {
            const classes = await createService().listClasses(req.teacher.id);
            res.json({ classes });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async createClass(req, res) {
        try {
            const klass = await createService().createClass(req.teacher.id, req.body.name);
            res.status(201).json({ class: klass });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async listStudents(req, res) {
        try {
            const students = await createService().listStudents(req.teacher.id, req.params.classId);
            res.json({ students });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async createStudent(req, res) {
        try {
            const student = await createService().createStudent(
                req.teacher.id,
                req.params.classId,
                req.body.displayName
            );
            res.status(201).json({ student });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getClassProgressBoard(req, res) {
        try {
            const board = await createService().getClassProgressBoard(req.teacher.id, req.params.classId);
            res.json(board);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async loginStudent(req, res) {
        try {
            const result = await createService().loginStudent(req.body.loginId, req.body.password);
            res.json(result);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    }

    async changeStudentPassword(req, res) {
        try {
            const result = await createService().changeStudentPassword(
                req.studentAuth.studentId,
                req.body.currentPassword,
                req.body.newPassword
            );
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async recordStudentProgress(req, res) {
        try {
            const progress = await createService().recordStudentProgress(
                req.studentAuth.studentId,
                req.body.experimentCode,
                req.body
            );
            res.status(201).json({ progress });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async unlockStudentTrophy(req, res) {
        try {
            const trophy = await createService().unlockStudentTrophy(
                req.studentAuth.studentId,
                req.body.trophyId
            );
            res.status(201).json({ trophy });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
