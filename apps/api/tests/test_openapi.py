from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_openapi_lists_expected_paths() -> None:
    res = client.get("/openapi.json")
    assert res.status_code == 200
    paths = res.json()["paths"]
    assert "/health" in paths
    assert "/me" in paths
    assert "/products" in paths
