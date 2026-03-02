/**
 * ファイル名: backend/src/controllers/gyroController.js
 * 概要: ジャイロセンサーデータ処理コントローラー
 * 役割:
 *   - ジャイロデータの受信と簡易処理（主にHTTP経由の場合）
 *   - Joy-Con以外の入力ソース拡張用
 * アーキテクチャ: Controller層
 */
import { GyroService } from '../services/gyroService.js';

export class GyroController {
    constructor() {
        this.gyroService = new GyroService();
    }

    /**
     * ジャイロデータを受信し、Socket.io経由でブロードキャストする
     */
    handleGyroData = (req, res) => {
        try {
            const processedData = this.gyroService.processGyroData(req.body);

            // app.set('io', io) で保存された Socket.io インスタンスを取得
            const io = req.app.get('io');
            if (io) {
                // クライアント全員に送信
                console.log('Broadcasting gyro data:', processedData);
                io.emit('gyro-data', processedData);
            }

            res.status(200).json({ status: 'success', data: processedData });
        } catch (error) {
            console.error('Gyro processing error:', error);
            res.status(400).json({ error: error.message });
        }
    }
}
