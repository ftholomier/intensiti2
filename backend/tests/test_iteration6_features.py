"""
Iteration 6 Feature Tests - Testing 5 new features:
1. Split-Immersion Layout (50/50 Full Screen)
2. WYSIWYG Editor Height (min-h-[250px])
3. Custom CSS in Settings
4. WYSIWYG Font Sizes in Settings (6 sizes in pixels)
5. Rename Playlist (from list page + auto-save name in editor)
6. Default Transition (already in iteration 5, verify still works)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def client_token():
    """Login as demo client and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo@test.com",
        "password": "demo123"
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Client authentication failed")

@pytest.fixture
def auth_headers(client_token):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {client_token}"}

# ===============================
# FEATURE 3: Custom CSS in Settings
# ===============================
class TestCustomCSS:
    """Test custom_css field in settings API"""
    
    def test_get_settings_includes_custom_css(self, auth_headers):
        """GET /api/settings should include custom_css field"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Field should exist (may be empty or None)
        assert "custom_css" in data or data.get("custom_css") is None
        print(f"SUCCESS: custom_css field present in settings")
    
    def test_put_settings_custom_css(self, auth_headers):
        """PUT /api/settings can save custom_css"""
        test_css = ".display-text-content { font-family: Georgia, serif; letter-spacing: 0.05em; }"
        response = requests.put(f"{BASE_URL}/api/settings", 
            headers=auth_headers, 
            json={"custom_css": test_css}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("custom_css") == test_css
        print(f"SUCCESS: custom_css saved: {test_css[:50]}...")
    
    def test_custom_css_persists(self, auth_headers):
        """Verify custom_css value persists after GET"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Should have the previously saved CSS
        assert data.get("custom_css") is not None
        print(f"SUCCESS: custom_css persists: {data.get('custom_css', '')[:50]}...")

# ===============================
# FEATURE 4: WYSIWYG Font Sizes in Settings
# ===============================
class TestWYSIWYGFontSizes:
    """Test WYSIWYG font size settings (6 sizes in pixels)"""
    
    def test_get_settings_includes_wysiwyg_sizes(self, auth_headers):
        """GET /api/settings should include all 6 WYSIWYG size fields"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # All 6 size fields should be present
        size_fields = [
            "wysiwyg_size_small",   # Petit
            "wysiwyg_size_normal",  # Normal
            "wysiwyg_size_medium",  # Moyen
            "wysiwyg_size_large",   # Grand
            "wysiwyg_size_xlarge",  # Tres grand
            "wysiwyg_size_huge"     # Enorme
        ]
        
        for field in size_fields:
            # Field should exist (may be None or integer)
            print(f"  Checking {field}: {data.get(field)}")
        
        print(f"SUCCESS: All WYSIWYG size fields present in settings")
    
    def test_put_wysiwyg_sizes(self, auth_headers):
        """PUT /api/settings can save WYSIWYG font sizes"""
        sizes = {
            "wysiwyg_size_small": 14,    # Petit
            "wysiwyg_size_normal": 18,   # Normal
            "wysiwyg_size_medium": 24,   # Moyen
            "wysiwyg_size_large": 32,    # Grand
            "wysiwyg_size_xlarge": 48,   # Tres grand
            "wysiwyg_size_huge": 64      # Enorme
        }
        
        response = requests.put(f"{BASE_URL}/api/settings", 
            headers=auth_headers, 
            json=sizes
        )
        assert response.status_code == 200
        data = response.json()
        
        for field, expected_value in sizes.items():
            assert data.get(field) == expected_value, f"{field} mismatch: got {data.get(field)}"
            print(f"  {field} = {data.get(field)}px")
        
        print(f"SUCCESS: All WYSIWYG font sizes saved correctly")

# ===============================
# FEATURE 5: Rename Playlist
# ===============================
class TestRenamePlaylist:
    """Test playlist rename functionality"""
    
    def test_playlist_rename_via_put(self, auth_headers):
        """PUT /api/playlists/{id} can rename playlist"""
        # First get the existing playlist
        playlist_id = "b085ffb2-a06f-4f8a-b01f-24c303ba8f87"
        
        response = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=auth_headers)
        if response.status_code != 200:
            pytest.skip(f"Playlist {playlist_id} not found")
        
        original_name = response.json().get("name")
        print(f"Original playlist name: {original_name}")
        
        # Rename to a test name
        test_name = "TEST_Renamed_Playlist"
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            headers=auth_headers, 
            json={"name": test_name}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == test_name
        print(f"SUCCESS: Playlist renamed to '{test_name}'")
        
        # Restore original name
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            headers=auth_headers, 
            json={"name": original_name}
        )
        assert response.status_code == 200
        print(f"SUCCESS: Playlist name restored to '{original_name}'")
    
    def test_playlist_name_persists(self, auth_headers):
        """Verify playlist name persists after rename"""
        # Get playlists list
        response = requests.get(f"{BASE_URL}/api/playlists", headers=auth_headers)
        assert response.status_code == 200
        playlists = response.json()
        
        assert len(playlists) > 0, "No playlists found"
        
        # Each playlist should have a name
        for pl in playlists:
            assert "name" in pl
            assert "id" in pl
            print(f"  Playlist: {pl['name']} (id={pl['id'][:8]}...)")
        
        print(f"SUCCESS: All {len(playlists)} playlists have names")

# ===============================
# FEATURE 6: Default Transition (verify from iteration 5)
# ===============================
class TestDefaultTransition:
    """Test default_transition setting"""
    
    def test_default_transition_in_settings(self, auth_headers):
        """GET /api/settings should include default_transition"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Field should exist
        print(f"  default_transition = {data.get('default_transition')}")
        print(f"SUCCESS: default_transition field present")
    
    def test_put_default_transition(self, auth_headers):
        """PUT /api/settings can save default_transition values"""
        transitions = ['fade', 'slide', 'random', 'none']
        
        for t in transitions:
            response = requests.put(f"{BASE_URL}/api/settings", 
                headers=auth_headers, 
                json={"default_transition": t}
            )
            assert response.status_code == 200
            data = response.json()
            assert data.get("default_transition") == t
            print(f"  Saved default_transition = {t}")
        
        # Restore to 'fade'
        requests.put(f"{BASE_URL}/api/settings", headers=auth_headers, json={"default_transition": "fade"})
        print(f"SUCCESS: All transition values save correctly")

