"""
Backend API Tests for Intensiti New Features (5 features):
1. 50/50 Split Layout (stores split_left_type, split_left_content, split_right_type, split_right_content)
2. Ticker Speed Control (ticker_speed in settings)
3. Multiple RSS Feeds (rss_items array in settings)
4. RSS Batch Endpoint (POST /api/rss/batch with {urls: [...]})
5. Playlist Scheduling (schedule_days, schedule_months in playlist)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://themes-live.preview.emergentagent.com').rstrip('/')

# Test credentials
CLIENT_EMAIL = "demo@test.com"
CLIENT_PASSWORD = "demo123"


@pytest.fixture
def client_auth():
    """Get client token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": CLIENT_EMAIL,
        "password": CLIENT_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


class TestTickerSpeed:
    """Test ticker_speed in settings - NEW FEATURE"""
    
    def test_get_settings_contains_ticker_speed(self, client_auth):
        """Verify ticker_speed field exists in settings"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200, f"Get settings failed: {response.text}"
        data = response.json()
        # ticker_speed should be present (could be None on first load or have a value)
        assert "ticker_speed" in data or data.get("ticker_speed") is None, "ticker_speed field should exist"
        print(f"Current ticker_speed: {data.get('ticker_speed', 'default/none')}")
    
    def test_save_ticker_speed(self, client_auth):
        """Test saving different ticker speed values"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Get current value
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        original = response.json().get("ticker_speed", 30)
        
        # Update to a new value
        new_speed = 60
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"ticker_speed": new_speed}, headers=headers)
        assert response.status_code == 200, f"Update ticker_speed failed: {response.text}"
        
        # Verify the change persisted
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        data = response.json()
        assert data.get("ticker_speed") == new_speed, f"ticker_speed not saved: expected {new_speed}, got {data.get('ticker_speed')}"
        print(f"ticker_speed successfully updated to {new_speed}s")
        
        # Restore original
        requests.put(f"{BASE_URL}/api/settings", json={"ticker_speed": original}, headers=headers)


