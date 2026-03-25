# routers/websocket.py — Real-time WebSocket for live dashboard updates

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter(tags=["WebSocket"])

# Connection manager — stores active connections per device_id
class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, device_id: str, ws: WebSocket):
        await ws.accept()
        if device_id not in self.connections:
            self.connections[device_id] = []
        self.connections[device_id].append(ws)

    def disconnect(self, device_id: str, ws: WebSocket):
        if device_id in self.connections:
            self.connections[device_id].remove(ws)
            if not self.connections[device_id]:
                del self.connections[device_id]

    async def broadcast(self, device_id: str, message: dict):
        """Send message to all connections of a device."""
        if device_id in self.connections:
            dead = []
            for ws in self.connections[device_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.connections[device_id].remove(ws)

    async def broadcast_all(self, message: dict):
        """Send to all connected users — for leaderboard updates."""
        for device_id in list(self.connections.keys()):
            await self.broadcast(device_id, message)


manager = ConnectionManager()


@router.websocket("/ws/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    """
    Real-time connection per user.
    Frontend connects once; receives live updates when data changes.
    """
    await manager.connect(device_id, websocket)
    try:
        await websocket.send_json({"type": "connected", "device_id": device_id, "message": "Real-time connection established"})
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Echo back with server timestamp
                import datetime
                await websocket.send_json({"type": "ack", "received": msg, "server_time": datetime.datetime.utcnow().isoformat()})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(device_id, websocket)


# Helper function — call this from other routers to push updates
async def notify_user(device_id: str, event_type: str, data: dict):
    await manager.broadcast(device_id, {"type": event_type, "data": data})
