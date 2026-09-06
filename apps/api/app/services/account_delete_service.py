"""退会・全データ削除（Storage 掃除 → Auth ユーザー削除）。"""

from __future__ import annotations

from app.infra.supabase_admin import (
    AdminNotConfiguredError,
    delete_auth_user,
    purge_member_storage,
)


class AccountDeleteUnavailableError(RuntimeError):
    """秘密鍵未設定などで退会 API が使えない。"""


class AccountDeleteFailedError(RuntimeError):
    """Storage または Auth 削除に失敗。"""


def delete_account_for_member(*, members_id: str) -> None:
    """本人の Storage を消してから Auth ユーザーを削除する。

    members_id は呼び出し元が JWT sub のみ渡すこと。
    """
    mid = (members_id or "").strip()
    if not mid:
        raise ValueError("members_id が空です")

    try:
        purge_member_storage(mid)
        delete_auth_user(mid)
    except AdminNotConfiguredError as exc:
        raise AccountDeleteUnavailableError(
            "退会機能のサーバー設定が不足しています"
        ) from exc
    except ValueError:
        raise
    except RuntimeError as exc:
        raise AccountDeleteFailedError(str(exc)) from exc
