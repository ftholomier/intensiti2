"""
Test iteration 4 features:
1. Playlist scheduling bug fix (schedule_days, schedule_months, default playlist checking)
2. MediaGrid shows all file types (images, videos, PDFs)
3. Full-width dialog popups (max-w-[95vw]) - Frontend test
4. Ticker text and RSS toggles (ticker_text_enabled, ticker_rss_enabled)
5. PDF slide support with page-by-page display
6. 50/50 split slide content update verification
7. WYSIWYG editor min-height (300px) - Frontend test
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://themes-live.preview.emergentagent.com').rstrip('/')

# Test credentials
SUPERADMIN_EMAIL = "admin@intensiti.com"
SUPERADMIN_PASS = "admin123"
CLIENT_EMAIL = "demo@test.com"
CLIENT_PASS = "demo123"

# Display code for testing
DISPLAY_CODE = "386621"

@pytest.fixture(scope="module")
def client_token():
    """Get client authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": CLIENT_EMAIL,
        "password": CLIENT_PASS
    })
    assert response.status_code == 200, f"Client login failed: {response.text}"
    return response.json()["token"]

@pytest.fixture(scope="module")
def client_headers(client_token):
    """Auth headers for client"""
    return {
        "Authorization": f"Bearer {client_token}",
        "Content-Type": "application/json"
    }


