from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import asyncio


class Database:
    """Singleton holder for AsyncIOMotorClient.

    Use `get_client()` / `get_database()` to obtain the shared client/database.
    This lazily initializes the client on first use and avoids creating a new
    connection for every request.
    """
    client: Optional[AsyncIOMotorClient] = None


db = Database()


def get_client() -> AsyncIOMotorClient:
    """Return the shared AsyncIOMotorClient, creating it if needed."""
    if db.client is None:
        # Build client kwargs from settings to enforce short timeouts so the
        # app fails fast when the network or Atlas is unresponsive.
        client_kwargs = {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 2000,
            "socketTimeoutMS": 20000,
            "maxPoolSize": 10,
            "retryWrites": True,
            "w": "majority"
        }
        
        # Override with settings if available
        if getattr(settings, "mongodb_server_selection_timeout_ms", None) is not None:
            client_kwargs["serverSelectionTimeoutMS"] = settings.mongodb_server_selection_timeout_ms
        if getattr(settings, "mongodb_connect_timeout_ms", None) is not None:
            client_kwargs["connectTimeoutMS"] = settings.mongodb_connect_timeout_ms
        if getattr(settings, "mongodb_socket_timeout_ms", None) is not None:
            client_kwargs["socketTimeoutMS"] = settings.mongodb_socket_timeout_ms
        if getattr(settings, "mongodb_max_pool_size", None) is not None:
            client_kwargs["maxPoolSize"] = settings.mongodb_max_pool_size

        try:
            db.client = AsyncIOMotorClient(settings.mongo_uri, **client_kwargs)
            print(f"Connected to MongoDB at {settings.mongo_uri} (timeouts: {client_kwargs})")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
            
    return db.client


async def get_database():
    """Return the configured database instance (async-compatible)."""
    try:
        client = get_client()
        # Test connection
        await client.admin.command('ping')
        return client[settings.database_name]
    except Exception as e:
        print(f"Failed to get database: {e}")
        raise


async def connect_to_mongo():
    """Explicit connect helper (idempotent)."""
    try:
        get_client()
        # Test connection
        client = get_client()
        await client.admin.command('ping')
        print("MongoDB connection successful")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        raise


async def close_mongo_connection():
    """Close the shared client if it exists."""
    if db.client is not None:
        try:
            db.client.close()
            print("Closed MongoDB connection")
        finally:
            db.client = None
