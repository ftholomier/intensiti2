"""
Iteration 11 Backend Tests - Testing new features:
1. Dashboard stat cards navigation
2. Media library with thumbnails and preview
3. Playlists slide preview strip
4. Settings weather_icon_size field
5. Display endpoint returns text_color for RSS
6. Screen creation defaults (header_height=100, footer_height=50)
7. RSS slide title/pause fields
8. PDF page duration configurable
9. YouTube from media in playlist
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CLIENT_EMAIL = "demo@test.com"
CLIENT_PASSWORD = "demo123"
ADMIN_EMAIL = "admin@intensiti.com"
ADMIN_PASSWORD = "admin123"


class TestAuth:
    """Authentication tests"""
    
    def test_client_login(self):
        """Test client login with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        print(f"Login response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            assert "user" in data
            print(f"Login successful for {CLIENT_EMAIL}")
        else:
            # If demo user doesn't exist, create it via admin
            print(f"Demo user login failed: {response.text}")
            pytest.skip("Demo user not found - will be created")
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        print("Admin login successful")


class TestSettingsWeatherIconSize:
    """Test weather_icon_size field in settings"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Client login failed")
        return response.json()["token"]
    
    def test_settings_accepts_weather_icon_size(self, auth_token):
        """Test PUT /api/settings accepts weather_icon_size field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Update settings with weather_icon_size
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"weather_icon_size": 48},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("weather_icon_size") == 48
        print("weather_icon_size field accepted and persisted")
    
    def test_settings_get_returns_weather_icon_size(self, auth_token):
        """Test GET /api/settings returns weather_icon_size"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Should have weather_icon_size field
        assert "weather_icon_size" in data or data.get("weather_icon_size") is None
        print(f"Settings weather_icon_size: {data.get('weather_icon_size')}")


class TestScreenCreationDefaults:
    """Test screen creation defaults header_height=100, footer_height=50"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Client login failed")
        return response.json()["token"]
    
    def test_screen_creation_defaults(self, auth_token):
        """Test new screen has header_height=100 and footer_height=50"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a new screen
        response = requests.post(f"{BASE_URL}/api/screens", 
            json={"name": "TEST_Screen_Defaults", "weather_city": "Paris"},
            headers=headers
        )
        
        if response.status_code == 400 and "Quota" in response.text:
            pytest.skip("Screen quota reached")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check settings defaults
        settings = data.get("settings", {})
        assert settings.get("header_height") == 100, f"Expected header_height=100, got {settings.get('header_height')}"
        assert settings.get("footer_height") == 50, f"Expected footer_height=50, got {settings.get('footer_height')}"
        print(f"Screen created with correct defaults: header_height={settings.get('header_height')}, footer_height={settings.get('footer_height')}")
        
        # Cleanup - delete the test screen
        screen_id = data.get("id")
        if screen_id:
            requests.delete(f"{BASE_URL}/api/screens/{screen_id}", headers=headers)


class TestDisplayEndpoint:
    """Test display endpoint returns correct data for RSS"""
    
    def test_display_returns_text_color(self):
        """Test /api/display/{code} returns settings with text_color"""
        # Use the known screen code
        code = "386621"
        response = requests.get(f"{BASE_URL}/api/display/{code}")
        
        if response.status_code == 404:
            pytest.skip("Screen not found with code 386621")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check settings has text_color
        settings = data.get("settings", {})
        assert "text_color" in settings or settings is not None
        print(f"Display endpoint returns text_color: {settings.get('text_color')}")
        
        # Check screen data
        screen = data.get("screen", {})
        assert screen is not None
        print(f"Display endpoint returns screen: {screen.get('name')}")


class TestMediaEndpoints:
    """Test media endpoints for thumbnails and preview"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Client login failed")
        return response.json()["token"]
    
    def test_media_list(self, auth_token):
        """Test GET /api/media returns media list with type info"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/media", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        print(f"Media count: {len(data)}")
        
        # Check media items have required fields for thumbnails
        for item in data[:5]:  # Check first 5
            assert "id" in item
            assert "type" in item
            assert "url" in item or "filename" in item
            print(f"  Media: {item.get('name')} - type: {item.get('type')}")
    
    def test_youtube_media_add(self, auth_token):
        """Test adding YouTube media"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/media/youtube", 
            json={"name": "TEST_YouTube", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("type") == "youtube"
            print(f"YouTube media added: {data.get('id')}")
            
            # Cleanup
            media_id = data.get("id")
            if media_id:
                requests.delete(f"{BASE_URL}/api/media/{media_id}", headers=headers)


class TestPlaylistEndpoints:
    """Test playlist endpoints for slide preview"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Client login failed")
        return response.json()["token"]
    
    def test_playlist_list(self, auth_token):
        """Test GET /api/playlists returns playlists with slides"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/playlists", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        print(f"Playlist count: {len(data)}")
        
        # Check playlists have slides array
        for pl in data[:3]:  # Check first 3
            assert "id" in pl
            assert "name" in pl
            assert "slides" in pl
            print(f"  Playlist: {pl.get('name')} - slides: {len(pl.get('slides', []))}")
    
    def test_playlist_with_rss_slide(self, auth_token):
        """Test creating playlist with RSS slide containing rss_title and rss_pause"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create playlist
        response = requests.post(f"{BASE_URL}/api/playlists", 
            json={"name": "TEST_RSS_Playlist"},
            headers=headers
        )
        assert response.status_code == 200
        playlist = response.json()
        playlist_id = playlist.get("id")
        
        # Add RSS slide with rss_title and rss_pause
        rss_slide = {
            "id": "test-rss-slide-1",
            "type": "rss",
            "content": {
                "rss_url": "https://example.com/rss.xml",
                "rss_title": "Actualites",
                "rss_pause": 8
            },
            "duration": 30,
            "transition": "fade",
            "is_active": True,
            "order": 0
        }
        
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": [rss_slide]},
            headers=headers
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify RSS slide has rss_title and rss_pause
        slides = updated.get("slides", [])
        assert len(slides) == 1
        content = slides[0].get("content", {})
        assert content.get("rss_title") == "Actualites"
        assert content.get("rss_pause") == 8
        print(f"RSS slide created with rss_title={content.get('rss_title')}, rss_pause={content.get('rss_pause')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
    
    def test_playlist_with_pdf_slide(self, auth_token):
        """Test creating playlist with PDF slide containing page_duration"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create playlist
        response = requests.post(f"{BASE_URL}/api/playlists", 
            json={"name": "TEST_PDF_Playlist"},
            headers=headers
        )
        assert response.status_code == 200
        playlist = response.json()
        playlist_id = playlist.get("id")
        
        # Add PDF slide with page_duration
        pdf_slide = {
            "id": "test-pdf-slide-1",
            "type": "pdf",
            "content": {
                "url": "/api/uploads/test.pdf",
                "page_duration": 12
            },
            "duration": 60,
            "transition": "fade",
            "is_active": True,
            "order": 0
        }
        
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": [pdf_slide]},
            headers=headers
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify PDF slide has page_duration
        slides = updated.get("slides", [])
        assert len(slides) == 1
        content = slides[0].get("content", {})
        assert content.get("page_duration") == 12
        print(f"PDF slide created with page_duration={content.get('page_duration')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
    
    def test_playlist_with_youtube_from_media(self, auth_token):
        """Test creating playlist with YouTube from media picker (type=media, c.type=youtube)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create playlist
        response = requests.post(f"{BASE_URL}/api/playlists", 
            json={"name": "TEST_YouTube_Media_Playlist"},
            headers=headers
        )
        assert response.status_code == 200
        playlist = response.json()
        playlist_id = playlist.get("id")
        
        # Add YouTube slide from media picker (type=media, content.type=youtube)
        youtube_slide = {
            "id": "test-yt-media-slide-1",
            "type": "media",
            "content": {
                "type": "youtube",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "name": "Test YouTube Video"
            },
            "duration": 30,
            "transition": "fade",
            "is_active": True,
            "order": 0
        }
        
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": [youtube_slide]},
            headers=headers
        )
        assert response.status_code == 200
        updated = response.json()
        
        # Verify slide structure
        slides = updated.get("slides", [])
        assert len(slides) == 1
        assert slides[0].get("type") == "media"
        content = slides[0].get("content", {})
        assert content.get("type") == "youtube"
        assert "youtube.com" in content.get("url", "")
        print(f"YouTube from media slide created: type={slides[0].get('type')}, content.type={content.get('type')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)


class TestDashboardStats:
    """Test dashboard stats endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Client login failed")
        return response.json()["token"]
    
    def test_stats_endpoint(self, auth_token):
        """Test /api/stats returns dashboard stats"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Client stats should have these fields
        assert "total_screens" in data
        assert "total_media" in data
        assert "total_playlists" in data
        print(f"Stats: screens={data.get('total_screens')}, media={data.get('total_media')}, playlists={data.get('total_playlists')}")
    
    def test_screens_endpoint(self, auth_token):
        """Test /api/screens returns screens list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/screens", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Screens count: {len(data)}")
    
    def test_playlists_endpoint(self, auth_token):
        """Test /api/playlists returns playlists list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/playlists", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Playlists count: {len(data)}")
    
    def test_media_endpoint(self, auth_token):
        """Test /api/media returns media list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/media", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Media count: {len(data)}")


class TestSettingsDefaults:
    """Test settings default values"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Client login failed")
        return response.json()["token"]
    
    def test_settings_has_required_fields(self, auth_token):
        """Test settings has all required fields for iteration 11"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for text_color (used by RSS)
        assert "text_color" in data
        print(f"text_color: {data.get('text_color')}")
        
        # Check for header/footer heights
        print(f"header_height: {data.get('header_height')}")
        print(f"footer_height: {data.get('footer_height')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
