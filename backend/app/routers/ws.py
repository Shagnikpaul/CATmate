"""WebSocket router for live manager dashboard updates."""
import json
import asyncio
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, data: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws/manager")
async def websocket_manager_endpoint(websocket: WebSocket):
    """
    WebSocket channel for live manager grid updates.
    Broadcasts live telemetry, task progress, and safety alerts.
    """
    await manager.connect(websocket)
    try:
        # Send initial connected message
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to CatMate live manager stream"
        })
        while True:
            # Keep connection open and accept client messages/ping
            data = await websocket.receive_text()
            # Echo or acknowledge
            await websocket.send_json({"type": "pong", "payload": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    WebSocket channel for live machine telemetry streaming.
    """
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "telemetry_stream_ready",
            "message": "Subscribed to live telemetry stream"
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
