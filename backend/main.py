from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from typing import Dict, Any

app = FastAPI(title="Sticker Roulette Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Временное хранилище раундов (в проде — Redis/PostgreSQL)
rounds: Dict[str, Dict[str, Any]] = {}

class AddSticker(BaseModel):
    round_id: str
    user_id: int
    username: str
    sticker: str
    price: float

@app.post("/api/new")
async def new_round():
    round_id = str(random.randint(10000, 99999))
    rounds[round_id] = {"players": {}, "total": 0.0}
    return {"round_id": round_id}

@app.post("/api/add")
async def add_sticker(data: AddSticker):
    if data.round_id not in rounds:
        raise HTTPException(status_code=404, detail="Round not found")
    
    r = rounds[data.round_id]
    uid = str(data.user_id)
    if uid not in r["players"]:
        r["players"][uid] = {"weight": 0.0, "username": data.username, "sticker": data.sticker}
    
    r["players"][uid]["weight"] += data.price
    r["total"] += data.price
    
    return {"players": r["players"], "total": r["total"]}

@app.post("/api/spin")
async def spin(data: dict):
    round_id = data.get("round_id")
    if round_id not in rounds:
        raise HTTPException(status_code=404, detail="Round not found")
    
    r = rounds[round_id]
    if len(r["players"]) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 players")
    
    player_ids = list(r["players"].keys())
    weights = [r["players"][pid]["weight"] for pid in player_ids]
    winner_index = random.choices(range(len(weights)), weights=weights, k=1)[0]
    
    del rounds[round_id]  # Завершаем раунд
    
    return {"winner_index": winner_index}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
