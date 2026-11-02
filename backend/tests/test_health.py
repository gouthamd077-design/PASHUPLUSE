def test_root_endpoint(client):
    """Verify that root endpoint returns 200 and application info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "PASHU PULSE" in data["app"]


def test_health_check_endpoint(client):
    """Verify that health check endpoint returns healthy status and timestamp."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
