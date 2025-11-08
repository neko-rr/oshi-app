import base64
import io
from typing import Optional

from PIL import Image
from pyzbar.pyzbar import decode as decode_barcode


def decode_from_base64(contents: str) -> Optional[dict]:
    """Decode barcode information from a dash upload base64 string."""
    try:
        content_header, content_string = contents.split(",", 1)
        decoded = base64.b64decode(content_string)
    except Exception as exc:
        raise ValueError("画像の解析に失敗しました。別の写真でお試しください。") from exc

    try:
        with Image.open(io.BytesIO(decoded)) as pil_image:
            pil_image = pil_image.convert("L")
            max_dim = 640
            if max(pil_image.size) > max_dim:
                pil_image.thumbnail((max_dim, max_dim), Image.LANCZOS)

            attempts = [pil_image.copy()]
            try:
                attempts.append(pil_image.transpose(Image.FLIP_LEFT_RIGHT))
            except Exception:
                pass

            try:
                attempts.append(pil_image.rotate(90, expand=True))
                attempts.append(pil_image.rotate(180, expand=True))
                attempts.append(pil_image.rotate(270, expand=True))
            except Exception:
                pass

            barcodes = []
            for attempt in attempts:
                try:
                    barcodes = decode_barcode(attempt)
                    if barcodes:
                        break
                finally:
                    if attempt is not pil_image:
                        attempt.close()
            attempts[0].close()

        if not barcodes:
            return None

        barcode = barcodes[0]
        return {
            "barcode": barcode.data.decode("utf-8"),
            "barcode_type": barcode.type,
        }
    finally:
        del decoded
