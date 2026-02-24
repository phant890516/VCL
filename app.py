

import cv2
import numpy as np
import time
from PIL import Image, ImageDraw, ImageFont

def draw_text_ja(img, text_list, pos, color=(0,255,0), font_size=24):
    img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)
    font = None
    for path in ["C:/Windows/Fonts/meiryo.ttc","C:/Windows/Fonts/msgothic.ttc","C:/Windows/Fonts/arial.ttf"]:
        try:
            font = ImageFont.truetype(path, font_size)
            break
        except IOError:
            pass
    if font is None:
        font = ImageFont.load_default()

    x,y = pos
    for t in text_list:
        draw.text((x+1,y+1), t, font=font, fill=(0,0,0))
        draw.text((x,y), t, font=font, fill=color)
        y += font_size + 5
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

def clamp_box(x1,y1,x2,y2,w,h):
    x1 = max(0, min(w-1, int(x1)))
    y1 = max(0, min(h-1, int(y1)))
    x2 = max(1, min(w,   int(x2)))
    y2 = max(1, min(h,   int(y2)))
    if x2 <= x1: x2 = min(w, x1+1)
    if y2 <= y1: y2 = min(h, y1+1)
    return x1,y1,x2,y2

def box_from_center(cx,cy,bw,bh,dx,dy):
    cx2, cy2 = cx+dx, cy+dy
    return (cx2-bw/2, cy2-bh/2, cx2+bw/2, cy2+bh/2)

def flip_x(x, w):
    return (w - 1) - x

def flip_corners(corners4x2, w):
    c = corners4x2.copy()
    c[:, 0] = (w - 1) - c[:, 0]
    return c

def detect():
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_APRILTAG_36h11)
    params = cv2.aruco.DetectorParameters()
    detector = cv2.aruco.ArucoDetector(dictionary, params)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("カメラ開けません")
        return

    # --- タグID ---
    TUBE_TAG_ID  = 0   # 試験管側
    FLASK_TAG_ID = 1   # フラスコ側

    # --- 「注げる」判定：2タグ中心の距離（ピクセル） ---
    # まず適当な値。画面下に dist_px を出すので、現物で , . で調整して合わせる。
    DIST_THRESH_PX = 200
    HOLD_SEC = 0.15       # 最初は短めにして反応見る。

    # 連続でOKになってから確定する秒数（チャタリング対策）
    HOLD_SEC = 0.30
    near_started = None
    near_stable = False

    # 表示だけミラー補正する（検出は生(raw)）
    DISPLAY_FIX_MIRROR = True

    while True:
        ret, raw = cap.read()
        if not ret:
            break

        h, w = raw.shape[:2]

        # --- 検出は raw（反転しない）でやる ---
        gray = cv2.cvtColor(raw, cv2.COLOR_BGR2GRAY)
        corners, ids, rej = detector.detectMarkers(gray)

        # --- 表示用の画像を用意（必要ならここでだけ反転） ---
        vis = cv2.flip(raw, 1) if DISPLAY_FIX_MIRROR else raw.copy()

        texts = []

        if ids is None:
            texts.append("AprilTag not found")
            near_started = None
            near_stable = False
        else:
            # 表示が反転してるなら、描画用 corners も反転させる
            if DISPLAY_FIX_MIRROR:
                corners_draw = []
                for c in corners:
                    pts = c[0]  # (4,2)
                    pts_f = flip_corners(pts, w)
                    corners_draw.append(pts_f.reshape(1, 4, 2))
            else:
                corners_draw = corners

            cv2.aruco.drawDetectedMarkers(vis, corners_draw, ids)

            # --- 2つのタグ（試験管/フラスコ）を探す ---
            idx_tube = None
            idx_flask = None
            for i, tag_id in enumerate(ids):
                tid = int(tag_id[0])
                if tid == TUBE_TAG_ID:
                    idx_tube = i
                elif tid == FLASK_TAG_ID:
                    idx_flask = i

            if idx_tube is None or idx_flask is None:
                texts.append(f"Need both tags: tube={idx_tube is not None}, flask={idx_flask is not None}")
                near_started = None
                near_stable = False

                # どれか片方だけでも中心点表示したいなら、ここで描画してもOK
            else:
                # raw のタグ中心（検出座標）
                pts_t_raw = corners[idx_tube][0]
                cx_t_raw = float(np.mean(pts_t_raw[:, 0]))
                cy_t_raw = float(np.mean(pts_t_raw[:, 1]))

                pts_f_raw = corners[idx_flask][0]
                cx_f_raw = float(np.mean(pts_f_raw[:, 0]))
                cy_f_raw = float(np.mean(pts_f_raw[:, 1]))

                # 表示側中心（ミラーならXだけ反転）
                if DISPLAY_FIX_MIRROR:
                    cx_t = flip_x(cx_t_raw, w); cy_t = cy_t_raw
                    cx_f = flip_x(cx_f_raw, w); cy_f = cy_f_raw
                else:
                    cx_t, cy_t = cx_t_raw, cy_t_raw
                    cx_f, cy_f = cx_f_raw, cy_f_raw

                # 中心点描画（tube=青, flask=赤）
                cv2.circle(vis, (int(cx_t), int(cy_t)), 6, (255,0,0), -1)
                cv2.circle(vis, (int(cx_f), int(cy_f)), 6, (0,0,255), -1)
                cv2.line(vis, (int(cx_t), int(cy_t)), (int(cx_f), int(cy_f)), (0,255,255), 2)

                # 距離（ピクセル）
                # 上下関係（フラスコが上に来たら注がない）
                FLASK_MUST_BE_BELOW_TUBE = True

                dist_px = float(np.hypot(cx_t - cx_f, cy_t - cy_f))

                # フラスコより下は排除
                if FLASK_MUST_BE_BELOW_TUBE and (cy_f < cy_t):
                    ok_now = False
                    texts.append("NG: flask is above tube")
                else:
                    ok_now = (dist_px <= DIST_THRESH_PX)

                # 安定化（一定時間連続でOKなら確定）
                now = time.time()
                if ok_now:
                    if near_started is None:
                        near_started = now
                    if (now - near_started) >= HOLD_SEC:
                        near_stable = True
                else:
                    near_started = None
                    near_stable = False

                # 画面表示
                msg = "POUR_OK" if near_stable else "MOVE_CLOSER"
                color = (0,255,0) if near_stable else (0,0,255)

                cv2.putText(
                    vis,
                    f"{msg}  dist_px={dist_px:.1f} thr={DIST_THRESH_PX:.1f}",
                    (10, h-20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    color,
                    2
                )

                texts.append(f"tube_id={TUBE_TAG_ID} flask_id={FLASK_TAG_ID}")
                texts.append(f"dist_px={dist_px:.1f} thr={DIST_THRESH_PX:.1f}")
                texts.append(f"pour_ok={near_stable}")

        # 文字（日本語OK）
        vis = draw_text_ja(vis, texts, (10,10), (0,255,0))
        cv2.imshow("AprilTag + PourDistance", vis)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:
            break
        elif key == ord('m'):
            DISPLAY_FIX_MIRROR = not DISPLAY_FIX_MIRROR

        # 距離しきい値の調整（現物合わせ）
        elif key == ord(','):
            DIST_THRESH_PX = max(10, DIST_THRESH_PX - 5)
        elif key == ord('.'):
            DIST_THRESH_PX = min(500, DIST_THRESH_PX + 5)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    detect()
