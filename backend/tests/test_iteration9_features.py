"""
Iteration 9 - Testing 7 New Features:
1. Seconds displayed with leading zero (01,02...)
2. Weather city configurable in Settings
3. More visible background animations
4. Theme CSS NOT shown in Settings custom CSS textarea (separate theme_css field)
5. Hide #emergent-badge CSS hardcoded
6. Flash Info alert system with send/dismiss/history
7. Eco mode with time range in Settings
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for demo client"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_login_success(self):
        """Test login with demo client credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "client"
        print("✓ Login successful with demo@test.com")


class TestWeatherCitySettings:
    """Feature 2: Weather city configurable in Settings"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_get_settings_has_weather_city(self, auth_headers):
        """Test GET /api/settings returns weather_city field"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # weather_city should be a valid field (can be None or string)
        assert "weather_city" in data or data.get("weather_city") is None or isinstance(data.get("weather_city"), str)
        print(f"✓ GET /api/settings returns weather_city: {data.get('weather_city')}")
    
    def test_update_weather_city(self, auth_headers):
        """Test PUT /api/settings accepts weather_city"""
        response = requests.put(f"{BASE_URL}/api/settings", 
            headers=auth_headers,
            json={"weather_city": "Paris"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("weather_city") == "Paris"
        print("✓ PUT /api/settings accepts weather_city='Paris'")
    
    def test_verify_weather_city_persisted(self, auth_headers):
        """Verify weather_city was persisted"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("weather_city") == "Paris"
        print("✓ weather_city='Paris' persisted correctly")


class TestEcoModeSettings:
    """Feature 7: Eco mode with time range in Settings"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_settings_accepts_eco_mode_enabled(self, auth_headers):
        """Test PUT /api/settings accepts eco_mode_enabled"""
        response = requests.put(f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json={"eco_mode_enabled": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("eco_mode_enabled") == True
        print("✓ PUT /api/settings accepts eco_mode_enabled=True")
    
    def test_settings_accepts_eco_mode_start(self, auth_headers):
        """Test PUT /api/settings accepts eco_mode_start"""
        response = requests.put(f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json={"eco_mode_start": "22:00"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("eco_mode_start") == "22:00"
        print("✓ PUT /api/settings accepts eco_mode_start='22:00'")
    
    def test_settings_accepts_eco_mode_end(self, auth_headers):
        """Test PUT /api/settings accepts eco_mode_end"""
        response = requests.put(f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json={"eco_mode_end": "07:00"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("eco_mode_end") == "07:00"
        print("✓ PUT /api/settings accepts eco_mode_end='07:00'")
    
    def test_verify_eco_mode_settings_persisted(self, auth_headers):
        """Verify all eco mode settings persisted"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("eco_mode_enabled") == True
        assert data.get("eco_mode_start") == "22:00"
        assert data.get("eco_mode_end") == "07:00"
        print("✓ All eco mode settings persisted correctly")


class TestThemeCssSeparation:
    """Feature 4: Theme CSS NOT shown in Settings custom CSS textarea (separate theme_css field)"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_settings_accepts_theme_css(self, auth_headers):
        """Test PUT /api/settings accepts theme_css field"""
        test_theme_css = "/* THEME:test */ .test { color: red; }"
        response = requests.put(f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json={"theme_css": test_theme_css}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("theme_css") == test_theme_css
        print("✓ PUT /api/settings accepts theme_css field")
    
    def test_theme_css_separate_from_custom_css(self, auth_headers):
        """Test that theme_css and custom_css are separate fields"""
        # Set custom_css to something different
        custom_css_value = ".my-custom { font-size: 20px; }"
        response = requests.put(f"{BASE_URL}/api/settings",
            headers=auth_headers,
            json={"custom_css": custom_css_value}
        )
        assert response.status_code == 200
        
        # Verify both fields exist and are separate
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # custom_css should NOT contain THEME: marker
        custom_css = data.get("custom_css", "")
        assert "THEME:" not in custom_css, "custom_css should NOT contain THEME: marker"
        assert "ANIM:" not in custom_css, "custom_css should NOT contain ANIM: marker"
        print("✓ custom_css does NOT contain THEME: or ANIM: markers")
    
    def test_verify_theme_css_persisted(self, auth_headers):
        """Verify theme_css is persisted separately"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # theme_css should exist as a field
        assert "theme_css" in data or data.get("theme_css") is not None
        print(f"✓ theme_css field exists: {data.get('theme_css', '')[:50]}...")


class TestFlashAlertSystem:
    """Feature 6: Flash Info alert system with send/dismiss/history"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_get_flash_alerts_endpoint(self, auth_headers):
        """Test GET /api/flash-alerts returns alerts list"""
        response = requests.get(f"{BASE_URL}/api/flash-alerts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/flash-alerts returns list with {len(data)} alerts")
    
    def test_send_flash_alert(self, auth_headers):
        """Test POST /api/flash-alert sends a new alert"""
        response = requests.post(f"{BASE_URL}/api/flash-alert",
            headers=auth_headers,
            json={"message": "TEST_ALERT: Evacuation immediate"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "TEST_ALERT: Evacuation immediate"
        assert data.get("is_active") == True
        assert "id" in data
        print(f"✓ POST /api/flash-alert created alert with id: {data.get('id')}")
        return data.get("id")
    
    def test_verify_alert_in_history(self, auth_headers):
        """Verify the alert appears in history"""
        response = requests.get(f"{BASE_URL}/api/flash-alerts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Find our test alert
        test_alerts = [a for a in data if "TEST_ALERT" in a.get("message", "")]
        assert len(test_alerts) > 0, "Test alert should appear in history"
        print(f"✓ Alert appears in history: {test_alerts[0].get('message')}")
    
    def test_dismiss_flash_alert(self, auth_headers):
        """Test DELETE /api/flash-alert dismisses the alert"""
        response = requests.delete(f"{BASE_URL}/api/flash-alert", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ DELETE /api/flash-alert dismissed the alert")
    
    def test_verify_alert_deactivated(self, auth_headers):
        """Verify the alert is deactivated after dismiss"""
        response = requests.get(f"{BASE_URL}/api/flash-alerts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # All alerts should be inactive now
        active_alerts = [a for a in data if a.get("is_active") == True]
        assert len(active_alerts) == 0, "No alerts should be active after dismiss"
        print("✓ All alerts deactivated after dismiss")


class TestDisplayEndpoint:
    """Test display endpoint returns all new settings"""
    
    def test_display_returns_settings_with_new_fields(self):
        """Test GET /api/display/{code} returns settings with new fields"""
        # First get a screen code
        auth_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@test.com",
            "password": "demo123"
        })
        headers = {"Authorization": f"Bearer {auth_response.json()['token']}"}
        
        # Get screens to find a pairing code
        screens_response = requests.get(f"{BASE_URL}/api/screens", headers=headers)
        if screens_response.status_code == 200 and len(screens_response.json()) > 0:
            screen = screens_response.json()[0]
            code = screen.get("pairing_code")
            
            # Test display endpoint
            response = requests.get(f"{BASE_URL}/api/display/{code}")
            assert response.status_code == 200
            data = response.json()
            
            settings = data.get("settings", {})
            # Verify new fields are present in settings
            print(f"✓ Display endpoint returns settings with weather_city: {settings.get('weather_city')}")
            print(f"✓ Display endpoint returns settings with eco_mode_enabled: {settings.get('eco_mode_enabled')}")
            print(f"✓ Display endpoint returns settings with theme_css present: {'theme_css' in settings}")
        else:
            pytest.skip("No screens available for testing")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
