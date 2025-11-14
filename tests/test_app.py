import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Soccer Team" in data

def test_signup_and_remove_participant():
    activity = "Soccer Team"
    email = "testuser@mergington.edu"
    # Signup
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200 or response.status_code == 400
    # Remove
    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 200 or response.status_code == 404

def test_signup_duplicate():
    activity = "Soccer Team"
    email = "lucas@mergington.edu"  # already registered
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json().get("detail", "")

def test_remove_nonexistent_participant():
    activity = "Soccer Team"
    email = "nonexistent@mergington.edu"
    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 404
    assert "not found" in response.json().get("detail", "")
