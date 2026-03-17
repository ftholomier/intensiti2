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
    footer_text: Optional[str] = None
    footer_rss_url: Optional[str] = None

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
        "header_bg": "#1E293B",
        "footer_bg": "#1E293B",
        "text_color": "#FFFFFF",
        "footer_text": "Bienvenue",
        "footer_rss_url": ""
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
            "header_bg": "#1E293B",
            "footer_bg": "#1E293B",
            "text_color": "#FFFFFF",
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
    if screen:
        alert = await db.flash_alerts.find_one(
            {"client_id": screen["client_id"], "is_active": True}, {"_id": 0}
        )
    return {"status": "ok", "flash_alert": alert}

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

# --- Display ---
@api_router.get("/display/{code}")
async def get_display_data(code: str):
    screen = await db.screens.find_one({"pairing_code": code}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Ecran non trouve")
    settings = await db.client_settings.find_one({"client_id": screen["client_id"]}, {"_id": 0})
    playlist = None
    if screen.get("playlist_id"):
        playlist = await db.playlists.find_one({"id": screen["playlist_id"]}, {"_id": 0})
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

# --- Flash Alert ---
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
            "client_id": client_id, "logo_url": "", "primary_color": "#4F46E5",
            "secondary_color": "#F1F5F9", "header_bg": "#1E293B", "footer_bg": "#1E293B",
            "text_color": "#FFFFFF", "footer_text": "Bienvenue", "footer_rss_url": ""
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
