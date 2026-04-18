"""保存処理のシンボル存在確認（旧 app.save_registration 呼び出しは廃止）。"""

from services import registration_service


def test_save_registration_is_exported():
    assert hasattr(registration_service, "save_registration")
    assert callable(registration_service.save_registration)
