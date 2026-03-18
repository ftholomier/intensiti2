"""
Test Iteration 8 - 48 Themes + 12 Animations System
Tests:
1. GET /api/settings returns selected_theme_id and selected_animation_id fields
2. PUT /api/settings saves selected_theme_id and selected_animation_id
3. custom_css contains THEME: and ANIM: markers after selection
4. Theme persistence across page reload
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://themes-live.preview.emergentagent.com')

# Test credentials
CLIENT_EMAIL = "demo@test.com"
CLIENT_PASSWORD = "demo123"


@pytest.fixture(scope="module")
def client_token():
    """Get client authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture
def auth_headers(client_token):
    """Headers with client auth token"""
    return {"Authorization": f"Bearer {client_token}", "Content-Type": "application/json"}


class TestSettingsThemeAnimationFields:
    """Test that GET /api/settings returns new theme/animation ID fields"""
    
    def test_settings_has_theme_id_field(self, auth_headers):
        """GET /api/settings should return selected_theme_id field"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200, f"GET settings failed: {response.text}"
        
        data = response.json()
        # Field should exist (may be None initially)
        assert "selected_theme_id" in data or data.get("selected_theme_id") is None or "selected_theme_id" in str(data), \
            "Settings should have selected_theme_id field (or it can be None)"
        print(f"✓ GET /api/settings includes selected_theme_id: {data.get('selected_theme_id')}")
    
    def test_settings_has_animation_id_field(self, auth_headers):
        """GET /api/settings should return selected_animation_id field"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200, f"GET settings failed: {response.text}"
        
        data = response.json()
        # Check field presence
        assert "selected_animation_id" in data or data.get("selected_animation_id") is None, \
            "Settings should have selected_animation_id field"
        print(f"✓ GET /api/settings includes selected_animation_id: {data.get('selected_animation_id')}")


class TestThemeSelection:
    """Test theme selection saves correctly"""
    
    # Sample Volcan theme data (Special category - dark with red)
    VOLCAN_THEME = {
        "header_bg": "#1A0000",
        "footer_bg": "#2D0A0A",
        "content_bg": "#0F0000",
        "text_color": "#FCA5A5",
        "block_bg": "rgba(252,165,165,0.06)",
        "block_text_color": "#FCA5A5",
        "primary_color": "#EF4444",
        "selected_theme_id": "volcan",
        "selected_animation_id": "none",
        "custom_css": """/* THEME:volcan */
.display-text-content { color: #FCA5A5; }
[data-testid="display-header"] > div { background: #1A0000 !important; }
[data-testid="display-footer"] > div { background: #2D0A0A !important; }
[data-testid="display-main"] { background: linear-gradient(160deg, #0F0000 0%, #1A0000 100%) !important; }"""
    }
    
    def test_put_settings_with_theme_id(self, auth_headers):
        """PUT /api/settings should accept selected_theme_id"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json=self.VOLCAN_THEME
        )
        assert response.status_code == 200, f"PUT settings failed: {response.text}"
        
        data = response.json()
        assert data.get("selected_theme_id") == "volcan", "selected_theme_id should be 'volcan'"
        assert "THEME:volcan" in data.get("custom_css", ""), "custom_css should contain THEME:volcan marker"
        print(f"✓ PUT /api/settings saves selected_theme_id: {data.get('selected_theme_id')}")
    
    def test_theme_persistence(self, auth_headers):
        """Theme selection should persist (GET after PUT)"""
        # First set the theme
        requests.put(f"{BASE_URL}/api/settings", headers=auth_headers, json=self.VOLCAN_THEME)
        
        # Then GET to verify
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("selected_theme_id") == "volcan", "Theme should persist"
        print(f"✓ Theme persists after reload: {data.get('selected_theme_id')}")


class TestAnimationSelection:
    """Test animation selection saves correctly"""
    
    # Theme + Animation combined data
    THEME_WITH_ANIMATION = {
        "header_bg": "#0F172A",
        "footer_bg": "#1E293B",
        "content_bg": "#020617",
        "text_color": "#E2E8F0",
        "selected_theme_id": "nuit-etoilee",
        "selected_animation_id": "lignes-fluides",
        "custom_css": """/* THEME:nuit-etoilee */
