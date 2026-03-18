import requests
import sys
import json
from datetime import datetime

class IntensitivAPITester:
    def __init__(self, base_url="https://themes-live.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.client_token = None
        self.client_id = None
        self.screen_id = None
        self.media_id = None
        self.playlist_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if files:
            # Remove Content-Type for file uploads
            test_headers.pop('Content-Type', None)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=test_headers, data=data)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_msg = response.json().get('detail', response.text)
                    self.log(f"   Error: {error_msg}")
                except:
                    self.log(f"   Error: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })

            return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_admin_login(self):
        """Test super admin login"""
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@intensiti.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log(f"   Admin token acquired")
            return True
        return False

    def test_admin_auth_header(self):
        return {'Authorization': f'Bearer {self.admin_token}'}

    def test_client_auth_header(self):
        return {'Authorization': f'Bearer {self.client_token}'}

    def test_create_client(self):
        """Test client creation by super admin"""
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data={
                "email": "demo@client.com",
                "password": "demo123", 
                "company_name": "DemoClient",
                "max_screens": 10
            },
            headers=self.test_admin_auth_header()
        )
        if success and 'id' in response:
            self.client_id = response['id']
            self.log(f"   Client created with ID: {self.client_id}")
            return True
        return False

    def test_client_login(self):
        """Test client login"""
        success, response = self.run_test(
            "Client Login",
            "POST",
            "auth/login",
            200,
            data={"email": "demo@client.com", "password": "demo123"}
        )
        if success and 'token' in response:
            self.client_token = response['token']
            self.log(f"   Client token acquired")
            return True
        return False

    def test_client_stats(self):
        """Test client dashboard stats"""
        success, response = self.run_test(
            "Client Dashboard Stats",
            "GET",
            "stats",
            200,
            headers=self.test_client_auth_header()
        )
        if success:
            expected_keys = ['total_screens', 'online_screens', 'total_media', 'total_playlists']
            if all(key in response for key in expected_keys):
                self.log(f"   Stats: {response}")
                return True
        return False

    def test_create_screen(self):
        """Test screen creation"""
        success, response = self.run_test(
            "Create Screen",
            "POST",
            "screens",
            200,
            data={
                "name": "Accueil",
                "weather_city": "Paris"
            },
            headers=self.test_client_auth_header()
        )
        if success and 'id' in response:
            self.screen_id = response['id']
            pairing_code = response.get('pairing_code')
            self.log(f"   Screen created with ID: {self.screen_id}, Code: {pairing_code}")
            return True
        return False

    def test_list_screens(self):
        """Test listing screens"""
        success, response = self.run_test(
            "List Screens",
            "GET",
            "screens",
            200,
            headers=self.test_client_auth_header()
        )
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} screens")
            return True
        return False

    def test_create_playlist(self):
        """Test playlist creation"""
        success, response = self.run_test(
            "Create Playlist",
            "POST",
            "playlists",
            200,
            data={"name": "Ma Playlist"},
            headers=self.test_client_auth_header()
        )
        if success and 'id' in response:
            self.playlist_id = response['id']
            self.log(f"   Playlist created with ID: {self.playlist_id}")
            return True
        return False

    def test_get_playlist(self):
        """Test getting playlist details"""
        if not self.playlist_id:
            return False
        success, response = self.run_test(
            "Get Playlist Details",
            "GET",
            f"playlists/{self.playlist_id}",
            200,
            headers=self.test_client_auth_header()
        )
        if success:
            self.log(f"   Playlist slides: {len(response.get('slides', []))}")
            return True
        return False

    def test_update_playlist_with_slides(self):
        """Test updating playlist with sample slides"""
        if not self.playlist_id:
            return False
        
        sample_slides = [
            {
                "id": "slide-1",
                "type": "text",
                "content": {
                    "html": "<p style='color: white; font-size: 24px;'>Bienvenue chez DemoClient</p>",
                    "text": "Bienvenue chez DemoClient"
                },
                "duration": 10,
                "transition": "fade",
                "layout": "full",
                "fit_mode": "fit",
                "is_active": True,
                "order": 0
            }
        ]
        
        success, response = self.run_test(
            "Update Playlist with Slides",
            "PUT",
            f"playlists/{self.playlist_id}",
            200,
            data={"slides": sample_slides},
            headers=self.test_client_auth_header()
        )
        if success:
            self.log(f"   Playlist updated with {len(sample_slides)} slides")
            return True
        return False

    def test_assign_playlist_to_screen(self):
        """Test assigning playlist to screen"""
        if not self.screen_id or not self.playlist_id:
            return False
        success, response = self.run_test(
            "Assign Playlist to Screen",
            "PUT",
            f"screens/{self.screen_id}",
            200,
            data={"playlist_id": self.playlist_id},
            headers=self.test_client_auth_header()
        )
        if success:
            self.log(f"   Playlist assigned to screen")
            return True
        return False

    def test_weather_api(self):
        """Test weather API"""
        success, response = self.run_test(
            "Weather API",
            "GET",
            "weather?city=Paris",
            200
        )
        if success:
            if 'temp' in response:
                self.log(f"   Weather: {response.get('temp')}°C, {response.get('description', '')}")
                return True
            elif 'error' in response:
                self.log(f"   Weather API error (expected): {response.get('error')}")
                return True
        return False

    def test_get_display_data(self):
        """Test display endpoint"""
        if not self.screen_id:
            return False
        
        # First get screen info to get pairing code
        success, screen_response = self.run_test(
            "Get Screen Info",
            "GET",
            "screens",
            200,
            headers=self.test_client_auth_header()
        )
        
        if success and screen_response:
            pairing_code = None
            for screen in screen_response:
                if screen.get('id') == self.screen_id:
                    pairing_code = screen.get('pairing_code')
                    break
                    
            if pairing_code:
                success, response = self.run_test(
                    "Display Data",
                    "GET",
                    f"display/{pairing_code}",
                    200
                )
                if success:
                    self.log(f"   Display data retrieved for code: {pairing_code}")
                    return True
        return False

    def test_settings_management(self):
        """Test settings endpoints"""
        # Get current settings
        success, response = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200,
            headers=self.test_client_auth_header()
        )
        
        if success:
            # Update settings
            success, response = self.run_test(
                "Update Settings",
                "PUT",
                "settings",
                200,
                data={
                    "footer_text": "Test Footer Message",
                    "primary_color": "#FF6B6B"
                },
                headers=self.test_client_auth_header()
            )
            if success:
                self.log(f"   Settings updated successfully")
                return True
        return False

    def test_flash_alert(self):
        """Test flash alert functionality"""
        success, response = self.run_test(
            "Create Flash Alert",
            "POST",
            "flash-alert",
            200,
            data={
                "message": "Test Alert Message",
                "screen_ids": [self.screen_id] if self.screen_id else None
            },
            headers=self.test_client_auth_header()
        )
        if success:
            self.log(f"   Flash alert created")
            return True
        return False

