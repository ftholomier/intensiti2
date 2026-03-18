"""
Test Themes Feature - Iteration 7
Tests the Themes page functionality: theme selection via PUT /api/settings with color settings and custom_css
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


class TestThemesBackend:
    """Backend API tests for Themes feature"""
    
    # Sample theme data (Nuit Etoilee)
    NUIT_ETOILEE_THEME = {
        "header_bg": "#0F172A",
        "footer_bg": "#1E293B",
        "content_bg": "#020617",
        "text_color": "#E2E8F0",
        "block_bg": "rgba(226,232,240,0.06)",
        "block_text_color": "#E2E8F0",
        "primary_color": "#6366F1",
        "custom_css": """/* Nuit Etoilee */
.display-text-content { color: #E2E8F0; }
[data-testid="display-main"] {
  background: linear-gradient(180deg, #020617 0%, #0F172A 60%, #1E293B 100%) !important;
  overflow: hidden;
}"""
    }
    
    # Sample theme data (Lumiere Pure - light theme)
    LUMIERE_PURE_THEME = {
        "header_bg": "#F8FAFC",
        "footer_bg": "#F1F5F9",
        "content_bg": "#FFFFFF",
        "text_color": "#1E293B",
        "block_bg": "rgba(30,41,59,0.06)",
        "block_text_color": "#334155",
        "primary_color": "#3B82F6",
        "custom_css": """/* Lumiere Pure */
.display-text-content { color: #1E293B; }
[data-testid="display-header"] > div,
[data-testid="display-footer"] > div {
  background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%) !important;
}"""
    }

    def test_get_settings(self, auth_headers):
        """Test GET /api/settings returns settings with theme fields"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200, f"GET settings failed: {response.text}"
        
        data = response.json()
        # Verify theme-related fields exist
        assert "custom_css" in data, "Settings should contain custom_css field"
        assert "header_bg" in data, "Settings should contain header_bg"
        assert "footer_bg" in data, "Settings should contain footer_bg"
        assert "text_color" in data, "Settings should contain text_color"
        assert "content_bg" in data, "Settings should contain content_bg"
        assert "primary_color" in data, "Settings should contain primary_color"
        print(f"✓ GET /api/settings returns theme fields correctly")
    
    def test_put_settings_apply_dark_theme(self, auth_headers):
        """Test PUT /api/settings accepts theme color settings and custom_css (dark theme)"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json=self.NUIT_ETOILEE_THEME
        )
        assert response.status_code == 200, f"PUT settings failed: {response.text}"
        
        data = response.json()
        # Verify theme was applied
        assert "Nuit Etoilee" in data.get("custom_css", ""), "custom_css should contain theme name"
        assert data.get("header_bg") == "#0F172A", "header_bg not updated correctly"
        assert data.get("primary_color") == "#6366F1", "primary_color not updated correctly"
        print(f"✓ PUT /api/settings applies Nuit Etoilee theme correctly")
    
    def test_put_settings_apply_light_theme(self, auth_headers):
        """Test PUT /api/settings accepts light theme settings"""
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json=self.LUMIERE_PURE_THEME
        )
        assert response.status_code == 200, f"PUT settings failed: {response.text}"
        
        data = response.json()
        # Verify light theme was applied
        assert "Lumiere Pure" in data.get("custom_css", ""), "custom_css should contain theme name"
        assert data.get("header_bg") == "#F8FAFC", "header_bg not updated for light theme"
        assert data.get("text_color") == "#1E293B", "text_color not updated for light theme"
        print(f"✓ PUT /api/settings applies Lumiere Pure theme correctly")
    
    def test_theme_persistence_after_reload(self, auth_headers):
        """Test that theme settings persist (GET after PUT)"""
        # First apply a theme
        requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json=self.NUIT_ETOILEE_THEME
        )
        
        # Then GET to verify persistence
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "Nuit Etoilee" in data.get("custom_css", ""), "Theme should persist after reload"
        assert data.get("primary_color") == "#6366F1", "primary_color should persist"
        print(f"✓ Theme settings persist correctly (verified via GET)")
    
    def test_partial_theme_update(self, auth_headers):
        """Test that partial updates work (only updating some fields)"""
        # Update only primary_color
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json={"primary_color": "#EF4444"}  # Red color
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("primary_color") == "#EF4444", "primary_color should be updated"
        # Other fields should remain
        assert "custom_css" in data, "Other fields should remain after partial update"
        print(f"✓ Partial theme update works correctly")
    
    def test_custom_css_with_animations(self, auth_headers):
        """Test that custom_css with CSS animations is accepted"""
        css_with_animation = """/* Ocean Profond */
.display-text-content { color: #E0F2FE; }
[data-testid="display-main"] {
  background: linear-gradient(180deg, #082F49 0%, #0C4A6E 50%, #075985 100%) !important;
}
@keyframes wave-rise { 0% { height: 35%; } 100% { height: 45%; } }
@keyframes wave-sway { 0% { transform: translateX(-3%); } 100% { transform: translateX(3%); } }"""
        
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json={"custom_css": css_with_animation}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "@keyframes" in data.get("custom_css", ""), "CSS animations should be preserved"
        print(f"✓ Custom CSS with animations accepted correctly")


class TestSettingsModel:
    """Test that SettingsUpdate model accepts all theme fields"""
    
    def test_settings_update_all_theme_fields(self, auth_headers):
        """Test PUT /api/settings with all theme-related fields"""
        full_theme_update = {
            "header_bg": "#1E293B",
            "footer_bg": "#0F172A",
            "content_bg": "#020617",
            "text_color": "#E2E8F0",
            "block_bg": "rgba(226,232,240,0.08)",
            "block_text_color": "#E2E8F0",
            "primary_color": "#8B5CF6",
            "custom_css": "/* Test Theme */ .test { color: red; }"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json=full_theme_update
        )
        assert response.status_code == 200, f"Full theme update failed: {response.text}"
        
        data = response.json()
        for key, expected_value in full_theme_update.items():
            assert data.get(key) == expected_value, f"{key} not updated correctly"
        print(f"✓ All theme fields accepted by SettingsUpdate model")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
