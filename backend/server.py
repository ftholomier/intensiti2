from fastapi import FastAPI, APIRouter, UploadFile, File, Depends, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import jwt
import bcrypt
import httpx
import random
import string
import logging
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

JWT_SECRET = os.environ.get('JWT_SECRET', 'intensiti-secret-key')
JWT_ALGORITHM = "HS256"
OPENWEATHER_KEY = os.environ.get('OPENWEATHER_KEY', '')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class ClientCreate(BaseModel):
    email: str
    password: str
    company_name: str
    max_screens: int = 10

class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    max_screens: Optional[int] = None
    is_active: Optional[bool] = None

class ScreenCreate(BaseModel):
    name: str
    weather_city: str = "Paris"
    group: str = ""
    tags: List[str] = []

class ScreenUpdate(BaseModel):
    name: Optional[str] = None
    weather_city: Optional[str] = None
    group: Optional[str] = None
    tags: Optional[List[str]] = None
    playlist_id: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class PairRequest(BaseModel):
    code: str

class PlaylistCreate(BaseModel):
    name: str

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    slides: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None
    schedule_start: Optional[str] = None
    schedule_end: Optional[str] = None
    schedule_days: Optional[List[int]] = None
    schedule_months: Optional[List[int]] = None

class FlashAlertCreate(BaseModel):
    message: str
    screen_ids: Optional[List[str]] = None

class SettingsUpdate(BaseModel):
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    header_bg: Optional[str] = None
    footer_bg: Optional[str] = None
    text_color: Optional[str] = None
    content_bg: Optional[str] = None
    block_bg: Optional[str] = None
    block_text_color: Optional[str] = None
    time_font_size: Optional[int] = None
    date_font_size: Optional[int] = None
    weather_font_size: Optional[int] = None
    footer_font_size: Optional[int] = None
    header_height: Optional[int] = None
    footer_height: Optional[int] = None
    block_padding_v: Optional[int] = None
    block_padding_h: Optional[int] = None
    default_slide_duration: Optional[int] = None
    footer_items: Optional[List[Dict[str, Any]]] = None
    footer_rss_url: Optional[str] = None
    rss_items: Optional[List[Dict[str, Any]]] = None
    ticker_speed: Optional[int] = None
    ticker_text_enabled: Optional[bool] = None
    ticker_rss_enabled: Optional[bool] = None
    default_transition: Optional[str] = None
    custom_css: Optional[str] = None
    theme_css: Optional[str] = None
    selected_theme_id: Optional[str] = None
    selected_animation_id: Optional[str] = None
    weather_city: Optional[str] = None
    eco_mode_enabled: Optional[bool] = None
    eco_mode_start: Optional[str] = None
    eco_mode_end: Optional[str] = None
    weather_icon_size: Optional[int] = None
    wysiwyg_size_small: Optional[int] = None
    wysiwyg_size_normal: Optional[int] = None
    wysiwyg_size_medium: Optional[int] = None
    wysiwyg_size_large: Optional[int] = None
    wysiwyg_size_xlarge: Optional[int] = None
    wysiwyg_size_huge: Optional[int] = None

class YouTubeMediaCreate(BaseModel):
    name: str
    url: str

# --- Auth Helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouve")
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Compte desactive")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expire")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

def require_super_admin(user: dict):
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Acces reserve au super administrateur")

def generate_pairing_code() -> str:
    return ''.join(random.choices(string.digits, k=6))

# --- Auth Routes ---
@api_router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Compte desactive")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "company_name": user.get("company_name", ""),
            "max_screens": user.get("max_screens", 0)
        }
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "company_name": user.get("company_name", ""),
        "max_screens": user.get("max_screens", 0)
    }