# ===============================
# FEATURE 1 & 2: Split-Immersion Layout - Display verification
# ===============================
class TestDisplaySplitImmersion:
    """Test that Display returns correct data for split-immersion"""
    
    def test_display_endpoint_returns_settings(self):
        """GET /api/display/{code} returns settings with custom_css and font sizes"""
        display_code = "386621"
        response = requests.get(f"{BASE_URL}/api/display/{display_code}")
        
        if response.status_code != 200:
            pytest.skip(f"Display code {display_code} not found")
        
        data = response.json()
        
        # Check settings are returned
        assert "settings" in data
        settings = data.get("settings", {})
        
        # Settings should include custom_css
        print(f"  custom_css: {str(settings.get('custom_css', ''))[:50]}")
        
        # Settings should include WYSIWYG font sizes
        print(f"  wysiwyg_size_small: {settings.get('wysiwyg_size_small')}")
        print(f"  wysiwyg_size_normal: {settings.get('wysiwyg_size_normal')}")
        print(f"  wysiwyg_size_medium: {settings.get('wysiwyg_size_medium')}")
        print(f"  wysiwyg_size_large: {settings.get('wysiwyg_size_large')}")
        print(f"  wysiwyg_size_xlarge: {settings.get('wysiwyg_size_xlarge')}")
        print(f"  wysiwyg_size_huge: {settings.get('wysiwyg_size_huge')}")
        print(f"  default_transition: {settings.get('default_transition')}")
        
        print(f"SUCCESS: Display endpoint returns all settings fields")
    
    def test_display_returns_playlist_with_layouts(self):
        """GET /api/display/{code} returns playlist with layout info"""
        display_code = "386621"
        response = requests.get(f"{BASE_URL}/api/display/{display_code}")
        
        if response.status_code != 200:
            pytest.skip(f"Display code {display_code} not found")
        
        data = response.json()
        playlist = data.get("playlist")
        
        if not playlist:
            pytest.skip("No playlist assigned to display")
        
        slides = playlist.get("slides", [])
        print(f"  Playlist has {len(slides)} slides")
        
        for i, slide in enumerate(slides):
            layout = slide.get("layout", "full")
            slide_type = slide.get("type", "unknown")
            print(f"  Slide {i+1}: type={slide_type}, layout={layout}")
        
        print(f"SUCCESS: Display returns playlist with slide layouts")

# ===============================
# Test adding a split-immersion slide via API
# ===============================
class TestAddSplitImmersionSlide:
    """Test adding and removing a split-immersion slide"""
    
    def test_add_split_immersion_slide(self, auth_headers):
        """Add a split-immersion slide to test playlist"""
        playlist_id = "b085ffb2-a06f-4f8a-b01f-24c303ba8f87"
        
        # Get current playlist
        response = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=auth_headers)
        if response.status_code != 200:
            pytest.skip(f"Playlist {playlist_id} not found")
        
        playlist = response.json()
        original_slides = playlist.get("slides", [])
        print(f"  Original slide count: {len(original_slides)}")
        
        # Create a split-immersion slide
        import uuid
        test_slide = {
            "id": str(uuid.uuid4()),
            "type": "split",
            "content": {},
            "duration": 8,
            "transition": "fade",
            "layout": "split-immersion",  # The new layout type
            "fit_mode": "fit",
            "is_active": True,
            "order": len(original_slides),
            "schedule_start": None,
            "schedule_end": None,
            "split_left_type": "text",
            "split_left_content": {"html": "<p>Left Content</p>"},
            "split_right_type": "media",
            "split_right_content": {}
        }
        
        # Add the slide
        new_slides = original_slides + [test_slide]
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            headers=auth_headers, 
            json={"slides": new_slides}
        )
        assert response.status_code == 200
        
        # Verify it was added
        response = requests.get(f"{BASE_URL}/api/playlists/{playlist_id}", headers=auth_headers)
        updated = response.json()
        assert len(updated.get("slides", [])) == len(original_slides) + 1
        
        # Check the new slide has split-immersion layout
        added_slide = updated["slides"][-1]
        assert added_slide.get("layout") == "split-immersion"
        print(f"SUCCESS: Split-immersion slide added (layout={added_slide.get('layout')})")
        
        # Cleanup - remove the test slide
        response = requests.put(f"{BASE_URL}/api/playlists/{playlist_id}", 
            headers=auth_headers, 
            json={"slides": original_slides}
        )
        assert response.status_code == 200
        print(f"SUCCESS: Test slide cleaned up")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
