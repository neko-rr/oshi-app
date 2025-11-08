import base64
import io
from typing import Optional

from PIL import Image
from pyzbar.pyzbar import decode as decode_barcode


def decode_from_base64(contents: str) -> Optional[dict]:
    """Decode barcode information from a dash upload base64 string."""
    try:
        content_header, content_string = contents.split(",")
        mime_type = content_header.replace("data:", "").split(";")[0]
        decoded = base64.b64decode(content_string)
        image = Image.open(io.BytesIO(decoded))
    except Exception as exc:
        raise ValueError("画像の解析に失敗しました。別の写真でお試しください。") from exc

    # 複数パスでデコード精度を上げる
    attempts = []
    try:
        attempts.append(image)
    except Exception:
        pass
    try:
        attempts.append(image.convert("L"))  # グレースケール
    except Exception:
        pass
    try:
        w, h = image.size
        attempts.append(image.resize((int(w * 1.8), int(h * 1.8))))  # 拡大
    except Exception:
        pass
    try:
        attempts.append(image.rotate(90, expand=True))  # 回転
        attempts.append(image.rotate(180, expand=True))
        attempts.append(image.rotate(270, expand=True))
    except Exception:
        pass

    barcodes = []
    for img in attempts:
        try:
            barcodes = decode_barcode(img)
            if barcodes:
                break
        except Exception:
            continue

    if not barcodes:
        return None

    barcode = barcodes[0]
    return {
        "barcode": barcode.data.decode("utf-8"),
        "barcode_type": barcode.type,
        "image_bytes": decoded,
        "content_type": mime_type,
    }