# --- Client Management (Super Admin) ---
@api_router.get("/clients")
async def list_clients(request: Request):
    user = await get_current_user(request)
    require_super_admin(user)
    clients = await db.users.find({"role": "client"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for c in clients:
        count = await db.screens.count_documents({"client_id": c["id"]})
        c["screen_count"] = count
    return clients

@api_router.post("/clients")
async def create_client(data: ClientCreate, request: Request):
    user = await get_current_user(request)
    require_super_admin(user)
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email existe deja")
    client_id = str(uuid.uuid4())
    client_data = {
        "id": client_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": "client",
        "company_name": data.company_name,
        "max_screens": data.max_screens,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(client_data)
    settings = {
        "client_id": client_id,
        "logo_url": "",
        "primary_color": "#4F46E5",
        "secondary_color": "#F1F5F9",
        "header_bg": "#0F172A",
        "footer_bg": "#0F172A",
        "text_color": "#FFFFFF",
        "content_bg": "#000000",
        "block_bg": "rgba(255,255,255,0.06)",
        "block_text_color": "#FFFFFF",
        "time_font_size": 32,
        "date_font_size": 14,
        "weather_font_size": 18,
        "footer_font_size": 15,
        "header_height": 72,
        "footer_height": 44,
        "block_padding_v": 6,
        "block_padding_h": 14,
        "default_slide_duration": 10,
        "footer_items": [{"id": str(uuid.uuid4()), "text": "Bienvenue", "is_active": True, "order": 0}],
        "footer_rss_url": "",
        "rss_items": [],
        "ticker_speed": 30,
        "ticker_text_enabled": True,
        "ticker_rss_enabled": True
    }
    await db.client_settings.insert_one(settings)
    return {"id": client_id, "email": data.email, "company_name": data.company_name}

@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, data: ClientUpdate, request: Request):
    user = await get_current_user(request)
    require_super_admin(user)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnee a mettre a jour")
    result = await db.users.update_one({"id": client_id, "role": "client"}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouve")
    return {"message": "Client mis a jour"}

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, request: Request):
    user = await get_current_user(request)
    require_super_admin(user)
    await db.users.delete_one({"id": client_id, "role": "client"})
    await db.screens.delete_many({"client_id": client_id})
    await db.media.delete_many({"client_id": client_id})
    await db.playlists.delete_many({"client_id": client_id})
    await db.client_settings.delete_one({"client_id": client_id})
    return {"message": "Client et toutes ses donnees supprimes"}

# --- Screen Management ---
@api_router.get("/screens")
async def list_screens(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "super_admin" else {"client_id": user["id"]}
    screens = await db.screens.find(query, {"_id": 0}).to_list(1000)
    return screens

@api_router.post("/screens")
async def create_screen(data: ScreenCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Seuls les clients peuvent creer des ecrans")
    current_count = await db.screens.count_documents({"client_id": user["id"]})
    if current_count >= user.get("max_screens", 10):
        raise HTTPException(status_code=400, detail="Quota d'ecrans atteint")
    screen = {
        "id": str(uuid.uuid4()),
        "client_id": user["id"],
        "name": data.name,
        "pairing_code": generate_pairing_code(),
        "is_paired": False,
        "is_online": False,
        "last_heartbeat": None,
        "playlist_id": None,
        "weather_city": data.weather_city,
        "group": data.group,
        "tags": data.tags,
        "settings": {
            "header_bg": "#0A0A0A",
            "footer_bg": "#171717",
            "content_bg": "#000000",
            "text_color": "#F5F5F5",
            "header_height": 100,
            "footer_height": 50,
            "immersion": False
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.screens.insert_one(screen)
    screen.pop("_id", None)
    return screen

@api_router.put("/screens/{screen_id}")
async def update_screen(screen_id: str, data: ScreenUpdate, request: Request):
    user = await get_current_user(request)
    screen = await db.screens.find_one({"id": screen_id}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Ecran non trouve")
    if user["role"] != "super_admin" and screen["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acces non autorise")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.screens.update_one({"id": screen_id}, {"$set": update_data})
    updated = await db.screens.find_one({"id": screen_id}, {"_id": 0})
    return updated

@api_router.delete("/screens/{screen_id}")
async def delete_screen(screen_id: str, request: Request):
    user = await get_current_user(request)
    screen = await db.screens.find_one({"id": screen_id}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Ecran non trouve")
    if user["role"] != "super_admin" and screen["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acces non autorise")
    await db.screens.delete_one({"id": screen_id})
    return {"message": "Ecran supprime"}

@api_router.post("/screens/pair")
async def pair_screen(data: PairRequest):
    screen = await db.screens.find_one({"pairing_code": data.code}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Code d'appairage invalide")
    await db.screens.update_one(
        {"id": screen["id"]},
        {"$set": {"is_paired": True, "is_online": True, "last_heartbeat": datetime.now(timezone.utc).isoformat()}}
    )
    return {"screen_id": screen["id"], "client_id": screen["client_id"]}

@api_router.post("/screens/{screen_id}/heartbeat")
async def screen_heartbeat(screen_id: str):
    await db.screens.update_one(
        {"id": screen_id},
        {"$set": {"is_online": True, "last_heartbeat": datetime.now(timezone.utc).isoformat()}}
    )
    screen = await db.screens.find_one({"id": screen_id}, {"_id": 0})
    alert = None
    force_refresh = False
    if screen:
        alert = await db.flash_alerts.find_one(
            {"client_id": screen["client_id"], "is_active": True}, {"_id": 0}
        )
        force_refresh = screen.get("force_refresh", False)
        # Clear force_refresh flag after reading it
        if force_refresh:
            await db.screens.update_one({"id": screen_id}, {"$set": {"force_refresh": False}})
    return {"status": "ok", "flash_alert": alert, "force_refresh": force_refresh}

@api_router.post("/screens/{screen_id}/refresh")
async def force_refresh_screen(screen_id: str, request: Request):
    user = await get_current_user(request)
    screen = await db.screens.find_one({"id": screen_id}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Ecran non trouve")
    await db.screens.update_one({"id": screen_id}, {"$set": {"force_refresh": True}})
    return {"message": "Rafraichissement force"}

# --- Media Management ---
@api_router.get("/media")
async def list_media(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "super_admin" else {"client_id": user["id"]}
    media = await db.media.find(query, {"_id": 0}).to_list(1000)
    return media

@api_router.post("/media/upload")
async def upload_media(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Seuls les clients peuvent uploader des medias")
    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        media_type = "image"
    elif content_type.startswith("video/"):
        media_type = "video"
    elif content_type == "application/pdf":
        media_type = "pdf"
    else:
        media_type = "other"
    file_ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    media_doc = {
        "id": str(uuid.uuid4()),
        "client_id": user["id"],
        "name": file.filename,
        "type": media_type,
        "filename": filename,
        "url": f"/api/uploads/{filename}",
        "size": os.path.getsize(file_path),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.media.insert_one(media_doc)
    media_doc.pop("_id", None)
    return media_doc

@api_router.post("/media/youtube")
async def add_youtube_media(data: YouTubeMediaCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Seuls les clients peuvent ajouter des medias")
    media_doc = {
        "id": str(uuid.uuid4()),
        "client_id": user["id"],
        "name": data.name,
        "type": "youtube",
        "filename": "",
        "url": data.url,
        "size": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.media.insert_one(media_doc)
    media_doc.pop("_id", None)
    return media_doc

@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, request: Request):
    user = await get_current_user(request)
    media = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Media non trouve")
    if user["role"] != "super_admin" and media["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acces non autorise")
    if media.get("filename"):
        file_path = UPLOAD_DIR / media["filename"]
        if file_path.exists():
            file_path.unlink()
    await db.media.delete_one({"id": media_id})
    return {"message": "Media supprime"}

# --- Playlist Management ---
@api_router.get("/playlists")
async def list_playlists(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "super_admin" else {"client_id": user["id"]}
    playlists = await db.playlists.find(query, {"_id": 0}).to_list(1000)
    return playlists

@api_router.post("/playlists")
async def create_playlist(data: PlaylistCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Seuls les clients peuvent creer des playlists")
    playlist = {
        "id": str(uuid.uuid4()),
        "client_id": user["id"],
        "name": data.name,
        "slides": [],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.playlists.insert_one(playlist)
    playlist.pop("_id", None)
    return playlist

@api_router.get("/playlists/{playlist_id}")
async def get_playlist(playlist_id: str, request: Request):
    user = await get_current_user(request)
    playlist = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee")
    if user["role"] != "super_admin" and playlist["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acces non autorise")
    return playlist

@api_router.put("/playlists/{playlist_id}")
async def update_playlist(playlist_id: str, data: PlaylistUpdate, request: Request):
    user = await get_current_user(request)
    playlist = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee")
    if user["role"] != "super_admin" and playlist["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acces non autorise")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.playlists.update_one({"id": playlist_id}, {"$set": update_data})
    updated = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    return updated

@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, request: Request):
    user = await get_current_user(request)
    playlist = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee")
    if user["role"] != "super_admin" and playlist["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acces non autorise")
    await db.playlists.delete_one({"id": playlist_id})
    await db.screens.update_many({"playlist_id": playlist_id}, {"$set": {"playlist_id": None}})
    return {"message": "Playlist supprimee"}

@api_router.post("/playlists/{playlist_id}/duplicate")
async def duplicate_playlist(playlist_id: str, request: Request):
    user = await get_current_user(request)
    playlist = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvee")
    if user["role"] != "super_admin" and playlist["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acces non autorise")
    import copy
    new_playlist = copy.deepcopy(playlist)
    new_playlist["id"] = str(uuid.uuid4())
    new_playlist["name"] = f"{playlist['name']} (copie)"
    new_playlist["created_at"] = datetime.now(timezone.utc).isoformat()
    for slide in new_playlist.get("slides", []):
        slide["id"] = str(uuid.uuid4())
    await db.playlists.insert_one(new_playlist)
    new_playlist.pop("_id", None)
    return new_playlist

# --- Display ---
@api_router.get("/display/{code}")
async def get_display_data(code: str):
    screen = await db.screens.find_one({"pairing_code": code}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Ecran non trouve")
    settings = await db.client_settings.find_one({"client_id": screen["client_id"]}, {"_id": 0})
    now = datetime.now(timezone.utc)
    current_day = now.weekday()  # 0=Monday, 6=Sunday
    current_month = now.month  # 1-12

    def playlist_matches_schedule(pl):
        pl_days = pl.get("schedule_days") or []
        pl_months = pl.get("schedule_months") or []
        pl_start = pl.get("schedule_start")
        pl_end = pl.get("schedule_end")
        has_schedule = bool(pl_days) or bool(pl_months) or pl_start or pl_end
        if not has_schedule:
            return True  # No schedule = always show
        if pl_start:
            try:
                if datetime.fromisoformat(pl_start) > now:
                    return False
            except Exception:
                pass
        if pl_end:
            try:
                if datetime.fromisoformat(pl_end) < now:
                    return False
            except Exception:
                pass
        day_match = not pl_days or current_day in pl_days
        month_match = not pl_months or current_month in pl_months
        return day_match and month_match

    # Load default assigned playlist, but respect its schedule
    playlist = None
    if screen.get("playlist_id"):
        default_pl = await db.playlists.find_one({"id": screen["playlist_id"]}, {"_id": 0})
        if default_pl and playlist_matches_schedule(default_pl):
            playlist = default_pl

    # Check ALL client playlists for a scheduled override
    client_playlists = await db.playlists.find({"client_id": screen["client_id"]}, {"_id": 0}).to_list(1000)
    for pl in client_playlists:
        if pl.get("id") == screen.get("playlist_id"):
            continue  # Skip default, already handled
        pl_days = pl.get("schedule_days") or []
        pl_months = pl.get("schedule_months") or []
        pl_start = pl.get("schedule_start")
        pl_end = pl.get("schedule_end")
        has_schedule = bool(pl_days) or bool(pl_months) or pl_start or pl_end
        if not has_schedule:
            continue
        if playlist_matches_schedule(pl) and pl.get("is_active", True):
            playlist = pl
            break
    flash_alert = await db.flash_alerts.find_one(
        {"client_id": screen["client_id"], "is_active": True}, {"_id": 0}
    )
    # Mark screen as online
    await db.screens.update_one(
        {"id": screen["id"]},
        {"$set": {"is_paired": True, "is_online": True, "last_heartbeat": datetime.now(timezone.utc).isoformat()}}
    )
    return {
        "screen": screen,
        "settings": settings,
        "playlist": playlist,
        "flash_alert": flash_alert
    }

# --- Weather ---
@api_router.get("/weather")
async def get_weather(city: str = "Paris"):
    if not OPENWEATHER_KEY:
        return {"error": "Cle API meteo non configuree", "temp": None}
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": city, "appid": OPENWEATHER_KEY, "units": "metric", "lang": "fr"},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return {
                "temp": round(data["main"]["temp"]),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "city": data["name"]
            }
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            return {"error": str(e), "temp": None}

@api_router.get("/weather/forecast")
async def get_weather_forecast(city: str = "Paris"):
    if not OPENWEATHER_KEY:
        return {"error": "Cle API meteo non configuree", "forecast": []}
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={"q": city, "appid": OPENWEATHER_KEY, "units": "metric", "lang": "fr", "cnt": 32},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            # Extract one forecast per day (noon) for next 3 days
            daily = {}
            for item in data.get("list", []):
                dt = datetime.fromisoformat(item["dt_txt"].replace(" ", "T"))
                day_key = dt.strftime("%Y-%m-%d")
                today_key = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                if day_key == today_key:
                    continue
                if day_key not in daily:
                    daily[day_key] = {
                        "date": day_key,
                        "day_name": dt.strftime("%A"),
                        "temp_min": item["main"]["temp_min"],
                        "temp_max": item["main"]["temp_max"],
                        "icon": item["weather"][0]["icon"],
                        "description": item["weather"][0]["description"],
                    }
                else:
                    daily[day_key]["temp_min"] = min(daily[day_key]["temp_min"], item["main"]["temp_min"])
                    daily[day_key]["temp_max"] = max(daily[day_key]["temp_max"], item["main"]["temp_max"])
                if len(daily) >= 3:
                    break
            return {"city": data.get("city", {}).get("name", city), "forecast": list(daily.values())[:3]}
        except Exception as e:
            logger.error(f"Forecast API error: {e}")
            return {"error": str(e), "forecast": []}

# --- RSS Feed ---
@api_router.get("/rss")
async def fetch_rss(url: str = ""):
    if not url:
        return {"items": []}
    import feedparser
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, timeout=15, follow_redirects=True)
            feed = feedparser.parse(response.text)
            items = [entry.get("title", "") for entry in feed.entries[:20] if entry.get("title")]
            return {"items": items}
        except Exception as e:
            logger.error(f"RSS fetch error: {e}")
            return {"items": [], "error": str(e)}

@api_router.post("/rss/batch")
async def fetch_rss_batch(data: Dict[str, Any]):
    urls = data.get("urls", [])
    if not urls:
        return {"items": []}
    import feedparser
    all_items = []
    async with httpx.AsyncClient() as http_client:
        for url in urls[:10]:
            try:
                response = await http_client.get(url, timeout=15, follow_redirects=True)
                feed = feedparser.parse(response.text)
                items = [entry.get("title", "") for entry in feed.entries[:10] if entry.get("title")]
                all_items.extend(items)
            except Exception as e:
                logger.error(f"RSS batch fetch error for {url}: {e}")
    return {"items": all_items}

# --- Flash Alert ---
@api_router.get("/flash-alerts")
async def list_flash_alerts(request: Request):
    user = await get_current_user(request)
    client_id = user["id"] if user["role"] == "client" else None
    if not client_id:
        raise HTTPException(status_code=400, detail="Acces non autorise")
    alerts = await db.flash_alerts.find({"client_id": client_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return alerts

@api_router.post("/flash-alert")
async def create_flash_alert(data: FlashAlertCreate, request: Request):
    user = await get_current_user(request)
    client_id = user["id"] if user["role"] == "client" else None
    if not client_id:
        raise HTTPException(status_code=400, detail="Seuls les clients peuvent envoyer des alertes")
    await db.flash_alerts.update_many({"client_id": client_id}, {"$set": {"is_active": False}})
    alert = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "message": data.message,
        "screen_ids": data.screen_ids,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.flash_alerts.insert_one(alert)
    alert.pop("_id", None)
    return alert

@api_router.delete("/flash-alert")
async def dismiss_flash_alert(request: Request):
    user = await get_current_user(request)
    client_id = user["id"] if user["role"] == "client" else None
    if not client_id:
        raise HTTPException(status_code=400, detail="Acces non autorise")
    await db.flash_alerts.update_many({"client_id": client_id}, {"$set": {"is_active": False}})
    return {"message": "Alerte desactivee"}

# --- Settings ---
@api_router.get("/settings")
async def get_settings(request: Request):
    user = await get_current_user(request)
    client_id = user["id"] if user["role"] == "client" else None
    if not client_id:
        raise HTTPException(status_code=400, detail="Acces reserve aux clients")
    settings = await db.client_settings.find_one({"client_id": client_id}, {"_id": 0})
    if not settings:
        settings = {
            "client_id": client_id, "logo_url": "", "primary_color": "#737373",
            "secondary_color": "#171717",
            "header_bg": "#0A0A0A", "footer_bg": "#171717", "content_bg": "#000000",
            "text_color": "#F5F5F5", "block_bg": "rgba(245,245,245,0.04)", "block_text_color": "#E5E5E5",
            "footer_text": "Bienvenue", "footer_rss_url": "",
            "rss_items": [], "ticker_speed": 30,
            "ticker_text_enabled": True, "ticker_rss_enabled": True,
            "time_font_size": 32, "date_font_size": 22, "weather_font_size": 32, "footer_font_size": 22,
            "header_height": 100, "footer_height": 50, "block_padding_v": 4, "block_padding_h": 14,
            "wysiwyg_size_small": 25, "wysiwyg_size_normal": 40, "wysiwyg_size_medium": 60,
            "wysiwyg_size_large": 75, "wysiwyg_size_xlarge": 90, "wysiwyg_size_huge": 130,
            "selected_theme_id": "onyx", "selected_animation_id": "none",
            "default_transition": "fade"
        }
        await db.client_settings.insert_one(settings)
        settings.pop("_id", None)
    return settings

@api_router.put("/settings")
async def update_settings(data: SettingsUpdate, request: Request):
    user = await get_current_user(request)
    client_id = user["id"] if user["role"] == "client" else None
    if not client_id:
        raise HTTPException(status_code=400, detail="Acces reserve aux clients")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.client_settings.update_one({"client_id": client_id}, {"$set": update_data}, upsert=True)
    settings = await db.client_settings.find_one({"client_id": client_id}, {"_id": 0})
    return settings

@api_router.post("/settings/logo")
async def upload_logo(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    if user["role"] != "client":
        raise HTTPException(status_code=400, detail="Acces reserve aux clients")
    file_ext = Path(file.filename).suffix
    filename = f"logo_{user['id']}{file_ext}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    logo_url = f"/api/uploads/{filename}"
    await db.client_settings.update_one(
        {"client_id": user["id"]}, {"$set": {"logo_url": logo_url}}, upsert=True
    )
    return {"logo_url": logo_url}

# --- Dashboard Stats ---
@api_router.get("/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    if user["role"] == "super_admin":
        return {
            "total_clients": await db.users.count_documents({"role": "client"}),
            "total_screens": await db.screens.count_documents({}),
            "online_screens": await db.screens.count_documents({"is_online": True}),
            "total_playlists": await db.playlists.count_documents({})
        }
    else:
        return {
            "total_screens": await db.screens.count_documents({"client_id": user["id"]}),
            "online_screens": await db.screens.count_documents({"client_id": user["id"], "is_online": True}),
            "total_media": await db.media.count_documents({"client_id": user["id"]}),
            "total_playlists": await db.playlists.count_documents({"client_id": user["id"]})
        }

# --- Ephemeris ---
SAINTS = {
    "01-01": "Marie", "01-02": "Basile", "01-03": "Genevieve", "01-04": "Odilon", "01-05": "Edouard",
    "01-06": "Melchior", "01-07": "Raymond", "01-08": "Lucien", "01-09": "Alix", "01-10": "Guillaume",
    "01-11": "Paulin", "01-12": "Tatiana", "01-13": "Yvette", "01-14": "Nina", "01-15": "Remi",
    "01-16": "Marcel", "01-17": "Roseline", "01-18": "Prisca", "01-19": "Marius", "01-20": "Sebastien",
    "01-21": "Agnes", "01-22": "Vincent", "01-23": "Barnard", "01-24": "Francois", "01-25": "Paul",
    "01-26": "Paule", "01-27": "Angele", "01-28": "Thomas", "01-29": "Gildas", "01-30": "Martine", "01-31": "Marcelle",
    "02-01": "Ella", "02-02": "Presentation", "02-03": "Blaise", "02-04": "Veronique", "02-05": "Agathe",
    "02-06": "Gaston", "02-07": "Eugenie", "02-08": "Jacqueline", "02-09": "Apolline", "02-10": "Arnaud",
    "02-11": "Notre-Dame", "02-12": "Felix", "02-13": "Beatrice", "02-14": "Valentin", "02-15": "Claude",
    "02-16": "Julienne", "02-17": "Alexis", "02-18": "Bernadette", "02-19": "Gabin", "02-20": "Aime",
    "02-21": "Damien", "02-22": "Isabelle", "02-23": "Lazare", "02-24": "Modeste", "02-25": "Romeo",
    "02-26": "Nestor", "02-27": "Honore", "02-28": "Romain", "02-29": "Auguste",
    "03-01": "Aubin", "03-02": "Charles", "03-03": "Guenole", "03-04": "Casimir", "03-05": "Olive",
    "03-06": "Colette", "03-07": "Felicite", "03-08": "Jean", "03-09": "Francoise", "03-10": "Vivien",
    "03-11": "Rosine", "03-12": "Justine", "03-13": "Rodrigue", "03-14": "Mathilde", "03-15": "Louise",
    "03-16": "Benedicte", "03-17": "Patrick", "03-18": "Cyrille", "03-19": "Joseph", "03-20": "Herbert",
    "03-21": "Clemence", "03-22": "Lea", "03-23": "Victorien", "03-24": "Catherine", "03-25": "Humbert",
    "03-26": "Larissa", "03-27": "Habib", "03-28": "Gontran", "03-29": "Gwladys", "03-30": "Amedee", "03-31": "Benjamin",
    "04-01": "Hugues", "04-02": "Sandrine", "04-03": "Richard", "04-04": "Isidore", "04-05": "Irene",
    "04-06": "Marcellin", "04-07": "Baptiste", "04-08": "Julie", "04-09": "Gautier", "04-10": "Fulbert",
    "04-11": "Stanislas", "04-12": "Jules", "04-13": "Ida", "04-14": "Maxime", "04-15": "Paterne",
    "04-16": "Benoit-Joseph", "04-17": "Anicet", "04-18": "Parfait", "04-19": "Emma", "04-20": "Odette",
    "04-21": "Anselme", "04-22": "Alexandre", "04-23": "Georges", "04-24": "Fidele", "04-25": "Marc",
    "04-26": "Alida", "04-27": "Zita", "04-28": "Valerie", "04-29": "Catherine", "04-30": "Robert",
    "05-01": "Fete du Travail", "05-02": "Boris", "05-03": "Philippe", "05-04": "Sylvain", "05-05": "Judith",
    "05-06": "Prudence", "05-07": "Gisele", "05-08": "Victoire 1945", "05-09": "Pacifique", "05-10": "Solange",
    "05-11": "Estelle", "05-12": "Achille", "05-13": "Rolande", "05-14": "Matthias", "05-15": "Denise",
    "05-16": "Honore", "05-17": "Pascal", "05-18": "Eric", "05-19": "Yves", "05-20": "Bernardin",
    "05-21": "Constantin", "05-22": "Emile", "05-23": "Didier", "05-24": "Donatien", "05-25": "Sophie",
    "05-26": "Berenger", "05-27": "Augustin", "05-28": "Germain", "05-29": "Aymar", "05-30": "Ferdinand", "05-31": "Visitation",
    "06-01": "Justin", "06-02": "Blandine", "06-03": "Kevin", "06-04": "Clotilde", "06-05": "Igor",
    "06-06": "Norbert", "06-07": "Gilbert", "06-08": "Medard", "06-09": "Diane", "06-10": "Landry",
    "06-11": "Barnabe", "06-12": "Guy", "06-13": "Antoine", "06-14": "Elisee", "06-15": "Germaine",
    "06-16": "Jean-Francois", "06-17": "Herve", "06-18": "Leonce", "06-19": "Romuald", "06-20": "Silvere",
    "06-21": "Rodolphe", "06-22": "Alban", "06-23": "Audrey", "06-24": "Jean-Baptiste", "06-25": "Prosper",
    "06-26": "Anthelme", "06-27": "Fernand", "06-28": "Irenee", "06-29": "Pierre-Paul", "06-30": "Martial",
    "07-01": "Thierry", "07-02": "Martinien", "07-03": "Thomas", "07-04": "Florent", "07-05": "Antoine",
    "07-06": "Mariette", "07-07": "Raoul", "07-08": "Thibaut", "07-09": "Amandine", "07-10": "Ulrich",
    "07-11": "Benoit", "07-12": "Olivier", "07-13": "Henri", "07-14": "Fete Nationale", "07-15": "Donald",
    "07-16": "Notre-Dame", "07-17": "Charlotte", "07-18": "Frederic", "07-19": "Arsene", "07-20": "Marina",
    "07-21": "Victor", "07-22": "Marie-Madeleine", "07-23": "Brigitte", "07-24": "Christine", "07-25": "Jacques",
    "07-26": "Anne-Joachim", "07-27": "Nathalie", "07-28": "Samson", "07-29": "Marthe", "07-30": "Juliette", "07-31": "Ignace",
    "08-01": "Alphonse", "08-02": "Julien", "08-03": "Lydie", "08-04": "Jean-Marie", "08-05": "Abel",
    "08-06": "Transfiguration", "08-07": "Gaetan", "08-08": "Dominique", "08-09": "Amour", "08-10": "Laurent",
    "08-11": "Claire", "08-12": "Clarisse", "08-13": "Hippolyte", "08-14": "Evrard", "08-15": "Assomption",
    "08-16": "Armel", "08-17": "Hyacinthe", "08-18": "Helene", "08-19": "Jean-Eudes", "08-20": "Bernard",
    "08-21": "Christophe", "08-22": "Fabrice", "08-23": "Rose", "08-24": "Barthelemy", "08-25": "Louis",
    "08-26": "Natacha", "08-27": "Monique", "08-28": "Augustin", "08-29": "Sabine", "08-30": "Fiacre", "08-31": "Aristide",
    "09-01": "Gilles", "09-02": "Ingrid", "09-03": "Gregoire", "09-04": "Rosalie", "09-05": "Raissa",
    "09-06": "Bertrand", "09-07": "Reine", "09-08": "Nativite", "09-09": "Alain", "09-10": "Ines",
    "09-11": "Adelphe", "09-12": "Apollinaire", "09-13": "Aime", "09-14": "Croix Glorieuse", "09-15": "Roland",
    "09-16": "Edith", "09-17": "Renaud", "09-18": "Nadege", "09-19": "Emilie", "09-20": "Davy",
    "09-21": "Matthieu", "09-22": "Maurice", "09-23": "Constance", "09-24": "Thecle", "09-25": "Hermann",
    "09-26": "Come-Damien", "09-27": "Vincent", "09-28": "Venceslas", "09-29": "Michel", "09-30": "Jerome",
    "10-01": "Therese", "10-02": "Leodegar", "10-03": "Gerard", "10-04": "Francois", "10-05": "Fleur",
    "10-06": "Bruno", "10-07": "Serge", "10-08": "Pelagie", "10-09": "Denis", "10-10": "Ghislain",
    "10-11": "Firmin", "10-12": "Wilfrid", "10-13": "Gerald", "10-14": "Juste", "10-15": "Therese",
    "10-16": "Edwige", "10-17": "Baudouin", "10-18": "Luc", "10-19": "Rene", "10-20": "Adeline",
    "10-21": "Celine", "10-22": "Elodie", "10-23": "Jean", "10-24": "Florentin", "10-25": "Crepin",
    "10-26": "Dimitri", "10-27": "Emeline", "10-28": "Simon-Jude", "10-29": "Narcisse", "10-30": "Bienvenu", "10-31": "Quentin",
    "11-01": "Toussaint", "11-02": "Defunts", "11-03": "Hubert", "11-04": "Charles", "11-05": "Sylvie",
    "11-06": "Bertille", "11-07": "Carine", "11-08": "Geoffrey", "11-09": "Theodore", "11-10": "Leon",
    "11-11": "Armistice", "11-12": "Christian", "11-13": "Brice", "11-14": "Sidoine", "11-15": "Albert",
    "11-16": "Marguerite", "11-17": "Elisabeth", "11-18": "Aude", "11-19": "Tanguy", "11-20": "Edmond",
    "11-21": "Presentation", "11-22": "Cecile", "11-23": "Clement", "11-24": "Flora", "11-25": "Catherine",
    "11-26": "Delphine", "11-27": "Sevrin", "11-28": "Jacques", "11-29": "Saturnin", "11-30": "Andre",
    "12-01": "Florence", "12-02": "Viviane", "12-03": "Xavier", "12-04": "Barbara", "12-05": "Gerald",
    "12-06": "Nicolas", "12-07": "Ambroise", "12-08": "Immaculee", "12-09": "Pierre", "12-10": "Romaric",
    "12-11": "Daniel", "12-12": "Jeanne", "12-13": "Lucie", "12-14": "Odile", "12-15": "Ninon",
    "12-16": "Alice", "12-17": "Gaelle", "12-18": "Gatien", "12-19": "Urbain", "12-20": "Abraham",
    "12-21": "Pierre", "12-22": "Francoise", "12-23": "Armand", "12-24": "Adele", "12-25": "Noel",
    "12-26": "Etienne", "12-27": "Jean", "12-28": "Innocents", "12-29": "David", "12-30": "Roger", "12-31": "Sylvestre",
}

@api_router.get("/ephemeris")
async def get_ephemeris():
    now = datetime.now(timezone.utc)
    key = now.strftime("%m-%d")
    saint = SAINTS.get(key, "")
    return {"date": now.isoformat(), "saint": saint, "day_key": key}

# --- Serve uploaded files ---
@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouve")
    return FileResponse(file_path)

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup():
    existing = await db.users.find_one({"role": "super_admin"})
    if not existing:
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@intensiti.com",
            "password_hash": hash_password("admin123"),
            "role": "super_admin",
            "company_name": "Intensiti",
            "max_screens": 0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
        logger.info("Super admin cree: admin@intensiti.com / admin123")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.screens.create_index("id", unique=True)
    await db.screens.create_index("pairing_code")
    await db.screens.create_index("client_id")
    await db.media.create_index("id", unique=True)
    await db.media.create_index("client_id")
    await db.playlists.create_index("id", unique=True)
    await db.playlists.create_index("client_id")
    logger.info("Intensiti backend demarre")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
