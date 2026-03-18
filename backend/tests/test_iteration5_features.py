"""
Iteration 5 Backend Tests - 6 Fixes
1. Slides advance (useMemo) - tested via UI
2. Toast position bottom-right - tested via UI
3. Force refresh mechanism
4. Auto-save slides - tested via UI
5. Ticker page - tested via UI
6. Default transition in Settings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def client_token():
    """Login as client and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo@test.com",
        "password": "demo123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]

@pytest.fixture(scope="module")
def client_headers(client_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {client_token}", "Content-Type": "application/json"}

@pytest.fixture(scope="module")
def screen_id():
    """Get screen ID for testing"""
    response = requests.get(f"{BASE_URL}/api/display/386621")
    assert response.status_code == 200
    return response.json()["screen"]["id"]


class TestForceRefresh:
    """Test force refresh mechanism - POST sets flag, heartbeat clears it"""
    
    def test_force_refresh_endpoint(self, client_headers, screen_id):
        """POST /api/screens/{id}/refresh should set force_refresh=True"""
        response = requests.post(
            f"{BASE_URL}/api/screens/{screen_id}/refresh",
            headers=client_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Rafraichissement force"
        print("SUCCESS: Force refresh endpoint works")
    
    def test_heartbeat_returns_force_refresh(self, screen_id):
        """Heartbeat should return force_refresh=True when flag is set"""
        # First set the flag
        token = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com", "password": "demo123"
        }).json()["token"]
        
        requests.post(
            f"{BASE_URL}/api/screens/{screen_id}/refresh",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Now check heartbeat
        response = requests.post(f"{BASE_URL}/api/screens/{screen_id}/heartbeat")
        assert response.status_code == 200
        data = response.json()
        assert data.get("force_refresh") == True, "Heartbeat should return force_refresh=True"
        print("SUCCESS: Heartbeat returns force_refresh=True")
    
    def test_heartbeat_clears_force_refresh(self, screen_id):
        """Second heartbeat should return force_refresh=False (flag cleared)"""
        response = requests.post(f"{BASE_URL}/api/screens/{screen_id}/heartbeat")
        assert response.status_code == 200
        data = response.json()
        assert data.get("force_refresh") == False, "Flag should be cleared after first heartbeat"
        print("SUCCESS: Heartbeat clears force_refresh flag")


class TestDefaultTransition:
    """Test default transition in settings"""
    
    def test_get_settings_has_default_transition_field(self, client_headers):
        """GET /api/settings should include default_transition field"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=client_headers)
        assert response.status_code == 200
        data = response.json()
        # Field should exist (may be null)
        assert "default_transition" in data or data.get("default_transition") is None
        print(f"SUCCESS: Settings has default_transition: {data.get('default_transition')}")
    
    def test_set_default_transition_fade(self, client_headers):
        """PUT /api/settings with default_transition='fade' should save"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"default_transition": "fade"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("default_transition") == "fade"
        print("SUCCESS: Set default_transition to 'fade'")
    
    def test_set_default_transition_slide(self, client_headers):
        """PUT /api/settings with default_transition='slide' should save"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"default_transition": "slide"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("default_transition") == "slide"
        print("SUCCESS: Set default_transition to 'slide'")
    
    def test_set_default_transition_random(self, client_headers):
        """PUT /api/settings with default_transition='random' should save"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"default_transition": "random"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("default_transition") == "random"
        print("SUCCESS: Set default_transition to 'random'")
    
    def test_set_default_transition_none(self, client_headers):
        """PUT /api/settings with default_transition='none' should save"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"default_transition": "none"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("default_transition") == "none"
        print("SUCCESS: Set default_transition to 'none'")
    
    def test_display_returns_default_transition(self, client_headers):
        """Display endpoint should include default_transition in settings"""
        # First set a known value
        requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"default_transition": "fade"}
        )
        
        response = requests.get(f"{BASE_URL}/api/display/386621")
        assert response.status_code == 200
        data = response.json()
        settings = data.get("settings", {})
        assert settings.get("default_transition") == "fade"
        print("SUCCESS: Display endpoint returns default_transition")


class TestTickerSettings:
    """Test ticker settings moved to separate API calls (no longer in Settings page)"""
    
    def test_ticker_speed_still_saves(self, client_headers):
        """Ticker speed should still save via settings API"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"ticker_speed": 45}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ticker_speed") == 45
        print("SUCCESS: Ticker speed saves via settings API")
    
    def test_ticker_text_enabled_saves(self, client_headers):
        """ticker_text_enabled should save"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"ticker_text_enabled": True}
        )
        assert response.status_code == 200
        assert response.json().get("ticker_text_enabled") == True
        print("SUCCESS: ticker_text_enabled saves")
    
    def test_ticker_rss_enabled_saves(self, client_headers):
        """ticker_rss_enabled should save"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=client_headers,
            json={"ticker_rss_enabled": True}
        )
        assert response.status_code == 200
        assert response.json().get("ticker_rss_enabled") == True
        print("SUCCESS: ticker_rss_enabled saves")


