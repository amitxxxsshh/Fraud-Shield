import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/risk-events")
async def websocket_risk_events(websocket: WebSocket):
    """
    Real-Time WebSocket channel broadcasting risk scores, incoming vishing alerts,
    SMS scam evaluations, and live transaction risk assessments to connected frontends.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Receive client ping or keepalive
            data = await websocket.receive_text()
            # Respond to ping
            if data == "ping":
                await websocket.send_text('{"event": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)