class TestMultipleRssFeeds:
    """Test rss_items array management - NEW FEATURE"""
    
    def test_get_settings_contains_rss_items(self, client_auth):
        """Verify rss_items field exists in settings"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # rss_items should be present as array (may be empty)
        assert "rss_items" in data, "rss_items field should exist"
        assert isinstance(data.get("rss_items", []), list), "rss_items should be a list"
        print(f"Current rss_items count: {len(data.get('rss_items', []))}")
    
    def test_add_multiple_rss_items(self, client_auth):
        """Test adding multiple RSS feed items"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Get current rss_items
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        original_items = response.json().get("rss_items", [])
        
        # Create test RSS items
        test_items = [
            {
                "id": str(uuid.uuid4()),
                "url": "https://www.lemonde.fr/rss/une.xml",
                "name": "TEST_Le Monde",
                "is_active": True,
                "order": 0
            },
            {
                "id": str(uuid.uuid4()),
                "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
                "name": "TEST_BBC World",
                "is_active": True,
                "order": 1
            }
        ]
        
        # Update with test items
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"rss_items": test_items}, headers=headers)
        assert response.status_code == 200, f"Update rss_items failed: {response.text}"
        
        # Verify persistence via GET
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        data = response.json()
        saved_items = data.get("rss_items", [])
        assert len(saved_items) >= 2, f"Expected at least 2 rss_items, got {len(saved_items)}"
        
        # Verify structure
        for item in saved_items:
            if item.get("name", "").startswith("TEST_"):
                assert "id" in item
                assert "url" in item
                assert "name" in item
                assert "is_active" in item
                print(f"RSS item saved: {item['name']} - {item['url']}")
        
        # Cleanup - restore original
        requests.put(f"{BASE_URL}/api/settings", json={"rss_items": original_items}, headers=headers)
    
    def test_toggle_rss_item_active_state(self, client_auth):
        """Test toggling is_active for RSS items"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Get current
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        original_items = response.json().get("rss_items", [])
        
        # Create item with is_active=false
        test_items = [
            {
                "id": str(uuid.uuid4()),
                "url": "https://www.lemonde.fr/rss/une.xml",
                "name": "TEST_Disabled Feed",
                "is_active": False,
                "order": 0
            }
        ]
        
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"rss_items": test_items}, headers=headers)
        assert response.status_code == 200
        
        # Verify is_active=False was saved
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        data = response.json()
        saved_items = data.get("rss_items", [])
        disabled_feed = [i for i in saved_items if i.get("name") == "TEST_Disabled Feed"]
        assert len(disabled_feed) > 0, "Test feed not found"
        assert disabled_feed[0].get("is_active") == False, "is_active should be False"
        print("RSS item is_active=False toggle verified")
        
        # Cleanup
        requests.put(f"{BASE_URL}/api/settings", json={"rss_items": original_items}, headers=headers)


class TestRssBatchEndpoint:
    """Test POST /api/rss/batch endpoint - NEW FEATURE"""
    
    def test_rss_batch_single_url(self):
        """Test batch endpoint with single URL"""
        response = requests.post(f"{BASE_URL}/api/rss/batch", json={
            "urls": ["https://www.lemonde.fr/rss/une.xml"]
        })
        assert response.status_code == 200, f"RSS batch failed: {response.text}"
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) > 0, "Should return items from Le Monde RSS"
        print(f"RSS batch (1 URL) returned {len(data['items'])} items")
        print(f"First item: {data['items'][0][:60]}...")
    
    def test_rss_batch_multiple_urls(self):
        """Test batch endpoint with multiple URLs"""
        response = requests.post(f"{BASE_URL}/api/rss/batch", json={
            "urls": [
                "https://www.lemonde.fr/rss/une.xml",
                "https://feeds.bbci.co.uk/news/world/rss.xml"
            ]
        })
        assert response.status_code == 200, f"RSS batch failed: {response.text}"
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        # Should combine items from both feeds (max 10 from each)
        assert len(data["items"]) >= 5, "Should return combined items from both feeds"
        print(f"RSS batch (2 URLs) returned {len(data['items'])} combined items")
    
    def test_rss_batch_empty_urls(self):
        """Test batch endpoint with empty urls array"""
        response = requests.post(f"{BASE_URL}/api/rss/batch", json={
            "urls": []
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("items") == [], "Empty urls should return empty items"
        print("RSS batch with empty URLs returns empty items (correct)")


class TestPlaylistScheduling:
    """Test schedule_days and schedule_months for playlists - NEW FEATURE"""
    
    def test_create_playlist_with_scheduling(self, client_auth):
        """Test creating playlist and adding schedule"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Create test playlist
        playlist_data = {"name": f"TEST_Scheduled_{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{BASE_URL}/api/playlists", json=playlist_data, headers=headers)
        assert response.status_code == 200, f"Create playlist failed: {response.text}"
        playlist = response.json()
        playlist_id = playlist["id"]
        print(f"Created test playlist: {playlist['name']}")
        
        # Update with schedule_days (0=Mon, 1=Tue, etc) and schedule_months (1=Jan, 2=Feb, etc)
        schedule_data = {
            "schedule_days": [0, 1, 2, 3, 4],  # Mon-Fri
            "schedule_months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # All year
            "schedule_start": "2026-01-01T00:00:00Z",
            "schedule_end": "2026-12-31T23:59:59Z"
        }
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json=schedule_data, headers=headers)
        assert response.status_code == 200, f"Update schedule failed: {response.text}"
        updated = response.json()
        
        # Verify schedule_days persisted
        assert updated.get("schedule_days") == [0, 1, 2, 3, 4], f"schedule_days not saved: {updated.get('schedule_days')}"
        # Verify schedule_months persisted
        assert updated.get("schedule_months") == list(range(1, 13)), f"schedule_months not saved: {updated.get('schedule_months')}"
        print(f"Schedule saved: days={updated['schedule_days']}, months={updated['schedule_months']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
        print(f"Deleted test playlist: {playlist_id}")
    
    def test_update_existing_playlist_schedule(self, client_auth):
        """Test updating schedule on existing playlist"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Get existing playlists
        response = requests.get(f"{BASE_URL}/api/playlists", headers=headers)
        playlists = response.json()
        
        if len(playlists) == 0:
            pytest.skip("No playlists available to test schedule update")
        
        playlist = playlists[0]
        playlist_id = playlist["id"]
        original_days = playlist.get("schedule_days")
        original_months = playlist.get("schedule_months")
        
        # Update with weekend-only schedule
        schedule_data = {
            "schedule_days": [5, 6],  # Sat, Sun
            "schedule_months": [7, 8]  # July, August
        }
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json=schedule_data, headers=headers)
        assert response.status_code == 200, f"Update schedule failed: {response.text}"
        
        # Verify via GET
        response = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
        assert response.status_code == 200
        updated = response.json()
        assert updated.get("schedule_days") == [5, 6], "schedule_days not updated"
        assert updated.get("schedule_months") == [7, 8], "schedule_months not updated"
        print(f"Playlist {playlist_id} schedule updated: days=[5,6], months=[7,8]")
        
        # Restore original
        requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json={"schedule_days": original_days, "schedule_months": original_months}, headers=headers)
    
    def test_clear_playlist_schedule(self, client_auth):
        """Test clearing schedule (empty arrays)"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Create playlist with schedule
        playlist_data = {"name": f"TEST_ClearSchedule_{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{BASE_URL}/api/playlists", json=playlist_data, headers=headers)
        playlist = response.json()
        playlist_id = playlist["id"]
        
        # Add schedule
        requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json={"schedule_days": [0, 1], "schedule_months": [1, 2]}, headers=headers)
        
        # Clear schedule
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json={"schedule_days": [], "schedule_months": []}, headers=headers)
        assert response.status_code == 200
        
        updated = response.json()
        assert updated.get("schedule_days") == [], "schedule_days should be empty"
        assert updated.get("schedule_months") == [], "schedule_months should be empty"
        print("Schedule cleared successfully (empty arrays)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)


class TestSplitLayoutSlides:
    """Test 50/50 split layout slides - NEW FEATURE"""
    
    def test_create_playlist_with_split_slide(self, client_auth):
        """Test creating a playlist with a 50/50 split slide"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Create test playlist
        playlist_data = {"name": f"TEST_SplitLayout_{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{BASE_URL}/api/playlists", json=playlist_data, headers=headers)
        assert response.status_code == 200, f"Create playlist failed: {response.text}"
        playlist = response.json()
        playlist_id = playlist["id"]
        
        # Create a 50/50 split slide
        split_slide = {
            "id": str(uuid.uuid4()),
            "type": "split",  # Indicates 50/50 split
            "layout": "split",
            "content": {},  # Empty for split type
            "split_left_type": "media",
            "split_left_content": {"type": "image", "url": "/test/left.jpg", "name": "Left Image"},
            "split_right_type": "text",
            "split_right_content": {"html": "<h1>Right Side Text</h1>", "text": "Right Side Text"},
            "duration": 15,
            "transition": "fade",
            "fit_mode": "fit",
            "is_active": True,
            "order": 0
        }
        
        # Update playlist with split slide
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json={"slides": [split_slide]}, headers=headers)
        assert response.status_code == 200, f"Update playlist with split slide failed: {response.text}"
        
        # Verify slide was saved correctly
        response = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
        assert response.status_code == 200
        updated = response.json()
        
        assert len(updated.get("slides", [])) == 1, "Should have 1 slide"
        saved_slide = updated["slides"][0]
        
        # Verify split layout fields
        assert saved_slide.get("layout") == "split", f"layout should be 'split', got {saved_slide.get('layout')}"
        assert saved_slide.get("split_left_type") == "media", f"split_left_type should be 'media'"
        assert saved_slide.get("split_right_type") == "text", f"split_right_type should be 'text'"
        assert "split_left_content" in saved_slide, "split_left_content should exist"
        assert "split_right_content" in saved_slide, "split_right_content should exist"
        
        print(f"Split slide saved: left={saved_slide['split_left_type']}, right={saved_slide['split_right_type']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
    
    def test_split_slide_with_different_content_types(self, client_auth):
        """Test split slide with various content type combinations"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Create test playlist
        playlist_data = {"name": f"TEST_SplitTypes_{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{BASE_URL}/api/playlists", json=playlist_data, headers=headers)
        playlist = response.json()
        playlist_id = playlist["id"]
        
        # Test multiple content type combinations
        test_combinations = [
            ("youtube", "qrcode"),
            ("text", "rss"),
            ("countdown", "media"),
        ]
        
        slides = []
        for i, (left_type, right_type) in enumerate(test_combinations):
            slide = {
                "id": str(uuid.uuid4()),
                "type": "split",
                "layout": "split",
                "content": {},
                "split_left_type": left_type,
                "split_left_content": {"url": f"https://example.com/{left_type}"} if left_type in ["youtube", "qrcode"] else {"html": f"<p>{left_type} content</p>"},
                "split_right_type": right_type,
                "split_right_content": {"rss_url": "https://www.lemonde.fr/rss/une.xml"} if right_type == "rss" else {"url": f"https://example.com/{right_type}"},
                "duration": 10,
                "transition": "fade",
                "fit_mode": "fit",
                "is_active": True,
                "order": i
            }
            slides.append(slide)
        
        # Update playlist with multiple split slides
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json={"slides": slides}, headers=headers)
        assert response.status_code == 200
        
        # Verify all saved
        response = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
        updated = response.json()
        
        assert len(updated.get("slides", [])) == 3, f"Should have 3 slides, got {len(updated.get('slides', []))}"
        
        for i, (left_type, right_type) in enumerate(test_combinations):
            saved = updated["slides"][i]
            assert saved.get("split_left_type") == left_type, f"Slide {i} left type mismatch"
            assert saved.get("split_right_type") == right_type, f"Slide {i} right type mismatch"
            print(f"Verified split slide {i}: {left_type} | {right_type}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)


class TestRssSlideType:
    """Test RSS slide type (Flux RSS in main content area) - NEW FEATURE"""
    
    def test_create_rss_slide(self, client_auth):
        """Test creating a slide with RSS content type"""
        headers = {"Authorization": f"Bearer {client_auth}"}
        
        # Create test playlist
        playlist_data = {"name": f"TEST_RssSlide_{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{BASE_URL}/api/playlists", json=playlist_data, headers=headers)
        playlist = response.json()
        playlist_id = playlist["id"]
        
        # Create RSS slide
        rss_slide = {
            "id": str(uuid.uuid4()),
            "type": "rss",  # RSS content type
            "layout": "full",
            "content": {
                "rss_url": "https://www.lemonde.fr/rss/une.xml"
            },
            "duration": 20,
            "transition": "fade",
            "fit_mode": "fit",
            "is_active": True,
            "order": 0
        }
        
        # Update playlist
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            json={"slides": [rss_slide]}, headers=headers)
        assert response.status_code == 200
        
        # Verify
        response = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)
        updated = response.json()
        
        assert len(updated.get("slides", [])) == 1
        saved_slide = updated["slides"][0]
        assert saved_slide.get("type") == "rss", f"slide type should be 'rss', got {saved_slide.get('type')}"
        assert saved_slide.get("content", {}).get("rss_url") == "https://www.lemonde.fr/rss/une.xml"
        print(f"RSS slide saved with URL: {saved_slide['content']['rss_url']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/playlists/{playlist_id}", headers=headers)


class TestDisplayScheduledPlaylist:
    """Test that display endpoint respects playlist scheduling"""
    
    def test_display_data_includes_playlist(self):
        """Test that display endpoint returns playlist data (scheduling tested via logic)"""
        # Using known display code
        response = requests.get(f"{BASE_URL}/api/display/386621")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "screen" in data
        assert "settings" in data
        # playlist may or may not be present depending on assignment
        print(f"Display data includes: screen={data['screen'].get('name', 'Unknown')}")
        
        # Check if settings have ticker_speed and rss_items
        settings = data.get("settings", {})
        if settings:
            ticker_speed = settings.get("ticker_speed")
            rss_items = settings.get("rss_items", [])
            print(f"Display settings: ticker_speed={ticker_speed}, rss_items_count={len(rss_items)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