def main():
    tester = IntensitivAPITester()
    
    print("🚀 Starting Intensiti Digital Signage API Tests")
    print("=" * 60)
    
    # Test sequence
    tests = [
        ("Super Admin Authentication", tester.test_admin_login),
        ("Client Creation", tester.test_create_client),
        ("Client Authentication", tester.test_client_login),
        ("Client Dashboard Stats", tester.test_client_stats),
        ("Screen Creation", tester.test_create_screen),
        ("Screen Listing", tester.test_list_screens),
        ("Playlist Creation", tester.test_create_playlist),
        ("Playlist Details", tester.test_get_playlist),
        ("Playlist Update with Slides", tester.test_update_playlist_with_slides),
        ("Assign Playlist to Screen", tester.test_assign_playlist_to_screen),
        ("Display Data Endpoint", tester.test_get_display_data),
        ("Weather API", tester.test_weather_api),
        ("Settings Management", tester.test_settings_management),
        ("Flash Alert System", tester.test_flash_alert),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            tester.log(f"❌ {test_name} - Exception: {str(e)}")
            tester.failed_tests.append({
                "test": test_name,
                "error": str(e)
            })
        print("-" * 40)
    
    # Print summary
    print("\n📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Total tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failed in tester.failed_tests:
            error_msg = failed.get('error', f"Status {failed.get('actual')} != {failed.get('expected')}")
            print(f"  - {failed['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\nSuccess rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())