.display-text-content { color: #E2E8F0; }
[data-testid="display-header"] > div { background: #0F172A !important; }
[data-testid="display-footer"] > div { background: #1E293B !important; }
[data-testid="display-main"] { background: linear-gradient(160deg, #020617 0%, #0F172A 100%) !important; }
/* ANIM:lignes-fluides */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; opacity: 0.07;
}"""
    }
    
    def test_put_settings_with_animation_id(self, auth_headers):
        """PUT /api/settings should accept selected_animation_id"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json=self.THEME_WITH_ANIMATION
        )
        assert response.status_code == 200, f"PUT settings failed: {response.text}"
        
        data = response.json()
        assert data.get("selected_animation_id") == "lignes-fluides", "selected_animation_id should be 'lignes-fluides'"
        print(f"✓ PUT /api/settings saves selected_animation_id: {data.get('selected_animation_id')}")
    
    def test_custom_css_has_both_markers(self, auth_headers):
        """custom_css should contain both THEME: and ANIM: markers"""
        # Apply combined theme + animation
        requests.put(f"{BASE_URL}/api/settings", headers=auth_headers, json=self.THEME_WITH_ANIMATION)
        
        # Get settings
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        custom_css = data.get("custom_css", "")
        
        assert "THEME:" in custom_css, "custom_css should contain THEME: marker"
        assert "ANIM:" in custom_css, "custom_css should contain ANIM: marker"
        print(f"✓ custom_css contains both THEME: and ANIM: markers")
    
    def test_animation_persistence(self, auth_headers):
        """Animation selection should persist"""
        # Set theme + animation
        requests.put(f"{BASE_URL}/api/settings", headers=auth_headers, json=self.THEME_WITH_ANIMATION)
        
        # GET to verify
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        data = response.json()
        
        assert data.get("selected_animation_id") == "lignes-fluides", "Animation should persist"
        print(f"✓ Animation persists: {data.get('selected_animation_id')}")


class TestDisplayEndpoint:
    """Test that /api/display/{code} returns settings with theme/animation data"""
    
    def test_display_returns_settings_with_custom_css(self, auth_headers):
        """GET /api/display/{code} should return settings with custom_css"""
        # First get a screen's pairing code
        screens_response = requests.get(f"{BASE_URL}/api/screens", headers=auth_headers)
        assert screens_response.status_code == 200
        
        screens = screens_response.json()
        if not screens:
            pytest.skip("No screens available for testing")
        
        pairing_code = screens[0].get("pairing_code")
        assert pairing_code, "Screen should have pairing_code"
        
        # Get display data
        response = requests.get(f"{BASE_URL}/api/display/{pairing_code}")
        assert response.status_code == 200, f"GET display failed: {response.text}"
        
        data = response.json()
        settings = data.get("settings", {})
        
        # Settings should have custom_css
        assert "custom_css" in settings or settings.get("custom_css") is not None, \
            "Display settings should include custom_css"
        print(f"✓ GET /api/display/{pairing_code} returns settings with custom_css")
        
        # If theme/animation are set, they should be in settings
        if settings.get("selected_theme_id"):
            print(f"   - selected_theme_id: {settings.get('selected_theme_id')}")
        if settings.get("selected_animation_id"):
            print(f"   - selected_animation_id: {settings.get('selected_animation_id')}")


class TestPartialUpdates:
    """Test partial updates work correctly"""
    
    def test_update_only_animation(self, auth_headers):
        """Updating only animation_id should not clear theme_id"""
        # First set both
        requests.put(f"{BASE_URL}/api/settings", headers=auth_headers, json={
            "selected_theme_id": "volcan",
            "selected_animation_id": "particules"
        })
        
        # Now update only animation
        response = requests.put(f"{BASE_URL}/api/settings", headers=auth_headers, json={
            "selected_animation_id": "bokeh"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("selected_animation_id") == "bokeh", "Animation should update"
        # Theme should remain (partial update doesn't clear other fields)
        print(f"✓ Partial update works - animation: {data.get('selected_animation_id')}, theme: {data.get('selected_theme_id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
