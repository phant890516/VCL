export class GyroService {
    /**
     * ジャイロセンサーからのデータを処理する
     * @param {Object} data - バリデーション対象のデータ
     * @returns {Object} 処理済みデータ
     */
    processGyroData(data) {
        // バリデーション: angleが含まれているか
        if (!data || typeof data.angle !== 'number') {
            throw new Error('Invalid data format: angle is required');
        }

        // 必要に応じてデータを加工（例: 値の制限など）
        // ここではそのままオブジェクトを再構成して返す
        return {
            id: data.id || 'unknown',
            angle: data.angle,
            timestamp: Date.now()
        };
    }
}