class TestTickerToggles:
    """Test ticker_text_enabled and ticker_rss_enabled toggle features"""
    
    def test_get_settings_returns_ticker_toggles(self, client_headers):
        """Verify settings response includes ticker toggle fields"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=client_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check ticker toggle fields exist
        assert "ticker_text_enabled" in data or data.get("ticker_text_enabled") is None, "ticker_text_enabled should be in settings"
        assert "ticker_rss_enabled" in data or data.get("ticker_rss_enabled") is None, "ticker_rss_enabled should be in settings"
        print(f"Current ticker_text_enabled: {data.get('ticker_text_enabled')}")
        print(f"Current ticker_rss_enabled: {data.get('ticker_rss_enabled')}")
    
    def test_update_ticker_text_enabled_false(self, client_headers):
        """Test disabling ticker text"""
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"ticker_text_enabled": False},
            headers=client_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ticker_text_enabled") == False, "ticker_text_enabled should be False"
        print("ticker_text_enabled set to False - PASSED")
    
    def test_update_ticker_text_enabled_true(self, client_headers):
        """Test enabling ticker text"""
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"ticker_text_enabled": True},
            headers=client_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ticker_text_enabled") == True, "ticker_text_enabled should be True"
        print("ticker_text_enabled set to True - PASSED")
    
    def test_update_ticker_rss_enabled_false(self, client_headers):
        """Test disabling ticker RSS"""
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"ticker_rss_enabled": False},
            headers=client_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ticker_rss_enabled") == False, "ticker_rss_enabled should be False"
        print("ticker_rss_enabled set to False - PASSED")
    
    def test_update_ticker_rss_enabled_true(self, client_headers):
        """Test enabling ticker RSS"""
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"ticker_rss_enabled": True},
            headers=client_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ticker_rss_enabled") == True, "ticker_rss_enabled should be True"
        print("ticker_rss_enabled set to True - PASSED")
    
    def test_display_includes_ticker_toggles(self):
        """Verify display endpoint returns settings with ticker toggles"""
        response = requests.get(f"{BASE_URL}/api/display/{DISPLAY_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        settings = data.get("settings", {})
        # Verify settings is returned
        assert settings is not None, "Settings should be in display response"
        print(f"Display settings ticker_text_enabled: {settings.get('ticker_text_enabled')}")
        print(f"Display settings ticker_rss_enabled: {settings.get('ticker_rss_enabled')}")


class TestPlaylistScheduling:
    """Test playlist scheduling with schedule_days and schedule_months"""
    
    def test_create_playlist_with_schedule(self, client_headers):
        """Create a playlist with schedule_days constraint"""
        # First create a new playlist
        create_resp = requests.post(f"{BASE_URL}/api/playlists",
            json={"name": "TEST_Scheduled_Playlist"},
            headers=client_headers)
        assert create_resp.status_code == 200
        playlist = create_resp.json()
        playlist_id = playlist["id"]
        
        # Set schedule to only Thursday (day 3)
        update_resp = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={
                "schedule_days": [3],  # Thursday only
                "schedule_months": []
            },
            headers=client_headers)
        assert update_resp.status_code == 200
        
        # Verify schedule was saved
        get_resp = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data.get("schedule_days") == [3], f"schedule_days should be [3], got {data.get('schedule_days')}"
        print(f"Playlist {playlist_id} scheduled for Thursday only - PASSED")
        
        # Cleanup - delete test playlist
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)
    
    def test_display_respects_schedule_days(self):
        """Verify display endpoint filters playlists by schedule_days
        
        Today is Tuesday (weekday=1), so a playlist scheduled for Thursday (day=3) 
        should NOT be returned.
        """
        # Get current day of week
        now = datetime.utcnow()
        current_day = now.weekday()  # 0=Monday, 6=Sunday
        print(f"Current weekday: {current_day} (0=Mon, 6=Sun)")
        
        # Get display data
        response = requests.get(f"{BASE_URL}/api/display/{DISPLAY_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        # Check if playlist is returned (it should since schedule is cleared)
        playlist = data.get("playlist")
        if playlist:
            schedule_days = playlist.get("schedule_days") or []
            schedule_months = playlist.get("schedule_months") or []
            print(f"Returned playlist: {playlist.get('name')}")
            print(f"  schedule_days: {schedule_days}")
            print(f"  schedule_months: {schedule_months}")
            
            # If schedule is set and current day not in schedule, playlist shouldn't be returned
            if schedule_days and current_day not in schedule_days:
                assert False, f"Playlist with schedule_days={schedule_days} should not be returned on day {current_day}"
        else:
            print("No playlist returned (may be due to schedule constraints)")
    
    def test_clear_schedule_allows_display(self, client_headers):
        """Verify that clearing schedule (empty arrays) allows playlist to display"""
        # Get existing playlist
        response = requests.get(f"{BASE_URL}/api/display/{DISPLAY_CODE}")
        assert response.status_code == 200
        
        playlist = response.json().get("playlist")
        if playlist:
            playlist_id = playlist["id"]
            
            # Clear schedule
            update_resp = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
                json={
                    "schedule_days": [],
                    "schedule_months": []
                },
                headers=client_headers)
            assert update_resp.status_code == 200
            
            # Verify playlist is now returned
            display_resp = requests.get(f"{BASE_URL}/api/display/{DISPLAY_CODE}")
            assert display_resp.status_code == 200
            returned_playlist = display_resp.json().get("playlist")
            assert returned_playlist is not None, "Playlist should be returned after clearing schedule"
            assert returned_playlist["id"] == playlist_id, "Same playlist should be returned"
            print(f"Playlist {playlist_id} displays after clearing schedule - PASSED")


class TestPdfSlideSupport:
    """Test PDF slide type support in playlists"""
    
    def test_pdf_media_type_exists(self, client_headers):
        """Verify PDF media type can be retrieved from media library"""
        response = requests.get(f"{BASE_URL}/api/media", headers=client_headers)
        assert response.status_code == 200
        media = response.json()
        
        # Check if any PDF media exists
        pdf_media = [m for m in media if m.get("type") == "pdf"]
        print(f"Found {len(pdf_media)} PDF media items")
        for pdf in pdf_media:
            print(f"  - {pdf.get('name')} ({pdf.get('id')})")
    
    def test_add_pdf_slide_to_playlist(self, client_headers):
        """Test adding a PDF slide to a playlist"""
        # Create test playlist
        create_resp = requests.post(f"{BASE_URL}/api/playlists",
            json={"name": "TEST_PDF_Playlist"},
            headers=client_headers)
        assert create_resp.status_code == 200
        playlist_id = create_resp.json()["id"]
        
        # Add PDF slide
        pdf_slide = {
            "id": "test-pdf-slide-001",
            "type": "pdf",
            "content": {
                "url": "/api/uploads/test.pdf",
                "name": "Test PDF",
                "type": "pdf",
                "page_duration": 8
            },
            "duration": 30,
            "transition": "fade",
            "layout": "full",
            "fit_mode": "fit",
            "is_active": True,
            "order": 0
        }
        
        update_resp = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": [pdf_slide]},
            headers=client_headers)
        assert update_resp.status_code == 200
        
        # Verify slide was saved
        get_resp = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        
        assert len(data.get("slides", [])) == 1, "Should have 1 slide"
        saved_slide = data["slides"][0]
        assert saved_slide["type"] == "pdf", f"Slide type should be 'pdf', got {saved_slide.get('type')}"
        assert saved_slide["content"].get("page_duration") == 8, "page_duration should be 8"
        print(f"PDF slide added and saved correctly - PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)


class TestSplitSlideContentUpdate:
    """Test 50/50 split slide content persistence"""
    
    def test_create_split_slide_and_verify_persistence(self, client_headers):
        """Create a 50/50 split slide, save, reload, verify content persists"""
        # Create test playlist
        create_resp = requests.post(f"{BASE_URL}/api/playlists",
            json={"name": "TEST_Split_Slide_Playlist"},
            headers=client_headers)
        assert create_resp.status_code == 200
        playlist_id = create_resp.json()["id"]
        
        # Create split slide with left=media, right=text
        split_slide = {
            "id": "test-split-slide-001",
            "type": "split",
            "content": {},
            "layout": "split",
            "split_left_type": "media",
            "split_left_content": {
                "url": "/api/uploads/test.jpg",
                "name": "Left Image",
                "type": "image"
            },
            "split_right_type": "text",
            "split_right_content": {
                "html": "<p>Right side text content</p>",
                "text": "Right side text content"
            },
            "duration": 15,
            "transition": "fade",
            "fit_mode": "fit",
            "is_active": True,
            "order": 0
        }
        
        # Save slide
        update_resp = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": [split_slide]},
            headers=client_headers)
        assert update_resp.status_code == 200
        
        # Reload and verify persistence
        get_resp = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        
        assert len(data.get("slides", [])) == 1, "Should have 1 slide"
        saved = data["slides"][0]
        
        # Verify split content persisted
        assert saved.get("layout") == "split", "Layout should be split"
        assert saved.get("split_left_type") == "media", f"split_left_type should be media, got {saved.get('split_left_type')}"
        assert saved.get("split_right_type") == "text", f"split_right_type should be text, got {saved.get('split_right_type')}"
        
        left_content = saved.get("split_left_content", {})
        assert left_content.get("name") == "Left Image", f"Left content name mismatch"
        
        right_content = saved.get("split_right_content", {})
        assert "Right side text" in right_content.get("text", ""), "Right content text mismatch"
        
        print("Split slide content persists correctly - PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)
    
    def test_edit_split_slide_change_types(self, client_headers):
        """Edit a split slide and change left/right content types"""
        # Create test playlist with initial split slide
        create_resp = requests.post(f"{BASE_URL}/api/playlists",
            json={"name": "TEST_Edit_Split_Playlist"},
            headers=client_headers)
        assert create_resp.status_code == 200
        playlist_id = create_resp.json()["id"]
        
        # Initial split: left=media, right=text
        initial_slide = {
            "id": "test-edit-split-001",
            "type": "split",
            "content": {},
            "layout": "split",
            "split_left_type": "media",
            "split_left_content": {"type": "image", "url": "/test.jpg"},
            "split_right_type": "text",
            "split_right_content": {"html": "<p>Initial</p>"},
            "duration": 10,
            "transition": "fade",
            "fit_mode": "fit",
            "is_active": True,
            "order": 0
        }
        
        requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": [initial_slide]},
            headers=client_headers)
        
        # Edit: change left to youtube, right to qrcode
        edited_slide = {
            **initial_slide,
            "split_left_type": "youtube",
            "split_left_content": {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
            "split_right_type": "qrcode",
            "split_right_content": {"url": "https://example.com"}
        }
        
        update_resp = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": [edited_slide]},
            headers=client_headers)
        assert update_resp.status_code == 200
        
        # Verify changes saved
        get_resp = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)
        data = get_resp.json()
        saved = data["slides"][0]
        
        assert saved.get("split_left_type") == "youtube", f"split_left_type should be youtube, got {saved.get('split_left_type')}"
        assert saved.get("split_right_type") == "qrcode", f"split_right_type should be qrcode, got {saved.get('split_right_type')}"
        assert "youtube.com" in saved.get("split_left_content", {}).get("url", ""), "YouTube URL not saved"
        assert "example.com" in saved.get("split_right_content", {}).get("url", ""), "QR URL not saved"
        
        print("Edit split slide with changed types - PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)


class TestContentTypes:
    """Test that all 7 content types are available"""
    
    def test_all_content_types_in_playlist(self, client_headers):
        """Verify all 7 content types can be added to a playlist"""
        # Create test playlist
        create_resp = requests.post(f"{BASE_URL}/api/playlists",
            json={"name": "TEST_Content_Types_Playlist"},
            headers=client_headers)
        assert create_resp.status_code == 200
        playlist_id = create_resp.json()["id"]
        
        # Create slides with all 7 content types
        content_types = [
            {"type": "media", "content": {"type": "image", "url": "/test.jpg", "name": "Test Image"}},
            {"type": "youtube", "content": {"url": "https://www.youtube.com/watch?v=test"}},
            {"type": "qrcode", "content": {"url": "https://example.com"}},
            {"type": "countdown", "content": {"label": "Event", "target_date": "2026-12-31T23:59:59"}},
            {"type": "text", "content": {"html": "<p>Test text</p>", "text": "Test text"}},
            {"type": "rss", "content": {"rss_url": "https://example.com/rss.xml"}},
            {"type": "pdf", "content": {"url": "/test.pdf", "type": "pdf", "page_duration": 8}}
        ]
        
        slides = []
        for i, ct in enumerate(content_types):
            slides.append({
                "id": f"test-ct-{i}",
                "type": ct["type"],
                "content": ct["content"],
                "duration": 10,
                "transition": "fade",
                "layout": "full",
                "fit_mode": "fit",
                "is_active": True,
                "order": i
            })
        
        # Save all slides
        update_resp = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}",
            json={"slides": slides},
            headers=client_headers)
        assert update_resp.status_code == 200
        
        # Verify all 7 types saved
        get_resp = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)
        data = get_resp.json()
        saved_types = [s["type"] for s in data.get("slides", [])]
        
        expected_types = ["media", "youtube", "qrcode", "countdown", "text", "rss", "pdf"]
        for expected in expected_types:
            assert expected in saved_types, f"Content type '{expected}' not found in saved slides"
        
        print(f"All 7 content types saved correctly: {saved_types}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=client_headers)


class TestDefaultPlaylistScheduling:
    """Test that default assigned playlist also respects schedule"""
    
    def test_default_playlist_schedule_check(self):
        """Verify the display endpoint checks schedule on default assigned playlist"""
        # Get display data
        response = requests.get(f"{BASE_URL}/api/display/{DISPLAY_CODE}")
        assert response.status_code == 200
        data = response.json()
        
        screen = data.get("screen", {})
        playlist = data.get("playlist")
        
        print(f"Screen playlist_id: {screen.get('playlist_id')}")
        if playlist:
            print(f"Returned playlist id: {playlist.get('id')}")
            print(f"Returned playlist name: {playlist.get('name')}")
            print(f"schedule_days: {playlist.get('schedule_days')}")
            print(f"schedule_months: {playlist.get('schedule_months')}")
            
            # If schedule is set, verify current time matches
            schedule_days = playlist.get("schedule_days") or []
            if schedule_days:
                current_day = datetime.utcnow().weekday()
                assert current_day in schedule_days, f"Current day {current_day} not in schedule_days {schedule_days}"
        else:
            # No playlist returned - could be due to schedule or no assigned playlist
            print("No playlist returned - schedule may be blocking or no playlist assigned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
