import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    # Test with your new connection string
    uri = "mongodb+srv://quanbot_admin:YOUR_NEW_PASSWORD@quanbot.o5w3ca1.mongodb.net/zalo_bot_manager?retryWrites=true&w=majority"
    
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Test database access
        db = client['zalo_bot_manager']
        await db.users.create_index("username", unique=True)
        print("✅ Database access successful!")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