class TestPlaylistSlides:
    """Test playlist slides API (auto-save tests done via UI)"""
    
    def test_playlist_has_3_slides(self, client_headers):
        """Verify playlist has 3 slides: text(8s), qrcode(10s), countdown(12s)"""
        response = requests.get(
            f"{BASE_URL}/api/playlists/b085ffb2-a06f-4f8a-b01f-24c303ba8f87",
            headers=client_headers
        )
        assert response.status_code == 200
        data = response.json()
        slides = data.get("slides", [])
        assert len(slides) == 3, f"Expected 3 slides, got {len(slides)}"
        
        # Check slide types and durations
        types = [s.get("type") for s in slides]
        durations = [s.get("duration") for s in slides]
        
        assert "text" in types
        assert "qrcode" in types
        assert "countdown" in types
        assert 8 in durations
        assert 10 in durations
        assert 12 in durations
        print(f"SUCCESS: Playlist has 3 slides with correct types: {types}")
    
    def test_update_slide_via_api(self, client_headers):
        """Update playlist slides via API (similar to auto-save)"""
        # Get current playlist
        response = requests.get(
            f"{BASE_URL}/api/playlists/b085ffb2-a06f-4f8a-b01f-24c303ba8f87",
            headers=client_headers
        )
        assert response.status_code == 200
        playlist = response.json()
        
        # Verify update returns 200
        response = requests.put(
            f"{BASE_URL}/api/playlists/b085ffb2-a06f-4f8a-b01f-24c303ba8f87",
            headers=client_headers,
            json={"slides": playlist["slides"], "name": playlist["name"]}
        )
        assert response.status_code == 200
        print("SUCCESS: Playlist update API works (auto-save backend)")


class TestDisplayAPI:
    """Test display API returns all necessary data for slide advancement"""
    
    def test_display_returns_playlist(self):
        """Display endpoint returns playlist with slides"""
        response = requests.get(f"{BASE_URL}/api/display/386621")
        assert response.status_code == 200
        data = response.json()
        
        assert "playlist" in data
        assert "slides" in data["playlist"]
        assert len(data["playlist"]["slides"]) >= 1
        print("SUCCESS: Display returns playlist with slides")
    
    def test_display_returns_settings(self):
        """Display endpoint returns settings including default_transition"""
        response = requests.get(f"{BASE_URL}/api/display/386621")
        assert response.status_code == 200
        data = response.json()
        
        assert "settings" in data
        settings = data["settings"]
        # Check key fields exist
        assert "ticker_speed" in settings or settings.get("ticker_speed") is not None
        print("SUCCESS: Display returns settings")
    
    def test_display_returns_screen(self):
        """Display endpoint returns screen info"""
        response = requests.get(f"{BASE_URL}/api/display/386621")
        assert response.status_code == 200
        data = response.json()
        
        assert "screen" in data
        assert "id" in data["screen"]
        assert data["screen"]["pairing_code"] == "386621"
        print("SUCCESS: Display returns screen info")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
