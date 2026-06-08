import { SchoolService } from '../services/schoolService.js';

function createService() {
    // リクエストごとにServiceを作り、Supabaseクライアントの参照を閉じ込める。
    return new SchoolService();
}

export class SchoolController {
    async getTeacherProfile(req, res) {
        // requireTeacherで検証済みの先生プロフィールを返す。
        res.json({ teacher: req.teacher });
    }

    async listClasses(req, res) {
        try {
            // 先生本人が所有するクラスだけを一覧化する。
            const classes = await createService().listClasses(req.teacher.id);
            res.json({ classes });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async createClass(req, res) {
        try {
            // クラスコードはService側で重複しないように生成する。
            const klass = await createService().createClass(req.teacher.id, req.body.name);
            res.status(201).json({ class: klass });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async listStudents(req, res) {
        try {
            // classIdが先生本人のクラスかどうかはService側で検証する。
            const students = await createService().listStudents(req.teacher.id, req.params.classId);
            res.json({ students });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async createStudent(req, res) {
        try {
            // 先生が配布する生徒IDと初期パスワードを発行する。
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
            // 先生画面で使いやすい形に整形した進捗ボードを返す。
            const board = await createService().getClassProgressBoard(req.teacher.id, req.params.classId);
            res.json(board);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async loginStudent(req, res) {
        try {
            // 生徒はSupabase Authを使わず、発行済みIDとパスワードでログインする。
            const result = await createService().loginStudent(req.body.loginId, req.body.password);
            res.json(result);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    }

    async changeStudentPassword(req, res) {
        try {
            // 初期パスワードのまま使い続けないよう、生徒自身に変更させる。
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
            // 生徒JWTから取得したstudentIdを使い、他人の進捗を更新できないようにする。
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
            // トロフィーも生徒JWTのstudentIdに紐づけて保存する。
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
